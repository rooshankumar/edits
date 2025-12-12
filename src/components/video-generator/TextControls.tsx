import { Bold, Italic, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { TextSettings, FONT_FAMILIES } from '@/types/video-project';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface TextControlsProps {
  settings: TextSettings;
  onChange: (updates: Partial<TextSettings>) => void;
}

export function TextControls({ settings, onChange }: TextControlsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Text Content</h3>
      
      {/* Text Input */}
      <div className="space-y-2">
        <Textarea
          value={settings.content}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="Enter your scrolling text..."
          className="min-h-[120px] resize-none bg-muted/50 border-border focus:border-primary"
        />
        <p className="text-xs text-muted-foreground text-right">
          {settings.content.length} characters
        </p>
      </div>

      {/* Font Family */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Font Family</label>
        <Select value={settings.fontFamily} onValueChange={(v) => onChange({ fontFamily: v })}>
          <SelectTrigger className="bg-muted/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_FAMILIES.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                <span style={{ fontFamily: font.value }}>{font.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Font Size */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="text-xs font-medium text-muted-foreground">Font Size</label>
          <span className="text-xs font-mono text-primary">{settings.fontSize}px</span>
        </div>
        <Slider
          value={[settings.fontSize]}
          onValueChange={([v]) => onChange({ fontSize: v })}
          min={12}
          max={200}
          step={1}
          className="py-2"
        />
      </div>

      {/* Bold / Italic */}
      <div className="flex gap-2">
        <button
          onClick={() => onChange({ isBold: !settings.isBold })}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border-2 transition-all',
            settings.isBold
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-muted/50 text-muted-foreground hover:border-primary/50'
          )}
        >
          <Bold className="w-4 h-4" />
          <span className="text-sm font-medium">Bold</span>
        </button>
        <button
          onClick={() => onChange({ isItalic: !settings.isItalic })}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border-2 transition-all',
            settings.isItalic
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-muted/50 text-muted-foreground hover:border-primary/50'
          )}
        >
          <Italic className="w-4 h-4" />
          <span className="text-sm font-medium">Italic</span>
        </button>
      </div>

      {/* Text Alignment */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Alignment</label>
        <div className="flex gap-2">
          {[
            { value: 'left' as const, icon: AlignLeft },
            { value: 'center' as const, icon: AlignCenter },
            { value: 'right' as const, icon: AlignRight },
          ].map(({ value, icon: Icon }) => (
            <button
              key={value}
              onClick={() => onChange({ textAlign: value })}
              className={cn(
                'flex-1 flex items-center justify-center py-2 rounded-lg border-2 transition-all',
                settings.textAlign === value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-muted/50 text-muted-foreground hover:border-primary/50'
              )}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Line Height */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="text-xs font-medium text-muted-foreground">Line Height</label>
          <span className="text-xs font-mono text-primary">{settings.lineHeight.toFixed(1)}</span>
        </div>
        <Slider
          value={[settings.lineHeight]}
          onValueChange={([v]) => onChange({ lineHeight: v })}
          min={1}
          max={3}
          step={0.1}
          className="py-2"
        />
      </div>

      {/* Letter Spacing */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="text-xs font-medium text-muted-foreground">Letter Spacing</label>
          <span className="text-xs font-mono text-primary">{settings.letterSpacing}px</span>
        </div>
        <Slider
          value={[settings.letterSpacing]}
          onValueChange={([v]) => onChange({ letterSpacing: v })}
          min={-5}
          max={20}
          step={0.5}
          className="py-2"
        />
      </div>

      {/* Text Color */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Text Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={settings.color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="w-12 h-10 rounded-lg border-2 border-border cursor-pointer"
          />
          <input
            type="text"
            value={settings.color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="flex-1 px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm font-mono"
          />
        </div>
      </div>
    </div>
  );
}
