import { useState } from 'react';
import { Download, Loader2, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { VideoProject, ExportQuality } from '@/types/video-project';
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

export function ExportDialog({ open, onOpenChange, project, timeline, onExport, isExporting, progress, onCancel }: ExportDialogProps) {
  const [quality, setQuality] = useState<ExportQuality>('hd');
  
  const validation = validateProjectForExport(project);
  const wpmLevel = getWPMLevel(timeline.targetWPM);

  const StatusIcon = ({ status }: { status: 'pass' | 'warning' | 'error' }) => {
    if (status === 'pass') return <CheckCircle className="w-3 h-3 text-green-500" />;
    if (status === 'warning') return <AlertTriangle className="w-3 h-3 text-yellow-500" />;
    return <XCircle className="w-3 h-3 text-red-500" />;
  };

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
              <p className="text-xs text-muted-foreground">Rendering video with audio...</p>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full gradient-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <Button variant="outline" onClick={onCancel} className="w-full" size="sm">Cancel</Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Pre-export QA Checks */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Pre-export Checks</label>
              <div className="space-y-1 p-2 rounded-lg bg-muted/30 border border-border">
                {validation.checks.map((check) => (
                  <div key={check.id} className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <StatusIcon status={check.status} />
                      <span className="text-muted-foreground">{check.label}</span>
                    </div>
                    <span className={cn(
                      'font-medium',
                      check.status === 'pass' && 'text-green-600',
                      check.status === 'warning' && 'text-yellow-600',
                      check.status === 'error' && 'text-red-600',
                    )}>
                      {check.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quality Selection */}
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

            {/* Timeline Summary */}
            <div className="p-2 rounded-lg bg-muted/50 space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">{timeline.totalDuration}s</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Reading Speed</span>
                <span className={cn(
                  'font-medium',
                  wpmLevel === 'good' && 'text-green-600',
                  wpmLevel === 'warning' && 'text-yellow-600',
                  wpmLevel === 'danger' && 'text-red-600',
                )}>
                  {timeline.targetWPM} WPM
                </span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Audio</span>
                <span className="font-medium">{project.audio.file ? '✓ Included' : 'None'}</span>
              </div>
              {project.ending.enabled && (
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Ending Card</span>
                  <span className="font-medium">{timeline.endingDuration}s</span>
                </div>
              )}
            </div>

            <Button 
              onClick={() => onExport(quality)} 
              className="w-full gap-2 gradient-primary text-white" 
              size="sm"
              disabled={!validation.isReady}
            >
              <Download className="w-3 h-3" />
              {validation.isReady ? 'Export WebM' : 'Fix errors first'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
