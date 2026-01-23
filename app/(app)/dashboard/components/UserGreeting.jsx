'use client';

/**
 * UserGreeting Component
 * 
 * AutoRev Callsign System
 * 
 * Personalized callsigns organized by engagement category:
 * - GARAGE: Building, modding, hands-on work
 * - COMMUNITY: Sharing, helping, brotherhood
 * - AL: Learning, data, AI assistance
 * 
 * Each category has 3 tiers with 3 callsigns each.
 * Users unlock callsigns by engaging with different parts of the app.
 * 
 * Format: "Mike, known as [Callsign]"
 */

import { useState, useMemo } from 'react';
import styles from './UserGreeting.module.css';

// =============================================================================
// CALLSIGN CATEGORIES
// =============================================================================

export const CATEGORIES = {
  garage: {
    id: 'garage',
    label: 'Garage',
    icon: '🔧',
    description: 'Building & modding',
  },
  community: {
    id: 'community',
    label: 'Community',
    icon: '👥',
    description: 'Sharing & helping',
  },
  al: {
    id: 'al',
    label: 'AL',
    icon: '🤖',
    description: 'Learning & data',
  },
};

// =============================================================================
// CALLSIGN DEFINITIONS
// Organized by category → tier → callsigns
// Each tier has 3 callsigns, higher tiers are more prestigious
// =============================================================================

