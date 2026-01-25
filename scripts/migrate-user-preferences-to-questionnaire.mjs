#!/usr/bin/env node

/**
 * Migration Script: user_preferences -> user_questionnaire_responses
 * 
 * Migrates existing personalization data from the legacy user_preferences table
 * to the new expandable questionnaire system.
 * 
 * Run with: node scripts/migrate-user-preferences-to-questionnaire.mjs
 * 
 * Options:
 *   --dry-run    Preview what would be migrated without making changes
 *   --verbose    Show detailed output for each user
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Parse command line args
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerbose = args.includes('--verbose');

/**
 * Mapping from legacy user_preferences fields to questionnaire format
 */
const FIELD_MAPPINGS = [
  {
    legacyField: 'driving_focus',
    questionId: 'driving_focus',
    category: 'core',
    isMulti: true,
  },
  {
    legacyField: 'work_preference',
    questionId: 'work_preference',
    category: 'core',
    isMulti: false,
  },
  {
    legacyField: 'budget_comfort',
    questionId: 'budget_comfort',
    category: 'core',
    isMulti: false,
  },
  {
    legacyField: 'mod_experience',
    questionId: 'mod_experience',
    category: 'core',
    isMulti: false,
  },
  {
    legacyField: 'primary_goals',
    questionId: 'primary_goals',
    category: 'core',
    isMulti: true,
  },
  {
    legacyField: 'track_frequency',
    questionId: 'track_frequency',
    category: 'core',
    isMulti: false,
  },
  {
    legacyField: 'detail_level',
    questionId: 'detail_level',
    category: 'core',
    isMulti: false,
  },
];

/**
 * Convert legacy field value to questionnaire answer format
 */
function convertToQuestionnaireFormat(value, isMulti) {
  if (!value) return null;
  
  if (isMulti) {
    // Multi-select fields are stored as arrays
    const values = Array.isArray(value) ? value : [value];
    return { values: values.filter(v => v && v.trim()) };
  } else {
    // Single-select fields are stored as strings
    return { value: value };
  }
}

/**
 * Run the migration
 */
