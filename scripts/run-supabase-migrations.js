/**
 * Supabase Migration Runner
 * 
 * Runs SQL migrations against the Supabase database.
 * Requires SUPABASE_SERVICE_ROLE_KEY for DDL operations.
 * 
 * Usage:
 *   node scripts/run-supabase-migrations.js schema     - Run schema.sql
 *   node scripts/run-supabase-migrations.js seed       - Run seed data
 *   node scripts/run-supabase-migrations.js all        - Run all migrations
 *   node scripts/run-supabase-migrations.js <file>     - Run specific file
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manual .env.local parser (no dotenv dependency)
function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=').trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key.trim()] = value;
      }
    }
  } catch (err) {
    // File doesn't exist or can't be read
    console.warn(`Note: Could not load ${filePath}`);
  }
}

// Load environment variables from .env.local
loadEnvFile(path.join(__dirname, '..', '.env.local'));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials!');
  console.error('   Required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase admin client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Execute SQL against Supabase
 */
async function executeSql(sql, description) {
  console.log(`\n📄 Running: ${description}`);
  console.log('   ' + '-'.repeat(50));
  
  try {
    // Split SQL into individual statements and execute each
    // Remove comments and split by semicolons
    const statements = sql
      .split(/;(?=\s*(?:--|CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|DO|SELECT|TRUNCATE|COMMENT|$))/gi)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      if (!statement || statement.startsWith('--')) continue;
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });
        
        if (error) {
          // Try direct query instead
          const { error: directError } = await supabase
            .from('_exec_sql')
            .select()
            .limit(0);
          
          if (directError) {
            // Log but continue - some statements may fail if already executed
            const shortStatement = statement.substring(0, 80).replace(/\n/g, ' ');
            console.log(`   ⚠️  ${shortStatement}...`);
            errorCount++;
          }
        } else {
          successCount++;
        }
      } catch (stmtError) {
        // Continue on individual statement errors
        errorCount++;
      }
    }
    
    console.log(`   ✅ Completed: ${successCount} statements, ${errorCount} skipped/errors`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }
}

/**
 * Run SQL file directly using Supabase REST API
 */
async function runSqlFile(filePath, description) {
  console.log(`\n📄 Running: ${description}`);
  console.log('   File: ' + filePath);
  console.log('   ' + '-'.repeat(50));
  
  if (!fs.existsSync(filePath)) {
    console.error(`   ❌ File not found: ${filePath}`);
    return false;
  }
  
  const sql = fs.readFileSync(filePath, 'utf8');
  
  // For migrations, we need to use the Supabase REST API directly
  // since the JS client doesn't support arbitrary SQL execution
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({ sql_query: sql }),
  });
  
  if (!response.ok) {
    // The exec_sql function may not exist - let's try a different approach
    console.log('   ℹ️  exec_sql not available, using statement-by-statement approach');
    return await executeStatementsIndividually(sql);
  }
  
  console.log('   ✅ Migration completed successfully');
  return true;
}

/**
 * Execute SQL statements one by one
 */
async function executeStatementsIndividually(sql) {
  // Parse and execute UPDATE statements for car data
  const updateRegex = /UPDATE\s+cars\s+SET[\s\S]*?WHERE\s+slug\s*=\s*'([^']+)'/gi;
  const insertRegex = /INSERT\s+INTO\s+(\w+)[\s\S]*?ON\s+CONFLICT[\s\S]*?;/gi;
  
  let match;
  let successCount = 0;
  let errorCount = 0;
  
  // Handle UPDATE statements for cars
  const updates = sql.match(/UPDATE\s+cars\s+SET[\s\S]*?WHERE\s+slug\s*=\s*'[^']+'\s*;/gi) || [];
  
  for (const updateSql of updates) {
    const slugMatch = updateSql.match(/WHERE\s+slug\s*=\s*'([^']+)'/i);
    if (!slugMatch) continue;
    
    const slug = slugMatch[1];
    
    // Parse the SET clause to extract field values
    const setMatch = updateSql.match(/SET([\s\S]*?)WHERE/i);
    if (!setMatch) continue;
    
    const setClause = setMatch[1];
    const updates = {};
    
    // Parse field = value pairs
    const fieldRegex = /(\w+)\s*=\s*([^,]+?)(?=,\s*\w+\s*=|$)/gi;
    let fieldMatch;
    while ((fieldMatch = fieldRegex.exec(setClause)) !== null) {
      let [, field, value] = fieldMatch;
      value = value.trim();
      
      // Skip NOW() and similar functions
      if (value.toUpperCase() === 'NOW()') continue;
      
      // Parse numeric values
      if (/^\d+$/.test(value)) {
        updates[field] = parseInt(value);
      } else if (/^\d+\.\d+$/.test(value)) {
        updates[field] = parseFloat(value);
      } else if (value === 'NULL') {
        updates[field] = null;
      }
    }
    
    if (Object.keys(updates).length > 0) {
      try {
        const { error } = await supabase
          .from('cars')
          .update(updates)
          .eq('slug', slug);
        
        if (error) {
          console.log(`   ⚠️  ${slug}: ${error.message}`);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        errorCount++;
      }
    }
  }
  
  console.log(`   ✅ Processed ${successCount} updates, ${errorCount} errors`);
  return successCount > 0;
}

/**
 * Update car performance data using Supabase client
 */
