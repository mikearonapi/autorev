'use client';

/**
 * AL Quick Actions Popup
 *
 * A popup with pre-configured AL prompts specific to the current page context.
 * Users can tap a quick action to send that prompt to AL.
 */

import { useState, useEffect, useCallback } from 'react';

import Image from 'next/image';

import { createPortal } from 'react-dom';

import { useAIChat } from '@/components/AIChatContext';
import { UI_IMAGES } from '@/lib/images';

import styles from './ALQuickActionsPopup.module.css';

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
 * ALQuickActionsPopup Component
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the popup is open
 * @param {function} props.onClose - Callback when popup closes
 * @param {string} props.title - Popup title (e.g., "Ask AL About Parts")
 * @param {string} props.subtitle - Optional subtitle text
 * @param {Array} props.actions - Array of action objects with { label, prompt, icon? }
 * @param {Object} props.context - Context to pass to AL (carName, carId, etc.)
 */
export default function ALQuickActionsPopup({
  isOpen,
  onClose,
  title = 'Quick Actions',
  subtitle,
  actions = [],
  context = {},
}) {
  const [isMounted, setIsMounted] = useState(false);
  const { openChatWithPrompt } = useAIChat();

  // Portal mounting - required for SSR compatibility
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle escape key
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const handleActionClick = useCallback(
    (action) => {
      // Build the full prompt with context
      let fullPrompt = action.prompt;

      if (context.carName) {
        fullPrompt += `\n\nContext: I'm working on my ${context.carName}.`;
      }
      if (context.upgrades?.length > 0) {
        const upgradeNames = context.upgrades
          .map(getUpgradeName)
          .filter((n) => n !== 'Unknown')
          .join(', ');
        if (upgradeNames) {
          fullPrompt += `\nMy current upgrades: ${upgradeNames}`;
        }
      }

      // Navigate to AL page and auto-send the prompt immediately
      openChatWithPrompt(
        fullPrompt,
        {
          category: context.category || 'AL Quick Action',
          carId: context.carId,
        },
        action.label,
        { autoSend: true }
      );

      onClose?.();
    },
    [context, openChatWithPrompt, onClose]
  );

  // Don't render until mounted (SSR) or if not open
  if (!isMounted || !isOpen) return null;

  const popupContent = (
    <div className={styles.overlay} onClick={handleBackdropClick} data-overlay-modal>
      <div className={styles.popup} role="dialog" aria-modal="true">
        {/* Close Button */}
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header with AL Avatar */}
        <div className={styles.header}>
          <div className={styles.avatarWrapper}>
            <Image
              src={UI_IMAGES.alMascot}
              alt="AL"
              unoptimized
              width={56}
              height={56}
              className={styles.avatar}
            />
          </div>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>

        {/* Quick Actions */}
        <div className={styles.actions}>
          {actions.map((action, index) => (
            <button
              key={index}
              className={styles.actionBtn}
              onClick={() => handleActionClick(action)}
            >
              {action.icon && <span className={styles.actionIcon}>{action.icon}</span>}
              <span className={styles.actionLabel}>{action.label}</span>
              <svg
                className={styles.actionArrow}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <p className={styles.hint}>Or type your own question in the search bar</p>
      </div>
    </div>
  );

  return createPortal(popupContent, document.body);
}

/**
 * Generate dynamic quick actions based on user's selected upgrades
 * @param {Array} upgrades - Array of upgrade objects with name, key, category
 * @param {string} carName - Name of the car (model name without brand)
 * @param {string} _carId - Car ID for database operations (unused, kept for API compatibility)
 * @param {Object} [options] - Additional options
 * @param {string} [options.carBrand] - Brand name (e.g., "Ford") to construct full display name
 * @param {string} [options.carSlug] - Car slug for URL routing (if needed)
 * @returns {Array} Array of action objects - one for each upgrade plus compatibility check
 */
export function generatePartsPageActions(
  upgrades = [],
  carName = 'my car',
  _carId = null,
  options = {}
) {
  const actions = [];

  // Construct full display name with brand if available (e.g., "Ford Mustang SVT Cobra")
  // This ensures the AI knows the exact make/model for parts research
  const { carBrand } = options;
  const fullCarName =
    carBrand && carName && !carName.toLowerCase().startsWith(carBrand.toLowerCase())
      ? `${carBrand} ${carName}`
      : carName;

  // Get upgrade names list for prompts
  const upgradeNames = upgrades.map(getUpgradeName).filter((n) => n !== 'Unknown');
  const upgradeNameList = upgradeNames.join(', ');

  // Always include compatibility check if there are upgrades
  if (upgrades.length > 0 && upgradeNameList) {
    actions.push({
      label: 'Check my build compatibility',
      prompt: `Please review my ${fullCarName} build for any compatibility issues. I have selected: ${upgradeNameList}. Are there any conflicts? What supporting mods might I be missing?`,
    });
  }

  // Generate specific prompts for EVERY upgrade - no limit
  // Uses research_parts_live for real vendor search with purchase links
  const upgradeActions = upgrades
    .map((upgrade) => {
      const name = getUpgradeName(upgrade);
      // Use the actual upgrade key for consistent database storage/retrieval
      const upgradeKey =
        typeof upgrade === 'object'
          ? upgrade.key || name.toLowerCase().replace(/\s+/g, '-')
          : name.toLowerCase().replace(/\s+/g, '-');
      if (name === 'Unknown') return null;
      return {
        label: `See ${name} Options`,
        prompt: `Find me the best ${name.toLowerCase()} options for my ${fullCarName}.

USE THE research_parts_live TOOL with these parameters:
- car_slug: "${carSlug || ''}"
- upgrade_type: "${upgradeKey}"

Then format the results as a Top 5 list:

## Top 5 ${name} Picks for ${fullCarName}

For each pick:

**1) [Brand] [Product Name]**

**Why it's recommended:** [1-2 sentences based on what you found]

**What differentiates it:** [What makes this unique vs others]

**Price:** $XXX (from the search results)

**Buy from:** [Vendor Name](actual_url_from_results)

---

[Continue for picks 2-5]

---

### Quick Buying Guide
- **Best overall:** [Pick name] - [one line why]
- **Best value:** [Pick name] - [one line why]
- **Best for performance:** [Pick name] - [one line why]

Use the ACTUAL URLs and prices from research_parts_live results.

IMPORTANT: After your user-facing response, you MUST include a <parts_to_save> JSON block at the very end (this gets saved to the database and is stripped before display):
<parts_to_save>
{
  "car_slug": "${carSlug || ''}",
  "upgrade_key": "${upgradeKey}",
  "parts": [
    {
      "brand_name": "...",
      "product_name": "...",
      "price": 1299,
      "source_url": "https://...",
      "rank": 1,
      "why_recommended": "...",
      "best_for": "Stage 1-2 builds",
      "fitment_confidence": "confirmed"
    }
  ]
}
</parts_to_save>`,
      };
    })
    .filter(Boolean);

  actions.push(...upgradeActions);

  // Always add "what's next" at the end
  if (upgradeNameList) {
    actions.push({
      label: 'What should I upgrade next?',
      prompt: `Based on my ${fullCarName} with these mods: ${upgradeNameList}, what modification should I do next for the best performance gains? Consider cost-effectiveness and supporting mods.`,
    });
  }

  return actions;
}

/**
 * Fallback quick actions when no upgrades are selected
 */
export const defaultPartsPageActions = [
  {
    label: 'What should I upgrade first?',
    prompt:
      "I'm just getting started with modifying my car. What are the best first modifications for performance gains? Consider cost-effectiveness and ease of installation.",
  },
  {
    label: 'Best bang for buck mods',
    prompt:
      'What are the best bang-for-buck modifications for my car? Rank them by performance gained per dollar spent.',
  },
  {
    label: 'Stage 1 vs Stage 2 explained',
    prompt:
      'Explain the difference between Stage 1 and Stage 2 modifications. What parts are typically included in each stage and what are the power gains?',
  },
  {
    label: 'Will mods void my warranty?',
    prompt:
      'Which common modifications might void my factory warranty? What can I do to protect myself?',
  },
];

/**
 * Pre-configured quick actions for the Build page
 */
export const buildPageActions = [
  {
    label: 'What mods for my goals?',
    prompt:
      'Based on my car, recommend modifications that would best achieve my performance goals. Consider daily driveability, reliability, and budget.',
  },
  {
    label: 'Stage 1 vs Stage 2 comparison',
    prompt:
      'Compare Stage 1 vs Stage 2 for my car. What are the power gains, costs, reliability impacts, and required supporting mods for each?',
  },
  {
    label: 'Best bang for buck mods',
    prompt:
      'What are the best bang-for-buck modifications for my car? Rank them by HP gained per dollar spent.',
  },
  {
    label: 'Will this void my warranty?',
    prompt:
      'Which of my planned modifications might void my factory warranty? What can I do to protect myself?',
  },
];

/**
 * Pre-configured quick actions for the Performance page
 */
export const performancePageActions = [
  {
    label: 'How accurate are these estimates?',
    prompt:
      'How accurate are the performance estimates for my build? What factors could cause my actual results to differ?',
  },
  {
    label: 'What affects 0-60 the most?',
    prompt:
      'What modifications have the biggest impact on 0-60 times for my car? What are the diminishing returns?',
  },
  {
    label: 'Improve track performance',
    prompt:
      'What should I focus on to improve my lap times? Consider power, handling, braking, and weight.',
  },
];
