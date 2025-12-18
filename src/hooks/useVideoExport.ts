import { useState, useCallback, useRef } from 'react';
import { VideoProject, CANVAS_SIZES, ExportQuality, ExportFormat } from '@/types/video-project';
import { computeTimeline, computeScrollState, calculateScrollPosition, calculateRelativeFontSize, calculateTransitionOpacity } from '@/utils/timeline';
import { getScaledTextSettings } from '@/utils/textScaling';

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
      
      // Use unified timeline engine - SINGLE SOURCE OF TRUTH
      const timeline = computeTimeline(
        project.text.content,
        project.animation.wpmPreset,
        project.animation.wpmPreset === 'custom' ? project.animation.duration : null,
        project.ending.enabled,
        project.ending.duration
      );
      
      const totalDurationSec = timeline.totalDuration;
      const totalFrames = Math.ceil(totalDurationSec * fps);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;

      // Setup audio if present
      let audioContext: AudioContext | null = null;
      let audioBuffer: AudioBuffer | null = null;
      let audioDestination: MediaStreamAudioDestinationNode | null = null;
      
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

      // Calculate word count for auto-scaling
      const wordCount = project.text.content.split(/\s+/).filter(w => w.length > 0).length;
      
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
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.loop = project.audio.loop;
          
          const gainNode = audioContext.createGain();
          gainNode.gain.value = project.audio.volume / 100;
          
          source.connect(gainNode);
          gainNode.connect(audioDestination);
          source.start(0);
          
          const fadeStartTime = Math.max(0, timeline.totalDuration - 0.5);
          gainNode.gain.setValueAtTime(project.audio.volume / 100, audioContext.currentTime + fadeStartTime);
          gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + timeline.totalDuration);
        }
      } else {
        combinedStream = videoStream;
      }

      // Use MediaRecorder for fast export
      const mimeType = format === 'webm' ? 'video/webm;codecs=vp9' : 'video/webm;codecs=vp8';
      const mediaRecorder = new MediaRecorder(combinedStream, { 
        mimeType, 
        videoBitsPerSecond: bitrate 
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      const recordingPromise = new Promise<Blob>((resolve, reject) => {
        mediaRecorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
        mediaRecorder.onerror = (e) => reject(e);
      });

      mediaRecorder.start();

      // Render animation in real-time
      const startTime = performance.now();
      let lastFrameTime = 0;
      const frameDuration = 1000 / fps;
      
      const renderFrame = () => {
        if (abortRef.current) { 
          mediaRecorder.stop();
          if (audioContext) audioContext.close();
          throw new Error('Export cancelled'); 
        }

        const elapsed = (performance.now() - startTime) / 1000;
        const currentTimeSec = Math.min(elapsed, totalDurationSec);
        
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
