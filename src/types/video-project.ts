export type CanvasFormat = 'vertical' | 'horizontal' | 'square' | 'tiktok' | 'youtube-shorts' | 'instagram-post' | 'twitter' | 'facebook-cover';
export type VideoTheme = 'vertical' | 'lyrics';
export type LyricsPacingSource = 'wpm' | 'chars';
export type LyricsTimingSource = 'estimate' | 'lrc';
export type LyricsDisplayMode = 'lines' | 'paragraph' | 'pages' | 'full';
export type ScrollDirection = 'up' | 'left' | 'right';
export type TextAlign = 'left' | 'center' | 'right';
export type ExportQuality = 'standard' | 'hd' | 'ultra';
export type ExportFormat = 'mp4' | 'webm' | 'gif';
export type WatermarkPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type OverlayPosition = 'top' | 'bottom';
export type WPMPreset = 'beginner' | 'average' | 'comfortable' | 'fast' | 'custom';

export type TextMode = 'scroll' | 'pages';

export interface TextSettings {
  content: string;
  fontFamily: string;
  fontSize: number;
  autoScaleFont: boolean;
  isBold: boolean;
  isItalic: boolean;
  lineHeight: number;
  letterSpacing: number;
  textAlign: TextAlign;
  color: string;
  paddingX: number;
  paddingY: number;
  containerWidth: number;
  waveAnimation: boolean;
}

export interface PagedTextPage {
  id: string;
  text: string;
}

export interface SentenceTiming {
  sentenceId: string;
  text: string;
  pageId: string;
  startTime: number;
  endTime: number;
}

export interface PagedTextSettings {
  mode: TextMode;
  pages: PagedTextPage[];
  sentences: SentenceTiming[];
}

export interface BackgroundSettings {
  color: string;
  image: string | null;
  video: string | null;
  blur: number;
  opacity: number;
}

export interface AnimationSettings {
  direction: ScrollDirection;
  wpmPreset: WPMPreset;
  targetWPM: number;
  duration: number;
  isLooping: boolean;
}

export interface AudioSettings {
  file: string | null;
  fileName: string | null;
  duration: number | null;
  volume: number;
  loop: boolean;
}

export interface WatermarkSettings {
  enabled: boolean;
  image: string | null;
  position: WatermarkPosition;
  size: number;
  opacity: number;
  padding: number;
}

export interface OverlayTextSettings {
  enabled: boolean;
  content: string;
  position: OverlayPosition;
  fontSize: number;
  color: string;
  backgroundColor: string;
}

export interface EndingSettings {
  enabled: boolean;
  duration: number;
  ctaText: string;
  ctaFontSize: number;
  logo: string | null;
  logoSize: number;
  qrCode: string | null;
  qrSize: number;
  showLogo: boolean;
  showQR: boolean;
}

export interface LyricsThemeSettings {
  timingSource: LyricsTimingSource;
  karaokeLrc: string;
  displayMode: LyricsDisplayMode;
  autoFitLrcToAudio: boolean;
  lrcOffsetSeconds: number;
  highlightBgColor: string;
  pacingSource: LyricsPacingSource;
  charsPerSecond: number;
  minLineDuration: number;
  highlightLeadSeconds: number;
  highlightIntensity: number;
}

export interface VideoProject {
  id: string;
  name: string;
  theme: VideoTheme;
  lyrics: LyricsThemeSettings;
  canvasFormat: CanvasFormat;
  text: TextSettings;
  pagedText: PagedTextSettings;
  background: BackgroundSettings;
  animation: AnimationSettings;
  audio: AudioSettings;
  watermark: WatermarkSettings;
  overlay: OverlayTextSettings;
  ending: EndingSettings;
  createdAt: number;
  updatedAt: number;
}

export const CANVAS_SIZES: Record<CanvasFormat, { width: number; height: number; label: string }> = {
  vertical: { width: 1080, height: 1920, label: 'Reel 9:16' },
  horizontal: { width: 1920, height: 1080, label: 'Desktop 16:9' },
  square: { width: 1080, height: 1080, label: 'Square 1:1' },
  tiktok: { width: 1080, height: 1920, label: 'TikTok' },
  'youtube-shorts': { width: 1080, height: 1920, label: 'YT Shorts' },
  'instagram-post': { width: 1080, height: 1350, label: 'IG Post 4:5' },
  twitter: { width: 1280, height: 720, label: 'Twitter 16:9' },
  'facebook-cover': { width: 820, height: 312, label: 'FB Cover' },
};

export const PAGE_CHAR_LIMITS: Record<'vertical' | 'square' | 'horizontal', { min: number; max: number; recommended: number }> = {
  vertical: { min: 150, max: 180, recommended: 180 },
  square: { min: 180, max: 220, recommended: 220 },
  horizontal: { min: 260, max: 320, recommended: 320 },
};

