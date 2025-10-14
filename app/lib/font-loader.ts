/**
 * Font Loader - Dynamic on-demand font loading system
 *
 * This module handles loading fonts only when needed (hover/selection)
 * to keep initial page load fast.
 */

import { getFontDefinition, type FontDefinition } from "./font-registry";

// ============================================
// CACHE & STATE MANAGEMENT
// ============================================

// Track which fonts are already loaded
const loadedFonts = new Set<string>();

// Track in-flight font loading promises to prevent duplicates
const fontLoadPromises = new Map<string, Promise<void>>();

// ============================================
// GOOGLE FONTS LOADING
// ============================================

/**
 * Load a Google Font dynamically via CDN
 */
function loadGoogleFont(font: FontDefinition): Promise<void> {
  return new Promise((resolve, reject) => {
    const { googleFontName, variants } = font;
    if (!googleFontName) {
      reject(new Error(`No Google Font name for ${font.name}`));
      return;
    }

    // Build Google Fonts URL
    let fontUrl: string;

    if (variants.hasVariable) {
      // Variable font URL
      if (variants.variableAxes && variants.variableAxes.length > 0) {
        // Fonts with custom axes (e.g., Kablammo with MORF)
        const weightsParam = `${Math.min(...variants.weights)}..${Math.max(...variants.weights)}`;
        fontUrl = `https://fonts.googleapis.com/css2?family=${googleFontName}:wght@${weightsParam}&display=swap`;
      } else {
        // Standard variable font
        const weightsParam = `${Math.min(...variants.weights)}..${Math.max(...variants.weights)}`;
        const hasItalic = variants.styles.includes("italic");

        if (hasItalic) {
          fontUrl = `https://fonts.googleapis.com/css2?family=${googleFontName}:ital,wght@0,${weightsParam};1,${weightsParam}&display=swap`;
        } else {
          fontUrl = `https://fonts.googleapis.com/css2?family=${googleFontName}:wght@${weightsParam}&display=swap`;
        }
      }
    } else {
      // Static font URL
      const weightsParam = variants.weights.join(";");
      const hasItalic = variants.styles.includes("italic");

      if (hasItalic) {
        // Both normal and italic
        const italicWeights = variants.weights.map(w => `1,${w}`).join(";");
        const normalWeights = variants.weights.map(w => `0,${w}`).join(";");
        fontUrl = `https://fonts.googleapis.com/css2?family=${googleFontName}:ital,wght@${normalWeights};${italicWeights}&display=swap`;
      } else {
        // Only normal
        fontUrl = `https://fonts.googleapis.com/css2?family=${googleFontName}:wght@${weightsParam}&display=swap`;
      }
    }

    // Check if already loaded
    const existingLink = document.querySelector(`link[href*="${googleFontName}"]`);
    if (existingLink) {
      console.log(`✅ Font already loaded: ${font.name}`);
      resolve();
      return;
    }

    // Create and inject <link> element
    const link = document.createElement("link");
    link.href = fontUrl;
    link.rel = "stylesheet";

    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.warn(`⚠️ Font loading timeout: ${font.name} - continuing anyway`);
      resolve(); // Resolve anyway to not block UI
    }, 5000);

    link.onload = () => {
      clearTimeout(timeout);
      console.log(`✅ Google Font loaded: ${font.name}`);
      console.log(`   URL: ${fontUrl}`);
      resolve();
    };

    link.onerror = (e) => {
      clearTimeout(timeout);
      console.error(`❌ Failed to load Google Font: ${font.name}`);
      console.error(`   URL: ${fontUrl}`);
      console.error(`   Error:`, e);
      // Don't reject - just resolve to prevent blocking UI
      resolve();
    };

    document.head.appendChild(link);
  });
}

// ============================================
// CUSTOM FONTS LOADING
// ============================================

/**
 * Load a custom font using CSS Font Loading API
 */
