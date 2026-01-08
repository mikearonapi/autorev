#!/usr/bin/env node

/**
 * Article Expansion Script
 * 
 * Expands articles to SEO-optimized length (1,500-2,000 words)
 * with rich, database-informed content.
 * 
 * Usage:
 *   node scripts/expand-articles.mjs                    # List articles needing expansion
 *   node scripts/expand-articles.mjs --article <slug>   # Expand specific article
 *   node scripts/expand-articles.mjs --all              # Expand all (with confirmation)
 *   node scripts/expand-articles.mjs --dry-run          # Preview without saving
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createInterface } from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const TARGET_WORD_COUNT = { min: 1500, max: 2000 };

// Parse arguments
const args = process.argv.slice(2);
const specificSlug = args.includes('--article') ? args[args.indexOf('--article') + 1] : null;
const expandAll = args.includes('--all');
const dryRun = args.includes('--dry-run');

function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function getArticlesNeedingExpansion() {
  const { data, error } = await supabase
    .from('al_articles')
    .select('id, title, slug, category, subcategory, excerpt, content_html, tags')
    .eq('is_published', true)
    .order('category');

  if (error) throw error;

  return data.filter(article => {
    const content = article.content_html || '';
    const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = text.split(' ').filter(w => w.length > 0).length;
    return wordCount < TARGET_WORD_COUNT.min;
  }).map(article => {
    const content = article.content_html || '';
    const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = text.split(' ').filter(w => w.length > 0).length;
    return { ...article, currentWordCount: wordCount };
  });
}

async function getRelevantDatabaseContext(article) {
  const context = { vehicles: [], mods: [], events: [] };

  // For comparison articles, get vehicle specs
  if (article.category === 'comparisons') {
    // Extract vehicle names from title
    const titleLower = article.title.toLowerCase();
    
    // Search for mentioned vehicles
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select(`
        id, make, model, year, body_style, drivetrain, engine_type,
        horsepower, torque, zero_to_sixty, quarter_mile, top_speed,
        base_price, curb_weight, fuel_economy_combined
      `)
      .or(`make.ilike.%${titleLower.split(' ')[0]}%,model.ilike.%${titleLower.split(' ')[1]}%`)
      .limit(10);

    if (vehicles) context.vehicles = vehicles;
  }

  // For technical articles, get mod data
  if (article.category === 'technical') {
    const tags = article.tags || [];
    
    // Try to find relevant mods
    for (const tag of tags.slice(0, 3)) {
      const { data: mods } = await supabase
        .from('modifications')
        .select('name, category, description, typical_hp_gain, typical_cost_range')
        .ilike('name', `%${tag}%`)
        .limit(5);
      
      if (mods) context.mods.push(...mods);
    }
  }

  // For enthusiast/events articles, get event data
  if (article.subcategory === 'events' || article.tags?.includes('events')) {
    const { data: events } = await supabase
      .from('events')
      .select('name, event_type, location_city, location_state')
      .limit(10);
    
    if (events) context.events = events;
  }

  return context;
}

async function expandArticle(article, dryRun = false) {
  console.log(`\n📝 Expanding: ${article.title}`);
  console.log(`   Current: ${article.currentWordCount} words`);
  console.log(`   Target: ${TARGET_WORD_COUNT.min}-${TARGET_WORD_COUNT.max} words`);

  // Get database context
  const dbContext = await getRelevantDatabaseContext(article);
  
  const contextStr = Object.entries(dbContext)
    .filter(([_, v]) => v.length > 0)
    .map(([k, v]) => `${k}: ${JSON.stringify(v.slice(0, 5), null, 2)}`)
    .join('\n\n');

  const systemPrompt = `You are AL, AutoRev's AI automotive expert. You write comprehensive, authoritative articles about cars for enthusiasts.

Your writing style:
- Authoritative but approachable
- Data-driven with specific numbers and specs
- Practical advice enthusiasts can actually use
- No fluff or filler content
- Every paragraph should add real value

You MUST write articles that are ${TARGET_WORD_COUNT.min}-${TARGET_WORD_COUNT.max} words.

Important: Output ONLY the HTML content. No preamble, no markdown, no explanation. Just clean semantic HTML starting with <p> tags.`;

  const userPrompt = `Expand this article to ${TARGET_WORD_COUNT.min}-${TARGET_WORD_COUNT.max} words with rich, valuable content.

ARTICLE INFO:
Title: ${article.title}
Category: ${article.category}/${article.subcategory || 'general'}
Excerpt: ${article.excerpt}
Tags: ${(article.tags || []).join(', ')}

CURRENT CONTENT (${article.currentWordCount} words):
${article.content_html}

${contextStr ? `RELEVANT DATABASE DATA TO INCORPORATE:\n${contextStr}` : ''}

REQUIREMENTS:
1. Expand to ${TARGET_WORD_COUNT.min}-${TARGET_WORD_COUNT.max} words total
2. Keep the existing structure but add more depth
3. Add specific data, specs, and real-world examples
4. Include practical tips and actionable advice
5. Use proper HTML formatting: <h2>, <h3>, <p>, <ul>/<li>, <strong>
6. Every section should provide genuine value - no padding
7. For comparisons: Include specific performance numbers, pricing, pros/cons
8. For technical: Include step-by-step guidance, costs, difficulty levels
9. For enthusiast: Include cultural context, history, community aspects

Output ONLY the expanded HTML content.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      system: systemPrompt,
    });

    const expandedContent = response.content[0].text.trim();
    
    // Calculate new word count
    const newText = expandedContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const newWordCount = newText.split(' ').filter(w => w.length > 0).length;
    const newReadTime = Math.ceil(newWordCount / 200);

    console.log(`   New: ${newWordCount} words (${newReadTime} min read)`);

    if (newWordCount < TARGET_WORD_COUNT.min) {
      console.log(`   ⚠️  Still under target, may need manual review`);
    } else {
      console.log(`   ✅ Target achieved!`);
    }

    if (!dryRun) {
      const { error } = await supabase
        .from('al_articles')
        .update({
          content_html: expandedContent,
          read_time_minutes: newReadTime,
          updated_at: new Date().toISOString(),
        })
        .eq('id', article.id);

      if (error) {
        console.log(`   ❌ Save failed: ${error.message}`);
        return false;
      }
      console.log(`   💾 Saved to database`);
    } else {
      console.log(`   🔍 DRY RUN - not saved`);
      console.log(`\n--- Preview (first 500 chars) ---`);
      console.log(expandedContent.substring(0, 500) + '...');
    }

    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('\n📚 Article Expansion Tool');
  console.log('='.repeat(50));

  const articlesNeedingWork = await getArticlesNeedingExpansion();

  if (articlesNeedingWork.length === 0) {
    console.log('\n✨ All articles meet the word count target!');
    return;
  }

  console.log(`\n${articlesNeedingWork.length} articles need expansion:\n`);
  articlesNeedingWork.forEach((a, i) => {
    console.log(`${i + 1}. ${a.title}`);
    console.log(`   ${a.currentWordCount} words → need ${TARGET_WORD_COUNT.min - a.currentWordCount}+ more`);
  });

  // Specific article
  if (specificSlug) {
    const article = articlesNeedingWork.find(a => a.slug === specificSlug);
    if (!article) {
      console.log(`\n❌ Article "${specificSlug}" not found or doesn't need expansion`);
      return;
    }
    await expandArticle(article, dryRun);
    return;
  }

  // Expand all
  if (expandAll) {
    if (!dryRun) {
      const confirm = await prompt(`\n⚠️  This will expand ${articlesNeedingWork.length} articles using AI. Continue? (yes/no): `);
      if (confirm.toLowerCase() !== 'yes') {
        console.log('Cancelled.');
        return;
      }
    }

    let success = 0;
    let failed = 0;

    for (const article of articlesNeedingWork) {
      const result = await expandArticle(article, dryRun);
      if (result) success++;
      else failed++;
      
      // Rate limit - wait between API calls
      if (!dryRun) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    console.log(`\n📊 Summary: ${success} expanded, ${failed} failed`);
    return;
  }

  // Interactive mode
  console.log('\nOptions:');
  console.log('  node scripts/expand-articles.mjs --article <slug>  # Expand one');
  console.log('  node scripts/expand-articles.mjs --all             # Expand all');
  console.log('  node scripts/expand-articles.mjs --dry-run --all   # Preview all');
}

main().catch(console.error);

