/**
 * Font Registry - Central catalog of all available fonts
 *
 * This file defines all fonts available in the app with their metadata,
 * variants, and tags for filtering.
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export type FontSource = "google" | "admin-custom" | "user-upload";

export type FontCategory = "serif" | "sans" | "slab" | "script" | "display" | "mono" | "handwritten";

export type FontStyle = "serif" | "sans" | "slab" | "script" | "display" | "mono" | "handwritten";

export type FontMood =
  | "elegant"
  | "playful"
  | "tech"
  | "vintage"
  | "headline"
  | "body"
  | "awkward"
  | "seasonal";

export type FontLanguage = "latin" | "cyrillic" | "arabic" | "devanagari";

export type FontVariants = {
  weights: number[];        // [400, 700] or [100, 200, ..., 900]
  styles: ("normal" | "italic")[];
  hasVariable: boolean;     // Variable font support
  variableAxes?: string[];  // e.g., ["MORF"] for Kablammo
};

export type FontDefinition = {
  name: string;             // "Edu NSW ACT Cursive"
  family: string;           // CSS font-family value
  displayName: string;      // "Edu NSW ACT Cursive"
  category: FontCategory;   // Main category
  source: FontSource;
  variants: FontVariants;

  // Google Fonts specific
  googleFontName?: string;  // URL-encoded name for Google API

  // Custom fonts
  filePath?: string;        // For admin fonts in /public

  // Tags for filtering (matching your filter UI)
  tags: {
    styles: FontStyle[];    // serif, sans, slab, script, display, mono, handwritten
    moods: FontMood[];      // elegant, playful, tech, vintage, headline, body
    languages: FontLanguage[]; // latin, cyrillic, arabic, devanagari
  };
};

// ============================================
// GOOGLE FONTS - From your currentprompt.txt
// ============================================

export const GOOGLE_FONTS: FontDefinition[] = [
  {
    name: "Edu NSW ACT Cursive",
    family: "Edu NSW ACT Cursive",
    displayName: "Edu NSW ACT Cursive",
    category: "handwritten",
    source: "google",
    googleFontName: "Edu+NSW+ACT+Cursive",
    variants: {
      weights: [400, 500, 600, 700],
      styles: ["normal"],
      hasVariable: true,
    },
    tags: {
      styles: ["handwritten", "script"],
      moods: ["playful", "body"],
      languages: ["latin"],
    },
  },
  {
    name: "BBH Sans Bartle",
    family: "BBH Sans Bartle",
    displayName: "BBH Sans Bartle",
    category: "sans",
    source: "google",
    googleFontName: "BBH+Sans+Bartle",
    variants: {
      weights: [400],
      styles: ["normal"],
      hasVariable: false,
    },
    tags: {
      styles: ["sans"],
      moods: ["tech", "body"],
      languages: ["latin"],
    },
  },
  {
    name: "Playwrite US Modern",
    family: "Playwrite US Modern",
    displayName: "Playwrite US Modern",
    category: "handwritten",
    source: "google",
    googleFontName: "Playwrite+US+Modern",
    variants: {
      weights: [100, 200, 300, 400],
      styles: ["normal"],
      hasVariable: true,
    },
    tags: {
      styles: ["handwritten", "script"],
      moods: ["playful", "elegant"],
      languages: ["latin"],
    },
  },
  {
    name: "Playwrite Deutschland Grundschrift Guides",
    family: "Playwrite DE Grund Guides",
    displayName: "Playwrite DE Grund Guides",
    category: "handwritten",
    source: "google",
    googleFontName: "Playwrite+DE+Grund+Guides",
    variants: {
      weights: [400],
      styles: ["normal"],
      hasVariable: false,
    },
    tags: {
      styles: ["handwritten", "script"],
      moods: ["playful", "elegant"],
      languages: ["latin"],
    },
  },
  {
    name: "Barrio",
    family: "Barrio",
    displayName: "Barrio",
    category: "display",
    source: "google",
    googleFontName: "Barrio",
    variants: {
      weights: [400],
      styles: ["normal"],
      hasVariable: false,
    },
    tags: {
      styles: ["display"],
      moods: ["playful", "headline", "vintage"],
      languages: ["latin"],
    },
  },
  {
    name: "Oi",
    family: "Oi",
    displayName: "Oi",
    category: "display",
    source: "google",
    googleFontName: "Oi",
    variants: {
      weights: [400],
      styles: ["normal"],
      hasVariable: false,
    },
    tags: {
      styles: ["display", "serif"],
      moods: ["playful", "headline"],
      languages: ["latin"],
    },
  },
  {
    name: "Kablammo",
    family: "Kablammo",
    displayName: "Kablammo",
    category: "display",
    source: "google",
    googleFontName: "Kablammo",
    variants: {
      weights: [400],
      styles: ["normal"],
      hasVariable: true,
      variableAxes: ["MORF"],
    },
    tags: {
      styles: ["display"],
      moods: ["playful", "headline", "awkward"],
      languages: ["latin"],
    },
  },
  {
    name: "Rubik Gemstones",
    family: "Rubik Gemstones",
    displayName: "Rubik Gemstones",
    category: "display",
    source: "google",
    googleFontName: "Rubik+Gemstones",
    variants: {
      weights: [400],
      styles: ["normal"],
      hasVariable: false,
    },
    tags: {
      styles: ["display"],
      moods: ["playful", "headline"],
      languages: ["latin", "cyrillic"],
    },
  },
  {
    name: "Rubik Wet Paint",
    family: "Rubik Wet Paint",
    displayName: "Rubik Wet Paint",
    category: "display",
    source: "google",
    googleFontName: "Rubik+Wet+Paint",
    variants: {
      weights: [400],
      styles: ["normal"],
      hasVariable: false,
    },
    tags: {
      styles: ["display"],
      moods: ["playful", "headline"],
      languages: ["latin", "cyrillic"],
    },
  },
  {
    name: "Butcherman",
    family: "Butcherman",
    displayName: "Butcherman",
    category: "display",
    source: "google",
    googleFontName: "Butcherman",
    variants: {
      weights: [400],
      styles: ["normal"],
      hasVariable: false,
    },
    tags: {
      styles: ["display"],
      moods: ["playful", "headline", "seasonal"],
      languages: ["latin"],
    },
  },
  {
    name: "Rubik Dirt",
    family: "Rubik Dirt",
    displayName: "Rubik Dirt",
    category: "display",
    source: "google",
    googleFontName: "Rubik+Dirt",
    variants: {
      weights: [400],
      styles: ["normal"],
      hasVariable: false,
    },
    tags: {
      styles: ["display"],
      moods: ["playful", "headline", "vintage"],
      languages: ["latin", "cyrillic"],
    },
  },
];

// ============================================
// ADMIN CUSTOM FONTS (Self-hosted)
// ============================================

export const ADMIN_CUSTOM_FONTS: FontDefinition[] = [
  // Add your custom fonts here when you download them
  // Example:
  // {
  //   name: "League Spartan",
  //   family: "League Spartan",
  //   displayName: "League Spartan - Premium Geometric",
  //   category: "sans",
  //   source: "admin-custom",
  //   filePath: "/fonts/league-spartan",
  //   variants: {
  //     weights: [300, 400, 500, 700, 900],
  //     styles: ["normal"],
  //     hasVariable: false,
  //   },
  //   tags: {
  //     styles: ["sans"],
  //     moods: ["tech", "headline"],
  //     languages: ["latin"],
  //   },
  // },
];

// ============================================
// COMBINED REGISTRY
// ============================================

export const STATIC_FONT_REGISTRY = [
  ...GOOGLE_FONTS,
  ...ADMIN_CUSTOM_FONTS,
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get font definition by family name
 */
