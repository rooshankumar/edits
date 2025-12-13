import { useState, useCallback, useEffect } from 'react';
import { VideoProject, DEFAULT_PROJECT, CanvasFormat, TextSettings, BackgroundSettings, AnimationSettings, AudioSettings } from '@/types/video-project';

const STORAGE_KEY = 'scrolling-video-projects';
const CURRENT_PROJECT_KEY = 'scrolling-video-current';

const generateId = () => Math.random().toString(36).substring(2, 15);

export function useVideoProject() {
  const [project, setProject] = useState<VideoProject>(() => {
    const saved = localStorage.getItem(CURRENT_PROJECT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure new fields exist with defaults
        return {
          ...DEFAULT_PROJECT,
          ...parsed,
          text: { ...DEFAULT_PROJECT.text, ...parsed.text },
          audio: { ...DEFAULT_PROJECT.audio, ...parsed.audio },
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
        return JSON.parse(saved);
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
    setProject(prev => ({
      ...prev,
      ...updates,
      updatedAt: Date.now(),
    }));
  }, []);

  const updateText = useCallback((updates: Partial<TextSettings>) => {
    setProject(prev => ({
      ...prev,
      text: { ...prev.text, ...updates },
      updatedAt: Date.now(),
    }));
  }, []);

  const updateBackground = useCallback((updates: Partial<BackgroundSettings>) => {
    setProject(prev => ({
      ...prev,
      background: { ...prev.background, ...updates },
      updatedAt: Date.now(),
    }));
  }, []);

  const updateAnimation = useCallback((updates: Partial<AnimationSettings>) => {
    setProject(prev => ({
      ...prev,
      animation: { ...prev.animation, ...updates },
      updatedAt: Date.now(),
    }));
  }, []);

  const updateAudio = useCallback((updates: Partial<AudioSettings>) => {
    setProject(prev => ({
      ...prev,
      audio: { ...prev.audio, ...updates },
      updatedAt: Date.now(),
    }));
  }, []);

  const setCanvasFormat = useCallback((format: CanvasFormat) => {
    updateProject({ canvasFormat: format });
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
      setProject({
        ...DEFAULT_PROJECT,
        ...found,
        text: { ...DEFAULT_PROJECT.text, ...found.text },
        audio: { ...DEFAULT_PROJECT.audio, ...found.audio },
      });
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
    updateBackground,
    updateAnimation,
    updateAudio,
    setCanvasFormat,
    saveProject,
    loadProject,
    deleteProject,
    newProject,
    duplicateProject,
  };
}
