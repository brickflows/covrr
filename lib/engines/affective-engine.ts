import { BaseEngine, BookMetadata, MarketInsight, EngineOutput, VisualElement } from './base-engine';

interface EmotionalProfile {
  primary: string;
  secondary: string[];
  intensity: number;
  arc: 'rising' | 'falling' | 'steady' | 'volatile';
}

interface EmotionalDesignRules {
  colors: string[];
  composition: string;
  typography: string;
  imagery: string[];
  lighting: string;
  texture: string;
}

export class AffectiveCompositionEngine extends BaseEngine {
  private emotionToDesign: Map<string, EmotionalDesignRules>;
  private emotionHierarchy: Map<string, number>;

  constructor() {
    super(
      'Affective Composition Engine',
      'Creates covers driven by emotional impact and psychological response',
      ['emotion mapping', 'psychological design', 'mood creation', 'atmospheric composition']
    );

    this.emotionToDesign = this.initializeEmotionRules();
    this.emotionHierarchy = this.initializeEmotionHierarchy();
  }

  private initializeEmotionRules(): Map<string, EmotionalDesignRules> {
    const rules = new Map<string, EmotionalDesignRules>();

    rules.set('tension', {
      colors: ['#dc143c', '#000000', '#ff6b35', '#1a1a1a'],
      composition: 'diagonal_tension',
      typography: 'compressed_bold',
      imagery: ['sharp_angles', 'fragmented', 'unstable'],
      lighting: 'high_contrast',
      texture: 'rough'
    });

    rules.set('serenity', {
      colors: ['#87ceeb', '#e6f3ff', '#b8d8e0', '#ffffff'],
      composition: 'horizontal_calm',
      typography: 'light_flowing',
      imagery: ['soft_curves', 'open_space', 'flowing'],
      lighting: 'soft_diffused',
      texture: 'smooth'
    });

    rules.set('dread', {
      colors: ['#0d0d0d', '#2c0000', '#1a0033', '#000000'],
      composition: 'oppressive_weight',
      typography: 'distressed_heavy',
      imagery: ['looming', 'shadows', 'void'],
      lighting: 'minimal_key',
      texture: 'corroded'
    });

    rules.set('nostalgia', {
      colors: ['#d2b48c', '#f4e4c1', '#a0826d', '#e5d4a1'],
      composition: 'centered_memory',
      typography: 'vintage_serif',
      imagery: ['faded', 'layered', 'worn'],
      lighting: 'golden_hour',
      texture: 'aged_paper'
    });

    rules.set('exhilaration', {
      colors: ['#ff6b35', '#f77f00', '#fcbf49', '#eae2b7'],
      composition: 'dynamic_movement',
      typography: 'italic_energy',
      imagery: ['motion_blur', 'radiating', 'explosive'],
      lighting: 'vibrant_bright',
      texture: 'energetic'
    });

    rules.set('melancholy', {
      colors: ['#4a5568', '#718096', '#a0aec0', '#e2e8f0'],
      composition: 'descending_weight',
      typography: 'thin_elegant',
      imagery: ['solitary', 'rain', 'distance'],
      lighting: 'overcast',
      texture: 'muted'
    });

    rules.set('mystery', {
      colors: ['#2e1a47', '#1a0033', '#4a0080', '#6a0dad'],
      composition: 'obscured_reveal',
      typography: 'enigmatic',
      imagery: ['partial_reveal', 'fog', 'hidden'],
      lighting: 'selective_illumination',
      texture: 'layered'
    });

    rules.set('hope', {
      colors: ['#90ee90', '#98fb98', '#fff700', '#87ceeb'],
      composition: 'ascending_light',
      typography: 'uplifting_clean',
      imagery: ['sunrise', 'growth', 'opening'],
      lighting: 'dawn_light',
      texture: 'fresh'
    });

    return rules;
  }

