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
    <div className="space-y-2">
      {/* Enable Toggle */}
      <div className="flex items-center justify-between px-3 py-2 border border-border excel-hover">
        <span className="text-xs font-semibold">Add Ending Card</span>
        <Switch
          checked={settings.enabled}
          onCheckedChange={(checked) => onChange({ enabled: checked })}
        />
      </div>

      {settings.enabled && (
        <div className="border border-border bg-card">
          {/* CTA Text */}
          <div className="px-3 py-2 border-b border-border">
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Call to Action</label>
            <Input
              value={settings.ctaText}
              onChange={(e) => onChange({ ctaText: e.target.value })}
              placeholder="Follow for more!"
              className="h-7 text-xs border-border mb-2"
            />
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[9px] text-muted-foreground">Text Size</label>
                <span className="text-[9px] font-semibold">{settings.ctaFontSize}px</span>
              </div>
              <Slider
                value={[settings.ctaFontSize]}
                onValueChange={([v]) => onChange({ ctaFontSize: v })}
                min={16}
                max={80}
                step={2}
              />
            </div>
          </div>

          {/* Duration */}
          <div className="px-3 py-2 border-b border-border">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-medium text-muted-foreground">Duration</label>
              <span className="text-[10px] font-semibold">{settings.duration}s</span>
            </div>
            <Slider
              value={[settings.duration]}
              onValueChange={([v]) => onChange({ duration: v })}
              min={2}
              max={10}
              step={1}
            />
          </div>

          {/* Logo Upload */}
          <div className="px-3 py-2 border-b border-border">
            <div className="flex items-center gap-2 mb-2">
              <Switch
                checked={settings.showLogo}
                onCheckedChange={(checked) => onChange({ showLogo: checked })}
              />
              <span className="text-xs font-medium flex-1">Show Logo</span>
              {settings.showLogo && (
                settings.logo ? (
                  <div className="relative w-12 h-12 border border-border overflow-hidden">
                    <img src={settings.logo} alt="Logo" className="w-full h-full object-contain bg-excel-grid p-1" />
                    <button
                      onClick={() => onChange({ logo: null })}
                      className="absolute -top-1 -right-1 p-0.5 bg-destructive text-white"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="p-2 border border-dashed border-border hover:bg-excel-hover"
                  >
                    <Image className="w-4 h-4" />
                  </button>
                )
              )}
            </div>
            {settings.showLogo && settings.logo && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[9px] text-muted-foreground">Logo Size</label>
                  <span className="text-[9px] font-semibold">{settings.logoSize}px</span>
                </div>
                <Slider
                  value={[settings.logoSize]}
                  onValueChange={([v]) => onChange({ logoSize: v })}
                  min={60}
                  max={300}
                  step={10}
                />
              </div>
            )}
          </div>
          <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />

          {/* QR Upload */}
          <div className="px-3 py-2 excel-hover">
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.showQR}
                onCheckedChange={(checked) => onChange({ showQR: checked })}
              />
              <span className="text-xs font-medium flex-1">Show QR Code</span>
              {settings.showQR && (
                settings.qrCode ? (
                  <div className="relative w-12 h-12 border border-border overflow-hidden">
                    <img src={settings.qrCode} alt="QR" className="w-full h-full object-contain bg-white p-1" />
                    <button
                      onClick={() => onChange({ qrCode: null })}
                      className="absolute -top-1 -right-1 p-0.5 bg-destructive text-white"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => qrInputRef.current?.click()}
                    className="p-2 border border-dashed border-border hover:bg-excel-hover"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                )
              )}
            </div>
            {settings.showQR && settings.qrCode && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[9px] text-muted-foreground">QR Size</label>
                  <span className="text-[9px] font-semibold">{settings.qrSize}px</span>
                </div>
                <Slider
                  value={[settings.qrSize]}
                  onValueChange={([v]) => onChange({ qrSize: v })}
                  min={60}
                  max={200}
                  step={10}
                />
              </div>
            )}
          </div>
          <input ref={qrInputRef} type="file" accept="image/*" onChange={handleQRUpload} className="hidden" />
        </div>
      )}
    </div>
  );
}
