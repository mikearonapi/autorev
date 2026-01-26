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
 * All callsigns are unlocked for everyone - it's a fun personalization feature!
 * Users can pick any callsign that matches their vibe.
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
// 
// DESIGN PHILOSOPHY:
// - Tier 0: Starter callsigns (unlocked for all new users - pick your vibe!)
// - Tier 1: Easy unlocks (low barrier, encourages first engagement)
// - Tier 2: Active user (regular engagement)
// - Tier 3: Veteran (serious commitment)
// - Tier 4: Legendary (cross-category mastery)
//
// HUMOR GUIDELINES:
// - Car culture references (JDM, muscle, euro)
// - Self-deprecating/relatable humor
// - Community inside jokes
// - Aspirational but not cringe
// =============================================================================

/**
 * Get CSS variable name for callsign color based on tier and category
 * Colors are defined in styles/tokens/colors.css
 * 
 * Tier-based color progression:
 * - Tier 0: Muted (secondary/tertiary text)
 * - Tier 1: Entry (teal for garage, blue for community, purple for al)
 * - Tier 2: Active (amber, teal, purple)
 * - Tier 3: Veteran (lime, purple, red)
 * - Tier 4: Legendary (lime)
 */
export function getCallsignColorVar(tier, category) {
  // Tier 0 - starter/muted
  if (tier === 0) {
    return '--color-text-secondary';
  }
  
  // Tier 4 - legendary (always lime)
  if (tier === 4) {
    return '--color-accent-lime';
  }
  
  // Category-based for tiers 1-3
  const categoryColors = {
    garage: {
      1: '--color-accent-teal',
      2: '--color-accent-amber',
      3: '--color-accent-lime',
    },
    community: {
      1: '--color-accent-blue',
      2: '--color-accent-blue',
      3: '--color-accent-purple',
    },
    al: {
      1: '--color-accent-purple',
      2: '--color-accent-purple',
      3: '--color-accent-red',
    },
    legendary: {
      1: '--color-accent-lime',
      2: '--color-accent-lime',
      3: '--color-accent-lime',
    },
  };
  
  return categoryColors[category]?.[tier] || '--color-accent-teal';
}

// Get computed color value from CSS variable (for use in inline styles)
export function getCallsignColor(tier, category) {
  const colorVar = getCallsignColorVar(tier, category);
  if (typeof window === 'undefined') {
    // SSR fallback
    const fallbacks = {
      '--color-text-secondary': '#94a3b8',
      '--color-accent-teal': '#10b981',
      '--color-accent-blue': '#3b82f6',
      '--color-accent-purple': '#a855f7',
      '--color-accent-amber': '#f59e0b',
      '--color-accent-lime': '#d4ff00',
      '--color-accent-red': '#ef4444',
    };
    return fallbacks[colorVar] || '#94a3b8';
  }
  return getComputedStyle(document.documentElement).getPropertyValue(colorVar).trim() || '#94a3b8';
}

