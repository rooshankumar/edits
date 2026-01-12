import { 
  Palette, Music, Stamp, Layers, Flag, ChevronDown, ChevronUp,
  X, Image as ImageIcon, Film, Smartphone, Monitor, Square, Instagram,
  Type as TypeIcon, Bold, Italic
} from 'lucide-react';
import { 
  VideoProject, BackgroundSettings, AudioSettings,
  WatermarkSettings, OverlayTextSettings, EndingSettings, TitleOverlaySettings, CutoutOverlaySettings,
  CANVAS_SIZES, CanvasFormat, VideoTheme, FONT_FAMILIES
} from '@/types/video-project';
import { useState, useRef } from 'react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AudioControls } from './AudioControls';
import { WatermarkControls } from './WatermarkControls';
import { OverlayControls } from './OverlayControls';
import { CutoutOverlayControls } from './CutoutOverlayControls';
import { EndingControls } from './EndingControls';
import { cn } from '@/lib/utils';

interface LeftEditorPanelProps {
  project: VideoProject;
  onBackgroundChange: (updates: Partial<BackgroundSettings>) => void;
  onAudioChange: (updates: Partial<AudioSettings>) => void;
  onWatermarkChange: (updates: Partial<WatermarkSettings>) => void;
  onOverlayChange: (updates: Partial<OverlayTextSettings>) => void;
  onCutoutOverlayChange: (updates: Partial<CutoutOverlaySettings>) => void;
  onEndingChange: (updates: Partial<EndingSettings>) => void;
  onCanvasFormatChange: (format: CanvasFormat) => void;
  onThemeChange: (theme: VideoTheme) => void;
  onTitleOverlayChange: (updates: Partial<TitleOverlaySettings>) => void;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string;
}

function Section({ title, icon, defaultOpen = false, children, badge }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between px-2 py-1.5 excel-hover bg-card border-b border-border transition-colors',
          isOpen && 'bg-excel-selected'
        )}
      >
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-[10px] font-semibold text-foreground">{title}</span>
          {badge && (
            <span className="px-1 py-0.5 text-[8px] font-medium bg-primary/10 text-primary rounded">{badge}</span>
          )}
        </div>
        {isOpen ? <ChevronUp className="w-2.5 h-2.5 text-muted-foreground" /> : <ChevronDown className="w-2.5 h-2.5 text-muted-foreground" />}
      </button>
      {isOpen && (
        <div className="p-2 space-y-2 bg-card">
          {children}
        </div>
      )}
    </div>
  );
}

const canvasOptions: { value: CanvasFormat; icon: typeof Smartphone }[] = [
  { value: 'vertical', icon: Smartphone },
  { value: 'horizontal', icon: Monitor },
  { value: 'square', icon: Square },
  { value: 'instagram-post', icon: Instagram },
];

// Extended solid color palette
const BG_COLORS = [
  // Dark tones
  '#000000', '#1a1a2e', '#0f0e17', '#16213e', '#1e1e1e', '#2d2d2d',
  // Grays
  '#374151', '#4b5563', '#6b7280', '#9ca3af',
  // Light tones
  '#f3f4f6', '#e5e7eb', '#ffffff',
  // Warm colors
  '#7f1d1d', '#991b1b', '#b91c1c', '#dc2626', '#ef4444',
  '#f97316', '#fb923c', '#fbbf24', '#facc15',
  // Cool colors
  '#14532d', '#166534', '#22c55e', '#4ade80',
  '#164e63', '#0e7490', '#06b6d4', '#22d3ee',
  '#1e3a8a', '#1d4ed8', '#3b82f6', '#60a5fa',
  '#581c87', '#7c3aed', '#8b5cf6', '#a78bfa',
  '#831843', '#be185d', '#ec4899', '#f472b6',
];

