import { forwardRef, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { VideoProject, CANVAS_SIZES } from '@/types/video-project';
import { computeScrollState, calculateScrollPosition, calculateRelativeFontSize, calculateTransitionOpacity } from '@/utils/timeline';
import { getScaledTextSettings } from '@/utils/textScaling';
import { cn } from '@/lib/utils';

interface VideoPreviewProps {
  project: VideoProject;
  isPlaying: boolean;
  currentTime: number;
  contentDuration: number;
  totalDuration: number;
}

export const VideoPreview = forwardRef<HTMLDivElement, VideoPreviewProps>(
  ({ project, isPlaying, currentTime, contentDuration, totalDuration }, ref) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const textRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const canvasSize = CANVAS_SIZES[project.canvasFormat];
    const aspectRatio = canvasSize.width / canvasSize.height;

    // Use unified scroll state - MATCHES EXPORT EXACTLY
    const scrollState = computeScrollState(
      currentTime,
      contentDuration,
      project.ending.enabled
    );

    // Handle audio playback
    useEffect(() => {
      if (audioRef.current && project.audio.file) {
        audioRef.current.volume = project.audio.volume / 100;
        audioRef.current.loop = project.audio.loop;
        if (isPlaying) {
          audioRef.current.currentTime = currentTime;
          audioRef.current.play().catch(() => {});
        } else {
          audioRef.current.pause();
        }
      }
    }, [isPlaying, project.audio.file, project.audio.volume, project.audio.loop]);

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
    const scaleFactor = previewHeight / canvasSize.height;
    
    // Calculate word count for auto-scaling
    const wordCount = useMemo(() => {
      return project.text.content.split(/\s+/).filter(w => w.length > 0).length;
    }, [project.text.content]);
    
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
      paddingLeft: `${scaledPaddingX}px`,
      paddingRight: `${scaledPaddingX}px`,
      paddingTop: `${scaledPaddingY}px`,
      paddingBottom: `${scaledPaddingY}px`,
      ...getTransformStyle(),
    }), [project.text, scaledFontSize, scaledPaddingX, scaledPaddingY, scaledLetterSpacing, getTransformStyle]);

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
        {project.audio.file && <audio ref={audioRef} src={project.audio.file} />}

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
                <div ref={textRef} style={textStyle} className={cn(!project.text.content && 'text-white/30 italic')}>
                  {renderWaveText(displayContent)}
                </div>
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
