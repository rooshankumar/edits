import { useState, useRef } from 'react';
import { 
  Type, Palette, Sparkles, Music, ChevronDown, ChevronUp, 
  Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  ArrowUp, ArrowLeft, ArrowRight, RotateCcw, X, Image as ImageIcon, Film,
  Stamp, Layers, Flag, AlertTriangle
} from 'lucide-react';
import { 
  VideoProject, TextSettings, BackgroundSettings, AnimationSettings, AudioSettings,
  WatermarkSettings, OverlayTextSettings, EndingSettings,
  FONT_FAMILIES, CANVAS_SIZES, CanvasFormat, WPMPreset, WPM_PRESETS
} from '@/types/video-project';
import { TimelineState, getWPMLevel } from '@/utils/timeline';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AudioControls } from './AudioControls';
import { WatermarkControls } from './WatermarkControls';
import { OverlayControls } from './OverlayControls';
import { EndingControls } from './EndingControls';
import { cn } from '@/lib/utils';

interface CompactEditorProps {
  project: VideoProject;
  timeline: TimelineState;
  onCanvasFormatChange: (format: CanvasFormat) => void;
  onTextChange: (updates: Partial<TextSettings>) => void;
  onBackgroundChange: (updates: Partial<BackgroundSettings>) => void;
  onAnimationChange: (updates: Partial<AnimationSettings>) => void;
  onAudioChange: (updates: Partial<AudioSettings>) => void;
  onWatermarkChange: (updates: Partial<WatermarkSettings>) => void;
  onOverlayChange: (updates: Partial<OverlayTextSettings>) => void;
  onEndingChange: (updates: Partial<EndingSettings>) => void;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  accentColor?: string;
  badge?: string;
}

