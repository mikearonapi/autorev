'use client';

/**
 * AL Build Search Input
 * 
 * Inline AI search input for build strategy questions and recommendations.
 * Users can ask about upgrade order, stage progression, compatibility, etc.
 * 
 * Features:
 * - Text input for custom build strategy questions
 * - Clickable avatar opens quick actions popup with preset prompts
 * - Dynamic prompts based on current build state (goal, upgrades selected)
 */

import { useState, useCallback, useRef } from 'react';

import Image from 'next/image';

import { useAIChat } from '@/components/AIChatContext';
import ALQuickActionsPopup from '@/components/ALQuickActionsPopup';
import { Icons } from '@/components/ui/Icons';
import { UI_IMAGES } from '@/lib/images';

import styles from './ALRecommendationsButton.module.css';

/**
 * Helper to get display name from an upgrade (handles string, object, or nested formats)
 */
function getUpgradeName(upgrade) {
  if (typeof upgrade === 'string') return upgrade;
  if (typeof upgrade === 'object' && upgrade !== null) {
    // Try common name properties
    if (typeof upgrade.name === 'string') return upgrade.name;
    if (typeof upgrade.label === 'string') return upgrade.label;
    if (typeof upgrade.key === 'string') return upgrade.key;
    // If name/label/key is itself an object, try to extract
    if (typeof upgrade.name === 'object' && upgrade.name !== null) {
      return upgrade.name.name || upgrade.name.label || upgrade.name.key || 'Unknown';
    }
  }
  return 'Unknown';
}

/**
 * AL Avatar component - clickable to open quick actions
 */
function ALAvatar({ size = 24, onClick }) {
  return (
    <button 
      type="button"
      className={styles.avatarBtn}
      onClick={onClick}
      aria-label="Open AL quick actions"
    >
      <Image 
        src={UI_IMAGES.alMascot}
        alt="AL"
        unoptimized
        width={size} 
        height={size}
        className={styles.alAvatar}
      />
    </button>
  );
}

/**
 * Generate dynamic quick actions based on build state
 * @param {Array} selectedUpgrades - Array of upgrade objects with name, key
 * @param {string} carName - Name of the car
 * @param {string} goal - Build goal (track, street, daily, show)
 * @param {number} totalHpGain - Current HP gain from selected upgrades
 * @returns {Array} Array of action objects
 */
function generateBuildPageActions(selectedUpgrades = [], carName = 'my car', goal = null, totalHpGain = 0) {
  const actions = [];
  const upgradeCount = selectedUpgrades.length;
  
  // If user has a goal set, add goal-specific prompt first
  if (goal) {
    const upgradeNames = selectedUpgrades.map(getUpgradeName).filter(n => n !== 'Unknown');
    const goalPrompts = {
      track: `I'm building my ${carName} for track use. With my current mods (${upgradeCount > 0 ? upgradeNames.join(', ') : 'none yet'}), what should I prioritize next for lap time improvement?`,
      street: `I'm building my ${carName} as a street/canyon car. What mods give the best driving experience while keeping it reliable for daily spirited driving?`,
      daily: `I want to mod my ${carName} but keep it reliable for daily driving. What's the safest upgrade path that won't sacrifice dependability?`,
      show: `I'm building my ${carName} for shows. What aesthetic and sound modifications make the biggest impact while still adding performance?`,
    };
    
    if (goalPrompts[goal]) {
      actions.push({
        label: `Best mods for ${goal} build`,
        prompt: goalPrompts[goal],
      });
    }
  }
  
  // If user has upgrades selected, add contextual prompts
  if (upgradeCount > 0) {
    // Check what categories they've selected
    // Normalize to string keys - handle both string and object formats
    const upgradeKeys = selectedUpgrades.map(u => {
      if (typeof u === 'string') return u;
      if (typeof u === 'object' && u !== null) {
        const key = u.key || u.name || '';
        return typeof key === 'string' ? key : '';
      }
      return '';
    }).filter(k => typeof k === 'string' && k.length > 0);
    
    // Safe string check helper
    const keyIncludes = (k, str) => typeof k === 'string' && k.includes(str);
    
    const hasTune = upgradeKeys.some(k => keyIncludes(k, 'tune') || keyIncludes(k, 'ecu'));
    const hasIntake = upgradeKeys.some(k => keyIncludes(k, 'intake'));
    const hasExhaust = upgradeKeys.some(k => keyIncludes(k, 'exhaust') || keyIncludes(k, 'downpipe') || k === 'headers');
    
    // Get upgrade names for prompts
    const upgradeNameList = selectedUpgrades.map(getUpgradeName).filter(n => n !== 'Unknown').join(', ');
    
    // Add "what's missing" prompt
    actions.push({
      label: 'What am I missing?',
      prompt: `I have these mods selected for my ${carName}: ${upgradeNameList} (+${totalHpGain} HP). Are there any supporting mods I'm missing that could cause issues? What would you add?`,
    });
    
    // Add order/sequence prompt
    actions.push({
      label: 'Best install order?',
      prompt: `For my ${carName} build with: ${upgradeNameList}, what's the best order to install these? Which should I do first and why?`,
    });
    
    // If they have a tune, ask about tune requirements
    if (hasTune && (hasIntake || hasExhaust)) {
      actions.push({
        label: 'Do I need a custom tune?',
        prompt: `I'm planning ${upgradeNameList} for my ${carName}. Do I need a custom tune, or can I use an off-the-shelf tune? What are the risks of each approach?`,
      });
    }
    
    // If no tune but has other mods, suggest tune consideration
    if (!hasTune && (hasIntake || hasExhaust)) {
      actions.push({
        label: 'Should I add a tune?',
        prompt: `I'm planning ${upgradeNameList} for my ${carName} but haven't selected a tune. Will I get the full benefit of these mods without a tune? What are my options?`,
      });
    }
  } else {
    // No upgrades selected - show getting started prompts
    actions.push({
      label: 'Where should I start?',
      prompt: `I'm just starting to mod my ${carName}. What are the best first modifications for a beginner? Consider cost, ease of installation, and impact.`,
    });
    
    actions.push({
      label: 'Stage 1 explained',
      prompt: `What does a typical Stage 1 setup look like for my ${carName}? What parts are included, what HP can I expect, and what's the approximate cost?`,
    });
  }
  
  // Always add the bang for buck prompt
  actions.push({
    label: 'Best bang for buck?',
    prompt: `What are the highest value modifications for my ${carName}? I want the most HP per dollar spent.`,
  });
  
  // Always add warranty prompt
  actions.push({
    label: 'Warranty concerns?',
    prompt: `Which modifications for my ${carName} are most likely to void the factory warranty? How can I minimize risk?`,
  });
  
  return actions;
}

