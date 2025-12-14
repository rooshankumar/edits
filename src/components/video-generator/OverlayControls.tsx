import { OverlayTextSettings, OverlayPosition } from '@/types/video-project';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface OverlayControlsProps {
  settings: OverlayTextSettings;
  onChange: (updates: Partial<OverlayTextSettings>) => void;
}

export function OverlayControls({ settings, onChange }: OverlayControlsProps) {
  return (
    <div className="space-y-3">
      {/* Enable Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">Show Overlay Text</span>
        <Switch
          checked={settings.enabled}
          onCheckedChange={(checked) => onChange({ enabled: checked })}
        />
      </div>

      {settings.enabled && (
        <>
          {/* Text Input */}
          <Input
            value={settings.content}
            onChange={(e) => onChange({ content: e.target.value })}
            placeholder="Enter overlay text..."
            className="h-8 text-xs"
          />

          {/* Position */}
          <div className="grid grid-cols-2 gap-1">
            {(['top', 'bottom'] as OverlayPosition[]).map((pos) => (
              <button
                key={pos}
                onClick={() => onChange({ position: pos })}
                className={cn(
                  'py-1.5 rounded text-xs font-medium transition-all capitalize',
                  settings.position === pos
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                )}
              >
                {pos}
              </button>
            ))}
          </div>

          {/* Font Size */}
          <div>
            <label className="text-[10px] text-muted-foreground">Size: {settings.fontSize}px</label>
            <Slider
              value={[settings.fontSize]}
              onValueChange={([v]) => onChange({ fontSize: v })}
              min={12}
              max={48}
              step={2}
            />
          </div>

          {/* Colors */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground block mb-1">Text</label>
              <input
                type="color"
                value={settings.color}
                onChange={(e) => onChange({ color: e.target.value })}
                className="w-full h-7 rounded border border-border cursor-pointer"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground block mb-1">Background</label>
              <input
                type="color"
                value={settings.backgroundColor.startsWith('rgba') ? '#000000' : settings.backgroundColor}
                onChange={(e) => onChange({ backgroundColor: e.target.value + '99' })}
                className="w-full h-7 rounded border border-border cursor-pointer"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