export function getFontDefinition(fontFamily: string): FontDefinition | undefined {
  return STATIC_FONT_REGISTRY.find(f => f.family === fontFamily);
}

/**
 * Check if font supports specific weight/style
 */
export function fontSupportsVariant(
  fontFamily: string,
  weight: number,
  style: "normal" | "italic"
): boolean {
  const font = getFontDefinition(fontFamily);
  if (!font) return false;

  return (
    font.variants.weights.includes(weight) &&
    font.variants.styles.includes(style)
  );
}

/**
 * Get closest available weight for a font
 */
export function getClosestWeight(fontFamily: string, desiredWeight: number): number {
  const font = getFontDefinition(fontFamily);
  if (!font) return 400;

  const { weights } = font.variants;
  return weights.reduce((prev, curr) =>
    Math.abs(curr - desiredWeight) < Math.abs(prev - desiredWeight) ? curr : prev
  );
}

/**
 * Filter fonts by tags (for your filter UI)
 */
export function filterFonts(filters: {
  styles?: FontStyle[];
  moods?: FontMood[];
  languages?: FontLanguage[];
  source?: FontSource;
}): FontDefinition[] {
  return STATIC_FONT_REGISTRY.filter(font => {
    // Filter by styles
    if (filters.styles && filters.styles.length > 0) {
      const hasStyle = filters.styles.some(style => font.tags.styles.includes(style));
      if (!hasStyle) return false;
    }

    // Filter by moods
    if (filters.moods && filters.moods.length > 0) {
      const hasMood = filters.moods.some(mood => font.tags.moods.includes(mood));
      if (!hasMood) return false;
    }

    // Filter by languages
    if (filters.languages && filters.languages.length > 0) {
      const hasLanguage = filters.languages.some(lang => font.tags.languages.includes(lang));
      if (!hasLanguage) return false;
    }

    // Filter by source
    if (filters.source && font.source !== filters.source) {
      return false;
    }

    return true;
  });
}

/**
 * Search fonts by name
 */
export function searchFonts(query: string): FontDefinition[] {
  const lowerQuery = query.toLowerCase();
  return STATIC_FONT_REGISTRY.filter(font =>
    font.name.toLowerCase().includes(lowerQuery) ||
    font.family.toLowerCase().includes(lowerQuery) ||
    font.displayName.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get all available tags for filter UI
 */
export function getAllTags() {
  const allStyles = new Set<FontStyle>();
  const allMoods = new Set<FontMood>();
  const allLanguages = new Set<FontLanguage>();

  STATIC_FONT_REGISTRY.forEach(font => {
    font.tags.styles.forEach(s => allStyles.add(s));
    font.tags.moods.forEach(m => allMoods.add(m));
    font.tags.languages.forEach(l => allLanguages.add(l));
  });

  return {
    styles: Array.from(allStyles),
    moods: Array.from(allMoods),
    languages: Array.from(allLanguages),
  };
}
