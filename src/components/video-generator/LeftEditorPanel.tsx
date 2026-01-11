import { 
  Palette, Music, Stamp, Layers, Flag, ChevronDown, ChevronUp,
  X, Image as ImageIcon, Film
} from 'lucide-react';
import { 
  VideoProject, BackgroundSettings, AudioSettings,
  WatermarkSettings, OverlayTextSettings, EndingSettings
} from '@/types/video-project';
import { useState, useRef } from 'react';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AudioControls } from './AudioControls';
import { WatermarkControls } from './WatermarkControls';
import { OverlayControls } from './OverlayControls';
import { EndingControls } from './EndingControls';
import { cn } from '@/lib/utils';

interface LeftEditorPanelProps {
  project: VideoProject;
  onBackgroundChange: (updates: Partial<BackgroundSettings>) => void;
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
  badge?: string;
}

function Section({ title, icon, defaultOpen = false, children, badge }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between px-2 py-1.5 excel-hover bg-card border-b border-border',
          isOpen && 'bg-excel-selected'
        )}
      >
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-[10px] font-semibold text-foreground">{title}</span>
          {badge && (
            <span className="px-1 py-0.5 text-[8px] font-medium bg-primary/10 text-primary">{badge}</span>
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

export function LeftEditorPanel({
  project,
  onBackgroundChange,
  onAudioChange,
  onWatermarkChange,
  onOverlayChange,
  onEndingChange,
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
        {/* BACKGROUND Section */}
        <Section title="BG" icon={<Palette className="w-3 h-3" />} defaultOpen={true}>
          <div className="flex items-center gap-1">
            <input
              type="color"
              value={project.background.color}
              onChange={(e) => onBackgroundChange({ color: e.target.value })}
              className="w-5 h-5 rounded border border-border cursor-pointer"
            />
            <div className="flex gap-0.5 flex-1 flex-wrap">
              {['#1a1a2e', '#0f0e17', '#16213e', '#000000', '#ffffff'].map((color) => (
                <button
                  key={color}
                  onClick={() => onBackgroundChange({ color })}
                  className={cn(
                    'w-4 h-4 rounded border transition-all hover:scale-110',
                    project.background.color === color ? 'border-primary border-2' : 'border-border'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => imageInputRef.current?.click()}
              className="flex items-center justify-center gap-1 py-1 rounded border border-border text-[9px] hover:bg-muted/50"
            >
              <ImageIcon className="w-2.5 h-2.5" /> Img
            </button>
            <button
              onClick={() => videoInputRef.current?.click()}
              className="flex items-center justify-center gap-1 py-1 rounded border border-border text-[9px] hover:bg-muted/50"
            >
              <Film className="w-2.5 h-2.5" /> Vid
            </button>
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
          </div>

          {(project.background.image || project.background.video) && (
            <>
              <div className="relative rounded overflow-hidden border border-border">
                {project.background.image && <img src={project.background.image} alt="" className="w-full h-8 object-cover" />}
                {project.background.video && <video src={project.background.video} className="w-full h-8 object-cover" muted loop autoPlay />}
                <button onClick={() => onBackgroundChange({ image: null, video: null })} className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-destructive text-white">
                  <X className="w-2 h-2" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div>
                  <label className="text-[8px] text-muted-foreground">Blur</label>
                  <Slider value={[project.background.blur]} onValueChange={([v]) => onBackgroundChange({ blur: v })} min={0} max={20} step={1} />
                </div>
                <div>
                  <label className="text-[8px] text-muted-foreground">Opacity</label>
                  <Slider value={[project.background.opacity]} onValueChange={([v]) => onBackgroundChange({ opacity: v })} min={0} max={100} step={5} />
                </div>
              </div>
            </>
          )}
        </Section>

        {/* AUDIO Section */}
        <Section title="Audio" icon={<Music className="w-3 h-3" />} defaultOpen={true} badge={project.audio.file ? '♪' : undefined}>
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

        {/* ENDING Section */}
        <Section title="End" icon={<Flag className="w-3 h-3" />} badge={project.ending.enabled ? 'ON' : undefined}>
          <EndingControls settings={project.ending} onChange={onEndingChange} />
        </Section>
      </div>
    </ScrollArea>
  );
}
