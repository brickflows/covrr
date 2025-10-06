export interface BookMetadata {
  title: string;
  author?: string;
  genre?: string;
  subgenre?: string;
  synopsis?: string;
  keywords?: string[];
  targetAudience?: string;
  mood?: string[];
  themes?: string[];
  setting?: string;
  timeperiod?: string;
}

export interface VisualElement {
  type: 'symbol' | 'texture' | 'color' | 'typography' | 'composition' | 'imagery';
  value: string;
  confidence: number;
  source?: 'trend' | 'classic' | 'innovative';
}

export interface MarketInsight {
  topCompetitors: CoverAnalysis[];
  saturatedElements: string[];
  differentiationOpportunities: string[];
  trendingStyles: string[];
  marketGap?: string;
}

export interface CoverAnalysis {
  url?: string;
  title: string;
  visualElements: VisualElement[];
  colorPalette: string[];
  typography: TypographyAnalysis;
  composition: CompositionAnalysis;
  performance?: {
    salesRank?: number;
    rating?: number;
    reviews?: number;
  };
}

export interface TypographyAnalysis {
  primaryFont?: string;
  fontStyle: 'serif' | 'sans-serif' | 'script' | 'display';
  weight: 'light' | 'regular' | 'bold' | 'heavy';
  treatment?: string[];
}

export interface CompositionAnalysis {
  layout: 'centered' | 'rule-of-thirds' | 'asymmetric' | 'grid';
  focal: 'typography' | 'imagery' | 'balanced';
  negativeSpace: 'minimal' | 'moderate' | 'dense';
  depth: 'flat' | 'layered' | 'dimensional';
}

export interface EngineOutput {
  engine: string;
  strategy: string;
  visualElements: VisualElement[];
  colorPalette: string[];
  typography: TypographyAnalysis;
  composition: CompositionAnalysis;
  reasoning: string[];
  marketPosition: 'conform' | 'differentiate' | 'hybrid';
  confidence: number;
}

export abstract class BaseEngine {
  name: string;
  description: string;
  strengths: string[];

  constructor(name: string, description: string, strengths: string[]) {
    this.name = name;
    this.description = description;
    this.strengths = strengths;
  }

  abstract async analyze(metadata: BookMetadata, marketInsight?: MarketInsight): Promise<EngineOutput>;

  abstract calculateSuitability(metadata: BookMetadata): number;

  protected async extractCoreThemes(metadata: BookMetadata): Promise<string[]> {
    const themes = metadata.themes || [];

    if (metadata.synopsis) {
      const extractedThemes = await this.analyzeText(metadata.synopsis);
      themes.push(...extractedThemes);
    }

    return [...new Set(themes)];
  }

  protected async analyzeText(text: string): Promise<string[]> {
    const themes: string[] = [];

    const themePatterns = {
      'identity': /identity|self|becoming|transformation/gi,
      'power': /power|control|authority|dominance/gi,
      'love': /love|romance|passion|heart/gi,
      'survival': /survival|survive|struggle|fight/gi,
      'mystery': /mystery|secret|hidden|unknown/gi,
      'redemption': /redemption|forgive|second chance/gi,
      'isolation': /alone|isolated|solitary|loneliness/gi,
      'corruption': /corrupt|decay|fallen|twisted/gi,
      'discovery': /discover|explore|journey|quest/gi,
      'sacrifice': /sacrifice|loss|give up|cost/gi
    };

    for (const [theme, pattern] of Object.entries(themePatterns)) {
      if (pattern.test(text)) {
        themes.push(theme);
      }
    }

    return themes;
  }

  protected generateColorPalette(mood: string[], genre?: string): string[] {
    const moodColors: Record<string, string[]> = {
      'dark': ['#1a1a1a', '#2c2c2c', '#8b0000'],
      'mysterious': ['#2e1a47', '#1a0033', '#4a0080'],
      'romantic': ['#ff69b4', '#ff1493', '#c71585'],
      'adventurous': ['#ff6b35', '#f77f00', '#fcbf49'],
      'serene': ['#87ceeb', '#b0e0e6', '#add8e6'],
      'tense': ['#dc143c', '#ff0000', '#8b0000'],
      'nostalgic': ['#d2b48c', '#daa520', '#cd853f'],
      'hopeful': ['#90ee90', '#98fb98', '#00fa9a']
    };

    const genreColors: Record<string, string[]> = {
      'thriller': ['#000000', '#dc143c', '#ffffff'],
      'romance': ['#ff69b4', '#ffffff', '#ffc0cb'],
      'fantasy': ['#4b0082', '#9400d3', '#ffd700'],
      'scifi': ['#00ffff', '#0000ff', '#c0c0c0'],
      'horror': ['#000000', '#8b0000', '#696969'],
      'literary': ['#f5f5dc', '#8b4513', '#deb887']
    };

    let palette: string[] = [];

    if (mood && mood.length > 0) {
      mood.forEach(m => {
        if (moodColors[m]) {
          palette.push(...moodColors[m]);
        }
      });
    }

    if (genre && genreColors[genre.toLowerCase()]) {
      palette.push(...genreColors[genre.toLowerCase()]);
    }

    if (palette.length === 0) {
      palette = ['#000000', '#ffffff', '#808080'];
    }

    return [...new Set(palette)].slice(0, 5);
  }
}