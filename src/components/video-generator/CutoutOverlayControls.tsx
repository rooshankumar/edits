import { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { CutoutOverlaySettings } from '@/types/video-project';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

interface CutoutOverlayControlsProps {
  settings: CutoutOverlaySettings;
  onChange: (updates: Partial<CutoutOverlaySettings>) => void;
}

export function CutoutOverlayControls({ settings, onChange }: CutoutOverlayControlsProps) {
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
      <div className="flex items-center justify-between px-3 py-2 border border-border excel-hover">
        <span className="text-xs font-semibold">Show Cutout</span>
        <Switch checked={settings.enabled} onCheckedChange={(checked) => onChange({ enabled: checked })} />
      </div>

      {settings.enabled && (
        <div className="border border-border bg-card">
          {!settings.image ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3 px-3 border-b border-dashed border-border text-xs font-medium hover:bg-excel-hover transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Cutout
            </button>
          ) : (
            <div className="relative border-b border-border">
              <img src={settings.image} alt="Cutout" className="w-full h-20 object-contain bg-excel-grid p-2" />
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

          <div className="px-3 py-2 border-b border-border">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-medium text-muted-foreground">Width</label>
              <span className="text-[10px] font-semibold">{settings.widthPercent}%</span>
            </div>
            <Slider
              value={[settings.widthPercent]}
              onValueChange={([v]) => onChange({ widthPercent: v })}
              min={10}
              max={120}
              step={1}
            />
          </div>

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

          <div className="px-3 py-2 border-b border-border">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-medium text-muted-foreground">Horizontal</label>
              <span className="text-[10px] font-semibold">{settings.offsetXPercent}%</span>
            </div>
            <Slider
              value={[settings.offsetXPercent]}
              onValueChange={([v]) => onChange({ offsetXPercent: v })}
              min={-50}
              max={50}
              step={1}
            />
          </div>

          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-medium text-muted-foreground">Vertical</label>
              <span className="text-[10px] font-semibold">{settings.offsetYPercent}%</span>
            </div>
            <Slider
              value={[settings.offsetYPercent]}
              onValueChange={([v]) => onChange({ offsetYPercent: v })}
              min={-50}
              max={50}
              step={1}
            />
          </div>
        </div>
      )}
    </div>
  );
}
