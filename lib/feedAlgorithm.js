/**
 * Community Feed Algorithm
 * 
 * A future-proof recommendation system that scores and ranks content
 * based on recency, engagement, relevance, learned preferences, and controlled randomness.
 * 
 * Features:
 * - Recency decay (newer content surfaces)
 * - Engagement scoring (popular content rises)
 * - Personalization (based on user's garage, favorites, views)
 * - Learned preferences (from interaction history)
 * - Diversity rules (prevents repetitive feeds)
 * - Session-consistent randomness
 */

import { createClient } from '@supabase/supabase-js';

// Supabase client for tracking (uses service role for writes)
const getSupabaseAdmin = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
};

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  // Weight distribution (should sum to 1.0)
  weights: {
    recency: 0.25,
    engagement: 0.25,
    relevance: 0.20,
    learned: 0.20,       // New: learned preferences from interaction history
    random: 0.10,
  },
  
  // Recency decay settings
  recency: {
    halfLifeDays: 3,
    maxAgeDays: 30,
    minScore: 0.1,
  },
  
  // Engagement scoring multipliers
  engagement: {
    likeWeight: 2,
    commentWeight: 3,
    viewWeight: 0.05,
    shareWeight: 5,
    maxScore: 100,
  },
  
  // Relevance scoring (from profile data)
  relevance: {
    userOwnsSameCar: 30,
    userOwnsSameMake: 15,
    userFavoritedCar: 20,
    userViewedCarRecently: 10,
    similarPowerRange: 10,
    sameObjective: 15,
  },
  
  // Learned preference scoring (from interaction history)
  learned: {
    likedSameCar: 40,          // User has liked builds of this car before
    likedSameMake: 25,         // User has liked builds of this make before
    dwelledOnSimilar: 15,      // User spent time on similar builds
    detailViewedSimilar: 20,   // User tapped into similar builds
    skippedSameCar: -20,       // User consistently skips this car (negative)
    skippedSameMake: -10,      // User consistently skips this make (negative)
  },
  
  // Diversity rules
  diversity: {
    maxConsecutiveSameAuthor: 1,
    maxSameCarInTop10: 2,
    boostUnderrepresentedMakes: true,
  },
  
  // Boosts
  boosts: {
    featured: 1.5,
    staffPick: 1.3,
    verified: 1.1,
  },
  
  // Learning thresholds
  learning: {
    minInteractionsForConfidence: 10,   // Need this many interactions to trust learned prefs
    preferenceDecayDays: 30,            // Older interactions matter less
    positiveActions: ['like', 'comment', 'share', 'detail_view', 'dwell'],
    negativeActions: ['swipe_past'],
  },
};

// =============================================================================
// SCORING FUNCTIONS
// =============================================================================

/**
 * Calculate recency score using exponential decay
 */
function calculateRecencyScore(publishedAt) {
  const now = new Date();
  const published = new Date(publishedAt);
  const ageInDays = (now - published) / (1000 * 60 * 60 * 24);
  
  if (ageInDays > CONFIG.recency.maxAgeDays) {
    return CONFIG.recency.minScore;
  }
  
  const lambda = Math.LN2 / CONFIG.recency.halfLifeDays;
  const score = Math.exp(-lambda * ageInDays);
  
  return Math.max(score, CONFIG.recency.minScore);
}

/**
 * Calculate engagement score from interactions
 */
function calculateEngagementScore(post) {
  const {
    like_count = 0,
    comment_count = 0,
    view_count = 0,
    share_count = 0,
  } = post;
  
  const rawScore = 
    (like_count * CONFIG.engagement.likeWeight) +
    (comment_count * CONFIG.engagement.commentWeight) +
    (view_count * CONFIG.engagement.viewWeight) +
    (share_count * CONFIG.engagement.shareWeight);
  
  const normalizedScore = Math.log10(rawScore + 1) / Math.log10(CONFIG.engagement.maxScore + 1);
  
  return Math.min(normalizedScore, 1);
}

/**
 * Calculate relevance score based on user's profile (static data)
 */
