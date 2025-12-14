import { useRef } from 'react';
import { Image, X, Upload } from 'lucide-react';
import { WatermarkSettings, WatermarkPosition } from '@/types/video-project';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface WatermarkControlsProps {
  settings: WatermarkSettings;
  onChange: (updates: Partial<WatermarkSettings>) => void;
}

const positions: { value: WatermarkPosition; label: string }[] = [
  { value: 'top-left', label: '↖ TL' },
  { value: 'top-right', label: '↗ TR' },
  { value: 'bottom-left', label: '↙ BL' },
  { value: 'bottom-right', label: '↘ BR' },
];

export function WatermarkControls({ settings, onChange }: WatermarkControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange({ image: event.target?.result as string, enabled: true });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-3">
      {/* Enable Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">Show Watermark</span>
        <Switch
          checked={settings.enabled}
          onCheckedChange={(checked) => onChange({ enabled: checked })}
        />
      </div>

      {settings.enabled && (
        <>
          {/* Upload Logo */}
          {!settings.image ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed border-border text-xs hover:border-primary/50 hover:bg-muted/30 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Logo
            </button>
          ) : (
            <div className="relative rounded-lg overflow-hidden border border-border">
              <img src={settings.image} alt="Watermark" className="w-full h-12 object-contain bg-muted/30 p-2" />
              <button
                onClick={() => onChange({ image: null })}
                className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Position */}
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Position</label>
            <div className="grid grid-cols-4 gap-1">
              {positions.map((pos) => (
                <button
                  key={pos.value}
                  onClick={() => onChange({ position: pos.value })}
                  className={cn(
                    'py-1.5 rounded text-[10px] font-medium transition-all',
                    settings.position === pos.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  )}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size & Opacity */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">Size: {settings.size}px</label>
              <Slider
                value={[settings.size]}
                onValueChange={([v]) => onChange({ size: v })}
                min={30}
                max={200}
                step={5}
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Opacity: {settings.opacity}%</label>
              <Slider
                value={[settings.opacity]}
                onValueChange={([v]) => onChange({ opacity: v })}
                min={10}
                max={100}
                step={5}
              />
            </div>
          </div>

          {/* Padding */}
          <div>
            <label className="text-[10px] text-muted-foreground">Padding: {settings.padding}px</label>
            <Slider
              value={[settings.padding]}
              onValueChange={([v]) => onChange({ padding: v })}
              min={0}
              max={50}
              step={2}
            />
          </div>
        </>
      )}
    </div>
  );
}
