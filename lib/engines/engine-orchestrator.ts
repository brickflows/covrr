import { BaseEngine, BookMetadata, MarketInsight, EngineOutput } from './base-engine';
import { SemioticEngine } from './semiotic-engine';
import { AffectiveCompositionEngine } from './affective-engine';
import { MarketIntelligenceSystem } from './market-intelligence';

interface EngineScore {
  engine: BaseEngine;
  suitability: number;
  reasoning: string;
}

interface OrchestrationResult {
  selectedEngine: string;
  outputs: EngineOutput[];
  marketInsight: MarketInsight;
  recommendation: {
    primary: EngineOutput;
    alternatives: EngineOutput[];
    reasoning: string[];
  };
}

export class EngineOrchestrator {
  private engines: Map<string, BaseEngine>;
  private marketIntelligence: MarketIntelligenceSystem;

  constructor() {
    this.engines = new Map();
    this.marketIntelligence = new MarketIntelligenceSystem();

    this.registerEngine(new SemioticEngine());
    this.registerEngine(new AffectiveCompositionEngine());
  }

  private registerEngine(engine: BaseEngine): void {
    this.engines.set(engine.name, engine);
  }

  async orchestrate(metadata: BookMetadata): Promise<OrchestrationResult> {
    const enrichedMetadata = await this.enrichMetadata(metadata);

    const marketInsight = await this.marketIntelligence.analyzeMarket(
      enrichedMetadata.genre || 'general',
      enrichedMetadata.subgenre
    );

    const engineScores = await this.scoreEngines(enrichedMetadata);

    const sortedEngines = engineScores.sort((a, b) => b.suitability - a.suitability);

    const topEngines = sortedEngines.slice(0, 3);

    const outputs = await Promise.all(
      topEngines.map(score =>
        score.engine.analyze(enrichedMetadata, marketInsight)
      )
    );

    const recommendation = this.createRecommendation(outputs, marketInsight, topEngines);

    return {
      selectedEngine: topEngines[0].engine.name,
      outputs,
      marketInsight,
      recommendation
    };
  }

  private async enrichMetadata(metadata: BookMetadata): Promise<BookMetadata> {
    const enriched = { ...metadata };

    if (!enriched.genre && enriched.keywords) {
      enriched.genre = this.inferGenreFromKeywords(enriched.keywords);
    }

    if (!enriched.mood && enriched.synopsis) {
      enriched.mood = this.inferMoodFromSynopsis(enriched.synopsis);
    }

    if (!enriched.themes && enriched.synopsis) {
      enriched.themes = this.extractThemesFromSynopsis(enriched.synopsis);
    }

    return enriched;
  }

  private inferGenreFromKeywords(keywords: string[]): string {
    const genreKeywords: Record<string, string[]> = {
      'fantasy': ['magic', 'dragon', 'wizard', 'quest', 'realm', 'spell'],
      'thriller': ['murder', 'detective', 'conspiracy', 'danger', 'chase', 'secret'],
      'romance': ['love', 'heart', 'kiss', 'relationship', 'passion', 'wedding'],
      'scifi': ['space', 'future', 'robot', 'alien', 'technology', 'dystopia'],
      'horror': ['ghost', 'haunted', 'terror', 'nightmare', 'demon', 'scary'],
      'literary': ['life', 'journey', 'family', 'memory', 'identity', 'society']
    };

    let bestMatch = 'general';
    let bestScore = 0;

    for (const [genre, genreWords] of Object.entries(genreKeywords)) {
      const score = keywords.filter(k =>
        genreWords.some(gw => k.toLowerCase().includes(gw))
      ).length;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = genre;
      }
    }

