/**
 * Notification Service
 * 
 * Handles in-app notifications, user preferences, and notification delivery.
 * Integrates with the notification system database schema for managing
 * notifications, preferences, quiet hours, and delivery tracking.
 * 
 * @module lib/notificationService
 */

import { supabase, supabaseServiceRole as supabaseAdmin, isSupabaseConfigured } from './supabase';

// =============================================================================
// NOTIFICATION CATEGORIES
// =============================================================================

export const NOTIFICATION_CATEGORIES = {
  SYSTEM: 'system',        // Account, security, payment alerts
  ENGAGEMENT: 'engagement', // Milestones, streaks, achievements
  SOCIAL: 'social',        // Comments, likes on builds
  VEHICLE: 'vehicle',      // Recalls, known issues, maintenance
  EVENTS: 'events',        // Event reminders, new events nearby
  AL: 'al',                // AL conversation updates
};

// Category display configuration
// icon: name of icon from @/components/ui/Icons (or 'al-avatar' for AL's image)
export const CATEGORY_CONFIG = {
  system: {
    label: 'System',
    description: 'Account, security, and payment alerts',
    icon: 'settings',
    color: '#6b7280',
    canDisable: false, // Critical notifications
  },
  engagement: {
    label: 'Achievements',
    description: 'Milestones, streaks, and achievements',
    icon: 'trophy',
    color: '#f59e0b',
    canDisable: true,
  },
  social: {
    label: 'Social',
    description: 'Comments and likes on your builds',
    icon: 'chat',
    color: '#3b82f6',
    canDisable: true,
  },
  vehicle: {
    label: 'Vehicle Alerts',
    description: 'Recalls, known issues, maintenance reminders',
    icon: 'car',
    color: '#ef4444',
    canDisable: true,
  },
  events: {
    label: 'Events',
    description: 'Event reminders and nearby events',
    icon: 'calendar',
    color: '#8b5cf6',
    canDisable: true,
  },
  al: {
    label: 'AL Updates',
    description: 'AI assistant conversation updates',
    icon: 'al-avatar', // Special case: uses AL's image instead of SVG icon
    color: '#10b981',
    canDisable: true,
  },
};

// =============================================================================
// CREATE NOTIFICATION
// =============================================================================

