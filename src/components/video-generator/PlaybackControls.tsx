import { Play, Pause, RotateCcw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  onExport: () => void;
  isExporting: boolean;
  exportProgress: number;
}

export function PlaybackControls({
  isPlaying,
  onPlayPause,
  onReset,
  onExport,
  isExporting,
  exportProgress,
}: PlaybackControlsProps) {
  return (
    <div className="flex items-center justify-center gap-1.5 md:gap-2">
      {/* Reset Button */}
      <Button
        variant="outline"
        onClick={onReset}
        className="h-7 md:h-8 px-2 md:px-3 gap-1 md:gap-2 border-border excel-hover"
        size="sm"
        disabled={isExporting}
      >
        <RotateCcw className="w-3 md:w-3.5 h-3 md:h-3.5" />
        <span className="text-[10px] md:text-xs font-medium hidden sm:inline">Reset</span>
      </Button>

      {/* Play/Pause Button */}
      <Button
        onClick={onPlayPause}
        className={cn(
          'h-7 md:h-8 px-4 md:px-6 gap-1.5 md:gap-2 bg-primary hover:bg-primary/90 text-white'
        )}
        size="sm"
        disabled={isExporting}
      >
        {isPlaying ? (
          <Pause className="w-3.5 md:w-4 h-3.5 md:h-4" />
        ) : (
          <Play className="w-3.5 md:w-4 h-3.5 md:h-4" />
        )}
        <span className="text-[10px] md:text-xs font-medium">{isPlaying ? 'Pause' : 'Play'}</span>
      </Button>

      {/* Export Button */}
      <Button
        onClick={onExport}
        variant="outline"
        size="sm"
        className={cn(
          'h-8 px-3 gap-2 border-border excel-hover relative overflow-hidden',
          isExporting && 'pointer-events-none'
        )}
        disabled={isExporting}
      >
        {isExporting ? (
          <>
            <div 
              className="absolute inset-0 bg-primary/10"
              style={{ width: `${exportProgress}%` }}
            />
            <span className="relative z-10 text-xs">{exportProgress}%</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span className="text-xs">Export</span>
          </>
        )}
      </Button>
    </div>
  );
}
