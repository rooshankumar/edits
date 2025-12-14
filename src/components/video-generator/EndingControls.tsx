import { useRef } from 'react';
import { Upload, X, QrCode, Image } from 'lucide-react';
import { EndingSettings } from '@/types/video-project';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

interface EndingControlsProps {
  settings: EndingSettings;
  onChange: (updates: Partial<EndingSettings>) => void;
}

export function EndingControls({ settings, onChange }: EndingControlsProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange({ logo: event.target?.result as string, showLogo: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQRUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange({ qrCode: event.target?.result as string, showQR: true });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-3">
      {/* Enable Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">Add Ending Card</span>
        <Switch
          checked={settings.enabled}
          onCheckedChange={(checked) => onChange({ enabled: checked })}
        />
      </div>

      {settings.enabled && (
        <>
          {/* CTA Text */}
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Call to Action</label>
            <Input
              value={settings.ctaText}
              onChange={(e) => onChange({ ctaText: e.target.value })}
              placeholder="Follow for more!"
              className="h-8 text-xs"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="text-[10px] text-muted-foreground">Duration: {settings.duration}s</label>
            <Slider
              value={[settings.duration]}
              onValueChange={([v]) => onChange({ duration: v })}
              min={2}
              max={10}
              step={1}
            />
          </div>

          {/* Logo Upload */}
          <div className="flex items-center gap-2">
            <Switch
              checked={settings.showLogo}
              onCheckedChange={(checked) => onChange({ showLogo: checked })}
            />
            <span className="text-xs flex-1">Show Logo</span>
            {settings.showLogo && (
              settings.logo ? (
                <div className="relative w-10 h-10 rounded border border-border overflow-hidden">
                  <img src={settings.logo} alt="Logo" className="w-full h-full object-contain bg-muted/30" />
                  <button
                    onClick={() => onChange({ logo: null })}
                    className="absolute -top-1 -right-1 p-0.5 rounded-full bg-destructive text-white"
                  >
                    <X className="w-2 h-2" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="p-2 rounded border border-dashed border-border hover:border-primary/50"
                >
                  <Image className="w-4 h-4" />
                </button>
              )
            )}
          </div>
          <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />

          {/* QR Upload */}
          <div className="flex items-center gap-2">
            <Switch
              checked={settings.showQR}
              onCheckedChange={(checked) => onChange({ showQR: checked })}
            />
            <span className="text-xs flex-1">Show QR Code</span>
            {settings.showQR && (
              settings.qrCode ? (
                <div className="relative w-10 h-10 rounded border border-border overflow-hidden">
                  <img src={settings.qrCode} alt="QR" className="w-full h-full object-contain bg-white" />
                  <button
                    onClick={() => onChange({ qrCode: null })}
                    className="absolute -top-1 -right-1 p-0.5 rounded-full bg-destructive text-white"
                  >
                    <X className="w-2 h-2" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => qrInputRef.current?.click()}
                  className="p-2 rounded border border-dashed border-border hover:border-primary/50"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              )
            )}
          </div>
          <input ref={qrInputRef} type="file" accept="image/*" onChange={handleQRUpload} className="hidden" />
        </>
      )}
    </div>
  );
}