  private initializeEmotionHierarchy(): Map<string, number> {
    const hierarchy = new Map<string, number>();

    hierarchy.set('dread', 10);
    hierarchy.set('tension', 9);
    hierarchy.set('mystery', 8);
    hierarchy.set('melancholy', 7);
    hierarchy.set('nostalgia', 6);
    hierarchy.set('hope', 5);
    hierarchy.set('exhilaration', 4);
    hierarchy.set('serenity', 3);

    return hierarchy;
  }

  async analyze(metadata: BookMetadata, marketInsight?: MarketInsight): Promise<EngineOutput> {
    const reasoning: string[] = [];

    const emotionalProfile = await this.extractEmotionalProfile(metadata);
    reasoning.push(`Primary emotion identified: ${emotionalProfile.primary} (intensity: ${emotionalProfile.intensity})`);

    const designRules = this.getEmotionalDesignRules(emotionalProfile);
    reasoning.push(`Emotional arc: ${emotionalProfile.arc} - adjusting composition accordingly`);

    const visualElements = this.createEmotionalVisuals(emotionalProfile, designRules);
    reasoning.push(`Generated ${visualElements.length} emotion-driven visual elements`);

    const composition = this.determineEmotionalComposition(emotionalProfile, designRules);
    const typography = this.selectEmotionalTypography(emotionalProfile, designRules);

    if (emotionalProfile.secondary.length > 0) {
      reasoning.push(`Secondary emotions: ${emotionalProfile.secondary.join(', ')} - creating layered emotional depth`);
    }

    return {
      engine: this.name,
      strategy: 'Emotion-First Design',
      visualElements,
      colorPalette: this.createEmotionalPalette(emotionalProfile, designRules),
      typography,
      composition,
      reasoning,
      marketPosition: 'differentiate',
      confidence: this.calculateEmotionalConfidence(emotionalProfile)
    };
  }

  private async extractEmotionalProfile(metadata: BookMetadata): Promise<EmotionalProfile> {
    const emotions = new Map<string, number>();

    if (metadata.mood) {
      metadata.mood.forEach(mood => {
        const emotion = this.moodToEmotion(mood);
        emotions.set(emotion, (emotions.get(emotion) || 0) + 1);
      });
    }

    if (metadata.synopsis) {
      const extractedEmotions = await this.analyzeEmotionalContent(metadata.synopsis);
      extractedEmotions.forEach(emotion => {
        emotions.set(emotion, (emotions.get(emotion) || 0) + 1);
      });
    }

    if (metadata.themes) {
      metadata.themes.forEach(theme => {
        const emotion = this.themeToEmotion(theme);
        if (emotion) {
          emotions.set(emotion, (emotions.get(emotion) || 0) + 0.5);
        }
      });
    }

    const sortedEmotions = Array.from(emotions.entries())
      .sort((a, b) => b[1] - a[1]);

    const primary = sortedEmotions[0]?.[0] || 'mystery';
    const secondary = sortedEmotions.slice(1, 3).map(e => e[0]);

    const arc = this.determineEmotionalArc(metadata);
    const intensity = Math.min(sortedEmotions[0]?.[1] || 0.5, 1.0);

    return {
      primary,
      secondary,
      intensity,
      arc
    };
  }

  private moodToEmotion(mood: string): string {
    const moodMap: Record<string, string> = {
      'dark': 'dread',
      'mysterious': 'mystery',
      'romantic': 'nostalgia',
      'adventurous': 'exhilaration',
      'serene': 'serenity',
      'tense': 'tension',
      'nostalgic': 'nostalgia',
      'hopeful': 'hope',
      'melancholic': 'melancholy'
    };

    return moodMap[mood.toLowerCase()] || 'mystery';
  }

  private themeToEmotion(theme: string): string | null {
    const themeMap: Record<string, string> = {
      'identity': 'mystery',
      'power': 'tension',
      'love': 'nostalgia',
      'survival': 'tension',
      'mystery': 'mystery',
      'redemption': 'hope',
      'isolation': 'melancholy',
      'corruption': 'dread',
      'discovery': 'exhilaration',
      'sacrifice': 'melancholy'
    };

    return themeMap[theme.toLowerCase()] || null;
  }

