'use client';

/**
 * AskALButton Component
 * 
 * A small "Ask AL" quick action button for spec sections.
 * When clicked, opens the AI chat with a prefilled prompt about the component.
 */

import { useAIChat } from './AIMechanicChat';
import styles from './AskALButton.module.css';

// Small AL icon for the button
const ALIcon = ({ size = 16 }) => (
  <img 
    src="/images/al-mascot.png" 
    alt=""
    width={size} 
    height={size}
    className={styles.alIcon}
  />
);

/**
 * AskALButton - Triggers AI chat with a contextual prompt
 * 
 * @param {string} category - The category/section name (e.g., "Fluids", "Brakes")
 * @param {string} prompt - The full question to ask AL
 * @param {string} carName - Optional car name for context
 * @param {string} variant - Button variant: 'icon' (just icon), 'compact' (icon + small text), 'full' (icon + full text)
 * @param {string} className - Additional CSS classes
 */
export default function AskALButton({ 
  category,
  prompt,
  carName,
  variant = 'icon',
  className = '',
}) {
  const { openChatWithPrompt } = useAIChat();
  
  const handleClick = (e) => {
    e.stopPropagation(); // Prevent triggering parent click handlers
    
    // Build the prompt
    const fullPrompt = prompt || `Tell me about ${category}${carName ? ` for my ${carName}` : ''}`;
    
    openChatWithPrompt(fullPrompt, {
      category,
      carName,
    });
  };
  
  const variantClass = styles[`variant${variant.charAt(0).toUpperCase() + variant.slice(1)}`] || '';
  
  return (
    <button
      className={`${styles.askALButton} ${variantClass} ${className}`}
      onClick={handleClick}
      title={`Ask AL about ${category}`}
      aria-label={`Ask AL about ${category}`}
    >
      <ALIcon size={variant === 'icon' ? 16 : 14} />
      {variant !== 'icon' && (
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
  children,
  className = '',
}) {
  const { openChatWithPrompt } = useAIChat();
  
  const handleClick = (e) => {
    e.stopPropagation();
    const fullPrompt = prompt || `Tell me about ${category}${carName ? ` for my ${carName}` : ''}`;
    openChatWithPrompt(fullPrompt, { category, carName });
  };
  
  return (
    <button
      className={`${styles.askALInline} ${className}`}
      onClick={handleClick}
      title={`Ask AL about ${category}`}
    >
      <ALIcon size={12} />
      {children || 'Ask AL'}
    </button>
  );
}



