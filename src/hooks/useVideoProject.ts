import { useState, useCallback, useEffect } from 'react';
import {
  VideoProject, DEFAULT_PROJECT, CanvasFormat,
  TextSettings, BackgroundSettings, AnimationSettings, AudioSettings,
  WatermarkSettings, OverlayTextSettings, EndingSettings, LyricsThemeSettings, ReelsThemeSettings, TitleOverlaySettings,
  calculateDurationFromWPM, calculateWPMFromDuration, WPM_PRESETS
} from '@/types/video-project';
import { parseKaraokeLrc } from '@/utils/karaokeLrc';

const STORAGE_KEY = 'scrolling-video-projects';
const CURRENT_PROJECT_KEY = 'scrolling-video-current';

const generateId = () => Math.random().toString(36).substring(2, 15);

const computeLyricsDurationSeconds = (text: string, lyrics: LyricsThemeSettings): number => {
  const lines = (text || '').split('\n');
  const cps = Math.max(1, lyrics.charsPerSecond);
  const minLine = Math.max(0.2, lyrics.minLineDuration);
  let total = 0;

  lines.forEach((line) => {
    const normalized = line.replace(/\s+/g, ' ').trim();
    const chars = normalized.length;
    const lineSeconds = Math.max(minLine, chars > 0 ? chars / cps : minLine);
    total += lineSeconds;
  });

  // Keep some minimum so playback isn't too short
  return Math.max(3, Math.ceil(total * 10) / 10);
};

const applyLyricsAutoTiming = (project: VideoProject): VideoProject => {
  if (project.theme !== 'lyrics') return project;

  if (project.lyrics.timingSource === 'lrc') {
    const parsed = project.lyrics.karaokeLrc.trim().length > 0
      ? parseKaraokeLrc(project.lyrics.karaokeLrc)
      : null;

    if (parsed) {
      const fittedDuration = (project.lyrics.autoFitLrcToAudio && project.audio.duration && project.audio.duration > 0)
        ? project.audio.duration
        : parsed.duration;

      const duration = Math.max(3, Math.ceil(fittedDuration * 10) / 10);
      const wordCount = parsed.plainText.split(/\s+/).filter(w => w.length > 0).length;
      const targetWPM = calculateWPMFromDuration(wordCount, duration);

      return {
        ...project,
        animation: {
          ...project.animation,
          wpmPreset: 'custom',
          duration,
          targetWPM,
        },
      };
    }

    return project;
  }

  if (project.lyrics.pacingSource !== 'chars') return project;

  const duration = computeLyricsDurationSeconds(project.text.content, project.lyrics);
  const wordCount = project.text.content.split(/\s+/).filter(w => w.length > 0).length;
  const targetWPM = calculateWPMFromDuration(wordCount, duration);

  return {
    ...project,
    animation: {
      ...project.animation,
      wpmPreset: 'custom',
      duration,
      targetWPM,
    },
  };
};