    return bestMatch;
  }

  private inferMoodFromSynopsis(synopsis: string): string[] {
    const moods: string[] = [];
    const lowerSynopsis = synopsis.toLowerCase();

    const moodPatterns = {
      'dark': /dark|shadow|grim|bleak/gi,
      'mysterious': /mystery|secret|hidden|unknown/gi,
      'romantic': /love|romance|passion|heart/gi,
      'adventurous': /adventure|journey|quest|explore/gi,
      'tense': /tension|danger|threat|urgent/gi,
      'nostalgic': /memory|past|remember|childhood/gi,
      'hopeful': /hope|dream|future|possibility/gi
    };

    for (const [mood, pattern] of Object.entries(moodPatterns)) {
      if (pattern.test(lowerSynopsis)) {
        moods.push(mood);
      }
    }

    return moods.length > 0 ? moods : ['mysterious'];
  }

  private extractThemesFromSynopsis(synopsis: string): string[] {
    const themes: string[] = [];
    const lowerSynopsis = synopsis.toLowerCase();

    const themePatterns = {
      'identity': /identity|self|who.*am|finding.*yourself/gi,
      'power': /power|control|authority|rule/gi,
      'love': /love|romance|relationship|heart/gi,
      'survival': /survive|survival|struggle|fight/gi,
      'redemption': /redemption|forgive|second chance|atone/gi,
      'family': /family|parent|child|sibling|mother|father/gi,
      'friendship': /friend|companion|ally|together/gi,
      'betrayal': /betray|deceive|lie|trust/gi,
      'justice': /justice|right|wrong|fair|law/gi,
      'freedom': /freedom|free|escape|liberation/gi
    };

    for (const [theme, pattern] of Object.entries(themePatterns)) {
      if (pattern.test(lowerSynopsis)) {
        themes.push(theme);
      }
    }

    return themes;
  }

  private async scoreEngines(metadata: BookMetadata): Promise<EngineScore[]> {
    const scores: EngineScore[] = [];

    for (const [name, engine] of this.engines.entries()) {
      const suitability = engine.calculateSuitability(metadata);
      const reasoning = this.generateSuitabilityReasoning(engine, metadata, suitability);

      scores.push({
        engine,
        suitability,
        reasoning
      });
    }

    return scores;
  }

  private generateSuitabilityReasoning(engine: BaseEngine, metadata: BookMetadata, score: number): string {
    const reasons: string[] = [];

    if (engine.name === 'Semiotic Engine') {
      if (metadata.genre) reasons.push('Clear genre identification');
      if (metadata.themes && metadata.themes.length > 2) reasons.push('Rich thematic content');
      if (score > 0.7) reasons.push('Strong pattern matching potential');
    } else if (engine.name === 'Affective Composition Engine') {
      if (metadata.mood && metadata.mood.length > 0) reasons.push('Defined emotional targets');
      if (metadata.themes?.includes('identity') || metadata.themes?.includes('psychology')) {
        reasons.push('Psychological themes present');
      }
      if (score > 0.7) reasons.push('High emotional resonance potential');
    }

    return reasons.join('; ');
  }

  private createRecommendation(
    outputs: EngineOutput[],
    marketInsight: MarketInsight,
    engineScores: EngineScore[]
  ): any {
    const reasoning: string[] = [];

    const primary = outputs[0];
    const alternatives = outputs.slice(1);

    reasoning.push(`Primary engine selected: ${primary.engine} (suitability: ${engineScores[0].suitability.toFixed(2)})`);

    if (marketInsight.saturatedElements.length > 5) {
      reasoning.push(`Market shows high saturation - recommending differentiation strategy`);
    } else {
      reasoning.push(`Market has room for conventional approaches - hybrid strategy viable`);
    }

    if (marketInsight.marketGap) {
      reasoning.push(`Identified market gap: ${marketInsight.marketGap} - consider exploiting`);
    }

    const similarityScores = this.calculateOutputSimilarity(outputs);
    if (similarityScores.average < 0.5) {
      reasoning.push(`Engines produced diverse outputs - consider A/B testing`);
    } else {
      reasoning.push(`Engines converged on similar solutions - high confidence in direction`);
    }

    return {
      primary,
      alternatives,
      reasoning
    };
  }

  private calculateOutputSimilarity(outputs: EngineOutput[]): { average: number; pairs: number[][] } {
    const pairs: number[][] = [];
    let total = 0;
    let count = 0;

    for (let i = 0; i < outputs.length; i++) {
      for (let j = i + 1; j < outputs.length; j++) {
        const similarity = this.compareOutputs(outputs[i], outputs[j]);
        pairs.push([i, j, similarity]);
        total += similarity;
        count++;
      }
    }

    return {
      average: count > 0 ? total / count : 0,
      pairs
    };
  }

  private compareOutputs(output1: EngineOutput, output2: EngineOutput): number {
    let similarity = 0;
    let factors = 0;

    const sharedElements = output1.visualElements.filter(e1 =>
      output2.visualElements.some(e2 => e2.value === e1.value)
    ).length;
    similarity += sharedElements / Math.max(output1.visualElements.length, output2.visualElements.length);
    factors++;

    const sharedColors = output1.colorPalette.filter(c1 =>
      output2.colorPalette.includes(c1)
    ).length;
    similarity += sharedColors / Math.max(output1.colorPalette.length, output2.colorPalette.length);
    factors++;

    if (output1.marketPosition === output2.marketPosition) {
      similarity += 0.5;
    }
    factors++;

    return similarity / factors;
  }

  async selectBestEngine(metadata: BookMetadata): Promise<string> {
    const scores = await this.scoreEngines(metadata);
    const sorted = scores.sort((a, b) => b.suitability - a.suitability);

    return sorted[0].engine.name;
  }

  async generateWithEngine(engineName: string, metadata: BookMetadata): Promise<EngineOutput | null> {
    const engine = this.engines.get(engineName);
    if (!engine) return null;

    const marketInsight = await this.marketIntelligence.analyzeMarket(
      metadata.genre || 'general',
      metadata.subgenre
    );

    return await engine.analyze(metadata, marketInsight);
  }

  getAvailableEngines(): string[] {
    return Array.from(this.engines.keys());
  }

  getEngineDescription(engineName: string): string | null {
    const engine = this.engines.get(engineName);
    return engine ? engine.description : null;
  }
}