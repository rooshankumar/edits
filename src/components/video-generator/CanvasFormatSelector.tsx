import { Smartphone, Monitor, Square } from 'lucide-react';
import { CanvasFormat, CANVAS_SIZES } from '@/types/video-project';
import { cn } from '@/lib/utils';

interface CanvasFormatSelectorProps {
  value: CanvasFormat;
  onChange: (format: CanvasFormat) => void;
}

const formats: { format: CanvasFormat; icon: typeof Smartphone; label: string }[] = [
  { format: 'vertical', icon: Smartphone, label: 'Reel' },
  { format: 'horizontal', icon: Monitor, label: 'Desktop' },
  { format: 'square', icon: Square, label: 'Square' },
];

export function CanvasFormatSelector({ value, onChange }: CanvasFormatSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Canvas Format</h3>
      <div className="grid grid-cols-3 gap-2">
        {formats.map(({ format, icon: Icon, label }) => {
          const size = CANVAS_SIZES[format];
          const isSelected = value === format;
          
          return (
            <button
              key={format}
              onClick={() => onChange(format)}
              className={cn(
                'relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200',
                'hover:scale-105 hover:shadow-soft',
                isSelected
                  ? 'border-primary bg-primary/10 shadow-glow'
                  : 'border-border bg-card hover:border-primary/50'
              )}
            >
              <Icon 
                className={cn(
                  'w-6 h-6 transition-colors',
                  isSelected ? 'text-primary' : 'text-muted-foreground'
                )} 
              />
              <span className={cn(
                'text-xs font-medium',
                isSelected ? 'text-primary' : 'text-foreground'
              )}>
                {label}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {size.width}×{size.height}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