export function useVideoProject() {
  const [project, setProject] = useState<VideoProject>(() => {
    const saved = localStorage.getItem(CURRENT_PROJECT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_PROJECT,
          ...parsed,
          lyrics: { ...DEFAULT_PROJECT.lyrics, ...parsed.lyrics },
          reels: { ...DEFAULT_PROJECT.reels, ...parsed.reels },
          text: { ...DEFAULT_PROJECT.text, ...parsed.text },
          pagedText: { ...DEFAULT_PROJECT.pagedText, ...parsed.pagedText },
          audio: { ...DEFAULT_PROJECT.audio, ...parsed.audio },
          animation: { ...DEFAULT_PROJECT.animation, ...parsed.animation },
          watermark: { ...DEFAULT_PROJECT.watermark, ...parsed.watermark },
          titleOverlay: { ...DEFAULT_PROJECT.titleOverlay, ...parsed.titleOverlay },
          overlay: { ...DEFAULT_PROJECT.overlay, ...parsed.overlay },
          ending: { ...DEFAULT_PROJECT.ending, ...parsed.ending },
          id: parsed.id || generateId(),
          createdAt: parsed.createdAt || Date.now(),
          updatedAt: parsed.updatedAt || Date.now(),
        };
      } catch {
        // ignore
      }
    }
    return {
      ...DEFAULT_PROJECT,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  });

  const [savedProjects, setSavedProjects] = useState<VideoProject[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) return [];
        return parsed.map((p: any) => ({
          ...DEFAULT_PROJECT,
          ...p,
          lyrics: { ...DEFAULT_PROJECT.lyrics, ...p.lyrics },
          reels: { ...DEFAULT_PROJECT.reels, ...p.reels },
          text: { ...DEFAULT_PROJECT.text, ...p.text },
          pagedText: { ...DEFAULT_PROJECT.pagedText, ...p.pagedText },
          audio: { ...DEFAULT_PROJECT.audio, ...p.audio },
          animation: { ...DEFAULT_PROJECT.animation, ...p.animation },
          watermark: { ...DEFAULT_PROJECT.watermark, ...p.watermark },
          titleOverlay: { ...DEFAULT_PROJECT.titleOverlay, ...p.titleOverlay },
          overlay: { ...DEFAULT_PROJECT.overlay, ...p.overlay },
          ending: { ...DEFAULT_PROJECT.ending, ...p.ending },
          id: p.id || generateId(),
          createdAt: p.createdAt || Date.now(),
          updatedAt: p.updatedAt || Date.now(),
        }));
      } catch {
        // ignore
      }
    }
    return [];
  });

  // Auto-save current project
  useEffect(() => {
    localStorage.setItem(CURRENT_PROJECT_KEY, JSON.stringify(project));
  }, [project]);

  // Save projects list
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedProjects));
  }, [savedProjects]);

  const updateProject = useCallback((updates: Partial<VideoProject>) => {
    setProject(prev => {
      const next = {
        ...prev,
        ...updates,
        updatedAt: Date.now(),
      };
      return applyLyricsAutoTiming(next);
    });
  }, []);

  const updateText = useCallback((updates: Partial<TextSettings>) => {
    setProject(prev => {
      const newText = { ...prev.text, ...updates };
      const wordCount = newText.content.split(/\s+/).filter(w => w.length > 0).length;

      if (prev.theme === 'lyrics' && (prev.lyrics.timingSource === 'lrc' || prev.lyrics.pacingSource === 'chars')) {
        return applyLyricsAutoTiming({
          ...prev,
          text: newText,
          updatedAt: Date.now(),
        });
      }
      
      // Auto-recalculate duration if WPM preset is not custom
      if (prev.animation.wpmPreset !== 'custom' && updates.content !== undefined) {
        const newDuration = calculateDurationFromWPM(wordCount, prev.animation.targetWPM);
        return {
          ...prev,
          text: newText,
          animation: { ...prev.animation, duration: newDuration },
          updatedAt: Date.now(),
        };
      }
      
      return {
        ...prev,
        text: newText,
        updatedAt: Date.now(),
      };
    });
  }, []);

  const updateLyrics = useCallback((updates: Partial<LyricsThemeSettings>) => {
    setProject(prev => {
      const next = {
        ...prev,
        lyrics: { ...prev.lyrics, ...updates },
        updatedAt: Date.now(),
      };
      return applyLyricsAutoTiming(next);
    });
  }, []);

  const updateBackground = useCallback((updates: Partial<BackgroundSettings>) => {
    setProject(prev => ({
      ...prev,
      background: { ...prev.background, ...updates },
      updatedAt: Date.now(),
    }));
  }, []);

  const updateAnimation = useCallback((updates: Partial<AnimationSettings>) => {
    setProject(prev => {
      if (prev.theme === 'lyrics' && (prev.lyrics.timingSource === 'lrc' || prev.lyrics.pacingSource === 'chars')) {
        // In chars pacing mode, animation duration is derived from lyrics.
        // Allow storing other animation fields, but keep duration auto.
        return applyLyricsAutoTiming({
          ...prev,
          animation: { ...prev.animation, ...updates },
          updatedAt: Date.now(),
        });
      }

      const newAnimation = { ...prev.animation, ...updates };
      
      // If WPM preset changed, recalculate duration
      if (updates.wpmPreset && updates.wpmPreset !== 'custom') {
        const wordCount = prev.text.content.split(/\s+/).filter(w => w.length > 0).length;
        const targetWPM = WPM_PRESETS[updates.wpmPreset].wpm;
        const newDuration = calculateDurationFromWPM(wordCount, targetWPM);
        return {
          ...prev,
          animation: { ...newAnimation, targetWPM, duration: newDuration },
          updatedAt: Date.now(),
        };
      }
      
      // If target WPM changed directly, recalculate duration
      if (updates.targetWPM !== undefined && newAnimation.wpmPreset !== 'custom') {
        const wordCount = prev.text.content.split(/\s+/).filter(w => w.length > 0).length;
        const newDuration = calculateDurationFromWPM(wordCount, updates.targetWPM);
        return {
          ...prev,
          animation: { ...newAnimation, duration: newDuration },
          updatedAt: Date.now(),
        };
      }
      
      return {
        ...prev,
        animation: newAnimation,
        updatedAt: Date.now(),
      };
    });
  }, []);

  const updateAudio = useCallback((updates: Partial<AudioSettings>) => {
    setProject(prev => {
      const next = {
        ...prev,
        audio: { ...prev.audio, ...updates },
        updatedAt: Date.now(),
      };

      if (prev.theme === 'lyrics' && prev.lyrics.timingSource === 'lrc') {
        return applyLyricsAutoTiming(next);
      }

      return next;
    });
  }, []);

  const updateWatermark = useCallback((updates: Partial<WatermarkSettings>) => {
    setProject(prev => ({
      ...prev,
      watermark: { ...prev.watermark, ...updates },
      updatedAt: Date.now(),
    }));
  }, []);

  const updateOverlay = useCallback((updates: Partial<OverlayTextSettings>) => {
    setProject(prev => ({
      ...prev,
      overlay: { ...prev.overlay, ...updates },
      updatedAt: Date.now(),
    }));
  }, []);

  const updateTitleOverlay = useCallback((updates: Partial<TitleOverlaySettings>) => {
    setProject(prev => ({
      ...prev,
      titleOverlay: { ...prev.titleOverlay, ...updates },
      updatedAt: Date.now(),
    }));
  }, []);

  const updateEnding = useCallback((updates: Partial<EndingSettings>) => {
    setProject(prev => ({
      ...prev,
      ending: { ...prev.ending, ...updates },
      updatedAt: Date.now(),
    }));
  }, []);

  const updateReels = useCallback((updates: Partial<ReelsThemeSettings>) => {
    setProject(prev => ({
      ...prev,
      reels: { ...prev.reels, ...updates },
      updatedAt: Date.now(),
    }));
  }, []);

  const setCanvasFormat = useCallback((format: CanvasFormat) => {
    updateProject({ canvasFormat: format });
  }, [updateProject]);

  const setTheme = useCallback((theme: VideoProject['theme']) => {
    updateProject({ theme });
  }, [updateProject]);

  const saveProject = useCallback(() => {
    setSavedProjects(prev => {
      const existing = prev.findIndex(p => p.id === project.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = project;
        return updated;
      }
      return [...prev, project];
    });
  }, [project]);

  const loadProject = useCallback((id: string) => {
    const found = savedProjects.find(p => p.id === id);
    if (found) {
      setProject(applyLyricsAutoTiming({
        ...DEFAULT_PROJECT,
        ...found,
        lyrics: { ...DEFAULT_PROJECT.lyrics, ...found.lyrics },
        reels: { ...DEFAULT_PROJECT.reels, ...found.reels },
        text: { ...DEFAULT_PROJECT.text, ...found.text },
        pagedText: { ...DEFAULT_PROJECT.pagedText, ...found.pagedText },
        audio: { ...DEFAULT_PROJECT.audio, ...found.audio },
        animation: { ...DEFAULT_PROJECT.animation, ...found.animation },
        watermark: { ...DEFAULT_PROJECT.watermark, ...found.watermark },
        titleOverlay: { ...DEFAULT_PROJECT.titleOverlay, ...found.titleOverlay },
        overlay: { ...DEFAULT_PROJECT.overlay, ...found.overlay },
        ending: { ...DEFAULT_PROJECT.ending, ...found.ending },
      }));
    }
  }, [savedProjects]);

  const deleteProject = useCallback((id: string) => {
    setSavedProjects(prev => prev.filter(p => p.id !== id));
  }, []);

  const newProject = useCallback(() => {
    setProject({
      ...DEFAULT_PROJECT,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }, []);

  const duplicateProject = useCallback(() => {
    setProject(prev => ({
      ...prev,
      id: generateId(),
      name: `${prev.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
  }, []);

  return {
    project,
    savedProjects,
    updateProject,
    updateText,
    updateLyrics,
    updateReels,
    updateBackground,
    updateAnimation,
    updateAudio,
    updateWatermark,
    updateTitleOverlay,
    updateOverlay,
    updateEnding,
    setCanvasFormat,
    setTheme,
    saveProject,
    loadProject,
    deleteProject,
    newProject,
    duplicateProject,
  };
}