async function loadCustomFont(font: FontDefinition): Promise<void> {
  if (!font.filePath) {
    throw new Error(`No file path for custom font: ${font.name}`);
  }

  const loadPromises: Promise<void>[] = [];

  // Load all variants
  for (const weight of font.variants.weights) {
    for (const style of font.variants.styles) {
      const styleStr = style === "italic" ? "-italic" : "";
      const filePath = `${font.filePath}/${font.family.toLowerCase().replace(/ /g, "-")}-${weight}${styleStr}.woff2`;

      const fontFace = new FontFace(font.family, `url(${filePath})`, {
        weight: weight.toString(),
        style,
        display: "swap",
      });

      loadPromises.push(
        fontFace.load().then(loadedFace => {
          document.fonts.add(loadedFace);
          console.log(`✅ Custom font loaded: ${font.name} ${weight} ${style}`);
        })
      );
    }
  }

  await Promise.all(loadPromises);
}

// ============================================
// USER-UPLOADED FONTS LOADING
// ============================================

/**
 * Load a user-uploaded font from Convex storage
 * (To be implemented when user upload feature is added)
 */
async function loadUserFont(font: FontDefinition, fileUrl: string): Promise<void> {
  const fontFace = new FontFace(font.family, `url(${fileUrl})`, {
    weight: "400",
    style: "normal",
    display: "swap",
  });

  const loadedFace = await fontFace.load();
  document.fonts.add(loadedFace);
  console.log(`✅ User font loaded: ${font.name}`);
}

// ============================================
// MAIN FONT LOADER
// ============================================

/**
 * Load a font on-demand by font family name
 * This is the main function you'll use in your components
 *
 * @param fontFamily - CSS font-family value
 * @returns Promise that resolves when font is loaded
 */
export async function loadFont(fontFamily: string): Promise<void> {
  // Check if already loaded
  if (loadedFonts.has(fontFamily)) {
    return;
  }

  // Check if already loading
  if (fontLoadPromises.has(fontFamily)) {
    return fontLoadPromises.get(fontFamily);
  }

  // Get font definition from registry
  const font = getFontDefinition(fontFamily);
  if (!font) {
    console.warn(`⚠️ Font not found in registry: ${fontFamily}`);
    return;
  }

  // Create loading promise
  const loadPromise = (async () => {
    try {
      switch (font.source) {
        case "google":
          await loadGoogleFont(font);
          break;

        case "admin-custom":
          await loadCustomFont(font);
          break;

        case "user-upload":
          // For user uploads, we need the file URL from Convex
          // This will be implemented when user upload feature is added
          console.log(`⏳ User font loading not yet implemented: ${fontFamily}`);
          break;

        default:
          throw new Error(`Unknown font source: ${font.source}`);
      }

      // Mark as loaded
      loadedFonts.add(fontFamily);
    } catch (error) {
      console.error(`❌ Failed to load font: ${fontFamily}`, error);
      throw error;
    } finally {
      // Remove from in-flight promises
      fontLoadPromises.delete(fontFamily);
    }
  })();

  // Store promise
  fontLoadPromises.set(fontFamily, loadPromise);

  return loadPromise;
}

/**
 * Preload multiple fonts (e.g., favorites or recently used)
 */
export async function preloadFonts(fontFamilies: string[]): Promise<void> {
  await Promise.all(fontFamilies.map(loadFont));
}

/**
 * Check if a font is currently loaded
 */
export function isFontLoaded(fontFamily: string): boolean {
  return loadedFonts.has(fontFamily);
}

/**
 * Preload all fonts (use sparingly - only for premium features)
 */
export async function preloadAllFonts(): Promise<void> {
  const { STATIC_FONT_REGISTRY } = await import("./font-registry");
  const fontFamilies = STATIC_FONT_REGISTRY.map(f => f.family);
  await preloadFonts(fontFamilies);
}

/**
 * Clear font cache (useful for testing)
 */
export function clearFontCache(): void {
  loadedFonts.clear();
  fontLoadPromises.clear();
}