export const CALLSIGNS = {
  // =========================================================================
  // STARTER CALLSIGNS (Tier 0) - Unlocked for everyone!
  // Let new users pick a personality right away
  // =========================================================================
  
  rookie: {
    display: 'Rookie',
    description: 'Fresh off the lot',
    category: 'garage',
    tier: 0,
    requirement: 'Default',
    unlockCheck: () => true,
  },
  pit_lane_lurker: {
    display: 'Pit Lane Lurker',
    description: 'Just here for the vibes',
    category: 'community',
    tier: 0,
    requirement: 'Default',
    unlockCheck: () => true,
  },
  curious_cat: {
    display: 'Curious Cat',
    description: 'Asking all the questions',
    category: 'al',
    tier: 0,
    requirement: 'Default',
    unlockCheck: () => true,
  },
  stock_is_fine: {
    display: 'Stock Is Fine',
    description: '"I\'ll mod it eventually..."',
    category: 'garage',
    tier: 0,
    requirement: 'Default',
    unlockCheck: () => true,
  },
  
  // =========================================================================
  // GARAGE CATEGORY - Building, modding, hands-on work
  // =========================================================================
  
  // Tier 1 - First Steps
  gear_head: {
    display: 'Gear Head',
    description: 'Has a ride in the garage',
    category: 'garage',
    tier: 1,
    requirement: 'Add 1 vehicle',
    unlockCheck: (stats) => stats.vehicles >= 1,
  },
  window_shopper: {
    display: 'Window Shopper',
    description: '"Just looking" (for now)',
    category: 'garage',
    tier: 1,
    requirement: 'Browse 5 cars',
    unlockCheck: (stats) => stats.carsViewed >= 5,
  },
  sunday_driver: {
    display: 'Sunday Driver',
    description: 'Taking the scenic route',
    category: 'garage',
    tier: 1,
    requirement: 'Add 1 vehicle',
    unlockCheck: (stats) => stats.vehicles >= 1,
  },
  bolt_on_believer: {
    display: 'Bolt-On Believer',
    description: 'Easy gains only',
    category: 'garage',
    tier: 1,
    requirement: 'Install 1 mod',
    unlockCheck: (stats) => stats.modsInstalled >= 1,
  },

  // Tier 2 - Active Builder
  wrench_turner: {
    display: 'Wrench Turner',
    description: 'Gets their hands dirty',
    category: 'garage',
    tier: 2,
    requirement: 'Install 3 mods',
    unlockCheck: (stats) => stats.modsInstalled >= 3,
  },
  grease_monkey: {
    display: 'Grease Monkey',
    description: 'Born in the shop',
    category: 'garage',
    tier: 2,
    requirement: 'Install 5 mods',
    unlockCheck: (stats) => stats.modsInstalled >= 5,
  },
  project_addict: {
    display: 'Project Addict',
    description: '"I can fix her"',
    category: 'garage',
    tier: 2,
    requirement: '2 vehicles',
    unlockCheck: (stats) => stats.vehicles >= 2,
  },
  parts_bin_raider: {
    display: 'Parts Bin Raider',
    description: 'Junkyard treasure hunter',
    category: 'garage',
    tier: 2,
    requirement: 'Install 8 mods',
    unlockCheck: (stats) => stats.modsInstalled >= 8,
  },
  weekend_warrior: {
    display: 'Weekend Warrior',
    description: 'Saturdays are for wrenching',
    category: 'garage',
    tier: 2,
    requirement: 'Install 5 mods',
    unlockCheck: (stats) => stats.modsInstalled >= 5,
  },

  // Tier 3 - Master Builder
  build_master: {
    display: 'Build Master',
    description: 'Multiple projects completed',
    category: 'garage',
    tier: 3,
    requirement: 'Complete 3 builds',
    unlockCheck: (stats) => stats.builds >= 3,
  },
  parts_hoarder: {
    display: 'Parts Hoarder',
    description: '"I might need this someday"',
    category: 'garage',
    tier: 3,
    requirement: 'Install 15 mods',
    unlockCheck: (stats) => stats.modsInstalled >= 15,
  },
  garage_legend: {
    display: 'Garage Legend',
    description: 'The shop never sleeps',
    category: 'garage',
    tier: 3,
    requirement: '3 vehicles + 5 builds',
    unlockCheck: (stats) => stats.vehicles >= 3 && stats.builds >= 5,
  },
  money_pit_survivor: {
    display: 'Money Pit Survivor',
    description: 'RIP savings account',
    category: 'garage',
    tier: 3,
    requirement: 'Install 20 mods',
    unlockCheck: (stats) => stats.modsInstalled >= 20,
  },
  fleet_commander: {
    display: 'Fleet Commander',
    description: 'Running out of garage space',
    category: 'garage',
    tier: 3,
    requirement: '5+ vehicles',
    unlockCheck: (stats) => stats.vehicles >= 5,
  },

  // =========================================================================
  // COMMUNITY CATEGORY - Sharing, helping, brotherhood
  // =========================================================================
  
  // Tier 1 - New Member
  forum_fresh: {
    display: 'Forum Fresh',
    description: 'Just joined the crew',
    category: 'community',
    tier: 1,
    requirement: 'Join the community',
    unlockCheck: (stats) => stats.communityJoined,
  },
  friendly_wave: {
    display: 'Friendly Wave',
    description: 'Positive vibes only',
    category: 'community',
    tier: 1,
    requirement: 'Post 1 comment',
    unlockCheck: (stats) => stats.comments >= 1,
  },
  first_post: {
    display: 'First Post',
    description: 'Breaking the ice',
    category: 'community',
    tier: 1,
    requirement: 'Create first post',
    unlockCheck: (stats) => stats.posts >= 1,
  },
  question_asker: {
    display: 'Question Asker',
    description: 'No dumb questions here',
    category: 'community',
    tier: 1,
    requirement: 'Post 2 comments',
    unlockCheck: (stats) => stats.comments >= 2,
  },

  // Tier 2 - Active Member
  community_regular: {
    display: 'Community Regular',
    description: 'A familiar face',
    category: 'community',
    tier: 2,
    requirement: '5 posts or 15 comments',
    unlockCheck: (stats) => stats.posts >= 5 || stats.comments >= 15,
  },
  helpful_hand: {
    display: 'Helpful Hand',
    description: 'Always there to assist',
    category: 'community',
    tier: 2,
    requirement: '20 helpful comments',
    unlockCheck: (stats) => stats.comments >= 20,
  },
  hype_man: {
    display: 'Hype Man',
    description: 'Your build looks great, bro',
    category: 'community',
    tier: 2,
    requirement: '10 posts',
    unlockCheck: (stats) => stats.posts >= 10,
  },
  thread_necromancer: {
    display: 'Thread Necromancer',
    description: 'Reviving dead topics since 2024',
    category: 'community',
    tier: 2,
    requirement: '25 comments',
    unlockCheck: (stats) => stats.comments >= 25,
  },
  build_cheerleader: {
    display: 'Build Cheerleader',
    description: 'Biggest supporter in the crew',
    category: 'community',
    tier: 2,
    requirement: 'Give 20 likes',
    unlockCheck: (stats) => stats.likesGiven >= 20,
  },

  // Tier 3 - Community Leader
  pit_crew_chief: {
    display: 'Pit Crew Chief',
    description: 'Keeps the team running',
    category: 'community',
    tier: 3,
    requirement: '30 comments helping others',
    unlockCheck: (stats) => stats.comments >= 30,
  },
  community_pillar: {
    display: 'Community Pillar',
    description: 'A cornerstone of the crew',
    category: 'community',
    tier: 3,
    requirement: '15 posts + 40 comments',
    unlockCheck: (stats) => stats.posts >= 15 && stats.comments >= 40,
  },
  forum_troll_slayer: {
    display: 'Forum Troll Slayer',
    description: 'Keeping it civil since day one',
    category: 'community',
    tier: 3,
    requirement: '50 helpful comments',
    unlockCheck: (stats) => stats.comments >= 50,
  },
  brotherhood_og: {
    display: 'Brotherhood OG',
    description: 'Day one for the fam',
    category: 'community',
    tier: 3,
    requirement: '20 posts + 50 comments',
    unlockCheck: (stats) => stats.posts >= 20 && stats.comments >= 50,
  },
  meet_organizer: {
    display: 'Meet Organizer',
    description: 'Bringing the crew together',
    category: 'community',
    tier: 3,
    requirement: 'Organize events',
    unlockCheck: (stats) => stats.eventsOrganized >= 1,
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
    requirement: '1 AL conversation',
    unlockCheck: (stats) => stats.alConversations >= 1,
  },
  data_dabbler: {
    display: 'Data Dabbler',
    description: 'Dipping toes in the numbers',
    category: 'al',
    tier: 1,
    requirement: '3 AL conversations',
    unlockCheck: (stats) => stats.alConversations >= 3,
  },
  al_apprentice: {
    display: 'AL Apprentice',
    description: 'Learning from the AI',
    category: 'al',
    tier: 1,
    requirement: '5 AL conversations',
    unlockCheck: (stats) => stats.alConversations >= 5,
  },
  spec_checker: {
    display: 'Spec Checker',
    description: 'Always comparing numbers',
    category: 'al',
    tier: 1,
    requirement: 'View 10 car specs',
    unlockCheck: (stats) => stats.carsViewed >= 10,
  },

  // Tier 2 - Active User
  ai_whisperer: {
    display: 'AI Whisperer',
    description: 'Gets the best answers from AL',
    category: 'al',
    tier: 2,
    requirement: '15 AL conversations',
    unlockCheck: (stats) => stats.alConversations >= 15,
  },
  data_nerd: {
    display: 'Data Nerd',
    description: 'Lives for the spreadsheets',
    category: 'al',
    tier: 2,
    requirement: 'Log 1 dyno run',
    unlockCheck: (stats) => stats.dynoRuns >= 1,
  },
  track_rat: {
    display: 'Track Rat',
    description: 'Chasing lap times',
    category: 'al',
    tier: 2,
    requirement: 'Log 3 track times',
    unlockCheck: (stats) => stats.trackTimes >= 3,
  },
  dyno_curious: {
    display: 'Dyno Curious',
    description: 'What does it make?',
    category: 'al',
    tier: 2,
    requirement: 'Log 2 dyno runs',
    unlockCheck: (stats) => stats.dynoRuns >= 2,
  },
  number_cruncher: {
    display: 'Number Cruncher',
    description: 'Obsessed with the math',
    category: 'al',
    tier: 2,
    requirement: '25 AL conversations',
    unlockCheck: (stats) => stats.alConversations >= 25,
  },

  // Tier 3 - Power User
  tuning_sensei: {
    display: 'Tuning Sensei',
    description: 'Wisdom of the masters',
    category: 'al',
    tier: 3,
    requirement: '40 AL conversations',
    unlockCheck: (stats) => stats.alConversations >= 40,
  },
  dyno_junkie: {
    display: 'Dyno Junkie',
    description: 'Addicted to the pulls',
    category: 'al',
    tier: 3,
    requirement: '5 dyno runs',
    unlockCheck: (stats) => stats.dynoRuns >= 5,
  },
  boost_god: {
    display: 'Boost God',
    description: 'Maximum power achieved',
    category: 'al',
    tier: 3,
    requirement: '1000+ combined HP',
    unlockCheck: (stats) => stats.totalHp >= 1000,
  },
  lap_time_hunter: {
    display: 'Lap Time Hunter',
    description: 'Every tenth counts',
    category: 'al',
    tier: 3,
    requirement: '10 track times logged',
    unlockCheck: (stats) => stats.trackTimes >= 10,
  },
  data_hoarder: {
    display: 'Data Hoarder',
    description: 'Never delete anything',
    category: 'al',
    tier: 3,
    requirement: '50 AL conversations',
    unlockCheck: (stats) => stats.alConversations >= 50,
  },
  ai_ronin: {
    display: 'AI Ronin',
    description: 'Masterless AI warrior',
    category: 'al',
    tier: 3,
    requirement: 'AL power user',
    unlockCheck: (stats) => stats.alConversations >= 30,
  },

  // =========================================================================
  // LEGENDARY CALLSIGNS (Tier 4) - Cross-category mastery
  // =========================================================================
  
  apex_predator: {
    display: 'Apex Predator',
    description: 'Dominates all categories',
    category: 'legendary',
    tier: 4,
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
    requirement: 'Top tier in 2+ categories',
    unlockCheck: (stats) => {
      let topTiers = 0;
      if (stats.builds >= 5 && stats.vehicles >= 3) topTiers++;
      if (stats.posts >= 15 && stats.comments >= 40) topTiers++;
      if (stats.alConversations >= 40) topTiers++;
      return topTiers >= 2;
    },
  },
  keyboard_warrior: {
    display: 'Keyboard Warrior',
    description: 'Types faster than they drive',
    category: 'legendary',
    tier: 4,
    requirement: 'Community + AL master',
    unlockCheck: (stats) => stats.comments >= 50 && stats.alConversations >= 40,
  },
  garage_hermit: {
    display: 'Garage Hermit',
    description: 'Sees family once a year',
    category: 'legendary',
    tier: 4,
    requirement: 'Garage + Data master',
    unlockCheck: (stats) => stats.modsInstalled >= 20 && stats.dynoRuns >= 5,
  },
  platform_legend: {
    display: 'Platform Legend',
    description: 'AutoRev hall of famer',
    category: 'legendary',
    tier: 4,
    requirement: 'Everything maxed',
    unlockCheck: (stats) => 
      stats.vehicles >= 5 &&
      stats.modsInstalled >= 25 &&
      stats.posts >= 25 &&
      stats.comments >= 60 &&
      stats.alConversations >= 60,
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
 * Get all callsigns for a category
 * All callsigns are now unlocked for everyone - it's a fun personalization feature!
 */
function getCategorizedCallsigns(category) {
  const categoryCallsigns = Object.entries(CALLSIGNS)
    .filter(([_, cs]) => cs.category === category || (category === 'legendary' && cs.category === 'legendary'))
    .sort((a, b) => {
      // Sort by tier first, then alphabetically
      if (a[1].tier !== b[1].tier) return a[1].tier - b[1].tier;
      return a[1].display.localeCompare(b[1].display);
    });

  // All callsigns are unlocked for everyone!
  return { unlocked: categoryCallsigns, locked: [] };
}

/**
 * Count total available callsigns
 */
const TOTAL_CALLSIGNS = Object.keys(CALLSIGNS).length;

export default function UserGreeting({ 
  firstName = 'there',
  selectedTitle = null,
  onTitleChange,
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [activeCategory, setActiveCategory] = useState('garage');
  
  // Determine which callsign to display
  const displayCallsignKey = useMemo(() => {
    if (selectedTitle && CALLSIGNS[selectedTitle]) {
      return selectedTitle;
    }
    return 'rookie'; // Default callsign
  }, [selectedTitle]);
  
  const currentCallsign = CALLSIGNS[displayCallsignKey];

  // Get callsigns for the active category - all unlocked for everyone!
  const { unlocked, locked } = useMemo(() => {
    if (activeCategory === 'all') {
      // Show all callsigns across categories
      const allCallsigns = Object.entries(CALLSIGNS)
        .sort((a, b) => (b[1].tier || 0) - (a[1].tier || 0));
      return { unlocked: allCallsigns, locked: [] };
    }
    return getCategorizedCallsigns(activeCategory);
  }, [activeCategory]);

  const handleCallsignSelect = async (callsignKey) => {
    setShowPicker(false);
    if (onTitleChange) {
      onTitleChange(callsignKey);
    }
  };

  // Total callsigns available
  const totalCallsigns = TOTAL_CALLSIGNS;

  return (
    <div className={styles.container}>
      {/* Format: "Mike, known as [Callsign]" */}
      <button
        className={styles.titleButton}
        onClick={() => setShowPicker(!showPicker)}
        style={{ '--title-color': getCallsignColor(currentCallsign.tier, currentCallsign.category) }}
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
                      style={{ '--callsign-color': getCallsignColor(callsign.tier, callsign.category) }}
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
              {totalCallsigns} callsigns available
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
