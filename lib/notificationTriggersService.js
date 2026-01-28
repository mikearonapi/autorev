/**
 * Notification Triggers
 * 
 * Central place for triggering notifications based on user actions and events.
 * Call these functions from relevant services to send contextual notifications.
 * 
 * @module lib/notificationTriggers
 */

import {
  notifyEngagementMilestone,
  notifyVehicleAlert,
  notifySocialActivity,
  notifyEvent,
  notifySystem,
} from './notificationService';

// =============================================================================
// ENGAGEMENT TRIGGERS
// =============================================================================

/**
 * Trigger notification for first car added
 */
export async function triggerFirstCarNotification(userId) {
  return notifyEngagementMilestone(userId, 'first_car');
}

/**
 * Trigger notification for first AL conversation
 */
export async function triggerFirstALChatNotification(userId) {
  return notifyEngagementMilestone(userId, 'first_al_chat');
}

/**
 * Trigger notification for first build saved
 */
export async function triggerFirstBuildNotification(userId) {
  return notifyEngagementMilestone(userId, 'first_build');
}

/**
 * Trigger notification for first event saved
 */
export async function triggerFirstEventNotification(userId) {
  return notifyEngagementMilestone(userId, 'first_event');
}

/**
 * Trigger notification for streak milestone
 */
export async function triggerStreakMilestoneNotification(userId, days) {
  const milestoneKey = `streak_${days}`;
  return notifyEngagementMilestone(userId, milestoneKey);
}

/**
 * Trigger notification for tier upgrade
 */
export async function triggerTierUpgradeNotification(userId, newTier, previousTier) {
  return notifyEngagementMilestone(userId, 'tier_upgrade', { newTier, previousTier });
}

/**
 * Trigger notification for returning user
 */
export async function triggerReturnUserNotification(userId, daysAway) {
  return notifyEngagementMilestone(userId, 'return_7d', { daysAway });
}

// =============================================================================
// VEHICLE TRIGGERS
// =============================================================================

/**
 * Trigger notification for new recall affecting user's vehicle
 * 
 * @param {string} userId - User's UUID
 * @param {Object} vehicleInfo - { year, make, model, slug }
 * @param {Object} recallInfo - { campaignNumber, summary }
 */
export async function triggerRecallNotification(userId, vehicleInfo, recallInfo) {
  return notifyVehicleAlert(userId, 'recall', vehicleInfo, {
    recallSummary: recallInfo.summary,
    campaignNumber: recallInfo.campaignNumber,
  });
}

/**
 * Trigger notification for known issue matching user's vehicle
 * 
 * @param {string} userId - User's UUID
 * @param {Object} vehicleInfo - { year, make, model, slug }
 * @param {Object} issueInfo - { title, severity }
 */
export async function triggerKnownIssueNotification(userId, vehicleInfo, issueInfo) {
  return notifyVehicleAlert(userId, 'known_issue', vehicleInfo, {
    issueSummary: issueInfo.title,
    severity: issueInfo.severity,
  });
}

/**
 * Trigger notification for maintenance reminder
 * 
 * @param {string} userId - User's UUID
 * @param {Object} vehicleInfo - { year, make, model, slug }
 * @param {Object} maintenanceInfo - { item, dueDate, mileage }
 */
export async function triggerMaintenanceNotification(userId, vehicleInfo, maintenanceInfo) {
  return notifyVehicleAlert(userId, 'maintenance', vehicleInfo, {
    maintenanceItem: maintenanceInfo.item,
    dueDate: maintenanceInfo.dueDate,
    mileage: maintenanceInfo.mileage,
  });
}

// =============================================================================
// SOCIAL TRIGGERS
// =============================================================================

/**
 * Trigger notification for new comment on user's build
 * 
 * @param {string} ownerId - Build owner's UUID
 * @param {string} commenterName - Name of the person who commented
 * @param {Object} buildInfo - { name, url }
 * @param {string} comment - Comment text
 */
export async function triggerCommentNotification(ownerId, commenterName, buildInfo, comment) {
  return notifySocialActivity(ownerId, 'comment', commenterName, {
    buildName: buildInfo.name,
    buildUrl: buildInfo.url,
    comment,
  });
}

