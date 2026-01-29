'use client';

/**
 * ALPreferencesPanel Component
 *
 * Simple settings for AL's data sources.
 * Each toggle enables/disables specific tools in the multi-agent system.
 *
 * Design: Matches the Insights page filter panel style for consistency.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

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
    description: 'Current info, news, and niche topics',
    tool: 'search_web',
  },
  {
    key: 'forum_insights_enabled',
    label: 'Forum Insights',
    description: 'Real owner experiences from forums',
    tool: 'search_community_insights',
  },
  {
    key: 'youtube_reviews_enabled',
    label: 'Expert Reviews',
    description: 'Expert YouTube reviewer summaries',
    tool: 'get_expert_reviews',
  },
  {
    key: 'event_search_enabled',
    label: 'Event Search',
    description: 'Track days, car meets, and events',
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
 * Styled to match the Insights page filter panel.
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
  const panelRef = useRef(null);

  // Use React Query for fetching preferences
  const { data: fetchedPreferences, isLoading: queryLoading } = useALPreferencesQuery({
    enabled: isOpen && !initialPreferences,
  });

  const updatePreferencesMutation = useUpdateALPreferences();

  const [preferences, setPreferences] = useState(initialPreferences || DEFAULT_PREFERENCES);

  const loading = !initialPreferences && queryLoading;

  // Update local state when fetched preferences change
  useEffect(() => {
    if (initialPreferences) {
      setPreferences(initialPreferences);
    } else if (fetchedPreferences) {
      setPreferences(fetchedPreferences);
    }
  }, [initialPreferences, fetchedPreferences]);

  // Handle toggle change with immediate save (optimistic UI)
  const handleToggle = useCallback(
    async (key) => {
      const newPrefs = { ...preferences, [key]: !preferences[key] };
      setPreferences(newPrefs);

      // Notify parent immediately
      if (onPreferencesChange) {
        onPreferencesChange(newPrefs);
      }

      // Save in background
      try {
        await updatePreferencesMutation.mutateAsync(newPrefs);
      } catch (err) {
        console.error('Failed to save AL preferences:', err);
        // Revert on error
        setPreferences(preferences);
        if (onPreferencesChange) {
          onPreferencesChange(preferences);
        }
      }
    },
    [preferences, onPreferencesChange, updatePreferencesMutation]
  );

  // Reset all sources to enabled
  const handleReset = useCallback(async () => {
    setPreferences(DEFAULT_PREFERENCES);

    if (onPreferencesChange) {
      onPreferencesChange(DEFAULT_PREFERENCES);
    }

    try {
      await updatePreferencesMutation.mutateAsync(DEFAULT_PREFERENCES);
    } catch (err) {
      console.error('Failed to reset AL preferences:', err);
    }
  }, [onPreferencesChange, updatePreferencesMutation]);

  // Count disabled sources
  const disabledCount = DATA_SOURCES.filter((s) => preferences[s.key] === false).length;

  if (!isOpen) return null;

  return (
    <div className={styles.panel} ref={panelRef}>
      <div className={styles.header}>
        <h3 className={styles.title}>AL Data Sources</h3>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          <Icons.x size={18} />
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
        </div>
      ) : (
        <>
          <div className={styles.body}>
            {DATA_SOURCES.map((source) => {
              const enabled = preferences[source.key] !== false;

              return (
                <label key={source.key} className={styles.option}>
                  <div className={styles.optionInfo}>
                    <span className={styles.optionLabel}>{source.label}</span>
                    <span className={styles.optionDesc}>{source.description}</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    className={`${styles.toggle} ${enabled ? styles.toggleOn : ''}`}
                    onClick={() => handleToggle(source.key)}
                  >
                    <span className={styles.toggleThumb} />
                  </button>
                </label>
              );
            })}
          </div>

          {disabledCount > 0 && (
            <div className={styles.footer}>
              <button className={styles.resetBtn} onClick={handleReset}>
                Enable All Sources
              </button>
            </div>
          )}
        </>
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
