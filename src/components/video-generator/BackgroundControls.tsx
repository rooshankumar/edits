import { useRef } from 'react';
import { Upload, X, Image as ImageIcon, Film } from 'lucide-react';
import { BackgroundSettings } from '@/types/video-project';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

interface BackgroundControlsProps {
  settings: BackgroundSettings;
  onChange: (updates: Partial<BackgroundSettings>) => void;
}

export function BackgroundControls({ settings, onChange }: BackgroundControlsProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange({ image: event.target?.result as string, video: null });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange({ video: event.target?.result as string, image: null });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Background</h3>

      {/* Background Color */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Background Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={settings.color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="w-12 h-10 rounded-lg border-2 border-border cursor-pointer"
          />
          <input
            type="text"
            value={settings.color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="flex-1 px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm font-mono"
          />
        </div>
      </div>

      {/* Color Presets */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Quick Colors</label>
        <div className="flex flex-wrap gap-2">
          {[
            '#1a1a2e', '#16213e', '#0f0e17', '#2d132c', '#1e3d59',
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
          ].map((color) => (
            <button
              key={color}
              onClick={() => onChange({ color })}
              className="w-8 h-8 rounded-lg border-2 border-border hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Upload Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => imageInputRef.current?.click()}
          className="gap-2"
        >
          <ImageIcon className="w-4 h-4" />
          Image
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => videoInputRef.current?.click()}
          className="gap-2"
        >
          <Film className="w-4 h-4" />
          Video
        </Button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          onChange={handleVideoUpload}
          className="hidden"
        />
      </div>

      {/* Media Preview */}
      {(settings.image || settings.video) && (
        <div className="relative rounded-lg overflow-hidden border border-border">
          {settings.image && (
            <img 
              src={settings.image} 
              alt="Background" 
              className="w-full h-24 object-cover"
            />
          )}
          {settings.video && (
            <video 
              src={settings.video} 
              className="w-full h-24 object-cover"
              muted
              loop
              autoPlay
            />
          )}
          <button
            onClick={() => onChange({ image: null, video: null })}
            className="absolute top-2 right-2 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Blur Slider */}
      {(settings.image || settings.video) && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-xs font-medium text-muted-foreground">Blur</label>
            <span className="text-xs font-mono text-primary">{settings.blur}px</span>
          </div>
          <Slider
            value={[settings.blur]}
            onValueChange={([v]) => onChange({ blur: v })}
            min={0}
            max={20}
            step={1}
            className="py-2"
          />
        </div>
      )}

      {/* Opacity Slider */}
      {(settings.image || settings.video) && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-xs font-medium text-muted-foreground">Opacity</label>
            <span className="text-xs font-mono text-primary">{settings.opacity}%</span>
          </div>
          <Slider
            value={[settings.opacity]}
            onValueChange={([v]) => onChange({ opacity: v })}
            min={0}
            max={100}
            step={1}
            className="py-2"
          />
        </div>
      )}
    </div>
  );
}
