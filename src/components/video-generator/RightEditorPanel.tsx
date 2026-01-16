import { useMemo, useState } from 'react';
import { 
  Type, Sparkles, ChevronDown, ChevronUp, 
  Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
  RotateCcw, AlertTriangle, Maximize2, Music
} from 'lucide-react';
import { 
  VideoProject, TextSettings, AnimationSettings,
  FONT_FAMILIES, WPMPreset, WPM_PRESETS,
  LyricsTimingSource, LyricsDisplayMode, LyricsThemeSettings
} from '@/types/video-project';
import { TimelineState, getWPMLevel } from '@/utils/timeline';
import { getContentLengthCategory } from '@/utils/textScaling';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { parseKaraokeLrc } from '@/utils/karaokeLrc';

interface RightEditorPanelProps {
  project: VideoProject;
  timeline: TimelineState;
  onProjectChange: (updates: Partial<VideoProject>) => void;
  onLyricsChange: (updates: Partial<LyricsThemeSettings>) => void;
  onTextChange: (updates: Partial<TextSettings>) => void;
  onAnimationChange: (updates: Partial<AnimationSettings>) => void;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string;
}

function Section({ title, icon, defaultOpen = true, children, badge }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between px-2 py-1.5 excel-hover bg-card border-b border-border transition-colors',
          isOpen && 'bg-excel-selected'
        )}
      >
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-[10px] font-semibold text-foreground">{title}</span>
          {badge && (
            <span className="px-1 py-0.5 text-[8px] font-medium bg-primary/10 text-primary rounded">{badge}</span>
          )}
        </div>
        {isOpen ? <ChevronUp className="w-2.5 h-2.5 text-muted-foreground" /> : <ChevronDown className="w-2.5 h-2.5 text-muted-foreground" />}
      </button>
      {isOpen && (
        <div className="p-2 space-y-2 bg-card">
          {children}
        </div>
      )}
    </div>
  );
}

const durationPresets = [5, 10, 15, 30, 60];

// Extended text color palette
const TEXT_COLORS = [
  '#ffffff', '#000000', '#f3f4f6', '#1f2937',
  '#ef4444', '#f97316', '#facc15', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#ff6b6b', '#4ecdc4', '#ffe66d', '#a78bfa',
];

