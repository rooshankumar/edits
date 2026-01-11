import { forwardRef, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { VideoProject, CANVAS_SIZES } from '@/types/video-project';
import { computeScrollState, calculateScrollPosition, calculateRelativeFontSize, calculateTransitionOpacity } from '@/utils/timeline';
import { getScaledTextSettings } from '@/utils/textScaling';
import { parseKaraokeLrc, findActiveKaraokeLineIndex, findKaraokeWordProgress, scaleKaraokeLrc, detectKaraokeStanzaBreaks, getKaraokeProgress, getKaraokePageInfo, getEstimatedWordProgress } from '@/utils/karaokeLrc';
import { cn } from '@/lib/utils';
import { KaraokeLyricsCanvas } from './KaraokeLyricsCanvas';

interface VideoPreviewProps {
  project: VideoProject;
  isPlaying: boolean;
  currentTime: number;
  contentDuration: number;
  totalDuration: number;
  audioRef?: React.RefObject<HTMLAudioElement>;
}

export const VideoPreview = forwardRef<HTMLDivElement, VideoPreviewProps>(
  ({ project, isPlaying, currentTime, contentDuration, totalDuration, audioRef: audioRefProp }, ref) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const textRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const localAudioRef = useRef<HTMLAudioElement>(null);
    const audioRef = audioRefProp ?? localAudioRef;
    const canvasSize = CANVAS_SIZES[project.canvasFormat];
    const aspectRatio = canvasSize.width / canvasSize.height;

    // Use unified scroll state - MATCHES EXPORT EXACTLY
    const scrollState = computeScrollState(
      currentTime,
      contentDuration,
      project.ending.enabled
    );

    // Keep audio element settings in sync (play/pause is controlled by parent)
    useEffect(() => {
      if (audioRef.current && project.audio.file) {
        audioRef.current.volume = project.audio.volume / 100;
        audioRef.current.loop = project.audio.loop;
      }
    }, [audioRef, project.audio.file, project.audio.loop, project.audio.volume]);

    // Scroll animation styles - uses unified calculation to match export EXACTLY
    const getTransformStyle = useCallback((): React.CSSProperties => {
      const containerHeight = containerRef.current?.offsetHeight || 500;
      const textHeight = textRef.current?.offsetHeight || 300;
      
      switch (project.animation.direction) {
        case 'up': {
          // Use unified scroll calculation - MATCHES EXPORT EXACTLY
          const scrollY = calculateScrollPosition(scrollState.progress, containerHeight, textHeight);
          return { transform: `translateY(${scrollY}px)` };
        }
        case 'left': {
          const containerWidth = containerRef.current?.offsetWidth || 400;
          const textWidth = textRef.current?.offsetWidth || 300;
          const scrollX = calculateScrollPosition(scrollState.progress, containerWidth, textWidth);
          return { transform: `translateX(${scrollX}px)` };
        }
        case 'right': {
          const containerWidth = containerRef.current?.offsetWidth || 400;
          const textWidth = textRef.current?.offsetWidth || 300;
          const totalDistance = containerWidth + textWidth;
          const startX = -textWidth;
          const currentX = startX + (scrollState.progress * totalDistance);
          return { transform: `translateX(${currentX}px)` };
        }
        default:
          return {};
      }
    }, [project.animation.direction, scrollState.progress]);

    // Calculate relative sizes based on actual preview height (matches export logic)
    const previewHeight = containerRef.current?.offsetHeight || canvasSize.height;
    const previewWidth = containerRef.current?.offsetWidth || canvasSize.width;
    const scaleFactor = Math.min(previewWidth / canvasSize.width, previewHeight / canvasSize.height);
    
    const karaokeLrc = useMemo(() => {
      if (project.theme !== 'lyrics') return null;
      if (project.lyrics.timingSource !== 'lrc') return null;
      if (project.lyrics.karaokeLrc.trim().length === 0) return null;
      const parsed = parseKaraokeLrc(project.lyrics.karaokeLrc);
      if (!parsed) return null;

      if (project.lyrics.autoFitLrcToAudio && project.audio.duration && project.audio.duration > 0 && parsed.duration > 0) {
        const scale = project.audio.duration / parsed.duration;
        return scaleKaraokeLrc(parsed, scale);
      }

      return parsed;
    }, [project.audio.duration, project.lyrics.autoFitLrcToAudio, project.lyrics.karaokeLrc, project.lyrics.timingSource, project.theme]);

    // Calculate word count for auto-scaling
    const wordCount = useMemo(() => {
      const text = (project.theme === 'lyrics' && project.lyrics.timingSource === 'lrc' && karaokeLrc)
        ? karaokeLrc.plainText
        : project.text.content;
      return (text || '').split(/\s+/).filter(w => w.length > 0).length;
    }, [karaokeLrc, project.lyrics.timingSource, project.text.content, project.theme]);
    
    // Get scaled settings based on content length
    const scaledSettings = useMemo(() => {
      return getScaledTextSettings(
        project.text.fontSize,
        project.text.lineHeight,
        project.text.letterSpacing,
        project.text.paddingX,
        project.text.paddingY,
        wordCount,
        project.text.autoScaleFont
      );
    }, [project.text.fontSize, project.text.lineHeight, project.text.letterSpacing, 
        project.text.paddingX, project.text.paddingY, wordCount, project.text.autoScaleFont]);
    
    // Use relative font sizing like export does
    const relativeFontSize = useMemo(() => {
      return calculateRelativeFontSize(scaledSettings.fontSize, canvasSize.height);
    }, [scaledSettings.fontSize, canvasSize.height]);
    
    const scaledFontSize = relativeFontSize * scaleFactor;
    const scaledPaddingX = Math.round((scaledSettings.paddingX / 1920) * canvasSize.height * scaleFactor);
    const scaledPaddingY = Math.round((scaledSettings.paddingY / 1920) * canvasSize.height * scaleFactor);
    const scaledLetterSpacing = scaledSettings.letterSpacing * scaleFactor;

    // Enforce a minimum horizontal safe-area padding (~1cm on typical mobile DPI)
    const minSafePaddingX = Math.round(75 * scaleFactor);
    const effectivePaddingX = Math.max(scaledPaddingX, minSafePaddingX);

    const textStyle: React.CSSProperties = useMemo(() => ({
      fontFamily: project.text.fontFamily,
      fontSize: `${scaledFontSize}px`,
      fontWeight: project.text.isBold ? 'bold' : 'normal',
      fontStyle: project.text.isItalic ? 'italic' : 'normal',
      lineHeight: scaledSettings.lineHeight,
      letterSpacing: `${scaledLetterSpacing}px`,
      textAlign: project.text.textAlign,
      color: project.text.color,
      whiteSpace: 'pre-wrap',
      width: `${project.text.containerWidth}%`,
      paddingLeft: `${effectivePaddingX}px`,
      paddingRight: `${effectivePaddingX}px`,
      paddingTop: `${scaledPaddingY}px`,
      paddingBottom: `${scaledPaddingY}px`,
      ...getTransformStyle(),
    }), [effectivePaddingX, project.text, scaledFontSize, scaledPaddingY, scaledLetterSpacing, scaledSettings.lineHeight, getTransformStyle]);

    useEffect(() => {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsFullscreen(false);
      };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const displayContent = project.text.content || 'Enter your text...';
    
    // Calculate transition opacity for smooth fade
    const transitionOpacity = useMemo(() => 
      calculateTransitionOpacity(currentTime, contentDuration, project.ending.enabled),
      [currentTime, contentDuration, project.ending.enabled]
    );
    
    // Wave animation: calculate which characters should be visible
    const getWaveVisibility = useCallback((charIndex: number, totalChars: number): number => {
      if (!project.text.waveAnimation) return 1;
      
      // Wave progresses through text based on scroll progress
      const charsPerSecond = totalChars / contentDuration;
      const visibleChars = Math.floor(currentTime * charsPerSecond);
      
      if (charIndex > visibleChars) return 0;
      if (charIndex === visibleChars) {
        // Smooth fade-in for current character
        const charProgress = (currentTime * charsPerSecond) - visibleChars;
        return charProgress;
      }
      return 1;
    }, [project.text.waveAnimation, currentTime, contentDuration]);

    const stanzaBreaks = useMemo(() => {
      if (project.theme !== 'lyrics') return [];
      if (project.lyrics.timingSource !== 'lrc') return [];
      if (project.lyrics.karaokeLrc.trim().length === 0) return [];
      return detectKaraokeStanzaBreaks(project.lyrics.karaokeLrc);
    }, [project.lyrics.karaokeLrc, project.lyrics.timingSource, project.theme]);

    const lyricLines = useMemo(() => {
      if (project.theme === 'lyrics' && project.lyrics.timingSource === 'lrc' && karaokeLrc) {
        const raw = karaokeLrc.lines.map((l) => l.text);
        return raw.length > 0 ? raw : [''];
      }
      const raw = (project.text.content || '').split('\n');
      return raw.length > 0 ? raw : [''];
    }, [karaokeLrc, project.lyrics.timingSource, project.text.content, project.theme]);

    const lyricsTiming = useMemo(() => {
      if (project.theme === 'lyrics' && project.lyrics.timingSource === 'lrc' && karaokeLrc) {
        const totalLines = Math.max(1, karaokeLrc.lines.length);
        const lineDurations = karaokeLrc.lines.map((l) => Math.max(0, l.end - l.start));
        const lineStarts = karaokeLrc.lines.map((l) => l.start);
        const totalDuration = Math.max(0.000001, karaokeLrc.duration);
        return { lineDurations, lineStarts, totalLines, totalDuration };
      }

      const totalLines = Math.max(1, lyricLines.length);
      const lineDurations = new Array<number>(totalLines).fill(0);

      if (project.theme !== 'lyrics') {
        const d = contentDuration > 0 ? contentDuration / totalLines : 0;
        for (let i = 0; i < totalLines; i++) lineDurations[i] = d;
      } else if (project.lyrics.pacingSource === 'chars') {
        const cps = Math.max(1, project.lyrics.charsPerSecond);
        const minLine = Math.max(0.2, project.lyrics.minLineDuration);

        for (let i = 0; i < totalLines; i++) {
          const normalized = (lyricLines[i] ?? '').replace(/\s+/g, ' ').trim();
          const chars = normalized.length;
          lineDurations[i] = Math.max(minLine, chars > 0 ? chars / cps : minLine);
        }
      } else {
        const d = contentDuration > 0 ? contentDuration / totalLines : 0;
        for (let i = 0; i < totalLines; i++) lineDurations[i] = d;
      }

      const starts = new Array<number>(totalLines).fill(0);
      let acc = 0;
      for (let i = 0; i < totalLines; i++) {
        starts[i] = acc;
        acc += lineDurations[i];
      }

      let total = acc;

      // IMPORTANT: playback/contentDuration is authoritative; keep timings in sync.
      if (project.theme === 'lyrics' && contentDuration > 0 && total > 0) {
        const scale = contentDuration / total;
        for (let i = 0; i < totalLines; i++) lineDurations[i] *= scale;
        let acc2 = 0;
        for (let i = 0; i < totalLines; i++) {
          starts[i] = acc2;
          acc2 += lineDurations[i];
        }
        total = contentDuration;
      }

      return { lineDurations, lineStarts: starts, totalLines, totalDuration: total };
    }, [contentDuration, lyricLines, project.lyrics.charsPerSecond, project.lyrics.minLineDuration, project.lyrics.pacingSource, project.theme]);

    const getLyricsLineIndex = useCallback(() => {
      if (project.theme === 'lyrics' && project.lyrics.timingSource === 'lrc' && karaokeLrc) {
        return findActiveKaraokeLineIndex(karaokeLrc.lines, currentTime + project.lyrics.lrcOffsetSeconds);
      }

      const totalLines = lyricsTiming.totalLines;
      if (totalLines <= 1) return 0;
      const total = Math.max(0.000001, lyricsTiming.totalDuration || contentDuration || 0.000001);
      const t = Math.min(Math.max(0, currentTime), total - 0.000001);

      for (let i = totalLines - 1; i >= 0; i--) {
        if (t >= lyricsTiming.lineStarts[i]) return i;
      }
      return 0;
    }, [contentDuration, currentTime, karaokeLrc, lyricsTiming.lineStarts, lyricsTiming.totalDuration, lyricsTiming.totalLines, project.lyrics.lrcOffsetSeconds, project.lyrics.timingSource, project.theme]);

    const karaokeClip = useMemo(() => {
      if (project.theme !== 'lyrics' || !project.text.waveAnimation) return null;

      const lineIndex = getLyricsLineIndex();

      if (project.lyrics.timingSource === 'lrc' && karaokeLrc) {
        const line = karaokeLrc.lines[lineIndex];
        if (!line) return null;

        const t = currentTime + project.lyrics.lrcOffsetSeconds + project.lyrics.highlightLeadSeconds;
        const { wordIndex, within } = findKaraokeWordProgress(line, t);
        const tokens = (line.words.length > 0 ? line.words.map((w) => w.text) : [line.text]).map((s) => s);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const fullFit = project.lyrics.displayMode === 'full'
          ? Math.max(0.55, Math.min(1, 12 / Math.max(12, lyricLines.length)))
          : 1;

        const fontScale = project.lyrics.displayMode === 'lines'
          ? 1.25
          : project.lyrics.displayMode === 'full'
            ? 1.05 * fullFit
            : 1.15;

        const fontPx = scaledFontSize * fontScale;
        const fontPrefix = `${project.text.isItalic ? 'italic ' : ''}${project.text.isBold ? 'bold ' : ''}`;
        ctx.font = `${fontPrefix}${fontPx}px ${project.text.fontFamily}`;

        const widths = tokens.map((tok) => ctx.measureText(tok).width);
        const fullWidth = widths.reduce((a, b) => a + b, 0);
        if (fullWidth <= 0) return { rightInsetPx: 0, fullWidthPx: 0 };

        const idx = Math.max(0, Math.min(wordIndex, widths.length - 1));
        let startX = 0;
        for (let i = 0; i < idx; i++) startX += widths[i];
        const clipWidth = startX + within * widths[idx];
        const rightInset = Math.max(0, fullWidth - clipWidth);
        return { rightInsetPx: rightInset, fullWidthPx: fullWidth };
      }

      const totalLines = lyricsTiming.totalLines;
      const lineDuration = lyricsTiming.lineDurations[lineIndex] ?? 0;
      if (lineDuration <= 0) return null;

      const lineStartTime = lyricsTiming.lineStarts[lineIndex] ?? 0;
      const timeInLine = Math.max(0, Math.min(lineDuration, currentTime - lineStartTime));

      const text = (lyricLines[lineIndex] ?? '').toString();
      const words = text.trim().length > 0 ? text.trim().split(/\s+/).filter(Boolean) : [];
      const wordCount = Math.max(1, words.length);
      const wordDuration = lineDuration / wordCount;
      const lead = Math.max(0, Math.min(wordDuration, project.lyrics.highlightLeadSeconds));
      const effectiveTime = Math.max(0, Math.min(lineDuration, timeInLine + lead));

      const wordIndex = Math.min(wordCount - 1, Math.floor(effectiveTime / wordDuration));
      const within = Math.max(0, Math.min(1, (effectiveTime - wordIndex * wordDuration) / wordDuration));

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const fontPx = scaledFontSize * 1.25;
      const fontPrefix = `${project.text.isItalic ? 'italic ' : ''}${project.text.isBold ? 'bold ' : ''}`;
      ctx.font = `${fontPrefix}${fontPx}px ${project.text.fontFamily}`;

      const spaceWidth = ctx.measureText(' ').width;
      let fullWidth = 0;
      const widths = words.map((w) => ctx.measureText(w).width);
      widths.forEach((w, i) => {
        fullWidth += w;
        if (i < widths.length - 1) fullWidth += spaceWidth;
      });

      if (words.length === 0) {
        return { rightInsetPx: fullWidth, fullWidthPx: fullWidth };
      }

      let startX = 0;
      for (let i = 0; i < wordIndex; i++) {
        startX += widths[i] + spaceWidth;
      }
      const endX = startX + widths[wordIndex] + (wordIndex < widths.length - 1 ? spaceWidth : 0);
      const clipWidth = startX + within * (endX - startX);
      const rightInset = Math.max(0, fullWidth - clipWidth);

      return { rightInsetPx: rightInset, fullWidthPx: fullWidth };
    }, [contentDuration, currentTime, getLyricsLineIndex, karaokeLrc, lyricLines.length, project.lyrics.highlightLeadSeconds, project.lyrics.highlightIntensity, project.lyrics.displayMode, project.lyrics.timingSource, project.lyrics.lrcOffsetSeconds, project.text.fontFamily, project.text.isBold, project.text.isItalic, project.text.waveAnimation, scaledFontSize, currentTime]);

    // Render text with wave animation
    const renderWaveText = (text: string) => {
      if (!project.text.waveAnimation) return text;
      
      const chars = text.split('');
      return (
        <>
          {chars.map((char, index) => {
            const opacity = getWaveVisibility(index, chars.length);
            return (
              <span
                key={index}
                style={{
                  opacity,
                  transition: 'opacity 0.1s ease-out'
                }}
              >
                {char}
              </span>
            );
          })}
        </>
      );
    };

    // Watermark position styles
    const getWatermarkPosition = () => {
      const p = project.watermark.padding;
      switch (project.watermark.position) {
        case 'top-left': return { top: p, left: p };
        case 'top-right': return { top: p, right: p };
        case 'bottom-left': return { bottom: p, left: p };
        case 'bottom-right': return { bottom: p, right: p };
      }
    };

    return (
      <>
        {project.audio.file && <audio ref={audioRef} src={project.audio.file} preload="metadata" />}

        <div className={cn(
          'relative w-full h-full flex items-center justify-center',
          isFullscreen && 'fixed inset-0 z-50 bg-black/95 p-4'
        )}>
          <div
            ref={ref}
            className="relative overflow-hidden rounded-lg shadow-medium border border-border/50"
            style={{
              aspectRatio: `${canvasSize.width} / ${canvasSize.height}`,
              width: aspectRatio >= 1 ? '100%' : 'auto',
              height: aspectRatio < 1 ? '100%' : 'auto',
              maxHeight: isFullscreen ? '90vh' : 'min(60vh, 500px)',
              maxWidth: isFullscreen ? '90vw' : '100%',
              minHeight: '150px',
              minWidth: '100px',
              backgroundColor: project.background.color,
            }}
          >
            {/* Background Image/Video */}
            {project.background.image && (
              <img src={project.background.image} alt="" className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: `blur(${project.background.blur}px)`, opacity: project.background.opacity / 100 }} />
            )}
            {project.background.video && (
              <video src={project.background.video} className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: `blur(${project.background.blur}px)`, opacity: project.background.opacity / 100 }}
                muted loop autoPlay playsInline />
            )}

            {/* Title Overlay - centered at top (during content only) */}
            {!scrollState.isEnding && project.titleOverlay?.enabled && (
              (() => {
                const titleText = project.titleOverlay.useProjectName
                  ? (project.name || '')
                  : (project.titleOverlay.content || '');

                if (!titleText.trim()) return null;

                return (
                  <div
                    className="absolute left-0 right-0 z-20 flex items-start justify-center"
                    style={{
                      top: `${project.titleOverlay.paddingY * scaleFactor}px`,
                      opacity: transitionOpacity.contentOpacity,
                    }}
                  >
                    <div
                      className="px-3 py-1"
                      style={{
                        backgroundColor: project.titleOverlay.backgroundColor,
                        color: project.titleOverlay.color,
                        fontSize: `${project.titleOverlay.fontSize * scaleFactor}px`,
                        fontFamily: project.titleOverlay.fontFamily || project.text.fontFamily,
                        fontWeight: project.titleOverlay.isBold ? 700 : 400,
                        fontStyle: project.titleOverlay.isItalic ? 'italic' : 'normal',
                      }}
                    >
                      {titleText}
                    </div>
                  </div>
                );
              })()
            )}

            {/* Overlay Text - Only show during content, not ending */}
            {!scrollState.isEnding && project.overlay.enabled && project.overlay.content && (
              <div className={cn('absolute left-0 right-0 z-10 text-center px-2 py-1',
                project.overlay.position === 'top' ? 'top-0' : 'bottom-0'
              )} style={{ 
                backgroundColor: project.overlay.backgroundColor, 
                color: project.overlay.color, 
                fontSize: `${project.overlay.fontSize * scaleFactor}px`
              }}>
                {project.overlay.content}
              </div>
            )}

            {/* Watermark - Only show during content, not ending */}
            {!scrollState.isEnding && project.watermark.enabled && project.watermark.image && (
              <img src={project.watermark.image} alt="" className="absolute z-20"
                style={{ 
                  ...getWatermarkPosition(), 
                  width: project.watermark.size * scaleFactor, 
                  height: 'auto', 
                  opacity: project.watermark.opacity / 100 
                }} />
            )}

            {/* Scrolling Text or Ending with smooth transition */}
            {!scrollState.isEnding ? (
              <div 
                ref={containerRef} 
                className={cn('absolute inset-0 overflow-hidden flex',
                  project.animation.direction === 'up' ? 'flex-col items-center' : 'items-center')}
                style={{ opacity: transitionOpacity.contentOpacity, transition: 'opacity 0.5s ease-in-out' }}
              >
                {project.theme === 'lyrics' ? (
                  <KaraokeLyricsCanvas
                    project={project}
                    currentTime={currentTime}
                    contentDuration={contentDuration}
                    karaokeLrc={karaokeLrc}
                    lyricLines={lyricLines}
                    lyricsTiming={lyricsTiming}
                    scaledFontSize={scaledFontSize}
                    scaledPaddingX={effectivePaddingX}
                    scaledPaddingY={scaledPaddingY}
                    scaledLineHeight={scaledSettings.lineHeight}
                    transitionOpacity={transitionOpacity.contentOpacity}
                    scaleFactor={scaleFactor}
                  />
                ) : (
                  <div ref={textRef} style={textStyle} className={cn(!project.text.content && 'text-white/30 italic')}>
                    {renderWaveText(displayContent)}
                  </div>
                )}
              </div>
            ) : (
              <div 
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8"
                style={{ opacity: transitionOpacity.endingOpacity, transition: 'opacity 0.5s ease-in-out' }}
              >
                {project.ending.showLogo && project.ending.logo && (
                  <img 
                    src={project.ending.logo} 
                    alt="Logo" 
                    style={{
                      width: `${project.ending.logoSize * scaleFactor}px`,
                      height: 'auto',
                      objectFit: 'contain'
                    }}
                  />
                )}
                <p className="font-bold text-center" style={{ 
                  color: project.text.color,
                  fontSize: `${project.ending.ctaFontSize * scaleFactor}px`
                }}>{project.ending.ctaText}</p>
                {project.ending.showQR && project.ending.qrCode && (
                  <img 
                    src={project.ending.qrCode} 
                    alt="QR" 
                    style={{
                      width: `${project.ending.qrSize * scaleFactor}px`,
                      height: `${project.ending.qrSize * scaleFactor}px`
                    }} 
                    className="bg-white p-2 rounded" 
                  />
                )}
              </div>
            )}

            {/* Info Labels - Responsive */}
            <div className="absolute bottom-1 left-1 px-1 py-0.5 bg-black/60 text-white text-[8px] md:text-[9px] font-mono flex items-center gap-1">
              <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-green-500" title="Live preview matches export exactly" />
              <span className="hidden sm:inline">{canvasSize.width}×{canvasSize.height}</span>
              <span className="sm:hidden">{canvasSize.width}×{canvasSize.height}</span>
            </div>
            <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/60 text-white text-[8px] md:text-[9px] font-mono">
              {currentTime.toFixed(1)}s / {totalDuration}s
            </div>
          </div>

          <button onClick={() => setIsFullscreen(!isFullscreen)}
            className={cn('absolute p-1 md:p-1.5 rounded-lg bg-card/90 border border-border hover:bg-card',
              isFullscreen ? 'top-2 right-2' : 'top-1 right-1')}>
            {isFullscreen ? <Minimize2 className="w-2.5 h-2.5 md:w-3 md:h-3" /> : <Maximize2 className="w-2.5 h-2.5 md:w-3 md:h-3" />}
          </button>
        </div>
      </>
    );
  }
);

VideoPreview.displayName = 'VideoPreview';
