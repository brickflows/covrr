import { EngineOrchestrator } from './engine-orchestrator';
import { BookMetadata, EngineOutput } from './base-engine';

export interface GenerationRequest {
  prompt?: string;
  title: string;
  author?: string;
  synopsis?: string;
  genre?: string;
  keywords?: string[];
  strategy?: 'market-conform' | 'differentiate' | 'hybrid' | 'auto';
  enginePreference?: string;
}

export interface GenerationResult {
  coverDesign: CoverDesign;
  engineUsed: string;
  marketAnalysis: MarketAnalysisResult;
  alternatives: CoverDesign[];
  confidence: number;
}

export interface CoverDesign {
  visualPrompt: string;
  colorPalette: string[];
  typography: {
    title: FontSpec;
    author?: FontSpec;
    tagline?: FontSpec;
  };
  layout: LayoutSpec;
  mood: string;
  reasoning: string[];
}

export interface FontSpec {
  family: string;
  size: string;
  weight: string;
  color: string;
  effects?: string[];
}

export interface LayoutSpec {
  template: string;
  titlePosition: Position;
  authorPosition?: Position;
  imageArea: BoundingBox;
  bleedArea?: BoundingBox;
}

export interface Position {
  x: string;
  y: string;
  align: 'left' | 'center' | 'right';
  valign: 'top' | 'middle' | 'bottom';
}

export interface BoundingBox {
  top: string;
  left: string;
  width: string;
  height: string;
}

export interface MarketAnalysisResult {
  topCompetitorStyles: string[];
  saturatedElements: string[];
  opportunities: string[];
  recommendation: string;
}

export class CoverGenerator {
  private orchestrator: EngineOrchestrator;

  constructor() {
    this.orchestrator = new EngineOrchestrator();
  }

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const metadata = this.requestToMetadata(request);

    const orchestrationResult = await this.orchestrator.orchestrate(metadata);

    const primaryOutput = orchestrationResult.recommendation.primary;
    const coverDesign = this.createCoverDesign(primaryOutput, metadata);

    const alternatives = orchestrationResult.recommendation.alternatives.map(output =>
      this.createCoverDesign(output, metadata)
    );

    const marketAnalysis = this.summarizeMarketAnalysis(orchestrationResult.marketInsight);

