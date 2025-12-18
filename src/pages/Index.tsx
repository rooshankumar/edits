import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { useVideoProject } from '@/hooks/useVideoProject';
import { useVideoExport } from '@/hooks/useVideoExport';
import { CompactEditor } from '@/components/video-generator/CompactEditor';
import { VideoPreview } from '@/components/video-generator/VideoPreview';
import { PlaybackControls } from '@/components/video-generator/PlaybackControls';
import { ProjectManager } from '@/components/video-generator/ProjectManager';
import { ThemeToggle } from '@/components/video-generator/ThemeToggle';
import { ExportDialog } from '@/components/video-generator/ExportDialog';
import { TimelineBar } from '@/components/video-generator/TimelineBar';
import { ExportQuality, ExportFormat } from '@/types/video-project';
import { computeTimeline } from '@/utils/timeline';

export default function Index() {
  const {
    project, savedProjects, updateProject, updateText, updateBackground,
    updateAnimation, updateAudio, updateWatermark, updateOverlay, updateEnding,
    setCanvasFormat, saveProject, loadProject, deleteProject, newProject, duplicateProject,
  } = useVideoProject();

  const { exportState, exportVideo, cancelExport } = useVideoExport();
  const previewRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showMobileEditor, setShowMobileEditor] = useState(false);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Use unified timeline engine - SINGLE SOURCE OF TRUTH
  const timeline = computeTimeline(
    project.text.content,
    project.animation.wpmPreset,
    project.animation.wpmPreset === 'custom' ? project.animation.duration : null,
    project.ending.enabled,
    project.ending.duration
  );

  // Animation loop - uses unified timeline
  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = performance.now() - (currentTime * 1000);
      
      const animate = (now: number) => {
        if (!startTimeRef.current) startTimeRef.current = now;
        const elapsed = (now - startTimeRef.current) / 1000;
        
        if (elapsed >= timeline.totalDuration) {
          if (project.animation.isLooping) {
            startTimeRef.current = now;
            setCurrentTime(0);
          } else {
            setIsPlaying(false);
            setCurrentTime(timeline.totalDuration);
            return;
          }
        } else {
          setCurrentTime(elapsed);
        }
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [isPlaying, timeline.totalDuration, project.animation.isLooping]);

  const handlePlayPause = useCallback(() => {
    if (!isPlaying && currentTime >= timeline.totalDuration) {
      setCurrentTime(0);
      startTimeRef.current = null;
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, currentTime, timeline.totalDuration]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    startTimeRef.current = null;
  }, []);

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time);
    startTimeRef.current = performance.now() - (time * 1000);
  }, []);

  const handleExport = (quality: ExportQuality, format: ExportFormat) => {
    if (previewRef.current) exportVideo(project, previewRef.current, quality, format);
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header - Excel Style - Mobile Responsive */}
      <header className="h-9 md:h-9 flex items-center justify-between px-2 md:px-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-xs md:text-sm font-semibold text-foreground">
            <span className="hidden sm:inline">ScrollVid - Video Editor</span>
            <span className="sm:hidden">ScrollVid</span>
          </h1>
        </div>
        <ProjectManager 
          project={project} 
          savedProjects={savedProjects} 
          onSave={saveProject} 
          onLoad={loadProject} 
          onDelete={deleteProject} 
          onNew={newProject} 
          onDuplicate={duplicateProject} 
          onRename={(name) => updateProject({ name })} 
        />
        <ThemeToggle />
      </header>

      {/* Main Editor Layout - Excel Style - Mobile Responsive */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Property Panel - Hidden on mobile, show as bottom sheet */}
        <aside className="hidden md:block w-64 max-w-[280px] border-r border-border bg-excel-header shrink-0 overflow-hidden">
          <CompactEditor
            project={project}
            timeline={timeline}
            onCanvasFormatChange={setCanvasFormat}
            onTextChange={updateText}
            onBackgroundChange={updateBackground}
            onAnimationChange={updateAnimation}
            onAudioChange={updateAudio}
            onWatermarkChange={updateWatermark}
            onOverlayChange={updateOverlay}
            onEndingChange={updateEnding}
          />
        </aside>

        {/* Main Preview Area - Mobile Responsive */}
        <main className="flex-1 flex flex-col min-w-0 bg-card">
          {/* Preview - Adjust padding for mobile */}
          <div className="flex-1 flex items-center justify-center p-2 md:p-4 min-h-0 bg-excel-grid">
            <VideoPreview 
              ref={previewRef} 
              project={project} 
              isPlaying={isPlaying} 
              currentTime={currentTime}
              contentDuration={timeline.contentDuration}
              totalDuration={timeline.totalDuration}
            />
          </div>

          {/* Bottom Controls - Mobile Responsive */}
          <div className="shrink-0 border-t border-border bg-excel-header p-2 md:p-3 space-y-1.5 md:space-y-2">
            {/* Timeline - Smaller on mobile */}
            <div className="max-w-lg mx-auto w-full">
              <TimelineBar 
                currentTime={currentTime}
                duration={timeline.totalDuration}
                isPlaying={isPlaying}
                onSeek={handleSeek}
              />
            </div>
            
            {/* Playback Controls - Mobile Responsive */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              {/* Mobile Editor Toggle Button */}
              <button
                onClick={() => setShowMobileEditor(!showMobileEditor)}
                className="md:hidden px-3 py-1.5 text-[10px] font-medium border border-border bg-card hover:bg-excel-hover rounded"
              >
                {showMobileEditor ? 'Hide' : 'Show'} Editor
              </button>
              <PlaybackControls 
                isPlaying={isPlaying} 
                onPlayPause={handlePlayPause} 
                onReset={handleReset} 
                onExport={() => setShowExportDialog(true)} 
                isExporting={exportState.isExporting} 
                exportProgress={exportState.progress} 
              />
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Editor Sheet */}
      {showMobileEditor && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowMobileEditor(false)}>
          <div 
            className="absolute bottom-0 left-0 right-0 bg-excel-header border-t border-border max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-excel-header border-b border-border px-3 py-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold">Editor Controls</h3>
              <button onClick={() => setShowMobileEditor(false)} className="text-xs px-2 py-1 hover:bg-excel-hover">
                Close
              </button>
            </div>
            <CompactEditor
              project={project}
              timeline={timeline}
              onCanvasFormatChange={setCanvasFormat}
              onTextChange={updateText}
              onBackgroundChange={updateBackground}
              onAnimationChange={updateAnimation}
              onAudioChange={updateAudio}
              onWatermarkChange={updateWatermark}
              onOverlayChange={updateOverlay}
              onEndingChange={updateEnding}
            />
          </div>
        </div>
      )}

      {/* Export Dialog */}
      <ExportDialog 
        open={showExportDialog} 
        onOpenChange={setShowExportDialog} 
        project={project}
        timeline={timeline}
        onExport={handleExport} 
        isExporting={exportState.isExporting} 
        progress={exportState.progress} 
        onCancel={cancelExport} 
      />
    </div>
  );
}