export const CALLSIGNS = {
  // =========================================================================
  // GARAGE CATEGORY - Building, modding, hands-on work
  // =========================================================================
  
  // Tier 1 - Getting Started
  gear_head: {
    display: 'Gear Head',
    description: 'Has a ride in the garage',
    category: 'garage',
    tier: 1,
    color: '#10b981',
    requirement: 'Add 1 vehicle',
    unlockCheck: (stats) => stats.vehicles >= 1,
  },
  sunday_driver: {
    display: 'Sunday Driver',
    description: 'Taking it easy',
    category: 'garage',
    tier: 1,
    color: '#3b82f6',
    requirement: 'Add 1 vehicle',
    unlockCheck: (stats) => stats.vehicles >= 1,
  },
  window_shopper: {
    display: 'Window Shopper',
    description: 'Browsing the possibilities',
    category: 'garage',
    tier: 1,
    color: '#94a3b8',
    requirement: 'Browse 5 cars',
    unlockCheck: (stats) => stats.carsViewed >= 5,
  },

  // Tier 2 - Active Builder
  wrench_turner: {
    display: 'Wrench Turner',
    description: 'Gets their hands dirty',
    category: 'garage',
    tier: 2,
    color: '#f59e0b',
    requirement: 'Install 3 mods',
    unlockCheck: (stats) => stats.modsInstalled >= 3,
  },
  mod_enthusiast: {
    display: 'Mod Enthusiast',
    description: 'Loves the upgrade game',
    category: 'garage',
    tier: 2,
    color: '#10b981',
    requirement: 'Install 5 mods',
    unlockCheck: (stats) => stats.modsInstalled >= 5,
  },
  grease_monkey: {
    display: 'Grease Monkey',
    description: 'Born in the shop',
    category: 'garage',
    tier: 2,
    color: '#f59e0b',
    requirement: 'Install 8 mods',
    unlockCheck: (stats) => stats.modsInstalled >= 8,
  },

  // Tier 3 - Master Builder
  build_master: {
    display: 'Build Master',
    description: 'Multiple projects completed',
    category: 'garage',
    tier: 3,
    color: '#a855f7',
    requirement: 'Complete 3 builds',
    unlockCheck: (stats) => stats.builds >= 3,
  },
  parts_hoarder: {
    display: 'Parts Hoarder',
    description: 'Never enough parts',
    category: 'garage',
    tier: 3,
    color: '#10b981',
    requirement: 'Install 15 mods',
    unlockCheck: (stats) => stats.modsInstalled >= 15,
  },
  garage_legend: {
    display: 'Garage Legend',
    description: 'Master of the build',
    category: 'garage',
    tier: 3,
    color: '#d4ff00',
    requirement: '3 vehicles + 5 builds',
    unlockCheck: (stats) => stats.vehicles >= 3 && stats.builds >= 5,
  },

  // =========================================================================
  // COMMUNITY CATEGORY - Sharing, helping, brotherhood
  // =========================================================================
  
  // Tier 1 - New Member
  forum_rookie: {
    display: 'Forum Rookie',
    description: 'Fresh to the crew',
    category: 'community',
    tier: 1,
    color: '#3b82f6',
    requirement: 'Join the community',
    unlockCheck: (stats) => stats.communityJoined,
  },
  friendly_wave: {
    display: 'Friendly Wave',
    description: 'Positive vibes only',
    category: 'community',
    tier: 1,
    color: '#10b981',
    requirement: 'Post 1 comment',
    unlockCheck: (stats) => stats.comments >= 1,
  },
  first_post: {
    display: 'First Post',
    description: 'Breaking the ice',
    category: 'community',
    tier: 1,
    color: '#3b82f6',
    requirement: 'Create first post',
    unlockCheck: (stats) => stats.posts >= 1,
  },

  // Tier 2 - Active Member
  community_regular: {
    display: 'Community Regular',
    description: 'A familiar face',
    category: 'community',
    tier: 2,
    color: '#10b981',
    requirement: '5 posts or 15 comments',
    unlockCheck: (stats) => stats.posts >= 5 || stats.comments >= 15,
  },
  helpful_hand: {
    display: 'Helpful Hand',
    description: 'Always there to assist',
    category: 'community',
    tier: 2,
    color: '#3b82f6',
    requirement: '20 helpful comments',
    unlockCheck: (stats) => stats.comments >= 20,
  },
  good_vibes: {
    display: 'Good Vibes',
    description: 'Brings the positivity',
    category: 'community',
    tier: 2,
    color: '#10b981',
    requirement: '10 posts',
    unlockCheck: (stats) => stats.posts >= 10,
  },

  // Tier 3 - Community Leader
  pit_crew_chief: {
    display: 'Pit Crew Chief',
    description: 'Keeps the team running',
    category: 'community',
    tier: 3,
    color: '#f59e0b',
    requirement: '30 comments helping others',
    unlockCheck: (stats) => stats.comments >= 30,
  },
  community_pillar: {
    display: 'Community Pillar',
    description: 'A cornerstone of the crew',
    category: 'community',
    tier: 3,
    color: '#a855f7',
    requirement: '15 posts + 40 comments',
    unlockCheck: (stats) => stats.posts >= 15 && stats.comments >= 40,
  },
  brotherhood_og: {
    display: 'Brotherhood OG',
    description: 'Day one for the fam',
    category: 'community',
    tier: 3,
    color: '#d4ff00',
    requirement: '20 posts + 50 comments',
    unlockCheck: (stats) => stats.posts >= 20 && stats.comments >= 50,
  },

  // =========================================================================
  // AL & DATA CATEGORY - Learning, performance data, AI assistance
  // =========================================================================
  
  // Tier 1 - Getting Started
  curious_one: {
    display: 'Curious One',
    description: 'Asking the right questions',
    category: 'al',
    tier: 1,
    color: '#3b82f6',
    requirement: '1 AL conversation',
    unlockCheck: (stats) => stats.alConversations >= 1,
  },
  data_explorer: {
    display: 'Data Explorer',
    description: 'Digging into the numbers',
    category: 'al',
    tier: 1,
    color: '#10b981',
    requirement: '3 AL conversations',
    unlockCheck: (stats) => stats.alConversations >= 3,
  },
  al_apprentice: {
    display: 'AL Apprentice',
    description: 'Learning from the best',
    category: 'al',
    tier: 1,
    color: '#a855f7',
    requirement: '5 AL conversations',
    unlockCheck: (stats) => stats.alConversations >= 5,
  },

  // Tier 2 - Active User
  ai_ronin: {
    display: 'AI Ronin',
    description: 'Master of AL chats',
    category: 'al',
    tier: 2,
    color: '#a855f7',
    requirement: '15 AL conversations',
    unlockCheck: (stats) => stats.alConversations >= 15,
  },
  data_nerd: {
    display: 'Data Nerd',
    description: 'Lives for the specs',
    category: 'al',
    tier: 2,
    color: '#10b981',
    requirement: 'Log 1 dyno run',
    unlockCheck: (stats) => stats.dynoRuns >= 1,
  },
  track_rat: {
    display: 'Track Rat',
    description: 'Chasing lap times',
    category: 'al',
    tier: 2,
    color: '#ef4444',
    requirement: 'Log 3 track times',
    unlockCheck: (stats) => stats.trackTimes >= 3,
  },

  // Tier 3 - Power User
  tuning_sensei: {
    display: 'Tuning Sensei',
    description: 'Wisdom of the masters',
    category: 'al',
    tier: 3,
    color: '#ef4444',
    requirement: '40 AL conversations',
    unlockCheck: (stats) => stats.alConversations >= 40,
  },
  dyno_junkie: {
    display: 'Dyno Junkie',
    description: 'Addicted to the pulls',
    category: 'al',
    tier: 3,
    color: '#ef4444',
    requirement: '5 dyno runs',
    unlockCheck: (stats) => stats.dynoRuns >= 5,
  },
  boost_god: {
    display: 'Boost God',
    description: 'Maximum power achieved',
    category: 'al',
    tier: 3,
    color: '#d4ff00',
    requirement: '1000+ combined HP',
    unlockCheck: (stats) => stats.totalHp >= 1000,
  },

  // =========================================================================
  // CROSS-CATEGORY LEGENDARY CALLSIGNS
  // =========================================================================
  
  apex_predator: {
    display: 'Apex Predator',
    description: 'Dominates all categories',
    category: 'legendary',
    tier: 4,
    color: '#d4ff00',
    requirement: 'Master all categories',
    unlockCheck: (stats) => 
      stats.vehicles >= 5 && 
      stats.builds >= 5 && 
      stats.posts >= 10 && 
      stats.alConversations >= 50,
  },
  full_send: {
    display: 'Full Send',
    description: 'No half measures',
    category: 'legendary',
    tier: 4,
    color: '#d4ff00',
    requirement: 'Top tier in 2+ categories',
    unlockCheck: (stats) => {
      let topTiers = 0;
      if (stats.builds >= 5 && stats.vehicles >= 3) topTiers++;
      if (stats.posts >= 15 && stats.comments >= 40) topTiers++;
      if (stats.alConversations >= 40) topTiers++;
      return topTiers >= 2;
    },
  },

  // Default starter callsign
  rookie: {
    display: 'Rookie',
    description: 'Just getting started',
    category: 'garage',
    tier: 0,
    color: '#94a3b8',
    requirement: 'Default',
    unlockCheck: () => true,
  },
};

