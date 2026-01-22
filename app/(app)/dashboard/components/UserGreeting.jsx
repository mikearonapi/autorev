'use client';

/**
 * UserGreeting Component
 * 
 * Personalized greeting with selectable titles.
 * Titles are unlocked based on user achievements.
 * 
 * Format: "Hi Mike, the [Title]" - all on one row
 * Title is clickable to open picker
 */

import { useState, useMemo } from 'react';
import styles from './UserGreeting.module.css';

// Title definitions with display names, descriptions, unlock requirements, and colors
// Organized by tier - higher tier = more prestigious
export const TITLES = {
  // Tier 1 - Default/Starter
  rookie: {
    display: 'Rookie',
    description: 'Just getting started',
    tier: 1,
    color: '#94a3b8',
  },
  curious_one: {
    display: 'Curious One',
    description: 'Exploring the platform',
    tier: 1,
    color: '#94a3b8',
  },

  // Tier 2 - Basic Engagement
  gear_head: {
    display: 'Gear Head',
    description: 'Has vehicles in garage',
    tier: 2,
    color: '#10b981',
  },
  weekend_warrior: {
    display: 'Weekend Warrior',
    description: 'Active enthusiast',
    tier: 2,
    color: '#3b82f6',
  },
  garage_dweller: {
    display: 'Garage Dweller',
    description: 'Spends time in the garage',
    tier: 2,
    color: '#10b981',
  },

  // Tier 3 - Active Users
  wrench_turner: {
    display: 'Wrench Turner',
    description: 'Hands-on modifier',
    tier: 3,
    color: '#f59e0b',
  },
  community_regular: {
    display: 'Community Regular',
    description: 'Active in the community',
    tier: 3,
    color: '#3b82f6',
  },
  mod_enthusiast: {
    display: 'Mod Enthusiast',
    description: 'Loves modifications',
    tier: 3,
    color: '#f59e0b',
  },
  parts_hunter: {
    display: 'Parts Hunter',
    description: 'Always searching for the next upgrade',
    tier: 3,
    color: '#10b981',
  },

  // Tier 4 - Dedicated Users
  build_master: {
    display: 'Build Master',
    description: 'Multiple builds completed',
    tier: 4,
    color: '#8b5cf6',
  },
  data_nerd: {
    display: 'Data Nerd',
    description: 'Logs performance data',
    tier: 4,
    color: '#10b981',
  },
  dyno_junkie: {
    display: 'Dyno Junkie',
    description: 'Lives for dyno pulls',
    tier: 4,
    color: '#ef4444',
  },
  track_rat: {
    display: 'Track Rat',
    description: 'Regular at the track',
    tier: 4,
    color: '#ef4444',
  },

  // Tier 5 - Power Users
  ai_ronin: {
    display: 'AI Ronin',
    description: 'Master of AL conversations',
    tier: 5,
    color: '#a855f7',
  },
  pit_crew_chief: {
    display: 'Pit Crew Chief',
    description: 'Helps others in community',
    tier: 5,
    color: '#f59e0b',
  },
  speed_demon: {
    display: 'Speed Demon',
    description: 'Always chasing more power',
    tier: 5,
    color: '#ef4444',
  },
  boost_addict: {
    display: 'Boost Addict',
    description: 'Never enough boost',
    tier: 5,
    color: '#a855f7',
  },

  // Tier 6 - Expert Users
  tuning_sensei: {
    display: 'Tuning Sensei',
    description: 'Expert tuning advisor',
    tier: 6,
    color: '#ef4444',
  },
  community_pillar: {
    display: 'Community Pillar',
    description: 'A cornerstone of the community',
    tier: 6,
    color: '#3b82f6',
  },
  horsepower_whisperer: {
    display: 'Horsepower Whisperer',
    description: 'Knows how to extract every HP',
    tier: 6,
    color: '#d4ff00',
  },

  // Tier 7 - Legendary
  garage_legend: {
    display: 'Garage Legend',
    description: 'Top-tier AutoRev member',
    tier: 7,
    color: '#d4ff00',
  },
  apex_predator: {
    display: 'Apex Predator',
    description: 'Dominates all categories',
    tier: 7,
    color: '#d4ff00',
  },
};

