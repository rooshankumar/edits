import { forwardRef, useState, useEffect } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { VideoProject, CANVAS_SIZES } from '@/types/video-project';
import { cn } from '@/lib/utils';

interface VideoPreviewProps {
  project: VideoProject;
  isPlaying: boolean;
}

export const VideoPreview = forwardRef<HTMLDivElement, VideoPreviewProps>(
  ({ project, isPlaying }, ref) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const canvasSize = CANVAS_SIZES[project.canvasFormat];
    const aspectRatio = canvasSize.width / canvasSize.height;

    // Calculate scroll animation duration based on speed (1-20)
    // Speed 1 = 20s, Speed 20 = 1s
    const scrollDuration = (21 - project.animation.speed);

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
    };

    const getAnimationClass = () => {
      if (!isPlaying) return '';
      switch (project.animation.direction) {
        case 'up': return 'animate-scroll-up';
        case 'left': return 'animate-scroll-left';
        case 'right': return 'animate-scroll-right';
        default: return '';
      }
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

    return (
      <>
        <div className={cn(
          'relative w-full h-full flex items-center justify-center',
          isFullscreen && 'fixed inset-0 z-50 bg-black/90 p-8'
        )}>
          {/* Canvas Container */}
          <div
            ref={ref}
            className="relative overflow-hidden rounded-2xl shadow-medium"
            style={{
              aspectRatio: `${canvasSize.width} / ${canvasSize.height}`,
              maxHeight: isFullscreen ? '90vh' : '70vh',
              maxWidth: isFullscreen ? '90vw' : '100%',
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

            {/* Scrolling Text */}
            <div 
              className={cn(
                'absolute inset-0 flex',
                project.animation.direction === 'up' ? 'flex-col justify-center items-center' : 'flex-row items-center',
                getAnimationClass()
              )}
              style={{
                '--scroll-duration': `${scrollDuration}s`,
                animationPlayState: isPlaying ? 'running' : 'paused',
                animationIterationCount: project.animation.isLooping ? 'infinite' : '1',
              } as React.CSSProperties}
            >
              <div style={textStyle}>
                {project.text.content}
              </div>
            </div>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className={cn(
              'absolute p-2 rounded-xl bg-card/80 backdrop-blur-sm border border-border',
              'hover:bg-card transition-colors',
              isFullscreen ? 'top-4 right-4' : 'top-2 right-2'
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
