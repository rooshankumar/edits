

# Enhanced Text Alignment & Video Background Support

## Overview
Improve text positioning controls with new margin/spacing options and a "Fit to Screen" feature, plus ensure video backgrounds work properly across all components.

---

## Part 1: Enhanced Text Alignment Controls

### New Settings to Add

**File: `src/types/video-project.ts`**

Add new properties to `TextSettings`:
```typescript
marginTop: number;      // Space before text (0-200px)
marginBottom: number;   // Space after text (0-200px)  
fitToScreen: boolean;   // Auto-fit text with minimum margins
minMargin: number;      // Minimum safe margin when fitting (10-50px)
```

Update `DEFAULT_PROJECT.text`:
- `marginTop: 0`
- `marginBottom: 0`
- `fitToScreen: false`
- `minMargin: 20`

---

### UI Controls

**File: `src/components/video-generator/TextControls.tsx`**

Add new controls section:

| Control | Type | Range | Description |
|---------|------|-------|-------------|
| Margin Top | Slider | 0-200px | Space before text starts |
| Margin Bottom | Slider | 0-200px | Space after text ends |
| Fit to Screen | Toggle | on/off | Auto-scale text to fit within margins |
| Min Safe Margin | Slider | 10-50px | Minimum edge margin when fitting |

Reorganize controls layout:
```
┌─────────────────────────────┐
│ TEXT CONTENT                │
│ [Textarea]                  │
├─────────────────────────────┤
│ FONT                        │
│ Family: [Select]            │
│ Size: [───○────] 48px       │
│ [Bold] [Italic]             │
├─────────────────────────────┤
│ ALIGNMENT                   │
│ Horizontal: [◀][■][▶]       │
│ Vertical: [▲][■][▼]         │
├─────────────────────────────┤
│ SPACING & MARGINS           │
│ Text Width: [────○──] 98%   │
│ Padding X: [──○────] 18%    │
│ Padding Y: [───○───] 40px   │
│ Margin Top: [○──────] 0px   │
│ Margin Bottom: [○────] 0px  │
├─────────────────────────────┤
│ FIT TO SCREEN               │
│ [○] Auto-fit with margins   │
│ Min Margin: [──○────] 20px  │
├─────────────────────────────┤
│ TYPOGRAPHY                  │
│ Line Height: [───○──] 1.6   │
│ Letter Spacing: [──○─] 0px  │
├─────────────────────────────┤
│ COLOR                       │
│ [■] #ffffff                 │
│ [Preset colors...]          │
└─────────────────────────────┘
```

---

### Rendering Updates

**File: `src/components/video-generator/VideoPreview.tsx`**

Update text container styles:
- Apply `marginTop` and `marginBottom` to text wrapper
- When `fitToScreen` is enabled:
  - Calculate available height minus margins
  - Auto-scale font size to fit content
  - Ensure minimum margin is maintained

Logic for fit-to-screen:
```typescript
if (project.text.fitToScreen) {
  const availableHeight = containerHeight - (project.text.minMargin * 2);
  const textHeight = textRef.current?.scrollHeight || 0;
  
  if (textHeight > availableHeight) {
    // Scale down font proportionally
    const scale = availableHeight / textHeight;
    effectiveFontSize = baseFontSize * scale;
  }
}
```

**File: `src/hooks/useVideoExport.ts`**

Apply same margin and fit-to-screen logic during export to ensure preview matches output.

---

## Part 2: Video Background Support

The video background feature already exists in types and UI but needs verification and enhancement.

### Current State
- `BackgroundSettings.video: string | null` exists
- `BackgroundControls.tsx` has video upload button
- `LeftEditorPanel.tsx` has image/video upload buttons  
- `VideoPreview.tsx` renders video background

### Enhancements

**File: `src/components/video-generator/LeftEditorPanel.tsx`**

The video upload already exists (lines 113-135), but add:
- Clearer visual indicator when video is selected vs image
- Preview thumbnail of uploaded video
- File size warning for large videos

**File: `src/hooks/useVideoExport.ts`**

Ensure video backgrounds are properly encoded during export:
- Handle video frame extraction for static export
- Or embed video track in final output

---

## Summary of Changes

| File | Changes |
|------|---------|
| `src/types/video-project.ts` | Add `marginTop`, `marginBottom`, `fitToScreen`, `minMargin` |
| `src/components/video-generator/TextControls.tsx` | Add margin sliders, fit-to-screen toggle, reorganize layout |
| `src/components/video-generator/VideoPreview.tsx` | Apply margins, implement fit-to-screen scaling |
| `src/components/video-generator/LeftEditorPanel.tsx` | Improve video upload UX with preview and indicators |
| `src/hooks/useVideoExport.ts` | Apply margin/fit logic to export |

---

## Result

1. **Better text positioning** - Control exact spacing before/after text
2. **Fit to screen option** - Auto-scale text to fill available space with safe margins
3. **Left/Right/Center alignment** - Already works, now combined with margins for precision
4. **Minimum margin protection** - Ensure text never touches screen edges
5. **Video backgrounds** - Already functional, enhanced with better UX

