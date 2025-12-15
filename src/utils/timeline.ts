/**
 * Unified Timeline Engine - Single source of truth for all timing calculations
 * This ensures preview and export use identical timing logic
 */

import { WPMPreset, WPM_PRESETS } from '@/types/video-project';

export interface TimelineState {
  wordCount: number;
  targetWPM: number;
  contentDuration: number;  // Main scrolling content duration
  endingDuration: number;   // Ending card duration (0 if disabled)
  totalDuration: number;    // content + ending
}

export interface ScrollState {
  progress: number;         // 0-1 progress through content
  isEnding: boolean;        // Whether we're in ending phase
  scrollOffsetPercent: number; // -100 to 100 for CSS transform
}

/**
 * Compute timeline from text content and settings
 * This is THE source of truth for duration calculations
 */
export function computeTimeline(
  text: string,
  wpmPreset: WPMPreset,
  customDuration: number | null,
  endingEnabled: boolean,
  endingDuration: number
): TimelineState {
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  
  let targetWPM: number;
  let contentDuration: number;
  
  if (wpmPreset === 'custom' && customDuration !== null) {
    // Manual mode: use custom duration, calculate WPM
    contentDuration = Math.max(3, customDuration);
    targetWPM = wordCount > 0 ? Math.round((wordCount / contentDuration) * 60) : 0;
  } else {
    // Auto mode: use WPM preset to calculate duration
    targetWPM = WPM_PRESETS[wpmPreset]?.wpm || 150;
    contentDuration = wordCount > 0 
      ? Math.max(5, Math.ceil((wordCount / targetWPM) * 60))
      : 10; // Default 10s for empty text
  }
  
  const actualEndingDuration = endingEnabled ? endingDuration : 0;
  
  return {
    wordCount,
    targetWPM,
    contentDuration,
    endingDuration: actualEndingDuration,
    totalDuration: contentDuration + actualEndingDuration,
  };
}

/**
 * Calculate scroll state at a given time
 * Used by BOTH preview and export for identical animation
 */
export function computeScrollState(
  currentTime: number,
  contentDuration: number,
  endingEnabled: boolean
): ScrollState {
  const isEnding = endingEnabled && currentTime >= contentDuration;
  
  // Progress through content (0 = start, 1 = end)
  const progress = contentDuration > 0 
    ? Math.min(currentTime / contentDuration, 1)
    : 0;
  
  // Scroll offset: starts at 100% (off bottom), ends at -100% (off top)
  // This creates movie credits style animation
  const scrollOffsetPercent = (1 - progress * 2) * 100;
  
  return {
    progress,
    isEnding,
    scrollOffsetPercent,
  };
}

/**
 * Calculate WPM from current duration
 */
export function calculateWPM(wordCount: number, duration: number): number {
  if (duration <= 0 || wordCount <= 0) return 0;
  return Math.round((wordCount / duration) * 60);
}

/**
 * Get WPM warning level for UI display
 */
export function getWPMLevel(wpm: number): 'good' | 'warning' | 'danger' {
  if (wpm <= 180) return 'good';      // Beginner-friendly
  if (wpm <= 300) return 'warning';   // Average to comfortable
  return 'danger';                     // Too fast for most readers
}

/**
 * Validate timeline for export readiness
 */
export interface TimelineValidation {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

export function validateTimeline(timeline: TimelineState): TimelineValidation {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  if (timeline.wordCount === 0) {
    warnings.push('No text content - video will be empty');
  }
  
  if (timeline.targetWPM > 600) {
    errors.push(`Reading speed (${timeline.targetWPM} WPM) is too fast to read`);
  } else if (timeline.targetWPM > 400) {
    warnings.push(`Reading speed (${timeline.targetWPM} WPM) may be too fast for most readers`);
  }
  
  if (timeline.contentDuration < 3) {
    errors.push('Video is too short (minimum 3 seconds)');
  }
  
  if (timeline.totalDuration > 120) {
    warnings.push('Video is over 2 minutes - consider breaking into parts');
  }
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}
