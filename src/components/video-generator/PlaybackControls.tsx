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
    <div className="flex items-center justify-center gap-3 p-4 bg-card/80 backdrop-blur-sm rounded-2xl border border-border shadow-soft">
      {/* Reset Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={onReset}
        className="rounded-xl"
        disabled={isExporting}
      >
        <RotateCcw className="w-5 h-5" />
      </Button>

      {/* Play/Pause Button */}
      <Button
        onClick={onPlayPause}
        size="lg"
        className={cn(
          'rounded-xl px-8 gap-2',
          'gradient-primary text-white border-0',
          'hover:opacity-90 transition-opacity',
          'shadow-glow'
        )}
        disabled={isExporting}
      >
        {isPlaying ? (
          <>
            <Pause className="w-5 h-5" />
            Pause
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            Play
          </>
        )}
      </Button>

      {/* Export Button */}
      <Button
        onClick={onExport}
        variant="outline"
        className={cn(
          'rounded-xl gap-2 relative overflow-hidden',
          isExporting && 'pointer-events-none'
        )}
        disabled={isExporting}
      >
        {isExporting ? (
          <>
            <div 
              className="absolute inset-0 gradient-secondary opacity-20"
              style={{ width: `${exportProgress}%` }}
            />
            <span className="relative z-10">{exportProgress}%</span>
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Export
          </>
        )}
      </Button>
    </div>
  );
}
