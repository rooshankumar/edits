import { useMemo, useState, useRef } from 'react';
import { 
  Type, Palette, Sparkles, Music, ChevronDown, ChevronUp, 
  Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  ArrowUp, ArrowLeft, ArrowRight, RotateCcw, X, Image as ImageIcon, Film,
  Stamp, Layers, Flag, AlertTriangle, Maximize2
} from 'lucide-react';
import { 
  VideoProject, TextSettings, BackgroundSettings, AnimationSettings, AudioSettings,
  WatermarkSettings, OverlayTextSettings, EndingSettings,
  FONT_FAMILIES, CANVAS_SIZES, CanvasFormat, VideoTheme, LyricsPacingSource, LyricsThemeSettings, WPMPreset, WPM_PRESETS,
  LyricsTimingSource, LyricsDisplayMode
} from '@/types/video-project';
import { TimelineState, getWPMLevel } from '@/utils/timeline';
import { getContentLengthCategory } from '@/utils/textScaling';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AudioControls } from './AudioControls';
import { WatermarkControls } from './WatermarkControls';
import { OverlayControls } from './OverlayControls';
import { EndingControls } from './EndingControls';
import { cn } from '@/lib/utils';
import { parseKaraokeLrc } from '@/utils/karaokeLrc';

interface CompactEditorProps {
  project: VideoProject;
  timeline: TimelineState;
  onProjectChange: (updates: Partial<VideoProject>) => void;
  onThemeChange: (theme: VideoTheme) => void;
  onLyricsChange: (updates: Partial<LyricsThemeSettings>) => void;
  onCanvasFormatChange: (format: CanvasFormat) => void;
  onTextChange: (updates: Partial<TextSettings>) => void;
  onBackgroundChange: (updates: Partial<BackgroundSettings>) => void;
  onAnimationChange: (updates: Partial<AnimationSettings>) => void;
  onAudioChange: (updates: Partial<AudioSettings>) => void;
  onWatermarkChange: (updates: Partial<WatermarkSettings>) => void;
  onOverlayChange: (updates: Partial<OverlayTextSettings>) => void;
  onEndingChange: (updates: Partial<EndingSettings>) => void;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  accentColor?: string;
  badge?: string;
}

function Section({ title, icon, defaultOpen = true, children, accentColor, badge }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 excel-hover bg-card border-b border-border',
          isOpen && 'bg-excel-selected'
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">{title}</span>
          {badge && (
            <span className="px-1.5 py-0.5 text-[9px] font-medium bg-primary/10 text-primary">{badge}</span>
          )}
        </div>
        {isOpen ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
      </button>
      {isOpen && (
        <div className="p-3 space-y-3 bg-card">
          {children}
        </div>
      )}
    </div>
  );
}

const durationPresets = [5, 10, 15, 30, 60];
const canvasOptions: { value: CanvasFormat; label: string }[] = [
  { value: 'vertical', label: 'Reel' },
  { value: 'horizontal', label: 'Desktop' },
  { value: 'square', label: 'Square' },
  { value: 'instagram-post', label: 'IG' },
];

