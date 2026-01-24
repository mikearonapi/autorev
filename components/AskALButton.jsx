'use client';

/**
 * AskALButton Component
 * 
 * A small "Ask AL" quick action button for spec sections.
 * When clicked, navigates to the /al page with a prefilled prompt.
 */

import { useRouter } from 'next/navigation';
import styles from './AskALButton.module.css';

// Storage key for pending AL prompts
const AL_PENDING_PROMPT_KEY = 'autorev_al_pending_prompt';

/**
 * Store a pending prompt for the AL page to pick up
 */
export function setPendingALPrompt(promptData) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(AL_PENDING_PROMPT_KEY, JSON.stringify(promptData));
  }
}

/**
 * Get and clear the pending AL prompt
 */
export function getPendingALPrompt() {
  if (typeof window !== 'undefined') {
    const data = sessionStorage.getItem(AL_PENDING_PROMPT_KEY);
    if (data) {
      sessionStorage.removeItem(AL_PENDING_PROMPT_KEY);
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    }
  }
  return null;
}

// Sparkle icon for the button - 5-pointed star matching brand guidelines
// MUST MATCH: app/(app)/garage/my-specs/page.jsx LocalIcons.sparkle
const SparkleIcon = ({ size = 16, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor"
    className={className}
  >
    <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z" />
  </svg>
);

/**
 * AskALButton - Navigates to /al page with a contextual prompt
 * 
 * @param {string} category - The category/section name (e.g., "Fluids", "Brakes")
 * @param {string} prompt - The full detailed question to ask AL
 * @param {string} displayMessage - Short, clear question shown to user before sending (optional, falls back to prompt)
 * @param {string} carName - Optional car name for context
 * @param {string} carSlug - Optional car slug for context metadata
 * @param {string} variant - Button variant: 'icon' (just icon), 'compact' (icon + small text), 'full' (icon + full text), 'header' (lime CTA for card headers)
 * @param {string} className - Additional CSS classes
 * @param {object} metadata - Optional additional metadata to pass to chat context
 */
export default function AskALButton({ 
  category,
  prompt,
  displayMessage,
  carName,
  carSlug,
  variant = 'icon',
  className = '',
  metadata = {},
}) {
  const router = useRouter();
  
  const handleAskALClick = (e) => {
    e.stopPropagation(); // Prevent triggering parent click handlers
    
    // Build the prompt
    const fullPrompt = prompt || `Tell me about ${category}${carName ? ` for my ${carName}` : ''}`;
    
    // Display message should be short and clear for user preview
    const preview = displayMessage || fullPrompt;
    
    // Store the prompt data for the AL page to pick up
    setPendingALPrompt({
      prompt: fullPrompt,
      displayMessage: preview,
      context: {
        category,
        carName,
        carSlug,
        ...metadata,
      },
    });
    
    // Navigate to the AL page
    router.push('/al');
  };
  
  const variantClass = styles[`variant${variant.charAt(0).toUpperCase() + variant.slice(1)}`] || '';
  
  // All variants show the AL icon now
  const showIcon = true;
  const showText = variant !== 'icon';
  
  return (
    <button
      className={`${styles.askALButton} ${variantClass} ${className}`}
      onClick={handleAskALClick}
      title={`Ask AL about ${category}`}
      aria-label={`Ask AL about ${category}`}
    >
      {showIcon && <SparkleIcon size={variant === 'icon' ? 14 : variant === 'header' ? 12 : 10} className={styles.sparkleIcon} />}
      {showText && (
        <span className={styles.buttonText}>
          {variant === 'compact' ? 'Ask' : `Ask AL`}
        </span>
      )}
    </button>
  );
}

/**
 * AskALInline - An inline version that looks like a link
 * For use within text content
 */
export function AskALInline({ 
  category,
  prompt,
  carName,
  carSlug,
  children,
  className = '',
}) {
  const router = useRouter();
  
  const handleAskALInlineClick = (e) => {
    e.stopPropagation();
    const fullPrompt = prompt || `Tell me about ${category}${carName ? ` for my ${carName}` : ''}`;
    
    // Store the prompt data for the AL page to pick up
    setPendingALPrompt({
      prompt: fullPrompt,
      displayMessage: fullPrompt,
      context: { category, carName, carSlug },
    });
    
    // Navigate to the AL page
    router.push('/al');
  };
  
  return (
    <button
      className={`${styles.askALInline} ${className}`}
      onClick={handleAskALInlineClick}
      title={`Ask AL about ${category}`}
    >
      <SparkleIcon size={10} className={styles.sparkleIcon} />
      {children || 'Ask AL'}
    </button>
  );
}












