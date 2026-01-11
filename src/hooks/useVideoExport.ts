import { useState, useCallback, useRef } from 'react';
import { VideoProject, CANVAS_SIZES, ExportQuality, ExportFormat } from '@/types/video-project';
import { computeTimeline, computeScrollState, calculateScrollPosition, calculateRelativeFontSize, calculateTransitionOpacity } from '@/utils/timeline';
import { getScaledTextSettings } from '@/utils/textScaling';
import { parseKaraokeLrc, findActiveKaraokeLineIndex, findKaraokeWordProgress, scaleKaraokeLrc, detectKaraokeStanzaBreaks, getKaraokePageInfo, getEstimatedWordProgress } from '@/utils/karaokeLrc';

interface ExportState {
  isExporting: boolean;
  progress: number;
  error: string | null;
}

const QUALITY_SETTINGS: Record<ExportQuality, { bitrate: number; fps: number }> = {
  standard: { bitrate: 8000000, fps: 30 },
  hd: { bitrate: 12000000, fps: 30 },
  ultra: { bitrate: 20000000, fps: 60 },
};

const EXPORT_RESOLUTION_LOCK: Record<string, { width: number; height: number }> = {
  'vertical': { width: 1080, height: 1920 },
  'square': { width: 1080, height: 1080 },
  'horizontal': { width: 1920, height: 1080 },
  'tiktok': { width: 1080, height: 1920 },
  'youtube-shorts': { width: 1080, height: 1920 },
  'instagram-post': { width: 1080, height: 1350 },
  'twitter': { width: 1280, height: 720 },
  'facebook-cover': { width: 820, height: 312 },
};

