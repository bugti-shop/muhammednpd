/**
 * Unicode Text Formatter
 * Converts text to styled Unicode characters that work on LinkedIn, Twitter, WhatsApp, etc.
 * These are actual Unicode characters (not HTML) that display as bold/italic everywhere.
 */

// Character mapping tables for Unicode text styling
const charMaps = {
  // Bold (Mathematical Bold)
  bold: {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').reduce((acc, char, i) => {
      acc[char] = String.fromCodePoint(0x1D400 + i);
      return acc;
    }, {} as Record<string, string>),
    lower: 'abcdefghijklmnopqrstuvwxyz'.split('').reduce((acc, char, i) => {
      acc[char] = String.fromCodePoint(0x1D41A + i);
      return acc;
    }, {} as Record<string, string>),
    digits: '0123456789'.split('').reduce((acc, char, i) => {
      acc[char] = String.fromCodePoint(0x1D7CE + i);
      return acc;
    }, {} as Record<string, string>),
  },

  // Italic (Mathematical Italic)
  italic: {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').reduce((acc, char, i) => {
      // Handle special case for 'h' which has a different codepoint
      acc[char] = String.fromCodePoint(0x1D434 + i);
      return acc;
    }, {} as Record<string, string>),
    lower: 'abcdefghijklmnopqrstuvwxyz'.split('').reduce((acc, char, i) => {
      // 'h' is at a different position in the italic set
      if (char === 'h') {
        acc[char] = 'ℎ'; // Planck constant
      } else {
        acc[char] = String.fromCodePoint(0x1D44E + i);
      }
      return acc;
    }, {} as Record<string, string>),
  },

  // Bold Italic (Mathematical Bold Italic)
  boldItalic: {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').reduce((acc, char, i) => {
      acc[char] = String.fromCodePoint(0x1D468 + i);
      return acc;
    }, {} as Record<string, string>),
    lower: 'abcdefghijklmnopqrstuvwxyz'.split('').reduce((acc, char, i) => {
      acc[char] = String.fromCodePoint(0x1D482 + i);
      return acc;
    }, {} as Record<string, string>),
  },

  // Sans-Serif Bold
  boldSans: {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').reduce((acc, char, i) => {
      acc[char] = String.fromCodePoint(0x1D5D4 + i);
      return acc;
    }, {} as Record<string, string>),
    lower: 'abcdefghijklmnopqrstuvwxyz'.split('').reduce((acc, char, i) => {
      acc[char] = String.fromCodePoint(0x1D5EE + i);
      return acc;
    }, {} as Record<string, string>),
    digits: '0123456789'.split('').reduce((acc, char, i) => {
      acc[char] = String.fromCodePoint(0x1D7EC + i);
      return acc;
    }, {} as Record<string, string>),
  },

  // Sans-Serif Normal
  sansNormal: {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').reduce((acc, char, i) => {
      acc[char] = String.fromCodePoint(0x1D5A0 + i);
      return acc;
    }, {} as Record<string, string>),
    lower: 'abcdefghijklmnopqrstuvwxyz'.split('').reduce((acc, char, i) => {
      acc[char] = String.fromCodePoint(0x1D5BA + i);
      return acc;
    }, {} as Record<string, string>),
    digits: '0123456789'.split('').reduce((acc, char, i) => {
      acc[char] = String.fromCodePoint(0x1D7E2 + i);
      return acc;
    }, {} as Record<string, string>),
  },

  // Sans-Serif Italic
  italicSans: {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').reduce((acc, char, i) => {
      acc[char] = String.fromCodePoint(0x1D608 + i);
      return acc;
    }, {} as Record<string, string>),
    lower: 'abcdefghijklmnopqrstuvwxyz'.split('').reduce((acc, char, i) => {
      acc[char] = String.fromCodePoint(0x1D622 + i);
      return acc;
    }, {} as Record<string, string>),
  },

  // Sans-Serif Bold Italic
  boldItalicSans: {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').reduce((acc, char, i) => {
      acc[char] = String.fromCodePoint(0x1D63C + i);
      return acc;
    }, {} as Record<string, string>),
    lower: 'abcdefghijklmnopqrstuvwxyz'.split('').reduce((acc, char, i) => {
      acc[char] = String.fromCodePoint(0x1D656 + i);
      return acc;
    }, {} as Record<string, string>),
  },

  // Script (Mathematical Script)
  script: {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').reduce((acc, char, i) => {
      // Some script characters have special positions
      const special: Record<string, string> = {
        'B': 'ℬ', 'E': 'ℰ', 'F': 'ℱ', 'H': 'ℋ', 'I': 'ℐ',
        'L': 'ℒ', 'M': 'ℳ', 'R': 'ℛ', 'e': 'ℯ', 'g': 'ℊ', 'o': 'ℴ',
      };
      acc[char] = special[char] || String.fromCodePoint(0x1D49C + i);
      return acc;
    }, {} as Record<string, string>),
    lower: 'abcdefghijklmnopqrstuvwxyz'.split('').reduce((acc, char, i) => {
      const special: Record<string, string> = { 'e': 'ℯ', 'g': 'ℊ', 'o': 'ℴ' };
      acc[char] = special[char] || String.fromCodePoint(0x1D4B6 + i);
      return acc;
    }, {} as Record<string, string>),
  },

  // Monospace
  monospace: {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').reduce((acc, char, i) => {
      acc[char] = String.fromCodePoint(0x1D670 + i);
      return acc;
    }, {} as Record<string, string>),
    lower: 'abcdefghijklmnopqrstuvwxyz'.split('').reduce((acc, char, i) => {
      acc[char] = String.fromCodePoint(0x1D68A + i);
      return acc;
    }, {} as Record<string, string>),
    digits: '0123456789'.split('').reduce((acc, char, i) => {
      acc[char] = String.fromCodePoint(0x1D7F6 + i);
      return acc;
    }, {} as Record<string, string>),
  },

  // Double-struck (Blackboard Bold)
  doublestruck: {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').reduce((acc, char, i) => {
      const special: Record<string, string> = {
        'C': 'ℂ', 'H': 'ℍ', 'N': 'ℕ', 'P': 'ℙ', 'Q': 'ℚ', 'R': 'ℝ', 'Z': 'ℤ',
      };
      acc[char] = special[char] || String.fromCodePoint(0x1D538 + i);
      return acc;
    }, {} as Record<string, string>),
    lower: 'abcdefghijklmnopqrstuvwxyz'.split('').reduce((acc, char, i) => {
      acc[char] = String.fromCodePoint(0x1D552 + i);
      return acc;
    }, {} as Record<string, string>),
    digits: '0123456789'.split('').reduce((acc, char, i) => {
      acc[char] = String.fromCodePoint(0x1D7D8 + i);
      return acc;
    }, {} as Record<string, string>),
  },
};