export function RightEditorPanel({
  project,
  timeline,
  onProjectChange,
  onLyricsChange,
  onTextChange,
  onAnimationChange,
}: RightEditorPanelProps) {
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

  const wpmLevel = getWPMLevel(timeline.targetWPM);

  return (
    <ScrollArea className="h-full min-h-0">
      <div className="divide-y divide-border">
        {/* Lyrics Settings (only when lyrics theme is active) */}
        {project.theme === 'lyrics' && (
          <Section title="Lyrics" icon={<Music className="w-3 h-3" />}>
            <div>
              <label className="text-[9px] font-medium text-muted-foreground mb-1 block">Timing</label>
              <Select
                value={project.lyrics.timingSource}
                onValueChange={(v) => onLyricsChange({ timingSource: v as LyricsTimingSource })}
              >
                <SelectTrigger className="h-6 text-[9px] border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border">
                  <SelectItem value="estimate" className="text-[10px]">Estimate</SelectItem>
                  <SelectItem value="lrc" className="text-[10px]">LRC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {project.lyrics.timingSource === 'lrc' && (
              <>
                <div>
                  <label className="text-[9px] font-medium text-muted-foreground mb-1 block">Display</label>
                  <Select
                    value={project.lyrics.displayMode}
                    onValueChange={(v) => onLyricsChange({ displayMode: v as LyricsDisplayMode })}
                  >
                    <SelectTrigger className="h-6 text-[9px] border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-border">
                      <SelectItem value="lines" className="text-[10px]">Lines</SelectItem>
                      <SelectItem value="paragraph" className="text-[10px]">Paragraph</SelectItem>
                      <SelectItem value="pages" className="text-[10px]">Pages</SelectItem>
                      <SelectItem value="full" className="text-[10px]">Full</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-[9px] font-medium text-muted-foreground mb-1 block">LRC</label>
                  <Textarea
                    value={project.lyrics.karaokeLrc}
                    onChange={(e) => onLyricsChange({ karaokeLrc: e.target.value })}
                    placeholder="Paste LRC..."
                    className="min-h-[60px] resize-none border-border text-[10px]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[9px]">Auto-fit to audio</span>
                  <Switch
                    checked={project.lyrics.autoFitLrcToAudio}
                    onCheckedChange={(checked) => onLyricsChange({ autoFitLrcToAudio: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[9px]">Highlight</span>
                  <input
                    type="color"
                    value={project.lyrics.highlightBgColor}
                    onChange={(e) => onLyricsChange({ highlightBgColor: e.target.value })}
                    className="h-5 w-6 p-0 border-border rounded cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-muted-foreground">Offset: {project.lyrics.lrcOffsetSeconds.toFixed(2)}s</label>
                  <Slider
                    value={[project.lyrics.lrcOffsetSeconds]}
                    onValueChange={([v]) => onLyricsChange({ lrcOffsetSeconds: v })}
                    min={-2}
                    max={2}
                    step={0.01}
                  />
                </div>

                {project.lyrics.autoFitLrcToAudio && autoFitScale && (
                  <div className="text-[8px] text-muted-foreground">
                    Scale: {autoFitScale.toFixed(3)}x
                  </div>
                )}
              </>
            )}

            {project.lyrics.timingSource === 'estimate' && (
              <div className="space-y-1">
                <label className="text-[9px] text-muted-foreground">Chars/sec: {project.lyrics.charsPerSecond}</label>
                <Slider
                  value={[project.lyrics.charsPerSecond]}
                  onValueChange={([v]) => onLyricsChange({ charsPerSecond: v })}
                  min={5}
                  max={30}
                  step={1}
                />
              </div>
            )}
          </Section>
        )}

        {/* Text Section */}
        <Section title="Text" icon={<Type className="w-3 h-3" />}>
          <div>
            <label className="text-[9px] font-medium text-muted-foreground mb-1 block">Content</label>
            {project.theme === 'lyrics' && project.pagedText?.mode === 'pages' && project.lyrics.timingSource !== 'lrc' ? (
              <>
                <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-1">
                  <span>Page {safeActivePageIndex + 1}/{effectivePages.length}</span>
                  <span>{activePageText.length}/{pagedCharLimit}</span>
                </div>
                <Textarea
                  value={activePageText}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (next.length > pagedCharLimit) return;
                    const nextPages = effectivePages.map((p, i) => i === safeActivePageIndex ? { ...p, text: next } : p);
                    onProjectChange({
                      pagedText: { ...project.pagedText, pages: nextPages },
                      text: { ...project.text, content: nextPages.map((p) => p.text).join('\n\n') },
                    });
                  }}
                  placeholder="Page text..."
                  className="min-h-[60px] resize-none border-border text-[10px]"
                />
                <div className="flex items-center justify-between mt-1">
                  <div className="flex gap-1">
                    <button onClick={() => setActivePageIndex((i) => Math.max(0, i - 1))} disabled={safeActivePageIndex === 0} className="px-1.5 py-0.5 text-[9px] border border-border bg-card hover:bg-muted/50 rounded disabled:opacity-50 transition-colors">←</button>
                    <button onClick={() => setActivePageIndex((i) => Math.min(effectivePages.length - 1, i + 1))} disabled={safeActivePageIndex >= effectivePages.length - 1} className="px-1.5 py-0.5 text-[9px] border border-border bg-card hover:bg-muted/50 rounded disabled:opacity-50 transition-colors">→</button>
                  </div>
                  {activePageText.length >= pagedCharLimit && (
                    <button
                      onClick={() => {
                        const newId = `p${effectivePages.length + 1}`;
                        const nextPages = [...effectivePages, { id: newId, text: '' }];
                        onProjectChange({
                          pagedText: { ...project.pagedText, pages: nextPages },
                          text: { ...project.text, content: nextPages.map((p) => p.text).join('\n\n') },
                        });
                        setActivePageIndex(nextPages.length - 1);
                      }}
                      className="px-1.5 py-0.5 text-[9px] border border-primary bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                    >+</button>
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
                  placeholder="Enter text..."
                  className="min-h-[60px] resize-none border-border text-[10px]"
                />
                <div className="flex items-center justify-between mt-1">
                  {(() => {
                    const lengthInfo = getContentLengthCategory(effectiveWordCount);
                    return (
                      <span className={cn(
                        'text-[8px] px-1 py-0.5 rounded font-medium',
                        lengthInfo.category === 'short' && 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
                        lengthInfo.category === 'medium' && 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
                        lengthInfo.category === 'long' && 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
                        lengthInfo.category === 'very-long' && 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      )}>{lengthInfo.label}</span>
                    );
                  })()}
                  <span className="text-[9px] text-muted-foreground">{effectiveWordCount} words</span>
                </div>
              </>
            )}
          </div>

          {/* Font + Size */}
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="text-[9px] font-medium text-muted-foreground mb-1 block">Font</label>
              <Select value={project.text.fontFamily} onValueChange={(v) => onTextChange({ fontFamily: v })}>
                <SelectTrigger className="h-6 text-[9px] border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border max-h-[200px]">
                  {FONT_FAMILIES.map((font) => (
                    <SelectItem key={font.value} value={font.value} className="text-[10px]">
                      <span style={{ fontFamily: font.value }}>{font.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-medium text-muted-foreground block">Size: {project.text.fontSize}</label>
              <Slider value={[project.text.fontSize]} onValueChange={([v]) => onTextChange({ fontSize: v })} min={20} max={160} step={1} />
            </div>
          </div>

          {/* Style buttons */}
          <div className="flex gap-0.5">
            <button onClick={() => onTextChange({ isBold: !project.text.isBold })} className={cn('flex-1 flex items-center justify-center py-1 border rounded transition-colors', project.text.isBold ? 'border-primary bg-primary/10 border-2' : 'border-border hover:bg-muted/50')}>
              <Bold className="w-3 h-3" />
            </button>
            <button onClick={() => onTextChange({ isItalic: !project.text.isItalic })} className={cn('flex-1 flex items-center justify-center py-1 border rounded transition-colors', project.text.isItalic ? 'border-primary bg-primary/10 border-2' : 'border-border hover:bg-muted/50')}>
              <Italic className="w-3 h-3" />
            </button>
            <div className="w-px bg-border" />
            {[{ value: 'left' as const, icon: AlignLeft }, { value: 'center' as const, icon: AlignCenter }, { value: 'right' as const, icon: AlignRight }].map(({ value, icon: Icon }) => (
              <button key={value} onClick={() => onTextChange({ textAlign: value })} className={cn('flex-1 flex items-center justify-center py-1 border rounded transition-colors', project.text.textAlign === value ? 'border-primary bg-primary/10 border-2' : 'border-border hover:bg-muted/50')}>
                <Icon className="w-3 h-3" />
              </button>
            ))}
          </div>

          {/* Vertical align */}
          <div className="flex gap-0.5">
            {[{ value: 'top' as const, icon: AlignVerticalJustifyStart }, { value: 'center' as const, icon: AlignVerticalJustifyCenter }, { value: 'bottom' as const, icon: AlignVerticalJustifyEnd }].map(({ value, icon: Icon }) => (
              <button key={value} onClick={() => onTextChange({ verticalAlign: value })} className={cn('flex-1 flex items-center justify-center py-1 border rounded transition-colors', project.text.verticalAlign === value ? 'border-primary bg-primary/10 border-2' : 'border-border hover:bg-muted/50')}>
                <Icon className="w-3 h-3" />
              </button>
            ))}
          </div>

          {/* Color */}
          <div className="space-y-1">
            <label className="text-[8px] text-muted-foreground">Color</label>
            <div className="flex items-center gap-1 flex-wrap">
              <input type="color" value={project.text.color} onChange={(e) => onTextChange({ color: e.target.value })} className="w-5 h-5 border border-border cursor-pointer rounded" />
              {TEXT_COLORS.map((color) => (
                <button key={color} onClick={() => onTextChange({ color })} className={cn('w-4 h-4 rounded border transition-transform hover:scale-110', project.text.color === color ? 'border-primary border-2 ring-1 ring-primary/50' : 'border-border/50')} style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>

          {/* Spacing */}
          <div className="grid grid-cols-3 gap-1">
            <div className="space-y-1">
              <label className="text-[8px] text-muted-foreground">Line</label>
              <Slider value={[project.text.lineHeight]} onValueChange={([v]) => onTextChange({ lineHeight: v })} min={1} max={3} step={0.1} />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] text-muted-foreground">Letter</label>
              <Slider value={[project.text.letterSpacing]} onValueChange={([v]) => onTextChange({ letterSpacing: v })} min={-2} max={10} step={0.5} />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] text-muted-foreground">Width</label>
              <Slider value={[project.text.containerWidth]} onValueChange={([v]) => onTextChange({ containerWidth: v })} min={50} max={100} step={5} />
            </div>
          </div>

          {/* Auto-Scale + Wave */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Maximize2 className="w-3 h-3 text-primary" />
              <span className="text-[9px]">Auto-Scale</span>
            </div>
            <Switch checked={project.text.autoScaleFont} onCheckedChange={(checked) => onTextChange({ autoScaleFont: checked })} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-[9px]">Wave</span>
            </div>
            <Switch checked={project.text.waveAnimation} onCheckedChange={(checked) => onTextChange({ waveAnimation: checked })} />
          </div>

          {/* Text Shadow */}
          <div className="space-y-1.5 border-t border-border pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-medium">Text Shadow</span>
              <Switch 
                checked={project.text.textShadow?.enabled ?? false} 
                onCheckedChange={(checked) => onTextChange({ 
                  textShadow: { ...project.text.textShadow, enabled: checked } 
                })} 
              />
            </div>
            {project.text.textShadow?.enabled && (
              <div className="space-y-1.5 pl-2">
                <div className="grid grid-cols-2 gap-1">
                  <div className="space-y-1">
                    <label className="text-[8px] text-muted-foreground">X: {project.text.textShadow.offsetX}</label>
                    <Slider 
                      value={[project.text.textShadow.offsetX]} 
                      onValueChange={([v]) => onTextChange({ 
                        textShadow: { ...project.text.textShadow, offsetX: v } 
                      })} 
                      min={-20} max={20} step={1} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] text-muted-foreground">Y: {project.text.textShadow.offsetY}</label>
                    <Slider 
                      value={[project.text.textShadow.offsetY]} 
                      onValueChange={([v]) => onTextChange({ 
                        textShadow: { ...project.text.textShadow, offsetY: v } 
                      })} 
                      min={-20} max={20} step={1} 
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] text-muted-foreground">Blur: {project.text.textShadow.blur}</label>
                  <Slider 
                    value={[project.text.textShadow.blur]} 
                    onValueChange={([v]) => onTextChange({ 
                      textShadow: { ...project.text.textShadow, blur: v } 
                    })} 
                    min={0} max={30} step={1} 
                  />
                </div>
                <div className="flex items-center gap-1">
                  <label className="text-[8px] text-muted-foreground">Color</label>
                  <input 
                    type="color" 
                    value={project.text.textShadow.color} 
                    onChange={(e) => onTextChange({ 
                      textShadow: { ...project.text.textShadow, color: e.target.value } 
                    })} 
                    className="w-5 h-5 border border-border cursor-pointer rounded" 
                  />
                </div>
              </div>
            )}
          </div>

          {/* Text Outline */}
          <div className="space-y-1.5 border-t border-border pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-medium">Text Outline</span>
              <Switch 
                checked={project.text.textOutline?.enabled ?? false} 
                onCheckedChange={(checked) => onTextChange({ 
                  textOutline: { ...project.text.textOutline, enabled: checked } 
                })} 
              />
            </div>
            {project.text.textOutline?.enabled && (
              <div className="space-y-1.5 pl-2">
                <div className="space-y-1">
                  <label className="text-[8px] text-muted-foreground">Width: {project.text.textOutline.width}px</label>
                  <Slider 
                    value={[project.text.textOutline.width]} 
                    onValueChange={([v]) => onTextChange({ 
                      textOutline: { ...project.text.textOutline, width: v } 
                    })} 
                    min={1} max={10} step={0.5} 
                  />
                </div>
                <div className="flex items-center gap-1">
                  <label className="text-[8px] text-muted-foreground">Color</label>
                  <input 
                    type="color" 
                    value={project.text.textOutline.color} 
                    onChange={(e) => onTextChange({ 
                      textOutline: { ...project.text.textOutline, color: e.target.value } 
                    })} 
                    className="w-5 h-5 border border-border cursor-pointer rounded" 
                  />
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Animation Section */}
        <Section title="Animation" icon={<Sparkles className="w-3 h-3" />}>
          {/* Direction */}
          <div className="grid grid-cols-3 gap-1">
            {[{ value: 'up' as const, label: '↑' }, { value: 'left' as const, label: '←' }, { value: 'right' as const, label: '→' }].map(({ value, label }) => (
              <button key={value} onClick={() => onAnimationChange({ direction: value })} className={cn('py-1.5 rounded text-[10px] font-medium transition-colors', project.animation.direction === value ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted')}>
                {label}
              </button>
            ))}
          </div>

          {/* WPM Display */}
          <div className="p-2 rounded bg-muted/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-medium">Speed</span>
              <div className="flex items-center gap-1">
                {wpmLevel === 'danger' && <AlertTriangle className="w-2.5 h-2.5 text-red-500" />}
                <span className={cn('text-[10px] font-bold', wpmLevel === 'good' && 'text-green-500', wpmLevel === 'warning' && 'text-yellow-500', wpmLevel === 'danger' && 'text-red-500')}>
                  {timeline.targetWPM} WPM
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-1">
              {(Object.keys(WPM_PRESETS) as WPMPreset[]).filter(p => p !== 'custom').map((preset) => (
                <button key={preset} onClick={() => onAnimationChange({ wpmPreset: preset })} className={cn('py-1 rounded text-[9px] font-medium transition-colors', project.animation.wpmPreset === preset ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted')}>
                  {WPM_PRESETS[preset].label}
                </button>
              ))}
            </div>

            <div className="text-center py-1 px-2 rounded bg-primary/5 border border-primary/20">
              <span className="text-[9px] text-muted-foreground">Duration: </span>
              <span className="text-[10px] font-bold text-primary">{timeline.contentDuration}s</span>
            </div>
          </div>

          {/* Manual Override */}
          <div className="flex items-center justify-between">
            <span className="text-[9px]">Manual</span>
            <button onClick={() => onAnimationChange({ wpmPreset: 'custom' })} className={cn('text-[8px] px-1.5 py-0.5 rounded transition-colors', project.animation.wpmPreset === 'custom' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted')}>
              Custom
            </button>
          </div>
          
          {project.animation.wpmPreset === 'custom' && (
            <>
              <div className="flex flex-wrap gap-1">
                {durationPresets.map((preset) => (
                  <button key={preset} onClick={() => onAnimationChange({ duration: preset })} className={cn('px-2 py-1 rounded text-[9px] transition-colors', project.animation.duration === preset ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted')}>
                    {preset}s
                  </button>
                ))}
              </div>
              <Slider value={[project.animation.duration]} onValueChange={([v]) => onAnimationChange({ duration: v })} min={3} max={120} step={1} />
            </>
          )}

          {/* Loop */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <RotateCcw className="w-3 h-3 text-muted-foreground" />
              <span className="text-[9px]">Loop</span>
            </div>
            <Switch checked={project.animation.isLooping} onCheckedChange={(checked) => onAnimationChange({ isLooping: checked })} />
          </div>
        </Section>
      </div>
    </ScrollArea>
  );
}