  private async analyzeEmotionalContent(text: string): Promise<string[]> {
    const emotions: string[] = [];

    const emotionalPatterns = {
      'tension': /tense|pressure|urgent|race against|countdown/gi,
      'dread': /dread|fear|terror|nightmare|horrifying/gi,
      'hope': /hope|dream|possibility|future|light/gi,
      'nostalgia': /remember|past|memory|once|used to/gi,
      'mystery': /secret|hidden|unknown|enigma|puzzle/gi,
      'melancholy': /sad|loss|grief|sorrow|lonely/gi,
      'exhilaration': /exciting|thrilling|adventure|rush|energy/gi,
      'serenity': /peaceful|calm|tranquil|serene|quiet/gi
    };

    for (const [emotion, pattern] of Object.entries(emotionalPatterns)) {
      if (pattern.test(text)) {
        emotions.push(emotion);
      }
    }

    return emotions;
  }

  private determineEmotionalArc(metadata: BookMetadata): 'rising' | 'falling' | 'steady' | 'volatile' {
    if (metadata.genre?.toLowerCase().includes('thriller')) return 'rising';
    if (metadata.genre?.toLowerCase().includes('literary')) return 'steady';
    if (metadata.genre?.toLowerCase().includes('horror')) return 'volatile';
    if (metadata.themes?.includes('redemption')) return 'rising';
    if (metadata.themes?.includes('tragedy')) return 'falling';

    return 'steady';
  }

  private getEmotionalDesignRules(profile: EmotionalProfile): EmotionalDesignRules {
    const primaryRules = this.emotionToDesign.get(profile.primary);

    if (!primaryRules) {
      return this.emotionToDesign.get('mystery')!;
    }

    if (profile.secondary.length > 0) {
      const secondaryRules = this.emotionToDesign.get(profile.secondary[0]);
      if (secondaryRules) {
        return this.blendEmotionalRules(primaryRules, secondaryRules, 0.7);
      }
    }

    return primaryRules;
  }

  private blendEmotionalRules(primary: EmotionalDesignRules, secondary: EmotionalDesignRules, ratio: number): EmotionalDesignRules {
    const primaryColors = primary.colors.slice(0, Math.ceil(primary.colors.length * ratio));
    const secondaryColors = secondary.colors.slice(0, Math.floor(secondary.colors.length * (1 - ratio)));

    return {
      colors: [...primaryColors, ...secondaryColors],
      composition: primary.composition,
      typography: primary.typography,
      imagery: [...primary.imagery.slice(0, 2), ...secondary.imagery.slice(0, 1)],
      lighting: primary.lighting,
      texture: primary.texture
    };
  }

  private createEmotionalVisuals(profile: EmotionalProfile, rules: EmotionalDesignRules): VisualElement[] {
    const visuals: VisualElement[] = [];

    rules.imagery.forEach((image, index) => {
      visuals.push({
        type: 'imagery',
        value: image,
        confidence: 0.9 - (index * 0.1),
        source: 'innovative'
      });
    });

    visuals.push({
      type: 'texture',
      value: rules.texture,
      confidence: 0.8,
      source: 'classic'
    });

    if (profile.arc === 'rising') {
      visuals.push({
        type: 'composition',
        value: 'ascending_elements',
        confidence: 0.7,
        source: 'innovative'
      });
    } else if (profile.arc === 'falling') {
      visuals.push({
        type: 'composition',
        value: 'descending_weight',
        confidence: 0.7,
        source: 'innovative'
      });
    }

    return visuals;
  }

