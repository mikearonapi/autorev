#!/usr/bin/env node

/**
 * Generate Comparison Page Content
 * 
 * Uses AI to generate rich content for comparison pages:
 * - Intro paragraph
 * - Category-by-category analysis
 * - AL recommendation ("Which should you buy?")
 * - Conclusion
 * 
 * Usage:
 *   node scripts/generate-comparison-content.js [slug]
 *   node scripts/generate-comparison-content.js --all
 *   node scripts/generate-comparison-content.js --publish [slug]
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const args = process.argv.slice(2);
const targetSlug = args.find(a => !a.startsWith('--'));
const publishOnly = args.includes('--publish');
const processAll = args.includes('--all');

async function main() {
  console.log('🔄 Comparison Content Generator\n');

  if (publishOnly && targetSlug) {
    await publishComparison(targetSlug);
    return;
  }

  // Get comparisons to process
  let query = supabase
    .from('comparison_pages')
    .select('*');

  if (targetSlug) {
    query = query.eq('slug', targetSlug);
  } else if (!processAll) {
    // Only unpublished ones without content
    query = query
      .eq('is_published', false)
      .is('al_recommendation', null);
  }

  const { data: comparisons, error } = await query;

  if (error) {
    console.error('❌ Error fetching comparisons:', error);
    process.exit(1);
  }

  if (!comparisons || comparisons.length === 0) {
    console.log('✅ No comparisons need content generation.');
    return;
  }

  console.log(`📝 Processing ${comparisons.length} comparison(s)...\n`);

  for (const comparison of comparisons) {
    await generateContentForComparison(comparison);
  }

  console.log('\n✅ Done!');
}

async function generateContentForComparison(comparison) {
  console.log(`\n📊 Processing: ${comparison.title}`);

  // Fetch car data for this comparison
  const { data: cars, error: carsError } = await supabase
    .from('cars')
    .select('*')
    .in('slug', comparison.car_slugs);

  if (carsError || !cars || cars.length === 0) {
    console.error(`  ❌ Could not fetch cars for ${comparison.slug}`);
    return;
  }

  console.log(`  📌 Cars: ${cars.map(c => c.name).join(' vs ')}`);

  // Build context for AI
  const carContext = cars.map(car => `
### ${car.name} (${car.years})
- Engine: ${car.engine}
- Horsepower: ${car.hp} hp
- Torque: ${car.torque || 'N/A'} lb-ft
- Transmission: ${car.trans}
- Drivetrain: ${car.drivetrain}
- 0-60 mph: ${car.zero_to_sixty || 'N/A'}s
- Price Range: ${car.price_range}
- Average Used Price: $${car.price_avg?.toLocaleString() || 'N/A'}
- Tier: ${car.tier}
- Category: ${car.category}

**Scores (1-10):**
- Driver Fun: ${car.score_driver_fun}
- Track Capability: ${car.score_track}
- Sound: ${car.score_sound}
- Interior: ${car.score_interior}
- Reliability: ${car.score_reliability}
- Value: ${car.score_value}
- Aftermarket: ${car.score_aftermarket}

**Strengths:** ${JSON.stringify(car.defining_strengths)}
**Weaknesses:** ${JSON.stringify(car.honest_weaknesses)}
**Ideal Buyer:** ${car.ideal_buyer || 'N/A'}
`).join('\n');

  const comparisonTypeContext = {
    head_to_head: 'This is a direct head-to-head comparison between two cars.',
    three_way: 'This is a three-way comparison between three competing options.',
    best_under: 'This is a "best options under a threshold" comparison.',
    best_for: 'This is a "best for a specific use case" comparison.',
    alternatives: 'This presents alternatives to a popular car.',
  };

  const prompt = `You are an automotive journalist writing for AutoRev, a platform for sports car enthusiasts. 
Write content for a car comparison page.

**Comparison Type:** ${comparisonTypeContext[comparison.comparison_type] || 'Head-to-head comparison'}
**Title:** ${comparison.title}

**Car Data:**
${carContext}

Please generate the following content in JSON format:

{
  "intro_content": "A compelling 2-3 sentence introduction that hooks the reader and sets up the comparison. Mention what makes this comparison interesting.",
  
  "comparison_data": {
    "categories": [
      {
        "name": "Performance",
        "winner": "car-slug-of-winner",
        "analysis": "2-3 sentences analyzing this category"
      },
      {
        "name": "Driving Experience", 
        "winner": "car-slug-of-winner",
        "analysis": "2-3 sentences"
      },
      {
        "name": "Value & Running Costs",
        "winner": "car-slug-of-winner",
        "analysis": "2-3 sentences"
      },
      {
        "name": "Practicality",
        "winner": "car-slug-of-winner",
        "analysis": "2-3 sentences"
      }
    ]
  },
  
  "al_recommendation": "4-6 sentences providing a nuanced recommendation. Explain which car is best for different types of buyers. Be specific about use cases (weekend warrior, daily driver, track enthusiast, etc.). Don't be afraid to declare a winner but acknowledge trade-offs.",
  
  "conclusion_content": "2-3 sentences wrapping up the comparison with a final thought.",
  
  "winner_slug": "slug-of-overall-winner-or-null-if-tie",
  "winner_rationale": "1-2 sentences explaining why this car wins overall (or null if tie)"
}

Important:
- Use actual car slugs from the data (${cars.map(c => c.slug).join(', ')})
- Be honest and nuanced - don't oversell any car
- Write for enthusiasts who appreciate technical details
- Keep the tone conversational but authoritative
- If it's genuinely a close call, you can declare a tie

Return ONLY the JSON, no markdown formatting.`;

  try {
    console.log('  🤖 Generating content with AI...');
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const contentText = response.content[0].text;
    
    // Parse the JSON response
    let content;
    try {
      content = JSON.parse(contentText);
    } catch (parseError) {
      // Try to extract JSON from the response
      const jsonMatch = contentText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse AI response as JSON');
      }
    }

    // Update the comparison page
    const { error: updateError } = await supabase
      .from('comparison_pages')
      .update({
        intro_content: content.intro_content,
        comparison_data: content.comparison_data,
        al_recommendation: content.al_recommendation,
        al_generated_at: new Date().toISOString(),
        conclusion_content: content.conclusion_content,
        winner_slug: content.winner_slug || null,
        winner_rationale: content.winner_rationale || null,
        updated_at: new Date().toISOString(),
      })
      .eq('slug', comparison.slug);

    if (updateError) {
      console.error(`  ❌ Error updating ${comparison.slug}:`, updateError);
    } else {
      console.log(`  ✅ Content generated for ${comparison.slug}`);
    }

  } catch (err) {
    console.error(`  ❌ AI generation failed for ${comparison.slug}:`, err.message);
  }
}

async function publishComparison(slug) {
  console.log(`📢 Publishing: ${slug}`);

  const { error } = await supabase
    .from('comparison_pages')
    .update({
      is_published: true,
      published_at: new Date().toISOString(),
    })
    .eq('slug', slug);

  if (error) {
    console.error('❌ Error publishing:', error);
  } else {
    console.log('✅ Published successfully!');
  }
}

main().catch(console.error);

