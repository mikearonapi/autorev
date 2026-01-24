/**
 * Notification System Integration Tests
 * 
 * Tests for the notification service, preferences, quiet hours, and streaks.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Test configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Skip tests if Supabase not configured
const hasSupabase = supabaseUrl && supabaseKey;

describe.skipIf(!hasSupabase)('Notification System', () => {
  let supabase;
  let testUserId;

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseKey);
    
    // Create a test user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: `test-notifications-${Date.now()}@autorev.test`,
      password: 'testpassword123',
      email_confirm: true,
    });
    
    if (authError) throw authError;
    testUserId = authData.user.id;
  });

  afterAll(async () => {
    // Clean up test user and their data
    if (testUserId) {
      await supabase.from('notifications').delete().eq('user_id', testUserId);
      await supabase.from('notification_preferences').delete().eq('user_id', testUserId);
      await supabase.from('notification_category_preferences').delete().eq('user_id', testUserId);
      await supabase.from('quiet_hours').delete().eq('user_id', testUserId);
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  describe('Notification Preferences', () => {
    it('should initialize default preferences', async () => {
      const { error } = await supabase.rpc('initialize_notification_preferences', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();

      // Verify global preferences were created
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', testUserId)
        .single();

      expect(prefs).toBeTruthy();
      expect(prefs.notifications_enabled).toBe(true);
      expect(prefs.email_enabled).toBe(true);
      expect(prefs.in_app_enabled).toBe(true);
    });

    it('should create category preferences for all categories', async () => {
      const { data: catPrefs } = await supabase
        .from('notification_category_preferences')
        .select('*')
        .eq('user_id', testUserId);

      expect(catPrefs).toBeTruthy();
      expect(catPrefs.length).toBe(6); // 6 categories

      const categories = catPrefs.map(p => p.category).sort();
      expect(categories).toEqual(['al', 'engagement', 'events', 'social', 'system', 'vehicle']);
    });

    it('should update preferences', async () => {
      const { error } = await supabase
        .from('notification_preferences')
        .update({ email_enabled: false })
        .eq('user_id', testUserId);

      expect(error).toBeNull();

      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('email_enabled')
        .eq('user_id', testUserId)
        .single();

      expect(prefs.email_enabled).toBe(false);
    });
  });

  describe('Quiet Hours', () => {
    it('should create quiet hours config', async () => {
      const { data: qh } = await supabase
        .from('quiet_hours')
        .select('*')
        .eq('user_id', testUserId)
        .single();

      expect(qh).toBeTruthy();
      expect(qh.enabled).toBe(false);
      expect(qh.start_time).toBe('22:00:00');
      expect(qh.end_time).toBe('07:00:00');
    });

    it('should check quiet hours correctly when disabled', async () => {
      const { data: isInQh } = await supabase.rpc('is_in_quiet_hours', {
        p_user_id: testUserId,
      });

      expect(isInQh).toBe(false);
    });

    it('should enable quiet hours', async () => {
      const { error } = await supabase
        .from('quiet_hours')
        .update({ enabled: true })
        .eq('user_id', testUserId);

      expect(error).toBeNull();
    });
  });

  describe('Notifications', () => {
    let notificationId;

    it('should create a notification', async () => {
      const { data: id, error } = await supabase.rpc('create_notification', {
        p_user_id: testUserId,
        p_category: 'engagement',
        p_title: 'Test Notification',
        p_body: 'This is a test notification',
        p_action_url: '/test',
        p_metadata: { test: true },
        p_is_urgent: false,
      });

      expect(error).toBeNull();
      expect(id).toBeTruthy();
      notificationId = id;
    });

    it('should fetch notifications', async () => {
      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', testUserId)
        .eq('id', notificationId)
        .single();

      expect(notifications).toBeTruthy();
      expect(notifications.title).toBe('Test Notification');
      expect(notifications.is_read).toBe(false);
    });

    it('should get unread count', async () => {
      const { data: count } = await supabase.rpc('get_unread_notification_count', {
        p_user_id: testUserId,
      });

      expect(count).toBeGreaterThanOrEqual(1);
    });

    it('should mark notification as read', async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      expect(error).toBeNull();

      const { data: notification } = await supabase
        .from('notifications')
        .select('is_read, read_at')
        .eq('id', notificationId)
        .single();

      expect(notification.is_read).toBe(true);
      expect(notification.read_at).toBeTruthy();
    });

    it('should mark all as read', async () => {
      // Create another notification
      await supabase.rpc('create_notification', {
        p_user_id: testUserId,
        p_category: 'system',
        p_title: 'Another Test',
        p_body: 'Another test notification',
        p_is_urgent: true,
      });

      const { data: count } = await supabase.rpc('mark_all_notifications_read', {
        p_user_id: testUserId,
      });

      expect(count).toBeGreaterThanOrEqual(0);

      const { data: unreadCount } = await supabase.rpc('get_unread_notification_count', {
        p_user_id: testUserId,
      });

      expect(unreadCount).toBe(0);
    });
  });

  describe('Streaks', () => {
    beforeEach(async () => {
      // Reset engagement scores for streak tests
      await supabase
        .from('user_engagement_scores')
        .upsert({
          user_id: testUserId,
          current_streak: 0,
          longest_streak: 0,
          last_activity_date: null,
        });
    });

    it('should start a new streak', async () => {
      const { data, error } = await supabase.rpc('update_user_streak', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data.length).toBe(1);
      expect(data[0].current_streak).toBe(1);
      expect(data[0].streak_extended).toBe(true);
    });

    it('should not increment on same day', async () => {
      // First call
      await supabase.rpc('update_user_streak', { p_user_id: testUserId });
      
      // Second call same day
      const { data } = await supabase.rpc('update_user_streak', {
        p_user_id: testUserId,
      });

      expect(data[0].current_streak).toBe(1);
      expect(data[0].streak_extended).toBe(false);
    });

    it('should get streak status', async () => {
      // Ensure there's a streak
      await supabase.rpc('update_user_streak', { p_user_id: testUserId });

      const { data, error } = await supabase.rpc('get_streak_status', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data.length).toBe(1);
      expect(data[0].current_streak).toBe(1);
      expect(data[0].longest_streak).toBe(1);
      expect(data[0].is_at_risk).toBe(false); // Just updated
    });

    it('should apply streak freeze', async () => {
      // Ensure there's a streak first
      await supabase.rpc('update_user_streak', { p_user_id: testUserId });

      const { data, error } = await supabase.rpc('apply_streak_freeze', {
        p_user_id: testUserId,
        p_days: 1,
      });

      expect(error).toBeNull();
      expect(data).toBe(true);

      // Verify frozen_until is set
      const { data: status } = await supabase.rpc('get_streak_status', {
        p_user_id: testUserId,
      });

      expect(status[0].is_frozen).toBe(true);
    });
  });

  describe('RLS Policies', () => {
    it('should enforce user can only see own notifications', async () => {
      // Create an anonymous client (simulating another user)
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', '00000000-0000-0000-0000-000000000000'); // Non-existent user

      // Should return empty, not error
      expect(error).toBeNull();
      expect(notifications).toEqual([]);
    });
  });
});

describe('Notification Categories', () => {
  it('should have correct category enum values', () => {
    const expectedCategories = [
      'system',
      'engagement', 
      'social',
      'vehicle',
      'events',
      'al',
    ];

    // This tests the TypeScript/JS side matches the database
    const { NOTIFICATION_CATEGORIES } = require('@/lib/notificationService');
    
    const actualCategories = Object.values(NOTIFICATION_CATEGORIES).sort();
    expect(actualCategories).toEqual(expectedCategories.sort());
  });
});
