'use client';

/**
 * HeroCTA Component
 *
 * Client component for homepage CTA buttons and auth modal.
 * Handles:
 * - Login/Sign up button with auth modal
 * - Download button for PWA install
 *
 * Extracted from homepage to allow the main page to be a Server Component.
 */

import { useState } from 'react';

import dynamic from 'next/dynamic';

import { useAuthModal } from '@/components/AuthModal';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import usePWAInstall from '@/hooks/usePWAInstall';

import styles from './HeroCTA.module.css';

// Lazy load AuthModal - only needed when user clicks CTA
const AuthModal = dynamic(() => import('@/components/AuthModal'), {
  ssr: false,
  loading: () => null,
});

export default function HeroCTA() {
  const authModal = useAuthModal();
  const [showPWAModal, setShowPWAModal] = useState(false);

  // PWA Install
  const { isInstalled, canPromptNatively, promptInstall } = usePWAInstall();

  // Handle download click - always available on homepage
  const handleDownload = async () => {
    if (canPromptNatively) {
      // Chrome/Edge - trigger native install prompt
      const result = await promptInstall();
      // If prompt was dismissed or unavailable, show instructions as fallback
      if (result.outcome !== 'accepted') {
        setShowPWAModal(true);
      }
    } else {
      // iOS/Safari/or prompt already used - show instructions modal
      setShowPWAModal(true);
    }
  };

  return (
    <>
      {/* CTA Button */}
      <button className={styles.ctaButton} onClick={() => authModal.openSignIn()}>
        LOGIN / GET STARTED FREE
      </button>

      {/* Download link - always show unless already installed as PWA */}
      {!isInstalled && (
        <button className={styles.downloadLink} onClick={handleDownload}>
          Download
        </button>
      )}

      {/* Auth Modal - lazy loaded */}
      <AuthModal
        isOpen={authModal.isOpen}
        onClose={authModal.close}
        defaultMode={authModal.defaultMode}
      />

      {/* PWA Install Modal (iOS instructions) */}
      {showPWAModal && (
        <PWAInstallPrompt
          variant="modal"
          forceShow={true}
          onDismissed={() => setShowPWAModal(false)}
        />
      )}
    </>
  );
}

/**
 * FinalCTA Component
 *
 * Client component for the final CTA section at the bottom of the homepage.
 * Uses the same auth modal but with different styling.
 */
export function FinalCTA() {
  const authModal = useAuthModal();

  return (
    <>
      <button className={styles.finalCta} onClick={() => authModal.openSignUp()}>
        GET STARTED FREE
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
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>

      {/* Auth Modal - lazy loaded */}
      <AuthModal
        isOpen={authModal.isOpen}
        onClose={authModal.close}
        defaultMode={authModal.defaultMode}
      />
    </>
  );
}
