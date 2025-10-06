import { BaseEngine, BookMetadata, MarketInsight, EngineOutput, VisualElement } from './base-engine';

interface GenreTrope {
  name: string;
  visualSignifiers: string[];
  frequency: number;
  effectiveness: number;
}

interface GenreConventions {
  primaryTropes: GenreTrope[];
  archetypes: string[];
  commonSymbols: string[];
  colorConventions: string[];
  typographyStyle: string[];
}

export class SemioticEngine extends BaseEngine {
  private genreDatabase: Map<string, GenreConventions>;
  private tropeToVisualMap: Map<string, string[]>;

  constructor() {
    super(
      'Semiotic Engine',
      'Decodes genre conventions and translates narrative elements into visual language',
      ['genre recognition', 'trope mapping', 'symbolic translation', 'market awareness']
    );

    this.genreDatabase = this.initializeGenreDatabase();
    this.tropeToVisualMap = this.initializeTropeMap();
  }

  private initializeGenreDatabase(): Map<string, GenreConventions> {
    const db = new Map<string, GenreConventions>();

    db.set('fantasy', {
      primaryTropes: [
        { name: 'chosen_one', visualSignifiers: ['glowing_figure', 'crown', 'sword'], frequency: 0.7, effectiveness: 0.6 },
        { name: 'magic_system', visualSignifiers: ['runes', 'crystals', 'energy'], frequency: 0.8, effectiveness: 0.8 },
        { name: 'quest', visualSignifiers: ['path', 'mountain', 'journey'], frequency: 0.6, effectiveness: 0.7 }
      ],
      archetypes: ['hero', 'mentor', 'shadow', 'herald'],
      commonSymbols: ['dragon', 'castle', 'forest', 'magic_circle', 'portal'],
      colorConventions: ['#4b0082', '#ffd700', '#2e8b57', '#8b4513'],
      typographyStyle: ['ornamental', 'celtic', 'medieval', 'mystical']
    });

    db.set('thriller', {
      primaryTropes: [
        { name: 'pursuit', visualSignifiers: ['running_figure', 'shadows', 'motion_blur'], frequency: 0.8, effectiveness: 0.7 },
        { name: 'conspiracy', visualSignifiers: ['web', 'eyes', 'fragments'], frequency: 0.6, effectiveness: 0.8 },
        { name: 'time_pressure', visualSignifiers: ['clock', 'countdown', 'urgency'], frequency: 0.7, effectiveness: 0.9 }
      ],
      archetypes: ['hunter', 'prey', 'mastermind', 'witness'],
      commonSymbols: ['crosshair', 'silhouette', 'city_skyline', 'broken_glass'],
      colorConventions: ['#000000', '#dc143c', '#ffffff', '#696969'],
      typographyStyle: ['bold', 'condensed', 'impact', 'stencil']
    });

    db.set('romance', {
      primaryTropes: [
        { name: 'forbidden_love', visualSignifiers: ['barrier', 'reaching_hands', 'distance'], frequency: 0.5, effectiveness: 0.8 },
        { name: 'soulmates', visualSignifiers: ['intertwined', 'hearts', 'connection'], frequency: 0.7, effectiveness: 0.6 },
        { name: 'second_chance', visualSignifiers: ['sunrise', 'renewal', 'circle'], frequency: 0.4, effectiveness: 0.7 }
      ],
      archetypes: ['lover', 'rival', 'confidant', 'obstacle'],
      commonSymbols: ['roses', 'silhouettes', 'sunset', 'embrace', 'letters'],
      colorConventions: ['#ff69b4', '#ff1493', '#ffc0cb', '#ffffff'],
      typographyStyle: ['script', 'elegant', 'flowing', 'romantic']
    });

    db.set('scifi', {
      primaryTropes: [
        { name: 'dystopia', visualSignifiers: ['cityscape', 'surveillance', 'decay'], frequency: 0.6, effectiveness: 0.7 },
        { name: 'ai_consciousness', visualSignifiers: ['circuits', 'eyes', 'binary'], frequency: 0.5, effectiveness: 0.8 },
        { name: 'space_exploration', visualSignifiers: ['stars', 'ship', 'planet'], frequency: 0.7, effectiveness: 0.7 }
      ],
      archetypes: ['explorer', 'ai', 'rebel', 'corporation'],
      commonSymbols: ['spaceship', 'robot', 'dna', 'circuit', 'portal'],
      colorConventions: ['#00ffff', '#0000ff', '#c0c0c0', '#000000'],
      typographyStyle: ['futuristic', 'tech', 'minimal', 'geometric']
    });

    db.set('horror', {
      primaryTropes: [
        { name: 'haunting', visualSignifiers: ['shadows', 'house', 'apparition'], frequency: 0.7, effectiveness: 0.8 },
        { name: 'monster', visualSignifiers: ['eyes', 'claws', 'teeth'], frequency: 0.6, effectiveness: 0.7 },
        { name: 'isolation', visualSignifiers: ['alone', 'darkness', 'void'], frequency: 0.8, effectiveness: 0.9 }
      ],
      archetypes: ['victim', 'monster', 'survivor', 'investigator'],
      commonSymbols: ['blood', 'skull', 'forest', 'door', 'mirror'],
      colorConventions: ['#000000', '#8b0000', '#696969', '#ffffff'],
      typographyStyle: ['distressed', 'gothic', 'dripping', 'scratched']
    });

    db.set('literary', {
      primaryTropes: [
        { name: 'coming_of_age', visualSignifiers: ['path', 'horizon', 'growth'], frequency: 0.5, effectiveness: 0.7 },
        { name: 'identity', visualSignifiers: ['reflection', 'fragments', 'layers'], frequency: 0.6, effectiveness: 0.8 },
        { name: 'memory', visualSignifiers: ['blur', 'vintage', 'palimpsest'], frequency: 0.4, effectiveness: 0.9 }
      ],
      archetypes: ['observer', 'outsider', 'mentor', 'society'],
      commonSymbols: ['tree', 'bird', 'window', 'book', 'water'],
      colorConventions: ['#f5f5dc', '#8b4513', '#deb887', '#2f4f4f'],
      typographyStyle: ['serif', 'classic', 'understated', 'literary']
    });

    return db;
  }

