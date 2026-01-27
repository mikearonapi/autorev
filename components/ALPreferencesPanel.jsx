'use client';

/**
 * ALPreferencesPanel Component
 *
 * Simple settings for AL's data sources.
 * Each toggle enables/disables specific tools in the multi-agent system.
 *
 * Designed to be embedded in ALPageClient.
 */

import { useState, useEffect, useCallback } from 'react';

import { Icons } from '@/components/ui/Icons';
import {
  useALPreferences as useALPreferencesQuery,
  useUpdateALPreferences,
} from '@/hooks/useUserData';

import styles from './ALPreferencesPanel.module.css';

// Data source toggles - each maps to specific tools in the backend
// These are the tools that can be enabled/disabled by the user
const DATA_SOURCES = [
  {
    key: 'web_search_enabled',
    label: 'Web Research',
    description: 'Search the web for current info, news, and niche topics',
    icon: Icons.globe,
    tool: 'search_web',
  },
  {
    key: 'forum_insights_enabled',
    label: 'Forum Insights',
    description: 'Real owner experiences from enthusiast forums',
    icon: Icons.chat,
    tool: 'search_community_insights',
  },
  {
    key: 'youtube_reviews_enabled',
    label: 'Expert Reviews',
    description: 'Summaries from expert YouTube reviewers',
    icon: Icons.video,
    tool: 'get_expert_reviews',
  },
  {
    key: 'event_search_enabled',
    label: 'Event Search',
    description: 'Find track days, car meets, and local events',
    icon: Icons.flag,
    tool: 'search_events',
  },
];

// Default preferences - all sources enabled
const DEFAULT_PREFERENCES = {
  web_search_enabled: true,
  forum_insights_enabled: true,
  youtube_reviews_enabled: true,
  event_search_enabled: true,
};

/**
 * ALPreferencesPanel - Simple data source settings for AL
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the panel is visible
 * @param {Function} props.onClose - Callback when panel is closed
 * @param {Object} props.initialPreferences - Initial preference values
 * @param {Function} props.onPreferencesChange - Callback when preferences change
 */
export default function ALPreferencesPanel({
  isOpen,
  onClose,
  initialPreferences = null,
  onPreferencesChange,
}) {
  // Use React Query for fetching preferences
  const { data: fetchedPreferences, isLoading: queryLoading } = useALPreferencesQuery({
    enabled: isOpen && !initialPreferences,
  });

  const updatePreferencesMutation = useUpdateALPreferences();

  const [preferences, setPreferences] = useState(initialPreferences || DEFAULT_PREFERENCES);
  const [hasChanges, setHasChanges] = useState(false);

  const loading = !initialPreferences && queryLoading;
  const saving = updatePreferencesMutation.isPending;

  // Update local state when fetched preferences change
  useEffect(() => {
    if (initialPreferences) {
      setPreferences(initialPreferences);
    } else if (fetchedPreferences) {
      setPreferences(fetchedPreferences);
    }
  }, [initialPreferences, fetchedPreferences]);

  // Handle toggle change
  const handleToggle = useCallback((key) => {
    setPreferences((prev) => {
      const newPrefs = { ...prev, [key]: !prev[key] };
      setHasChanges(true);
      return newPrefs;
    });
  }, []);

  // Save preferences - optimistic UI pattern
  const handleSave = useCallback(async () => {
    const previousPreferences = { ...preferences };

    // Optimistic: Immediately notify parent and close
    if (onPreferencesChange) {
      onPreferencesChange(preferences);
    }
    setHasChanges(false);

    if (onClose) {
      onClose();
    }

    // Save in background
    try {
      await updatePreferencesMutation.mutateAsync(preferences);
    } catch (err) {
      console.error('Failed to save AL preferences:', err);
      if (onPreferencesChange) {
        onPreferencesChange(previousPreferences);
      }
    }
  }, [preferences, onPreferencesChange, onClose, updatePreferencesMutation]);

  // Count enabled sources
  const enabledCount = DATA_SOURCES.filter((s) => preferences[s.key] !== false).length;

  if (!isOpen) return null;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <span className={styles.titleIcon}>
            <Icons.settings size={16} />
          </span>
          AL Settings
        </h3>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close settings">
          <Icons.close size={14} />
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
          <span>Loading...</span>
        </div>
      ) : (
        <div className={styles.content}>
          {/* Data Sources Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h4 className={styles.sectionTitle}>Data Sources</h4>
              <span className={styles.enabledCount}>
                {enabledCount}/{DATA_SOURCES.length} enabled
              </span>
            </div>
            <p className={styles.sectionDescription}>
              Choose which sources AL can search when answering your questions.
            </p>
            <div className={styles.toggleList}>
              {DATA_SOURCES.map((source) => {
                const enabled = preferences[source.key] !== false;

                return (
                  <div
                    key={source.key}
                    className={styles.toggleRow}
                    onClick={() => handleToggle(source.key)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleToggle(source.key)}
                  >
                    <span className={styles.toggleIcon}>{source.icon({ size: 18 })}</span>
                    <div className={styles.toggleText}>
                      <span className={styles.toggleLabel}>{source.label}</span>
                      <span className={styles.toggleDescription}>{source.description}</span>
                    </div>
                    <button
                      className={`${styles.toggle} ${enabled ? styles.toggleOn : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(source.key);
                      }}
                      aria-label={`${enabled ? 'Disable' : 'Enable'} ${source.label}`}
                    >
                      <span className={styles.toggleKnob} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info Note */}
          <div className={styles.infoNote}>
            <Icons.info size={14} />
            <span>AL always has access to the AutoRev database, encyclopedia, and your garage data.</span>
          </div>

          {/* Save Button */}
          <div className={styles.actions}>
            <button className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button
              className={`${styles.saveButton} ${!hasChanges ? styles.saveButtonDisabled : ''}`}
              onClick={handleSave}
              disabled={!hasChanges || saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook to fetch and manage AL preferences
 * Provides preferences state and handlers for use in chat components
 * Uses React Query for caching and deduplication
 */
export function useALPreferences() {
  const { data: preferences = DEFAULT_PREFERENCES, isLoading: loading } = useALPreferencesQuery();
  const [localOverrides, setLocalOverrides] = useState({});

  const mergedPreferences = { ...preferences, ...localOverrides };

  const updatePreferences = useCallback((newPrefs) => {
    setLocalOverrides((prev) => ({ ...prev, ...newPrefs }));
  }, []);

  return { preferences: mergedPreferences, loading, updatePreferences };
}

// Export for use in other components
export { DATA_SOURCES, DEFAULT_PREFERENCES };
