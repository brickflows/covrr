import { CoverAnalysis, MarketInsight, VisualElement } from './base-engine';

interface BookData {
  title: string;
  author: string;
  coverUrl?: string;
  salesRank?: number;
  rating?: number;
  reviews?: number;
  genre?: string;
  publicationDate?: Date;
}

interface TrendAnalysis {
  emergingStyles: string[];
  decliningStyles: string[];
  stableClassics: string[];
  seasonalTrends: string[];
}

export class MarketIntelligenceSystem {
  private coverCache: Map<string, CoverAnalysis>;
  private trendHistory: TrendAnalysis[];

  constructor() {
    this.coverCache = new Map();
    this.trendHistory = [];
  }

  async analyzeMarket(genre: string, subgenre?: string): Promise<MarketInsight> {
    const competitors = await this.fetchTopCompetitors(genre, subgenre);

    const coverAnalyses = await Promise.all(
      competitors.map(book => this.analyzeCover(book))
    );

    const saturatedElements = this.identifySaturatedElements(coverAnalyses);
    const opportunities = this.identifyDifferentiationOpportunities(coverAnalyses, genre);
    const trends = this.analyzeTrends(coverAnalyses);
    const marketGap = this.findMarketGap(coverAnalyses, genre);

    return {
      topCompetitors: coverAnalyses,
      saturatedElements,
      differentiationOpportunities: opportunities,
      trendingStyles: trends.emergingStyles,
      marketGap
    };
  }

  private async fetchTopCompetitors(genre: string, subgenre?: string): Promise<BookData[]> {
    const mockData: BookData[] = [
      {
        title: "Shadow's Edge",
        author: "Brandon Night",
        salesRank: 1,
        rating: 4.5,
        reviews: 15234,
        genre: genre
      },
      {
        title: "The Last Kingdom",
        author: "Sarah Crown",
        salesRank: 2,
        rating: 4.7,
        reviews: 12456,
        genre: genre
      },
      {
        title: "Crimson Throne",
        author: "Marcus Vale",
        salesRank: 3,
        rating: 4.3,
        reviews: 9876,
        genre: genre
      }
    ];

    return mockData;
  }

  private async analyzeCover(book: BookData): Promise<CoverAnalysis> {
    const cached = this.coverCache.get(book.title);
    if (cached) return cached;

    const visualElements = this.extractVisualElements(book);
    const colorPalette = this.extractColorPalette(book);
    const typography = this.analyzeTypography(book);
    const composition = this.analyzeComposition(book);

    const analysis: CoverAnalysis = {
      title: book.title,
      url: book.coverUrl,
      visualElements,
      colorPalette,
      typography,
      composition,
      performance: {
        salesRank: book.salesRank,
        rating: book.rating,
        reviews: book.reviews
      }
    };

    this.coverCache.set(book.title, analysis);
    return analysis;
  }

  private extractVisualElements(book: BookData): VisualElement[] {
    const elements: VisualElement[] = [];

    const genreElements: Record<string, string[]> = {
      'fantasy': ['sword', 'dragon', 'castle', 'magic', 'forest'],
      'thriller': ['silhouette', 'city', 'gun', 'shadow', 'running'],
      'romance': ['couple', 'sunset', 'flowers', 'embrace', 'heart'],
      'scifi': ['spaceship', 'planet', 'technology', 'stars', 'robot'],
      'horror': ['blood', 'darkness', 'monster', 'haunted', 'fear']
    };

    const genre = book.genre?.toLowerCase() || 'general';
    const possibleElements = genreElements[genre] || ['abstract', 'texture'];

    const selectedElements = this.selectRandomElements(possibleElements, 3);

    selectedElements.forEach(element => {
      elements.push({
        type: 'imagery',
        value: element,
        confidence: Math.random() * 0.4 + 0.6,
        source: 'trend'
      });
    });

    return elements;
  }

