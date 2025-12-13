import { forwardRef, useState, useEffect, useRef } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { VideoProject, CANVAS_SIZES } from '@/types/video-project';
import { cn } from '@/lib/utils';

interface VideoPreviewProps {
  project: VideoProject;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

export const VideoPreview = forwardRef<HTMLDivElement, VideoPreviewProps>(
  ({ project, isPlaying, currentTime, duration }, ref) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const textRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const canvasSize = CANVAS_SIZES[project.canvasFormat];
    const aspectRatio = canvasSize.width / canvasSize.height;

    // Calculate animation progress (0 to 1)
    const progress = duration > 0 ? currentTime / duration : 0;

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

    // Movie credits style animation calculation
    // Text starts below the screen and scrolls up until it's above the screen
    const getTransformStyle = (): React.CSSProperties => {
      const containerHeight = containerRef.current?.offsetHeight || 500;
      const textHeight = textRef.current?.offsetHeight || 300;
      
      // Total distance: from bottom of screen to top (off screen)
      const totalScrollDistance = containerHeight + textHeight;
      
      switch (project.animation.direction) {
        case 'up': {
          // Start at bottom (containerHeight), end at top (-textHeight)
          const startY = containerHeight;
          const currentY = startY - (progress * totalScrollDistance);
          return { transform: `translateY(${currentY}px)` };
        }
        case 'left': {
          const containerWidth = containerRef.current?.offsetWidth || 400;
          const textWidth = textRef.current?.offsetWidth || 300;
          const totalDistance = containerWidth + textWidth;
          const startX = containerWidth;
          const currentX = startX - (progress * totalDistance);
          return { transform: `translateX(${currentX}px)` };
        }
        case 'right': {
          const containerWidth = containerRef.current?.offsetWidth || 400;
          const textWidth = textRef.current?.offsetWidth || 300;
          const totalDistance = containerWidth + textWidth;
          const startX = -textWidth;
          const currentX = startX + (progress * totalDistance);
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

    const toggleFullscreen = () => {
      setIsFullscreen(!isFullscreen);
    };

    useEffect(() => {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsFullscreen(false);
      };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const displayContent = project.text.content || 'Enter your text...';

    return (
      <>
        {/* Audio element */}
        {project.audio.file && (
          <audio ref={audioRef} src={project.audio.file} />
        )}

        <div className={cn(
          'relative w-full h-full flex items-center justify-center',
          isFullscreen && 'fixed inset-0 z-50 bg-black/95 p-8'
        )}>
          {/* Canvas Container */}
          <div
            ref={ref}
            className="relative overflow-hidden rounded-xl shadow-medium border border-border/50"
            style={{
              aspectRatio: `${canvasSize.width} / ${canvasSize.height}`,
              width: aspectRatio >= 1 ? '100%' : 'auto',
              height: aspectRatio < 1 ? '100%' : 'auto',
              maxHeight: isFullscreen ? '90vh' : '70vh',
              maxWidth: isFullscreen ? '90vw' : '100%',
              minHeight: '250px',
              minWidth: '180px',
              backgroundColor: project.background.color,
            }}
          >
            {/* Background Image */}
            {project.background.image && (
              <img
                src={project.background.image}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  filter: `blur(${project.background.blur}px)`,
                  opacity: project.background.opacity / 100,
                }}
              />
            )}

            {/* Background Video */}
            {project.background.video && (
              <video
                src={project.background.video}
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  filter: `blur(${project.background.blur}px)`,
                  opacity: project.background.opacity / 100,
                }}
                muted
                loop
                autoPlay
                playsInline
              />
            )}

            {/* Text Container */}
            <div 
              ref={containerRef}
              className={cn(
                'absolute inset-0 overflow-hidden flex',
                project.animation.direction === 'up' ? 'flex-col items-center' : 'items-center',
              )}
            >
              <div 
                ref={textRef}
                style={textStyle}
                className={cn(
                  !project.text.content && 'text-white/30 italic'
                )}
              >
                {displayContent}
              </div>
            </div>

            {/* Canvas Size Label */}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono">
              {canvasSize.width}×{canvasSize.height}
            </div>

            {/* Progress indicator */}
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono">
              {currentTime.toFixed(1)}s / {duration}s
            </div>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className={cn(
              'absolute p-2 rounded-lg bg-card/90 backdrop-blur-sm border border-border',
              'hover:bg-card transition-colors',
              isFullscreen ? 'top-4 right-4' : 'top-2 right-2'
            )}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </>
    );
  }
);

VideoPreview.displayName = 'VideoPreview';
