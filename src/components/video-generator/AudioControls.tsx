import { useRef } from 'react';
import { Music, Upload, X, Volume2 } from 'lucide-react';
import { AudioSettings } from '@/types/video-project';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface AudioControlsProps {
  settings: AudioSettings;
  onChange: (updates: Partial<AudioSettings>) => void;
}

export function AudioControls({ settings, onChange }: AudioControlsProps) {
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange({ 
          file: event.target?.result as string,
          fileName: file.name 
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    onChange({ file: null, fileName: null });
  };

  return (
    <div className="space-y-3">
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        onChange={handleAudioUpload}
        className="hidden"
      />

      {!settings.file ? (
        <button
          onClick={() => audioInputRef.current?.click()}
          className={cn(
            'w-full flex items-center justify-center gap-2 p-3 rounded-lg',
            'border-2 border-dashed border-border',
            'text-muted-foreground hover:border-primary hover:text-primary',
            'transition-all'
          )}
        >
          <Upload className="w-4 h-4" />
          <span className="text-sm font-medium">Add Background Music</span>
        </button>
      ) : (
        <div className="space-y-3 p-3 rounded-lg bg-muted/50 border border-border">
          {/* File info */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Music className="w-4 h-4 text-primary" />
            </div>
            <span className="flex-1 text-sm font-medium truncate">
              {settings.fileName}
            </span>
            <button
              onClick={handleRemove}
              className="p-1 rounded-md hover:bg-destructive/10 text-destructive"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[settings.volume]}
              onValueChange={([v]) => onChange({ volume: v })}
              min={0}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-xs font-mono w-8 text-right">{settings.volume}%</span>
          </div>

          {/* Loop */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Loop audio</span>
            <Switch
              checked={settings.loop}
              onCheckedChange={(checked) => onChange({ loop: checked })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
