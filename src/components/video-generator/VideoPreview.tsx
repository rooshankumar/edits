import { forwardRef, useState, useEffect, useRef } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { VideoProject, CANVAS_SIZES } from '@/types/video-project';
import { computeScrollState } from '@/utils/timeline';
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

    // Scroll animation styles - matches export calculation
    const getTransformStyle = (): React.CSSProperties => {
      const containerHeight = containerRef.current?.offsetHeight || 500;
      const textHeight = textRef.current?.offsetHeight || 300;
      const totalScrollDistance = containerHeight + textHeight;
      
      switch (project.animation.direction) {
        case 'up': {
          // Start at bottom (containerHeight), scroll up by progress
          const startY = containerHeight;
          const currentY = startY - (scrollState.progress * totalScrollDistance);
          return { transform: `translateY(${currentY}px)` };
        }
        case 'left': {
          const containerWidth = containerRef.current?.offsetWidth || 400;
          const textWidth = textRef.current?.offsetWidth || 300;
          const totalDistance = containerWidth + textWidth;
          const startX = containerWidth;
          const currentX = startX - (scrollState.progress * totalDistance);
          return { transform: `translateX(${currentX}px)` };
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
    };

    const textStyle: React.CSSProperties = {
      fontFamily: project.text.fontFamily,
      fontSize: `${project.text.fontSize}px`,
      fontWeight: project.text.isBold ? 'bold' : 'normal',
      fontStyle: project.text.isItalic ? 'italic' : 'normal',
      lineHeight: project.text.lineHeight,
      letterSpacing: `${project.text.letterSpacing}px`,
      textAlign: project.text.textAlign,
      color: project.text.color,
      whiteSpace: 'pre-wrap',
      width: `${project.text.containerWidth}%`,
      paddingLeft: `${project.text.paddingX}px`,
      paddingRight: `${project.text.paddingX}px`,
      paddingTop: `${project.text.paddingY}px`,
      paddingBottom: `${project.text.paddingY}px`,
      ...getTransformStyle(),
    };

    useEffect(() => {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsFullscreen(false);
      };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const displayContent = project.text.content || 'Enter your text...';

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
              maxHeight: isFullscreen ? '90vh' : '60vh',
              maxWidth: isFullscreen ? '90vw' : '100%',
              minHeight: '200px',
              minWidth: '150px',
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

            {/* Overlay Text */}
            {project.overlay.enabled && project.overlay.content && (
              <div className={cn('absolute left-0 right-0 z-10 text-center px-2 py-1',
                project.overlay.position === 'top' ? 'top-0' : 'bottom-0'
              )} style={{ backgroundColor: project.overlay.backgroundColor, color: project.overlay.color, fontSize: project.overlay.fontSize }}>
                {project.overlay.content}
              </div>
            )}

            {/* Watermark */}
            {project.watermark.enabled && project.watermark.image && (
              <img src={project.watermark.image} alt="" className="absolute z-20"
                style={{ ...getWatermarkPosition(), width: project.watermark.size, height: 'auto', opacity: project.watermark.opacity / 100 }} />
            )}

            {/* Scrolling Text or Ending */}
            {!scrollState.isEnding ? (
              <div ref={containerRef} className={cn('absolute inset-0 overflow-hidden flex',
                project.animation.direction === 'up' ? 'flex-col items-center' : 'items-center')}>
                <div ref={textRef} style={textStyle} className={cn(!project.text.content && 'text-white/30 italic')}>
                  {displayContent}
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
                {project.ending.showLogo && project.ending.logo && (
                  <img src={project.ending.logo} alt="Logo" className="max-w-[40%] max-h-[30%] object-contain" />
                )}
                <p className="text-2xl font-bold text-center" style={{ color: project.text.color }}>{project.ending.ctaText}</p>
                {project.ending.showQR && project.ending.qrCode && (
                  <img src={project.ending.qrCode} alt="QR" className="w-24 h-24 bg-white p-2 rounded" />
                )}
              </div>
            )}

            {/* Info Labels */}
            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono">
              {canvasSize.width}×{canvasSize.height}
            </div>
            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono">
              {currentTime.toFixed(1)}s / {totalDuration}s
            </div>
          </div>

          <button onClick={() => setIsFullscreen(!isFullscreen)}
            className={cn('absolute p-1.5 rounded-lg bg-card/90 border border-border hover:bg-card',
              isFullscreen ? 'top-2 right-2' : 'top-1 right-1')}>
            {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
        </div>
      </>
    );
  }
);

VideoPreview.displayName = 'VideoPreview';
