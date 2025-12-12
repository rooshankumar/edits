import { ArrowUp, ArrowLeft, ArrowRight, RotateCcw, Clock, Zap } from 'lucide-react';
import { AnimationSettings, ScrollDirection } from '@/types/video-project';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
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

const durationPresets = [5, 10, 15, 30, 45, 60];

export function AnimationControls({ settings, onChange }: AnimationControlsProps) {
  return (
    <div className="space-y-5">
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

      {/* Speed Control - Enhanced */}
      <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-secondary/5 to-accent/5 border border-secondary/20">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-secondary" />
          <label className="text-sm font-semibold text-foreground">Scroll Speed</label>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {settings.speed < 7 ? '🐢 Slow' : settings.speed < 14 ? '🚶 Medium' : '🐇 Fast'}
            </span>
            <span className="text-lg font-bold text-secondary">{settings.speed}</span>
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
            <span>1 (Slowest)</span>
            <span>20 (Fastest)</span>
          </div>
        </div>
      </div>

      {/* Video Duration - Enhanced */}
      <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <label className="text-sm font-semibold text-foreground">Video Length</label>
        </div>
        
        {/* Quick Presets */}
        <div className="grid grid-cols-6 gap-1.5">
          {durationPresets.map((preset) => (
            <button
              key={preset}
              onClick={() => onChange({ duration: preset })}
              className={cn(
                'py-1.5 px-2 rounded-lg text-xs font-medium transition-all',
                settings.duration === preset
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              )}
            >
              {preset}s
            </button>
          ))}
        </div>

        {/* Custom Duration Input */}
        <div className="flex items-center gap-2">
          <Slider
            value={[settings.duration]}
            onValueChange={([v]) => onChange({ duration: v })}
            min={3}
            max={120}
            step={1}
            className="flex-1 py-2"
          />
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={settings.duration}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (v >= 3 && v <= 120) onChange({ duration: v });
              }}
              className="w-16 h-8 text-center text-sm font-mono"
              min={3}
              max={120}
            />
            <span className="text-xs text-muted-foreground">sec</span>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">Range: 3 seconds to 2 minutes</p>
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