  private extractColorPalette(book: BookData): string[] {
    const genrePalettes: Record<string, string[][]> = {
      'fantasy': [
        ['#1a1a2e', '#16213e', '#0f3460', '#e94560'],
        ['#2d132c', '#801336', '#c72c41', '#ee4540'],
        ['#222831', '#393e46', '#00adb5', '#eeeeee']
      ],
      'thriller': [
        ['#000000', '#14213d', '#fca311', '#e5e5e5'],
        ['#0d1b2a', '#1b263b', '#415a77', '#778da9'],
        ['#03071e', '#370617', '#6a040f', '#dc2f02']
      ],
      'romance': [
        ['#ffccd5', '#ffb3c1', '#ff8fab', '#ff4d6d'],
        ['#f72585', '#b5179e', '#7209b7', '#560bad'],
        ['#f9dcc4', '#f8edeb', '#fec89a', '#ffd7ba']
      ],
      'scifi': [
        ['#03045e', '#0077b6', '#00b4d8', '#90e0ef'],
        ['#001d3d', '#003566', '#ffc300', '#ffd60a'],
        ['#0d1321', '#1d2d44', '#3e5c76', '#748cab']
      ],
      'horror': [
        ['#000000', '#14213d', '#fca311', '#e5e5e5'],
        ['#0b090a', '#161a1d', '#660708', '#ba181b'],
        ['#10002b', '#240046', '#3c096c', '#5a189a']
      ]
    };

    const genre = book.genre?.toLowerCase() || 'general';
    const palettes = genrePalettes[genre] || [['#000000', '#ffffff', '#808080']];

    return palettes[Math.floor(Math.random() * palettes.length)];
  }

  private analyzeTypography(book: BookData): any {
    const typographyStyles = [
      { fontStyle: 'serif', weight: 'bold', treatment: ['embossed'] },
      { fontStyle: 'sans-serif', weight: 'regular', treatment: ['clean'] },
      { fontStyle: 'display', weight: 'heavy', treatment: ['textured'] },
      { fontStyle: 'script', weight: 'light', treatment: ['elegant'] }
    ];

    return typographyStyles[Math.floor(Math.random() * typographyStyles.length)];
  }

  private analyzeComposition(book: BookData): any {
    const compositions = [
      { layout: 'centered', focal: 'typography', negativeSpace: 'minimal', depth: 'flat' },
      { layout: 'rule-of-thirds', focal: 'imagery', negativeSpace: 'moderate', depth: 'layered' },
      { layout: 'asymmetric', focal: 'balanced', negativeSpace: 'dense', depth: 'dimensional' },
      { layout: 'grid', focal: 'typography', negativeSpace: 'moderate', depth: 'flat' }
    ];

    return compositions[Math.floor(Math.random() * compositions.length)];
  }

  private identifySaturatedElements(analyses: CoverAnalysis[]): string[] {
    const elementCounts = new Map<string, number>();

    analyses.forEach(analysis => {
      analysis.visualElements.forEach(element => {
        const count = elementCounts.get(element.value) || 0;
        elementCounts.set(element.value, count + 1);
      });
    });

    const saturated: string[] = [];
    const threshold = analyses.length * 0.6;

    elementCounts.forEach((count, element) => {
      if (count >= threshold) {
        saturated.push(element);
      }
    });

    return saturated;
  }

  private identifyDifferentiationOpportunities(analyses: CoverAnalysis[], genre: string): string[] {
    const opportunities: string[] = [];

    const underutilizedElements: Record<string, string[]> = {
      'fantasy': ['geometric_patterns', 'minimal_symbols', 'negative_space_art'],
      'thriller': ['abstract_danger', 'psychological_symbols', 'distorted_reality'],
      'romance': ['architectural_romance', 'seasonal_metaphors', 'artistic_typography'],
      'scifi': ['organic_tech', 'retro_futurism', 'mathematical_beauty'],
      'horror': ['subtle_unease', 'daylight_horror', 'beautiful_terror']
    };

    const genreOpportunities = underutilizedElements[genre.toLowerCase()] || ['unique_perspective', 'hybrid_style'];

    const usedElements = new Set<string>();
    analyses.forEach(analysis => {
      analysis.visualElements.forEach(element => {
        usedElements.add(element.value);
      });
    });

    genreOpportunities.forEach(opportunity => {
      if (!usedElements.has(opportunity)) {
        opportunities.push(opportunity);
      }
    });

    return opportunities;
  }