// Create flat lookup for backwards compatibility
export const TITLES = CALLSIGNS;

/**
 * Get callsigns organized by category
 */
export function getCallsignsByCategory(category) {
  return Object.entries(CALLSIGNS)
    .filter(([_, callsign]) => callsign.category === category)
    .sort((a, b) => a[1].tier - b[1].tier)
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
}

/**
 * Get all callsigns for a category, split into unlocked and locked
 */
function getCategorizedCallsigns(category, unlockedTitles) {
  const categoryCallsigns = Object.entries(CALLSIGNS)
    .filter(([_, cs]) => cs.category === category || (category === 'legendary' && cs.category === 'legendary'))
    .sort((a, b) => {
      // Sort by tier first, then alphabetically
      if (a[1].tier !== b[1].tier) return a[1].tier - b[1].tier;
      return a[1].display.localeCompare(b[1].display);
    });

  const unlocked = categoryCallsigns.filter(([key]) => unlockedTitles.includes(key));
  const locked = categoryCallsigns.filter(([key]) => !unlockedTitles.includes(key));

  return { unlocked, locked };
}

/**
 * Get the best auto-selected callsign based on unlocked titles
 * Returns the highest-tier callsign the user has unlocked
 */
function getDefaultCallsign(unlockedTitles) {
  if (!unlockedTitles || unlockedTitles.length === 0) {
    return 'rookie';
  }
  
  // Sort by tier descending and return highest
  const sorted = [...unlockedTitles]
    .filter(key => CALLSIGNS[key])
    .sort((a, b) => (CALLSIGNS[b]?.tier || 0) - (CALLSIGNS[a]?.tier || 0));
  
  return sorted[0] || 'rookie';
}

/**
 * Count total available callsigns
 */
const TOTAL_CALLSIGNS = Object.keys(CALLSIGNS).length;

