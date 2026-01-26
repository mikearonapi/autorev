'use client';

/**
 * AL Parts Search Input
 * 
 * Inline AI search input for quick parts questions and recommendations.
 * Users can type questions about parts, compatibility, or get suggestions.
 * 
 * Features:
 * - Text input for custom questions
 * - Clickable avatar opens quick actions popup with preset prompts
 */

import { useState, useCallback, useRef } from 'react';

import Image from 'next/image';

import { useAIChat } from '@/components/AIChatContext';
import ALQuickActionsPopup, { generatePartsPageActions, defaultPartsPageActions } from '@/components/ALQuickActionsPopup';
import { Icons } from '@/components/ui/Icons';
import { UI_IMAGES } from '@/lib/images';

import styles from './ALRecommendationsButton.module.css';

/**
 * Helper to get display name from an upgrade (handles string, object, or nested formats)
 */
function getUpgradeName(upgrade) {
  if (typeof upgrade === 'string') return upgrade;
  if (typeof upgrade === 'object' && upgrade !== null) {
    if (typeof upgrade.name === 'string') return upgrade.name;
    if (typeof upgrade.label === 'string') return upgrade.label;
    if (typeof upgrade.key === 'string') return upgrade.key;
  }
  return 'Unknown';
}

/**
 * AL Avatar component - now clickable
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

export default function ALRecommendationsButton({
  carName,
  carSlug,
  upgrades = [],
  selectedParts = [],
  totalHpGain = 0,
  totalCostRange = null,
}) {
  const [query, setQuery] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const inputRef = useRef(null);
  const { openChatWithPrompt } = useAIChat();

  const handleSubmit = useCallback((e) => {
    e?.preventDefault();
    
    if (!query.trim()) return;

    // Build context about the current build
    const upgradeNames = upgrades.map(getUpgradeName).filter(n => n !== 'Unknown').join(', ');
    const buildContext = upgrades.length > 0 && upgradeNames
      ? `\n\nContext - My current build for ${carName}:\n- Upgrades: ${upgradeNames}\n- HP gain target: +${totalHpGain} HP`
      : `\n\nContext - I'm working on my ${carName}.`;

    const partsContext = selectedParts.filter(p => p.brandName || p.partName).length > 0
      ? `\n- Parts already selected: ${selectedParts.filter(p => p.brandName || p.partName).map(p => `${p.brandName || ''} ${p.partName || ''}`.trim()).join(', ')}`
      : '';

    const fullPrompt = `${query.trim()}${buildContext}${partsContext}`;

    openChatWithPrompt(fullPrompt, {
      category: `Parts for ${carName}`,
      carSlug,
    }, query.trim(), { autoSend: true });

    // Clear input after sending
    setQuery('');
  }, [query, carName, carSlug, upgrades, selectedParts, totalHpGain, openChatWithPrompt]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <>
      <form 
        className={styles.alSearchContainer}
        onSubmit={handleSubmit}
        role="search"
        aria-label="Ask AL about parts"
      >
        <ALAvatar size={36} onClick={() => setShowQuickActions(true)} />
        <div className={styles.alInputWrapper}>
          <input
            ref={inputRef}
            type="text"
            className={styles.alInput}
            placeholder="Ask AL about parts, compatibility, recommendations..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Ask AL a question about parts"
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
        title="Ask AL About Parts"
        subtitle={upgrades.length > 0 ? `${upgrades.length} upgrades selected` : 'Get help finding parts'}
        actions={upgrades.length > 0 ? generatePartsPageActions(upgrades, carName) : defaultPartsPageActions}
        context={{
          carName,
          carSlug,
          upgrades,
          category: `Parts for ${carName}`,
        }}
      />
    </>
  );
}
