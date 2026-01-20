#!/usr/bin/env node
/**
 * RLHF Training Data Export Script
 * 
 * Exports high-quality feedback data from user_feedback table for
 * use in RLHF (Reinforcement Learning from Human Feedback) training.
 * 
 * Output formats supported:
 * - JSONL (for most training frameworks)
 * - ShareGPT format (for certain fine-tuning tools)
 * - CSV (for analysis)
 * 
 * Usage:
 *   node scripts/export-rlhf-data.js [options]
 * 
 * Options:
 *   --format=jsonl|sharegpt|csv   Output format (default: jsonl)
 *   --min-rating=N                Minimum rating to include (default: 4)
 *   --include-negative            Include negative feedback (rating <= 2)
 *   --days=N                      Days of data to export (default: 90)
 *   --output=path                 Output file path (default: stdout)
 *   --limit=N                     Maximum records to export
 *   --include-dimensions          Include dimension ratings
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    acc[key] = value === undefined ? true : value;
  }
  return acc;
}, {});

const CONFIG = {
  format: args.format || 'jsonl',
  minRating: parseInt(args['min-rating'] || '4', 10),
  includeNegative: args['include-negative'] || false,
  days: parseInt(args.days || '90', 10),
  output: args.output || null,
  limit: args.limit ? parseInt(args.limit, 10) : null,
  includeDimensions: args['include-dimensions'] || false,
};

// Validate format
if (!['jsonl', 'sharegpt', 'csv'].includes(CONFIG.format)) {
  console.error('Invalid format. Use: jsonl, sharegpt, or csv');
  process.exit(1);
}

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Fetch RLHF-eligible feedback data
 */
async function fetchFeedbackData() {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - CONFIG.days);
  
  let query = supabase
    .from('user_feedback')
    .select(`
      id,
      rating,
      accuracy_rating,
      completeness_rating,
      relevance_rating,
      actionability_rating,
      user_prompt_snapshot,
      assistant_response_snapshot,
      tags,
      created_at,
      al_conversation_id
    `)
    .eq('feature_context', 'al-chat')
    .not('user_prompt_snapshot', 'is', null)
    .not('assistant_response_snapshot', 'is', null)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false });
  
  // Filter by rating
  if (CONFIG.includeNegative) {
    // Include both positive (>=4) and negative (<=2), exclude neutral
    query = query.or(`rating.gte.${CONFIG.minRating},rating.lte.2`);
  } else {
    query = query.gte('rating', CONFIG.minRating);
  }
  
  if (CONFIG.limit) {
    query = query.limit(CONFIG.limit);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching data:', error);
    process.exit(1);
  }
  
  return data || [];
}

/**
 * Get car context for a conversation
 */
async function getCarContext(conversationId) {
  if (!conversationId) return null;
  
  const { data } = await supabase
    .from('al_conversations')
    .select('initial_car_slug')
    .eq('id', conversationId)
    .single();
  
  return data?.initial_car_slug || null;
}

/**
 * Clean text for export (remove excessive whitespace, etc.)
 */
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Convert to JSONL format (standard for most training)
 */
function toJsonl(record, carContext) {
  const entry = {
    id: record.id,
    prompt: cleanText(record.user_prompt_snapshot),
    response: cleanText(record.assistant_response_snapshot),
    rating: record.rating,
    positive: record.rating >= 4,
  };
  
  if (carContext) {
    entry.car_context = carContext;
  }
  
  if (CONFIG.includeDimensions) {
    entry.dimensions = {
      accuracy: record.accuracy_rating,
      completeness: record.completeness_rating,
      relevance: record.relevance_rating,
      actionability: record.actionability_rating,
    };
  }
  
  if (record.tags && record.tags.length > 0) {
    entry.tags = record.tags;
  }
  
  return JSON.stringify(entry);
}

/**
 * Convert to ShareGPT format (for certain fine-tuning tools)
 */