  private initializeTropeMap(): Map<string, string[]> {
    const map = new Map<string, string[]>();

    map.set('forbidden_love', ['fence', 'wall', 'hands_reaching', 'silhouettes_apart', 'thorns']);
    map.set('chosen_one', ['light_beam', 'crown', 'glowing_figure', 'elevated_position']);
    map.set('redemption', ['sunrise', 'phoenix', 'broken_chains', 'light_through_darkness']);
    map.set('betrayal', ['knife', 'shadow_behind', 'broken_trust', 'two_faces']);
    map.set('sacrifice', ['giving_hands', 'fading_figure', 'exchange', 'price']);
    map.set('transformation', ['butterfly', 'metamorphosis', 'before_after', 'evolution']);
    map.set('power_corruption', ['crown_crumbling', 'dark_throne', 'consuming_shadow']);
    map.set('isolation', ['single_figure', 'empty_space', 'island', 'cage']);
    map.set('duality', ['mirror', 'split_image', 'yin_yang', 'two_sides']);
    map.set('time', ['clock', 'hourglass', 'calendar', 'seasons']);

    return map;
  }

  async analyze(metadata: BookMetadata, marketInsight?: MarketInsight): Promise<EngineOutput> {
    const reasoning: string[] = [];

    const genreConventions = this.identifyGenreConventions(metadata);
    reasoning.push(`Identified primary genre: ${metadata.genre || 'general'}`);

    const extractedTropes = await this.extractTropes(metadata);
    reasoning.push(`Extracted ${extractedTropes.length} narrative tropes`);

    const visualElements = this.mapTropesToVisuals(extractedTropes, genreConventions);
    reasoning.push(`Mapped to ${visualElements.length} visual elements`);

    if (marketInsight) {
      const adjustedElements = this.adjustForMarket(visualElements, marketInsight);
      reasoning.push(`Market analysis: ${marketInsight.saturatedElements.length} saturated elements identified`);

      const strategy = this.determineMarketStrategy(marketInsight);
      reasoning.push(`Market strategy: ${strategy}`);

      return {
        engine: this.name,
        strategy: 'Genre Convention Synthesis',
        visualElements: adjustedElements,
        colorPalette: genreConventions?.colorConventions || this.generateColorPalette(metadata.mood || [], metadata.genre),
        typography: {
          fontStyle: this.selectTypographyStyle(genreConventions),
          weight: 'bold',
          treatment: ['clean', 'prominent']
        },
        composition: {
          layout: 'rule-of-thirds',
          focal: 'balanced',
          negativeSpace: 'moderate',
          depth: 'layered'
        },
        reasoning,
        marketPosition: strategy as 'conform' | 'differentiate' | 'hybrid',
        confidence: this.calculateConfidence(metadata, extractedTropes)
      };
    }

    return {
      engine: this.name,
      strategy: 'Genre Convention Synthesis',
      visualElements,
      colorPalette: genreConventions?.colorConventions || this.generateColorPalette(metadata.mood || [], metadata.genre),
      typography: {
        fontStyle: this.selectTypographyStyle(genreConventions),
        weight: 'regular',
        treatment: []
      },
      composition: {
        layout: 'centered',
        focal: 'imagery',
        negativeSpace: 'moderate',
        depth: 'layered'
      },
      reasoning,
      marketPosition: 'hybrid',
      confidence: this.calculateConfidence(metadata, extractedTropes)
    };
  }

