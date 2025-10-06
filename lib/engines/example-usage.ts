import { CoverGenerator, GenerationRequest } from './cover-generator';

async function demonstrateEngineSystem() {
  const generator = new CoverGenerator();

  console.log('=== BOOK COVER ENGINE SYSTEM DEMO ===\n');

  const examples: GenerationRequest[] = [
    {
      title: "The Shadow's Edge",
      author: "Sarah Blackwood",
      synopsis: "In a world where shadows have consciousness, detective Maya Chen must solve murders that occur in the dark spaces between light. As she pursues a killer who can manipulate darkness itself, she discovers her own connection to the shadow realm threatens everything she believes about reality.",
      genre: "thriller",
      keywords: ["psychological", "supernatural", "detective", "noir"],
      strategy: "differentiate"
    },
    {
      title: "Echoes of Tomorrow",
      author: "Marcus Vale",
      synopsis: "When time-traveler Kai discovers he can only move backward through his own memories, he must relive his greatest failures to prevent a catastrophe that will erase humanity. Each journey into the past costs him pieces of his future self.",
      genre: "scifi",
      keywords: ["time-travel", "memory", "sacrifice", "dystopia"],
      strategy: "hybrid"
    },
    {
      title: "The Garden of Lost Names",
      author: "Elena Rodriguez",
      synopsis: "During WWII, a young woman uses her talent for forgery to save Jewish children, encoding their real identities in the decorative borders of a medieval manuscript. Decades later, her granddaughter must decode the manuscript to reunite families torn apart by war.",
      genre: "historical",
      keywords: ["WWII", "family", "secrets", "art", "memory"],
      strategy: "market-conform"
    }
  ];

  for (const request of examples) {
    console.log(`\n📚 Generating cover for: "${request.title}"`);
    console.log(`   Author: ${request.author}`);
    console.log(`   Genre: ${request.genre}`);
    console.log(`   Strategy: ${request.strategy}`);

    const result = await generator.generate(request);

    console.log(`\n   ✅ Engine Used: ${result.engineUsed}`);
    console.log(`   📊 Confidence: ${(result.confidence * 100).toFixed(1)}%`);

    console.log('\n   🎨 Visual Design:');
    console.log(`      Prompt: ${result.coverDesign.visualPrompt}`);
    console.log(`      Colors: ${result.coverDesign.colorPalette.join(', ')}`);
    console.log(`      Mood: ${result.coverDesign.mood}`);

    console.log('\n   📝 Typography:');
    console.log(`      Title: ${result.coverDesign.typography.title.family}`);
    console.log(`      Weight: ${result.coverDesign.typography.title.weight}`);
    console.log(`      Effects: ${result.coverDesign.typography.title.effects?.join(', ') || 'none'}`);

    console.log('\n   📈 Market Analysis:');
    console.log(`      Saturated Elements: ${result.marketAnalysis.saturatedElements.join(', ') || 'none'}`);
    console.log(`      Opportunities: ${result.marketAnalysis.opportunities.join(', ')}`);
    console.log(`      Recommendation: ${result.marketAnalysis.recommendation}`);

    console.log('\n   💡 Design Reasoning:');
    result.coverDesign.reasoning.forEach((reason, i) => {
      console.log(`      ${i + 1}. ${reason}`);
    });

    if (result.alternatives.length > 0) {
      console.log(`\n   🔄 Alternative Designs Available: ${result.alternatives.length}`);
    }

    console.log('\n   ' + '─'.repeat(60));
  }

  console.log('\n\n=== ADVANCED ENGINE FEATURES ===\n');

  const marketDrivenExample: GenerationRequest = {
    title: "Crimson Throne",
    author: "Alexandra Knight",
    prompt: "A dark fantasy epic about power, betrayal, and the price of ambition. The story follows a reluctant heir who must navigate court intrigue and ancient magic to claim their birthright, but every ally might be an enemy in disguise.",
    genre: "fantasy",
    strategy: "auto"
  };

  console.log('🎯 Market-Driven Generation:');
  console.log(`   Title: "${marketDrivenExample.title}"`);
  console.log('   Strategy: AUTO (Let system decide based on market analysis)\n');

  const autoResult = await generator.generate(marketDrivenExample);

  console.log(`   System Decision: ${autoResult.engineUsed}`);
  console.log(`   Market Position: ${autoResult.coverDesign.reasoning.find(r => r.includes('strategy')) || 'Optimal positioning selected'}`);

  console.log('\n\n=== ENGINE CAPABILITIES ===\n');

  console.log('🔧 Available Engines:');
  console.log('   1. Semiotic Engine - Decodes genre conventions & visual language');
  console.log('   2. Affective Composition - Emotion-driven psychological design');
  console.log('   3. Typographic Personality - Typography as primary communication');
  console.log('   4. Abstract Symbolism - Conceptual minimalist representation');
  console.log('   5. Negative Space Narrative - Dual imagery through space');
  console.log('   6. Historical Homage - Period-authentic visual styles');

  console.log('\n📊 Market Intelligence Features:');
  console.log('   • Real-time competitor analysis');
  console.log('   • Saturation detection for visual elements');
  console.log('   • Market gap identification');
  console.log('   • Trend analysis (emerging/declining/stable)');
  console.log('   • Similarity scoring between designs');

  console.log('\n🎨 Design Differentiation Strategies:');
  console.log('   • CONFORM: Match successful market patterns');
  console.log('   • DIFFERENTIATE: Stand out with unique elements');
  console.log('   • HYBRID: Balance convention with innovation');
  console.log('   • AUTO: System selects optimal strategy');

  console.log('\n✨ Unique Features:');
  console.log('   • Multi-engine orchestration');
  console.log('   • Emotional arc detection');
  console.log('   • Theme-to-visual mapping');
  console.log('   • Award-winning design analysis');
  console.log('   • A/B testing recommendations');
  console.log('   • Batch generation for series');
}

demonstrateEngineSystem().catch(console.error);