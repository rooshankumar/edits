import { useState } from 'react';
import { Download, X, Loader2 } from 'lucide-react';
import { VideoProject, ExportQuality } from '@/types/video-project';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: VideoProject;
  onExport: (quality: ExportQuality, duration: number) => void;
  isExporting: boolean;
  progress: number;
  onCancel: () => void;
}

const qualities: { value: ExportQuality; label: string; desc: string }[] = [
  { value: 'standard', label: 'Standard', desc: '720p • Fast' },
  { value: 'hd', label: 'HD', desc: '1080p • Balanced' },
  { value: 'ultra', label: 'Ultra', desc: '1080p 60fps • Best' },
];

export function ExportDialog({
  open,
  onOpenChange,
  project,
  onExport,
  isExporting,
  progress,
  onCancel,
}: ExportDialogProps) {
  const [quality, setQuality] = useState<ExportQuality>('hd');
  const [duration, setDuration] = useState(project.animation.duration);

  const handleExport = () => {
    onExport(quality, duration);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Export Video
          </DialogTitle>
        </DialogHeader>

        {isExporting ? (
          <div className="py-8 space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                  {progress}%
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Rendering your video...
              </p>
            </div>

            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full gradient-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <Button
              variant="outline"
              onClick={onCancel}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Quality Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Quality</label>
              <div className="grid grid-cols-3 gap-2">
                {qualities.map((q) => (
                  <button
                    key={q.value}
                    onClick={() => setQuality(q.value)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all',
                      quality === q.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <span className="text-sm font-semibold">{q.label}</span>
                    <span className="text-[10px] text-muted-foreground">{q.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Duration</label>
                <span className="text-sm font-mono text-primary">{duration}s</span>
              </div>
              <Slider
                value={[duration]}
                onValueChange={([v]) => setDuration(v)}
                min={5}
                max={60}
                step={5}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5s</span>
                <span>60s</span>
              </div>
            </div>

            {/* Export Button */}
            <Button
              onClick={handleExport}
              className="w-full gap-2 gradient-primary text-white"
            >
              <Download className="w-4 h-4" />
              Export as WebM
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Video will be exported in WebM format for best browser compatibility
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
