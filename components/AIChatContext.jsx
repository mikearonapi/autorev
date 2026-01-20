'use client';

/**
 * AI Chat Navigation API
 *
 * Provides `openChatWithPrompt()` hook for navigating to the /al page
 * with a pre-filled prompt from anywhere in the app.
 * 
 * HISTORY:
 * - Previously rendered a popup chat via AIMechanicChat.jsx
 * - Now simplified to just navigation - all AL chat is on /al page (ALPageClient.jsx)
 * - AIMechanicChat.jsx is DEPRECATED (renamed to .DEPRECATED.jsx)
 */

import { useRouter } from 'next/navigation';
import { setPendingALPrompt } from '@/components/AskALButton';

/**
 * Hook used throughout the app for navigating to AL chat with a prompt.
 * 
 * Usage:
 *   const { openChatWithPrompt } = useAIChat();
 *   openChatWithPrompt('Help me choose a car', { category: 'Buying' }, 'Find my perfect car');
 */
export function useAIChat() {
  const router = useRouter();

  /**
   * Navigate to the /al page with a pre-filled prompt.
   * 
   * @param {string} prompt - The actual prompt to send to AL
   * @param {object} context - Additional context (category, carSlug, etc.)
   * @param {string|null} displayMessage - User-friendly message to show (defaults to prompt)
   * @param {object} extra - Extra options (e.g., { options: [...] } for multi-option mode)
   */
  const openChatWithPrompt = (prompt, context = {}, displayMessage = null, extra = {}) => {
    if (typeof prompt !== 'string' || !prompt.trim()) {
      console.warn('[useAIChat] openChatWithPrompt called without a valid prompt');
      return;
    }
    
    // Store the prompt in sessionStorage for the AL page to pick up
    setPendingALPrompt({
      prompt,
      displayMessage: displayMessage || prompt,
      context,
      options: extra?.options,
    });
    
    // Navigate to the AL page
    router.push('/al');
  };

  return {
    openChatWithPrompt,
  };
}


