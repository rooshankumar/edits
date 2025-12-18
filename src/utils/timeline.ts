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
  // If ending is enabled, transition smoothly in last 0.5s of content
  const transitionDuration = 0.5;
  const transitionStart = endingEnabled ? contentDuration - transitionDuration : contentDuration;
  const isEnding = endingEnabled && currentTime >= contentDuration;
  
  // Progress through content (0 = start, 1 = end)
  // IMPORTANT: Stop scrolling before content ends so last text stays visible
  const scrollEndTime = endingEnabled ? transitionStart : contentDuration;
  const progress = contentDuration > 0 
    ? Math.min(currentTime / scrollEndTime, 1)
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
 * Unified scroll position calculation
 * Used by BOTH preview and export to ensure identical animations
 */
export function calculateScrollPosition(
  progress: number,
  viewportHeight: number,
  contentHeight: number
): number {
  // Calculate scroll so text starts below viewport and scrolls up
  // When progress = 0: text is below viewport (startPosition)
  // When progress = 1: last text frozen with bottom margin for Instagram UI
  
  // Reserve bottom space for Instagram reel UI (like/comment/share buttons)
  // ~75px = 2cm at typical phone DPI (160dpi: 2cm = 75.6px)
  const instagramUIMargin = 75;
  const effectiveViewportHeight = viewportHeight - instagramUIMargin;
  
  const totalScrollDistance = viewportHeight + contentHeight;
  const startPosition = viewportHeight;
  
  // Stop when last text is visible with bottom margin for Instagram UI
  // This ensures text doesn't overlap with Instagram's interaction buttons
  const maxScroll = contentHeight > effectiveViewportHeight 
    ? totalScrollDistance - effectiveViewportHeight 
    : totalScrollDistance;
  
  const scrollPosition = startPosition - (progress * maxScroll);
  
  // Clamp to ensure last text stays visible with Instagram UI margin
  return Math.max(scrollPosition, -contentHeight + effectiveViewportHeight);
}

/**
 * Calculate opacity for smooth transition between content and ending
 */
export function calculateTransitionOpacity(currentTime: number, contentDuration: number, endingEnabled: boolean): { contentOpacity: number; endingOpacity: number } {
  if (!endingEnabled) {
    return { contentOpacity: 1, endingOpacity: 0 };
  }
  
  const transitionDuration = 0.5;
  const transitionStart = contentDuration - transitionDuration;
  
  if (currentTime < transitionStart) {
    return { contentOpacity: 1, endingOpacity: 0 };
  } else if (currentTime >= contentDuration) {
    return { contentOpacity: 0, endingOpacity: 1 };
  } else {
    // Smooth fade transition
    const transitionProgress = (currentTime - transitionStart) / transitionDuration;
    return { 
      contentOpacity: 1 - transitionProgress, 
      endingOpacity: transitionProgress 
    };
  }
}

/**
 * Calculate relative font size based on canvas height
 * Ensures text scales proportionally across all resolutions
 */
export function calculateRelativeFontSize(
  baseFontSize: number,
  canvasHeight: number,
  baseHeight: number = 1920
): number {
  return Math.round((baseFontSize / baseHeight) * canvasHeight);
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