function calculateRelevanceScore(post, userContext) {
  if (!userContext) return 0.5;
  
  let score = 0;
  let maxPossibleScore = 0;
  
  const {
    ownedCarSlugs = [],
    ownedMakes = [],
    favoritedCarSlugs = [],
    recentlyViewedCarSlugs = [],
    userCarHp = null,
    userObjectives = [],
  } = userContext;
  
  if (post.car_slug && ownedCarSlugs.includes(post.car_slug)) {
    score += CONFIG.relevance.userOwnsSameCar;
  }
  maxPossibleScore += CONFIG.relevance.userOwnsSameCar;
  
  if (post.car_make && ownedMakes.includes(post.car_make?.toLowerCase())) {
    score += CONFIG.relevance.userOwnsSameMake;
  }
  maxPossibleScore += CONFIG.relevance.userOwnsSameMake;
  
  if (post.car_slug && favoritedCarSlugs.includes(post.car_slug)) {
    score += CONFIG.relevance.userFavoritedCar;
  }
  maxPossibleScore += CONFIG.relevance.userFavoritedCar;
  
  if (post.car_slug && recentlyViewedCarSlugs.includes(post.car_slug)) {
    score += CONFIG.relevance.userViewedCarRecently;
  }
  maxPossibleScore += CONFIG.relevance.userViewedCarRecently;
  
  if (userCarHp && post.car_specs?.hp) {
    const hpDiff = Math.abs(userCarHp - post.car_specs.hp);
    if (hpDiff <= 50) {
      score += CONFIG.relevance.similarPowerRange;
    }
  }
  maxPossibleScore += CONFIG.relevance.similarPowerRange;
  
  if (post.build_objective && userObjectives.includes(post.build_objective)) {
    score += CONFIG.relevance.sameObjective;
  }
  maxPossibleScore += CONFIG.relevance.sameObjective;
  
  return maxPossibleScore > 0 ? score / maxPossibleScore : 0.5;
}

/**
 * Calculate learned preference score from interaction history
 */
function calculateLearnedScore(post, learnedPreferences) {
  if (!learnedPreferences || learnedPreferences.confidence_score < 0.1) {
    return 0.5; // Neutral if no learned data
  }
  
  let score = 0;
  let _maxPossibleScore = 0;
  const confidence = learnedPreferences.confidence_score;
  
  const preferredCarSlugs = learnedPreferences.preferred_car_slugs || [];
  const preferredMakes = learnedPreferences.preferred_makes || [];
  const dislikedCarSlugs = learnedPreferences.disliked_car_slugs || [];
  const dislikedMakes = learnedPreferences.disliked_makes || [];
  
  // Positive signals - cars user has engaged with
  const carPref = preferredCarSlugs.find(p => p.slug === post.car_slug);
  if (carPref) {
    score += CONFIG.learned.likedSameCar * (carPref.score || 1);
  }
  _maxPossibleScore += CONFIG.learned.likedSameCar;
  
  const makePref = preferredMakes.find(p => p.make?.toLowerCase() === post.car_make?.toLowerCase());
  if (makePref) {
    score += CONFIG.learned.likedSameMake * (makePref.score || 1);
  }
  _maxPossibleScore += CONFIG.learned.likedSameMake;
  
  // Negative signals - cars user consistently skips
  const carDislike = dislikedCarSlugs.find(p => p.slug === post.car_slug);
  if (carDislike) {
    score += CONFIG.learned.skippedSameCar * (carDislike.score || 1);
  }
  
  const makeDislike = dislikedMakes.find(p => p.make?.toLowerCase() === post.car_make?.toLowerCase());
  if (makeDislike) {
    score += CONFIG.learned.skippedSameMake * (makeDislike.score || 1);
  }
  
  // Normalize to 0-1 range, accounting for possible negative scores
  const minScore = CONFIG.learned.skippedSameCar + CONFIG.learned.skippedSameMake;
  const maxScore = CONFIG.learned.likedSameCar + CONFIG.learned.likedSameMake;
  const normalizedScore = (score - minScore) / (maxScore - minScore);
  
  // Apply confidence factor - less confident = closer to neutral (0.5)
  return 0.5 + (normalizedScore - 0.5) * confidence;
}

/**
 * Generate seeded random number for consistent randomness
 */