/**
 * Create a notification for a user
 * Respects user preferences and quiet hours
 * 
 * @param {Object} params - Notification parameters
 * @param {string} params.userId - Target user's UUID
 * @param {string} params.category - One of NOTIFICATION_CATEGORIES
 * @param {string} params.title - Notification title
 * @param {string} params.body - Notification body text
 * @param {string} [params.actionUrl] - URL to navigate to when clicked
 * @param {Object} [params.metadata] - Additional data for the notification
 * @param {boolean} [params.isUrgent=false] - Bypass quiet hours if true
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function createNotification({
  userId,
  category,
  title,
  body,
  actionUrl = null,
  metadata = {},
  isUrgent = false,
}) {
  if (!isSupabaseConfigured || !userId) {
    console.debug('[NotificationService] Skipping - not configured or no user');
    return { data: null, error: null };
  }

  // Validate category
  if (!Object.values(NOTIFICATION_CATEGORIES).includes(category)) {
    return { data: null, error: new Error(`Invalid category: ${category}`) };
  }

  try {
    // Use the database function which handles preferences and quiet hours
    const client = supabaseAdmin || supabase;
    const { data, error } = await client.rpc('create_notification', {
      p_user_id: userId,
      p_category: category,
      p_title: title,
      p_body: body,
      p_action_url: actionUrl,
      p_metadata: metadata,
      p_is_urgent: isUrgent,
    });

    if (error) {
      console.warn('[NotificationService] Error creating notification:', error);
      return { data: null, error };
    }

    // data is the notification ID (or null if blocked by preferences)
    if (data) {
      console.debug('[NotificationService] Notification created:', data);
    } else {
      console.debug('[NotificationService] Notification blocked by preferences');
    }

    return { data: { id: data }, error: null };
  } catch (err) {
    console.error('[NotificationService] Exception:', err);
    return { data: null, error: err };
  }
}

/**
 * Create notification directly (bypasses preference checks)
 * Use for system-critical notifications only
 * 
 * @param {Object} params - Same as createNotification
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function createNotificationDirect({
  userId,
  category,
  title,
  body,
  actionUrl = null,
  metadata = {},
}) {
  if (!isSupabaseConfigured || !userId) {
    return { data: null, error: null };
  }

  try {
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('notifications')
      .insert({
        user_id: userId,
        category,
        title,
        body,
        action_url: actionUrl,
        metadata,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

// =============================================================================
// FETCH NOTIFICATIONS
// =============================================================================

/**
 * Get notifications for a user
 * 
 * @param {string} userId - User's UUID
 * @param {Object} [options] - Query options
 * @param {number} [options.limit=50] - Max notifications to return
 * @param {number} [options.offset=0] - Offset for pagination
 * @param {boolean} [options.includeRead=true] - Include read notifications
 * @param {string} [options.category] - Filter by category
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getNotifications(userId, options = {}) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error('Not configured or not authenticated') };
  }

  const {
    limit = 50,
    offset = 0,
    includeRead = true,
    category = null,
  } = options;

  try {
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (!includeRead) {
      query = query.eq('is_read', false);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error, count } = await query;

    if (error) {
      return { data: null, error };
    }

    // Get unread count separately for efficiency
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    return {
      data: {
        notifications: data || [],
        totalCount: count || 0,
        unreadCount: unreadCount || 0,
        hasMore: (offset + limit) < (count || 0),
      },
      error: null,
    };
  } catch (err) {
    console.error('[NotificationService] Exception:', err);
    return { data: null, error: err };
  }
}

/**
 * Get unread notification count for a user
 * 
 * @param {string} userId - User's UUID
 * @returns {Promise<{data: number|null, error: Error|null}>}
 */
