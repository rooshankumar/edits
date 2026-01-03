import { useState, useCallback, useRef } from 'react';
import { VideoProject, CANVAS_SIZES, ExportQuality, ExportFormat } from '@/types/video-project';
import { computeTimeline, computeScrollState, calculateScrollPosition, calculateRelativeFontSize, calculateTransitionOpacity } from '@/utils/timeline';
import { getScaledTextSettings } from '@/utils/textScaling';
import { parseKaraokeLrc, findActiveKaraokeLineIndex, findKaraokeWordProgress, scaleKaraokeLrc, detectKaraokeStanzaBreaks } from '@/utils/karaokeLrc';

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
      const mimeType = format === 'webm' ? 'video/webm;codecs=vp9' : 'video/webm;codecs=vp8';
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

      // Render animation in real-time
      const startTime = performance.now();
      let lastFrameTime = 0;
      const frameDuration = 1000 / fps;

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

        const elapsed = (performance.now() - startTime) / 1000;
        const audioElapsed = (audioContext && audioStartAt != null)
          ? Math.max(0, audioContext.currentTime - audioStartAt)
          : null;
        const currentTimeSec = Math.min(audioElapsed ?? elapsed, totalDurationSec);
        
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

        if (!scrollState.isEnding) {
          if (project.theme === 'lyrics') {
            ctx.save();
            ctx.globalAlpha = transitionOpacity.contentOpacity;
            ctx.fillStyle = project.text.color;
            ctx.textAlign = project.text.textAlign;
            ctx.textBaseline = 'middle';

            // Base layer shadow: subtle, always on
            ctx.shadowColor = 'rgba(0,0,0,0.55)';
            ctx.shadowBlur = 18;
            ctx.shadowOffsetY = 6;

            const karaokeLrc = karaokeLrcStatic;
            const stanzaBreaks = stanzaBreaksStatic;
            const lyricLines = lyricLinesStatic;
            const totalLines = totalLinesStatic;
            const lineDurations = lineDurationsStatic;
            const lineStarts = lineStartsStatic;

            let lineIndex = 0;
            if (karaokeLrc) {
              lineIndex = findActiveKaraokeLineIndex(karaokeLrc.lines, currentTimeSec + project.lyrics.lrcOffsetSeconds);
            } else {
              const tGlobal = Math.min(Math.max(0, currentTimeSec), safeContentDurationStatic - 0.000001);
              for (let i = totalLines - 1; i >= 0; i--) {
                if (tGlobal >= lineStarts[i]) { lineIndex = i; break; }
              }
            }

            const getStanzaBounds = () => {
              if (project.lyrics.displayMode === 'lines') return { start: lineIndex, end: lineIndex };

              if (project.lyrics.displayMode === 'full') return { start: 0, end: lyricLines.length - 1 };

              if (project.lyrics.timingSource === 'lrc' && stanzaBreaks.length > 0) {
                let start = 0;
                for (const b of stanzaBreaks) {
                  if (b <= lineIndex) start = b;
                  else break;
                }
                let end = lyricLines.length - 1;
                for (const b of stanzaBreaks) {
                  if (b > lineIndex) { end = b - 1; break; }
                }
                return { start, end };
              }

              if (project.lyrics.timingSource === 'lrc' && karaokeLrc) {
                const gapBreakSeconds = 1.25;
                let start = lineIndex;
                while (start > 0) {
                  const prev = karaokeLrc.lines[start - 1];
                  const curr = karaokeLrc.lines[start];
                  if (!prev || !curr) break;
                  const gap = curr.start - prev.end;
                  if (gap > gapBreakSeconds) break;
                  start--;
                }

                let end = lineIndex;
                while (end < karaokeLrc.lines.length - 1) {
                  const curr = karaokeLrc.lines[end];
                  const next = karaokeLrc.lines[end + 1];
                  if (!curr || !next) break;
                  const gap = next.start - curr.end;
                  if (gap > gapBreakSeconds) break;
                  end++;
                }

                return { start, end };
              }

              let start = lineIndex;
              while (start > 0 && (lyricLines[start - 1] ?? '').trim().length > 0) start--;
              let end = lineIndex;
              while (end < lyricLines.length - 1 && (lyricLines[end + 1] ?? '').trim().length > 0) end++;
              return { start, end };
            };

            const { start, end } = getStanzaBounds();
            const stanza = lyricLines.slice(start, end + 1);

            const prev = project.lyrics.displayMode === 'lines' ? (lyricLines[lineIndex - 1] ?? '') : '';
            const curr = lyricLines[lineIndex] ?? '';
            const next = project.lyrics.displayMode === 'lines' ? (lyricLines[lineIndex + 1] ?? '') : '';

            const karaokeText = (curr || project.text.content || '').toString();

            const fullFit = project.lyrics.displayMode === 'full'
              ? Math.max(0.55, Math.min(1, 12 / Math.max(12, stanza.length)))
              : 1;

            const currFont = Math.round(scaledFontSize * ((project.lyrics.displayMode === 'paragraph' || project.lyrics.displayMode === 'pages') ? 1.15 : (project.lyrics.displayMode === 'full' ? 0.92 * fullFit : 1.25)));
            const sideFont = Math.round(scaledFontSize * 0.7);
            const gap = Math.round(currFont * 1.05);
            const containerWidth = (width * project.text.containerWidth) / 100;
            let x = width / 2;
            if (project.text.textAlign === 'left') x = (width - containerWidth) / 2 + scaledPaddingX;
            if (project.text.textAlign === 'right') x = (width + containerWidth) / 2 - scaledPaddingX;

            const safeHeight = Math.max(0, height - scaledPaddingY * 2);
            const centerY = scaledPaddingY + safeHeight / 2;

            const activeLineY = (() => {
              if (project.lyrics.displayMode !== 'paragraph' && project.lyrics.displayMode !== 'pages' && project.lyrics.displayMode !== 'full') return centerY;
              const count = stanza.length;
              const baseFont = Math.round(scaledFontSize * (project.lyrics.displayMode === 'full' ? 0.92 * fullFit : 0.9));
              const lineGap = Math.round(Math.max(0, (scaledSettings.lineHeight - 1) * baseFont));
              const blockHeight = (count - 1) * lineGap;
              const topY = centerY - blockHeight / 2;
              const activeIdx = Math.max(0, Math.min(count - 1, lineIndex - start));
              return topY + activeIdx * lineGap;
            })();

            const fontPrefix = `${project.text.isItalic ? 'italic ' : ''}${project.text.isBold ? 'bold ' : ''}`;

            if (project.lyrics.displayMode === 'lines') {
              // Prev
              ctx.save();
              ctx.globalAlpha = transitionOpacity.contentOpacity * 0.35;
              ctx.font = `${fontPrefix}${sideFont}px ${project.text.fontFamily}`;
              ctx.fillText(prev, x, centerY - gap);
              ctx.restore();

              // Current base text (always fully visible)
              ctx.save();
              ctx.globalAlpha = transitionOpacity.contentOpacity;
              ctx.font = `${fontPrefix}${currFont}px ${project.text.fontFamily}`;
              ctx.fillText(karaokeText, x, centerY);
              ctx.restore();
            } else {
              const count = stanza.length;
              const baseFont = Math.round(scaledFontSize * (project.lyrics.displayMode === 'full' ? 0.92 * fullFit : 0.9));
              const lineGap = Math.round(Math.max(0, (scaledSettings.lineHeight - 1) * baseFont));
              const blockHeight = (count - 1) * lineGap;
              const topY = centerY - blockHeight / 2;

              for (let i = 0; i < count; i++) {
                const isActive = start + i === lineIndex;
                const y = topY + i * lineGap;
                const activeScale = project.lyrics.displayMode === 'pages' ? 1.2 : project.lyrics.displayMode === 'full' ? 1.15 : 1.15;
                const font = isActive ? Math.round(baseFont * activeScale) : baseFont;
                ctx.save();
                ctx.globalAlpha = transitionOpacity.contentOpacity * (isActive ? 1 : 0.35);
                ctx.font = `${fontPrefix}${font}px ${project.text.fontFamily}`;

                // Fit long lines into the configured container width by scaling horizontally
                const text = (stanza[i] ?? '').toString();
                const measured = ctx.measureText(text).width;
                const fitX = measured > 0 ? Math.min(1, containerWidth / measured) : 1;
                ctx.save();
                ctx.translate(x, y);
                ctx.scale(fitX, 1);
                ctx.fillText(text, 0, 0);
                ctx.restore();

                ctx.restore();
              }
            }

            // Karaoke overlay: clipped duplicate layer with stronger/darker glow sweeping left->right
            if (project.text.waveAnimation) {
              ctx.save();

              const activeFont = project.lyrics.displayMode === 'lines'
                ? currFont
                : (() => {
                  const baseFont = Math.round(scaledFontSize * (project.lyrics.displayMode === 'full' ? 0.92 * fullFit : 0.9));
                  const activeScale = project.lyrics.displayMode === 'pages' ? 1.2 : project.lyrics.displayMode === 'full' ? 1.15 : 1.15;
                  return Math.round(baseFont * activeScale);
                })();

              ctx.font = `${fontPrefix}${activeFont}px ${project.text.fontFamily}`;

              let fullWidth = 0;
              let clipWidth = 0;

              if (karaokeLrc) {
                const line = karaokeLrc.lines[lineIndex];
                if (line) {
                  const t = currentTimeSec + project.lyrics.lrcOffsetSeconds + project.lyrics.highlightLeadSeconds;
                  const { wordIndex, within } = findKaraokeWordProgress(line, t);
                  const tokens = (line.words.length > 0 ? line.words.map((w) => w.text) : [line.text]).map((s) => s);
                  const widths = tokens.map((tok) => ctx.measureText(tok).width);
                  fullWidth = widths.reduce((a, b) => a + b, 0);
                  const idx = Math.max(0, Math.min(wordIndex, widths.length - 1));
                  let startX = 0;
                  for (let i = 0; i < idx; i++) startX += widths[i];
                  clipWidth = startX + within * widths[idx];
                }
              } else {
                const lineDuration = lineDurations[lineIndex] ?? 0;
                const lineStartTime = lineStarts[lineIndex] ?? 0;
                const timeInLine = Math.max(0, Math.min(lineDuration, currentTimeSec - lineStartTime));

                const words = karaokeText.trim().length > 0 ? karaokeText.trim().split(/\s+/).filter(Boolean) : [];
                const wordCount = Math.max(1, words.length);
                const wordDuration = lineDuration / wordCount;
                const lead = Math.max(0, Math.min(wordDuration, project.lyrics.highlightLeadSeconds));
                const effectiveTime = Math.max(0, Math.min(lineDuration, timeInLine + lead));

                const wordIndex = Math.min(wordCount - 1, Math.floor(effectiveTime / wordDuration));
                const within = Math.max(0, Math.min(1, (effectiveTime - wordIndex * wordDuration) / wordDuration));

                const spaceWidth = ctx.measureText(' ').width;
                const widths = words.map((w) => ctx.measureText(w).width);
                widths.forEach((w, i) => {
                  fullWidth += w;
                  if (i < widths.length - 1) fullWidth += spaceWidth;
                });

                if (words.length > 0) {
                  let startX = 0;
                  for (let i = 0; i < wordIndex; i++) startX += widths[i] + spaceWidth;
                  const endX = startX + widths[wordIndex] + (wordIndex < widths.length - 1 ? spaceWidth : 0);
                  clipWidth = startX + within * (endX - startX);
                } else {
                  clipWidth = 0;
                }
              }

              const fitScaleX = fullWidth > 0 ? Math.min(1, containerWidth / fullWidth) : 1;
              const fullWidthScaled = fullWidth * fitScaleX;
              const clipWidthScaled = clipWidth * fitScaleX;

              const leftX = project.text.textAlign === 'center'
                ? x - fullWidthScaled / 2
                : project.text.textAlign === 'right'
                  ? x - fullWidthScaled
                  : x;

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

              ctx.save();
              ctx.globalAlpha = transitionOpacity.contentOpacity * project.lyrics.highlightIntensity;
              ctx.shadowColor = 'rgba(0,0,0,0.85)';
              ctx.shadowBlur = 26;
              ctx.shadowOffsetY = 8;

              const y = activeLineY;

              // Colored highlight background behind the revealed portion
              const bgAlpha = Math.min(1, 0.12 + project.lyrics.highlightIntensity * 0.45);
              const bgY = y - activeFont * 0.82;
              const bgH = activeFont * 1.64;
              const w = Math.max(0, clipWidthScaled);
              ctx.save();
              ctx.shadowColor = 'transparent';
              ctx.shadowBlur = 0;
              ctx.shadowOffsetY = 0;
              ctx.fillStyle = `rgba(${highlightRgb.r}, ${highlightRgb.g}, ${highlightRgb.b}, ${bgAlpha})`;
              if ((ctx as any).roundRect) {
                ctx.beginPath();
                (ctx as any).roundRect(leftX, bgY, w, bgH, 12);
                ctx.fill();
              } else {
                ctx.fillRect(leftX, bgY, w, bgH);
              }
              ctx.restore();

              ctx.beginPath();
              ctx.rect(leftX, y - activeFont, Math.max(0, clipWidthScaled), activeFont * 2);
              ctx.clip();

              ctx.save();
              ctx.translate(x, y);
              ctx.scale(fitScaleX, 1);
              ctx.fillText(karaokeText, 0, 0);
              ctx.restore();
              ctx.restore();
              ctx.restore();
            }

            if (project.lyrics.displayMode === 'lines') {
              // Next
              ctx.save();
              ctx.globalAlpha = transitionOpacity.contentOpacity * 0.35;
              ctx.font = `${fontPrefix}${sideFont}px ${project.text.fontFamily}`;
              ctx.fillText(next, x, centerY + gap);
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
            
            // Apply letter spacing if needed
            if (scaledSettings.letterSpacing !== 0) {
              ctx.letterSpacing = `${scaledSettings.letterSpacing}px`;
            }

            const containerWidth = (width * project.text.containerWidth) / 100;

            let textX = width / 2;
            if (project.text.textAlign === 'left') textX = (width - containerWidth) / 2 + scaledPaddingX;
            if (project.text.textAlign === 'right') textX = (width + containerWidth) / 2 - scaledPaddingX;

            // Use unified scroll calculation - MATCHES PREVIEW EXACTLY
            const scrollY = calculateScrollPosition(scrollState.progress, height, totalTextHeight);

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
        const progress = Math.round((currentTimeSec / totalDurationSec) * 100);
        setExportState(prev => ({ ...prev, progress }));

        // Continue rendering if not done
        if (currentTimeSec < totalDurationSec) {
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
      const extension = format === 'mp4' ? 'mp4' : 'webm';
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