function toShareGpt(record, carContext) {
  const conversation = {
    id: record.id,
    conversations: [
      {
        from: 'human',
        value: cleanText(record.user_prompt_snapshot),
      },
      {
        from: 'gpt',
        value: cleanText(record.assistant_response_snapshot),
      },
    ],
  };
  
  // Add metadata
  if (carContext) {
    conversation.system = `You are AL, an expert automotive AI assistant. The user is asking about ${carContext}.`;
  }
  
  conversation.rating = record.rating;
  conversation.chosen = record.rating >= 4;
  
  return JSON.stringify(conversation);
}

/**
 * Convert to CSV row
 */
function toCsvRow(record, carContext, isHeader = false) {
  if (isHeader) {
    const headers = [
      'id',
      'prompt',
      'response',
      'rating',
      'positive',
      'car_context',
      'tags',
      'created_at',
    ];
    
    if (CONFIG.includeDimensions) {
      headers.push('accuracy_rating', 'completeness_rating', 'relevance_rating', 'actionability_rating');
    }
    
    return headers.join(',');
  }
  
  // Escape CSV fields
  const escape = (str) => {
    if (!str) return '';
    const escaped = String(str).replace(/"/g, '""');
    return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')
      ? `"${escaped}"`
      : escaped;
  };
  
  const row = [
    record.id,
    escape(cleanText(record.user_prompt_snapshot)),
    escape(cleanText(record.assistant_response_snapshot)),
    record.rating,
    record.rating >= 4,
    escape(carContext || ''),
    escape(record.tags ? record.tags.join('; ') : ''),
    record.created_at,
  ];
  
  if (CONFIG.includeDimensions) {
    row.push(
      record.accuracy_rating || '',
      record.completeness_rating || '',
      record.relevance_rating || '',
      record.actionability_rating || ''
    );
  }
  
  return row.join(',');
}

/**
 * Main export function
 */
async function exportData() {
  console.error(`[RLHF Export] Starting export...`);
  console.error(`  Format: ${CONFIG.format}`);
  console.error(`  Min Rating: ${CONFIG.minRating}`);
  console.error(`  Include Negative: ${CONFIG.includeNegative}`);
  console.error(`  Days: ${CONFIG.days}`);
  
  // Fetch data
  const records = await fetchFeedbackData();
  console.error(`[RLHF Export] Found ${records.length} eligible records`);
  
  if (records.length === 0) {
    console.error('[RLHF Export] No data to export');
    process.exit(0);
  }
  
  // Build output
  const lines = [];
  
  // CSV header
  if (CONFIG.format === 'csv') {
    lines.push(toCsvRow(null, null, true));
  }
  
  // Process each record
  for (const record of records) {
    const carContext = await getCarContext(record.al_conversation_id);
    
    let line;
    switch (CONFIG.format) {
      case 'jsonl':
        line = toJsonl(record, carContext);
        break;
      case 'sharegpt':
        line = toShareGpt(record, carContext);
        break;
      case 'csv':
        line = toCsvRow(record, carContext);
        break;
    }
    
    lines.push(line);
  }
  
  // Output
  const output = lines.join('\n');
  
  if (CONFIG.output) {
    const outputPath = path.resolve(CONFIG.output);
    fs.writeFileSync(outputPath, output);
    console.error(`[RLHF Export] Wrote ${records.length} records to ${outputPath}`);
  } else {
    console.log(output);
  }
  
  // Print summary
  const positiveCount = records.filter(r => r.rating >= 4).length;
  const negativeCount = records.filter(r => r.rating <= 2).length;
  const withDimensions = records.filter(r => r.accuracy_rating || r.completeness_rating).length;
  
  console.error(`[RLHF Export] Summary:`);
  console.error(`  Total: ${records.length}`);
  console.error(`  Positive (chosen): ${positiveCount}`);
  console.error(`  Negative (rejected): ${negativeCount}`);
  console.error(`  With dimension ratings: ${withDimensions}`);
}

// Run
exportData().catch((err) => {
  console.error('[RLHF Export] Error:', err);
  process.exit(1);
});