// Combining characters for underline and strikethrough
const COMBINING_UNDERLINE = '\u0332'; // Combining Low Line
const COMBINING_STRIKETHROUGH = '\u0336'; // Combining Long Stroke Overlay

export type UnicodeStyle = 
  | 'bold' 
  | 'italic' 
  | 'boldItalic' 
  | 'sansNormal'
  | 'boldSans' 
  | 'italicSans' 
  | 'boldItalicSans'
  | 'script' 
  | 'monospace' 
  | 'doublestruck'
  | 'underline' 
  | 'strikethrough'
  | 'boldUnderline'
  | 'boldStrikethrough';

/**
 * Transform text to a styled Unicode format
 */
export const toUnicodeStyle = (text: string, style: UnicodeStyle): string => {
  if (!text) return '';

  // Handle underline and strikethrough (combining characters)
  if (style === 'underline') {
    return text.split('').map(char => char + COMBINING_UNDERLINE).join('');
  }
  
  if (style === 'strikethrough') {
    return text.split('').map(char => char + COMBINING_STRIKETHROUGH).join('');
  }
  
  if (style === 'boldUnderline') {
    const boldText = toUnicodeStyle(text, 'bold');
    return boldText.split('').map(char => char + COMBINING_UNDERLINE).join('');
  }
  
  if (style === 'boldStrikethrough') {
    const boldText = toUnicodeStyle(text, 'bold');
    return boldText.split('').map(char => char + COMBINING_STRIKETHROUGH).join('');
  }

  // Get the character map for this style
  const map = charMaps[style as keyof typeof charMaps];
  if (!map) return text;

  return text.split('').map(char => {
    // Check uppercase
    if (map.upper && map.upper[char]) {
      return map.upper[char];
    }
    // Check lowercase
    if (map.lower && map.lower[char]) {
      return map.lower[char];
    }
    // Check digits
    if ('digits' in map && map.digits && map.digits[char]) {
      return map.digits[char];
    }
    // Return unchanged if not mappable
    return char;
  }).join('');
};

