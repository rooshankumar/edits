import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let isLoaded = false;

export type ExportFormat = 'mp4' | 'webm' | 'gif';

export interface FFmpegExportOptions {
  format: ExportFormat;
  width: number;
  height: number;
  fps: number;
  videoBitrate: string;
  audioBitrate?: string;
  audioSampleRate?: number;
}

export const EXPORT_PRESETS = {
  mp4: {
    codec: 'libx264',
    pixelFormat: 'yuv420p',
    preset: 'medium',
    videoBitrate: '10M',
    audioBitrate: '160k',
    audioSampleRate: 44100,
  },
  webm: {
    codec: 'libvpx-vp9',
    pixelFormat: 'yuv420p',
    videoBitrate: '8M',
    audioBitrate: '128k',
    audioSampleRate: 44100,
  },
  gif: {
    fps: 15,
    maxColors: 256,
  },
};

export async function loadFFmpeg(onProgress?: (progress: number) => void): Promise<FFmpeg> {
  if (ffmpegInstance && isLoaded) {
    return ffmpegInstance;
  }

  if (!ffmpegInstance) {
    ffmpegInstance = new FFmpeg();
    
    ffmpegInstance.on('log', ({ message }) => {
      console.log('[FFmpeg]', message);
    });

    if (onProgress) {
      ffmpegInstance.on('progress', ({ progress }) => {
        onProgress(Math.round(progress * 100));
      });
    }
  }

  if (!isLoaded) {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpegInstance.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    isLoaded = true;
  }

  return ffmpegInstance;
}

export async function encodeVideoWithFFmpeg(
  frames: Blob[],
  audioBlob: Blob | null,
  options: FFmpegExportOptions,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const ffmpeg = await loadFFmpeg(onProgress);

  try {
    // Write frames to FFmpeg virtual filesystem
    for (let i = 0; i < frames.length; i++) {
      const frameData = await fetchFile(frames[i]);
      await ffmpeg.writeFile(`frame${String(i).padStart(5, '0')}.png`, frameData);
    }

    // Write audio if present
    if (audioBlob) {
      const audioData = await fetchFile(audioBlob);
      await ffmpeg.writeFile('audio.webm', audioData);
    }

    // Build FFmpeg command based on format
    const inputArgs = [
      '-framerate', options.fps.toString(),
      '-i', 'frame%05d.png',
    ];

    const outputArgs: string[] = [];

    if (options.format === 'mp4') {
      outputArgs.push(
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-pix_fmt', 'yuv420p',
        '-b:v', options.videoBitrate,
        '-movflags', '+faststart'
      );

      if (audioBlob && options.audioBitrate) {
        outputArgs.push(
          '-i', 'audio.webm',
          '-c:a', 'aac',
          '-b:a', options.audioBitrate,
          '-ar', options.audioSampleRate?.toString() || '44100',
          '-shortest'
        );
      }
    } else if (options.format === 'webm') {
      outputArgs.push(
        '-c:v', 'libvpx-vp9',
        '-b:v', options.videoBitrate,
        '-pix_fmt', 'yuv420p'
      );

      if (audioBlob && options.audioBitrate) {
        outputArgs.push(
          '-i', 'audio.webm',
          '-c:a', 'libopus',
          '-b:a', options.audioBitrate,
          '-shortest'
        );
      }
    } else if (options.format === 'gif') {
      outputArgs.push(
        '-vf', `fps=${options.fps},scale=${options.width}:${options.height}:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer`,
        '-loop', '0'
      );
    }

    const outputFile = `output.${options.format}`;
    await ffmpeg.exec([...inputArgs, ...outputArgs, outputFile]);

    // Read the output file
    const data = await ffmpeg.readFile(outputFile);
    const blob = new Blob([data], { 
      type: options.format === 'mp4' ? 'video/mp4' : 
            options.format === 'webm' ? 'video/webm' : 
            'image/gif' 
    });

    // Cleanup
    for (let i = 0; i < frames.length; i++) {
      await ffmpeg.deleteFile(`frame${String(i).padStart(5, '0')}.png`);
    }
    if (audioBlob) {
      await ffmpeg.deleteFile('audio.webm');
    }
    await ffmpeg.deleteFile(outputFile);

    return blob;
  } catch (error) {
    console.error('FFmpeg encoding error:', error);
    throw new Error(`Video encoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function isFFmpegSupported(): boolean {
  return typeof SharedArrayBuffer !== 'undefined';
}
