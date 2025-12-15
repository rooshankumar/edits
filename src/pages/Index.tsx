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
import { ExportQuality } from '@/types/video-project';
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
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
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

  const handleExport = (quality: ExportQuality) => {
    if (previewRef.current) exportVideo(project, previewRef.current, quality);
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="h-10 flex items-center justify-between px-2 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg gradient-primary flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <h1 className="text-xs font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            ScrollVid
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

      {/* Main Editor Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-60 max-w-[260px] border-r border-border bg-card shrink-0 overflow-hidden">
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

        {/* Main Preview Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-muted/30">
          {/* Preview */}
          <div className="flex-1 flex items-center justify-center p-3 min-h-0">
            <VideoPreview 
              ref={previewRef} 
              project={project} 
              isPlaying={isPlaying} 
              currentTime={currentTime}
              contentDuration={timeline.contentDuration}
              totalDuration={timeline.totalDuration}
            />
          </div>

          {/* Bottom Controls */}
          <div className="shrink-0 border-t border-border bg-card/80 backdrop-blur-sm p-2 space-y-1.5">
            {/* Timeline */}
            <div className="max-w-lg mx-auto w-full">
              <TimelineBar 
                currentTime={currentTime}
                duration={timeline.totalDuration}
                isPlaying={isPlaying}
                onSeek={handleSeek}
              />
            </div>
            
            {/* Playback Controls */}
            <div className="flex justify-center">
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
