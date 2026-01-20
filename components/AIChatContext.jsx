'use client';

/**
 * AI chat public API (lightweight) + on-demand chat host.
 *
 * GOAL (performance):
 * - Avoid importing `components/AIMechanicChat.jsx` (~2000+ LOC) in common UI
 *   components (Header, buttons, etc.), which increases JS parse/execute time
 *   and TBT.
 *
 * IMPORTANT (Next.js hydration):
 * - Do NOT wrap the entire app in a Client Provider. That creates a large client
 *   boundary that can delay hydration of the whole page.
 *
 * STRATEGY:
 * - Use a tiny module-level store (useSyncExternalStore) for state + actions.
 * - Mount a small `AIChatHost` client component in `app/layout.jsx`.
 * - Dynamically load the heavy chat UI only after the user opens chat.
 * 
 * UPDATE: openChatWithPrompt now navigates to /al page instead of opening popup.
 * The floating launcher still opens the popup for quick access.
 */

import { useEffect, useState, useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { UI_IMAGES } from '@/lib/images';
import styles from './AIChatLauncher.module.css';
import { setPendingALPrompt } from '@/components/AskALButton';

const AIMechanicChat = dynamic(() => import('@/components/AIMechanicChat'), {
  ssr: false,
});

/** @typedef {{ prompt: string, context: object, displayMessage: string | null, options?: any }} PendingPrompt */

/** @type {{ isOpen: boolean; hasLoadedChat: boolean; pendingPrompt: PendingPrompt | null }} */
let state = {
  isOpen: false,
  hasLoadedChat: false,
  pendingPrompt: null,
};

/** @type {Set<() => void>} */
const listeners = new Set();

function notify() {
  for (const l of listeners) l();
}

function setState(patch) {
  state = { ...state, ...patch };
  notify();
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

/**
 * Hook used throughout the app (Header, AskALButton, etc.)
 * Keeps the same surface area as the previous provider-based API.
 * 
 * NOTE: openChatWithPrompt now navigates to /al page instead of opening popup.
 * Use openChat/toggleChat for the popup behavior.
 */
export function useAIChat() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const router = useRouter();

  // Stable function references that don't depend on snap state
  const openChat = () => {
    setState({ hasLoadedChat: true, isOpen: true });
  };

  const closeChat = () => {
    setState({ isOpen: false });
  };

  const toggleChat = () => {
    setState({ hasLoadedChat: true, isOpen: !state.isOpen });
  };

  /**
   * Navigate to the /al page with a pre-filled prompt.
   * This replaces the old popup behavior for a better UX.
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

  const clearPendingPrompt = () => {
    setState({ pendingPrompt: null });
  };

  return {
    isOpen: snap.isOpen,
    hasLoadedChat: snap.hasLoadedChat,
    pendingPrompt: snap.pendingPrompt,
    openChat,
    closeChat,
    toggleChat,
    openChatWithPrompt,
    clearPendingPrompt,
  };
}

/**
 * Host component that renders:
 * - a lightweight floating launcher button
 * - the heavy chat UI (only after first open)
 *
 * Must be mounted inside the existing provider tree (Auth/Compare/etc.)
 * so the chat component can access its required contexts.
 */
export function AIChatHost() {
  const { isOpen, hasLoadedChat, pendingPrompt, toggleChat, clearPendingPrompt } = useAIChat();
  const [isHydrated, setIsHydrated] = useState(false);
  const pathname = usePathname();
  
  // DISABLED: Floating AL launcher removed from all pages
  // App routes have AL in bottom tab bar, marketing pages don't need it
  const showFloatingLauncher = false;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return (
    <>
      {/* Floating launcher - DISABLED (removed from site) */}
      {showFloatingLauncher && (
        <button
          type="button"
          className={`${styles.launcher} ${isOpen ? styles.launcherOpen : ''}`}
          onClick={toggleChat}
          aria-label="Ask AL"
          data-ai-chat-hydrated={isHydrated ? 'true' : 'false'}
          data-ai-chat-open={isOpen ? 'true' : 'false'}
        >
          <Image className={styles.icon} src={UI_IMAGES.alMascotFull} alt="AL" width={56} height={56} loading="lazy" />
        </button>
      )}

      {hasLoadedChat && (
        <AIMechanicChat
          externalOpen={isOpen}
          onOpenChange={(value) => setState({ isOpen: value, hasLoadedChat: true })}
          showFloatingButton={false}
          pendingPrompt={pendingPrompt}
          onClearPendingPrompt={clearPendingPrompt}
        />
      )}
    </>
  );
}


