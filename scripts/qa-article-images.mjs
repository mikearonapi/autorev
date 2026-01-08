#!/usr/bin/env node

/**
 * Article Image QA Script
 * 
 * Reviews AI-generated article images for quality issues:
 * - Cut-off cars
 * - Unnatural elements
 * - Poor composition
 * - Artifacts
 * 
 * Usage:
 *   node scripts/qa-article-images.mjs                    # Review all pending
 *   node scripts/qa-article-images.mjs --status approved  # List approved
 *   node scripts/qa-article-images.mjs --status rejected  # List rejected
 *   node scripts/qa-article-images.mjs --reset <id>       # Reset to pending
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Parse arguments
const args = process.argv.slice(2);
const statusFilter = args.includes('--status') ? args[args.indexOf('--status') + 1] : null;
const resetId = args.includes('--reset') ? args[args.indexOf('--reset') + 1] : null;

// Quality issues to check for
const QUALITY_ISSUES = {
  1: { code: 'cut_off', label: 'Car cut off / partial vehicle' },
  2: { code: 'artifacts', label: 'Visual artifacts / glitches' },
  3: { code: 'unnatural', label: 'Unnatural elements / mythological beings' },
  4: { code: 'bad_composition', label: 'Poor composition / framing' },
  5: { code: 'wrong_car', label: 'Wrong car model shown' },
  6: { code: 'blurry', label: 'Blurry / low quality' },
  7: { code: 'text_issues', label: 'Bad text / license plates' },
  8: { code: 'other', label: 'Other issue' },
};

async function getArticlesWithImages(status = null) {
  let query = supabase
    .from('al_articles')
    .select('id, title, slug, category, hero_image_url, image_qa_status, image_qa_issues')
    .not('hero_image_url', 'is', null)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('image_qa_status', status);
  } else {
    // Default: get pending (null or 'pending')
    query = query.or('image_qa_status.is.null,image_qa_status.eq.pending');
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
  
  return data || [];
}

async function updateImageQAStatus(articleId, status, issues = null) {
  const { error } = await supabase
    .from('al_articles')
    .update({
      image_qa_status: status,
      image_qa_issues: issues,
      image_qa_reviewed_at: new Date().toISOString(),
    })
    .eq('id', articleId);

  if (error) {
    console.error('Error updating QA status:', error);
    return false;
  }
  
  return true;
}

async function resetArticle(articleId) {
  const { error } = await supabase
    .from('al_articles')
    .update({
      image_qa_status: 'pending',
      image_qa_issues: null,
      image_qa_reviewed_at: null,
    })
    .eq('id', articleId);

  if (error) {
    console.error('Error resetting article:', error);
    return false;
  }
  
  console.log(`✅ Reset article ${articleId} to pending`);
  return true;
}

function createPrompt(question) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function reviewArticle(article) {
  console.log('\n' + '='.repeat(60));
  console.log(`📄 ${article.title}`);
  console.log(`   Category: ${article.category}`);
  console.log(`   Slug: ${article.slug}`);
  console.log(`\n🖼️  Image URL:\n   ${article.hero_image_url}`);
  console.log('\n   Open this URL in your browser to review the image.');
  console.log('='.repeat(60));

  const action = await createPrompt('\n[A]pprove, [R]eject, [S]kip, [Q]uit? ');

  switch (action.toLowerCase()) {
    case 'a':
      await updateImageQAStatus(article.id, 'approved');
      console.log('✅ Image approved');
      return 'continue';
      
    case 'r':
      console.log('\nSelect quality issues (comma-separated numbers):');
      Object.entries(QUALITY_ISSUES).forEach(([num, issue]) => {
        console.log(`  ${num}. ${issue.label}`);
      });
      
      const issuesInput = await createPrompt('\nIssues: ');
      const issueNums = issuesInput.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n) && n >= 1 && n <= 8);
      const issues = issueNums.map(n => QUALITY_ISSUES[n].code);
      
      const notes = await createPrompt('Additional notes (optional): ');
      const issueData = { issues, notes: notes || null };
      
      await updateImageQAStatus(article.id, 'rejected', issueData);
      console.log('❌ Image rejected');
      return 'continue';
      
    case 's':
      console.log('⏭️  Skipped');
      return 'continue';
      
    case 'q':
      return 'quit';
      
    default:
      console.log('Invalid option, skipping...');
      return 'continue';
  }
}

async function listArticles(status) {
  const articles = await getArticlesWithImages(status);
  
  console.log(`\n📋 Articles with ${status} images: ${articles.length}\n`);
  
  articles.forEach((article, i) => {
    console.log(`${i + 1}. ${article.title}`);
    console.log(`   ID: ${article.id}`);
    console.log(`   URL: ${article.hero_image_url}`);
    if (article.image_qa_issues) {
      console.log(`   Issues: ${JSON.stringify(article.image_qa_issues)}`);
    }
    console.log('');
  });
}

async function main() {
  console.log('\n🔍 Article Image QA Tool');
  console.log('========================\n');

  // Handle reset
  if (resetId) {
    await resetArticle(resetId);
    return;
  }

  // Handle status listing
  if (statusFilter) {
    await listArticles(statusFilter);
    return;
  }

  // Interactive review mode
  const articles = await getArticlesWithImages();
  
  if (articles.length === 0) {
    console.log('✨ No pending images to review!');
    return;
  }

  console.log(`Found ${articles.length} images pending review.\n`);
  console.log('Instructions:');
  console.log('  - Open each image URL in your browser');
  console.log('  - Check for quality issues (cut-off cars, artifacts, etc.)');
  console.log('  - Approve good images, reject problematic ones\n');

  for (const article of articles) {
    const result = await reviewArticle(article);
    if (result === 'quit') {
      console.log('\n👋 Exiting QA tool.');
      break;
    }
  }

  // Show summary
  const approved = await getArticlesWithImages('approved');
  const rejected = await getArticlesWithImages('rejected');
  const pending = await getArticlesWithImages();

  console.log('\n📊 QA Summary:');
  console.log(`   ✅ Approved: ${approved.length}`);
  console.log(`   ❌ Rejected: ${rejected.length}`);
  console.log(`   ⏳ Pending: ${pending.length}`);
}

main().catch(console.error);

