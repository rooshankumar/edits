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
  const [exportState, setExportState] = useState<ExportState>({ isExporting: false, progress: 0, error: null });
  const abortRef = useRef(false);

  const exportVideo = useCallback(async (project: VideoProject, previewRef: HTMLDivElement, quality: ExportQuality = 'hd') => {
    abortRef.current = false;
    setExportState({ isExporting: true, progress: 0, error: null });

    try {
      const { width, height } = CANVAS_SIZES[project.canvasFormat];
      const { bitrate, fps } = QUALITY_SETTINGS[quality];
      
      // Use project duration directly - this is the fix for duration consistency
      const mainDuration = project.animation.duration;
      const endingDuration = project.ending.enabled ? project.ending.duration : 0;
      const totalDurationMs = (mainDuration + endingDuration) * 1000;
      const totalFrames = Math.ceil((totalDurationMs / 1000) * fps);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;

      const stream = canvas.captureStream(fps);
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: bitrate });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      const recordingPromise = new Promise<Blob>((resolve, reject) => {
        mediaRecorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
        mediaRecorder.onerror = (e) => reject(e);
      });

      mediaRecorder.start();

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

      // Render frames
      for (let frame = 0; frame < totalFrames; frame++) {
        if (abortRef.current) { mediaRecorder.stop(); throw new Error('Export cancelled'); }

        const currentTimeSec = frame / fps;
        const isEnding = project.ending.enabled && currentTimeSec >= mainDuration;
        const scrollProgress = isEnding ? 1 : (mainDuration > 0 ? currentTimeSec / mainDuration : 0);

        // Background
        ctx.fillStyle = project.background.color;
        ctx.fillRect(0, 0, width, height);

        if (bgImage?.complete) {
          ctx.save();
          ctx.globalAlpha = project.background.opacity / 100;
          if (project.background.blur > 0) ctx.filter = `blur(${project.background.blur}px)`;
          const scale = Math.max(width / bgImage.width, height / bgImage.height);
          const x = (width - bgImage.width * scale) / 2;
          const y = (height - bgImage.height * scale) / 2;
          ctx.drawImage(bgImage, x, y, bgImage.width * scale, bgImage.height * scale);
          ctx.restore();
        }

        if (!isEnding) {
          // Draw scrolling text
          ctx.fillStyle = project.text.color;
          ctx.font = `${project.text.isItalic ? 'italic ' : ''}${project.text.isBold ? 'bold ' : ''}${project.text.fontSize}px ${project.text.fontFamily}`;
          ctx.textAlign = project.text.textAlign;

          const lines = project.text.content.split('\n');
          const lineHeight = project.text.fontSize * project.text.lineHeight;
          const totalTextHeight = lines.length * lineHeight;
          const containerWidth = (width * project.text.containerWidth) / 100;
          const paddingX = project.text.paddingX;

          let textX = width / 2;
          if (project.text.textAlign === 'left') textX = (width - containerWidth) / 2 + paddingX;
          if (project.text.textAlign === 'right') textX = (width + containerWidth) / 2 - paddingX;

          const totalScrollDistance = height + totalTextHeight;
          let offsetY = height - (scrollProgress * totalScrollDistance);

          lines.forEach((line, i) => {
            const y = i * lineHeight + lineHeight + offsetY;
            if (y > -lineHeight && y < height + lineHeight) {
              ctx.fillText(line, textX, y);
            }
          });
        } else {
          // Draw ending card
          ctx.textAlign = 'center';
          ctx.fillStyle = project.text.color;
          
          let yPos = height / 2 - 50;
          
          if (endingLogo?.complete) {
            const logoSize = Math.min(width * 0.3, 200);
            const logoAspect = endingLogo.width / endingLogo.height;
            const logoW = logoSize;
            const logoH = logoSize / logoAspect;
            ctx.drawImage(endingLogo, (width - logoW) / 2, yPos - logoH, logoW, logoH);
            yPos += 20;
          }

          ctx.font = `bold ${Math.round(project.text.fontSize * 1.2)}px ${project.text.fontFamily}`;
          ctx.fillText(project.ending.ctaText, width / 2, yPos + 30);

          if (endingQR?.complete) {
            const qrSize = 100;
            ctx.drawImage(endingQR, (width - qrSize) / 2, yPos + 60, qrSize, qrSize);
          }
        }

        // Overlay text
        if (project.overlay.enabled && project.overlay.content) {
          ctx.fillStyle = project.overlay.backgroundColor;
          const overlayH = project.overlay.fontSize + 20;
          const overlayY = project.overlay.position === 'top' ? 0 : height - overlayH;
          ctx.fillRect(0, overlayY, width, overlayH);
          ctx.fillStyle = project.overlay.color;
          ctx.font = `${project.overlay.fontSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(project.overlay.content, width / 2, overlayY + overlayH / 2 + project.overlay.fontSize / 3);
        }

        // Watermark
        if (watermarkImage?.complete && project.watermark.enabled) {
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

        setExportState(prev => ({ ...prev, progress: Math.round((frame / totalFrames) * 100) }));
        await new Promise(resolve => setTimeout(resolve, 1000 / fps / 2));
      }

      mediaRecorder.stop();
      const blob = await recordingPromise;

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
      setExportState({ isExporting: false, progress: 0, error: error instanceof Error ? error.message : 'Export failed' });
    }
  }, []);

  const cancelExport = useCallback(() => { abortRef.current = true; }, []);

  return { exportState, exportVideo, cancelExport };
}
