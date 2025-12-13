import { useState } from 'react';
import { 
  Type, Palette, Sparkles, Music, ChevronDown, ChevronUp, 
  Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  ArrowUp, ArrowLeft, ArrowRight, RotateCcw, Upload, X, Image as ImageIcon, Film
} from 'lucide-react';
import { 
  VideoProject, TextSettings, BackgroundSettings, AnimationSettings, AudioSettings,
  FONT_FAMILIES, CANVAS_SIZES, CanvasFormat 
} from '@/types/video-project';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AudioControls } from './AudioControls';
import { cn } from '@/lib/utils';
import { useRef } from 'react';

interface CompactEditorProps {
  project: VideoProject;
  onCanvasFormatChange: (format: CanvasFormat) => void;
  onTextChange: (updates: Partial<TextSettings>) => void;
  onBackgroundChange: (updates: Partial<BackgroundSettings>) => void;
  onAnimationChange: (updates: Partial<AnimationSettings>) => void;
  onAudioChange: (updates: Partial<AudioSettings>) => void;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  accentColor?: string;
}

function Section({ title, icon, defaultOpen = true, children, accentColor }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors',
          isOpen && 'bg-muted/30'
        )}
      >
        <div className="flex items-center gap-2">
          <div className={cn('text-muted-foreground', accentColor)}>{icon}</div>
          <span className="text-sm font-semibold">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {isOpen && (
        <div className="p-3 pt-0 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

const durationPresets = [5, 10, 15, 30, 45, 60];
const canvasOptions: { value: CanvasFormat; label: string }[] = [
  { value: 'vertical', label: 'Reel 9:16' },
  { value: 'horizontal', label: 'Desktop 16:9' },
  { value: 'square', label: 'Square 1:1' },
  { value: 'instagram-post', label: 'IG Post 4:5' },
];

export function CompactEditor({
  project,
  onCanvasFormatChange,
  onTextChange,
  onBackgroundChange,
  onAnimationChange,
  onAudioChange,
}: CompactEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onBackgroundChange({ image: event.target?.result as string, video: null });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onBackgroundChange({ video: event.target?.result as string, image: null });
      };
      reader.readAsDataURL(file);
    }
  };

  // Estimate reading speed
  const wordCount = project.text.content.split(/\s+/).filter(w => w.length > 0).length;
  const wordsPerMinute = Math.round((wordCount / project.animation.duration) * 60);

  return (
    <ScrollArea className="h-full">
      <div className="divide-y divide-border">
        {/* Canvas Format - Compact */}
        <div className="p-3">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Canvas Size</label>
          <div className="grid grid-cols-4 gap-1.5">
            {canvasOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onCanvasFormatChange(opt.value)}
                className={cn(
                  'px-2 py-1.5 rounded-md text-xs font-medium transition-all',
                  project.canvasFormat === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                )}
              >
                {opt.label.split(' ')[0]}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            {CANVAS_SIZES[project.canvasFormat].width} × {CANVAS_SIZES[project.canvasFormat].height}
          </p>
        </div>

        {/* TEXT Section */}
        <Section title="Text" icon={<Type className="w-4 h-4" />} accentColor="text-blue-500">
          {/* Text Input */}
          <Textarea
            value={project.text.content}
            onChange={(e) => onTextChange({ content: e.target.value })}
            placeholder="Enter your scrolling text..."
            className="min-h-[100px] resize-none bg-muted/50 text-sm"
          />
          <p className="text-[10px] text-muted-foreground text-right -mt-2">
            {wordCount} words • {project.text.content.length} chars
          </p>

          {/* Font + Size Row */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">Font</label>
              <Select value={project.text.fontFamily} onValueChange={(v) => onTextChange({ fontFamily: v })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_FAMILIES.map((font) => (
                    <SelectItem key={font.value} value={font.value} className="text-xs">
                      <span style={{ fontFamily: font.value }}>{font.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Size: {project.text.fontSize}px</label>
              <Slider
                value={[project.text.fontSize]}
                onValueChange={([v]) => onTextChange({ fontSize: v })}
                min={16}
                max={120}
                step={2}
                className="py-2"
              />
            </div>
          </div>

          {/* Bold / Italic / Align Row */}
          <div className="flex gap-1.5">
            <button
              onClick={() => onTextChange({ isBold: !project.text.isBold })}
              className={cn(
                'flex-1 flex items-center justify-center py-1.5 rounded-md border transition-all',
                project.text.isBold ? 'border-primary bg-primary/10 text-primary' : 'border-border'
              )}
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => onTextChange({ isItalic: !project.text.isItalic })}
              className={cn(
                'flex-1 flex items-center justify-center py-1.5 rounded-md border transition-all',
                project.text.isItalic ? 'border-primary bg-primary/10 text-primary' : 'border-border'
              )}
            >
              <Italic className="w-4 h-4" />
            </button>
            <div className="w-px bg-border mx-1" />
            {[
              { value: 'left' as const, icon: AlignLeft },
              { value: 'center' as const, icon: AlignCenter },
              { value: 'right' as const, icon: AlignRight },
            ].map(({ value, icon: Icon }) => (
              <button
                key={value}
                onClick={() => onTextChange({ textAlign: value })}
                className={cn(
                  'flex-1 flex items-center justify-center py-1.5 rounded-md border transition-all',
                  project.text.textAlign === value ? 'border-primary bg-primary/10 text-primary' : 'border-border'
                )}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          {/* Text Color */}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={project.text.color}
              onChange={(e) => onTextChange({ color: e.target.value })}
              className="w-8 h-8 rounded border-2 border-border cursor-pointer"
            />
            <div className="flex gap-1 flex-1">
              {['#ffffff', '#000000', '#ff6b6b', '#4ecdc4', '#ffe66d', '#a855f7'].map((color) => (
                <button
                  key={color}
                  onClick={() => onTextChange({ color })}
                  className={cn(
                    'w-6 h-6 rounded border-2 transition-all hover:scale-110',
                    project.text.color === color ? 'border-primary' : 'border-border'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Spacing Controls */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">Line Height: {project.text.lineHeight.toFixed(1)}</label>
              <Slider
                value={[project.text.lineHeight]}
                onValueChange={([v]) => onTextChange({ lineHeight: v })}
                min={1}
                max={3}
                step={0.1}
                className="py-1"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Letter Spacing: {project.text.letterSpacing}px</label>
              <Slider
                value={[project.text.letterSpacing]}
                onValueChange={([v]) => onTextChange({ letterSpacing: v })}
                min={-2}
                max={10}
                step={0.5}
                className="py-1"
              />
            </div>
          </div>

          {/* Padding Controls */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">Padding X: {project.text.paddingX}px</label>
              <Slider
                value={[project.text.paddingX]}
                onValueChange={([v]) => onTextChange({ paddingX: v })}
                min={0}
                max={200}
                step={5}
                className="py-1"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Padding Y: {project.text.paddingY}px</label>
              <Slider
                value={[project.text.paddingY]}
                onValueChange={([v]) => onTextChange({ paddingY: v })}
                min={0}
                max={200}
                step={5}
                className="py-1"
              />
            </div>
          </div>

          {/* Container Width */}
          <div>
            <label className="text-[10px] text-muted-foreground">Text Width: {project.text.containerWidth}%</label>
            <Slider
              value={[project.text.containerWidth]}
              onValueChange={([v]) => onTextChange({ containerWidth: v })}
              min={50}
              max={100}
              step={5}
              className="py-1"
            />
          </div>
        </Section>

        {/* ANIMATION Section */}
        <Section title="Animation" icon={<Sparkles className="w-4 h-4" />} accentColor="text-purple-500">
          {/* Direction */}
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { value: 'up' as const, icon: ArrowUp, label: '↑ Up' },
              { value: 'left' as const, icon: ArrowLeft, label: '← Left' },
              { value: 'right' as const, icon: ArrowRight, label: '→ Right' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onAnimationChange({ direction: value })}
                className={cn(
                  'py-2 rounded-md text-xs font-medium transition-all',
                  project.animation.direction === value
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Speed */}
          <div className="p-2 rounded-lg bg-muted/30">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium">
                Speed: {project.animation.speed < 7 ? '🐢 Slow' : project.animation.speed < 14 ? '🚶 Medium' : '🐇 Fast'}
              </span>
              <span className="text-sm font-bold text-secondary">{project.animation.speed}</span>
            </div>
            <Slider
              value={[project.animation.speed]}
              onValueChange={([v]) => onAnimationChange({ speed: v })}
              min={1}
              max={20}
              step={1}
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              ~{wordsPerMinute} words/min reading pace
            </p>
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs font-medium mb-1.5 block">Duration: {project.animation.duration}s</label>
            <div className="flex flex-wrap gap-1 mb-2">
              {durationPresets.map((preset) => (
                <button
                  key={preset}
                  onClick={() => onAnimationChange({ duration: preset })}
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium transition-all',
                    project.animation.duration === preset
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  )}
                >
                  {preset}s
                </button>
              ))}
            </div>
            <Slider
              value={[project.animation.duration]}
              onValueChange={([v]) => onAnimationChange({ duration: v })}
              min={3}
              max={120}
              step={1}
            />
          </div>

          {/* Loop */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium">Loop Animation</span>
            </div>
            <Switch
              checked={project.animation.isLooping}
              onCheckedChange={(checked) => onAnimationChange({ isLooping: checked })}
            />
          </div>
        </Section>

        {/* BACKGROUND Section */}
        <Section title="Background" icon={<Palette className="w-4 h-4" />} defaultOpen={false} accentColor="text-green-500">
          {/* Color */}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={project.background.color}
              onChange={(e) => onBackgroundChange({ color: e.target.value })}
              className="w-8 h-8 rounded border-2 border-border cursor-pointer"
            />
            <div className="flex gap-1 flex-1 flex-wrap">
              {['#1a1a2e', '#0f0e17', '#16213e', '#2d132c', '#000000', '#ffffff'].map((color) => (
                <button
                  key={color}
                  onClick={() => onBackgroundChange({ color })}
                  className={cn(
                    'w-6 h-6 rounded border-2 transition-all hover:scale-110',
                    project.background.color === color ? 'border-primary' : 'border-border'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Upload buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => imageInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 py-2 rounded-md border border-border text-xs hover:bg-muted/50"
            >
              <ImageIcon className="w-3 h-3" />
              Image
            </button>
            <button
              onClick={() => videoInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 py-2 rounded-md border border-border text-xs hover:bg-muted/50"
            >
              <Film className="w-3 h-3" />
              Video
            </button>
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
          </div>

          {/* Media Preview */}
          {(project.background.image || project.background.video) && (
            <>
              <div className="relative rounded-md overflow-hidden border border-border">
                {project.background.image && (
                  <img src={project.background.image} alt="" className="w-full h-16 object-cover" />
                )}
                {project.background.video && (
                  <video src={project.background.video} className="w-full h-16 object-cover" muted loop autoPlay />
                )}
                <button
                  onClick={() => onBackgroundChange({ image: null, video: null })}
                  className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-white text-xs"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground">Blur: {project.background.blur}px</label>
                  <Slider
                    value={[project.background.blur]}
                    onValueChange={([v]) => onBackgroundChange({ blur: v })}
                    min={0}
                    max={20}
                    step={1}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Opacity: {project.background.opacity}%</label>
                  <Slider
                    value={[project.background.opacity]}
                    onValueChange={([v]) => onBackgroundChange({ opacity: v })}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>
              </div>
            </>
          )}
        </Section>

        {/* AUDIO Section */}
        <Section title="Audio" icon={<Music className="w-4 h-4" />} defaultOpen={false} accentColor="text-orange-500">
          <AudioControls settings={project.audio} onChange={onAudioChange} />
        </Section>
      </div>
    </ScrollArea>
  );
}