export function CompactEditor({
  project,
  timeline,
  onProjectChange,
  onThemeChange,
  onLyricsChange,
  onCanvasFormatChange,
  onTextChange,
  onBackgroundChange,
  onAnimationChange,
  onAudioChange,
  onWatermarkChange,
  onOverlayChange,
  onEndingChange,
}: CompactEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [activePageIndex, setActivePageIndex] = useState(0);

  const karaokeMeta = useMemo(() => {
    if (project.theme !== 'lyrics') return null;
    if (project.lyrics.timingSource !== 'lrc') return null;
    if (project.lyrics.karaokeLrc.trim().length === 0) return null;
    return parseKaraokeLrc(project.lyrics.karaokeLrc);
  }, [project.lyrics.karaokeLrc, project.lyrics.timingSource, project.theme]);

  const autoFitScale = useMemo(() => {
    const audioDur = project.audio.duration;
    const lrcDur = karaokeMeta?.duration;
    if (!audioDur || !lrcDur || audioDur <= 0 || lrcDur <= 0) return null;
    return audioDur / lrcDur;
  }, [karaokeMeta?.duration, project.audio.duration]);

  const effectiveTextContent = useMemo(() => {
    if (project.theme === 'lyrics' && project.lyrics.timingSource === 'lrc') {
      return karaokeMeta?.plainText ?? '';
    }
    return project.text.content;
  }, [karaokeMeta?.plainText, project.lyrics.timingSource, project.text.content, project.theme]);

  const pagedCharLimit = useMemo(() => {
    const f = project.canvasFormat;
    if (f === 'horizontal' || f === 'twitter') return 320;
    if (f === 'square') return 220;
    return 180;
  }, [project.canvasFormat]);

  const effectivePages = useMemo(() => {
    const pages = project.pagedText?.pages ?? [];
    if (pages.length > 0) return pages;
    return [{ id: 'p1', text: '' }];
  }, [project.pagedText?.pages]);

  const safeActivePageIndex = useMemo(() => {
    const max = Math.max(0, effectivePages.length - 1);
    return Math.max(0, Math.min(activePageIndex, max));
  }, [activePageIndex, effectivePages.length]);

  const activePage = effectivePages[safeActivePageIndex];

  const activePageText = (activePage?.text ?? '').toString();

  const effectiveWordCount = useMemo(() => {
    return (effectiveTextContent || '').split(/\s+/).filter((w) => w.length > 0).length;
  }, [effectiveTextContent]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onBackgroundChange({ image: event.target?.result as string, video: null });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onBackgroundChange({ video: event.target?.result as string, image: null });
      };
      reader.readAsDataURL(file);
    }
  };

  // WPM level for color coding
  const wpmLevel = getWPMLevel(timeline.targetWPM);

  return (
    <ScrollArea className="h-full min-h-0">
      <div className="divide-y divide-border">
        {/* Canvas Format */}
        <div className="p-3 bg-card border-b border-border">
          <label className="text-xs font-semibold text-foreground mb-2 block">Canvas Format</label>
          <div className="grid grid-cols-4 gap-1.5">
            {canvasOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onCanvasFormatChange(opt.value)}
                className={cn(
                  'px-2 py-1.5 text-[10px] font-medium transition-all border excel-hover',
                  project.canvasFormat === opt.value
                    ? 'bg-excel-selected border-primary border-2'
                    : 'bg-card border-border'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            {CANVAS_SIZES[project.canvasFormat].width}×{CANVAS_SIZES[project.canvasFormat].height}
          </p>
        </div>

        <div className="p-3 bg-card border-b border-border">
          <label className="text-xs font-semibold text-foreground mb-2 block">Video Theme</label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onThemeChange('vertical')}
              className={cn(
                'px-2 py-1.5 text-[10px] font-medium transition-all border excel-hover',
                project.theme === 'vertical'
                  ? 'bg-excel-selected border-primary border-2'
                  : 'bg-card border-border'
              )}
            >
              Vertical
            </button>
            <button
              onClick={() => onThemeChange('lyrics')}
              className={cn(
                'px-2 py-1.5 text-[10px] font-medium transition-all border excel-hover',
                project.theme === 'lyrics'
                  ? 'bg-excel-selected border-primary border-2'
                  : 'bg-card border-border'
              )}
            >
              Lyrics
            </button>
          </div>
        </div>

        {project.theme === 'lyrics' && (
          <div className="p-3 bg-card border-b border-border space-y-3">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Timing Source</label>
              <Select
                value={project.lyrics.timingSource}
                onValueChange={(v) => onLyricsChange({ timingSource: v as LyricsTimingSource })}
              >
                <SelectTrigger className="h-7 text-[10px] border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border">
                  <SelectItem value="estimate" className="text-xs">Estimate (chars/sec)</SelectItem>
                  <SelectItem value="lrc" className="text-xs">Karaoke LRC (word-timed)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {project.lyrics.timingSource === 'lrc' && (
              <>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Display Mode</label>
                  <Select
                    value={project.lyrics.displayMode}
                    onValueChange={(v) => onLyricsChange({ displayMode: v as LyricsDisplayMode })}
                  >
                    <SelectTrigger className="h-7 text-[10px] border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-border">
                      <SelectItem value="lines" className="text-xs">Lines (prev/current/next)</SelectItem>
                      <SelectItem value="paragraph" className="text-xs">Paragraph</SelectItem>
                      <SelectItem value="pages" className="text-xs">Pages (one paragraph at a time)</SelectItem>
                      <SelectItem value="full" className="text-xs">Full (show all text)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Karaoke LRC</label>
                  <Textarea
                    value={project.lyrics.karaokeLrc}
                    onChange={(e) => onLyricsChange({ karaokeLrc: e.target.value })}
                    placeholder="Paste your word-timed LRC here..."
                    className="min-h-[100px] resize-none border-border text-xs"
                  />
                  <p className="text-[9px] text-muted-foreground mt-1">
                    Tip: add a blank line between timestamped lines to separate paragraphs/pages.
                  </p>
                </div>

                <div className="flex items-center justify-between px-3 py-2 border border-border excel-hover">
                  <div>
                    <p className="text-[10px] font-medium">Auto-fit LRC to audio</p>
                    <p className="text-[9px] text-muted-foreground">Scales all timestamps to match audio duration</p>
                  </div>
                  <Switch
                    checked={project.lyrics.autoFitLrcToAudio}
                    onCheckedChange={(checked) => onLyricsChange({ autoFitLrcToAudio: checked })}
                  />
                </div>

                <div className="flex items-center justify-between px-3 py-2 border border-border excel-hover">
                  <div>
                    <p className="text-[10px] font-medium">Highlight BG Color</p>
                    <p className="text-[9px] text-muted-foreground">Background behind the highlighted words</p>
                  </div>
                  <Input
                    type="color"
                    value={project.lyrics.highlightBgColor}
                    onChange={(e) => onLyricsChange({ highlightBgColor: e.target.value })}
                    className="h-7 w-10 p-0 border-border"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                    LRC offset: {project.lyrics.lrcOffsetSeconds.toFixed(2)}s
                  </label>
                  <Slider
                    value={[project.lyrics.lrcOffsetSeconds]}
                    onValueChange={([v]) => onLyricsChange({ lrcOffsetSeconds: v })}
                    min={-2}
                    max={2}
                    step={0.01}
                  />
                  <p className="text-[9px] text-muted-foreground mt-1">
                    Positive = highlight later. Negative = highlight earlier.
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                    Highlight lead: {project.lyrics.highlightLeadSeconds.toFixed(2)}s
                  </label>
                  <Slider
                    value={[project.lyrics.highlightLeadSeconds]}
                    onValueChange={([v]) => onLyricsChange({ highlightLeadSeconds: v })}
                    min={-0.3}
                    max={0.3}
                    step={0.01}
                  />
                  <p className="text-[9px] text-muted-foreground mt-1">
                    Use this for small sync tweaks (usually 0.00–0.10s).
                  </p>
                </div>

                {project.lyrics.autoFitLrcToAudio && (
                  <div className="text-[9px] text-muted-foreground">
                    {project.audio.file ? (
                      autoFitScale ? (
                        <div className={cn(Math.abs(autoFitScale - 1) > 0.05 && 'text-yellow-600 dark:text-yellow-400')}>
                          Audio: {project.audio.duration?.toFixed(2)}s, LRC: {karaokeMeta?.duration.toFixed(2)}s, scale: {autoFitScale.toFixed(3)}x
                        </div>
                      ) : (
                        <div>
                          Add an audio file (or wait for duration to load) to compute scaling.
                        </div>
                      )
                    ) : (
                      <div>Add an audio file to auto-fit LRC timing.</div>
                    )}
                  </div>
                )}
              </>
            )}

            {project.lyrics.timingSource === 'estimate' && (
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Lyrics Pacing</label>
                <Select
                  value={project.lyrics.pacingSource}
                  onValueChange={(v) => onLyricsChange({ pacingSource: v as LyricsPacingSource })}
                >
                  <SelectTrigger className="h-7 text-[10px] border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-border">
                    <SelectItem value="chars" className="text-xs">Characters/sec (recommended)</SelectItem>
                    <SelectItem value="wpm" className="text-xs">Use WPM/Duration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {project.lyrics.timingSource === 'estimate' && project.lyrics.pacingSource === 'chars' && (
              <>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                    Chars/sec: {project.lyrics.charsPerSecond}
                  </label>
                  <Slider
                    value={[project.lyrics.charsPerSecond]}
                    onValueChange={([v]) => onLyricsChange({ charsPerSecond: v })}
                    min={5}
                    max={30}
                    step={1}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                    Min seconds/line: {project.lyrics.minLineDuration.toFixed(1)}s
                  </label>
                  <Slider
                    value={[project.lyrics.minLineDuration]}
                    onValueChange={([v]) => onLyricsChange({ minLineDuration: v })}
                    min={0.5}
                    max={4}
                    step={0.1}
                  />
                </div>
              </>
            )}

            <div className={cn(
              'grid gap-2',
              project.lyrics.timingSource === 'estimate' ? 'grid-cols-2' : 'grid-cols-1'
            )}>
              {project.lyrics.timingSource === 'estimate' && (
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                    Highlight lead: {project.lyrics.highlightLeadSeconds.toFixed(2)}s
                  </label>
                  <Slider
                    value={[project.lyrics.highlightLeadSeconds]}
                    onValueChange={([v]) => onLyricsChange({ highlightLeadSeconds: v })}
                    min={0}
                    max={0.25}
                    step={0.01}
                  />
                </div>
              )}
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                  Highlight intensity: {project.lyrics.highlightIntensity.toFixed(2)}
                </label>
                <Slider
                  value={[project.lyrics.highlightIntensity]}
                  onValueChange={([v]) => onLyricsChange({ highlightIntensity: v })}
                  min={0.2}
                  max={1}
                  step={0.05}
                />
              </div>
            </div>
          </div>
        )}

        {/* TEXT Section */}
        <Section title="Text" icon={<Type className="w-3 h-3" />}>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Content</label>
            {project.theme === 'lyrics' && project.pagedText?.mode === 'pages' && project.lyrics.timingSource !== 'lrc' ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-muted-foreground">
                    Page {safeActivePageIndex + 1} / {effectivePages.length}
                  </div>
                  <div className={cn(
                    'text-[10px] font-mono',
                    activePageText.length >= pagedCharLimit ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'
                  )}>
                    {activePageText.length} / {pagedCharLimit}
                  </div>
                </div>
                <Textarea
                  value={activePageText}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (next.length > pagedCharLimit) return;

                    const nextPages = effectivePages.map((p, i) => i === safeActivePageIndex ? { ...p, text: next } : p);
                    onProjectChange({
                      pagedText: {
                        ...project.pagedText,
                        pages: nextPages,
                      },
                      text: {
                        ...project.text,
                        content: nextPages.map((p) => p.text).join('\n\n'),
                      },
                    });
                  }}
                  onKeyDown={(e) => {
                    const isInsert = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
                    const isDelete = e.key === 'Backspace' || e.key === 'Delete';
                    if (!isDelete && isInsert && activePageText.length >= pagedCharLimit) {
                      e.preventDefault();
                    }
                  }}
                  placeholder="Type the lesson text for this page..."
                  className="min-h-[90px] resize-none border-border text-xs"
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActivePageIndex((i) => Math.max(0, i - 1))}
                      className="px-2 py-1 text-[10px] border border-border bg-card hover:bg-excel-hover rounded disabled:opacity-50"
                      disabled={safeActivePageIndex === 0}
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setActivePageIndex((i) => Math.min(effectivePages.length - 1, i + 1))}
                      className="px-2 py-1 text-[10px] border border-border bg-card hover:bg-excel-hover rounded disabled:opacity-50"
                      disabled={safeActivePageIndex >= effectivePages.length - 1}
                    >
                      Next
                    </button>
                  </div>
                  {activePageText.length >= pagedCharLimit && (
                    <button
                      onClick={() => {
                        const newId = `p${effectivePages.length + 1}`;
                        const nextPages = [...effectivePages, { id: newId, text: '' }];
                        onProjectChange({
                          pagedText: {
                            ...project.pagedText,
                            pages: nextPages,
                          },
                          text: {
                            ...project.text,
                            content: nextPages.map((p) => p.text).join('\n\n'),
                          },
                        });
                        setActivePageIndex(nextPages.length - 1);
                      }}
                      className="px-2 py-1 text-[10px] border border-primary bg-primary/10 text-primary hover:bg-primary/20 rounded"
                    >
                      ➕ Add Page
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <Textarea
                  value={effectiveTextContent}
                  onChange={(e) => {
                    if (!(project.theme === 'lyrics' && project.lyrics.timingSource === 'lrc')) {
                      onTextChange({ content: e.target.value });
                    }
                  }}
                  readOnly={project.theme === 'lyrics' && project.lyrics.timingSource === 'lrc'}
                  placeholder="Enter your scrolling text..."
                  className="min-h-[80px] resize-none border-border text-xs"
                />
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1">
                    {(() => {
                      const lengthInfo = getContentLengthCategory(effectiveWordCount);
                      return (
                        <>
                          <span className={cn(
                            'text-[9px] px-1.5 py-0.5 rounded font-medium',
                            lengthInfo.category === 'short' && 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
                            lengthInfo.category === 'medium' && 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
                            lengthInfo.category === 'long' && 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
                            lengthInfo.category === 'very-long' && 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                          )}>
                            {lengthInfo.label}
                          </span>
                          <span className="text-[9px] text-muted-foreground">{lengthInfo.description}</span>
                        </>
                      );
                    })()}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {effectiveWordCount} words
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Font + Size */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Font</label>
              <Select value={project.text.fontFamily} onValueChange={(v) => onTextChange({ fontFamily: v })}>
                <SelectTrigger className="h-7 text-[10px] border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border">
                  {FONT_FAMILIES.map((font) => (
                    <SelectItem key={font.value} value={font.value} className="text-xs">
                      <span style={{ fontFamily: font.value }}>{font.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Size: {project.text.fontSize}px</label>
              <Slider
                value={[project.text.fontSize]}
                onValueChange={([v]) => onTextChange({ fontSize: v })}
                min={20}
                max={160}
                step={1}
                className="mt-2"
              />
            </div>
          </div>

          {/* Quick layout presets (useful for vertical lesson text) */}
          {project.theme !== 'lyrics' && (
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Layout presets</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => onTextChange({ containerWidth: 98, paddingX: 18, textAlign: 'center', lineHeight: 1.6 })}
                  className="px-2 py-1 text-[10px] border border-border bg-card hover:bg-excel-hover rounded"
                >
                  Classroom
                </button>
                <button
                  onClick={() => onTextChange({ containerWidth: 92, paddingX: 24, textAlign: 'center', lineHeight: 1.45 })}
                  className="px-2 py-1 text-[10px] border border-border bg-card hover:bg-excel-hover rounded"
                >
                  Subtitle
                </button>
                <button
                  onClick={() => onTextChange({ containerWidth: 80, paddingX: 44, textAlign: 'left', lineHeight: 1.55 })}
                  className="px-2 py-1 text-[10px] border border-border bg-card hover:bg-excel-hover rounded"
                >
                  Narrow
                </button>
              </div>
            </div>
          )}

          {/* Style buttons */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Style & Alignment</label>
            <div className="flex gap-1">
              <button
                onClick={() => onTextChange({ isBold: !project.text.isBold })}
                className={cn(
                  'flex-1 flex items-center justify-center py-1.5 border transition-all excel-hover',
                  project.text.isBold ? 'border-primary bg-excel-selected border-2' : 'border-border'
                )}
              >
                <Bold className="w-3 h-3" />
              </button>
              <button
                onClick={() => onTextChange({ isItalic: !project.text.isItalic })}
                className={cn(
                  'flex-1 flex items-center justify-center py-1.5 border transition-all excel-hover',
                  project.text.isItalic ? 'border-primary bg-excel-selected border-2' : 'border-border'
                )}
              >
                <Italic className="w-3 h-3" />
              </button>
              <div className="w-px bg-border" />
              {[
                { value: 'left' as const, icon: AlignLeft },
                { value: 'center' as const, icon: AlignCenter },
                { value: 'right' as const, icon: AlignRight },
              ].map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => onTextChange({ textAlign: value })}
                  className={cn(
                    'flex-1 flex items-center justify-center py-1.5 border transition-all excel-hover',
                    project.text.textAlign === value ? 'border-primary bg-excel-selected border-2' : 'border-border'
                  )}
                >
                  <Icon className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={project.text.color}
                onChange={(e) => onTextChange({ color: e.target.value })}
                className="w-7 h-7 border border-border cursor-pointer"
              />
              <div className="flex gap-1 flex-1">
                {['#ffffff', '#000000', '#ff6b6b', '#4ecdc4', '#ffe66d'].map((color) => (
                  <button
                    key={color}
                    onClick={() => onTextChange({ color })}
                    className={cn(
                      'w-6 h-6 border transition-all excel-hover',
                      project.text.color === color ? 'border-primary border-2' : 'border-border'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Spacing */}
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="text-[9px] text-muted-foreground">Line: {project.text.lineHeight.toFixed(1)}</label>
              <Slider value={[project.text.lineHeight]} onValueChange={([v]) => onTextChange({ lineHeight: v })} min={1} max={3} step={0.1} />
            </div>
            <div>
              <label className="text-[9px] text-muted-foreground">Letter: {project.text.letterSpacing}px</label>
              <Slider value={[project.text.letterSpacing]} onValueChange={([v]) => onTextChange({ letterSpacing: v })} min={-2} max={10} step={0.5} />
            </div>
          </div>

          {/* Padding */}
          <div className="grid grid-cols-3 gap-1.5">
            <div>
              <label className="text-[9px] text-muted-foreground">Pad X: {project.text.paddingX}</label>
              <Slider value={[project.text.paddingX]} onValueChange={([v]) => onTextChange({ paddingX: v })} min={0} max={200} step={5} />
            </div>
            <div>
              <label className="text-[9px] text-muted-foreground">Pad Y: {project.text.paddingY}</label>
              <Slider value={[project.text.paddingY]} onValueChange={([v]) => onTextChange({ paddingY: v })} min={0} max={200} step={5} />
            </div>
            <div>
              <label className="text-[9px] text-muted-foreground">Width: {project.text.containerWidth}%</label>
              <Slider value={[project.text.containerWidth]} onValueChange={([v]) => onTextChange({ containerWidth: v })} min={50} max={100} step={5} />
            </div>
          </div>

          {/* Auto-Scale Font */}
          <div className="flex items-center justify-between px-3 py-2 border border-border excel-hover">
            <div className="flex items-center gap-2">
              <Maximize2 className="w-3.5 h-3.5 text-primary" />
              <div>
                <p className="text-[10px] font-medium">Auto-Scale Font</p>
                <p className="text-[9px] text-muted-foreground">Optimize for long stories</p>
              </div>
            </div>
            <Switch
              checked={project.text.autoScaleFont}
              onCheckedChange={(checked) => onTextChange({ autoScaleFont: checked })}
            />
          </div>

          {/* Wave Animation */}
          <div className="flex items-center justify-between px-3 py-2 border border-border excel-hover">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <div>
                <p className="text-[10px] font-medium">Wave Animation</p>
                <p className="text-[9px] text-muted-foreground">Characters animate one by one</p>
              </div>
            </div>
            <Switch
              checked={project.text.waveAnimation}
              onCheckedChange={(checked) => onTextChange({ waveAnimation: checked })}
            />
          </div>
        </Section>

        {/* ANIMATION Section - WPM Based */}
        <Section title="Animation" icon={<Sparkles className="w-3 h-3" />}>
          {/* Direction */}
          <div className="grid grid-cols-3 gap-1">
            {[
              { value: 'up' as const, label: '↑' },
              { value: 'left' as const, label: '←' },
              { value: 'right' as const, label: '→' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onAnimationChange({ direction: value })}
                className={cn(
                  'py-1.5 rounded text-xs font-medium transition-all',
                  project.animation.direction === value
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* WPM Display with Color Coding */}
          <div className="p-2 rounded-lg bg-muted/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium">Reading Speed</span>
              <div className="flex items-center gap-1">
                {wpmLevel === 'danger' && <AlertTriangle className="w-3 h-3 text-red-500" />}
                <span className={cn(
                  'text-xs font-bold',
                  wpmLevel === 'good' && 'text-green-500',
                  wpmLevel === 'warning' && 'text-yellow-500',
                  wpmLevel === 'danger' && 'text-red-500',
                )}>
                  {timeline.targetWPM} WPM
                </span>
              </div>
            </div>
            
            {/* WPM Presets */}
            <div className="grid grid-cols-2 gap-1">
              {(Object.keys(WPM_PRESETS) as WPMPreset[]).filter(p => p !== 'custom').map((preset) => (
                <button
                  key={preset}
                  onClick={() => onAnimationChange({ wpmPreset: preset })}
                  className={cn(
                    'py-1 rounded text-[10px] font-medium transition-all',
                    project.animation.wpmPreset === preset
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  )}
                >
                  {WPM_PRESETS[preset].label}
                </button>
              ))}
            </div>
            
            <p className="text-[9px] text-muted-foreground text-center">
              {project.animation.wpmPreset !== 'custom' 
                ? WPM_PRESETS[project.animation.wpmPreset].description 
                : 'Manual duration control'}
            </p>

            {/* Auto-calculated duration display */}
            <div className="text-center py-1 px-2 rounded bg-primary/5 border border-primary/20">
              <span className="text-[10px] text-muted-foreground">Auto duration: </span>
              <span className="text-xs font-bold text-primary">{timeline.contentDuration}s</span>
              {timeline.endingDuration > 0 && (
                <span className="text-[10px] text-muted-foreground"> + {timeline.endingDuration}s ending</span>
              )}
            </div>
          </div>

          {/* Manual Duration Override */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-medium">Manual Override</label>
              <button
                onClick={() => onAnimationChange({ wpmPreset: 'custom' })}
                className={cn(
                  'text-[9px] px-1.5 py-0.5 rounded',
                  project.animation.wpmPreset === 'custom' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                )}
              >
                Custom
              </button>
            </div>
            
            {project.animation.wpmPreset === 'custom' && (
              <>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {durationPresets.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => onAnimationChange({ duration: preset })}
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-medium transition-all',
                        project.animation.duration === preset
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      )}
                    >
                      {preset}s
                    </button>
                  ))}
                </div>
                <Slider
                  value={[project.animation.duration]}
                  onValueChange={([v]) => onAnimationChange({ duration: v })}
                  min={3}
                  max={120}
                  step={1}
                />
                <p className="text-[9px] text-muted-foreground mt-0.5">{project.animation.duration}s</p>
              </>
            )}
          </div>

          {/* Loop */}
          <div className="flex items-center justify-between py-0.5">
            <div className="flex items-center gap-1.5">
              <RotateCcw className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] font-medium">Loop</span>
            </div>
            <Switch
              checked={project.animation.isLooping}
              onCheckedChange={(checked) => onAnimationChange({ isLooping: checked })}
            />
          </div>
        </Section>

        {/* BACKGROUND Section */}
        <Section title="Background" icon={<Palette className="w-3 h-3" />} defaultOpen={false}>
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={project.background.color}
              onChange={(e) => onBackgroundChange({ color: e.target.value })}
              className="w-6 h-6 rounded border border-border cursor-pointer"
            />
            <div className="flex gap-1 flex-1 flex-wrap">
              {['#1a1a2e', '#0f0e17', '#16213e', '#000000', '#ffffff'].map((color) => (
                <button
                  key={color}
                  onClick={() => onBackgroundChange({ color })}
                  className={cn(
                    'w-5 h-5 rounded border transition-all hover:scale-110',
                    project.background.color === color ? 'border-primary border-2' : 'border-border'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => imageInputRef.current?.click()}
              className="flex items-center justify-center gap-1 py-1.5 rounded border border-border text-[10px] hover:bg-muted/50"
            >
              <ImageIcon className="w-3 h-3" /> Image
            </button>
            <button
              onClick={() => videoInputRef.current?.click()}
              className="flex items-center justify-center gap-1 py-1.5 rounded border border-border text-[10px] hover:bg-muted/50"
            >
              <Film className="w-3 h-3" /> Video
            </button>
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
          </div>

          {(project.background.image || project.background.video) && (
            <>
              <div className="relative rounded overflow-hidden border border-border">
                {project.background.image && <img src={project.background.image} alt="" className="w-full h-12 object-cover" />}
                {project.background.video && <video src={project.background.video} className="w-full h-12 object-cover" muted loop autoPlay />}
                <button onClick={() => onBackgroundChange({ image: null, video: null })} className="absolute top-1 right-1 p-0.5 rounded-full bg-destructive text-white">
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="text-[9px] text-muted-foreground">Blur: {project.background.blur}px</label>
                  <Slider value={[project.background.blur]} onValueChange={([v]) => onBackgroundChange({ blur: v })} min={0} max={20} step={1} />
                </div>
                <div>
                  <label className="text-[9px] text-muted-foreground">Opacity: {project.background.opacity}%</label>
                  <Slider value={[project.background.opacity]} onValueChange={([v]) => onBackgroundChange({ opacity: v })} min={0} max={100} step={5} />
                </div>
              </div>
            </>
          )}
        </Section>

        {/* AUDIO Section */}
        <Section title="Audio" icon={<Music className="w-3 h-3" />} defaultOpen={true} badge={project.audio.file ? '♪' : undefined}>
          <AudioControls settings={project.audio} onChange={onAudioChange} />
        </Section>

        {/* WATERMARK Section */}
        <Section title="Watermark" icon={<Stamp className="w-3 h-3" />} defaultOpen={false} badge={project.watermark.enabled ? 'ON' : undefined}>
          <WatermarkControls settings={project.watermark} onChange={onWatermarkChange} />
        </Section>

        {/* OVERLAY Section */}
        <Section title="Overlay" icon={<Layers className="w-3 h-3" />} defaultOpen={false} badge={project.overlay.enabled ? 'ON' : undefined}>
          <OverlayControls settings={project.overlay} onChange={onOverlayChange} />
        </Section>

        {/* ENDING Section */}
        <Section title="Ending" icon={<Flag className="w-3 h-3" />} defaultOpen={false} badge={project.ending.enabled ? 'ON' : undefined}>
          <EndingControls settings={project.ending} onChange={onEndingChange} />
        </Section>
      </div>
    </ScrollArea>
  );
}
