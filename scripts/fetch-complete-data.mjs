import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  // Try to read from .env.local
  const envFile = '.env.local';
  try {
    const { readFileSync } = await import('fs');
    const envContent = readFileSync(envFile, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') process.env.NEXT_PUBLIC_SUPABASE_URL = value;
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') process.env.SUPABASE_SERVICE_ROLE_KEY = value;
    }
  } catch (e) {
    console.error('Could not load env vars');
    process.exit(1);
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fetchAll() {
  console.log('Fetching all vehicles...');
  
  const { data: cars, error } = await supabase
    .from('cars')
    .select('*, car_tuning_profiles(*)')
    .order('brand')
    .order('name');
  
  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  
  console.log(`Fetched ${cars.length} vehicles`);
  
  // Flatten the tuning profile into the car object
  const flattened = cars.map(car => {
    const tp = car.car_tuning_profiles?.[0] || {};
    const { car_tuning_profiles, embedding, search_vector, ai_searchable_text, ...carData } = car;
    
    return {
      ...carData,
      // Add tuning profile fields with tp_ prefix
      tp_engine_family: tp.engine_family,
      tp_tuning_focus: tp.tuning_focus,
      tp_stock_whp: tp.stock_whp,
      tp_stock_wtq: tp.stock_wtq,
      tp_data_quality_tier: tp.data_quality_tier,
      tp_verified: tp.verified,
      tp_stage_progressions: tp.stage_progressions,
      tp_tuning_platforms: tp.tuning_platforms,
      tp_power_limits: tp.power_limits,
      tp_brand_recommendations: tp.brand_recommendations,
      tp_upgrades_by_objective: tp.upgrades_by_objective,
      tp_platform_insights: tp.platform_insights,
      tp_curated_packages: tp.curated_packages,
      tp_youtube_insights: tp.youtube_insights,
      tp_data_sources: tp.data_sources,
      tp_research_sources: tp.research_sources,
      tp_notes: tp.notes,
    };
  });
  
  // Count fields
  const fieldCount = Object.keys(flattened[0]).length;
  console.log(`${fieldCount} fields per vehicle`);
  
  // Save to JSON
  const date = new Date().toISOString().split('T')[0];
  const filename = `audit/vehicle_COMPLETE_${date}.json`;
  writeFileSync(filename, JSON.stringify(flattened, null, 2));
  console.log(`Saved to: ${filename}`);
  
  // Also show file size
  const { statSync } = await import('fs');
  const stats = statSync(filename);
  console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
}

fetchAll();
