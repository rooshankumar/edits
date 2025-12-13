import { useState, useCallback, useRef } from 'react';
import { VideoProject, CANVAS_SIZES, ExportQuality } from '@/types/video-project';

interface ExportState {
  isExporting: boolean;
  progress: number;
  error: string | null;
}

const QUALITY_SETTINGS: Record<ExportQuality, { bitrate: number; fps: number }> = {
  standard: { bitrate: 2500000, fps: 30 },
  hd: { bitrate: 5000000, fps: 30 },
  ultra: { bitrate: 8000000, fps: 60 },
};

export function useVideoExport() {
  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
    progress: 0,
    error: null,
  });
  const abortRef = useRef(false);

  const exportVideo = useCallback(async (
    project: VideoProject,
    previewRef: HTMLDivElement,
    quality: ExportQuality = 'hd',
    customDuration?: number
  ) => {
    abortRef.current = false;
    setExportState({ isExporting: true, progress: 0, error: null });

    try {
      const { width, height } = CANVAS_SIZES[project.canvasFormat];
      const { bitrate, fps } = QUALITY_SETTINGS[quality];
      const duration = (customDuration || project.animation.duration) * 1000;
      const totalFrames = Math.ceil((duration / 1000) * fps);

      // Create offscreen canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;

      // Setup MediaRecorder
      const stream = canvas.captureStream(fps);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: bitrate,
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const recordingPromise = new Promise<Blob>((resolve, reject) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          resolve(blob);
        };
        mediaRecorder.onerror = (e) => reject(e);
      });

      mediaRecorder.start();

      // Preload background image
      let bgImage: HTMLImageElement | null = null;
      if (project.background.image) {
        bgImage = new Image();
        bgImage.src = project.background.image;
        await new Promise(resolve => {
          bgImage!.onload = resolve;
          bgImage!.onerror = resolve;
        });
      }

      // Render frames with movie-credits style animation
      for (let frame = 0; frame < totalFrames; frame++) {
        if (abortRef.current) {
          mediaRecorder.stop();
          throw new Error('Export cancelled');
        }

        const progress = frame / totalFrames;

        // Draw background
        ctx.fillStyle = project.background.color;
        ctx.fillRect(0, 0, width, height);

        // Draw background image
        if (bgImage && bgImage.complete) {
          ctx.save();
          ctx.globalAlpha = project.background.opacity / 100;
          if (project.background.blur > 0) {
            ctx.filter = `blur(${project.background.blur}px)`;
          }
          const scale = Math.max(width / bgImage.width, height / bgImage.height);
          const x = (width - bgImage.width * scale) / 2;
          const y = (height - bgImage.height * scale) / 2;
          ctx.drawImage(bgImage, x, y, bgImage.width * scale, bgImage.height * scale);
          ctx.restore();
        }

        // Draw text with movie credits animation
        ctx.fillStyle = project.text.color;
        ctx.font = `${project.text.isItalic ? 'italic ' : ''}${project.text.isBold ? 'bold ' : ''}${project.text.fontSize}px ${project.text.fontFamily}`;
        ctx.textAlign = project.text.textAlign;

        const lines = project.text.content.split('\n');
        const lineHeight = project.text.fontSize * project.text.lineHeight;
        const totalTextHeight = lines.length * lineHeight;
        
        // Calculate text container width
        const containerWidth = (width * project.text.containerWidth) / 100;
        const paddingX = project.text.paddingX;

        let textX = width / 2;
        if (project.text.textAlign === 'left') textX = (width - containerWidth) / 2 + paddingX;
        if (project.text.textAlign === 'right') textX = (width + containerWidth) / 2 - paddingX;

        // Movie credits style: text scrolls from bottom to top
        const totalScrollDistance = height + totalTextHeight;
        let offsetY = 0;
        let offsetX = 0;

        if (project.animation.direction === 'up') {
          // Start at bottom of screen, scroll to above screen
          const startY = height;
          offsetY = startY - (progress * totalScrollDistance);
        } else if (project.animation.direction === 'left') {
          const textWidth = Math.max(...lines.map(l => ctx.measureText(l).width));
          const totalDistance = width + textWidth;
          offsetX = width - (progress * totalDistance);
        } else {
          const textWidth = Math.max(...lines.map(l => ctx.measureText(l).width));
          const totalDistance = width + textWidth;
          offsetX = -textWidth + (progress * totalDistance);
        }

        lines.forEach((line, i) => {
          const y = i * lineHeight + lineHeight + offsetY;
          const x = textX - offsetX;
          
          // Only draw if visible
          if (project.animation.direction === 'up') {
            if (y > -lineHeight && y < height + lineHeight) {
              if (project.text.letterSpacing !== 0) {
                drawTextWithLetterSpacing(ctx, line, x, y, project.text.letterSpacing, project.text.textAlign);
              } else {
                ctx.fillText(line, x, y);
              }
            }
          } else {
            if (project.text.letterSpacing !== 0) {
              drawTextWithLetterSpacing(ctx, line, x, y, project.text.letterSpacing, project.text.textAlign);
            } else {
              ctx.fillText(line, x, y);
            }
          }
        });

        // Update progress
        setExportState(prev => ({
          ...prev,
          progress: Math.round((frame / totalFrames) * 100),
        }));

        // Wait for next frame timing
        await new Promise(resolve => setTimeout(resolve, 1000 / fps / 2));
      }

      mediaRecorder.stop();
      const blob = await recordingPromise;

      // Download the video
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportState({ isExporting: false, progress: 100, error: null });
    } catch (error) {
      setExportState({
        isExporting: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Export failed',
      });
    }
  }, []);

  const cancelExport = useCallback(() => {
    abortRef.current = true;
  }, []);

  return {
    exportState,
    exportVideo,
    cancelExport,
  };
}

function drawTextWithLetterSpacing(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacing: number,
  textAlign: CanvasTextAlign
) {
  const chars = text.split('');
  let currentX = x;
  
  if (textAlign === 'center') {
    const totalWidth = chars.reduce((acc, char) => acc + ctx.measureText(char).width + letterSpacing, 0) - letterSpacing;
    currentX = x - totalWidth / 2;
  } else if (textAlign === 'right') {
    const totalWidth = chars.reduce((acc, char) => acc + ctx.measureText(char).width + letterSpacing, 0) - letterSpacing;
    currentX = x - totalWidth;
  }
  
  chars.forEach(char => {
    ctx.fillText(char, currentX, y);
    currentX += ctx.measureText(char).width + letterSpacing;
  });
}
