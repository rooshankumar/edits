import { Smartphone, Monitor, Square, Video, Instagram, Twitter, Facebook } from 'lucide-react';
import { CanvasFormat, CANVAS_SIZES } from '@/types/video-project';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CanvasFormatSelectorProps {
  value: CanvasFormat;
  onChange: (format: CanvasFormat) => void;
}

const quickFormats: { format: CanvasFormat; icon: typeof Smartphone; label: string }[] = [
  { format: 'vertical', icon: Smartphone, label: 'Reel' },
  { format: 'horizontal', icon: Monitor, label: 'Desktop' },
  { format: 'square', icon: Square, label: 'Square' },
];

const allFormats: { format: CanvasFormat; category: string }[] = [
  { format: 'vertical', category: 'Standard' },
  { format: 'horizontal', category: 'Standard' },
  { format: 'square', category: 'Standard' },
  { format: 'tiktok', category: 'Social' },
  { format: 'youtube-shorts', category: 'Social' },
  { format: 'instagram-post', category: 'Social' },
  { format: 'twitter', category: 'Social' },
  { format: 'facebook-cover', category: 'Social' },
];

export function CanvasFormatSelector({ value, onChange }: CanvasFormatSelectorProps) {
  const currentSize = CANVAS_SIZES[value];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Canvas Format</h3>
      
      {/* Quick Select Buttons */}
      <div className="grid grid-cols-3 gap-2">
        {quickFormats.map(({ format, icon: Icon, label }) => {
          const size = CANVAS_SIZES[format];
          const isSelected = value === format;
          
          return (
            <button
              key={format}
              onClick={() => onChange(format)}
              className={cn(
                'relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all duration-200',
                'hover:scale-105 hover:shadow-soft',
                isSelected
                  ? 'border-primary bg-primary/10 shadow-glow'
                  : 'border-border bg-card hover:border-primary/50'
              )}
            >
              <Icon 
                className={cn(
                  'w-5 h-5 transition-colors',
                  isSelected ? 'text-primary' : 'text-muted-foreground'
                )} 
              />
              <span className={cn(
                'text-xs font-medium',
                isSelected ? 'text-primary' : 'text-foreground'
              )}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Full Format Dropdown */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">All Formats</label>
        <Select value={value} onValueChange={(v) => onChange(v as CanvasFormat)}>
          <SelectTrigger className="w-full">
            <SelectValue>
              <div className="flex items-center justify-between w-full">
                <span>{currentSize.label}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {currentSize.width}×{currentSize.height}
                </span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {allFormats.map(({ format, category }) => {
              const size = CANVAS_SIZES[format];
              return (
                <SelectItem key={format} value={format}>
                  <div className="flex items-center justify-between w-full gap-4">
                    <span>{size.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {size.width}×{size.height}
                    </span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
