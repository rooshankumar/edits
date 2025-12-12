import { useRef, useState, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';

interface TimelineBarProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
}

export function TimelineBar({ currentTime, duration, isPlaying, onSeek }: TimelineBarProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSliderChange = (value: number[]) => {
    const newTime = (value[0] / 100) * duration;
    onSeek(newTime);
  };

  return (
    <div className="w-full space-y-2">
      {/* Timeline Slider */}
      <div className="relative">
        <Slider
          value={[progress]}
          onValueChange={handleSliderChange}
          max={100}
          step={0.1}
          className="w-full cursor-pointer"
        />
      </div>

      {/* Time Display */}
      <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
        <span className="tabular-nums">{formatTime(currentTime)}</span>
        <div className="flex items-center gap-2">
          <span className={isPlaying ? 'text-primary animate-pulse' : ''}>
            {isPlaying ? '● REC' : '○ PAUSED'}
          </span>
        </div>
        <span className="tabular-nums">{formatTime(duration)}</span>
      </div>

      {/* Frame Markers */}
      <div className="flex justify-between px-1">
        {[0, 25, 50, 75, 100].map((mark) => (
          <button
            key={mark}
            onClick={() => onSeek((mark / 100) * duration)}
            className="w-1 h-2 bg-border hover:bg-primary transition-colors rounded-full"
            title={`Jump to ${mark}%`}
          />
        ))}
      </div>
    </div>
  );
}
