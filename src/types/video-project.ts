export type CanvasFormat = 'vertical' | 'horizontal' | 'square' | 'tiktok' | 'youtube-shorts' | 'instagram-post' | 'twitter' | 'facebook-cover';
export type ScrollDirection = 'up' | 'left' | 'right';
export type TextAlign = 'left' | 'center' | 'right';
export type ExportQuality = 'standard' | 'hd' | 'ultra';

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

export interface VideoProject {
  id: string;
  name: string;
  canvasFormat: CanvasFormat;
  text: TextSettings;
  background: BackgroundSettings;
  animation: AnimationSettings;
  createdAt: number;
  updatedAt: number;
}

export const CANVAS_SIZES: Record<CanvasFormat, { width: number; height: number; label: string }> = {
  vertical: { width: 1080, height: 1920, label: 'Vertical (9:16)' },
  horizontal: { width: 1920, height: 1080, label: 'Horizontal (16:9)' },
  square: { width: 1080, height: 1080, label: 'Square (1:1)' },
  tiktok: { width: 1080, height: 1920, label: 'TikTok' },
  'youtube-shorts': { width: 1080, height: 1920, label: 'YouTube Shorts' },
  'instagram-post': { width: 1080, height: 1350, label: 'Instagram Post (4:5)' },
  twitter: { width: 1280, height: 720, label: 'Twitter/X (16:9)' },
  'facebook-cover': { width: 820, height: 312, label: 'Facebook Cover' },
};

export const FONT_FAMILIES = [
  // Sans-serif
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Poppins', value: 'Poppins, sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Quicksand', value: 'Quicksand, sans-serif' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif' },
  // Serif
  { name: 'Playfair Display', value: 'Playfair Display, serif' },
  { name: 'Cinzel', value: 'Cinzel, serif' },
  { name: 'Abril Fatface', value: 'Abril Fatface, serif' },
  // Display
  { name: 'Bebas Neue', value: 'Bebas Neue, sans-serif' },
  { name: 'Righteous', value: 'Righteous, sans-serif' },
  { name: 'Russo One', value: 'Russo One, sans-serif' },
  { name: 'Bangers', value: 'Bangers, cursive' },
  { name: 'Orbitron', value: 'Orbitron, sans-serif' },
  { name: 'Press Start 2P', value: 'Press Start 2P, cursive' },
  // Script/Handwritten
  { name: 'Dancing Script', value: 'Dancing Script, cursive' },
  { name: 'Pacifico', value: 'Pacifico, cursive' },
  { name: 'Caveat', value: 'Caveat, cursive' },
  { name: 'Lobster', value: 'Lobster, cursive' },
  { name: 'Permanent Marker', value: 'Permanent Marker, cursive' },
  { name: 'Shadows Into Light', value: 'Shadows Into Light, cursive' },
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
    lineHeight: 1.5,
    letterSpacing: 0,
    textAlign: 'center',
    color: '#ffffff',
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
    speed: 10,
    duration: 15,
    isLooping: true,
  },
};