async function migrate() {
  console.log('🔄 User Preferences to Questionnaire Migration');
  console.log('='.repeat(50));
  if (isDryRun) {
    console.log('📋 DRY RUN MODE - No changes will be made\n');
  }
  
  // 1. Fetch all user_preferences records with any personalization data
  console.log('📥 Fetching user preferences...');
  
  const { data: preferences, error: fetchError } = await supabase
    .from('user_preferences')
    .select('user_id, driving_focus, work_preference, budget_comfort, mod_experience, primary_goals, track_frequency, detail_level')
    .or(
      'driving_focus.neq.null,work_preference.neq.null,budget_comfort.neq.null,mod_experience.neq.null,primary_goals.neq.null,track_frequency.neq.null,detail_level.neq.null'
    );
  
  if (fetchError) {
    console.error('❌ Error fetching preferences:', fetchError);
    process.exit(1);
  }
  
  // Filter to only users with actual preference data
  const usersWithPrefs = preferences.filter(p => {
    return FIELD_MAPPINGS.some(mapping => {
      const value = p[mapping.legacyField];
      return value && (Array.isArray(value) ? value.length > 0 : value.trim());
    });
  });
  
  console.log(`📊 Found ${usersWithPrefs.length} users with preference data\n`);
  
  if (usersWithPrefs.length === 0) {
    console.log('✅ No data to migrate');
    return;
  }
  
  // 2. Check for existing questionnaire responses
  console.log('🔍 Checking for existing questionnaire responses...');
  
  const { data: existingResponses, error: existingError } = await supabase
    .from('user_questionnaire_responses')
    .select('user_id, question_id');
  
  if (existingError && existingError.code !== 'PGRST116') {
    console.error('❌ Error checking existing responses:', existingError);
    process.exit(1);
  }
  
  // Build lookup of existing responses
  const existingLookup = new Set();
  if (existingResponses) {
    for (const r of existingResponses) {
      existingLookup.add(`${r.user_id}:${r.question_id}`);
    }
  }
  console.log(`📋 ${existingLookup.size} existing questionnaire responses found\n`);
  
  // 3. Build migration inserts
  const inserts = [];
  let skippedCount = 0;
  let migratedUsers = 0;
  
  for (const userPrefs of usersWithPrefs) {
    const userId = userPrefs.user_id;
    let userQuestionCount = 0;
    
    for (const mapping of FIELD_MAPPINGS) {
      const value = userPrefs[mapping.legacyField];
      
      // Skip empty values
      if (!value || (Array.isArray(value) && value.length === 0)) {
        continue;
      }
      
      // Skip if already exists in new system
      const key = `${userId}:${mapping.questionId}`;
      if (existingLookup.has(key)) {
        skippedCount++;
        continue;
      }
      
      // Convert to new format
      const answer = convertToQuestionnaireFormat(value, mapping.isMulti);
      if (!answer) continue;
      
      inserts.push({
        user_id: userId,
        question_id: mapping.questionId,
        question_category: mapping.category,
        answer,
      });
      
      userQuestionCount++;
    }
    
    if (userQuestionCount > 0) {
      migratedUsers++;
      if (isVerbose) {
        console.log(`  User ${userId}: ${userQuestionCount} responses to migrate`);
      }
    }
  }
  
  console.log(`📊 Migration summary:`);
  console.log(`   - Users to migrate: ${migratedUsers}`);
  console.log(`   - Responses to insert: ${inserts.length}`);
  console.log(`   - Skipped (already exists): ${skippedCount}\n`);
  
  if (inserts.length === 0) {
    console.log('✅ No new data to migrate');
    return;
  }
  
  // 4. Perform the migration
  if (isDryRun) {
    console.log('📋 DRY RUN - Would have inserted:');
    console.log(`   ${inserts.length} questionnaire responses for ${migratedUsers} users`);
    if (isVerbose) {
      console.log('\nSample inserts:');
      for (const insert of inserts.slice(0, 10)) {
        console.log(`  - ${insert.user_id}: ${insert.question_id} = ${JSON.stringify(insert.answer)}`);
      }
    }
    return;
  }
  
  console.log('💾 Inserting questionnaire responses...');
  
  // Insert in batches of 100
  const BATCH_SIZE = 100;
  let insertedCount = 0;
  
  for (let i = 0; i < inserts.length; i += BATCH_SIZE) {
    const batch = inserts.slice(i, i + BATCH_SIZE);
    
    const { error: insertError } = await supabase
      .from('user_questionnaire_responses')
      .upsert(batch, { 
        onConflict: 'user_id,question_id',
        ignoreDuplicates: true,
      });
    
    if (insertError) {
      console.error(`❌ Error inserting batch ${i / BATCH_SIZE + 1}:`, insertError);
      continue;
    }
    
    insertedCount += batch.length;
    process.stdout.write(`\r   Progress: ${insertedCount}/${inserts.length}`);
  }
  
  console.log('\n');
  
  // 5. Trigger profile summary recalculation for migrated users
  console.log('🔄 Triggering profile summary recalculations...');
  
  const migratedUserIds = [...new Set(inserts.map(i => i.user_id))];
  let recalcCount = 0;
  
  for (const userId of migratedUserIds) {
    try {
      const { error } = await supabase.rpc('recalculate_profile_summary', { p_user_id: userId });
      if (!error) recalcCount++;
    } catch (e) {
      // Ignore errors - trigger might handle this
    }
  }
  
  console.log(`   Recalculated ${recalcCount}/${migratedUserIds.length} profiles\n`);
  
  console.log('✅ Migration complete!');
  console.log(`   - Migrated ${insertedCount} responses from ${migratedUsers} users`);
}

// Run migration
migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