function Section({ title, icon, defaultOpen = true, children, accentColor, badge }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between p-2 hover:bg-muted/50 transition-colors',
          isOpen && 'bg-muted/30'
        )}
      >
        <div className="flex items-center gap-1.5">
          <div className={cn('text-muted-foreground', accentColor)}>{icon}</div>
          <span className="text-xs font-semibold">{title}</span>
          {badge && (
            <span className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-primary/10 text-primary">{badge}</span>
          )}
        </div>
        {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {isOpen && (
        <div className="p-2 pt-0 space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}

const durationPresets = [5, 10, 15, 30, 60];
const canvasOptions: { value: CanvasFormat; label: string }[] = [
  { value: 'vertical', label: 'Reel' },
  { value: 'horizontal', label: 'Desktop' },
  { value: 'square', label: 'Square' },
  { value: 'instagram-post', label: 'IG' },
];

export function CompactEditor({
  project,
  timeline,
  onCanvasFormatChange,
  onTextChange,
  onBackgroundChange,
  onAnimationChange,
  onAudioChange,
  onWatermarkChange,
  onOverlayChange,
  onEndingChange,
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

  // WPM level for color coding
  const wpmLevel = getWPMLevel(timeline.targetWPM);

  return (
    <ScrollArea className="h-full">
      <div className="divide-y divide-border">
        {/* Canvas Format - Ultra Compact */}
        <div className="p-2">
          <div className="grid grid-cols-4 gap-1">
            {canvasOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onCanvasFormatChange(opt.value)}
                className={cn(
                  'px-1.5 py-1 rounded text-[10px] font-medium transition-all',
                  project.canvasFormat === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-muted-foreground mt-1 text-center">
            {CANVAS_SIZES[project.canvasFormat].width}×{CANVAS_SIZES[project.canvasFormat].height}
          </p>
        </div>

        {/* TEXT Section */}
        <Section title="Text" icon={<Type className="w-3 h-3" />} accentColor="text-blue-500">
          <Textarea
            value={project.text.content}
            onChange={(e) => onTextChange({ content: e.target.value })}
            placeholder="Enter your scrolling text..."
            className="min-h-[80px] resize-none bg-muted/50 text-xs"
          />
          <p className="text-[9px] text-muted-foreground text-right">
            {timeline.wordCount} words
          </p>

          {/* Font + Size */}
          <div className="grid grid-cols-2 gap-1.5">
            <Select value={project.text.fontFamily} onValueChange={(v) => onTextChange({ fontFamily: v })}>
              <SelectTrigger className="h-7 text-[10px]">
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
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-muted-foreground w-6">{project.text.fontSize}</span>
              <Slider
                value={[project.text.fontSize]}
                onValueChange={([v]) => onTextChange({ fontSize: v })}
                min={16}
                max={120}
                step={2}
                className="flex-1"
              />
            </div>
          </div>

          {/* Style buttons */}
          <div className="flex gap-1">
            <button
              onClick={() => onTextChange({ isBold: !project.text.isBold })}
              className={cn(
                'flex-1 flex items-center justify-center py-1 rounded border transition-all',
                project.text.isBold ? 'border-primary bg-primary/10' : 'border-border'
              )}
            >
              <Bold className="w-3 h-3" />
            </button>
            <button
              onClick={() => onTextChange({ isItalic: !project.text.isItalic })}
              className={cn(
                'flex-1 flex items-center justify-center py-1 rounded border transition-all',
                project.text.isItalic ? 'border-primary bg-primary/10' : 'border-border'
              )}
            >
              <Italic className="w-3 h-3" />
            </button>
            <div className="w-px bg-border" />
            {[
              { value: 'left' as const, icon: AlignLeft },
              { value: 'center' as const, icon: AlignCenter },
              { value: 'right' as const, icon: AlignRight },
            ].map(({ value, icon: Icon }) => (
              <button
                key={value}
                onClick={() => onTextChange({ textAlign: value })}
                className={cn(
                  'flex-1 flex items-center justify-center py-1 rounded border transition-all',
                  project.text.textAlign === value ? 'border-primary bg-primary/10' : 'border-border'
                )}
              >
                <Icon className="w-3 h-3" />
              </button>
            ))}
          </div>

          {/* Color */}
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={project.text.color}
              onChange={(e) => onTextChange({ color: e.target.value })}
              className="w-6 h-6 rounded border border-border cursor-pointer"
            />
            <div className="flex gap-1 flex-1">
              {['#ffffff', '#000000', '#ff6b6b', '#4ecdc4', '#ffe66d'].map((color) => (
                <button
                  key={color}
                  onClick={() => onTextChange({ color })}
                  className={cn(
                    'w-5 h-5 rounded border transition-all hover:scale-110',
                    project.text.color === color ? 'border-primary border-2' : 'border-border'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Spacing */}
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="text-[9px] text-muted-foreground">Line: {project.text.lineHeight.toFixed(1)}</label>
              <Slider value={[project.text.lineHeight]} onValueChange={([v]) => onTextChange({ lineHeight: v })} min={1} max={3} step={0.1} />
            </div>
            <div>
              <label className="text-[9px] text-muted-foreground">Letter: {project.text.letterSpacing}px</label>
              <Slider value={[project.text.letterSpacing]} onValueChange={([v]) => onTextChange({ letterSpacing: v })} min={-2} max={10} step={0.5} />
            </div>
          </div>

          {/* Padding */}
          <div className="grid grid-cols-3 gap-1.5">
            <div>
              <label className="text-[9px] text-muted-foreground">Pad X: {project.text.paddingX}</label>
              <Slider value={[project.text.paddingX]} onValueChange={([v]) => onTextChange({ paddingX: v })} min={0} max={200} step={5} />
            </div>
            <div>
              <label className="text-[9px] text-muted-foreground">Pad Y: {project.text.paddingY}</label>
              <Slider value={[project.text.paddingY]} onValueChange={([v]) => onTextChange({ paddingY: v })} min={0} max={200} step={5} />
            </div>
            <div>
              <label className="text-[9px] text-muted-foreground">Width: {project.text.containerWidth}%</label>
              <Slider value={[project.text.containerWidth]} onValueChange={([v]) => onTextChange({ containerWidth: v })} min={50} max={100} step={5} />
            </div>
          </div>
        </Section>

        {/* ANIMATION Section - WPM Based */}
        <Section title="Animation" icon={<Sparkles className="w-3 h-3" />} accentColor="text-purple-500">
          {/* Direction */}
          <div className="grid grid-cols-3 gap-1">
            {[
              { value: 'up' as const, label: '↑' },
              { value: 'left' as const, label: '←' },
              { value: 'right' as const, label: '→' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onAnimationChange({ direction: value })}
                className={cn(
                  'py-1.5 rounded text-xs font-medium transition-all',
                  project.animation.direction === value
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* WPM Display with Color Coding */}
          <div className="p-2 rounded-lg bg-muted/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium">Reading Speed</span>
              <div className="flex items-center gap-1">
                {wpmLevel === 'danger' && <AlertTriangle className="w-3 h-3 text-red-500" />}
                <span className={cn(
                  'text-xs font-bold',
                  wpmLevel === 'good' && 'text-green-500',
                  wpmLevel === 'warning' && 'text-yellow-500',
                  wpmLevel === 'danger' && 'text-red-500',
                )}>
                  {timeline.targetWPM} WPM
                </span>
              </div>
            </div>
            
            {/* WPM Presets */}
            <div className="grid grid-cols-2 gap-1">
              {(Object.keys(WPM_PRESETS) as WPMPreset[]).filter(p => p !== 'custom').map((preset) => (
                <button
                  key={preset}
                  onClick={() => onAnimationChange({ wpmPreset: preset })}
                  className={cn(
                    'py-1 rounded text-[10px] font-medium transition-all',
                    project.animation.wpmPreset === preset
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  )}
                >
                  {WPM_PRESETS[preset].label}
                </button>
              ))}
            </div>
            
            <p className="text-[9px] text-muted-foreground text-center">
              {project.animation.wpmPreset !== 'custom' 
                ? WPM_PRESETS[project.animation.wpmPreset].description 
                : 'Manual duration control'}
            </p>

            {/* Auto-calculated duration display */}
            <div className="text-center py-1 px-2 rounded bg-primary/5 border border-primary/20">
              <span className="text-[10px] text-muted-foreground">Auto duration: </span>
              <span className="text-xs font-bold text-primary">{timeline.contentDuration}s</span>
              {timeline.endingDuration > 0 && (
                <span className="text-[10px] text-muted-foreground"> + {timeline.endingDuration}s ending</span>
              )}
            </div>
          </div>

          {/* Manual Duration Override */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-medium">Manual Override</label>
              <button
                onClick={() => onAnimationChange({ wpmPreset: 'custom' })}
                className={cn(
                  'text-[9px] px-1.5 py-0.5 rounded',
                  project.animation.wpmPreset === 'custom' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                )}
              >
                Custom
              </button>
            </div>
            
            {project.animation.wpmPreset === 'custom' && (
              <>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {durationPresets.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => onAnimationChange({ duration: preset })}
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-medium transition-all',
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
                <p className="text-[9px] text-muted-foreground mt-0.5">{project.animation.duration}s</p>
              </>
            )}
          </div>

          {/* Loop */}
          <div className="flex items-center justify-between py-0.5">
            <div className="flex items-center gap-1.5">
              <RotateCcw className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] font-medium">Loop</span>
            </div>
            <Switch
              checked={project.animation.isLooping}
              onCheckedChange={(checked) => onAnimationChange({ isLooping: checked })}
            />
          </div>
        </Section>

        {/* BACKGROUND Section */}
        <Section title="Background" icon={<Palette className="w-3 h-3" />} defaultOpen={false} accentColor="text-green-500">
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={project.background.color}
              onChange={(e) => onBackgroundChange({ color: e.target.value })}
              className="w-6 h-6 rounded border border-border cursor-pointer"
            />
            <div className="flex gap-1 flex-1 flex-wrap">
              {['#1a1a2e', '#0f0e17', '#16213e', '#000000', '#ffffff'].map((color) => (
                <button
                  key={color}
                  onClick={() => onBackgroundChange({ color })}
                  className={cn(
                    'w-5 h-5 rounded border transition-all hover:scale-110',
                    project.background.color === color ? 'border-primary border-2' : 'border-border'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => imageInputRef.current?.click()}
              className="flex items-center justify-center gap-1 py-1.5 rounded border border-border text-[10px] hover:bg-muted/50"
            >
              <ImageIcon className="w-3 h-3" /> Image
            </button>
            <button
              onClick={() => videoInputRef.current?.click()}
              className="flex items-center justify-center gap-1 py-1.5 rounded border border-border text-[10px] hover:bg-muted/50"
            >
              <Film className="w-3 h-3" /> Video
            </button>
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
          </div>

          {(project.background.image || project.background.video) && (
            <>
              <div className="relative rounded overflow-hidden border border-border">
                {project.background.image && <img src={project.background.image} alt="" className="w-full h-12 object-cover" />}
                {project.background.video && <video src={project.background.video} className="w-full h-12 object-cover" muted loop autoPlay />}
                <button onClick={() => onBackgroundChange({ image: null, video: null })} className="absolute top-1 right-1 p-0.5 rounded-full bg-destructive text-white">
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="text-[9px] text-muted-foreground">Blur: {project.background.blur}px</label>
                  <Slider value={[project.background.blur]} onValueChange={([v]) => onBackgroundChange({ blur: v })} min={0} max={20} step={1} />
                </div>
                <div>
                  <label className="text-[9px] text-muted-foreground">Opacity: {project.background.opacity}%</label>
                  <Slider value={[project.background.opacity]} onValueChange={([v]) => onBackgroundChange({ opacity: v })} min={0} max={100} step={5} />
                </div>
              </div>
            </>
          )}
        </Section>

        {/* AUDIO Section */}
        <Section title="Audio" icon={<Music className="w-3 h-3" />} defaultOpen={true} accentColor="text-orange-500" badge={project.audio.file ? '♪' : undefined}>
          <AudioControls settings={project.audio} onChange={onAudioChange} />
        </Section>

        {/* WATERMARK Section */}
        <Section title="Watermark" icon={<Stamp className="w-3 h-3" />} defaultOpen={false} accentColor="text-pink-500" badge={project.watermark.enabled ? 'ON' : undefined}>
          <WatermarkControls settings={project.watermark} onChange={onWatermarkChange} />
        </Section>

        {/* OVERLAY Section */}
        <Section title="Overlay" icon={<Layers className="w-3 h-3" />} defaultOpen={false} accentColor="text-cyan-500" badge={project.overlay.enabled ? 'ON' : undefined}>
          <OverlayControls settings={project.overlay} onChange={onOverlayChange} />
        </Section>

        {/* ENDING Section */}
        <Section title="Ending" icon={<Flag className="w-3 h-3" />} defaultOpen={false} accentColor="text-yellow-500" badge={project.ending.enabled ? 'ON' : undefined}>
          <EndingControls settings={project.ending} onChange={onEndingChange} />
        </Section>
      </div>
    </ScrollArea>
  );
}