/**
 * Get the best auto-selected title based on unlocked titles
 * Returns the highest-tier title the user has unlocked
 */
function getDefaultTitle(unlockedTitles) {
  if (!unlockedTitles || unlockedTitles.length === 0) {
    return 'rookie';
  }
  
  // Sort by tier descending and return highest
  const sorted = [...unlockedTitles]
    .filter(key => TITLES[key])
    .sort((a, b) => (TITLES[b]?.tier || 0) - (TITLES[a]?.tier || 0));
  
  return sorted[0] || 'rookie';
}

/**
 * Count total available titles (for "X more to unlock" message)
 */
const TOTAL_UNLOCKABLE_TITLES = Object.keys(TITLES).length;

export default function UserGreeting({ 
  firstName = 'there',
  selectedTitle = null,
  unlockedTitles = ['rookie'],
  onTitleChange,
}) {
  const [showTitlePicker, setShowTitlePicker] = useState(false);
  
  // Determine which title to display
  // If user has selected a title, use it; otherwise auto-select best one
  const displayTitleKey = useMemo(() => {
    if (selectedTitle && TITLES[selectedTitle]) {
      return selectedTitle;
    }
    return getDefaultTitle(unlockedTitles);
  }, [selectedTitle, unlockedTitles]);
  
  const currentTitle = TITLES[displayTitleKey];

  const handleTitleSelect = async (titleKey) => {
    setShowTitlePicker(false);
    if (onTitleChange) {
      onTitleChange(titleKey);
    }
  };

  // Sort unlocked titles by tier (highest first) for the picker
  const sortedUnlocked = useMemo(() => {
    return [...unlockedTitles]
      .filter(key => TITLES[key])
      .sort((a, b) => (TITLES[b]?.tier || 0) - (TITLES[a]?.tier || 0));
  }, [unlockedTitles]);
  
  // Calculate how many more titles can be unlocked
  const titlesToUnlock = TOTAL_UNLOCKABLE_TITLES - unlockedTitles.length;

  return (
    <div className={styles.container}>
      {/* Format: "Mike, known as [Title]" */}
      <button
        className={styles.titleButton}
        onClick={() => setShowTitlePicker(!showTitlePicker)}
        style={{ 
          '--title-color': currentTitle.color,
        }}
        aria-expanded={showTitlePicker}
        aria-haspopup="listbox"
      >
        <span className={styles.nameText}>{firstName}</span>
        <span className={styles.knownAs}>, known as</span>
        <span className={styles.titleText}>{currentTitle.display}</span>
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

      {/* Title Picker Dropdown */}
      {showTitlePicker && (
        <div className={styles.titlePicker}>
          <div className={styles.titlePickerHeader}>
            <span>Or should we call you...</span>
          </div>
          <div className={styles.titleList} role="listbox">
            {sortedUnlocked.map((titleKey) => {
              const title = TITLES[titleKey];
              if (!title) return null;
              const isSelected = displayTitleKey === titleKey;
              
              return (
                <button
                  key={titleKey}
                  className={`${styles.titleOption} ${isSelected ? styles.titleOptionSelected : ''}`}
                  onClick={() => handleTitleSelect(titleKey)}
                  style={{
                    '--title-color': title.color,
                  }}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className={styles.titleName}>{title.display}</span>
                  <span className={styles.titleDesc}>{title.description}</span>
                  {isSelected && <span className={styles.checkmark}>✓</span>}
                </button>
              );
            })}
          </div>
          {titlesToUnlock > 0 && (
            <div className={styles.titlePickerFooter}>
              <span className={styles.lockedCount}>
                {titlesToUnlock} more to unlock
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