function seededRandom(seed, postId) {
  const str = `${seed}-${postId}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(Math.sin(hash));
}

/**
 * Apply boost multipliers
 */
function calculateBoostMultiplier(post) {
  let multiplier = 1.0;
  
  if (post.is_featured) multiplier *= CONFIG.boosts.featured;
  if (post.is_staff_pick) multiplier *= CONFIG.boosts.staffPick;
  if (post.is_verified) multiplier *= CONFIG.boosts.verified;
  
  return multiplier;
}

// =============================================================================
// MAIN ALGORITHM
// =============================================================================

/**
 * Score a single post
 */
function scorePost(post, options = {}) {
  const {
    userContext = null,
    learnedPreferences = null,
    sessionSeed = 'default',
  } = options;
  
  const recencyScore = calculateRecencyScore(post.published_at || post.created_at);
  const engagementScore = calculateEngagementScore(post);
  const relevanceScore = calculateRelevanceScore(post, userContext);
  const learnedScore = calculateLearnedScore(post, learnedPreferences);
  const randomScore = seededRandom(sessionSeed, post.id);
  
  const baseScore = 
    (recencyScore * CONFIG.weights.recency) +
    (engagementScore * CONFIG.weights.engagement) +
    (relevanceScore * CONFIG.weights.relevance) +
    (learnedScore * CONFIG.weights.learned) +
    (randomScore * CONFIG.weights.random);
  
  const boostMultiplier = calculateBoostMultiplier(post);
  const finalScore = baseScore * boostMultiplier;
  
  return {
    ...post,
    _feedScore: finalScore,
    _scoreBreakdown: {
      recency: recencyScore,
      engagement: engagementScore,
      relevance: relevanceScore,
      learned: learnedScore,
      random: randomScore,
      boost: boostMultiplier,
      final: finalScore,
    },
  };
}

/**
 * Apply diversity rules
 */
function applyDiversityRules(scoredPosts) {
  if (scoredPosts.length <= 1) return scoredPosts;
  
  const result = [];
  const remaining = [...scoredPosts];
  const carCounts = {};
  
  while (remaining.length > 0) {
    let bestIndex = -1;
    
    for (let i = 0; i < remaining.length; i++) {
      const post = remaining[i];
      const authorId = post.author?.id || post.user_id;
      const carSlug = post.car_slug;
      
      const lastPost = result[result.length - 1];
      const lastAuthorId = lastPost?.author?.id || lastPost?.user_id;
      
      if (lastAuthorId && authorId === lastAuthorId && remaining.length > 1) {
        continue;
      }
      
      if (result.length < 10 && carSlug) {
        const carCount = carCounts[carSlug] || 0;
        if (carCount >= CONFIG.diversity.maxSameCarInTop10 && remaining.length > 1) {
          continue;
        }
      }
      
      bestIndex = i;
      break;
    }
    
    if (bestIndex === -1) bestIndex = 0;
    
    const selected = remaining.splice(bestIndex, 1)[0];
    result.push(selected);
    
    const carSlug = selected.car_slug;
    if (carSlug) carCounts[carSlug] = (carCounts[carSlug] || 0) + 1;
  }
  
  return result;
}

/**
 * Main entry point: Score and rank posts
 */
export function rankFeed(posts, options = {}) {
  const {
    userContext = null,
    learnedPreferences = null,
    sessionSeed = Date.now().toString(),
    limit = 20,
    skipDiversity = false,
  } = options;
  
  const scoredPosts = posts.map(post => 
    scorePost(post, { userContext, learnedPreferences, sessionSeed })
  );
  
  scoredPosts.sort((a, b) => b._feedScore - a._feedScore);
  
  const diversifiedPosts = skipDiversity 
    ? scoredPosts 
    : applyDiversityRules(scoredPosts);
  
  return diversifiedPosts.slice(0, limit);
}

/**
 * Build user context from profile data
 */
export function buildUserContext(userData) {
  if (!userData) return null;
  
  const {
    ownedVehicles = [],
    favorites = [],
    recentViews = [],
    projects = [],
  } = userData;
  
  return {
    ownedCarSlugs: ownedVehicles.map(v => v.car_slug).filter(Boolean),
    ownedMakes: [...new Set(ownedVehicles.map(v => v.make?.toLowerCase()).filter(Boolean))],
    favoritedCarSlugs: favorites.map(f => f.car_slug).filter(Boolean),
    recentlyViewedCarSlugs: recentViews.map(v => v.car_slug).filter(Boolean),
    userCarHp: ownedVehicles[0]?.hp || null,
    userObjectives: [...new Set(projects.map(p => p.objective).filter(Boolean))],
  };
}

// =============================================================================
// TRACKING FUNCTIONS - Write to Database
// =============================================================================

/**
 * Track a feed impression (posts shown to user)
 */
export async function trackFeedImpression(userId, posts, sessionId) {
  if (!posts || posts.length === 0) return;
  
  try {
    const supabase = getSupabaseAdmin();
    
    const interactions = posts.map((post, index) => ({
      user_id: userId || null,
      session_id: sessionId,
      post_id: post.id,
      car_slug: post.car_slug || null,
      car_make: post.car_make || null,
      car_id: post.car_id || null,
      action: 'impression',
      feed_position: index,
    }));
    
    const { error } = await supabase
      .from('feed_interactions')
      .insert(interactions);
    
    if (error) {
      console.error('[FeedAlgorithm] Error tracking impressions:', error);
    }
  } catch (err) {
    console.error('[FeedAlgorithm] Failed to track impressions:', err);
  }
}

/**
 * Track a single user engagement
 */
export async function trackEngagement(params) {
  const {
    userId,
    sessionId,
    postId,
    carSlug,
    carMake,
    carId,
    action,
    feedPosition,
    dwellTimeMs,
  } = params;
  
  try {
    const supabase = getSupabaseAdmin();
    
    const { error } = await supabase
      .from('feed_interactions')
      .insert({
        user_id: userId || null,
        session_id: sessionId,
        post_id: postId,
        car_slug: carSlug || null,
        car_make: carMake || null,
        car_id: carId || null,
        action,
        feed_position: feedPosition,
        dwell_time_ms: dwellTimeMs || null,
      });
    
    if (error) {
      console.error('[FeedAlgorithm] Error tracking engagement:', error);
    }
  } catch (err) {
    console.error('[FeedAlgorithm] Failed to track engagement:', err);
  }
}

/**
 * Get user's learned preferences from the database
 */
export async function getLearnedPreferences(userId) {
  if (!userId) return null;
  
  try {
    const supabase = getSupabaseAdmin();
    
    const PREF_COLS = 'id, user_id, preferred_categories, blocked_users, content_freshness_weight, engagement_weight, diversity_weight, created_at, updated_at';
    
    const { data, error } = await supabase
      .from('user_feed_preferences')
      .select(PREF_COLS)
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('[FeedAlgorithm] Error fetching preferences:', error);
    }
    
    return data || null;
  } catch (err) {
    console.error('[FeedAlgorithm] Failed to fetch preferences:', err);
    return null;
  }
}

// =============================================================================
// PREFERENCE LEARNING - Calculate and Update
// =============================================================================

/**
 * Recalculate user preferences from interaction history
 * This should be called periodically (cron) or after significant engagement
 */
export async function recalculateUserPreferences(userId) {
  if (!userId) return null;
  
  try {
    const supabase = getSupabaseAdmin();
    
    // Get user's interaction history (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const INTERACTION_COLS = 'id, user_id, post_id, interaction_type, dwell_time_ms, created_at';
    
    const { data: interactions, error } = await supabase
      .from('feed_interactions')
      .select(INTERACTION_COLS)
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[FeedAlgorithm] Error fetching interactions:', error);
      return null;
    }
    
    if (!interactions || interactions.length === 0) {
      return null;
    }
    
    // Aggregate interactions by car and make
    const carScores = {};
    const makeScores = {};
    let _totalPositive = 0;
    let _totalNegative = 0;
    let totalDwellTime = 0;
    let dwellCount = 0;
    
    for (const interaction of interactions) {
      const { car_slug, car_make, action, dwell_time_ms } = interaction;
      
      // Calculate age-based weight (newer = more important)
      const ageInDays = (Date.now() - new Date(interaction.created_at)) / (1000 * 60 * 60 * 24);
      const ageWeight = Math.exp(-ageInDays / CONFIG.learning.preferenceDecayDays);
      
      // Determine if positive or negative action
      const isPositive = CONFIG.learning.positiveActions.includes(action);
      const isNegative = CONFIG.learning.negativeActions.includes(action);
      
      // Score multipliers by action type
      const actionWeights = {
        like: 3,
        comment: 4,
        share: 5,
        detail_view: 2,
        dwell: 1.5,
        swipe_past: -1,
        impression: 0, // Neutral
        view: 0.5,
      };
      
      const actionWeight = actionWeights[action] || 0;
      const score = actionWeight * ageWeight;
      
      // Aggregate by car
      if (car_slug) {
        if (!carScores[car_slug]) {
          carScores[car_slug] = { positive: 0, negative: 0, total: 0 };
        }
        if (isPositive) carScores[car_slug].positive += score;
        if (isNegative) carScores[car_slug].negative += Math.abs(score);
        carScores[car_slug].total += score;
      }
      
      // Aggregate by make
      if (car_make) {
        const makeLower = car_make.toLowerCase();
        if (!makeScores[makeLower]) {
          makeScores[makeLower] = { positive: 0, negative: 0, total: 0 };
        }
        if (isPositive) makeScores[makeLower].positive += score;
        if (isNegative) makeScores[makeLower].negative += Math.abs(score);
        makeScores[makeLower].total += score;
      }
      
      // Track totals
      if (isPositive) _totalPositive++;
      if (isNegative) _totalNegative++;
      
      // Track dwell time
      if (dwell_time_ms) {
        totalDwellTime += dwell_time_ms;
        dwellCount++;
      }
    }
    
    // Convert to preference arrays
    const preferredCarSlugs = Object.entries(carScores)
      .filter(([_, s]) => s.total > 0)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 20)
      .map(([slug, s]) => ({ 
        slug, 
        score: Math.min(s.total / 10, 1), // Normalize to 0-1
        interactions: s.positive 
      }));
    
    const dislikedCarSlugs = Object.entries(carScores)
      .filter(([_, s]) => s.negative > s.positive * 2) // More than 2x negative
      .sort((a, b) => b[1].negative - a[1].negative)
      .slice(0, 10)
      .map(([slug, s]) => ({ 
        slug, 
        score: Math.min(s.negative / 10, 1),
        interactions: s.negative 
      }));
    
    const preferredMakes = Object.entries(makeScores)
      .filter(([_, s]) => s.total > 0)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10)
      .map(([make, s]) => ({ 
        make, 
        score: Math.min(s.total / 10, 1),
        interactions: s.positive 
      }));
    
    const dislikedMakes = Object.entries(makeScores)
      .filter(([_, s]) => s.negative > s.positive * 2)
      .sort((a, b) => b[1].negative - a[1].negative)
      .slice(0, 5)
      .map(([make, s]) => ({ 
        make, 
        score: Math.min(s.negative / 10, 1),
        interactions: s.negative 
      }));
    
    // Calculate confidence score (0-1)
    const totalInteractions = interactions.length;
    const confidence = Math.min(totalInteractions / CONFIG.learning.minInteractionsForConfidence, 1);
    
    // Build preferences object
    const preferences = {
      user_id: userId,
      preferred_car_slugs: preferredCarSlugs,
      preferred_makes: preferredMakes,
      disliked_car_slugs: dislikedCarSlugs,
      disliked_makes: dislikedMakes,
      total_interactions: totalInteractions,
      total_likes: interactions.filter(i => i.action === 'like').length,
      total_comments: interactions.filter(i => i.action === 'comment').length,
      total_detail_views: interactions.filter(i => i.action === 'detail_view').length,
      avg_dwell_time_ms: dwellCount > 0 ? Math.round(totalDwellTime / dwellCount) : 0,
      confidence_score: confidence,
      last_interaction_at: interactions[0]?.created_at,
      model_version: 1,
    };
    
    // Upsert preferences
    const { data, error: upsertError } = await supabase
      .from('user_feed_preferences')
      .upsert(preferences, { onConflict: 'user_id' })
      .select()
      .single();
    
    if (upsertError) {
      console.error('[FeedAlgorithm] Error upserting preferences:', upsertError);
      return null;
    }
    
    console.log(`[FeedAlgorithm] Updated preferences for user ${userId}: ${totalInteractions} interactions, ${confidence.toFixed(2)} confidence`);
    
    return data;
  } catch (err) {
    console.error('[FeedAlgorithm] Failed to recalculate preferences:', err);
    return null;
  }
}

// Export config for testing/tuning
export { CONFIG as FEED_CONFIG };