export async function getUnreadCount(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: 0, error: null };
  }

  try {
    const { data, error } = await supabase.rpc('get_unread_notification_count', {
      p_user_id: userId,
    });

    if (error) {
      return { data: null, error };
    }

    return { data: data || 0, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

// =============================================================================
// MARK AS READ
// =============================================================================

/**
 * Mark a notification as read
 * 
 * @param {string} notificationId - Notification UUID
 * @param {string} userId - User's UUID (for security)
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function markAsRead(notificationId, userId) {
  if (!isSupabaseConfigured || !supabase || !notificationId) {
    return { data: null, error: new Error('Missing required parameters') };
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId) // Ensure user owns this notification
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Mark all notifications as read for a user
 * 
 * @param {string} userId - User's UUID
 * @returns {Promise<{data: {count: number}|null, error: Error|null}>}
 */
export async function markAllAsRead(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error('Not configured or missing user') };
  }

  try {
    const { data, error } = await supabase.rpc('mark_all_notifications_read', {
      p_user_id: userId,
    });

    if (error) {
      return { data: null, error };
    }

    return { data: { count: data || 0 }, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

// =============================================================================
// DELETE NOTIFICATION
// =============================================================================

/**
 * Delete a notification (or mark as dismissed)
 * 
 * @param {string} notificationId - Notification UUID
 * @param {string} userId - User's UUID (for security)
 * @returns {Promise<{error: Error|null}>}
 */
export async function deleteNotification(notificationId, userId) {
  if (!isSupabaseConfigured || !supabase || !notificationId) {
    return { error: new Error('Missing required parameters') };
  }

  try {
    // Mark as dismissed rather than hard delete for analytics
    const { error } = await supabase
      .from('notifications')
      .update({ dismissed_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId);

    return { error };
  } catch (err) {
    return { error: err };
  }
}

// =============================================================================
// PREFERENCES
// =============================================================================

/**
 * Get user's notification preferences
 * 
 * @param {string} userId - User's UUID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getPreferences(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error('Not configured or missing user') };
  }

  try {
    // Get global preferences
    const { data: globalPrefs, error: globalError } = await supabase
      .from('notification_preferences')
      .select('user_id, notifications_enabled, email_enabled, in_app_enabled')
      .eq('user_id', userId)
      .single();

    // Get category preferences
    const { data: categoryPrefs, error: _categoryError } = await supabase
      .from('notification_category_preferences')
      .select('user_id, category, email_enabled, in_app_enabled, frequency')
      .eq('user_id', userId);

    // Get quiet hours
    const { data: quietHours, error: _quietError } = await supabase
      .from('quiet_hours')
      .select('user_id, enabled, start_time, end_time, timezone, allow_urgent')
      .eq('user_id', userId)
      .single();

    if (globalError && globalError.code !== 'PGRST116') {
      return { data: null, error: globalError };
    }

    // Build preferences object with defaults
    const categories = {};
    Object.keys(CATEGORY_CONFIG).forEach(cat => {
      const catPref = (categoryPrefs || []).find(p => p.category === cat);
      categories[cat] = {
        email_enabled: catPref?.email_enabled ?? true,
        in_app_enabled: catPref?.in_app_enabled ?? true,
        frequency: catPref?.frequency ?? 'immediate',
      };
    });

    return {
      data: {
        notifications_enabled: globalPrefs?.notifications_enabled ?? true,
        email_enabled: globalPrefs?.email_enabled ?? true,
        in_app_enabled: globalPrefs?.in_app_enabled ?? true,
        categories,
        quiet_hours: quietHours ? {
          enabled: quietHours.enabled,
          start_time: quietHours.start_time,
          end_time: quietHours.end_time,
          timezone: quietHours.timezone,
          allow_urgent: quietHours.allow_urgent,
        } : {
          enabled: false,
          start_time: '22:00:00',
          end_time: '07:00:00',
          timezone: 'UTC',
          allow_urgent: true,
        },
      },
      error: null,
    };
  } catch (err) {
    console.error('[NotificationService] Exception:', err);
    return { data: null, error: err };
  }
}

/**
 * Update user's notification preferences
 * 
 * @param {string} userId - User's UUID
 * @param {Object} preferences - Preferences to update
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updatePreferences(userId, preferences) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error('Not configured or missing user') };
  }

  try {
    const {
      notifications_enabled,
      email_enabled,
      in_app_enabled,
      categories,
      quiet_hours,
    } = preferences;

    // Update global preferences
    if (notifications_enabled !== undefined || email_enabled !== undefined || in_app_enabled !== undefined) {
      const globalUpdate = {};
      if (notifications_enabled !== undefined) globalUpdate.notifications_enabled = notifications_enabled;
      if (email_enabled !== undefined) globalUpdate.email_enabled = email_enabled;
      if (in_app_enabled !== undefined) globalUpdate.in_app_enabled = in_app_enabled;

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...globalUpdate,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) {
        return { data: null, error };
      }
    }

    // Update category preferences
    if (categories) {
      for (const [category, prefs] of Object.entries(categories)) {
        const { error } = await supabase
          .from('notification_category_preferences')
          .upsert({
            user_id: userId,
            category,
            email_enabled: prefs.email_enabled,
            in_app_enabled: prefs.in_app_enabled,
            frequency: prefs.frequency,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,category' });

        if (error) {
          console.warn('[NotificationService] Error updating category:', category, error);
        }
      }
    }

    // Update quiet hours
    if (quiet_hours) {
      const { error } = await supabase
        .from('quiet_hours')
        .upsert({
          user_id: userId,
          enabled: quiet_hours.enabled,
          start_time: quiet_hours.start_time,
          end_time: quiet_hours.end_time,
          timezone: quiet_hours.timezone,
          allow_urgent: quiet_hours.allow_urgent,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) {
        return { data: null, error };
      }
    }

    // Return updated preferences
    return getPreferences(userId);
  } catch (err) {
    console.error('[NotificationService] Exception:', err);
    return { data: null, error: err };
  }
}

/**
 * Initialize default preferences for a new user
 * 
 * @param {string} userId - User's UUID
 * @returns {Promise<{error: Error|null}>}
 */
export async function initializePreferences(userId) {
  if (!isSupabaseConfigured || !userId) {
    return { error: null };
  }

  try {
    const client = supabaseAdmin || supabase;
    const { error } = await client.rpc('initialize_notification_preferences', {
      p_user_id: userId,
    });

    return { error };
  } catch (err) {
    return { error: err };
  }
}

// =============================================================================
// QUIET HOURS
// =============================================================================

/**
 * Check if user is currently in quiet hours
 * 
 * @param {string} userId - User's UUID
 * @returns {Promise<{data: boolean, error: Error|null}>}
 */
export async function isInQuietHours(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: false, error: null };
  }

  try {
    const { data, error } = await supabase.rpc('is_in_quiet_hours', {
      p_user_id: userId,
    });

    if (error) {
      return { data: false, error };
    }

    return { data: data || false, error: null };
  } catch (err) {
    return { data: false, error: err };
  }
}

// =============================================================================
// NOTIFICATION HELPERS
// =============================================================================

/**
 * Create engagement milestone notification
 */
export async function notifyEngagementMilestone(userId, milestone, metadata = {}) {
  const milestoneMessages = {
    first_car: {
      title: 'Welcome to Your Garage!',
      body: 'You\'ve added your first car. Start exploring maintenance schedules, recalls, and more.',
      actionUrl: '/garage',
    },
    first_al_chat: {
      title: 'Meet AL',
      body: 'You\'ve had your first conversation with AL, your automotive expert. Ask anything!',
      actionUrl: '/al',
    },
    first_build: {
      title: 'First Build Saved!',
      body: 'You\'ve saved your first community build. Keep exploring and sharing!',
      actionUrl: '/community',
    },
    first_event: {
      title: 'Event Saved!',
      body: 'You\'ve saved your first car event. Don\'t miss out!',
      actionUrl: '/events',
    },
    streak_7: {
      title: '7-Day Streak!',
      body: 'You\'re on a roll! Keep the momentum going.',
      actionUrl: '/dashboard',
    },
    streak_14: {
      title: '2-Week Streak!',
      body: 'Impressive dedication! You\'re becoming a true enthusiast.',
      actionUrl: '/dashboard',
    },
    streak_30: {
      title: '30-Day Streak!',
      body: 'A month of dedication! You\'re officially a Gearhead.',
      actionUrl: '/dashboard',
    },
    tier_upgrade: {
      title: `Level Up: ${metadata.newTier || 'New Tier'}!`,
      body: `You've earned the ${metadata.newTier || ''} title. Keep it up!`,
      actionUrl: '/dashboard',
    },
    return_7d: {
      title: 'Welcome Back!',
      body: 'Great to see you again after a week. Your garage missed you!',
      actionUrl: '/garage',
    },
  };

  const message = milestoneMessages[milestone];
  if (!message) {
    console.warn('[NotificationService] Unknown milestone:', milestone);
    return { data: null, error: new Error(`Unknown milestone: ${milestone}`) };
  }

  return createNotification({
    userId,
    category: NOTIFICATION_CATEGORIES.ENGAGEMENT,
    title: message.title,
    body: message.body,
    actionUrl: message.actionUrl,
    metadata: { milestone, ...metadata },
  });
}

/**
 * Create vehicle alert notification
 */
export async function notifyVehicleAlert(userId, alertType, vehicleInfo, metadata = {}) {
  const alertMessages = {
    recall: {
      title: `Recall Alert: ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`,
      body: metadata.recallSummary || 'A new recall has been issued for your vehicle. Tap to learn more.',
      actionUrl: `/garage/my-specs?vehicle=${vehicleInfo.slug}`,
    },
    known_issue: {
      title: `Known Issue: ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`,
      body: metadata.issueSummary || 'A common issue has been reported for your vehicle.',
      actionUrl: `/garage/my-specs?vehicle=${vehicleInfo.slug}`,
    },
    maintenance: {
      title: `Maintenance Due: ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`,
      body: metadata.maintenanceItem || 'Your vehicle has maintenance coming up.',
      actionUrl: `/garage/my-specs?vehicle=${vehicleInfo.slug}`,
    },
  };

  const message = alertMessages[alertType];
  if (!message) {
    return { data: null, error: new Error(`Unknown alert type: ${alertType}`) };
  }

  return createNotification({
    userId,
    category: NOTIFICATION_CATEGORIES.VEHICLE,
    title: message.title,
    body: message.body,
    actionUrl: message.actionUrl,
    metadata: { alertType, vehicleInfo, ...metadata },
    isUrgent: alertType === 'recall', // Recalls are urgent
  });
}

/**
 * Create social notification (comment, like, etc.)
 */
export async function notifySocialActivity(userId, activityType, actorName, metadata = {}) {
  const activityMessages = {
    comment: {
      title: 'New Comment',
      body: `${actorName} commented on your build: "${(metadata.comment || '').substring(0, 50)}${(metadata.comment || '').length > 50 ? '...' : ''}"`,
      actionUrl: metadata.buildUrl || '/community',
    },
    like: {
      title: 'Someone Liked Your Build',
      body: `${actorName} liked your ${metadata.buildName || 'build'}`,
      actionUrl: metadata.buildUrl || '/community',
    },
    follow: {
      title: 'New Follower',
      body: `${actorName} started following you`,
      actionUrl: `/garage/${metadata.actorSlug}` || '/community',
    },
  };

  const message = activityMessages[activityType];
  if (!message) {
    return { data: null, error: new Error(`Unknown activity type: ${activityType}`) };
  }

  return createNotification({
    userId,
    category: NOTIFICATION_CATEGORIES.SOCIAL,
    title: message.title,
    body: message.body,
    actionUrl: message.actionUrl,
    metadata: { activityType, actorName, ...metadata },
  });
}

/**
 * Create event notification
 */
export async function notifyEvent(userId, eventType, eventInfo, metadata = {}) {
  const eventMessages = {
    reminder: {
      title: `Reminder: ${eventInfo.name}`,
      body: `${eventInfo.name} is tomorrow! Don't forget to attend.`,
      actionUrl: `/events/${eventInfo.slug}`,
    },
    new_nearby: {
      title: 'New Event Near You',
      body: `${eventInfo.name} was just added near your location.`,
      actionUrl: `/events/${eventInfo.slug}`,
    },
    updated: {
      title: `Event Updated: ${eventInfo.name}`,
      body: metadata.updateSummary || 'An event you saved has been updated.',
      actionUrl: `/events/${eventInfo.slug}`,
    },
  };

  const message = eventMessages[eventType];
  if (!message) {
    return { data: null, error: new Error(`Unknown event type: ${eventType}`) };
  }

  return createNotification({
    userId,
    category: NOTIFICATION_CATEGORIES.EVENTS,
    title: message.title,
    body: message.body,
    actionUrl: message.actionUrl,
    metadata: { eventType, eventInfo, ...metadata },
  });
}

/**
 * Create system notification
 */
export async function notifySystem(userId, systemType, metadata = {}) {
  const systemMessages = {
    payment_failed: {
      title: 'Payment Failed',
      body: 'Your subscription payment failed. Please update your payment method.',
      actionUrl: '/settings#billing',
    },
    subscription_expiring: {
      title: 'Subscription Expiring Soon',
      body: 'Your subscription expires in 3 days. Renew to keep your benefits.',
      actionUrl: '/settings#billing',
    },
    welcome: {
      title: 'Welcome to AutoRev!',
      body: 'Start by adding your first car to your garage.',
      actionUrl: '/garage',
    },
    password_changed: {
      title: 'Password Changed',
      body: 'Your password was successfully changed. If this wasn\'t you, contact support.',
      actionUrl: '/settings',
    },
  };

  const message = systemMessages[systemType];
  if (!message) {
    return { data: null, error: new Error(`Unknown system type: ${systemType}`) };
  }

  return createNotificationDirect({
    userId,
    category: NOTIFICATION_CATEGORIES.SYSTEM,
    title: message.title,
    body: message.body,
    actionUrl: message.actionUrl,
    metadata: { systemType, ...metadata },
  });
}