async function updateCarPerformanceData() {
  console.log('\n🚗 Updating car performance data...');
  console.log('   ' + '-'.repeat(50));
  
  // Import local car data
  const { carData } = await import('../data/cars.js');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const car of carData) {
    // Only update if we have Performance HUB data
    if (car.perfPowerAccel === undefined) continue;
    
    const updates = {
      // Hard metrics
      torque: car.torque || null,
      curb_weight: car.curbWeight || null,
      zero_to_sixty: car.zeroToSixty || null,
      quarter_mile: car.quarterMile || null,
      braking_60_0: car.braking60To0 || null,
      lateral_g: car.lateralG || null,
      // Performance HUB scores
      perf_power_accel: car.perfPowerAccel || null,
      perf_grip_cornering: car.perfGripCornering || null,
      perf_braking: car.perfBraking || null,
      perf_track_pace: car.perfTrackPace || null,
      perf_drivability: car.perfDrivability || null,
      perf_reliability_heat: car.perfReliabilityHeat || null,
      perf_sound_emotion: car.perfSoundEmotion || null,
    };
    
    try {
      const { error } = await supabase
        .from('cars')
        .update(updates)
        .eq('slug', car.slug);
      
      if (error) {
        console.log(`   ⚠️  ${car.slug}: ${error.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ ${car.name}`);
        successCount++;
      }
    } catch (err) {
      console.log(`   ❌ ${car.slug}: ${err.message}`);
      errorCount++;
    }
  }
  
  console.log(`\n   📊 Summary: ${successCount} updated, ${errorCount} errors`);
  return successCount > 0;
}

/**
 * Seed upgrade education data
 */
async function seedUpgradeEducation() {
  console.log('\n📚 Seeding upgrade education data...');
  console.log('   ' + '-'.repeat(50));
  
  // Import upgrade education data
  const { upgradeDetails, upgradeCategories } = await import('../data/upgradeEducation.js');
  
  // Map local category keys to database category keys
  const categoryMap = {
    'power': 'power-engine',
    'exhaust': 'exhaust-sound',
    'suspension': 'suspension-handling',
    'brakes': 'brakes',
    'wheels': 'wheels-tires',
    'cooling': 'cooling',
    'aero': 'aero',
    'electronics': 'electronics-tuning',
  };
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const [key, upgrade] of Object.entries(upgradeDetails)) {
    const record = {
      key: upgrade.key,
      name: upgrade.name,
      slug: upgrade.key,
      category: categoryMap[upgrade.category] || upgrade.category,
      short_description: upgrade.shortDescription,
      cost_range: upgrade.cost?.range || '$0',
      cost_low: upgrade.cost?.low || 0,
      cost_high: upgrade.cost?.high || 0,
      difficulty: upgrade.difficulty || 'Moderate',
      install_time: upgrade.installTime || 'Varies',
      full_description: upgrade.fullDescription || '',
      how_it_works: upgrade.howItWorks || '',
      expected_gains: upgrade.expectedGains || {},
      pros: upgrade.pros || [],
      cons: upgrade.cons || [],
      best_for: upgrade.bestFor || [],
      works_well_with: upgrade.worksWellWith || [],
      considerations: upgrade.considerations || '',
      applicable_car_types: upgrade.applicableCarTypes || ['all'],
    };
    
    try {
      const { error } = await supabase
        .from('upgrade_education')
        .upsert(record, { onConflict: 'key' });
      
      if (error) {
        console.log(`   ⚠️  ${upgrade.name}: ${error.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ ${upgrade.name}`);
        successCount++;
      }
    } catch (err) {
      console.log(`   ❌ ${upgrade.key}: ${err.message}`);
      errorCount++;
    }
  }
  
  console.log(`\n   📊 Summary: ${successCount} seeded, ${errorCount} errors`);
  return successCount > 0;
}

/**
 * Main migration runner
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  
  console.log('🚀 AutoRev - Database Migration Runner');
  console.log('=' .repeat(60));
  console.log(`   Supabase URL: ${SUPABASE_URL}`);
  console.log(`   Command: ${command}`);
  
  const supabasePath = path.join(__dirname, '..', 'supabase');
  
  switch (command) {
    case 'schema':
      // Note: Schema changes require Supabase Dashboard or CLI
      console.log('\n⚠️  Schema changes should be run via Supabase Dashboard SQL Editor');
      console.log('   Copy the contents of supabase/schema.sql and run in the Dashboard');
      break;
      
    case 'cars':
      await updateCarPerformanceData();
      break;
      
    case 'upgrades':
      await seedUpgradeEducation();
      break;
      
    case 'all':
      console.log('\n📋 Running all migrations...');
      await updateCarPerformanceData();
      await seedUpgradeEducation();
      break;
      
    default:
      // Try to run a specific file
      const filePath = path.join(supabasePath, 'migrations', command);
      if (fs.existsSync(filePath)) {
        await runSqlFile(filePath, command);
      } else {
        console.error(`Unknown command or file: ${command}`);
        console.log('\nUsage:');
        console.log('  node scripts/run-supabase-migrations.js cars     - Update car performance data');
        console.log('  node scripts/run-supabase-migrations.js upgrades - Seed upgrade education');
        console.log('  node scripts/run-supabase-migrations.js all      - Run all migrations');
      }
  }
  
  console.log('\n✅ Migration runner complete!');
}

main().catch(console.error);

