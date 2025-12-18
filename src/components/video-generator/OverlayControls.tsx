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
    <div className="space-y-2">
      {/* Enable Toggle */}
      <div className="flex items-center justify-between px-3 py-2 border border-border excel-hover">
        <span className="text-xs font-semibold">Show Overlay Text</span>
        <Switch
          checked={settings.enabled}
          onCheckedChange={(checked) => onChange({ enabled: checked })}
        />
      </div>

      {settings.enabled && (
        <div className="border border-border bg-card">
          {/* Text Input */}
          <div className="px-3 py-2 border-b border-border">
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Text Content</label>
            <Input
              value={settings.content}
              onChange={(e) => onChange({ content: e.target.value })}
              placeholder="Enter overlay text..."
              className="h-7 text-xs border-border"
            />
          </div>

          {/* Position */}
          <div className="px-3 py-2 border-b border-border">
            <label className="text-[10px] font-medium text-muted-foreground mb-2 block">Position</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['top', 'bottom'] as OverlayPosition[]).map((pos) => (
                <button
                  key={pos}
                  onClick={() => onChange({ position: pos })}
                  className={cn(
                    'py-1.5 text-xs font-medium transition-all capitalize border excel-hover',
                    settings.position === pos
                      ? 'bg-excel-selected border-primary border-2'
                      : 'bg-card border-border'
                  )}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="px-3 py-2 border-b border-border">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-medium text-muted-foreground">Font Size</label>
              <span className="text-[10px] font-semibold">{settings.fontSize}px</span>
            </div>
            <Slider
              value={[settings.fontSize]}
              onValueChange={([v]) => onChange({ fontSize: v })}
              min={12}
              max={48}
              step={2}
            />
          </div>

          {/* Colors */}
          <div className="px-3 py-2">
            <label className="text-[10px] font-medium text-muted-foreground mb-2 block">Colors</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Text</label>
                <input
                  type="color"
                  value={settings.color}
                  onChange={(e) => onChange({ color: e.target.value })}
                  className="w-full h-7 border border-border cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Background</label>
                <input
                  type="color"
                  value={settings.backgroundColor.startsWith('rgba') ? '#000000' : settings.backgroundColor}
                  onChange={(e) => onChange({ backgroundColor: e.target.value + '99' })}
                  className="w-full h-7 border border-border cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
