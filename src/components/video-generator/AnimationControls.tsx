import { ArrowUp, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { AnimationSettings, ScrollDirection } from '@/types/video-project';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface AnimationControlsProps {
  settings: AnimationSettings;
  onChange: (updates: Partial<AnimationSettings>) => void;
}

const directions: { value: ScrollDirection; icon: typeof ArrowUp; label: string }[] = [
  { value: 'up', icon: ArrowUp, label: 'Up' },
  { value: 'left', icon: ArrowLeft, label: 'Left' },
  { value: 'right', icon: ArrowRight, label: 'Right' },
];

export function AnimationControls({ settings, onChange }: AnimationControlsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Animation</h3>

      {/* Scroll Direction */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Scroll Direction</label>
        <div className="grid grid-cols-3 gap-2">
          {directions.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => onChange({ direction: value })}
              className={cn(
                'flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all',
                'hover:scale-105',
                settings.direction === value
                  ? 'border-secondary bg-secondary/10 text-secondary'
                  : 'border-border bg-muted/50 text-muted-foreground hover:border-secondary/50'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Speed Slider */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="text-xs font-medium text-muted-foreground">Speed</label>
          <span className="text-xs font-mono text-secondary">
            {settings.speed < 7 ? 'Slow' : settings.speed < 14 ? 'Medium' : 'Fast'}
          </span>
        </div>
        <Slider
          value={[settings.speed]}
          onValueChange={([v]) => onChange({ speed: v })}
          min={1}
          max={20}
          step={1}
          className="py-2"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>🐢 Slower</span>
          <span>🐇 Faster</span>
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="text-xs font-medium text-muted-foreground">Duration</label>
          <span className="text-xs font-mono text-secondary">{settings.duration}s</span>
        </div>
        <Slider
          value={[settings.duration]}
          onValueChange={([v]) => onChange({ duration: v })}
          min={5}
          max={60}
          step={5}
          className="py-2"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>5s</span>
          <span>60s</span>
        </div>
      </div>

      {/* Loop Toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-secondary" />
          <span className="text-sm font-medium">Loop Animation</span>
        </div>
        <Switch
          checked={settings.isLooping}
          onCheckedChange={(checked) => onChange({ isLooping: checked })}
        />
      </div>
    </div>
  );
}
