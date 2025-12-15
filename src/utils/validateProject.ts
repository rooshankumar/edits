/**
 * Project validation for export QA
 */

import { VideoProject } from '@/types/video-project';
import { computeTimeline, validateTimeline } from './timeline';

export interface ValidationResult {
  isReady: boolean;
  checks: ValidationCheck[];
}

export interface ValidationCheck {
  id: string;
  label: string;
  status: 'pass' | 'warning' | 'error';
  message?: string;
}

export function validateProjectForExport(project: VideoProject): ValidationResult {
  const checks: ValidationCheck[] = [];
  
  // Compute timeline
  const timeline = computeTimeline(
    project.text.content,
    project.animation.wpmPreset,
    project.animation.wpmPreset === 'custom' ? project.animation.duration : null,
    project.ending.enabled,
    project.ending.duration
  );
  
  const timelineValidation = validateTimeline(timeline);
  
  // Check 1: Content
  checks.push({
    id: 'content',
    label: 'Text content',
    status: timeline.wordCount > 0 ? 'pass' : 'warning',
    message: timeline.wordCount > 0 
      ? `${timeline.wordCount} words` 
      : 'No text content',
  });
  
  // Check 2: Reading speed
  const wpmStatus = timeline.targetWPM > 600 ? 'error' 
    : timeline.targetWPM > 400 ? 'warning' 
    : 'pass';
  checks.push({
    id: 'wpm',
    label: 'Reading speed',
    status: wpmStatus,
    message: `${timeline.targetWPM} WPM ${
      wpmStatus === 'pass' ? '(comfortable)' 
      : wpmStatus === 'warning' ? '(fast)' 
      : '(too fast!)'
    }`,
  });
  
  // Check 3: Duration
  checks.push({
    id: 'duration',
    label: 'Video duration',
    status: timeline.totalDuration >= 3 && timeline.totalDuration <= 120 ? 'pass' : 'warning',
    message: `${timeline.totalDuration}s total`,
  });
  
  // Check 4: Audio
  const hasAudio = !!project.audio.file;
  checks.push({
    id: 'audio',
    label: 'Background audio',
    status: hasAudio ? 'pass' : 'warning',
    message: hasAudio ? 'Will be included' : 'No audio (silent video)',
  });
  
  // Check 5: Ending
  if (project.ending.enabled) {
    checks.push({
      id: 'ending',
      label: 'Ending card',
      status: 'pass',
      message: `${project.ending.duration}s ending`,
    });
  }
  
  const hasErrors = checks.some(c => c.status === 'error') || !timelineValidation.isValid;
  
  return {
    isReady: !hasErrors,
    checks,
  };
}
