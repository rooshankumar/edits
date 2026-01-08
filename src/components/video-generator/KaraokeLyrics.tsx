import { useMemo, useCallback } from 'react';
import { VideoProject } from '@/types/video-project';
import { 
  KaraokeLrc, 
  getKaraokeProgress, 
  getKaraokePageInfo, 
  getEstimatedWordProgress,
  findActiveKaraokeLineIndex 
} from '@/utils/karaokeLrc';
import { cn } from '@/lib/utils';

interface KaraokeLyricsProps {
  project: VideoProject;
  currentTime: number;
  contentDuration: number;
  karaokeLrc: KaraokeLrc | null;
  lyricLines: string[];
  lyricsTiming: {
    lineDurations: number[];
    lineStarts: number[];
    totalLines: number;
    totalDuration: number;
  };
  scaledFontSize: number;
  scaledPaddingX: number;
  scaledPaddingY: number;
  scaledLetterSpacing: number;
  scaledLineHeight: number;
  transitionOpacity: number;
}

export const KaraokeLyrics = ({
  project,
  currentTime,
  contentDuration,
  karaokeLrc,
  lyricLines,
  lyricsTiming,
  scaledFontSize,
  scaledPaddingX,
  scaledPaddingY,
  scaledLetterSpacing,
  scaledLineHeight,
  transitionOpacity,
}: KaraokeLyricsProps) => {
  
  // Get current line index
  const activeLineIndex = useMemo(() => {
    if (project.lyrics.timingSource === 'lrc' && karaokeLrc) {
      return findActiveKaraokeLineIndex(karaokeLrc.lines, currentTime + project.lyrics.lrcOffsetSeconds);
    }
    
    const totalLines = lyricsTiming.totalLines;
    if (totalLines <= 1) return 0;
    const t = Math.min(Math.max(0, currentTime), lyricsTiming.totalDuration - 0.000001);
    
    for (let i = totalLines - 1; i >= 0; i--) {
      if (t >= lyricsTiming.lineStarts[i]) return i;
    }
    return 0;
  }, [currentTime, karaokeLrc, lyricsTiming, project.lyrics.lrcOffsetSeconds, project.lyrics.timingSource]);

  // Get page info for pages display mode
  const pageInfo = useMemo(() => {
    return getKaraokePageInfo(
      lyricLines.length,
      activeLineIndex,
      project.lyrics.linesPerPage
    );
  }, [lyricLines.length, activeLineIndex, project.lyrics.linesPerPage]);

  // Get word progress for highlighting
  const wordProgress = useMemo(() => {
    if (project.lyrics.timingSource === 'lrc' && karaokeLrc) {
      return getKaraokeProgress(
        karaokeLrc,
        currentTime,
        project.lyrics.lrcOffsetSeconds,
        project.lyrics.highlightLeadSeconds
      );
    }
    
    // Estimated timing
    const lineStartTime = lyricsTiming.lineStarts[activeLineIndex] ?? 0;
    const lineDuration = lyricsTiming.lineDurations[activeLineIndex] ?? 0;
    const timeInLine = Math.max(0, currentTime - lineStartTime);
    const lineText = lyricLines[activeLineIndex] ?? '';
    
    const estimated = getEstimatedWordProgress(
      lineText,
      lineDuration,
      timeInLine,
      project.lyrics.highlightLeadSeconds
    );
    
    return {
      lineIndex: activeLineIndex,
      wordIndex: estimated.wordIndex,
      within: estimated.within,
      highlightedWords: estimated.highlightedWords,
    };
  }, [activeLineIndex, currentTime, karaokeLrc, lyricLines, lyricsTiming, project.lyrics]);

  // Parse highlight color
  const highlightRgb = useMemo(() => {
    const raw = (project.lyrics.highlightBgColor || '#FFD60A').trim();
    const hex = raw.startsWith('#') ? raw.slice(1) : raw;
    const full = hex.length === 3
      ? `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`
      : hex;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    if (![r, g, b].every(Number.isFinite)) return { r: 255, g: 214, b: 10 };
    return { r, g, b };
  }, [project.lyrics.highlightBgColor]);

  // Common text styles
  const commonStyle: React.CSSProperties = useMemo(() => ({
    fontFamily: project.text.fontFamily,
    fontWeight: project.text.isBold ? 'bold' : 'normal',
    fontStyle: project.text.isItalic ? 'italic' : 'normal',
    letterSpacing: `${scaledLetterSpacing}px`,
    textAlign: project.text.textAlign,
    color: project.text.color,
    width: `${project.text.containerWidth}%`,
    textShadow: '0 6px 18px rgba(0,0,0,0.55)',
  }), [project.text, scaledLetterSpacing]);

  // Render a single word with highlight
  const renderWord = useCallback((
    word: string, 
    wordIdx: number, 
    isActiveWord: boolean,
    isHighlighted: boolean,
    wordWithin: number
  ) => {
    const baseDim = project.lyrics.unhighlightedOpacity ?? 0.4;
    const safeDim = Math.max(0, Math.min(1, baseDim));
    const highlightBgOpacity = Math.min(1, 0.12 + project.lyrics.highlightIntensity * 0.45);
    
    // Determine highlight style
    let bgStyle: React.CSSProperties = {};
    
    if (isHighlighted) {
      if (project.lyrics.wordHighlightStyle === 'sweep' && isActiveWord) {
        // Sweep: gradient from left showing progress
        bgStyle = {
          background: `linear-gradient(90deg, rgba(${highlightRgb.r}, ${highlightRgb.g}, ${highlightRgb.b}, ${highlightBgOpacity}) ${wordWithin * 100}%, transparent ${wordWithin * 100}%)`,
          borderRadius: '4px',
          padding: '2px 6px',
          margin: '0 -2px',
        };
      } else if (isHighlighted) {
        // Fill: solid background for completed words
        bgStyle = {
          background: `rgba(${highlightRgb.r}, ${highlightRgb.g}, ${highlightRgb.b}, ${highlightBgOpacity})`,
          borderRadius: '4px',
          padding: '2px 6px',
          margin: '0 -2px',
        };
      }
    }

    return (
      <span
        key={wordIdx}
        style={{
          opacity: (isHighlighted ? 1 : safeDim) * (project.lyrics.textOpacity ?? 1),
          transition: 'opacity 0.15s ease',
          display: 'inline',
          ...bgStyle,
        }}
      >
        {word}
      </span>
    );
  }, [highlightRgb, project.lyrics.highlightIntensity, project.lyrics.textOpacity, project.lyrics.unhighlightedOpacity, project.lyrics.wordHighlightStyle]);

  // Render a line with word-level highlighting
  const renderLine = useCallback((
    lineText: string,
    lineIdx: number,
    isActiveLine: boolean,
    fontSize: number
  ) => {
    const baseDim = project.lyrics.unhighlightedOpacity ?? 0.4;
    const safeDim = Math.max(0, Math.min(1, baseDim));
    const words = lineText.trim().split(/\s+/).filter(Boolean);
    
    // Get word tokens from LRC if available
    let wordTokens: string[] = words;
    if (project.lyrics.timingSource === 'lrc' && karaokeLrc && karaokeLrc.lines[lineIdx]) {
      const line = karaokeLrc.lines[lineIdx];
      if (line.words.length > 0) {
        wordTokens = line.words.map(w => w.text);
      }
    }

    return (
      <div
        key={`line-${lineIdx}`}
        style={{
          ...commonStyle,
          fontSize: `${fontSize}px`,
          lineHeight: scaledLineHeight,
          opacity: isActiveLine ? transitionOpacity : transitionOpacity * safeDim,
          transition: `opacity ${project.lyrics.pageTransitionDuration}s ease`,
        }}
        className="text-center"
      >
        {isActiveLine && project.text.waveAnimation ? (
          <span className="inline-flex flex-wrap justify-center gap-1">
            {wordTokens.map((word, wIdx) => {
              const isCurrentWord = wIdx === wordProgress.wordIndex;
              const isHighlighted = wordProgress.highlightedWords.includes(wIdx);
              const wordWithin = isCurrentWord ? wordProgress.within : (isHighlighted ? 1 : 0);
              
              return renderWord(word, wIdx, isCurrentWord, isHighlighted, wordWithin);
            })}
          </span>
        ) : (
          lineText
        )}
      </div>
    );
  }, [commonStyle, karaokeLrc, project.lyrics.pageTransitionDuration, project.lyrics.timingSource, project.lyrics.unhighlightedOpacity, project.text.waveAnimation, renderWord, scaledLineHeight, transitionOpacity, wordProgress]);

  // Calculate font sizes
  const baseFontSize = scaledFontSize * 0.9;
  const activeFontSize = baseFontSize * 1.2;

  // Get lines to display based on display mode
  const displayLines = useMemo(() => {
    if (project.lyrics.displayMode === 'pages') {
      return lyricLines.slice(pageInfo.pageStart, pageInfo.pageEnd + 1).map((line, i) => ({
        text: line,
        originalIndex: pageInfo.pageStart + i,
      }));
    }
    
    if (project.lyrics.displayMode === 'full') {
      return lyricLines.map((line, i) => ({
        text: line,
        originalIndex: i,
      }));
    }
    
    // Lines mode: show prev, current, next
    const prev = lyricLines[activeLineIndex - 1] ?? '';
    const curr = lyricLines[activeLineIndex] ?? '';
    const next = lyricLines[activeLineIndex + 1] ?? '';
    
    return [
      { text: prev, originalIndex: activeLineIndex - 1 },
      { text: curr, originalIndex: activeLineIndex },
      { text: next, originalIndex: activeLineIndex + 1 },
    ];
  }, [activeLineIndex, lyricLines, pageInfo, project.lyrics.displayMode]);

  // Calculate progress for progress bar
  const overallProgress = useMemo(() => {
    if (contentDuration <= 0) return 0;
    return Math.min(1, Math.max(0, currentTime / contentDuration));
  }, [currentTime, contentDuration]);

  return (
    <div
      className={cn(
        'w-full h-full flex flex-col justify-center',
        project.text.textAlign === 'left' && 'items-start',
        project.text.textAlign === 'center' && 'items-center',
        project.text.textAlign === 'right' && 'items-end'
      )}
      style={{
        paddingTop: `${scaledPaddingY}px`,
        paddingBottom: `${scaledPaddingY}px`,
        paddingLeft: `${scaledPaddingX}px`,
        paddingRight: `${scaledPaddingX}px`,
        opacity: transitionOpacity * (project.lyrics.textOpacity ?? 1),
        transition: `opacity ${project.lyrics.pageTransitionDuration}s ease`,
      }}
    >
      {project.lyrics.displayMode === 'lines' ? (
        // Lines mode: prev / current / next
        <div className="flex flex-col items-center gap-3 w-full">
          {displayLines[0]?.text && (
            <div style={{ ...commonStyle, opacity: (project.lyrics.unhighlightedOpacity ?? 0.4) * 0.875, fontSize: `${scaledFontSize * 0.7}px`, lineHeight: scaledLineHeight }}>
              {displayLines[0].text}
            </div>
          )}
          {renderLine(displayLines[1]?.text || '', displayLines[1]?.originalIndex ?? activeLineIndex, true, scaledFontSize * 1.25)}
          {displayLines[2]?.text && (
            <div style={{ ...commonStyle, opacity: (project.lyrics.unhighlightedOpacity ?? 0.4) * 0.875, fontSize: `${scaledFontSize * 0.7}px`, lineHeight: scaledLineHeight }}>
              {displayLines[2].text}
            </div>
          )}
        </div>
      ) : (
        // Pages or Full mode: show all lines on current page
        <div className="flex flex-col items-center gap-2 w-full">
          {displayLines.map((line) => {
            const isActive = line.originalIndex === activeLineIndex;
            const fontSize = isActive ? activeFontSize : baseFontSize;
            return renderLine(line.text, line.originalIndex, isActive, fontSize);
          })}
        </div>
      )}

      {/* Progress bar */}
      {project.lyrics.showProgressBar && (
        <div 
          className="absolute bottom-4 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-white/20 rounded-full overflow-hidden"
          style={{ opacity: transitionOpacity * 0.6 }}
        >
          <div 
            className="h-full rounded-full transition-all duration-100"
            style={{ 
              width: `${overallProgress * 100}%`,
              background: `rgba(${highlightRgb.r}, ${highlightRgb.g}, ${highlightRgb.b}, 0.8)`,
            }}
          />
        </div>
      )}

      {/* Page indicator */}
      {project.lyrics.displayMode === 'pages' && pageInfo.totalPages > 1 && (
        <div 
          className="absolute top-4 right-4 text-white/40 text-sm font-mono"
          style={{ opacity: transitionOpacity * 0.5 }}
        >
          {pageInfo.currentPage + 1} / {pageInfo.totalPages}
        </div>
      )}
    </div>
  );
};
