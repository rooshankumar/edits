import { useEffect, useMemo, useRef } from 'react';
import { VideoProject, CANVAS_SIZES } from '@/types/video-project';
import { KaraokeLrc, findActiveKaraokeLineIndex, findKaraokeWordProgress, getEstimatedWordProgress, getKaraokePageInfo } from '@/utils/karaokeLrc';

interface KaraokeLyricsCanvasProps {
  project: VideoProject;
  currentTime: number;
  contentDuration: number;
  karaokeLrc: KaraokeLrc | null;
  lyricLines: string[];
  lyricsTiming: { lineDurations: number[]; lineStarts: number[]; totalLines: number; totalDuration: number };
  scaledFontSize: number;
  scaledPaddingX: number;
  scaledPaddingY: number;
  scaledLineHeight: number;
  transitionOpacity: number;
  scaleFactor: number;
}

export function KaraokeLyricsCanvas(props: KaraokeLyricsCanvasProps) {
  const { project, currentTime, contentDuration, karaokeLrc, lyricLines, lyricsTiming, scaledFontSize, scaledPaddingX, scaledPaddingY, scaledLineHeight, transitionOpacity, scaleFactor } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasSize = CANVAS_SIZES[project.canvasFormat];

  const computed = useMemo(() => {
    const width = Math.round(canvasSize.width * scaleFactor);
    const height = Math.round(canvasSize.height * scaleFactor);
    const fontPrefix = `${project.text.isItalic ? 'italic ' : ''}${project.text.isBold ? 'bold ' : ''}`;

    let lineIndex = 0;
    if (project.lyrics.timingSource === 'lrc' && karaokeLrc) {
      lineIndex = findActiveKaraokeLineIndex(karaokeLrc.lines, currentTime + project.lyrics.lrcOffsetSeconds);
    } else {
      const totalLines = lyricsTiming.totalLines;
      const totalDur = Math.max(0.000001, lyricsTiming.totalDuration || contentDuration || 0.000001);
      const t = Math.min(Math.max(0, currentTime), totalDur - 0.000001);
      for (let i = totalLines - 1; i >= 0; i--) {
        if (t >= (lyricsTiming.lineStarts[i] ?? 0)) { lineIndex = i; break; }
      }
    }

    const totalLines = Math.max(1, lyricLines.length);
    const pageInfo = getKaraokePageInfo(totalLines, lineIndex, project.lyrics.linesPerPage);

    let wordProgress = { wordIndex: 0, within: 0, highlightedWords: [] as number[] };
    if (project.lyrics.timingSource === 'lrc' && karaokeLrc) {
      const line = karaokeLrc.lines[lineIndex];
      if (line) {
        const t = currentTime + project.lyrics.lrcOffsetSeconds + project.lyrics.highlightLeadSeconds;
        const { wordIndex, within } = findKaraokeWordProgress(line, t);
        const highlightedWords: number[] = [];
        for (let i = 0; i <= wordIndex; i++) highlightedWords.push(i);
        wordProgress = { wordIndex, within, highlightedWords };
      }
    } else {
      const lineStartTime = lyricsTiming.lineStarts[lineIndex] ?? 0;
      const lineDuration = lyricsTiming.lineDurations[lineIndex] ?? 0;
      const timeInLine = Math.max(0, currentTime - lineStartTime);
      const lineText = lyricLines[lineIndex] ?? '';
      wordProgress = getEstimatedWordProgress(lineText, lineDuration, timeInLine, project.lyrics.highlightLeadSeconds);
    }

    let displayLines: { text: string; originalIndex: number }[] = [];
    if (project.lyrics.displayMode === 'pages') {
      for (let i = pageInfo.pageStart; i <= pageInfo.pageEnd; i++) displayLines.push({ text: lyricLines[i] ?? '', originalIndex: i });
    } else if (project.lyrics.displayMode === 'full') {
      displayLines = lyricLines.map((t, i) => ({ text: t ?? '', originalIndex: i }));
    } else {
      displayLines = [
        { text: lyricLines[lineIndex - 1] ?? '', originalIndex: lineIndex - 1 },
        { text: lyricLines[lineIndex] ?? '', originalIndex: lineIndex },
        { text: lyricLines[lineIndex + 1] ?? '', originalIndex: lineIndex + 1 },
      ];
    }

    const raw = (project.lyrics.highlightBgColor || '#FFD60A').trim();
    const hex = raw.startsWith('#') ? raw.slice(1) : raw;
    const full = hex.length === 3 ? `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}` : hex;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    const highlightRgb = (![r, g, b].every(Number.isFinite)) ? { r: 255, g: 214, b: 10 } : { r, g, b };

    const highlightBgOpacity = Math.min(1, 0.12 + project.lyrics.highlightIntensity * 0.45);
    const lyricsOpacity = Math.max(0, Math.min(1, project.lyrics.textOpacity ?? 1));
    const dimOpacity = Math.max(0, Math.min(1, project.lyrics.unhighlightedOpacity ?? 0.4));

    const containerWidth = (width * project.text.containerWidth) / 100;
    let x = width / 2;
    if (project.text.textAlign === 'left') x = (width - containerWidth) / 2 + scaledPaddingX;
    if (project.text.textAlign === 'right') x = (width + containerWidth) / 2 - scaledPaddingX;

    const safeHeight = Math.max(0, height - scaledPaddingY * 2);
    const centerY = scaledPaddingY + safeHeight / 2;

    const baseFontSize = scaledFontSize * 0.9;
    const activeFontSize = baseFontSize * 1.2;
    const sideFont = scaledFontSize * 0.7;

    return { width, height, fontPrefix, x, centerY, baseFontSize, activeFontSize, sideFont, highlightRgb, highlightBgOpacity, lyricsOpacity, dimOpacity, lineIndex, wordProgress, displayLines };
  }, [canvasSize.height, canvasSize.width, contentDuration, currentTime, karaokeLrc, lyricLines, lyricsTiming.lineDurations, lyricsTiming.lineStarts, lyricsTiming.totalDuration, lyricsTiming.totalLines, project.canvasFormat, project.lyrics.displayMode, project.lyrics.highlightBgColor, project.lyrics.highlightIntensity, project.lyrics.highlightLeadSeconds, project.lyrics.linesPerPage, project.lyrics.lrcOffsetSeconds, project.lyrics.textOpacity, project.lyrics.timingSource, project.lyrics.unhighlightedOpacity, project.text.containerWidth, project.text.fontFamily, project.text.isBold, project.text.isItalic, project.text.textAlign, project.text.waveAnimation, scaleFactor, scaledFontSize, scaledPaddingX, scaledPaddingY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    canvas.width = Math.max(1, Math.round(computed.width * dpr));
    canvas.height = Math.max(1, Math.round(computed.height * dpr));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Keep drawing coordinates in CSS pixels
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Avoid blurry text due to half-pixel positions
    const px = (v: number) => Math.round(v);

    ctx.clearRect(0, 0, computed.width, computed.height);

    // If webfonts aren't loaded yet, Canvas metrics can change mid-playback
    // causing the text to look cramped/odd. Redraw once fonts are ready.
    const fontFamily = project.text.fontFamily;
    const waitForFonts = async () => {
      const fontSizeProbe = Math.max(12, Math.round(computed.baseFontSize));
      const fontSpec = `${computed.fontPrefix}${fontSizeProbe}px ${fontFamily}`;
      if (typeof document !== 'undefined' && (document as any).fonts?.load) {
        try {
          await (document as any).fonts.load(fontSpec);
        } catch {
          // ignore
        }
      }
    };

    let cancelled = false;
    (async () => {
      await waitForFonts();
      if (cancelled) return;

      ctx.clearRect(0, 0, computed.width, computed.height);

      ctx.save();
      ctx.globalAlpha = transitionOpacity * computed.lyricsOpacity;
      ctx.fillStyle = project.text.color;
      ctx.textAlign = project.text.textAlign;
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;

    const wordGap = 4;

      if (project.lyrics.displayMode === 'lines') {
      const gap = Math.round(computed.activeFontSize * 1.05);
      if (computed.displayLines[0]?.text) {
        ctx.save();
        ctx.globalAlpha = transitionOpacity * computed.lyricsOpacity * computed.dimOpacity;
        ctx.font = `${computed.fontPrefix}${computed.sideFont}px ${project.text.fontFamily}`;
        ctx.fillText(computed.displayLines[0].text, px(computed.x), px(computed.centerY - gap));
        ctx.restore();
      }

      const currText = computed.displayLines[1]?.text || '';
      ctx.save();
      ctx.globalAlpha = transitionOpacity * computed.lyricsOpacity;
      ctx.font = `${computed.fontPrefix}${computed.activeFontSize * 1.04}px ${project.text.fontFamily}`;
      ctx.fillText(currText, px(computed.x), px(computed.centerY));
      ctx.restore();

      if (project.text.waveAnimation && currText.trim().length > 0) {
        ctx.save();
        ctx.font = `${computed.fontPrefix}${computed.activeFontSize * 1.04}px ${project.text.fontFamily}`;

        const words = karaokeLrc?.lines[computed.lineIndex]?.words.length ? karaokeLrc.lines[computed.lineIndex].words.map(w => w.text) : currText.trim().split(/\s+/).filter(Boolean);
        const wordWidths = words.map(w => ctx.measureText(w).width);
        const spaceWidth = ctx.measureText(' ').width;
        const totalWidth = wordWidths.reduce((a, b) => a + b, 0) + (spaceWidth + wordGap) * (words.length - 1);

        let clipWidth = 0;
        for (let i = 0; i < computed.wordProgress.wordIndex; i++) clipWidth += (wordWidths[i] ?? 0) + spaceWidth + wordGap;
        clipWidth += computed.wordProgress.within * (wordWidths[computed.wordProgress.wordIndex] ?? 0);

        const leftX = project.text.textAlign === 'center' ? computed.x - totalWidth / 2 : project.text.textAlign === 'right' ? computed.x - totalWidth : computed.x;
        const bgY = computed.centerY - computed.activeFontSize * 0.5;
        const bgH = computed.activeFontSize * 1.2;

        ctx.save();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(${computed.highlightRgb.r}, ${computed.highlightRgb.g}, ${computed.highlightRgb.b}, ${computed.highlightBgOpacity})`;
        if ((ctx as any).roundRect) { ctx.beginPath(); (ctx as any).roundRect(px(leftX), px(bgY), px(clipWidth), px(bgH), 8); ctx.fill(); }
        else ctx.fillRect(px(leftX), px(bgY), px(clipWidth), px(bgH));
        ctx.restore();

        ctx.restore();
      }

      if (computed.displayLines[2]?.text) {
        ctx.save();
        ctx.globalAlpha = transitionOpacity * computed.lyricsOpacity * computed.dimOpacity;
        ctx.font = `${computed.fontPrefix}${computed.sideFont}px ${project.text.fontFamily}`;
        ctx.fillText(computed.displayLines[2].text, px(computed.x), px(computed.centerY + gap));
        ctx.restore();
      }
      } else {
      const lineGap = Math.round(computed.baseFontSize * scaledLineHeight);
      const totalBlockHeight = (computed.displayLines.length - 1) * lineGap;
      const topY = computed.centerY - totalBlockHeight / 2;

      computed.displayLines.forEach((line, i) => {
        const isActive = line.originalIndex === computed.lineIndex;
        const fontSize = isActive ? computed.activeFontSize : computed.baseFontSize;
        const y = topY + i * lineGap;

        ctx.save();
        ctx.globalAlpha = transitionOpacity * computed.lyricsOpacity * (isActive ? 1 : computed.dimOpacity);
        ctx.font = `${computed.fontPrefix}${fontSize}px ${project.text.fontFamily}`;
        ctx.fillText(line.text, px(computed.x), px(y));
        ctx.restore();

        if (isActive && project.text.waveAnimation && line.text.trim().length > 0) {
          ctx.save();
          ctx.font = `${computed.fontPrefix}${fontSize}px ${project.text.fontFamily}`;

          const words = karaokeLrc?.lines[computed.lineIndex]?.words.length ? karaokeLrc.lines[computed.lineIndex].words.map(w => w.text) : line.text.trim().split(/\s+/).filter(Boolean);
          const wordWidths = words.map(w => ctx.measureText(w).width);
          const spaceWidth = ctx.measureText(' ').width;
          const totalWidth = wordWidths.reduce((a, b) => a + b, 0) + (spaceWidth + wordGap) * (words.length - 1);

          let clipWidth = 0;
          for (let j = 0; j < computed.wordProgress.wordIndex; j++) clipWidth += (wordWidths[j] ?? 0) + spaceWidth + wordGap;
          clipWidth += computed.wordProgress.within * (wordWidths[computed.wordProgress.wordIndex] || 0);

          const leftX = project.text.textAlign === 'center' ? computed.x - totalWidth / 2 : project.text.textAlign === 'right' ? computed.x - totalWidth : computed.x;
          const bgY = y - fontSize * 0.5;
          const bgH = fontSize * 1.2;

          ctx.save();
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.fillStyle = `rgba(${computed.highlightRgb.r}, ${computed.highlightRgb.g}, ${computed.highlightRgb.b}, ${computed.highlightBgOpacity})`;
          if ((ctx as any).roundRect) { ctx.beginPath(); (ctx as any).roundRect(px(leftX), px(bgY), px(clipWidth), px(bgH), 8); ctx.fill(); }
          else ctx.fillRect(px(leftX), px(bgY), px(clipWidth), px(bgH));
          ctx.restore();

          ctx.restore();
        }
      });
    }

      if (project.lyrics.showProgressBar) {
      const progress = contentDuration > 0 ? Math.min(1, Math.max(0, currentTime / contentDuration)) : 0;
      const barWidth = computed.width * 0.5;
      const barHeight = 4;
      const barX = (computed.width - barWidth) / 2;
      const barY = computed.height - scaledPaddingY - barHeight;

      ctx.save();
      ctx.globalAlpha = transitionOpacity * computed.lyricsOpacity * 0.3;
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(px(barX), px(barY), px(barWidth), px(barHeight));
      ctx.globalAlpha = transitionOpacity * computed.lyricsOpacity * 0.85;
      ctx.fillStyle = `rgba(${computed.highlightRgb.r}, ${computed.highlightRgb.g}, ${computed.highlightRgb.b}, 0.8)`;
      ctx.fillRect(px(barX), px(barY), px(barWidth * progress), px(barHeight));
      ctx.restore();
    }

    ctx.restore();
    })();

    return () => {
      cancelled = true;
    };
  }, [computed, contentDuration, currentTime, karaokeLrc, project.lyrics.displayMode, project.lyrics.showProgressBar, project.text.color, project.text.fontFamily, project.text.isBold, project.text.isItalic, project.text.textAlign, project.text.waveAnimation, scaledLineHeight, scaledPaddingY, transitionOpacity]);

  return <canvas ref={canvasRef} className="absolute inset-0 block" style={{ width: '100%', height: '100%', objectFit: 'fill' }} />;
}