export function useVideoExport() {
  const [exportState, setExportState] = useState<ExportState>({ isExporting: false, progress: 0, error: null });
  const abortRef = useRef(false);

  const exportVideo = useCallback(async (
    project: VideoProject, 
    _previewRef: HTMLDivElement, 
    quality: ExportQuality = 'hd',
    format: ExportFormat = 'mp4'
  ) => {
    abortRef.current = false;
    setExportState({ isExporting: true, progress: 0, error: null });

    try {
      const resolution = EXPORT_RESOLUTION_LOCK[project.canvasFormat] || CANVAS_SIZES[project.canvasFormat];
      const { width, height } = resolution;
      const { bitrate, fps } = QUALITY_SETTINGS[quality];

      // We'll compute the final timeline after we know audio duration (if present).

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;

      // Setup audio if present
      let audioContext: AudioContext | null = null;
      let audioBuffer: AudioBuffer | null = null;
      let audioDestination: MediaStreamAudioDestinationNode | null = null;
      let audioStartAt: number | null = null;
      
      if (project.audio.file) {
        try {
          audioContext = new AudioContext();
          const audioResponse = await fetch(project.audio.file);
          const audioArrayBuffer = await audioResponse.arrayBuffer();
          audioBuffer = await audioContext.decodeAudioData(audioArrayBuffer);
          audioDestination = audioContext.createMediaStreamDestination();
        } catch (e) {
          console.warn('Failed to load audio for export:', e);
        }
      }

      const audioDurationSec = audioBuffer?.duration ?? null;

      // Use unified timeline engine - SINGLE SOURCE OF TRUTH
      const timelineBase = computeTimeline(
        project.text.content,
        project.animation.wpmPreset,
        project.animation.wpmPreset === 'custom' ? project.animation.duration : null,
        project.ending.enabled,
        project.ending.duration
      );

      // If we're auto-fitting LRC to audio, content duration should follow the audio duration
      // so the frame timing matches the stretched LRC timestamps.
      const timeline = (project.theme === 'lyrics'
        && project.lyrics.timingSource === 'lrc'
        && project.lyrics.autoFitLrcToAudio
        && audioDurationSec
        && audioDurationSec > 0)
        ? {
          ...timelineBase,
          contentDuration: audioDurationSec,
          totalDuration: audioDurationSec + (timelineBase.endingDuration ?? 0),
        }
        : timelineBase;

      const totalDurationSec = timeline.totalDuration;

      // Preload images
      let bgImage: HTMLImageElement | null = null;
      let watermarkImage: HTMLImageElement | null = null;
      let endingLogo: HTMLImageElement | null = null;
      let endingQR: HTMLImageElement | null = null;

      const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(img);
        img.src = src;
      });

      if (project.background.image) bgImage = await loadImage(project.background.image);
      if (project.watermark.enabled && project.watermark.image) watermarkImage = await loadImage(project.watermark.image);
      if (project.ending.enabled && project.ending.showLogo && project.ending.logo) endingLogo = await loadImage(project.ending.logo);
      if (project.ending.enabled && project.ending.showQR && project.ending.qrCode) endingQR = await loadImage(project.ending.qrCode);

      const karaokeLrcForScaling = (project.theme === 'lyrics' && project.lyrics.timingSource === 'lrc' && project.lyrics.karaokeLrc.trim().length > 0)
        ? parseKaraokeLrc(project.lyrics.karaokeLrc)
        : null;

      // Calculate word count for auto-scaling
      const wordCount = ((karaokeLrcForScaling?.plainText ?? project.text.content) || '').split(/\s+/).filter(w => w.length > 0).length;
      
      // Get scaled settings based on content length
      const scaledSettings = getScaledTextSettings(
        project.text.fontSize,
        project.text.lineHeight,
        project.text.letterSpacing,
        project.text.paddingX,
        project.text.paddingY,
        wordCount,
        project.text.autoScaleFont
      );
      
      // Calculate relative font size for export resolution
      const scaledFontSize = calculateRelativeFontSize(scaledSettings.fontSize, height);
      const scaledPaddingX = Math.round((scaledSettings.paddingX / 1920) * height);
      const scaledPaddingY = Math.round((scaledSettings.paddingY / 1920) * height);

      // Enforce a minimum horizontal safe-area padding (~1cm on typical mobile DPI)
      const minSafePaddingX = 75;
      const effectivePaddingX = Math.max(scaledPaddingX, minSafePaddingX);
      
      // Calculate text metrics for scrolling
      ctx.font = `${project.text.isItalic ? 'italic ' : ''}${project.text.isBold ? 'bold ' : ''}${scaledFontSize}px ${project.text.fontFamily}`;
      const lines = project.text.content.split('\n');
      const lineHeight = scaledFontSize * scaledSettings.lineHeight;
      const totalTextHeight = lines.length * lineHeight + scaledPaddingY * 2;

      // Create video stream
      const videoStream = canvas.captureStream(fps);
      
      // Combine audio and video streams
      let combinedStream: MediaStream;
      if (audioDestination) {
        combinedStream = new MediaStream([
          ...videoStream.getVideoTracks(),
          ...audioDestination.stream.getAudioTracks()
        ]);
        
        // Start audio playback
        if (audioContext && audioBuffer) {
          audioStartAt = audioContext.currentTime + 0.05;
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.loop = project.audio.loop;
          
          const gainNode = audioContext.createGain();
          gainNode.gain.value = project.audio.volume / 100;
          
          source.connect(gainNode);
          gainNode.connect(audioDestination);
          source.start(audioStartAt);
          
          const fadeLead = 0.5;
          const fadeStartAt = audioStartAt + Math.max(0, timeline.totalDuration - fadeLead);
          const fadeEndAt = audioStartAt + timeline.totalDuration;
          gainNode.gain.setValueAtTime(project.audio.volume / 100, fadeStartAt);
          gainNode.gain.linearRampToValueAtTime(0, fadeEndAt);
        }
      } else {
        combinedStream = videoStream;
      }

      // Use MediaRecorder for fast export
      const pickMimeType = (): string => {
        if (format === 'mp4') {
          const mp4Candidates = [
            'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
            'video/mp4;codecs=avc1,mp4a',
            'video/mp4',
          ];
          for (const c of mp4Candidates) {
            if ((window as any).MediaRecorder?.isTypeSupported?.(c)) return c;
          }
        }

        const webmCandidates = format === 'webm'
          ? ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
          : ['video/webm;codecs=vp8,opus', 'video/webm'];

        for (const c of webmCandidates) {
          if ((window as any).MediaRecorder?.isTypeSupported?.(c)) return c;
        }

        return 'video/webm';
      };

      const mimeType = pickMimeType();
      const mediaRecorder = new MediaRecorder(combinedStream, { 
        mimeType, 
        videoBitsPerSecond: bitrate,
        audioBitsPerSecond: 192000,
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      const recordingPromise = new Promise<Blob>((resolve, reject) => {
        mediaRecorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
        mediaRecorder.onerror = (e) => reject(e);
      });

      mediaRecorder.start(250);

      // Render animation deterministically in a requestAnimationFrame loop.
      // We stop recording when we reach the planned end time (or audio end time),
      // instead of trusting a fixed frame count (MediaRecorder can overshoot).
      let frameIndex = 0;
      const totalFrames = Math.max(1, Math.ceil(totalDurationSec * fps));

      const karaokeLrcRawStatic = (project.lyrics.timingSource === 'lrc' && project.lyrics.karaokeLrc.trim().length > 0)
        ? parseKaraokeLrc(project.lyrics.karaokeLrc)
        : null;

      const karaokeLrcStatic = (karaokeLrcRawStatic && project.lyrics.autoFitLrcToAudio && audioDurationSec && audioDurationSec > 0 && karaokeLrcRawStatic.duration > 0)
        ? scaleKaraokeLrc(karaokeLrcRawStatic, audioDurationSec / karaokeLrcRawStatic.duration)
        : karaokeLrcRawStatic;

      const stanzaBreaksStatic = (project.lyrics.timingSource === 'lrc' && project.lyrics.karaokeLrc.trim().length > 0)
        ? detectKaraokeStanzaBreaks(project.lyrics.karaokeLrc)
        : [];

      const lyricLinesStatic = karaokeLrcStatic
        ? karaokeLrcStatic.lines.map((l) => l.text)
        : (project.text.content || '').split('\n');

      const totalLinesStatic = Math.max(1, lyricLinesStatic.length);

      const safeContentDurationStatic = Math.max(0.000001, timeline.contentDuration);
      const lineDurationsStatic = new Array<number>(totalLinesStatic).fill(0);
      const lineStartsStatic = new Array<number>(totalLinesStatic).fill(0);

      if (karaokeLrcStatic) {
        for (let i = 0; i < karaokeLrcStatic.lines.length; i++) {
          lineDurationsStatic[i] = Math.max(0, karaokeLrcStatic.lines[i].end - karaokeLrcStatic.lines[i].start);
          lineStartsStatic[i] = karaokeLrcStatic.lines[i].start;
        }
      } else {
        if (project.lyrics.pacingSource === 'chars') {
          const cps = Math.max(1, project.lyrics.charsPerSecond);
          const minLine = Math.max(0.2, project.lyrics.minLineDuration);
          for (let i = 0; i < totalLinesStatic; i++) {
            const normalized = (lyricLinesStatic[i] ?? '').replace(/\s+/g, ' ').trim();
            const chars = normalized.length;
            lineDurationsStatic[i] = Math.max(minLine, chars > 0 ? chars / cps : minLine);
          }
        } else {
          const d = safeContentDurationStatic / totalLinesStatic;
          for (let i = 0; i < totalLinesStatic; i++) lineDurationsStatic[i] = d;
        }

        let total = lineDurationsStatic.reduce((a, b) => a + b, 0);
        if (total > 0) {
          const scale = safeContentDurationStatic / total;
          for (let i = 0; i < totalLinesStatic; i++) lineDurationsStatic[i] *= scale;
        }

        let acc = 0;
        for (let i = 0; i < totalLinesStatic; i++) {
          lineStartsStatic[i] = acc;
          acc += lineDurationsStatic[i];
        }
      }
      
      const renderFrame = () => {
        if (abortRef.current) { 
          mediaRecorder.stop();
          if (audioContext) audioContext.close();
          throw new Error('Export cancelled'); 
        }

        // Deterministic frame time (smooth export). When audio is available, prefer audio clock
        // but never allow time to go backwards.
        const plannedTime = Math.min(totalDurationSec, frameIndex / fps);
        const audioElapsed = (audioContext && audioStartAt != null)
          ? Math.max(0, audioContext.currentTime - audioStartAt)
          : null;
        const currentTimeSec = Math.min(totalDurationSec, Math.max(plannedTime, audioElapsed ?? 0));
        
        // Use unified scroll state calculation - MATCHES PREVIEW EXACTLY
        const scrollState = computeScrollState(
          currentTimeSec,
          timeline.contentDuration,
          project.ending.enabled
        );

        // Background
        ctx.fillStyle = project.background.color;
        ctx.fillRect(0, 0, width, height);

        if (bgImage?.complete && bgImage.naturalWidth > 0) {
          ctx.save();
          ctx.globalAlpha = project.background.opacity / 100;
          if (project.background.blur > 0) ctx.filter = `blur(${project.background.blur}px)`;
          const scale = Math.max(width / bgImage.width, height / bgImage.height);
          const x = (width - bgImage.width * scale) / 2;
          const y = (height - bgImage.height * scale) / 2;
          ctx.drawImage(bgImage, x, y, bgImage.width * scale, bgImage.height * scale);
          ctx.restore();
        }

        // Calculate transition opacity for smooth fade
        const transitionOpacity = calculateTransitionOpacity(currentTimeSec, timeline.contentDuration, project.ending.enabled);

        // Title Overlay - centered at top (during content only)
        if (!scrollState.isEnding && project.titleOverlay?.enabled) {
          const titleText = project.titleOverlay.useProjectName
            ? (project.name || '')
            : (project.titleOverlay.content || '');

          if (titleText.trim().length > 0) {
            ctx.save();
            ctx.globalAlpha = transitionOpacity.contentOpacity;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            // Background bar (optional)
            if (project.titleOverlay.backgroundColor && project.titleOverlay.backgroundColor !== 'rgba(0,0,0,0)') {
              ctx.fillStyle = project.titleOverlay.backgroundColor;
              const boxH = project.titleOverlay.fontSize + 12;
              const topY = project.titleOverlay.paddingY;
              ctx.fillRect(0, topY - 6, width, boxH);
            }

            ctx.fillStyle = project.titleOverlay.color;
            const titleFontPrefix = `${project.titleOverlay.isItalic ? 'italic ' : ''}${project.titleOverlay.isBold ? 'bold ' : ''}`;
            ctx.font = `${titleFontPrefix}${project.titleOverlay.fontSize}px ${project.titleOverlay.fontFamily || project.text.fontFamily}`;
            ctx.fillText(titleText, width / 2, project.titleOverlay.paddingY);
            ctx.restore();
          }
        }

        if (!scrollState.isEnding) {
          if (project.theme === 'lyrics') {
            ctx.save();
            const lyricsOpacity = Math.max(0, Math.min(1, project.lyrics.textOpacity ?? 1));
            const dimOpacity = Math.max(0, Math.min(1, project.lyrics.unhighlightedOpacity ?? 0.4));
            ctx.globalAlpha = transitionOpacity.contentOpacity * lyricsOpacity;
            const invertColor = (color: string): string => {
              const raw = (color || '').trim();
              const hex = raw.startsWith('#') ? raw.slice(1) : raw;
              const full = hex.length === 3
                ? `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`
                : hex;
              if (!/^[0-9a-fA-F]{6}$/.test(full)) return '#000000';
              const r = 255 - parseInt(full.slice(0, 2), 16);
              const g = 255 - parseInt(full.slice(2, 4), 16);
              const b = 255 - parseInt(full.slice(4, 6), 16);
              return `rgb(${r}, ${g}, ${b})`;
            };

            const highlightTextColor = project.lyrics.invertHighlightTextColor
              ? invertColor(project.text.color)
              : project.text.color;

            ctx.fillStyle = project.text.color;
            ctx.textAlign = project.text.textAlign;
            ctx.textBaseline = 'middle';

            // Base layer shadow
            ctx.shadowColor = 'rgba(0,0,0,0.55)';
            ctx.shadowBlur = 18;
            ctx.shadowOffsetY = 6;

            const karaokeLrc = karaokeLrcStatic;
            const lyricLines = lyricLinesStatic;
            const totalLines = totalLinesStatic;
            const lineDurations = lineDurationsStatic;
            const lineStarts = lineStartsStatic;

            // Get active line index
            let lineIndex = 0;
            if (karaokeLrc) {
              lineIndex = findActiveKaraokeLineIndex(karaokeLrc.lines, currentTimeSec + project.lyrics.lrcOffsetSeconds);
            } else {
              const tGlobal = Math.min(Math.max(0, currentTimeSec), safeContentDurationStatic - 0.000001);
              for (let i = totalLines - 1; i >= 0; i--) {
                if (tGlobal >= lineStarts[i]) { lineIndex = i; break; }
              }
            }

            // Get page info for pages mode
            const pageInfo = getKaraokePageInfo(totalLines, lineIndex, project.lyrics.linesPerPage);

            // Get word progress for highlighting
            let wordProgress = { wordIndex: 0, within: 0, highlightedWords: [] as number[] };
            if (karaokeLrc) {
              const line = karaokeLrc.lines[lineIndex];
              if (line) {
                const t = currentTimeSec + project.lyrics.lrcOffsetSeconds + project.lyrics.highlightLeadSeconds;
                const { wordIndex, within } = findKaraokeWordProgress(line, t);
                const highlightedWords: number[] = [];
                for (let i = 0; i <= wordIndex; i++) highlightedWords.push(i);
                wordProgress = { wordIndex, within, highlightedWords };
              }
            } else {
              const lineStartTime = lineStarts[lineIndex] ?? 0;
              const lineDuration = lineDurations[lineIndex] ?? 0;
              const timeInLine = Math.max(0, currentTimeSec - lineStartTime);
              const lineText = lyricLines[lineIndex] ?? '';
              wordProgress = getEstimatedWordProgress(lineText, lineDuration, timeInLine, project.lyrics.highlightLeadSeconds);
            }

            // Determine which lines to display based on mode
            let displayLines: { text: string; originalIndex: number }[] = [];
            
            if (project.lyrics.displayMode === 'pages') {
              for (let i = pageInfo.pageStart; i <= pageInfo.pageEnd; i++) {
                displayLines.push({ text: lyricLines[i] ?? '', originalIndex: i });
              }
            } else if (project.lyrics.displayMode === 'full') {
              displayLines = lyricLines.map((line, i) => ({ text: line, originalIndex: i }));
            } else {
              // Lines mode
              displayLines = [
                { text: lyricLines[lineIndex - 1] ?? '', originalIndex: lineIndex - 1 },
                { text: lyricLines[lineIndex] ?? '', originalIndex: lineIndex },
                { text: lyricLines[lineIndex + 1] ?? '', originalIndex: lineIndex + 1 },
              ];
            }

            const fontPrefix = `${project.text.isItalic ? 'italic ' : ''}${project.text.isBold ? 'bold ' : ''}`;
            const containerWidth = (width * project.text.containerWidth) / 100;
            let x = width / 2;
            if (project.text.textAlign === 'left') x = (width - containerWidth) / 2 + effectivePaddingX;
            if (project.text.textAlign === 'right') x = (width + containerWidth) / 2 - effectivePaddingX;

            const safeHeight = Math.max(0, height - scaledPaddingY * 2);
            const centerY = scaledPaddingY + safeHeight / 2;

            // Parse highlight color
            const highlightRgb = (() => {
              const raw = (project.lyrics.highlightBgColor || '#FFD60A').trim();
              const hex = raw.startsWith('#') ? raw.slice(1) : raw;
              const full = hex.length === 3
                ? `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`
                : hex;
              const r = parseInt(full.slice(0, 2), 16);
              const g = parseInt(full.slice(2, 4), 16);
              const b = parseInt(full.slice(4, 6), 16);
              if (![r, g, b].every(Number.isFinite)) return { r: 255, g: 214, b: 10 };
              return { r, g, b };
            })();

            const highlightBgOpacity = Math.min(1, 0.12 + project.lyrics.highlightIntensity * 0.45);

            // Calculate font sizes
            const baseFontSize = scaledFontSize * 0.9;
            const activeFontSize = baseFontSize * 1.2;
            const sideFont = scaledFontSize * 0.7;

            if (project.lyrics.displayMode === 'lines') {
              // Lines mode: prev / current / next
              const gap = Math.round(activeFontSize * 1.05);
              
              // Prev line
              if (displayLines[0]?.text) {
                ctx.save();
                ctx.globalAlpha = transitionOpacity.contentOpacity * lyricsOpacity * dimOpacity;
                ctx.font = `${fontPrefix}${sideFont}px ${project.text.fontFamily}`;
                ctx.fillStyle = project.text.color;
                ctx.fillText(displayLines[0].text, x, centerY - gap);
                ctx.restore();
              }

              // Current line - base text
              const currText = displayLines[1]?.text || '';
              ctx.save();
              ctx.globalAlpha = transitionOpacity.contentOpacity * lyricsOpacity;
              ctx.font = `${fontPrefix}${activeFontSize * 1.04}px ${project.text.fontFamily}`;
              ctx.fillStyle = highlightTextColor;
              ctx.fillText(currText, x, centerY);
              ctx.restore();

              // Render word-level highlight for current line
              if (project.text.waveAnimation && currText.trim().length > 0) {
                ctx.save();
                const words = karaokeLrc?.lines[lineIndex]?.words.length 
                  ? karaokeLrc.lines[lineIndex].words.map(w => w.text)
                  : currText.trim().split(/\s+/).filter(Boolean);

                const wordWidths = words.map(w => ctx.measureText(w).width);
                const spaceWidth = ctx.measureText(' ').width;
                const wordGap = 4;
                let totalWidth = wordWidths.reduce((a, b) => a + b, 0) + (spaceWidth + wordGap) * (words.length - 1);
                
                // Calculate clip width
                let clipWidth = 0;
                for (let i = 0; i < wordProgress.wordIndex; i++) {
                  clipWidth += wordWidths[i] + spaceWidth + wordGap;
                }
                clipWidth += wordProgress.within * wordWidths[wordProgress.wordIndex];

                const leftX = project.text.textAlign === 'center'
                  ? x - totalWidth / 2
                  : project.text.textAlign === 'right'
                    ? x - totalWidth
                    : x;

                // Draw highlight background
                const bgY = centerY - activeFontSize * 0.5;
                const bgH = activeFontSize * 1.2;
                ctx.save();
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.fillStyle = `rgba(${highlightRgb.r}, ${highlightRgb.g}, ${highlightRgb.b}, ${highlightBgOpacity})`;
                if ((ctx as any).roundRect) {
                  ctx.beginPath();
                  (ctx as any).roundRect(leftX, bgY, clipWidth, bgH, 8);
                  ctx.fill();
                } else {
                  ctx.fillRect(leftX, bgY, clipWidth, bgH);
                }
                ctx.restore();
                ctx.restore();
              }

              // Next line
              if (displayLines[2]?.text) {
                ctx.save();
                ctx.globalAlpha = transitionOpacity.contentOpacity * lyricsOpacity * dimOpacity;
                ctx.font = `${fontPrefix}${sideFont}px ${project.text.fontFamily}`;
                ctx.fillStyle = project.text.color;
                ctx.fillText(displayLines[2].text, x, centerY + gap);
                ctx.restore();
              }
            } else {
              // Pages or Full mode
              const lineGap = Math.round(baseFontSize * scaledSettings.lineHeight);
              const totalBlockHeight = (displayLines.length - 1) * lineGap;
              const topY = centerY - totalBlockHeight / 2;

              displayLines.forEach((line, i) => {
                const isActive = line.originalIndex === lineIndex;
                const fontSize = isActive ? activeFontSize : baseFontSize;
                const y = topY + i * lineGap;

                ctx.save();
                ctx.globalAlpha = transitionOpacity.contentOpacity * lyricsOpacity * (isActive ? 1 : dimOpacity);
                ctx.font = `${fontPrefix}${fontSize}px ${project.text.fontFamily}`;
                ctx.fillStyle = isActive ? highlightTextColor : project.text.color;
                ctx.fillText(line.text, x, y);
                ctx.restore();

                // Draw highlight for active line
                if (isActive && project.text.waveAnimation && line.text.trim().length > 0) {
                  ctx.save();
                  ctx.font = `${fontPrefix}${fontSize}px ${project.text.fontFamily}`;
                  
                  const words = karaokeLrc?.lines[lineIndex]?.words.length 
                    ? karaokeLrc.lines[lineIndex].words.map(w => w.text)
                    : line.text.trim().split(/\s+/).filter(Boolean);

                  const wordWidths = words.map(w => ctx.measureText(w).width);
                  const spaceWidth = ctx.measureText(' ').width;
                  const wordGap = 4;
                  let totalWidth = wordWidths.reduce((a, b) => a + b, 0) + (spaceWidth + wordGap) * (words.length - 1);
                  
                  let clipWidth = 0;
                  for (let j = 0; j < wordProgress.wordIndex; j++) {
                    clipWidth += wordWidths[j] + spaceWidth + wordGap;
                  }
                  clipWidth += wordProgress.within * (wordWidths[wordProgress.wordIndex] || 0);

                  const leftX = project.text.textAlign === 'center'
                    ? x - totalWidth / 2
                    : project.text.textAlign === 'right'
                      ? x - totalWidth
                      : x;

                  // Draw highlight background
                  const bgY = y - fontSize * 0.5;
                  const bgH = fontSize * 1.2;
                  ctx.save();
                  ctx.shadowColor = 'transparent';
                  ctx.shadowBlur = 0;
                  ctx.fillStyle = `rgba(${highlightRgb.r}, ${highlightRgb.g}, ${highlightRgb.b}, ${highlightBgOpacity})`;
                  if ((ctx as any).roundRect) {
                    ctx.beginPath();
                    (ctx as any).roundRect(leftX, bgY, clipWidth, bgH, 8);
                    ctx.fill();
                  } else {
                    ctx.fillRect(leftX, bgY, clipWidth, bgH);
                  }
                  ctx.restore();
                  ctx.restore();
                }
              });
            }

            // Draw progress bar if enabled
            if (project.lyrics.showProgressBar) {
              const progress = Math.min(1, Math.max(0, currentTimeSec / safeContentDurationStatic));
              const barWidth = width * 0.5;
              const barHeight = 4;
              const barX = (width - barWidth) / 2;
              const barY = height - scaledPaddingY - barHeight;

              // Background
              ctx.save();
              ctx.globalAlpha = transitionOpacity.contentOpacity * 0.3;
              ctx.fillStyle = 'rgba(255,255,255,0.2)';
              if ((ctx as any).roundRect) {
                ctx.beginPath();
                (ctx as any).roundRect(barX, barY, barWidth, barHeight, 2);
                ctx.fill();
              } else {
                ctx.fillRect(barX, barY, barWidth, barHeight);
              }

              // Progress
              ctx.globalAlpha = transitionOpacity.contentOpacity * 0.8;
              ctx.fillStyle = `rgba(${highlightRgb.r}, ${highlightRgb.g}, ${highlightRgb.b}, 0.8)`;
              if ((ctx as any).roundRect) {
                ctx.beginPath();
                (ctx as any).roundRect(barX, barY, barWidth * progress, barHeight, 2);
                ctx.fill();
              } else {
                ctx.fillRect(barX, barY, barWidth * progress, barHeight);
              }
              ctx.restore();
            }

            ctx.restore();
          } else {
            // Draw scrolling text with wave animation and transition
            ctx.save();
            ctx.globalAlpha = transitionOpacity.contentOpacity;
            ctx.fillStyle = project.text.color;
            ctx.font = `${project.text.isItalic ? 'italic ' : ''}${project.text.isBold ? 'bold ' : ''}${scaledFontSize}px ${project.text.fontFamily}`;
            ctx.textAlign = project.text.textAlign;
            
            // Apply letter spacing if supported
            if ((ctx as any).letterSpacing !== undefined && scaledSettings.letterSpacing !== 0) {
              (ctx as any).letterSpacing = `${scaledSettings.letterSpacing}px`;
            }

            const containerWidth = (width * project.text.containerWidth) / 100;

            let textX = width / 2;
            if (project.text.textAlign === 'left') textX = (width - containerWidth) / 2 + effectivePaddingX;
            if (project.text.textAlign === 'right') textX = (width + containerWidth) / 2 - effectivePaddingX;

            // Use unified scroll calculation - MATCHES PREVIEW EXACTLY
            let scrollY = calculateScrollPosition(scrollState.progress, height, totalTextHeight);

            // Reserve space below title overlay so text never overlaps it
            const titleTextForOffset = project.titleOverlay?.enabled
              ? (project.titleOverlay.useProjectName ? (project.name || '') : (project.titleOverlay.content || ''))
              : '';
            const titleOffsetY = (project.titleOverlay?.enabled && titleTextForOffset.trim().length > 0)
              ? Math.round(project.titleOverlay.paddingY + (project.titleOverlay.fontSize + 12) + 12)
              : 0;
            scrollY += titleOffsetY;

            // For non-scrolling directions, honor vertical alignment preference
            if (project.animation.direction !== 'up') {
              const safeHeight = height;
              const blockH = totalTextHeight;
              if (project.text.verticalAlign === 'top') scrollY = 0;
              else if (project.text.verticalAlign === 'bottom') scrollY = Math.max(0, safeHeight - blockH);
              else scrollY = Math.max(0, (safeHeight - blockH) / 2);
              scrollY += titleOffsetY;
            }

            // Wave animation support
            if (project.text.waveAnimation) {
              const totalChars = project.text.content.length;
              const charsPerSecond = totalChars / timeline.contentDuration;
              const visibleChars = Math.floor(currentTimeSec * charsPerSecond);
              
              let charIndex = 0;
              lines.forEach((line, i) => {
                const y = scrollY + scaledPaddingY + i * lineHeight + lineHeight;
                if (y > -lineHeight && y < height + lineHeight) {
                  // Draw each character with wave opacity
                  const chars = line.split('');
                  let currentX = textX;
                  
                  // Adjust starting X based on alignment
                  if (project.text.textAlign === 'center') {
                    const lineWidth = ctx.measureText(line).width;
                    currentX = textX - lineWidth / 2;
                  } else if (project.text.textAlign === 'right') {
                    const lineWidth = ctx.measureText(line).width;
                    currentX = textX - lineWidth;
                  }
                  
                  chars.forEach((char) => {
                    const charWidth = ctx.measureText(char).width;
                    
                    // Calculate wave opacity for this character
                    let charOpacity = 1;
                    if (charIndex > visibleChars) {
                      charOpacity = 0;
                    } else if (charIndex === visibleChars) {
                      const charProgress = (currentTimeSec * charsPerSecond) - visibleChars;
                      charOpacity = charProgress;
                    }
                    
                    ctx.save();
                    ctx.globalAlpha = transitionOpacity.contentOpacity * charOpacity;
                    ctx.fillText(char, currentX, y);
                    ctx.restore();
                    
                    currentX += charWidth;
                    charIndex++;
                  });
                  charIndex++; // Account for newline
                }
              });
            } else {
              // No wave animation - draw normally
              lines.forEach((line, i) => {
                const y = scrollY + scaledPaddingY + i * lineHeight + lineHeight;
                if (y > -lineHeight && y < height + lineHeight) {
                  ctx.fillText(line, textX, y);
                }
              });
            }
            ctx.restore();
          }
        } else {
          // Draw ending card with transition
          ctx.save();
          ctx.globalAlpha = transitionOpacity.endingOpacity;
          ctx.textAlign = 'center';
          ctx.fillStyle = project.text.color;
          
          let yPos = height / 2 - 50;
          
          if (endingLogo?.complete && endingLogo.naturalWidth > 0 && project.ending.showLogo) {
            const logoAspect = endingLogo.width / endingLogo.height;
            const logoW = project.ending.logoSize;
            const logoH = logoW / logoAspect;
            ctx.drawImage(endingLogo, (width - logoW) / 2, yPos - logoH, logoW, logoH);
            yPos += logoH + 20;
          }

          ctx.font = `bold ${project.ending.ctaFontSize}px ${project.text.fontFamily}`;
          ctx.fillText(project.ending.ctaText, width / 2, yPos + 30);

          if (endingQR?.complete && endingQR.naturalWidth > 0 && project.ending.showQR) {
            const qrSize = project.ending.qrSize;
            ctx.drawImage(endingQR, (width - qrSize) / 2, yPos + 60, qrSize, qrSize);
          }
          ctx.restore();
        }

        // Overlay text - Only show during content, not ending
        if (!scrollState.isEnding && project.overlay.enabled && project.overlay.content) {
          ctx.fillStyle = project.overlay.backgroundColor;
          const overlayH = project.overlay.fontSize + 20;
          const overlayY = project.overlay.position === 'top' ? 0 : height - overlayH;
          ctx.fillRect(0, overlayY, width, overlayH);
          ctx.fillStyle = project.overlay.color;
          ctx.font = `${project.overlay.fontSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(project.overlay.content, width / 2, overlayY + overlayH / 2 + project.overlay.fontSize / 3);
        }

        // Watermark - Only show during content, not ending
        if (!scrollState.isEnding && watermarkImage?.complete && watermarkImage.naturalWidth > 0 && project.watermark.enabled) {
          ctx.save();
          ctx.globalAlpha = project.watermark.opacity / 100;
          const wmSize = project.watermark.size;
          const wmAspect = watermarkImage.width / watermarkImage.height;
          const wmW = wmSize;
          const wmH = wmSize / wmAspect;
          const p = project.watermark.padding;
          let wmX = p, wmY = p;
          if (project.watermark.position.includes('right')) wmX = width - wmW - p;
          if (project.watermark.position.includes('bottom')) wmY = height - wmH - p;
          ctx.drawImage(watermarkImage, wmX, wmY, wmW, wmH);
          ctx.restore();
        }

        // Update progress
        const progress = Math.round((currentTimeSec / Math.max(0.000001, totalDurationSec)) * 100);
        setExportState(prev => ({ ...prev, progress }));

        // Continue rendering if not done
        frameIndex++;
        // If audio is present, let it be authoritative for deciding when we are done.
        const shouldStop = (audioElapsed != null)
          ? audioElapsed >= totalDurationSec
          : plannedTime >= totalDurationSec;

        if (!shouldStop && frameIndex <= totalFrames + 2) {
          // Keep UI responsive but render deterministically
          requestAnimationFrame(renderFrame);
        } else {
          // Stop recording
          mediaRecorder.stop();
          if (audioContext) audioContext.close();
        }
      };

      // Start rendering
      requestAnimationFrame(renderFrame);
      
      const blob = await recordingPromise;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = mimeType.includes('video/mp4') ? 'mp4' : 'webm';
      a.download = `${project.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportState({ isExporting: false, progress: 100, error: null });
    } catch (error) {
      setExportState({ isExporting: false, progress: 0, error: error instanceof Error ? error.message : 'Export failed' });
    }
  }, []);

  const cancelExport = useCallback(() => { abortRef.current = true; }, []);

  return { exportState, exportVideo, cancelExport };
}
