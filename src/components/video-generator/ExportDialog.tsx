import { useState } from 'react';
import { Download, Loader2, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { VideoProject, ExportQuality, ExportFormat } from '@/types/video-project';
import { TimelineState, getWPMLevel } from '@/utils/timeline';
import { validateProjectForExport } from '@/utils/validateProject';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: VideoProject;
  timeline: TimelineState;
  onExport: (quality: ExportQuality, format: ExportFormat) => void;
  isExporting: boolean;
  progress: number;
  onCancel: () => void;
}

const qualities: { value: ExportQuality; label: string; desc: string }[] = [
  { value: 'standard', label: 'Standard', desc: '6 Mbps • 30fps' },
  { value: 'hd', label: 'HD', desc: '10 Mbps • 30fps' },
  { value: 'ultra', label: 'Ultra', desc: '15 Mbps • 60fps' },
];

const formats: { value: ExportFormat; label: string; desc: string }[] = [
  { value: 'mp4', label: 'MP4 (H.264)', desc: 'Best compatibility' },
  { value: 'webm', label: 'WebM (VP9)', desc: 'Smaller size' },
  { value: 'gif', label: 'GIF', desc: 'No audio, loops' },
];

export function ExportDialog({ open, onOpenChange, project, timeline, onExport, isExporting, progress, onCancel }: ExportDialogProps) {
  const [quality, setQuality] = useState<ExportQuality>('hd');
  const [format, setFormat] = useState<ExportFormat>('mp4');
  
  const validation = validateProjectForExport(project);
  const wpmLevel = getWPMLevel(timeline.targetWPM);

  const StatusIcon = ({ status }: { status: 'pass' | 'warning' | 'error' }) => {
    if (status === 'pass') return <CheckCircle className="w-3 h-3 text-green-500" />;
    if (status === 'warning') return <AlertTriangle className="w-3 h-3 text-yellow-500" />;
    return <XCircle className="w-3 h-3 text-red-500" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm shadow-dialog border-border">
        <DialogHeader className="border-b border-border pb-2">
          <DialogTitle className="text-xs font-semibold text-foreground">
            Export Video
          </DialogTitle>
        </DialogHeader>

        {isExporting ? (
          <div className="py-4 space-y-4">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">{progress}%</span>
              </div>
              <p className="text-sm text-muted-foreground">Rendering video with audio...</p>
            </div>
            <div className="w-full h-2 bg-secondary border border-border">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onCancel} className="px-4 h-8 text-xs border-border" size="sm">Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 py-2">
            {/* Compact Status */}
            {!validation.isReady && (
              <div className="border border-red-500 bg-red-50 dark:bg-red-950 px-2 py-1.5">
                <div className="flex items-center gap-1.5">
                  <XCircle className="w-3 h-3 text-red-600" />
                  <span className="text-[10px] font-medium text-red-600">Fix issues before export</span>
                </div>
              </div>
            )}

            {/* Compact Format & Quality */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Format</label>
                <div className="space-y-1">
                  {formats.map((f) => (
                    <button key={f.value} onClick={() => setFormat(f.value)}
                      className={cn('w-full px-2 py-1 border transition-all text-left excel-hover',
                        format === f.value ? 'border-primary bg-excel-selected border-2' : 'border-border bg-card')}>
                      <div className="text-[10px] font-semibold">{f.label.split(' ')[0]}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Quality</label>
                <div className="space-y-1">
                  {qualities.map((q) => (
                    <button key={q.value} onClick={() => setQuality(q.value)}
                      className={cn('w-full px-2 py-1 border transition-all text-left excel-hover',
                        quality === q.value ? 'border-primary bg-excel-selected border-2' : 'border-border bg-card')}>
                      <div className="text-[10px] font-semibold">{q.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Compact Summary */}
            <div className="border border-border bg-excel-header px-2 py-1.5">
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-semibold">{timeline.totalDuration}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Audio:</span>
                  <span className="font-semibold">{project.audio.file ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">WPM:</span>
                  <span className={cn(
                    'font-semibold',
                    wpmLevel === 'good' && 'text-green-600',
                    wpmLevel === 'warning' && 'text-yellow-600',
                    wpmLevel === 'danger' && 'text-red-600',
                  )}>
                    {timeline.targetWPM}
                  </span>
                </div>
                {project.ending.enabled && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ending:</span>
                    <span className="font-semibold">{timeline.endingDuration}s</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t border-border">
              <Button 
                variant="outline"
                onClick={() => onOpenChange(false)} 
                className="px-3 h-7 text-[10px] border-border"
                size="sm"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => onExport(quality, format)} 
                className="px-3 h-7 text-[10px] gap-1.5 bg-primary hover:bg-primary/90" 
                size="sm"
                disabled={!validation.isReady}
              >
                <Download className="w-3 h-3" />
                Export
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
