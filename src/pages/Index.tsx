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
    updateAnimation, updateAudio, updateWatermark, updateOverlay, updateEnding, updateLyrics, updateReels,
    setCanvasFormat, setTheme, saveProject, loadProject, deleteProject, newProject, duplicateProject,
  } = useVideoProject();

  const { exportState, exportVideo, cancelExport } = useVideoExport();
  const previewRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showMobileEditor, setShowMobileEditor] = useState(false);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const wasPlayingRef = useRef(false);

  // Use unified timeline engine - SINGLE SOURCE OF TRUTH
  const baseTimeline = computeTimeline(
    project.text.content,
    project.animation.wpmPreset,
    project.animation.wpmPreset === 'custom' ? project.animation.duration : null,
    project.ending.enabled,
    project.ending.duration
  );

  // For lyrics theme with LRC + autoFitLrcToAudio: audio duration is authoritative
  const timeline = (
    project.theme === 'lyrics' &&
    project.lyrics.timingSource === 'lrc' &&
    project.lyrics.autoFitLrcToAudio &&
    project.audio.duration &&
    project.audio.duration > 0
  ) ? {
    ...baseTimeline,
    contentDuration: project.audio.duration,
    totalDuration: project.audio.duration + (baseTimeline.endingDuration),
  } : baseTimeline;

  const useAudioClock = !!project.audio.file;

  // Ensure we always know the real audio duration (needed for auto-fit and correct timeline)
  useEffect(() => {
    if (!useAudioClock) return;
    const el = audioRef.current;
    if (!el) return;

    const syncDuration = () => {
      const d = Number.isFinite(el.duration) ? el.duration : null;
      const normalized = d && d > 0 ? d : null;
      const prev = project.audio.duration;
      if (normalized && (!prev || Math.abs(prev - normalized) > 0.01)) {
        updateAudio({ duration: normalized });
      }
    };

    const onEnded = () => {
      if (!project.audio.loop) {
        setIsPlaying(false);
      }
    };

    el.addEventListener('loadedmetadata', syncDuration);
    el.addEventListener('durationchange', syncDuration);
    el.addEventListener('ended', onEnded);
    syncDuration();

    return () => {
      el.removeEventListener('loadedmetadata', syncDuration);
      el.removeEventListener('durationchange', syncDuration);
      el.removeEventListener('ended', onEnded);
    };
  }, [project.audio.duration, project.audio.file, project.audio.loop, updateAudio, useAudioClock]);

  // Keep audio element settings in sync (without restarting playback)
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !project.audio.file) return;
    el.volume = project.audio.volume / 100;
    el.loop = project.audio.loop;
  }, [project.audio.file, project.audio.loop, project.audio.volume]);

  // Animation loop - uses unified timeline; when audio exists it is the authoritative clock.
  useEffect(() => {
    const el = audioRef.current;
    const wasPlaying = wasPlayingRef.current;

    // Track transitions explicitly
    wasPlayingRef.current = isPlaying;

    if (isPlaying) {
      if (useAudioClock && el && project.audio.file) {
        // Only seek when we are starting playback (prevents crackling from repeated seeks)
        if (!wasPlaying && Math.abs(el.currentTime - currentTime) > 0.05) {
          el.currentTime = currentTime;
        }

        if (!wasPlaying) {
          el.play().catch(() => {});
        }
      } else {
        startTimeRef.current = performance.now() - (currentTime * 1000);
      }

      const animate = (now: number) => {
        const elapsed = (useAudioClock && el)
          ? el.currentTime
          : (() => {
            if (!startTimeRef.current) startTimeRef.current = now;
            return (now - startTimeRef.current) / 1000;
          })();

        if (elapsed >= timeline.totalDuration) {
          if (project.animation.isLooping) {
            if (useAudioClock && el) {
              el.currentTime = 0;
              el.play().catch(() => {});
            } else {
              startTimeRef.current = now;
            }
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
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };
    }

    if (!isPlaying && useAudioClock && el) {
      // Only pause when transitioning from playing -> paused
      if (wasPlaying) el.pause();
    }
  }, [currentTime, isPlaying, project.animation.isLooping, project.audio.file, timeline.totalDuration, useAudioClock]);

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
    if (audioRef.current) audioRef.current.currentTime = 0;
    wasPlayingRef.current = false;
  }, []);

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time);
    startTimeRef.current = performance.now() - (time * 1000);
    if (audioRef.current) audioRef.current.currentTime = time;
  }, []);

  const handleExport = (quality: ExportQuality, format: ExportFormat) => {
    if (previewRef.current) exportVideo(project, previewRef.current, quality, format);
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header - Excel Style - Mobile Responsive */}
      <header className="h-9 md:h-9 flex items-center justify-between px-2 md:px-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <img src="/globe-favicon.png" alt="roshLingua Logo" title="editbyroshlingua" className="h-6" />
          <span className="text-xs md:text-sm font-semibold text-foreground whitespace-nowrap">
            <span className="hidden sm:inline">editbyroshLingua</span>
            <span className="sm:hidden">editbyrosh</span>
          </span>
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
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Sidebar - Property Panel - Hidden on mobile, show as bottom sheet */}
        <aside className="hidden md:flex w-64 max-w-[280px] border-r border-border bg-excel-header shrink-0 overflow-hidden min-h-0 flex-col">
          <div className="flex-1 min-h-0">
            <CompactEditor
              project={project}
              timeline={timeline}
              onProjectChange={updateProject}
              onThemeChange={setTheme}
              onLyricsChange={updateLyrics}
              onReelsChange={updateReels}
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
              audioRef={audioRef}
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
            className="absolute bottom-0 left-0 right-0 bg-excel-header border-t border-border max-h-[70vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-excel-header border-b border-border px-3 py-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold">Editor Controls</h3>
              <button onClick={() => setShowMobileEditor(false)} className="text-xs px-2 py-1 hover:bg-excel-hover">
                Close
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <CompactEditor
                project={project}
                timeline={timeline}
                onProjectChange={updateProject}
                onThemeChange={setTheme}
                onLyricsChange={updateLyrics}
                onReelsChange={updateReels}
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
