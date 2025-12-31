/**
 * Feature Usage API
 * 
 * POST /api/analytics/feature
 * 
 * Tracks which features users engage with.
 * Used for feature adoption analysis and prioritization.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Feature categories for organization
const FEATURE_CATEGORIES = {
  // Core features
  'car_browse': 'core',
  'car_view': 'core',
  'car_search': 'core',
  'car_filter': 'core',
  
  // Engagement features
  'car_favorite': 'engagement',
  'car_compare': 'engagement',
  'car_share': 'engagement',
  
  // Account features
  'garage': 'account',
  'profile': 'account',
  'settings': 'account',
  
  // Premium features
  'al_chat': 'premium',
  'tuning_shop': 'premium',
  'mod_planner': 'premium',
  'vehicle_health': 'premium',
  
  // Community
  'events': 'community',
  'community': 'community',
  
  // Discovery
  'encyclopedia': 'discovery',
  'daily_dose': 'discovery'
};

export async function POST(request) {
  try {
    const body = await request.json();
    
    const {
      sessionId,
      userId,
      featureKey,
      entryPath,
      carContext,
      timeSpentSeconds
    } = body;
    
    // Validate required fields
    if (!sessionId || !featureKey) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const featureCategory = FEATURE_CATEGORIES[featureKey] || 'other';
    
    if (userId) {
      // For logged-in users, upsert to aggregate usage
      const { error } = await supabase
        .from('feature_usage')
        .upsert(
          {
            user_id: userId,
            session_id: sessionId,
            feature_key: featureKey,
            feature_category: featureCategory,
            entry_path: entryPath || null,
            car_context: carContext || null,
            usage_count: 1,
            total_time_seconds: timeSpentSeconds || 0,
            last_used_at: new Date().toISOString()
          },
          {
            onConflict: 'user_id,feature_key',
            ignoreDuplicates: false
          }
        );
      
      if (error) {
        // If upsert fails (likely no unique constraint), do insert
        await supabase.from('feature_usage').insert({
          user_id: userId,
          session_id: sessionId,
          feature_key: featureKey,
          feature_category: featureCategory,
          entry_path: entryPath || null,
          car_context: carContext || null
        });
      }
    } else {
      // For anonymous users, just insert
      await supabase
        .from('feature_usage')
        .insert({
          session_id: sessionId,
          feature_key: featureKey,
          feature_category: featureCategory,
          entry_path: entryPath || null,
          car_context: carContext || null
        });
    }
    
    return Response.json({ success: true });
    
  } catch (error) {
    console.error('[Feature API] Error:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

