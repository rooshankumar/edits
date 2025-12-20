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
    <div className="space-y-2">
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
            'w-full flex items-center justify-center gap-2 py-3 px-3',
            'border border-dashed border-border bg-card',
            'text-muted-foreground hover:border-primary hover:bg-excel-hover',
            'transition-all text-xs font-medium'
          )}
        >
          <Upload className="w-4 h-4" />
          <span>Add Background Music</span>
        </button>
      ) : (
        <div className="space-y-2 border border-border bg-card">
          {/* File info */}
          <div className="relative flex items-center gap-2 px-3 py-2 pr-9 border-b border-border excel-hover">
            <Music className="w-4 h-4 text-primary" />
            <span
              className="flex-1 w-0 min-w-0 truncate whitespace-nowrap overflow-hidden text-[11px] leading-tight font-medium"
              title={settings.fileName ?? undefined}
            >
              {settings.fileName}
            </span>
            <button
              onClick={handleRemove}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-destructive/10 text-destructive transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Volume */}
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-medium text-muted-foreground">Volume</label>
              <span className="text-[10px] font-semibold">{settings.volume}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
              <Slider
                value={[settings.volume]}
                onValueChange={([v]) => onChange({ volume: v })}
                min={0}
                max={100}
                step={1}
                className="flex-1"
              />
            </div>
          </div>

          {/* Loop */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-border excel-hover">
            <span className="text-xs font-medium">Loop audio</span>
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
