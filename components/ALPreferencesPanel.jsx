'use client';

/**
 * ALPreferencesPanel Component
 * 
 * Allows users to customize AL's behavior:
 * - Response Mode: Quick / Deep / Database (full AL)
 * - Tool Toggles: Enable/disable web search, forums, YouTube, events
 * 
 * Designed to be embedded in ALPageClient and AIMechanicChat.
 */

import { useState, useEffect, useCallback } from 'react';
import styles from './ALPreferencesPanel.module.css';
import { Icons } from '@/components/ui/Icons';
import { useALPreferences as useALPreferencesQuery, useUpdateALPreferences } from '@/hooks/useUserData';

// Tool toggle configuration
// Note: All tools are available to all users during beta (IS_BETA mode)
// Tier field is preserved for future gating but not currently enforced in UI
const TOOL_TOGGLES = [
  {
    key: 'web_search_enabled',
    label: 'Web Research',
    description: 'Search automotive websites',
    icon: Icons.globe,
    tier: 'free', // Beta: Available to all
  },
  {
    key: 'forum_insights_enabled',
    label: 'Forum Insights',
    description: 'Owner forums & discussions',
    icon: Icons.chat,
    tier: 'free', // Beta: Available to all
  },
  {
    key: 'youtube_reviews_enabled',
    label: 'Expert Reviews',
    description: 'YouTube review summaries',
    icon: Icons.video,
    tier: 'free', // Beta: Available to all
  },
  {
    key: 'event_search_enabled',
    label: 'Event Search',
    description: 'Track days & car meets',
    icon: Icons.flag,
    tier: 'free',
  },
];

// Response mode configuration
const RESPONSE_MODES = [
  {
    key: 'quick',
    label: 'Quick',
    description: 'Fast from existing knowledge',
    icon: Icons.bolt,
  },
  {
    key: 'deep',
    label: 'Deep',
    description: 'Thorough with more sources',
    icon: Icons.search,
  },
  {
    key: 'database',
    label: 'Full AL',
    description: 'All AutoRev data access',
    icon: Icons.database,
    recommended: true,
  },
];

// Default preferences
const DEFAULT_PREFERENCES = {
  response_mode: 'database',
  web_search_enabled: true,
  forum_insights_enabled: true,
  youtube_reviews_enabled: true,
  event_search_enabled: true,
};

/**
 * ALPreferencesPanel - User preferences for AL behavior
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the panel is visible
 * @param {Function} props.onClose - Callback when panel is closed
 * @param {string} props.userTier - User's subscription tier (free, collector, tuner)
 * @param {Object} props.initialPreferences - Initial preference values
 * @param {Function} props.onPreferencesChange - Callback when preferences change
 * @param {boolean} props.compact - Compact mode for floating chat widget
 */
export default function ALPreferencesPanel({
  isOpen,
  onClose,
  userTier = 'free',
  initialPreferences = null,
  onPreferencesChange,
  compact = false,
}) {
  // Use React Query for fetching preferences
  const { 
    data: fetchedPreferences, 
    isLoading: queryLoading 
  } = useALPreferencesQuery({ 
    enabled: isOpen && !initialPreferences 
  });
  
  const updatePreferencesMutation = useUpdateALPreferences();
  
  const [preferences, setPreferences] = useState(initialPreferences || DEFAULT_PREFERENCES);
  const [error, setError] = useState(null);
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
    setPreferences(prev => {
      const newPrefs = { ...prev, [key]: !prev[key] };
      setHasChanges(true);
      return newPrefs;
    });
  }, []);

  // Handle response mode change
  const handleModeChange = useCallback((mode) => {
    setPreferences(prev => {
      const newPrefs = { ...prev, response_mode: mode };
      setHasChanges(true);
      return newPrefs;
    });
  }, []);

  // Save preferences
  const handleSave = useCallback(async () => {
    setError(null);
    
    try {
      await updatePreferencesMutation.mutateAsync(preferences);
      
      setHasChanges(false);
      
      // Notify parent
      if (onPreferencesChange) {
        onPreferencesChange(preferences);
      }
      
      // Auto-close after save
      if (onClose) {
        setTimeout(() => onClose(), 300);
      }
    } catch (err) {
      console.error('Failed to save AL preferences:', err);
      setError('Failed to save preferences. Please try again.');
    }
  }, [preferences, onPreferencesChange, onClose, updatePreferencesMutation]);

  // Check if a tool is available for the user's tier
  const isToolAvailable = useCallback((toolTier) => {
    const tierRank = { free: 0, collector: 1, tuner: 2, admin: 3 };
    return (tierRank[userTier] || 0) >= (tierRank[toolTier] || 0);
  }, [userTier]);

  if (!isOpen) return null;

  return (
    <div className={`${styles.panel} ${compact ? styles.compact : ''}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <span className={styles.titleIcon}><Icons.settings size={16} /></span>
          AL Preferences
        </h3>
        <button 
          className={styles.closeButton} 
          onClick={onClose}
          aria-label="Close preferences"
        >
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
          {/* Response Mode Section */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Response Mode</h4>
            <div className={styles.modeGrid}>
              {RESPONSE_MODES.map(mode => (
                <button
                  key={mode.key}
                  className={`${styles.modeCard} ${preferences.response_mode === mode.key ? styles.modeCardActive : ''}`}
                  onClick={() => handleModeChange(mode.key)}
                >
                  <span className={styles.modeIcon}>{mode.icon({ size: 18 })}</span>
                  <div className={styles.modeText}>
                    <span className={styles.modeLabel}>
                      {mode.label}
                      {mode.recommended && <span className={styles.recommended}>Best</span>}
                    </span>
                    <span className={styles.modeDescription}>{mode.description}</span>
                  </div>
                  {preferences.response_mode === mode.key && (
                    <span className={styles.modeCheck}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tool Toggles Section */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Data Sources</h4>
            <div className={styles.toggleList}>
              {TOOL_TOGGLES.map(toggle => {
                const available = isToolAvailable(toggle.tier);
                const enabled = preferences[toggle.key];
                
                return (
                  <div 
                    key={toggle.key} 
                    className={`${styles.toggleRow} ${!available ? styles.toggleRowLocked : ''}`}
                    onClick={available ? () => handleToggle(toggle.key) : undefined}
                    role={available ? "button" : undefined}
                    tabIndex={available ? 0 : undefined}
                  >
                    <span className={styles.toggleIcon}>{toggle.icon({ size: 16 })}</span>
                    <div className={styles.toggleText}>
                      <span className={styles.toggleLabel}>{toggle.label}</span>
                    </div>
                    {available ? (
                      <button
                        className={`${styles.toggle} ${enabled ? styles.toggleOn : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(toggle.key);
                        }}
                        aria-label={`${enabled ? 'Disable' : 'Enable'} ${toggle.label}`}
                      >
                        <span className={styles.toggleKnob} />
                      </button>
                    ) : (
                      <span className={styles.tierBadge}>
                        {toggle.tier === 'collector' ? 'Collector+' : 'Tuner+'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          {/* Save Button */}
          <div className={styles.actions}>
            <button 
              className={styles.cancelButton}
              onClick={onClose}
            >
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
    setLocalOverrides(prev => ({ ...prev, ...newPrefs }));
  }, []);

  return { preferences: mergedPreferences, loading, updatePreferences };
}
