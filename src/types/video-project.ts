export type CanvasFormat = 'vertical' | 'horizontal' | 'square';
export type ScrollDirection = 'up' | 'left' | 'right';
export type ExportQuality = 'standard' | 'hd' | 'ultra';

export interface CanvasSize {
  width: number;
  height: number;
  label: string;
}

export const CANVAS_SIZES: Record<CanvasFormat, CanvasSize> = {
  vertical: { width: 1080, height: 1920, label: 'Vertical (9:16)' },
  horizontal: { width: 1920, height: 1080, label: 'Horizontal (16:9)' },
  square: { width: 1080, height: 1080, label: 'Square (1:1)' },
};

export const FONT_FAMILIES = [
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Poppins', value: 'Poppins, sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Open Sans', value: 'Open Sans, sans-serif' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif' },
  { name: 'Playfair Display', value: 'Playfair Display, serif' },
  { name: 'Lora', value: 'Lora, serif' },
  { name: 'Oswald', value: 'Oswald, sans-serif' },
  { name: 'Raleway', value: 'Raleway, sans-serif' },
  { name: 'Dancing Script', value: 'Dancing Script, cursive' },
];

export interface TextSettings {
  content: string;
  fontSize: number;
  fontFamily: string;
  isBold: boolean;
  isItalic: boolean;
  lineHeight: number;
  letterSpacing: number;
  textAlign: 'left' | 'center' | 'right';
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
  createdAt: number;
  updatedAt: number;
  canvasFormat: CanvasFormat;
  text: TextSettings;
  background: BackgroundSettings;
  animation: AnimationSettings;
}

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
