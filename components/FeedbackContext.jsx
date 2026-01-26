'use client';

/**
 * Lightweight feedback public API + on-demand host.
 *
 * WHY:
 * - `components/FeedbackWidget.jsx` is large and imports `html2canvas`.
 * - Importing it globally increases JS parse/execute time (TBT).
 *
 * STRATEGY:
 * - Use a tiny module-level store (useSyncExternalStore) for state + actions.
 * - Mount `FeedbackHost` (client component) in `app/layout.jsx` without wrapping
 *   the whole app (avoid creating a huge client boundary).
 * - Dynamically load the heavy widget only when opened.
 */

import { useMemo, useRef, useSyncExternalStore } from 'react';

import dynamic from 'next/dynamic';

const FeedbackWidget = dynamic(() => import('@/components/FeedbackWidget'), {
  ssr: false,
});

export function useFeedback() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return useMemo(() => {
    const openFeedback = ({ context = null, preselectedCategory = null, preselectedType = null, customHint = null } = {}) => {
      setState({
        hasLoadedWidget: true,
        isOpen: true,
        config: { context, preselectedCategory, preselectedType, customHint },
      });
    };

    const openCarRequest = (customHint = null) => {
      setState({
        hasLoadedWidget: true,
        isOpen: true,
        config: {
          context: 'car-request',
          preselectedCategory: 'feature',
          preselectedType: 'car_request',
          customHint: customHint || "Tell us which car you'd like to see added to our database.",
        },
      });
    };

    const openBugReport = (customHint = null) => {
      setState({
        hasLoadedWidget: true,
        isOpen: true,
        config: {
          context: 'bug-report',
          preselectedCategory: 'bug',
          preselectedType: 'bug',
          customHint: customHint || "Describe what went wrong and we'll fix it ASAP.",
        },
      });
    };

    const closeFeedback = () => {
      setState({ isOpen: false });
    };

    return {
      isOpen: snap.isOpen,
      hasLoadedWidget: snap.hasLoadedWidget,
      config: snap.config,
      openFeedback,
      openCarRequest,
      openBugReport,
      closeFeedback,
    };
  }, [snap.isOpen, snap.hasLoadedWidget, snap.config]);
}

/** @type {{ isOpen: boolean; hasLoadedWidget: boolean; config: { context: any; preselectedCategory: any; preselectedType: any; customHint: any } }} */
let state = {
  isOpen: false,
  hasLoadedWidget: false,
  config: { context: null, preselectedCategory: null, preselectedType: null, customHint: null },
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
 * Host component that mounts the heavy widget only after first open.
 * Must be inside the existing provider tree (Auth, etc.) so the widget works.
 */
export function FeedbackHost() {
  const { isOpen, hasLoadedWidget, config, closeFeedback } = useFeedback();
  const closeTimerRef = useRef(null);

  const handleExternalClose = () => {
    closeFeedback();
    // Reset config after close animation (matches previous behavior)
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setState({ config: { context: null, preselectedCategory: null, preselectedType: null, customHint: null } });
    }, 300);
  };

  if (!hasLoadedWidget) return null;

  return (
    <FeedbackWidget
      context={config.context}
      preselectedCategory={config.preselectedCategory}
      preselectedType={config.preselectedType}
      customHint={config.customHint}
      isExternalOpen={isOpen}
      onExternalClose={handleExternalClose}
      showButton={false}
    />
  );
}