/**
 * Convert text to bullet list with Unicode bullets
 */
export const toBulletList = (text: string): string => {
  const lines = text.split('\n').filter(line => line.trim());
  return lines.map(line => `• ${line.trim()}`).join('\n');
};

/**
 * Convert text to numbered list
 */
export const toNumberedList = (text: string): string => {
  const lines = text.split('\n').filter(line => line.trim());
  return lines.map((line, i) => `${i + 1}. ${line.trim()}`).join('\n');
};

/**
 * Convert text to checkbox list
 */
export const toCheckboxList = (text: string): string => {
  const lines = text.split('\n').filter(line => line.trim());
  return lines.map(line => `☐ ${line.trim()}`).join('\n');
};

/**
 * Convert text to arrow list (ascending)
 */
export const toAscendingList = (text: string): string => {
  const lines = text.split('\n').filter(line => line.trim());
  return lines.map(line => `↗ ${line.trim()}`).join('\n');
};

/**
 * Convert text to arrow list (descending)
 */
export const toDescendingList = (text: string): string => {
  const lines = text.split('\n').filter(line => line.trim());
  return lines.map(line => `↘ ${line.trim()}`).join('\n');
};

/**
 * Remove all Unicode styling (convert back to plain text)
 */
export const removeUnicodeFormatting = (text: string, preserveCombining = false): string => {
  // Optionally preserve combining characters (underline, strikethrough)
  let result: string;
  if (preserveCombining) {
    result = text;
  } else {
    result = text.replace(new RegExp(`[${COMBINING_UNDERLINE}${COMBINING_STRIKETHROUGH}]`, 'g'), '');
  }
  
  // Create reverse mappings
  const reverseMap: Record<string, string> = {};
  
  Object.values(charMaps).forEach(styleMap => {
    if (styleMap.upper) {
      Object.entries(styleMap.upper).forEach(([plain, unicode]) => {
        reverseMap[unicode] = plain;
      });
    }
    if (styleMap.lower) {
      Object.entries(styleMap.lower).forEach(([plain, unicode]) => {
        reverseMap[unicode] = plain;
      });
    }
    if ('digits' in styleMap && styleMap.digits) {
      Object.entries(styleMap.digits).forEach(([plain, unicode]) => {
        reverseMap[unicode] = plain;
      });
    }
  });
  
  // Replace styled characters with plain ones
  return Array.from(result).map(char => reverseMap[char] || char).join('');
};

/**
 * Detect which unicode style a character belongs to.
 * Returns the style name and the plain ASCII character.
 */
type CharEmphasis = 'none' | 'bold' | 'italic' | 'boldItalic';

const detectCharEmphasis = (char: string): { plain: string; emphasis: CharEmphasis } => {
  // Build reverse maps grouped by style
  for (const [styleName, styleMap] of Object.entries(charMaps)) {
    for (const caseMap of [styleMap.upper, styleMap.lower, 'digits' in styleMap ? styleMap.digits : undefined]) {
      if (!caseMap) continue;
      for (const [plain, unicode] of Object.entries(caseMap)) {
        if (char === unicode) {
          // Determine emphasis from style name
          let emphasis: CharEmphasis = 'none';
          if (styleName === 'bold' || styleName === 'boldSans') emphasis = 'bold';
          else if (styleName === 'italic' || styleName === 'italicSans') emphasis = 'italic';
          else if (styleName === 'boldItalic' || styleName === 'boldItalicSans') emphasis = 'boldItalic';
          return { plain, emphasis };
        }
      }
    }
  }
  // Plain ASCII or non-mappable character
  return { plain: char, emphasis: 'none' };
};

/**
 * Mapping: for each variant, what style should each emphasis level use
 */
