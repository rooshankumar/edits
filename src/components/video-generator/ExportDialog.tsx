import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { VideoProject, ExportQuality } from '@/types/video-project';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: VideoProject;
  onExport: (quality: ExportQuality) => void;
  isExporting: boolean;
  progress: number;
  onCancel: () => void;
}

const qualities: { value: ExportQuality; label: string; desc: string }[] = [
  { value: 'standard', label: 'Standard', desc: '720p • Fast' },
  { value: 'hd', label: 'HD', desc: '1080p • Balanced' },
  { value: 'ultra', label: 'Ultra', desc: '1080p 60fps' },
];

export function ExportDialog({ open, onOpenChange, project, onExport, isExporting, progress, onCancel }: ExportDialogProps) {
  const [quality, setQuality] = useState<ExportQuality>('hd');

  const totalDuration = project.animation.duration + (project.ending.enabled ? project.ending.duration : 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Download className="w-4 h-4 text-primary" />
            Export Video
          </DialogTitle>
        </DialogHeader>

        {isExporting ? (
          <div className="py-6 space-y-4">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{progress}%</span>
              </div>
              <p className="text-xs text-muted-foreground">Rendering video...</p>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full gradient-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <Button variant="outline" onClick={onCancel} className="w-full" size="sm">Cancel</Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-medium">Quality</label>
              <div className="grid grid-cols-3 gap-1.5">
                {qualities.map((q) => (
                  <button key={q.value} onClick={() => setQuality(q.value)}
                    className={cn('flex flex-col items-center gap-0.5 p-2 rounded-lg border-2 transition-all text-center',
                      quality === q.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50')}>
                    <span className="text-xs font-semibold">{q.label}</span>
                    <span className="text-[9px] text-muted-foreground">{q.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-2 rounded-lg bg-muted/50 text-xs text-center">
              <span className="font-medium">{totalDuration}s</span>
              <span className="text-muted-foreground"> • {project.ending.enabled ? 'With ending card' : 'No ending'}</span>
            </div>

            <Button onClick={() => onExport(quality)} className="w-full gap-2 gradient-primary text-white" size="sm">
              <Download className="w-3 h-3" />
              Export WebM
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
