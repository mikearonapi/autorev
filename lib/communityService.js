/**
 * Community Service
 * 
 * Handles community posts, public garage sharing, and related operations.
 * 
 * @module lib/communityService
 */

import { supabase, isSupabaseConfigured } from './supabase';

// =============================================================================
// COMMUNITY POSTS
// =============================================================================

/**
 * Create a new community post
 * 
 * @param {Object} postData - Post data
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function createCommunityPost(postData) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Database not configured') };
  }

  const {
    userId,
    postType,
    title,
    description,
    vehicleId,
    buildId,
    carSlug,
    carName,
  } = postData;

  if (!userId || !postType || !title) {
    return { data: null, error: new Error('Missing required fields') };
  }

  try {
    // Generate slug
    const { data: slugResult } = await supabase.rpc('generate_community_post_slug', {
      p_title: title,
      p_user_id: userId,
    });

    const slug = slugResult || `post-${Date.now()}`;

    // Create post
    const { data, error } = await supabase
      .from('community_posts')
      .insert({
        user_id: userId,
        post_type: postType,
        title,
        description,
        user_vehicle_id: vehicleId || null,
        user_build_id: buildId || null,
        car_slug: carSlug || null,
        car_name: carName || null,
        slug,
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };

  } catch (err) {
    console.error('[CommunityService] Error creating post:', err);
    return { data: null, error: err };
  }
}

/**
 * Update a community post
 * 
 * @param {string} postId - Post ID
 * @param {string} userId - User ID (for verification)
 * @param {Object} updates - Fields to update
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updateCommunityPost(postId, userId, updates) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Database not configured') };
  }

  const allowedUpdates = ['title', 'description', 'is_published'];
  const sanitizedUpdates = {};
  
  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      sanitizedUpdates[key] = updates[key];
    }
  }

  try {
    const { data, error } = await supabase
      .from('community_posts')
      .update(sanitizedUpdates)
      .eq('id', postId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };

  } catch (err) {
    console.error('[CommunityService] Error updating post:', err);
    return { data: null, error: err };
  }
}

/**
 * Delete a community post
 * 
 * @param {string} postId - Post ID
 * @param {string} userId - User ID (for verification)
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function deleteCommunityPost(postId, userId) {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: new Error('Database not configured') };
  }

  try {
    const { error } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId);

    if (error) {
      return { success: false, error };
    }

    return { success: true, error: null };

  } catch (err) {
    console.error('[CommunityService] Error deleting post:', err);
    return { success: false, error: err };
  }
}

/**
 * Fetch community posts with filters
 * 
 * @param {Object} options - Query options
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function fetchCommunityPosts(options = {}) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Database not configured') };
  }

  const {
    postType = null,
    carSlug = null,
    limit = 20,
    offset = 0,
    featured = null,
  } = options;

  try {
    const { data, error } = await supabase.rpc('get_community_posts', {
      p_post_type: postType,
      p_car_slug: carSlug,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      return { data: null, error };
    }

    // Filter by featured if specified
    let results = data || [];
    if (featured === true) {
      results = results.filter(p => p.is_featured);
    }

    return { data: results, error: null };

  } catch (err) {
    console.error('[CommunityService] Error fetching posts:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetch a single community post by slug
 * 
 * @param {string} slug - Post slug
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function fetchCommunityPostBySlug(slug) {
  if (!isSupabaseConfigured || !supabase) {
    console.error('[CommunityService] Supabase not configured');
    return { data: null, error: new Error('Database not configured') };
  }

  try {
    console.log('[CommunityService] Fetching post by slug:', slug);
    const { data, error } = await supabase.rpc('get_community_post_by_slug', {
      p_slug: slug,
    });

    if (error) {
      console.error('[CommunityService] RPC error:', error.message, error.code);
      return { data: null, error };
    }

    if (!data || data.length === 0) {
      console.log('[CommunityService] No data returned for slug:', slug);
      return { data: null, error: null };
    }

    // RPC returns array, get first item
    const result = data[0];
    console.log('[CommunityService] Post found:', result.post?.id);
    
    return {
      data: {
        ...result.post,
        author: result.author,
        images: result.images || [],
        buildData: result.build_data,
        vehicleData: result.vehicle_data,
        parts: result.parts || [], // Community post specific parts
        carImageUrl: result.car_image_url, // Fallback car image
      },
      error: null,
    };

  } catch (err) {
    console.error('[CommunityService] Error fetching post:', err);
    return { data: null, error: err };
  }
}

// =============================================================================
// USER'S OWN BUILDS
// =============================================================================

/**
 * Fetch a user's own community posts/builds
 * 
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function fetchUserCommunityPosts(userId, options = {}) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Database not configured') };
  }

  const { limit = 20 } = options;

  try {
    const { data, error } = await supabase.rpc('get_user_community_posts', {
      p_user_id: userId,
      p_limit: limit,
    });

    if (error) {
      return { data: null, error };
    }

    return { data: data || [], error: null };

  } catch (err) {
    console.error('[CommunityService] Error fetching user posts:', err);
    return { data: null, error: err };
  }
}

// =============================================================================
// BUILDS EXPLORER
// =============================================================================

/**
 * Fetch builds organized by brand for Netflix-style layout
 * 
 * @param {Object} options - Query options
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function fetchBuildsByBrand(options = {}) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Database not configured') };
  }

  const { limitPerBrand = 10 } = options;

  try {
    const { data, error } = await supabase.rpc('get_builds_by_brand', {
      p_limit_per_brand: limitPerBrand,
    });

    if (error) {
      return { data: null, error };
    }

    return { data: data || [], error: null };

  } catch (err) {
    console.error('[CommunityService] Error fetching builds by brand:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetch all brands that have builds
 * 
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function fetchBuildBrands() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Database not configured') };
  }

  try {
    const { data, error } = await supabase.rpc('get_build_brands');

    if (error) {
      return { data: null, error };
    }

    return { data: data || [], error: null };

  } catch (err) {
    console.error('[CommunityService] Error fetching build brands:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetch most viewed builds
 * 
 * @param {Object} options - Query options
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function fetchMostViewedBuilds(options = {}) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Database not configured') };
  }

  const { limit = 12 } = options;

  try {
    const { data, error } = await supabase.rpc('get_community_posts', {
      p_post_type: 'build',
      p_car_slug: null,
      p_limit: limit,
      p_offset: 0,
    });

    if (error) {
      return { data: null, error };
    }

    // Sort by view count
    const sortedData = (data || []).sort((a, b) => (b.view_count || 0) - (a.view_count || 0));

    return { data: sortedData, error: null };

  } catch (err) {
    console.error('[CommunityService] Error fetching most viewed builds:', err);
    return { data: null, error: err };
  }
}

// =============================================================================
// PUBLIC PROFILE
// =============================================================================

/**
 * Update public profile settings
 * 
 * @param {string} userId - User ID
 * @param {Object} settings - Profile settings
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updatePublicProfile(userId, settings) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Database not configured') };
  }

  const {
    publicSlug,
    isGaragePublic,
    bio,
    locationCity,
    locationState,
    socialInstagram,
    socialYoutube,
  } = settings;

  try {
    const updates = {};
    
    if (publicSlug !== undefined) updates.public_slug = publicSlug;
    if (isGaragePublic !== undefined) updates.is_garage_public = isGaragePublic;
    if (bio !== undefined) updates.bio = bio;
    if (locationCity !== undefined) updates.location_city = locationCity;
    if (locationState !== undefined) updates.location_state = locationState;
    if (socialInstagram !== undefined) updates.social_instagram = socialInstagram;
    if (socialYoutube !== undefined) updates.social_youtube = socialYoutube;

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };

  } catch (err) {
    console.error('[CommunityService] Error updating profile:', err);
    return { data: null, error: err };
  }
}

/**
 * Check if a public slug is available
 * 
 * @param {string} slug - Slug to check
 * @returns {Promise<{available: boolean, error: Error|null}>}
 */
