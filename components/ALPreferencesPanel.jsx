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

// SVG Icons
const Icons = {
  // Settings/Gear icon
  settings: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  // Close/X icon
  close: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  // Quick/Bolt icon
  bolt: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
  // Deep/Search icon
  search: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      <line x1="11" y1="8" x2="11" y2="14"/>
      <line x1="8" y1="11" x2="14" y2="11"/>
    </svg>
  ),
  // Full AL/Database icon
  database: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  ),
  // Web/Globe icon
  globe: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  // Forum/Chat icon
  chat: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  // YouTube/Video icon
  video: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7"/>
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
  ),
  // Event/Flag icon
  flag: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  ),
};

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
  const [preferences, setPreferences] = useState(initialPreferences || DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(!initialPreferences);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch preferences from API if not provided
  useEffect(() => {
    if (initialPreferences) {
      setPreferences(initialPreferences);
      setLoading(false);
      return;
    }
    
    const fetchPreferences = async () => {
      try {
        const response = await fetch('/api/al/preferences');
        if (response.ok) {
          const data = await response.json();
          setPreferences({
            response_mode: data.response_mode || 'database',
            web_search_enabled: data.web_search_enabled ?? true,
            forum_insights_enabled: data.forum_insights_enabled ?? true,
            youtube_reviews_enabled: data.youtube_reviews_enabled ?? true,
            event_search_enabled: data.event_search_enabled ?? true,
          });
        }
      } catch (err) {
        console.error('Failed to fetch AL preferences:', err);
        // Use defaults on error
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchPreferences();
    }
  }, [isOpen, initialPreferences]);

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
    setSaving(true);
    setError(null);
    
    try {
      const response = await fetch('/api/al/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }
      
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
    } finally {
      setSaving(false);
    }
  }, [preferences, onPreferencesChange, onClose]);

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
          <span className={styles.titleIcon}>{Icons.settings}</span>
          AL Preferences
        </h3>
        <button 
          className={styles.closeButton} 
          onClick={onClose}
          aria-label="Close preferences"
        >
          {Icons.close}
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
                  <span className={styles.modeIcon}>{mode.icon}</span>
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
                    <span className={styles.toggleIcon}>{toggle.icon}</span>
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
 */
export function useALPreferences() {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch('/api/al/preferences');
        if (response.ok) {
          const data = await response.json();
          setPreferences({
            response_mode: data.response_mode || 'database',
            web_search_enabled: data.web_search_enabled ?? true,
            forum_insights_enabled: data.forum_insights_enabled ?? true,
            youtube_reviews_enabled: data.youtube_reviews_enabled ?? true,
            event_search_enabled: data.event_search_enabled ?? true,
          });
        }
      } catch (err) {
        console.error('Failed to fetch AL preferences:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  const updatePreferences = useCallback((newPrefs) => {
    setPreferences(prev => ({ ...prev, ...newPrefs }));
  }, []);

  return { preferences, loading, updatePreferences };
}
