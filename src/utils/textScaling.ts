/**
 * Text Scaling Utilities for Long-Form Content
 * Automatically adjusts font size and spacing based on content length
 */

export interface ScaledTextSettings {
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  paddingX: number;
  paddingY: number;
}

/**
 * Calculate optimal font size based on content length
 * Short content (< 100 words): Use full font size
 * Medium content (100-300 words): Scale down slightly
 * Long content (> 300 words): Scale down more for readability
 */
export function calculateOptimalFontSize(
  baseFontSize: number,
  wordCount: number,
  autoScale: boolean
): number {
  if (!autoScale) return baseFontSize;

  // Short content - use full size
  if (wordCount < 100) {
    return baseFontSize;
  }
  
  // Medium content - scale down 10-20%
  if (wordCount < 300) {
    const scaleFactor = 1 - ((wordCount - 100) / 200) * 0.2;
    return Math.round(baseFontSize * scaleFactor);
  }
  
  // Long content - scale down 20-40%
  if (wordCount < 600) {
    const scaleFactor = 0.8 - ((wordCount - 300) / 300) * 0.2;
    return Math.round(baseFontSize * scaleFactor);
  }
  
  // Very long content - cap at 60% of original
  return Math.round(baseFontSize * 0.6);
}

/**
 * Calculate optimal line height based on content length
 * Longer content needs tighter line spacing for better flow
 */
export function calculateOptimalLineHeight(
  baseLineHeight: number,
  wordCount: number,
  autoScale: boolean
): number {
  if (!autoScale) return baseLineHeight;

  // Short content - use base line height
  if (wordCount < 100) {
    return baseLineHeight;
  }
  
  // Medium to long content - reduce line height slightly
  if (wordCount < 300) {
    return Math.max(1.4, baseLineHeight - 0.1);
  }
  
  // Very long content - tighter spacing
  return Math.max(1.3, baseLineHeight - 0.2);
}

/**
 * Calculate optimal letter spacing based on content length
 * Longer content benefits from tighter letter spacing
 */
export function calculateOptimalLetterSpacing(
  baseLetterSpacing: number,
  wordCount: number,
  autoScale: boolean
): number {
  if (!autoScale) return baseLetterSpacing;

  // Short content - use base spacing
  if (wordCount < 100) {
    return baseLetterSpacing;
  }
  
  // Long content - reduce letter spacing for better density
  if (wordCount < 300) {
    return Math.max(-1, baseLetterSpacing - 0.5);
  }
  
  return Math.max(-1.5, baseLetterSpacing - 1);
}

/**
 * Calculate optimal padding based on content length
 * Longer content needs less padding to maximize screen space
 */
export function calculateOptimalPadding(
  basePadding: number,
  wordCount: number,
  autoScale: boolean
): number {
  if (!autoScale) return basePadding;

  // Short content - use base padding
  if (wordCount < 100) {
    return basePadding;
  }
  
  // Medium content - reduce padding
  if (wordCount < 300) {
    return Math.max(20, basePadding - 10);
  }
  
  // Long content - minimal padding
  return Math.max(15, basePadding - 20);
}

/**
 * Get all scaled text settings at once
 */
export function getScaledTextSettings(
  baseFontSize: number,
  baseLineHeight: number,
  baseLetterSpacing: number,
  basePaddingX: number,
  basePaddingY: number,
  wordCount: number,
  autoScale: boolean
): ScaledTextSettings {
  return {
    fontSize: calculateOptimalFontSize(baseFontSize, wordCount, autoScale),
    lineHeight: calculateOptimalLineHeight(baseLineHeight, wordCount, autoScale),
    letterSpacing: calculateOptimalLetterSpacing(baseLetterSpacing, wordCount, autoScale),
    paddingX: calculateOptimalPadding(basePaddingX, wordCount, autoScale),
    paddingY: calculateOptimalPadding(basePaddingY, wordCount, autoScale),
  };
}

/**
 * Get content length category for UI display
 */
export function getContentLengthCategory(wordCount: number): {
  category: 'short' | 'medium' | 'long' | 'very-long';
  label: string;
  description: string;
} {
  if (wordCount < 100) {
    return {
      category: 'short',
      label: 'Short',
      description: 'Perfect for quick messages',
    };
  }
  
  if (wordCount < 300) {
    return {
      category: 'medium',
      label: 'Medium',
      description: 'Good for stories and tips',
    };
  }
  
  if (wordCount < 600) {
    return {
      category: 'long',
      label: 'Long',
      description: 'Full stories and articles',
    };
  }
  
  return {
    category: 'very-long',
    label: 'Very Long',
    description: 'Extended content',
  };
}