  private analyzeTrends(analyses: CoverAnalysis[]): TrendAnalysis {
    const recentStyles = analyses.slice(0, 5).flatMap(a =>
      a.visualElements.map(e => e.value)
    );

    const olderStyles = analyses.slice(-5).flatMap(a =>
      a.visualElements.map(e => e.value)
    );

    const emerging = recentStyles.filter(s => !olderStyles.includes(s));
    const declining = olderStyles.filter(s => !recentStyles.includes(s));
    const stable = recentStyles.filter(s => olderStyles.includes(s));

    return {
      emergingStyles: [...new Set(emerging)],
      decliningStyles: [...new Set(declining)],
      stableClassics: [...new Set(stable)],
      seasonalTrends: []
    };
  }

  private findMarketGap(analyses: CoverAnalysis[], genre: string): string | undefined {
    const existingStyles = new Set<string>();

    analyses.forEach(analysis => {
      if (analysis.composition) {
        existingStyles.add(analysis.composition.focal);
        existingStyles.add(analysis.composition.layout);
      }
    });

    const potentialGaps: Record<string, string[]> = {
      'fantasy': ['urban_fantasy_noir', 'mythological_minimalism', 'cosmic_fantasy'],
      'thriller': ['quiet_menace', 'daylight_thriller', 'abstract_tension'],
      'romance': ['geometric_love', 'architectural_romance', 'seasonal_romance'],
      'scifi': ['organic_futures', 'solarpunk', 'quantum_aesthetics'],
      'horror': ['beautiful_horror', 'liminal_spaces', 'uncanny_valley']
    };

    const gaps = potentialGaps[genre.toLowerCase()] || [];

    for (const gap of gaps) {
      if (!existingStyles.has(gap)) {
        return gap;
      }
    }

    return undefined;
  }

  private selectRandomElements(array: string[], count: number): string[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, array.length));
  }

  async getAmazonTrends(category: string): Promise<BookData[]> {
    console.log(`Fetching Amazon trends for ${category}...`);
    return [];
  }

  async getGoodreadsTrends(genre: string): Promise<BookData[]> {
    console.log(`Fetching Goodreads trends for ${genre}...`);
    return [];
  }

  async getAwardWinningDesigns(year: number): Promise<CoverAnalysis[]> {
    console.log(`Fetching award-winning designs from ${year}...`);
    return [];
  }

  analyzeCoverSimilarity(cover1: CoverAnalysis, cover2: CoverAnalysis): number {
    let similarity = 0;
    let comparisons = 0;

    const sharedElements = cover1.visualElements.filter(e1 =>
      cover2.visualElements.some(e2 => e2.value === e1.value)
    );
    similarity += sharedElements.length / Math.max(cover1.visualElements.length, cover2.visualElements.length);
    comparisons++;

    const sharedColors = cover1.colorPalette.filter(c1 =>
      cover2.colorPalette.some(c2 => this.colorsAreSimilar(c1, c2))
    );
    similarity += sharedColors.length / Math.max(cover1.colorPalette.length, cover2.colorPalette.length);
    comparisons++;

    if (cover1.typography.fontStyle === cover2.typography.fontStyle) {
      similarity += 0.25;
    }
    if (cover1.composition.layout === cover2.composition.layout) {
      similarity += 0.25;
    }
    comparisons++;

    return similarity / comparisons;
  }

  private colorsAreSimilar(color1: string, color2: string): boolean {
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');

    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);

    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);

    const distance = Math.sqrt(
      Math.pow(r2 - r1, 2) +
      Math.pow(g2 - g1, 2) +
      Math.pow(b2 - b1, 2)
    );

    return distance < 50;
  }
}