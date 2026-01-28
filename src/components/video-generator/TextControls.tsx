import { Bold, Italic, AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, MoveHorizontal, MoveVertical, Maximize } from 'lucide-react';
import { TextSettings, FONT_FAMILIES } from '@/types/video-project';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface TextControlsProps {
  settings: TextSettings;
  onChange: (updates: Partial<TextSettings>) => void;
}

// Group fonts by category
const fontCategories = [
  { key: 'readable', label: 'Readable' },
  { key: 'display', label: 'Display / Bold' },
  { key: 'modern', label: 'Modern' },
  { key: 'elegant', label: 'Elegant' },
  { key: 'script', label: 'Script / Handwritten' },
  { key: 'mono', label: 'Monospace' },
];

export function TextControls({ settings, onChange }: TextControlsProps) {
  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold text-foreground">Text Content</h3>
      
      {/* Text Input */}
      <div className="space-y-2">
        <Textarea
          value={settings.content}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="Enter your scrolling text..."
          className="min-h-[100px] resize-none bg-muted/50 border-border focus:border-primary transition-colors"
        />
        <p className="text-xs text-muted-foreground text-right">
          {settings.content.length} chars · {settings.content.trim().split(/\s+/).filter(Boolean).length} words
        </p>
      </div>

      {/* Font Family - Grouped */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Font Family</label>
        <Select value={settings.fontFamily} onValueChange={(v) => onChange({ fontFamily: v })}>
          <SelectTrigger className="bg-muted/50 h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {fontCategories.map((category) => {
              const fonts = FONT_FAMILIES.filter((f) => f.category === category.key);
              if (fonts.length === 0) return null;
              return (
                <div key={category.key}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                    {category.label}
                  </div>
                  {fonts.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      <span style={{ fontFamily: font.value }}>{font.name}</span>
                    </SelectItem>
                  ))}
                </div>
              );
            })}
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
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 transition-all',
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
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 transition-all',
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
        <label className="text-xs font-medium text-muted-foreground">Horizontal Alignment</label>
        <div className="flex gap-2">
          {[
            { value: 'left' as const, icon: AlignLeft, label: 'Left' },
            { value: 'center' as const, icon: AlignCenter, label: 'Center' },
            { value: 'right' as const, icon: AlignRight, label: 'Right' },
          ].map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => onChange({ textAlign: value })}
              title={label}
              className={cn(
                'flex-1 flex items-center justify-center py-2.5 rounded-lg border-2 transition-all',
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

      {/* Vertical Alignment */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Vertical Alignment</label>
        <div className="flex gap-2">
          {[
            { value: 'top' as const, icon: AlignVerticalJustifyStart, label: 'Top' },
            { value: 'center' as const, icon: AlignVerticalJustifyCenter, label: 'Middle' },
            { value: 'bottom' as const, icon: AlignVerticalJustifyEnd, label: 'Bottom' },
          ].map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => onChange({ verticalAlign: value })}
              title={label}
              className={cn(
                'flex-1 flex items-center justify-center py-2.5 rounded-lg border-2 transition-all',
                settings.verticalAlign === value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-muted/50 text-muted-foreground hover:border-primary/50'
              )}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Container Width */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <MoveHorizontal className="w-3.5 h-3.5" />
            Text Width
          </label>
          <span className="text-xs font-mono text-primary">{settings.containerWidth}%</span>
        </div>
        <Slider
          value={[settings.containerWidth]}
          onValueChange={([v]) => onChange({ containerWidth: v })}
          min={30}
          max={100}
          step={1}
          className="py-2"
        />
      </div>

      {/* Horizontal Padding */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <MoveHorizontal className="w-3.5 h-3.5" />
            Horizontal Padding
          </label>
          <span className="text-xs font-mono text-primary">{settings.paddingX}%</span>
        </div>
        <Slider
          value={[settings.paddingX]}
          onValueChange={([v]) => onChange({ paddingX: v })}
          min={0}
          max={30}
          step={1}
          className="py-2"
        />
      </div>

      {/* Vertical Padding */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <MoveVertical className="w-3.5 h-3.5" />
            Vertical Padding
          </label>
          <span className="text-xs font-mono text-primary">{settings.paddingY}px</span>
        </div>
        <Slider
          value={[settings.paddingY]}
          onValueChange={([v]) => onChange({ paddingY: v })}
          min={0}
          max={150}
          step={5}
          className="py-2"
        />
      </div>

      {/* Margin Top */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <MoveVertical className="w-3.5 h-3.5" />
            Margin Top
          </label>
          <span className="text-xs font-mono text-primary">{settings.marginTop ?? 0}px</span>
        </div>
        <Slider
          value={[settings.marginTop ?? 0]}
          onValueChange={([v]) => onChange({ marginTop: v })}
          min={0}
          max={200}
          step={5}
          className="py-2"
        />
      </div>

      {/* Margin Bottom */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <MoveVertical className="w-3.5 h-3.5" />
            Margin Bottom
          </label>
          <span className="text-xs font-mono text-primary">{settings.marginBottom ?? 0}px</span>
        </div>
        <Slider
          value={[settings.marginBottom ?? 0]}
          onValueChange={([v]) => onChange({ marginBottom: v })}
          min={0}
          max={200}
          step={5}
          className="py-2"
        />
      </div>

      {/* Fit to Screen Toggle */}
      <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Maximize className="w-3.5 h-3.5" />
            Fit to Screen
          </label>
          <Switch
            checked={settings.fitToScreen ?? false}
            onCheckedChange={(checked) => onChange({ fitToScreen: checked })}
          />
        </div>
        <p className="text-[10px] text-muted-foreground">
          Auto-scale text to fit within the screen with minimum margins
        </p>
        
        {(settings.fitToScreen ?? false) && (
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex justify-between items-center">
              <label className="text-xs font-medium text-muted-foreground">Min Safe Margin</label>
              <span className="text-xs font-mono text-primary">{settings.minMargin ?? 20}px</span>
            </div>
            <Slider
              value={[settings.minMargin ?? 20]}
              onValueChange={([v]) => onChange({ minMargin: v })}
              min={10}
              max={50}
              step={5}
              className="py-2"
            />
          </div>
        )}
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
          min={0.8}
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
            className="w-12 h-10 rounded-lg border-2 border-border cursor-pointer bg-transparent"
          />
          <input
            type="text"
            value={settings.color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="flex-1 px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm font-mono focus:border-primary transition-colors"
          />
        </div>
        {/* Color Presets */}
        <div className="flex gap-1.5 flex-wrap pt-1">
          {[
            '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6',
            '#000000', '#212529', '#495057', '#6c757d',
            '#ef4444', '#f97316', '#eab308', '#22c55e',
            '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6',
            '#d946ef', '#ec4899', '#f43f5e', '#fbbf24',
          ].map((color) => (
            <button
              key={color}
              onClick={() => onChange({ color })}
              className={cn(
                'w-7 h-7 rounded-lg border-2 transition-all hover:scale-110',
                settings.color.toLowerCase() === color.toLowerCase() 
                  ? 'border-primary ring-2 ring-primary/30' 
                  : 'border-border/50'
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
