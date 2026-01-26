'use client';

import { useState, useEffect, useCallback } from 'react';

import Image from 'next/image';

import { Icons } from '@/components/ui/Icons';
import { UI_IMAGES } from '@/lib/images';
import { CATEGORY_CONFIG } from '@/lib/notificationService';

import styles from './NotificationPreferences.module.css';

/**
 * NotificationPreferences Component
 * 
 * Allows users to manage their notification preferences including:
 * - Master toggle for all notifications
 * - Channel toggles (email, in-app)
 * - Category-specific preferences
 * - Quiet hours configuration
 */
export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Fetch preferences on mount
  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/notifications/preferences');
      if (!res.ok) throw new Error('Failed to load preferences');
      const data = await res.json();
      setPreferences(data);
    } catch (err) {
      console.error('Error fetching preferences:', err);
      setError('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  // Update preferences
  const updatePreferences = useCallback(async (updates) => {
    try {
      setSaving(true);
      setError(null);
      
      // Optimistic update
      setPreferences(prev => ({
        ...prev,
        ...updates,
        categories: updates.categories 
          ? { ...prev.categories, ...updates.categories }
          : prev.categories,
        quiet_hours: updates.quiet_hours
          ? { ...prev.quiet_hours, ...updates.quiet_hours }
          : prev.quiet_hours,
      }));

      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error('Failed to save preferences');
      
      const data = await res.json();
      setPreferences(data);
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError('Failed to save preferences');
      // Revert on error
      fetchPreferences();
    } finally {
      setSaving(false);
    }
  }, []);

  // Toggle master notifications
  const handleMasterToggle = (enabled) => {
    updatePreferences({ notifications_enabled: enabled });
  };

  // Toggle channel
  const handleChannelToggle = (channel, enabled) => {
    updatePreferences({ [`${channel}_enabled`]: enabled });
  };

  // Toggle category preference
  const handleCategoryToggle = (category, channel, enabled) => {
    updatePreferences({
      categories: {
        [category]: {
          ...preferences.categories[category],
          [`${channel}_enabled`]: enabled,
        },
      },
    });
  };

  // Update quiet hours
  const handleQuietHoursUpdate = (updates) => {
    updatePreferences({
      quiet_hours: {
        ...preferences.quiet_hours,
        ...updates,
      },
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading preferences...</div>
      </div>
    );
  }

  if (error && !preferences) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          {error}
          <button onClick={fetchPreferences} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Notification Preferences</h2>
        <p className={styles.subtitle}>
          Control how and when you receive notifications
        </p>
      </div>

      {/* Master Toggle */}
      <section className={styles.section}>
        <div className={styles.toggleRow}>
          <div className={styles.toggleInfo}>
            <span className={styles.toggleLabel}>All Notifications</span>
            <span className={styles.toggleDescription}>
              Master switch for all notification channels
            </span>
          </div>
          <Toggle
            checked={preferences?.notifications_enabled ?? true}
            onChange={handleMasterToggle}
          />
        </div>
      </section>

      {/* Channel Toggles */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Channels</h3>
        
        <div className={styles.toggleRow}>
          <div className={styles.toggleInfo}>
            <span className={styles.toggleLabel}>In-App Notifications</span>
            <span className={styles.toggleDescription}>
              Show notifications in the notification center
            </span>
          </div>
          <Toggle
            checked={preferences?.in_app_enabled ?? true}
            onChange={(v) => handleChannelToggle('in_app', v)}
            disabled={!preferences?.notifications_enabled}
          />
        </div>

        <div className={styles.toggleRow}>
          <div className={styles.toggleInfo}>
            <span className={styles.toggleLabel}>Email Notifications</span>
            <span className={styles.toggleDescription}>
              Receive notifications via email
            </span>
          </div>
          <Toggle
            checked={preferences?.email_enabled ?? true}
            onChange={(v) => handleChannelToggle('email', v)}
            disabled={!preferences?.notifications_enabled}
          />
        </div>
      </section>

      {/* Category Preferences */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Notification Types</h3>
        
        <div className={styles.categoryList}>
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
            <div key={key} className={styles.categoryRow}>
              <div className={styles.categoryInfo}>
                <CategoryIcon iconName={config.icon} color={config.color} />
                <div>
                  <span className={styles.categoryLabel}>{config.label}</span>
                  <span className={styles.categoryDescription}>
                    {config.description}
                  </span>
                </div>
              </div>
              <Toggle
                checked={
                  (preferences?.categories?.[key]?.in_app_enabled ?? true) ||
                  (preferences?.categories?.[key]?.email_enabled ?? true)
                }
                onChange={(v) => {
                  // Toggle both in-app and email together
                  handleCategoryToggle(key, 'in_app', v);
                  handleCategoryToggle(key, 'email', v);
                }}
                disabled={!preferences?.notifications_enabled || !config.canDisable}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Quiet Hours */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Quiet Hours</h3>
        <p className={styles.sectionDescription}>
          Pause non-urgent notifications during specified hours
        </p>

        <div className={styles.toggleRow}>
          <div className={styles.toggleInfo}>
            <span className={styles.toggleLabel}>Enable Quiet Hours</span>
            <span className={styles.toggleDescription}>
              Notifications will be held until quiet hours end
            </span>
          </div>
          <Toggle
            checked={preferences?.quiet_hours?.enabled ?? false}
            onChange={(v) => handleQuietHoursUpdate({ enabled: v })}
            disabled={!preferences?.notifications_enabled}
          />
        </div>

        {preferences?.quiet_hours?.enabled && (
          <div className={styles.quietHoursConfig}>
            <div className={styles.timeInputGroup}>
              <label className={styles.timeLabel}>Start Time</label>
              <input
                type="time"
                className={styles.timeInput}
                value={preferences?.quiet_hours?.start_time?.substring(0, 5) || '22:00'}
                onChange={(e) => handleQuietHoursUpdate({ 
                  start_time: e.target.value + ':00' 
                })}
              />
            </div>

            <div className={styles.timeInputGroup}>
              <label className={styles.timeLabel}>End Time</label>
              <input
                type="time"
                className={styles.timeInput}
                value={preferences?.quiet_hours?.end_time?.substring(0, 5) || '07:00'}
                onChange={(e) => handleQuietHoursUpdate({ 
                  end_time: e.target.value + ':00' 
                })}
              />
            </div>

            <div className={styles.timezoneGroup}>
              <label className={styles.timeLabel}>Timezone</label>
              <select
                className={styles.timezoneSelect}
                value={preferences?.quiet_hours?.timezone || 'UTC'}
                onChange={(e) => handleQuietHoursUpdate({ timezone: e.target.value })}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>

            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleLabel}>Allow Urgent Notifications</span>
                <span className={styles.toggleDescription}>
                  Still receive critical alerts during quiet hours
                </span>
              </div>
              <Toggle
                checked={preferences?.quiet_hours?.allow_urgent ?? true}
                onChange={(v) => handleQuietHoursUpdate({ allow_urgent: v })}
              />
            </div>
          </div>
        )}
      </section>

      {/* Saving indicator */}
      {saving && (
        <div className={styles.savingIndicator}>
          Saving...
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// TOGGLE COMPONENT
// =============================================================================

function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={`${styles.toggle} ${checked ? styles.toggleChecked : ''} ${disabled ? styles.toggleDisabled : ''}`}
      onClick={() => !disabled && onChange(!checked)}
    >
      <span className={styles.toggleThumb} />
    </button>
  );
}

// =============================================================================
// CATEGORY ICON COMPONENT
// =============================================================================

function CategoryIcon({ iconName, color }) {
  // Special case: AL uses avatar image instead of SVG icon
  if (iconName === 'al-avatar') {
    return (
      <div className={styles.categoryIconWrapper}>
        <Image
          src={UI_IMAGES.alMascot}
          alt="AL"
          width={24}
          height={24}
          className={styles.alAvatarIcon}
        />
      </div>
    );
  }

  // Render SVG icon from Icons library
  const IconComponent = Icons[iconName];
  if (!IconComponent) {
    console.warn(`[NotificationPreferences] Unknown icon: ${iconName}`);
    return null;
  }

  return (
    <div className={styles.categoryIconWrapper} style={{ color }}>
      <IconComponent size={20} />
    </div>
  );
}
