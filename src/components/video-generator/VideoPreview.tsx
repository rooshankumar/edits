import { forwardRef, useState, useEffect } from 'react';
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
    const canvasSize = CANVAS_SIZES[project.canvasFormat];
    const aspectRatio = canvasSize.width / canvasSize.height;

    // Calculate animation progress (0 to 1)
    const progress = duration > 0 ? currentTime / duration : 0;

    // Calculate scroll amount based on progress and direction
    const getTransformStyle = (): React.CSSProperties => {
      if (!isPlaying && currentTime === 0) {
        // Static position when not playing
        return {};
      }

      const scrollPercent = progress * 100;
      
      switch (project.animation.direction) {
        case 'up':
          return { transform: `translateY(${100 - scrollPercent * 2}%)` };
        case 'left':
          return { transform: `translateX(${100 - scrollPercent * 2}%)` };
        case 'right':
          return { transform: `translateX(${-100 + scrollPercent * 2}%)` };
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
      padding: '2rem',
      transition: isPlaying ? 'none' : 'transform 0.1s ease-out',
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

    // Show placeholder text if content is empty
    const displayContent = project.text.content || 'Enter your text in the sidebar...';

    return (
      <>
        <div className={cn(
          'relative w-full h-full flex items-center justify-center p-4',
          isFullscreen && 'fixed inset-0 z-50 bg-black/90 p-8'
        )}>
          {/* Canvas Container */}
          <div
            ref={ref}
            className="relative overflow-hidden rounded-2xl shadow-medium border-2 border-border/50"
            style={{
              aspectRatio: `${canvasSize.width} / ${canvasSize.height}`,
              width: aspectRatio >= 1 ? '100%' : 'auto',
              height: aspectRatio < 1 ? '100%' : 'auto',
              maxHeight: isFullscreen ? '90vh' : '65vh',
              maxWidth: isFullscreen ? '90vw' : '100%',
              minHeight: '200px',
              minWidth: '150px',
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

            {/* Text Content - Always Visible */}
            <div 
              className={cn(
                'absolute inset-0 flex overflow-hidden',
                project.animation.direction === 'up' ? 'flex-col justify-center items-center' : 'flex-row items-center',
              )}
            >
              <div 
                style={textStyle}
                className={cn(
                  'w-full',
                  !project.text.content && 'text-muted-foreground/50 italic'
                )}
              >
                {displayContent}
              </div>
            </div>

            {/* Canvas Size Label */}
            <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/50 text-white text-xs font-mono">
              {canvasSize.width} × {canvasSize.height}
            </div>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className={cn(
              'absolute p-2 rounded-xl bg-card/80 backdrop-blur-sm border border-border',
              'hover:bg-card transition-colors',
              isFullscreen ? 'top-4 right-4' : 'top-6 right-6'
            )}
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>
        </div>
      </>
    );
  }
);

VideoPreview.displayName = 'VideoPreview';
