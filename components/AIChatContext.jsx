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
 */

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { UI_IMAGES } from '@/lib/images';
import styles from './AIChatLauncher.module.css';

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
 */
export function useAIChat() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return useMemo(() => {
    const openChat = () => {
      setState({ hasLoadedChat: true, isOpen: true });
    };

    const closeChat = () => {
      setState({ isOpen: false });
    };

    const toggleChat = () => {
      setState({ hasLoadedChat: true, isOpen: !snap.isOpen });
    };

    const openChatWithPrompt = (prompt, context = {}, displayMessage = null, extra = {}) => {
      if (typeof prompt !== 'string' || !prompt.trim()) {
        console.warn('[useAIChat] openChatWithPrompt called without a valid prompt');
        return;
      }
      setState({
        hasLoadedChat: true,
        isOpen: true,
        pendingPrompt: {
          prompt,
          context,
          displayMessage,
          options: extra?.options,
        },
      });
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
  }, [snap.isOpen, snap.hasLoadedChat, snap.pendingPrompt]);
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

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return (
    <>
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


