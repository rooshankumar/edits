export type CanvasFormat = 'vertical' | 'horizontal' | 'square' | 'tiktok' | 'youtube-shorts' | 'instagram-post' | 'twitter' | 'facebook-cover';
export type ScrollDirection = 'up' | 'left' | 'right';
export type TextAlign = 'left' | 'center' | 'right';
export type ExportQuality = 'standard' | 'hd' | 'ultra';
export type ExportFormat = 'webm' | 'gif';

export interface TextSettings {
  content: string;
  fontFamily: string;
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  lineHeight: number;
  letterSpacing: number;
  textAlign: TextAlign;
  color: string;
  paddingX: number;
  paddingY: number;
  containerWidth: number;
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
  speed: number;
  duration: number;
  isLooping: boolean;
}

export interface AudioSettings {
  file: string | null;
  fileName: string | null;
  volume: number;
  loop: boolean;
}

export interface VideoProject {
  id: string;
  name: string;
  canvasFormat: CanvasFormat;
  text: TextSettings;
  background: BackgroundSettings;
  animation: AnimationSettings;
  audio: AudioSettings;
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

export const FONT_FAMILIES = [
  // Clean & Readable (Best for educational content)
  { name: 'Inter', value: 'Inter, sans-serif', category: 'readable' },
  { name: 'Poppins', value: 'Poppins, sans-serif', category: 'readable' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif', category: 'readable' },
  { name: 'Open Sans', value: 'Open Sans, sans-serif', category: 'readable' },
  { name: 'Roboto', value: 'Roboto, sans-serif', category: 'readable' },
  { name: 'Quicksand', value: 'Quicksand, sans-serif', category: 'readable' },
  { name: 'Raleway', value: 'Raleway, sans-serif', category: 'readable' },
  // Elegant
  { name: 'Playfair Display', value: 'Playfair Display, serif', category: 'elegant' },
  { name: 'Lora', value: 'Lora, serif', category: 'elegant' },
  { name: 'Cinzel', value: 'Cinzel, serif', category: 'elegant' },
  // Display / Bold
  { name: 'Bebas Neue', value: 'Bebas Neue, sans-serif', category: 'display' },
  { name: 'Oswald', value: 'Oswald, sans-serif', category: 'display' },
  { name: 'Righteous', value: 'Righteous, sans-serif', category: 'display' },
  { name: 'Russo One', value: 'Russo One, sans-serif', category: 'display' },
  { name: 'Bangers', value: 'Bangers, cursive', category: 'display' },
  { name: 'Orbitron', value: 'Orbitron, sans-serif', category: 'display' },
  // Script
  { name: 'Dancing Script', value: 'Dancing Script, cursive', category: 'script' },
  { name: 'Pacifico', value: 'Pacifico, cursive', category: 'script' },
  { name: 'Caveat', value: 'Caveat, cursive', category: 'script' },
  { name: 'Lobster', value: 'Lobster, cursive', category: 'script' },
  { name: 'Permanent Marker', value: 'Permanent Marker, cursive', category: 'script' },
  { name: 'Shadows Into Light', value: 'Shadows Into Light, cursive', category: 'script' },
];

export const DEFAULT_PROJECT: Omit<VideoProject, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Untitled Project',
  canvasFormat: 'vertical',
  text: {
    content: 'Enter your scrolling text here...\n\nAdd multiple lines for a longer scroll effect.\n\nPerfect for social media reels and videos!',
    fontSize: 48,
    fontFamily: 'Poppins, sans-serif',
    isBold: false,
    isItalic: false,
    lineHeight: 1.6,
    letterSpacing: 0,
    textAlign: 'center',
    color: '#ffffff',
    paddingX: 40,
    paddingY: 40,
    containerWidth: 90,
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
    speed: 5,
    duration: 15,
    isLooping: true,
  },
  audio: {
    file: null,
    fileName: null,
    volume: 80,
    loop: true,
  },
};