  private identifyGenreConventions(metadata: BookMetadata): GenreConventions | undefined {
    if (!metadata.genre) return undefined;

    const normalizedGenre = metadata.genre.toLowerCase();
    for (const [key, conventions] of this.genreDatabase.entries()) {
      if (normalizedGenre.includes(key)) {
        return conventions;
      }
    }

    return this.genreDatabase.get('literary');
  }

  private async extractTropes(metadata: BookMetadata): Promise<string[]> {
    const tropes: string[] = [];

    const themes = await this.extractCoreThemes(metadata);
    tropes.push(...themes);

    if (metadata.synopsis) {
      const synopsisTropes = this.analyzeSynopsisForTropes(metadata.synopsis);
      tropes.push(...synopsisTropes);
    }

    return [...new Set(tropes)];
  }

  private analyzeSynopsisForTropes(synopsis: string): string[] {
    const tropes: string[] = [];
    const lowerSynopsis = synopsis.toLowerCase();

    const tropePatterns = {
      'forbidden_love': /forbidden|secret love|can't be together|star-crossed/gi,
      'chosen_one': /chosen|destiny|prophecy|special|only one who/gi,
      'redemption': /redemption|second chance|make amends|forgiveness/gi,
      'betrayal': /betray|backstab|trust broken|deception/gi,
      'sacrifice': /sacrifice|give up everything|ultimate price/gi,
      'transformation': /transform|change|become|evolve/gi,
      'mentor': /mentor|teacher|guide|wise|master/gi,
      'revenge': /revenge|vengeance|payback|retribution/gi
    };

    for (const [trope, pattern] of Object.entries(tropePatterns)) {
      if (pattern.test(lowerSynopsis)) {
        tropes.push(trope);
      }
    }

    return tropes;
  }

  private mapTropesToVisuals(tropes: string[], conventions?: GenreConventions): VisualElement[] {
    const visuals: VisualElement[] = [];

    tropes.forEach(trope => {
      const visualSignifiers = this.tropeToVisualMap.get(trope);
      if (visualSignifiers) {
        visualSignifiers.forEach(signifier => {
          visuals.push({
            type: 'symbol',
            value: signifier,
            confidence: 0.7,
            source: 'classic'
          });
        });
      }
    });

    if (conventions) {
      conventions.commonSymbols.forEach(symbol => {
        visuals.push({
          type: 'symbol',
          value: symbol,
          confidence: 0.8,
          source: 'classic'
        });
      });
    }

    return visuals;
  }

  private adjustForMarket(elements: VisualElement[], insight: MarketInsight): VisualElement[] {
    const adjusted = [...elements];

    insight.saturatedElements.forEach(saturated => {
      const index = adjusted.findIndex(e => e.value === saturated);
      if (index !== -1) {
        adjusted[index].confidence *= 0.5;
        adjusted[index].source = 'trend';
      }
    });

    insight.differentiationOpportunities.forEach(opportunity => {
      adjusted.push({
        type: 'symbol',
        value: opportunity,
        confidence: 0.9,
        source: 'innovative'
      });
    });

    return adjusted.sort((a, b) => b.confidence - a.confidence).slice(0, 8);
  }

  private determineMarketStrategy(insight: MarketInsight): string {
    const saturationRatio = insight.saturatedElements.length / (insight.topCompetitors.length || 1);

    if (saturationRatio > 0.7) {
      return 'differentiate';
    } else if (saturationRatio < 0.3) {
      return 'conform';
    }
    return 'hybrid';
  }

  private selectTypographyStyle(conventions?: GenreConventions): 'serif' | 'sans-serif' | 'script' | 'display' {
    if (!conventions) return 'serif';

    const style = conventions.typographyStyle[0];
    if (style.includes('script') || style.includes('flowing')) return 'script';
    if (style.includes('bold') || style.includes('impact')) return 'display';
    if (style.includes('minimal') || style.includes('tech')) return 'sans-serif';
    return 'serif';
  }

  private calculateConfidence(metadata: BookMetadata, tropes: string[]): number {
    let confidence = 0.5;

    if (metadata.genre) confidence += 0.2;
    if (metadata.synopsis && metadata.synopsis.length > 100) confidence += 0.1;
    if (tropes.length > 3) confidence += 0.1;
    if (metadata.themes && metadata.themes.length > 0) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  calculateSuitability(metadata: BookMetadata): number {
    let score = 0;

    if (metadata.genre && this.genreDatabase.has(metadata.genre.toLowerCase())) {
      score += 0.4;
    }

    if (metadata.synopsis && metadata.synopsis.length > 50) {
      score += 0.3;
    }

    if (metadata.themes && metadata.themes.length > 0) {
      score += 0.2;
    }

    if (metadata.keywords && metadata.keywords.length > 2) {
      score += 0.1;
    }

    return score;
  }
}