const variantEmphasisMap: Record<string, Record<CharEmphasis, UnicodeStyle | 'plain'>> = {
  normal:         { none: 'plain',       bold: 'bold',          italic: 'italic',       boldItalic: 'boldItalic' },
  bold:           { none: 'bold',        bold: 'bold',          italic: 'boldItalic',   boldItalic: 'boldItalic' },
  italic:         { none: 'italic',      bold: 'boldItalic',    italic: 'italic',       boldItalic: 'boldItalic' },
  boldItalic:     { none: 'boldItalic',  bold: 'boldItalic',    italic: 'boldItalic',   boldItalic: 'boldItalic' },
  sansNormal:     { none: 'sansNormal',  bold: 'boldSans',      italic: 'italicSans',   boldItalic: 'boldItalicSans' },
  boldSans:       { none: 'boldSans',    bold: 'boldSans',      italic: 'boldItalicSans',boldItalic: 'boldItalicSans' },
  italicSans:     { none: 'italicSans',  bold: 'boldItalicSans',italic: 'italicSans',   boldItalic: 'boldItalicSans' },
  boldItalicSans: { none: 'boldItalicSans', bold: 'boldItalicSans', italic: 'boldItalicSans', boldItalic: 'boldItalicSans' },
  script:         { none: 'script',      bold: 'script',        italic: 'script',       boldItalic: 'script' },
  monospace:      { none: 'monospace',   bold: 'monospace',     italic: 'monospace',    boldItalic: 'monospace' },
  doublestruck:   { none: 'doublestruck',bold: 'doublestruck',  italic: 'doublestruck', boldItalic: 'doublestruck' },
};

/**
 * Convert styled text to a target variant while preserving per-character emphasis.
 * E.g., if user made "Hello" bold and "World" plain, in the Sans variant
 * "Hello" becomes boldSans and "World" becomes sansNormal.
 */
export const convertPreservingEmphasis = (text: string, targetVariant: string): string => {
  const emphasisMapping = variantEmphasisMap[targetVariant];
  if (!emphasisMapping) return text;

  // Remove combining characters first, preserve them separately
  const combiningChars: Record<number, string[]> = {};
  const chars = Array.from(text);
  const cleanChars: string[] = [];
  
  for (let i = 0; i < chars.length; i++) {
    const cp = chars[i].codePointAt(0) || 0;
    // Check if combining character
    if (chars[i] === COMBINING_UNDERLINE || chars[i] === COMBINING_STRIKETHROUGH) {
      const lastIdx = cleanChars.length - 1;
      if (!combiningChars[lastIdx]) combiningChars[lastIdx] = [];
      combiningChars[lastIdx].push(chars[i]);
    } else {
      cleanChars.push(chars[i]);
    }
  }

  const result = cleanChars.map((char, idx) => {
    // Detect what emphasis this character has
    const { plain, emphasis } = detectCharEmphasis(char);
    
    // Get target style for this emphasis level
    const targetStyle = emphasisMapping[emphasis];
    
    let converted: string;
    if (targetStyle === 'plain') {
      converted = plain;
    } else {
      converted = toUnicodeStyle(plain, targetStyle);
    }
    
    // Re-add combining characters
    if (combiningChars[idx]) {
      converted += combiningChars[idx].join('');
    }
    
    return converted;
  }).join('');

  return result;
};

/**
 * Copy styled text to clipboard
 */
export const copyStyledText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
};

/**
 * All available styles with display names
 */
export const availableStyles: { id: UnicodeStyle; name: string; example: string }[] = [
  { id: 'bold', name: 'Bold', example: toUnicodeStyle('Abc', 'bold') },
  { id: 'italic', name: 'Italic', example: toUnicodeStyle('Abc', 'italic') },
  { id: 'boldItalic', name: 'Bold Italic', example: toUnicodeStyle('Abc', 'boldItalic') },
  { id: 'sansNormal', name: 'Sans-Serif', example: toUnicodeStyle('Abc', 'sansNormal') },
  { id: 'boldSans', name: 'Bold Sans', example: toUnicodeStyle('Abc', 'boldSans') },
  { id: 'italicSans', name: 'Italic Sans', example: toUnicodeStyle('Abc', 'italicSans') },
  { id: 'boldItalicSans', name: 'Bold Italic Sans', example: toUnicodeStyle('Abc', 'boldItalicSans') },
  { id: 'underline', name: 'Underline', example: toUnicodeStyle('Abc', 'underline') },
  { id: 'strikethrough', name: 'Strikethrough', example: toUnicodeStyle('Abc', 'strikethrough') },
  { id: 'boldUnderline', name: 'Bold Underline', example: toUnicodeStyle('Abc', 'boldUnderline') },
  { id: 'boldStrikethrough', name: 'Bold Strikethrough', example: toUnicodeStyle('Abc', 'boldStrikethrough') },
  { id: 'script', name: 'Script', example: toUnicodeStyle('Abc', 'script') },
  { id: 'doublestruck', name: 'Double-struck', example: toUnicodeStyle('Abc', 'doublestruck') },
  { id: 'monospace', name: 'Monospace', example: toUnicodeStyle('Abc', 'monospace') },
];