export const WPM_PRESETS: Record<WPMPreset, { label: string; wpm: number; description: string }> = {
  beginner: { label: '🐢 Beginner', wpm: 150, description: 'Easy to follow (120-180 WPM)' },
  average: { label: '📖 Average', wpm: 225, description: 'Standard reading (200-250 WPM)' },
  comfortable: { label: '🚶 Comfortable', wpm: 275, description: 'Fluent reading (250-300 WPM)' },
  fast: { label: '🐇 Fast', wpm: 400, description: 'Quick scan (350-450 WPM)' },
  custom: { label: '⚙️ Custom', wpm: 200, description: 'Set your own speed' },
};

export const FONT_FAMILIES = [
  { name: 'Inter', value: 'Inter, sans-serif', category: 'readable' },
  { name: 'Poppins', value: 'Poppins, sans-serif', category: 'readable' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif', category: 'readable' },
  { name: 'Open Sans', value: 'Open Sans, sans-serif', category: 'readable' },
  { name: 'Roboto', value: 'Roboto, sans-serif', category: 'readable' },
  { name: 'Raleway', value: 'Raleway, sans-serif', category: 'readable' },
  { name: 'System UI', value: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', category: 'readable' },
  { name: 'Segoe UI', value: 'Segoe UI, system-ui, sans-serif', category: 'readable' },
  { name: 'Arial', value: 'Arial, Helvetica, sans-serif', category: 'readable' },
  { name: 'Helvetica', value: 'Helvetica, Arial, sans-serif', category: 'readable' },
  { name: 'Verdana', value: 'Verdana, Geneva, sans-serif', category: 'readable' },
  { name: 'Tahoma', value: 'Tahoma, Geneva, sans-serif', category: 'readable' },
  { name: 'Trebuchet MS', value: 'Trebuchet MS, Arial, sans-serif', category: 'readable' },
  { name: 'Playfair Display', value: 'Playfair Display, serif', category: 'elegant' },
  { name: 'Lora', value: 'Lora, serif', category: 'elegant' },
  { name: 'Georgia', value: 'Georgia, serif', category: 'elegant' },
  { name: 'Times New Roman', value: 'Times New Roman, Times, serif', category: 'elegant' },
  { name: 'Oswald', value: 'Oswald, sans-serif', category: 'display' },
  { name: 'Impact', value: 'Impact, Haettenschweiler, Arial Narrow Bold, sans-serif', category: 'display' },
  { name: 'Comic Sans', value: 'Comic Sans MS, Comic Sans, cursive', category: 'display' },
  { name: 'Dancing Script', value: 'Dancing Script, cursive', category: 'script' },
  { name: 'Courier New', value: 'Courier New, Courier, monospace', category: 'mono' },
  { name: 'Consolas', value: 'Consolas, Monaco, monospace', category: 'mono' },
];

export const DEFAULT_PROJECT: Omit<VideoProject, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Untitled Project',
  theme: 'vertical',
  lyrics: {
    timingSource: 'estimate',
    karaokeLrc: '',
    displayMode: 'lines',
    autoFitLrcToAudio: true,
    lrcOffsetSeconds: 0,
    highlightBgColor: '#FFD60A',
    pacingSource: 'chars',
    charsPerSecond: 14,
    minLineDuration: 1.4,
    highlightLeadSeconds: 0.08,
    highlightIntensity: 0.85,
  },
  canvasFormat: 'vertical',
  text: {
    content: 'Enter your scrolling text here...\n\nAdd multiple lines for a longer scroll effect.\n\nPerfect for social media reels and videos!',
    fontSize: 48,
    autoScaleFont: true,
    fontFamily: 'Poppins, sans-serif',
    isBold: false,
    isItalic: false,
    lineHeight: 1.6,
    letterSpacing: 0,
    textAlign: 'center',
    color: '#ffffff',
    paddingX: 18,
    paddingY: 40,
    containerWidth: 98,
    waveAnimation: false,
  },
  pagedText: {
    mode: 'scroll',
    pages: [{ id: 'p1', text: '' }],
    sentences: [],
  },
  background: {
    color: '#1a1a2e',
    image: null,
    video: null,
    blur: 0,
    opacity: 100,
  },
  animation: {
    direction: 'up',
    wpmPreset: 'beginner',
    targetWPM: 150,
    duration: 15,
    isLooping: true,
  },
  audio: {
    file: null,
    fileName: null,
    duration: null,
    volume: 80,
    loop: true,
  },
  watermark: {
    enabled: false,
    image: null,
    position: 'top-right',
    size: 80,
    opacity: 80,
    padding: 16,
  },
  overlay: {
    enabled: false,
    content: '',
    position: 'top',
    fontSize: 24,
    color: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  ending: {
    enabled: false,
    duration: 3,
    ctaText: 'Follow for more!',
    ctaFontSize: 32,
    logo: null,
    logoSize: 120,
    qrCode: null,
    qrSize: 100,
    showLogo: false,
    showQR: false,
  },
};

// Helper function to calculate duration from WPM
export function calculateDurationFromWPM(wordCount: number, targetWPM: number): number {
  if (wordCount === 0 || targetWPM === 0) return 10;
  return Math.max(5, Math.ceil((wordCount / targetWPM) * 60));
}

// Helper function to calculate WPM from duration
export function calculateWPMFromDuration(wordCount: number, duration: number): number {
  if (duration === 0) return 0;
  return Math.round((wordCount / duration) * 60);
}