  private createEmotionalPalette(profile: EmotionalProfile, rules: EmotionalDesignRules): string[] {
    let palette = [...rules.colors];

    if (profile.intensity > 0.8) {
      palette = palette.map(color => this.intensifyColor(color));
    } else if (profile.intensity < 0.4) {
      palette = palette.map(color => this.muteColor(color));
    }

    return palette.slice(0, 5);
  }

  private intensifyColor(color: string): string {
    return color;
  }

  private muteColor(color: string): string {
    return color + '99';
  }

  private determineEmotionalComposition(profile: EmotionalProfile, rules: EmotionalDesignRules): any {
    const compositionMap: Record<string, any> = {
      'diagonal_tension': { layout: 'asymmetric', focal: 'imagery', negativeSpace: 'minimal', depth: 'layered' },
      'horizontal_calm': { layout: 'centered', focal: 'balanced', negativeSpace: 'moderate', depth: 'flat' },
      'oppressive_weight': { layout: 'asymmetric', focal: 'imagery', negativeSpace: 'dense', depth: 'dimensional' },
      'centered_memory': { layout: 'centered', focal: 'imagery', negativeSpace: 'moderate', depth: 'layered' },
      'dynamic_movement': { layout: 'asymmetric', focal: 'imagery', negativeSpace: 'minimal', depth: 'dimensional' },
      'descending_weight': { layout: 'rule-of-thirds', focal: 'imagery', negativeSpace: 'moderate', depth: 'layered' },
      'obscured_reveal': { layout: 'asymmetric', focal: 'balanced', negativeSpace: 'dense', depth: 'layered' },
      'ascending_light': { layout: 'rule-of-thirds', focal: 'balanced', negativeSpace: 'moderate', depth: 'flat' }
    };

    return compositionMap[rules.composition] || {
      layout: 'centered',
      focal: 'balanced',
      negativeSpace: 'moderate',
      depth: 'flat'
    };
  }

  private selectEmotionalTypography(profile: EmotionalProfile, rules: EmotionalDesignRules): any {
    const typographyMap: Record<string, any> = {
      'compressed_bold': { fontStyle: 'sans-serif', weight: 'heavy', treatment: ['compressed', 'urgent'] },
      'light_flowing': { fontStyle: 'serif', weight: 'light', treatment: ['elegant', 'spacious'] },
      'distressed_heavy': { fontStyle: 'display', weight: 'heavy', treatment: ['distressed', 'rough'] },
      'vintage_serif': { fontStyle: 'serif', weight: 'regular', treatment: ['aged', 'classic'] },
      'italic_energy': { fontStyle: 'sans-serif', weight: 'bold', treatment: ['italic', 'dynamic'] },
      'thin_elegant': { fontStyle: 'serif', weight: 'light', treatment: ['refined', 'minimal'] },
      'enigmatic': { fontStyle: 'display', weight: 'regular', treatment: ['mysterious', 'unusual'] },
      'uplifting_clean': { fontStyle: 'sans-serif', weight: 'regular', treatment: ['clean', 'optimistic'] }
    };

    return typographyMap[rules.typography] || {
      fontStyle: 'serif',
      weight: 'regular',
      treatment: []
    };
  }

  private calculateEmotionalConfidence(profile: EmotionalProfile): number {
    let confidence = 0.5 + (profile.intensity * 0.3);

    if (profile.secondary.length > 0) {
      confidence += 0.1;
    }

    if (profile.arc !== 'steady') {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  calculateSuitability(metadata: BookMetadata): number {
    let score = 0;

    if (metadata.mood && metadata.mood.length > 0) {
      score += 0.4;
    }

    if (metadata.genre?.toLowerCase().includes('literary') ||
        metadata.genre?.toLowerCase().includes('psychological')) {
      score += 0.3;
    }

    if (metadata.themes && metadata.themes.some(t =>
        ['identity', 'emotion', 'psychology', 'relationship'].includes(t.toLowerCase()))) {
      score += 0.2;
    }

    if (metadata.synopsis && metadata.synopsis.length > 200) {
      score += 0.1;
    }

    return score;
  }
}