export async function checkSlugAvailability(slug) {
  if (!isSupabaseConfigured || !supabase) {
    return { available: false, error: new Error('Database not configured') };
  }

  try {
    const { data, error } = await supabase.rpc('is_public_slug_available', {
      slug,
    });

    if (error) {
      return { available: false, error };
    }

    return { available: data === true, error: null };

  } catch (err) {
    console.error('[CommunityService] Error checking slug:', err);
    return { available: false, error: err };
  }
}

/**
 * Fetch public garage data by slug
 * 
 * @param {string} slug - Public profile slug
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function fetchPublicGarage(slug) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Database not configured') };
  }

  try {
    const { data, error } = await supabase.rpc('get_public_garage', {
      p_slug: slug,
    });

    if (error) {
      return { data: null, error };
    }

    if (!data || data.length === 0) {
      return { data: null, error: null };
    }

    // RPC returns array, get first item
    const result = data[0];
    
    return {
      data: {
        profile: result.profile,
        vehicles: result.vehicles || [],
        builds: result.builds || [],
        stats: result.stats,
      },
      error: null,
    };

  } catch (err) {
    console.error('[CommunityService] Error fetching public garage:', err);
    return { data: null, error: err };
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a shareable URL for a community post
 * 
 * @param {string} slug - Post slug
 * @returns {string} Full shareable URL
 */
export function getPostShareUrl(slug) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autorev.app';
  return `${baseUrl}/community/builds/${slug}`;
}

/**
 * Generate a shareable URL for a public garage
 * 
 * @param {string} publicSlug - User's public slug
 * @returns {string} Full shareable URL
 */
export function getGarageShareUrl(publicSlug) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autorev.app';
  return `${baseUrl}/garage/${publicSlug}`;
}

/**
 * Get Facebook share URL
 * 
 * @param {string} url - URL to share
 * @returns {string} Facebook share dialog URL
 */
export function getFacebookShareUrl(url) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

/**
 * Get Twitter share URL
 * 
 * @param {string} url - URL to share
 * @param {string} text - Share text
 * @returns {string} Twitter share URL
 */
export function getTwitterShareUrl(url, text) {
  return `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

/**
 * Get Instagram share URL (copies link since Instagram doesn't support direct share)
 * Note: Instagram doesn't have a direct web share API, so we return a link to create a story
 * Users must copy the link and share manually, or use native mobile share
 * 
 * @param {string} url - URL to share
 * @returns {object} Instagram share info
 */
export function getInstagramShareInfo(url) {
  return {
    // Instagram Stories URL scheme (only works on mobile)
    storiesUrl: `instagram://story-camera`,
    // The URL to copy for manual sharing
    copyUrl: url,
    // Instructions for users
    instructions: 'Copy this link and share to your Instagram Story or bio',
  };
}

/**
 * Get native share data for use with Web Share API
 * 
 * @param {Object} options - Share options
 * @param {string} options.title - Share title
 * @param {string} options.text - Share text/description
 * @param {string} options.url - Share URL
 * @returns {Object} Data for navigator.share()
 */
export function getNativeShareData({ title, text, url }) {
  return {
    title,
    text,
    url,
  };
}