export default function UserGreeting({ 
  firstName = 'there',
  selectedTitle = null,
  unlockedTitles = ['rookie'],
  onTitleChange,
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [activeCategory, setActiveCategory] = useState('garage');
  
  // Determine which callsign to display
  const displayCallsignKey = useMemo(() => {
    if (selectedTitle && CALLSIGNS[selectedTitle]) {
      return selectedTitle;
    }
    return getDefaultCallsign(unlockedTitles);
  }, [selectedTitle, unlockedTitles]);
  
  const currentCallsign = CALLSIGNS[displayCallsignKey];

  // Get callsigns for the active category
  const { unlocked, locked } = useMemo(() => {
    if (activeCategory === 'all') {
      // Show all unlocked across categories
      const allUnlocked = Object.entries(CALLSIGNS)
        .filter(([key]) => unlockedTitles.includes(key))
        .sort((a, b) => (b[1].tier || 0) - (a[1].tier || 0));
      const allLocked = Object.entries(CALLSIGNS)
        .filter(([key]) => !unlockedTitles.includes(key))
        .sort((a, b) => (a[1].tier || 0) - (b[1].tier || 0));
      return { unlocked: allUnlocked, locked: allLocked };
    }
    return getCategorizedCallsigns(activeCategory, unlockedTitles);
  }, [activeCategory, unlockedTitles]);

  const handleCallsignSelect = async (callsignKey) => {
    setShowPicker(false);
    if (onTitleChange) {
      onTitleChange(callsignKey);
    }
  };

  // Calculate totals for footer
  const totalUnlocked = unlockedTitles.length;
  const totalToUnlock = TOTAL_CALLSIGNS - totalUnlocked;

  return (
    <div className={styles.container}>
      {/* Format: "Mike, known as [Callsign]" */}
      <button
        className={styles.titleButton}
        onClick={() => setShowPicker(!showPicker)}
        style={{ '--title-color': currentCallsign.color }}
        aria-expanded={showPicker}
        aria-haspopup="listbox"
      >
        <span className={styles.nameText}>{firstName}</span>
        <span className={styles.knownAs}>, known as</span>
        <span className={styles.titleText}>{currentCallsign.display}</span>
        <span className={styles.titleChevron}>
          <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
            <path 
              d="M3 4.5L6 7.5L9 4.5" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {/* Callsign Picker Dropdown */}
      {showPicker && (
        <div className={styles.callsignPicker}>
          {/* Header */}
          <div className={styles.pickerHeader}>
            <span className={styles.pickerTitle}>Choose your callsign</span>
          </div>

          {/* Category Pills */}
          <div className={styles.categoryPills}>
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <button
                key={key}
                className={`${styles.categoryPill} ${activeCategory === key ? styles.categoryPillActive : ''}`}
                onClick={() => setActiveCategory(key)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Callsign List */}
          <div className={styles.callsignList} role="listbox">
            {/* Unlocked Section */}
            {unlocked.length > 0 && (
              <>
                {unlocked.map(([key, callsign]) => {
                  const isSelected = displayCallsignKey === key;
                  return (
                    <button
                      key={key}
                      className={`${styles.callsignOption} ${isSelected ? styles.callsignOptionSelected : ''}`}
                      onClick={() => handleCallsignSelect(key)}
                      style={{ '--callsign-color': callsign.color }}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span className={styles.callsignName}>{callsign.display}</span>
                      <span className={styles.callsignDesc}>{callsign.description}</span>
                      {isSelected && <span className={styles.checkmark}>✓</span>}
                    </button>
                  );
                })}
              </>
            )}

            {/* Locked Section */}
            {locked.length > 0 && (
              <>
                <div className={styles.lockedHeader}>
                  <span className={styles.lockIcon}>🔒</span>
                  <span>Locked</span>
                </div>
                {locked.map(([key, callsign]) => (
                  <div
                    key={key}
                    className={styles.callsignLocked}
                  >
                    <span className={styles.callsignNameLocked}>{callsign.display}</span>
                    <span className={styles.callsignRequirement}>{callsign.requirement}</span>
                  </div>
                ))}
              </>
            )}

            {/* Empty state */}
            {unlocked.length === 0 && locked.length === 0 && (
              <div className={styles.emptyState}>
                No callsigns in this category yet
              </div>
            )}
          </div>

          {/* Footer with totals */}
          <div className={styles.pickerFooter}>
            <span className={styles.footerStats}>
              {totalUnlocked} unlocked · {totalToUnlock} to discover
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