/**
 * Trigger notification for new like on user's build
 * 
 * @param {string} ownerId - Build owner's UUID
 * @param {string} likerName - Name of the person who liked
 * @param {Object} buildInfo - { name, url }
 */
export async function triggerLikeNotification(ownerId, likerName, buildInfo) {
  return notifySocialActivity(ownerId, 'like', likerName, {
    buildName: buildInfo.name,
    buildUrl: buildInfo.url,
  });
}

/**
 * Trigger notification for new follower
 * 
 * @param {string} userId - User being followed
 * @param {string} followerName - Name of the new follower
 * @param {string} followerSlug - Follower's profile slug
 */
export async function triggerFollowNotification(userId, followerName, followerSlug) {
  return notifySocialActivity(userId, 'follow', followerName, {
    actorSlug: followerSlug,
  });
}

// =============================================================================
// EVENT TRIGGERS
// =============================================================================

/**
 * Trigger notification for event reminder (1 day before)
 * 
 * @param {string} userId - User's UUID
 * @param {Object} eventInfo - { name, slug, date }
 */
export async function triggerEventReminderNotification(userId, eventInfo) {
  return notifyEvent(userId, 'reminder', eventInfo);
}

/**
 * Trigger notification for new event near user
 * 
 * @param {string} userId - User's UUID
 * @param {Object} eventInfo - { name, slug, distance }
 */
export async function triggerNearbyEventNotification(userId, eventInfo) {
  return notifyEvent(userId, 'new_nearby', eventInfo, {
    distance: eventInfo.distance,
  });
}

/**
 * Trigger notification for event update
 * 
 * @param {string} userId - User's UUID
 * @param {Object} eventInfo - { name, slug }
 * @param {string} updateSummary - What changed
 */
export async function triggerEventUpdateNotification(userId, eventInfo, updateSummary) {
  return notifyEvent(userId, 'updated', eventInfo, { updateSummary });
}

// =============================================================================
// SYSTEM TRIGGERS
// =============================================================================

/**
 * Trigger welcome notification for new user
 */
export async function triggerWelcomeNotification(userId) {
  return notifySystem(userId, 'welcome');
}

/**
 * Trigger notification for payment failure
 */
export async function triggerPaymentFailedNotification(userId) {
  return notifySystem(userId, 'payment_failed');
}

/**
 * Trigger notification for subscription expiring
 */
export async function triggerSubscriptionExpiringNotification(userId) {
  return notifySystem(userId, 'subscription_expiring');
}

/**
 * Trigger notification for password change
 */
export async function triggerPasswordChangedNotification(userId) {
  return notifySystem(userId, 'password_changed');
}

// =============================================================================
// BATCH NOTIFICATION FUNCTIONS
// =============================================================================

/**
 * Send recall notifications to all users with affected vehicles
 * 
 * @param {Object} recallInfo - { campaignNumber, summary, affectedVehicles: [{ year, make, model }] }
 * @param {Function} getUsersForVehicle - Function to get users with a specific vehicle
 */
export async function notifyUsersAboutRecall(recallInfo, getUsersForVehicle) {
  const results = {
    success: 0,
    failed: 0,
    total: 0,
  };

  for (const vehicle of recallInfo.affectedVehicles) {
    const users = await getUsersForVehicle(vehicle.year, vehicle.make, vehicle.model);
    
    for (const user of users) {
      results.total++;
      const { error } = await triggerRecallNotification(
        user.user_id,
        { ...vehicle, slug: user.vehicle_slug },
        recallInfo
      );
      if (error) {
        results.failed++;
      } else {
        results.success++;
      }
    }
  }

  return results;
}

/**
 * Send event reminders to users who saved an event
 * 
 * @param {Object} eventInfo - { id, name, slug, date }
 * @param {Array} savedByUsers - Array of user IDs who saved the event
 */
export async function sendEventReminders(eventInfo, savedByUsers) {
  const results = {
    success: 0,
    failed: 0,
    total: savedByUsers.length,
  };

  for (const userId of savedByUsers) {
    const { error } = await triggerEventReminderNotification(userId, eventInfo);
    if (error) {
      results.failed++;
    } else {
      results.success++;
    }
  }

  return results;
}