export function LeftEditorPanel({
  project,
  onBackgroundChange,
  onAudioChange,
  onWatermarkChange,
  onOverlayChange,
  onCutoutOverlayChange,
  onEndingChange,
  onCanvasFormatChange,
  onThemeChange,
  onTitleOverlayChange,
}: LeftEditorPanelProps) {
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

  return (
    <ScrollArea className="h-full min-h-0">
      <div className="divide-y divide-border">
        {/* FORMAT Section */}
        <Section title="Format" icon={<Smartphone className="w-3 h-3" />} defaultOpen={true}>
          <div className="grid grid-cols-4 gap-1">
            {canvasOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => onCanvasFormatChange(opt.value)}
                  title={CANVAS_SIZES[opt.value].label}
                  className={cn(
                    'p-1.5 flex items-center justify-center transition-all border rounded',
                    project.canvasFormat === opt.value
                      ? 'bg-primary/10 border-primary border-2'
                      : 'bg-card border-border hover:bg-muted/50'
                  )}
                >
                  <Icon className={cn('w-3.5 h-3.5', project.canvasFormat === opt.value ? 'text-primary' : 'text-muted-foreground')} />
                </button>
              );
            })}
          </div>
          <p className="text-[9px] text-muted-foreground text-center">
            {CANVAS_SIZES[project.canvasFormat].width}×{CANVAS_SIZES[project.canvasFormat].height}
          </p>
        </Section>

        {/* THEME Section */}
        <Section title="Theme" icon={<TypeIcon className="w-3 h-3" />} defaultOpen={true}>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => onThemeChange('vertical')}
              className={cn(
                'p-2 flex flex-col items-center gap-1 transition-all border rounded',
                project.theme === 'vertical'
                  ? 'bg-primary/10 border-primary border-2'
                  : 'bg-card border-border hover:bg-muted/50'
              )}
            >
              <TypeIcon className={cn('w-4 h-4', project.theme === 'vertical' ? 'text-primary' : 'text-muted-foreground')} />
              <span className="text-[9px]">Scroll</span>
            </button>
            <button
              onClick={() => onThemeChange('lyrics')}
              className={cn(
                'p-2 flex flex-col items-center gap-1 transition-all border rounded',
                project.theme === 'lyrics'
                  ? 'bg-primary/10 border-primary border-2'
                  : 'bg-card border-border hover:bg-muted/50'
              )}
            >
              <Music className={cn('w-4 h-4', project.theme === 'lyrics' ? 'text-primary' : 'text-muted-foreground')} />
              <span className="text-[9px]">Lyrics</span>
            </button>
          </div>
        </Section>

        {/* TITLE Section */}
        <Section title="Title" icon={<TypeIcon className="w-3 h-3" />} badge={project.titleOverlay.enabled ? 'ON' : undefined}>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold">Enable</span>
            <Switch checked={project.titleOverlay.enabled} onCheckedChange={(checked) => onTitleOverlayChange({ enabled: checked })} />
          </div>

          {project.titleOverlay.enabled && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px]">Use Project Name</span>
                <Switch checked={project.titleOverlay.useProjectName} onCheckedChange={(checked) => onTitleOverlayChange({ useProjectName: checked })} />
              </div>

              {!project.titleOverlay.useProjectName && (
                <Input
                  value={project.titleOverlay.content}
                  onChange={(e) => onTitleOverlayChange({ content: e.target.value })}
                  placeholder="Title..."
                  className="h-6 text-[10px] border-border"
                />
              )}

              {/* Title Font */}
              <Select value={project.titleOverlay.fontFamily} onValueChange={(v) => onTitleOverlayChange({ fontFamily: v })}>
                <SelectTrigger className="h-6 text-[9px] border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border max-h-[200px]">
                  {FONT_FAMILIES.map((font) => (
                    <SelectItem key={font.value} value={font.value} className="text-[10px]">
                      <span style={{ fontFamily: font.value }}>{font.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Title Style */}
              <div className="flex gap-0.5">
                <button onClick={() => onTitleOverlayChange({ isBold: !project.titleOverlay.isBold })} className={cn('flex-1 flex items-center justify-center py-1 border rounded transition-colors', project.titleOverlay.isBold ? 'border-primary bg-primary/10 border-2' : 'border-border hover:bg-muted/50')}>
                  <Bold className="w-3 h-3" />
                </button>
                <button onClick={() => onTitleOverlayChange({ isItalic: !project.titleOverlay.isItalic })} className={cn('flex-1 flex items-center justify-center py-1 border rounded transition-colors', project.titleOverlay.isItalic ? 'border-primary bg-primary/10 border-2' : 'border-border hover:bg-muted/50')}>
                  <Italic className="w-3 h-3" />
                </button>
              </div>

              {/* Size + Padding */}
              <div className="space-y-1">
                <label className="text-[8px] text-muted-foreground">Size: {project.titleOverlay.fontSize}</label>
                <Slider value={[project.titleOverlay.fontSize]} onValueChange={([v]) => onTitleOverlayChange({ fontSize: v })} min={14} max={96} step={2} />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] text-muted-foreground">Top: {project.titleOverlay.paddingY}</label>
                <Slider value={[project.titleOverlay.paddingY]} onValueChange={([v]) => onTitleOverlayChange({ paddingY: v })} min={0} max={120} step={2} />
              </div>

              {/* Title Colors */}
              <div className="space-y-1">
                <label className="text-[8px] text-muted-foreground">Color</label>
                <div className="flex items-center gap-1 flex-wrap">
                  <input type="color" value={project.titleOverlay.color} onChange={(e) => onTitleOverlayChange({ color: e.target.value })} className="w-5 h-5 border border-border cursor-pointer rounded" />
                  {['#ffffff', '#000000', '#ff6b6b', '#4ecdc4', '#ffe66d', '#a78bfa', '#f472b6'].map((color) => (
                    <button key={color} onClick={() => onTitleOverlayChange({ color })} className={cn('w-4 h-4 rounded border transition-transform hover:scale-110', project.titleOverlay.color === color ? 'border-primary border-2 ring-1 ring-primary/50' : 'border-border')} style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* BACKGROUND Section */}
        <Section title="BG" icon={<Palette className="w-3 h-3" />} defaultOpen={true}>
          {/* Color picker + presets */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <input
                type="color"
                value={project.background.color}
                onChange={(e) => onBackgroundChange({ color: e.target.value })}
                className="w-6 h-6 rounded border border-border cursor-pointer"
              />
              <span className="text-[9px] text-muted-foreground font-mono">{project.background.color}</span>
            </div>
            <div className="grid grid-cols-8 gap-0.5">
              {BG_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => onBackgroundChange({ color })}
                  className={cn(
                    'w-full aspect-square rounded border transition-transform hover:scale-110',
                    project.background.color.toLowerCase() === color.toLowerCase() ? 'border-primary border-2 ring-1 ring-primary/50' : 'border-border/50'
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => imageInputRef.current?.click()}
              className="flex items-center justify-center gap-1 py-1.5 rounded border border-border text-[9px] hover:bg-muted/50 transition-colors"
            >
              <ImageIcon className="w-3 h-3" /> Image
            </button>
            <button
              onClick={() => videoInputRef.current?.click()}
              className="flex items-center justify-center gap-1 py-1.5 rounded border border-border text-[9px] hover:bg-muted/50 transition-colors"
            >
              <Film className="w-3 h-3" /> Video
            </button>
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
          </div>

          {(project.background.image || project.background.video) && (
            <>
              <div className="relative rounded overflow-hidden border border-border">
                {project.background.image && <img src={project.background.image} alt="" className="w-full h-10 object-cover" />}
                {project.background.video && <video src={project.background.video} className="w-full h-10 object-cover" muted loop autoPlay />}
                <button onClick={() => onBackgroundChange({ image: null, video: null })} className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-destructive text-white hover:bg-destructive/80 transition-colors">
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[8px] text-muted-foreground">Blur: {project.background.blur}</label>
                  <Slider value={[project.background.blur]} onValueChange={([v]) => onBackgroundChange({ blur: v })} min={0} max={20} step={1} />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] text-muted-foreground">Opacity: {project.background.opacity}%</label>
                  <Slider value={[project.background.opacity]} onValueChange={([v]) => onBackgroundChange({ opacity: v })} min={0} max={100} step={5} />
                </div>
              </div>
            </>
          )}
        </Section>

        {/* AUDIO Section */}
        <Section title="Audio" icon={<Music className="w-3 h-3" />} badge={project.audio.file ? '♪' : undefined}>
          <AudioControls settings={project.audio} onChange={onAudioChange} />
        </Section>

        {/* WATERMARK Section */}
        <Section title="Mark" icon={<Stamp className="w-3 h-3" />} badge={project.watermark.enabled ? 'ON' : undefined}>
          <WatermarkControls settings={project.watermark} onChange={onWatermarkChange} />
        </Section>

        {/* OVERLAY Section */}
        <Section title="Over" icon={<Layers className="w-3 h-3" />} badge={project.overlay.enabled ? 'ON' : undefined}>
          <OverlayControls settings={project.overlay} onChange={onOverlayChange} />
        </Section>

        {/* CUTOUT Section */}
        <Section title="Cut" icon={<Layers className="w-3 h-3" />} badge={project.cutoutOverlay.enabled ? 'ON' : undefined}>
          <CutoutOverlayControls settings={project.cutoutOverlay} onChange={onCutoutOverlayChange} />
        </Section>

        {/* ENDING Section */}
        <Section title="End" icon={<Flag className="w-3 h-3" />} badge={project.ending.enabled ? 'ON' : undefined}>
          <EndingControls settings={project.ending} onChange={onEndingChange} />
        </Section>
      </div>
    </ScrollArea>
  );
}