    return {
      coverDesign,
      engineUsed: orchestrationResult.selectedEngine,
      marketAnalysis,
      alternatives,
      confidence: primaryOutput.confidence
    };
  }

  private requestToMetadata(request: GenerationRequest): BookMetadata {
    const metadata: BookMetadata = {
      title: request.title,
      author: request.author,
      genre: request.genre,
      synopsis: request.synopsis,
      keywords: request.keywords
    };

    if (request.prompt) {
      const extracted = this.extractFromPrompt(request.prompt);
      metadata.themes = extracted.themes;
      metadata.mood = extracted.mood;
      metadata.setting = extracted.setting;
    }

    return metadata;
  }

  private extractFromPrompt(prompt: string): any {
    const themes: string[] = [];
    const mood: string[] = [];
    let setting = undefined;

    const themeKeywords = {
      'identity': ['identity', 'self', 'discovery', 'finding'],
      'love': ['love', 'romance', 'relationship', 'heart'],
      'power': ['power', 'control', 'authority', 'dominance'],
      'survival': ['survival', 'survive', 'struggle', 'endure']
    };

    const moodKeywords = {
      'dark': ['dark', 'grim', 'noir', 'shadow'],
      'mysterious': ['mystery', 'enigma', 'secret', 'hidden'],
      'hopeful': ['hope', 'bright', 'optimistic', 'uplifting'],
      'tense': ['tense', 'thriller', 'suspense', 'urgent']
    };

    const settingKeywords = {
      'urban': ['city', 'urban', 'metropolis', 'street'],
      'fantasy': ['kingdom', 'realm', 'magical', 'enchanted'],
      'space': ['space', 'galaxy', 'planet', 'stars'],
      'historical': ['historical', 'period', 'ancient', 'medieval']
    };

    const lowerPrompt = prompt.toLowerCase();

    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some(k => lowerPrompt.includes(k))) {
        themes.push(theme);
      }
    }

    for (const [moodType, keywords] of Object.entries(moodKeywords)) {
      if (keywords.some(k => lowerPrompt.includes(k))) {
        mood.push(moodType);
      }
    }

    for (const [settingType, keywords] of Object.entries(settingKeywords)) {
      if (keywords.some(k => lowerPrompt.includes(k))) {
        setting = settingType;
        break;
      }
    }

    return { themes, mood, setting };
  }

  private createCoverDesign(output: EngineOutput, metadata: BookMetadata): CoverDesign {
    const visualPrompt = this.generateVisualPrompt(output, metadata);
    const typography = this.designTypography(output, metadata);
    const layout = this.createLayout(output.composition);

    return {
      visualPrompt,
      colorPalette: output.colorPalette,
      typography,
      layout,
      mood: this.determineMood(output),
      reasoning: output.reasoning
    };
  }

  private generateVisualPrompt(output: EngineOutput, metadata: BookMetadata): string {
    const elements = output.visualElements
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
      .map(e => e.value);

    const style = output.marketPosition === 'differentiate' ? 'unique artistic' : 'professional';

    const mood = metadata.mood?.join(', ') || 'atmospheric';

    const composition = output.composition.layout;

    let prompt = `Book cover design: ${style} ${mood} composition featuring `;
    prompt += elements.join(', ');
    prompt += `. ${composition} layout with ${output.composition.negativeSpace} negative space.`;
    prompt += ` Color palette: ${output.colorPalette.join(', ')}.`;
    prompt += ` ${output.composition.depth} depth.`;

    if (metadata.genre) {
      prompt += ` Genre: ${metadata.genre}.`;
    }

    return prompt;
  }

  private designTypography(output: EngineOutput, metadata: BookMetadata): any {
    const fontFamilies: Record<string, string> = {
      'serif': 'Playfair Display, Georgia, serif',
      'sans-serif': 'Montserrat, Helvetica, sans-serif',
      'script': 'Great Vibes, Brush Script, cursive',
      'display': 'Impact, Bebas Neue, sans-serif'
    };

    const titleFont: FontSpec = {
      family: fontFamilies[output.typography.fontStyle] || fontFamilies['serif'],
      size: output.typography.weight === 'heavy' ? '48px' : '36px',
      weight: output.typography.weight === 'light' ? '300' : output.typography.weight === 'bold' ? '700' : '400',
      color: output.colorPalette[0] || '#000000',
      effects: output.typography.treatment || []
    };

    const authorFont: FontSpec = {
      family: fontFamilies[output.typography.fontStyle] || fontFamilies['serif'],
      size: '18px',
      weight: '400',
      color: output.colorPalette[1] || '#333333'
    };

    return {
      title: titleFont,
      author: authorFont
    };
  }

  private createLayout(composition: any): LayoutSpec {
    const layouts: Record<string, LayoutSpec> = {
      'centered': {
        template: 'centered',
        titlePosition: { x: '50%', y: '20%', align: 'center', valign: 'middle' },
        authorPosition: { x: '50%', y: '85%', align: 'center', valign: 'middle' },
        imageArea: { top: '0%', left: '0%', width: '100%', height: '100%' }
      },
      'rule-of-thirds': {
        template: 'thirds',
        titlePosition: { x: '33%', y: '33%', align: 'left', valign: 'top' },
        authorPosition: { x: '33%', y: '90%', align: 'left', valign: 'bottom' },
        imageArea: { top: '0%', left: '0%', width: '100%', height: '100%' }
      },
      'asymmetric': {
        template: 'asymmetric',
        titlePosition: { x: '70%', y: '25%', align: 'right', valign: 'top' },
        authorPosition: { x: '70%', y: '80%', align: 'right', valign: 'bottom' },
        imageArea: { top: '0%', left: '0%', width: '100%', height: '100%' }
      },
      'grid': {
        template: 'grid',
        titlePosition: { x: '50%', y: '25%', align: 'center', valign: 'middle' },
        authorPosition: { x: '50%', y: '75%', align: 'center', valign: 'middle' },
        imageArea: { top: '10%', left: '10%', width: '80%', height: '80%' }
      }
    };

    return layouts[composition.layout] || layouts['centered'];
  }

  private determineMood(output: EngineOutput): string {
    if (output.engine === 'Affective Composition Engine') {
      const emotionalElements = output.visualElements.filter(e =>
        ['tension', 'serenity', 'dread', 'nostalgia', 'hope'].some(emotion =>
          e.value.toLowerCase().includes(emotion)
        )
      );

      if (emotionalElements.length > 0) {
        return emotionalElements[0].value;
      }
    }

    if (output.visualElements.some(e => e.value.includes('dark'))) return 'dark';
    if (output.visualElements.some(e => e.value.includes('light'))) return 'hopeful';
    if (output.visualElements.some(e => e.value.includes('mystery'))) return 'mysterious';

    return 'atmospheric';
  }

  private summarizeMarketAnalysis(marketInsight: any): MarketAnalysisResult {
    const topStyles = marketInsight.topCompetitors
      .flatMap((c: any) => c.visualElements)
      .slice(0, 5)
      .map((e: any) => e.value);

    return {
      topCompetitorStyles: [...new Set(topStyles)],
      saturatedElements: marketInsight.saturatedElements,
      opportunities: marketInsight.differentiationOpportunities,
      recommendation: marketInsight.marketGap
        ? `Exploit market gap: ${marketInsight.marketGap}`
        : 'Consider hybrid approach balancing convention and innovation'
    };
  }

  async generateBatch(requests: GenerationRequest[]): Promise<GenerationResult[]> {
    return Promise.all(requests.map(req => this.generate(req)));
  }

  async analyzeExistingCover(coverUrl: string, metadata: BookMetadata): Promise<any> {
    console.log(`Analyzing cover at ${coverUrl}`);
    return {
      strengths: ['Strong typography', 'Clear genre signaling'],
      weaknesses: ['Oversaturated market elements'],
      suggestions: ['Consider more unique color palette', 'Experiment with negative space']
    };
  }
}