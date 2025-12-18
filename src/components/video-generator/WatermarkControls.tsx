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
    <div className="space-y-2">
      {/* Enable Toggle */}
      <div className="flex items-center justify-between px-3 py-2 border border-border excel-hover">
        <span className="text-xs font-semibold">Show Watermark</span>
        <Switch
          checked={settings.enabled}
          onCheckedChange={(checked) => onChange({ enabled: checked })}
        />
      </div>

      {settings.enabled && (
        <div className="border border-border bg-card">
          {/* Upload Logo */}
          {!settings.image ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3 px-3 border-b border-dashed border-border text-xs font-medium hover:bg-excel-hover transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Logo
            </button>
          ) : (
            <div className="relative border-b border-border">
              <img src={settings.image} alt="Watermark" className="w-full h-16 object-contain bg-excel-grid p-2" />
              <button
                onClick={() => onChange({ image: null })}
                className="absolute top-1 right-1 p-1 bg-destructive text-white hover:bg-destructive/90"
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
          <div className="px-3 py-2 border-b border-border">
            <label className="text-[10px] font-medium text-muted-foreground mb-2 block">Position</label>
            <div className="grid grid-cols-4 gap-1">
              {positions.map((pos) => (
                <button
                  key={pos.value}
                  onClick={() => onChange({ position: pos.value })}
                  className={cn(
                    'py-1.5 text-[10px] font-medium transition-all border excel-hover',
                    settings.position === pos.value
                      ? 'bg-excel-selected border-primary border-2'
                      : 'bg-card border-border'
                  )}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="px-3 py-2 border-b border-border">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-medium text-muted-foreground">Size</label>
              <span className="text-[10px] font-semibold">{settings.size}px</span>
            </div>
            <Slider
              value={[settings.size]}
              onValueChange={([v]) => onChange({ size: v })}
              min={30}
              max={200}
              step={5}
            />
          </div>

          {/* Opacity */}
          <div className="px-3 py-2 border-b border-border">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-medium text-muted-foreground">Opacity</label>
              <span className="text-[10px] font-semibold">{settings.opacity}%</span>
            </div>
            <Slider
              value={[settings.opacity]}
              onValueChange={([v]) => onChange({ opacity: v })}
              min={10}
              max={100}
              step={5}
            />
          </div>

          {/* Padding */}
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-medium text-muted-foreground">Padding</label>
              <span className="text-[10px] font-semibold">{settings.padding}px</span>
            </div>
            <Slider
              value={[settings.padding]}
              onValueChange={([v]) => onChange({ padding: v })}
              min={0}
              max={50}
              step={2}
            />
          </div>
        </div>
      )}
    </div>
  );
}