export default function ALBuildSearchInput({
  carName,
  carSlug,
  selectedUpgrades = [],
  totalHpGain = 0,
  goal = null,
}) {
  const [query, setQuery] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const inputRef = useRef(null);
  const { openChatWithPrompt } = useAIChat();

  const handleSubmit = useCallback((e) => {
    e?.preventDefault();
    
    if (!query.trim()) return;

    // Build context about the current build
    const upgradeNames = selectedUpgrades.map(getUpgradeName).filter(n => n !== 'Unknown').join(', ');
    const upgradeContext = selectedUpgrades.length > 0 
      ? `\n\nContext - My current build plan for ${carName}:\n- Upgrades selected: ${upgradeNames}\n- Estimated HP gain: +${totalHpGain} HP`
      : `\n\nContext - I'm planning a build for my ${carName}.`;

    const goalContext = goal 
      ? `\n- Build goal: ${goal}` 
      : '';

    const fullPrompt = `${query.trim()}${upgradeContext}${goalContext}`;

    openChatWithPrompt(fullPrompt, {
      category: `Build Planning for ${carName}`,
      carSlug,
    }, query.trim(), { autoSend: true });

    // Clear input after sending
    setQuery('');
  }, [query, carName, carSlug, selectedUpgrades, totalHpGain, goal, openChatWithPrompt]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  // Generate dynamic actions based on current build state
  const quickActions = generateBuildPageActions(selectedUpgrades, carName, goal, totalHpGain);

  return (
    <>
      <form 
        className={styles.alSearchContainer}
        onSubmit={handleSubmit}
        role="search"
        aria-label="Ask AL about your build"
      >
        <ALAvatar size={36} onClick={() => setShowQuickActions(true)} />
        <div className={styles.alInputWrapper}>
          <input
            ref={inputRef}
            type="text"
            className={styles.alInput}
            placeholder="Ask AL about mods, order, compatibility..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Ask AL a question about your build"
          />
        </div>
        <button
          type="submit"
          className={styles.alSendBtn}
          disabled={!query.trim()}
          aria-label="Send question to AL"
        >
          <Icons.arrowUp size={20} />
        </button>
      </form>

      {/* Quick Actions Popup */}
      <ALQuickActionsPopup
        isOpen={showQuickActions}
        onClose={() => setShowQuickActions(false)}
        title="Ask AL About Your Build"
        subtitle={selectedUpgrades.length > 0 
          ? `${selectedUpgrades.length} upgrades • +${totalHpGain} HP` 
          : 'Get help planning your build'}
        actions={quickActions}
        context={{
          carName,
          carSlug,
          upgrades: selectedUpgrades,
          category: `Build Planning for ${carName}`,
        }}
      />
    </>
  );
}
