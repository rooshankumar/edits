import { useMemo } from 'react';
import { VideoProject, CANVAS_SIZES } from '@/types/video-project';
import { parseKaraokeLrc, scaleKaraokeLrc, findActiveKaraokeLineIndex, findKaraokeWordProgress, getEstimatedWordProgress } from '@/utils/karaokeLrc';

interface ReelsLyricsProps {
  project: VideoProject;
  currentTime: number;
  contentDuration: number;
  scaleFactor: number;
}

export function ReelsLyrics({ project, currentTime, contentDuration, scaleFactor }: ReelsLyricsProps) {
  const canvasSize = CANVAS_SIZES[project.canvasFormat];
  
  // Parse LRC if available
  const karaokeLrc = useMemo(() => {
    if (project.reels.syncMode !== 'lrc') return null;
    if (!project.reels.lrcContent?.trim()) return null;
    const parsed = parseKaraokeLrc(project.reels.lrcContent);
    if (!parsed) return null;

    // Auto-scale to audio if available
    if (project.audio.duration && project.audio.duration > 0 && parsed.duration > 0) {
      const scale = project.audio.duration / parsed.duration;
      return scaleKaraokeLrc(parsed, scale);
    }
    return parsed;
  }, [project.reels.lrcContent, project.reels.syncMode, project.audio.duration]);

  // Get lyrics lines
  const lyricLines = useMemo(() => {
    if (karaokeLrc) {
      return karaokeLrc.lines.map(l => l.text);
    }
    return (project.text.content || '').split('\n').filter(l => l.trim());
  }, [karaokeLrc, project.text.content]);

  // Calculate line timing for non-LRC mode
  const lineTiming = useMemo(() => {
    if (karaokeLrc) {
      return karaokeLrc.lines.map(l => ({ start: l.start, duration: l.end - l.start }));
    }
    
    const totalLines = Math.max(1, lyricLines.length);
    const duration = contentDuration > 0 ? contentDuration : 10;
    const lineDuration = duration / totalLines;
    
    return lyricLines.map((_, i) => ({
      start: i * lineDuration,
      duration: lineDuration,
    }));
  }, [karaokeLrc, lyricLines, contentDuration]);

  // Get active line index
  const activeLineIndex = useMemo(() => {
    if (karaokeLrc) {
      return findActiveKaraokeLineIndex(karaokeLrc.lines, currentTime);
    }
    
    for (let i = lineTiming.length - 1; i >= 0; i--) {
      if (currentTime >= lineTiming[i].start) return i;
    }
    return 0;
  }, [karaokeLrc, currentTime, lineTiming]);

  // Get word progress for current line
  const wordProgress = useMemo(() => {
    if (karaokeLrc) {
      const line = karaokeLrc.lines[activeLineIndex];
      if (!line) return { wordIndex: 0, within: 0, highlightedWords: [] };
      
      const { wordIndex, within } = findKaraokeWordProgress(line, currentTime);
      const highlightedWords: number[] = [];
      for (let i = 0; i <= wordIndex; i++) highlightedWords.push(i);
      return { wordIndex, within, highlightedWords };
    }
    
    const timing = lineTiming[activeLineIndex];
    if (!timing) return { wordIndex: 0, within: 0, highlightedWords: [] };
    
    const lineText = lyricLines[activeLineIndex] || '';
    const timeInLine = Math.max(0, currentTime - timing.start);
    return getEstimatedWordProgress(lineText, timing.duration, timeInLine);
  }, [karaokeLrc, activeLineIndex, currentTime, lineTiming, lyricLines]);

  // Calculate visible lines
  const visibleLines = useMemo(() => {
    const linesVisible = project.reels.linesVisible;
    const half = Math.floor(linesVisible / 2);
    
    // Center current line
    let startIdx = activeLineIndex - half;
    let endIdx = startIdx + linesVisible;
    
    // Adjust if out of bounds
    if (startIdx < 0) {
      startIdx = 0;
      endIdx = Math.min(linesVisible, lyricLines.length);
    }
    if (endIdx > lyricLines.length) {
      endIdx = lyricLines.length;
      startIdx = Math.max(0, endIdx - linesVisible);
    }
    
    return lyricLines.slice(startIdx, endIdx).map((text, i) => ({
      text,
      originalIndex: startIdx + i,
    }));
  }, [activeLineIndex, lyricLines, project.reels.linesVisible]);

  // Font size calculation
  const baseFontSize = useMemo(() => {
    const baseSize = project.text.fontSize * scaleFactor;
    // Scale based on canvas - larger for vertical, smaller for horizontal
    const aspectRatio = canvasSize.height / canvasSize.width;
    return baseSize * (aspectRatio > 1 ? 1.1 : 0.9);
  }, [project.text.fontSize, scaleFactor, canvasSize]);

  // Calculate kinetic offset
  const kineticOffset = useMemo(() => {
    if (!project.reels.kinetic) return 0;
    const progress = contentDuration > 0 ? currentTime / contentDuration : 0;
    // Gentle upward drift
    return progress * project.reels.kineticSpeed * 100 * scaleFactor;
  }, [project.reels.kinetic, project.reels.kineticSpeed, currentTime, contentDuration, scaleFactor]);

  const highlightColor = project.reels.highlightColor;
  const unhighlightedOpacity = project.reels.unhighlightedOpacity;
  
  // Easing function for CSS
  const easingCurve = useMemo(() => {
    switch (project.reels.easingType) {
      case 'ease-in-out': return 'cubic-bezier(0.4, 0, 0.2, 1)';
      case 'spring': return 'cubic-bezier(0.34, 1.56, 0.64, 1)';
      default: return 'linear';
    }
  }, [project.reels.easingType]);

  // Text shadow style
  const textShadowStyle = useMemo(() => {
    if (!project.reels.textShadow) return 'none';
    const blur = project.reels.textShadowBlur * scaleFactor;
    const opacity = project.reels.textShadowOpacity;
    return `0 ${blur * 0.4}px ${blur}px rgba(0, 0, 0, ${opacity})`;
  }, [project.reels.textShadow, project.reels.textShadowBlur, project.reels.textShadowOpacity, scaleFactor]);

  // Get highlight styles based on type
  const getWordStyle = (isHighlighted: boolean, isCurrentWord: boolean, wordWithin: number): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      display: 'inline-block',
      padding: '2px 6px',
      borderRadius: `${4 * scaleFactor}px`,
      transitionProperty: 'all',
      transitionDuration: `${project.reels.wordTransitionSpeed}s`,
      transitionTimingFunction: easingCurve,
    };

    switch (project.reels.highlightType) {
      case 'glow':
        return {
          ...baseStyle,
          color: project.text.color,
          opacity: isHighlighted ? 1 : unhighlightedOpacity,
          filter: isHighlighted 
            ? `brightness(1.3) drop-shadow(0 0 ${project.reels.glowIntensity * scaleFactor}px ${highlightColor})`
            : 'brightness(0.7)',
          textShadow: isHighlighted 
            ? `0 0 ${project.reels.glowIntensity * scaleFactor}px ${highlightColor}, 0 0 ${project.reels.glowIntensity * 2 * scaleFactor}px ${highlightColor}`
            : textShadowStyle,
        };

      case 'color-change':
        return {
          ...baseStyle,
          color: isHighlighted ? highlightColor : project.text.color,
          opacity: isHighlighted ? 1 : unhighlightedOpacity,
          textShadow: textShadowStyle,
        };

      case 'sweep':
      default:
        const bgStyle: React.CSSProperties = {};
        if (isCurrentWord) {
          bgStyle.background = `linear-gradient(90deg, ${highlightColor} ${wordWithin * 100}%, transparent ${wordWithin * 100}%)`;
        } else if (isHighlighted) {
          bgStyle.background = highlightColor;
        }
        return {
          ...baseStyle,
          ...bgStyle,
          color: project.text.color,
          opacity: isHighlighted ? 1 : unhighlightedOpacity,
          textShadow: textShadowStyle,
        };
    }
  };

  return (
    <div 
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{
        padding: `${project.text.paddingY * scaleFactor}px ${project.text.paddingX * scaleFactor}px`,
      }}
    >
      {/* Vignette overlay */}
      {project.reels.vignette && (
        <div 
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: `radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, ${project.reels.vignetteIntensity}) 100%)`,
          }}
        />
      )}

      <div 
        className="flex flex-col items-center gap-2 relative z-0"
        style={{
          width: `${project.text.containerWidth}%`,
          fontFamily: project.text.fontFamily,
          fontSize: `${baseFontSize}px`,
          fontWeight: project.text.isBold ? 'bold' : 'normal',
          fontStyle: project.text.isItalic ? 'italic' : 'normal',
          lineHeight: project.text.lineHeight,
          letterSpacing: `${project.text.letterSpacing * scaleFactor}px`,
          textAlign: project.text.textAlign,
          transform: `translateY(-${kineticOffset}px)`,
          transition: `transform 0.1s ${easingCurve}`,
        }}
      >
        {visibleLines.map((line, lineIdx) => {
          const isActiveLine = line.originalIndex === activeLineIndex;
          const isPastLine = line.originalIndex < activeLineIndex;
          
          const words = line.text.split(/(\s+)/);
          let wordIdx = 0;
          
          return (
            <div 
              key={line.originalIndex}
              style={{
                opacity: isActiveLine ? 1 : (isPastLine ? 1 : unhighlightedOpacity),
                transitionProperty: 'opacity',
                transitionDuration: `${project.reels.lineTransitionSpeed}s`,
                transitionTimingFunction: easingCurve,
              }}
            >
              {words.map((segment, segIdx) => {
                // Skip empty segments
                if (!segment) return null;
                
                // Handle whitespace
                if (/^\s+$/.test(segment)) {
                  return <span key={segIdx}>{segment}</span>;
                }
                
                const currentWordIdx = wordIdx;
                wordIdx++;
                
                let isHighlighted = false;
                let isCurrentWord = false;
                let wordWithin = 0;
                
                if (isPastLine) {
                  // All words in past lines are highlighted
                  isHighlighted = true;
                } else if (isActiveLine) {
                  isHighlighted = currentWordIdx <= wordProgress.wordIndex;
                  isCurrentWord = currentWordIdx === wordProgress.wordIndex;
                  wordWithin = wordProgress.within;
                }
                
                return (
                  <span
                    key={segIdx}
                    style={getWordStyle(isHighlighted, isCurrentWord, wordWithin)}
                  >
                    {segment}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}