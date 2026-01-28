'use client';

import { useState, useEffect } from 'react';

import Image from 'next/image';

import usePWAInstall from '@/hooks/usePWAInstall';

import styles from './PWAInstallPrompt.module.css';

/**
 * PWAInstallPrompt - Smart installation prompt for all platforms
 *
 * Shows contextual UI based on the user's platform:
 * - Chrome/Edge: Button to trigger native install prompt
 * - iOS Safari: Visual step-by-step instructions
 * - macOS Safari: Instructions for File → Add to Dock
 *
 * Design: Follows AutoRev brand guidelines (teal accent, dark theme)
 */

// iOS Share icon SVG
const ShareIcon = () => (
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
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

// Plus/Add icon
const AddIcon = () => (
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
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

// Download/Install icon
const InstallIcon = () => (
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
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

// Close icon
const CloseIcon = () => (
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
);

// Check icon
const CheckIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// Menu icon (three dots)
const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="19" r="2" />
  </svg>
);

export default function PWAInstallPrompt({
  variant = 'banner', // 'banner' | 'modal' | 'inline'
  onInstalled,
  onDismissed,
  showAfterViews = 3, // Show after N page views
  delay = 2000, // Delay before showing (ms)
  forceShow = false, // Force show (for programmatic triggering)
}) {
  const {
    isInstallable: _isInstallable,
    isInstalled,
    isIOS,
    shouldShowInstallPrompt,
    canPromptNatively,
    promptInstall,
    dismissPrompt,
    dismissPermanently,
    getInstallInstructions,
  } = usePWAInstall();

  const [isVisible, setIsVisible] = useState(forceShow);
  const [showInstructions, setShowInstructions] = useState(forceShow && variant === 'modal');
  const [installStarted, setInstallStarted] = useState(false);

  // Update visibility when forceShow changes
  useEffect(() => {
    if (forceShow) {
      setIsVisible(true);
      if (variant === 'modal') {
        setShowInstructions(true);
      }
    }
  }, [forceShow, variant]);

  // Track page views and delay showing (for banner variant)
  useEffect(() => {
    // Skip if force showing or if it's a modal variant (user triggered)
    if (forceShow || variant === 'modal') return;
    if (!shouldShowInstallPrompt) return;

    // Check page view count
    const viewCount = parseInt(localStorage.getItem('pwa-prompt-views') || '0', 10);
    localStorage.setItem('pwa-prompt-views', String(viewCount + 1));

    if (viewCount < showAfterViews) return;

    // Show after delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [shouldShowInstallPrompt, showAfterViews, delay, forceShow, variant]);

  // Handle install button click
  const handleInstall = async () => {
    if (canPromptNatively) {
      setInstallStarted(true);
      const result = await promptInstall();
      setInstallStarted(false);

      if (result.outcome === 'accepted') {
        setIsVisible(false);
        setShowInstructions(false);
        onInstalled?.();
      }
    } else {
      // Show manual instructions
      setShowInstructions(true);
    }
  };

  // Handle dismiss
  const handleDismiss = (permanent = false) => {
    if (permanent) {
      dismissPermanently();
    } else {
      dismissPrompt(7); // Dismiss for 7 days
    }
    setIsVisible(false);
    setShowInstructions(false);
    onDismissed?.();
  };

  // For modal variant triggered externally, always show instructions
  if (variant === 'modal' && forceShow) {
    // Render only the modal
    const instructions = getInstallInstructions();

    return (
      <div className={styles.modalOverlay} onClick={() => handleDismiss(false)}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <button
            className={styles.modalClose}
            onClick={() => handleDismiss(false)}
            aria-label="Close"
          >
            <CloseIcon />
          </button>

          <div className={styles.modalHeader}>
            <div className={styles.appIconWrapper}>
              <Image
                src="/apple-touch-icon-v3.png"
                alt="AutoRev"
                width={64}
                height={64}
                className={styles.appIcon}
              />
            </div>
            <h2 className={styles.modalTitle}>Install AutoRev</h2>
            <p className={styles.modalSubtitle}>Get the full app experience on your home screen</p>
          </div>

          <div className={styles.stepsContainer}>
            {instructions.steps.map((step, index) => (
              <div key={index} className={styles.step}>
                <div className={styles.stepNumber}>{index + 1}</div>
                <div className={styles.stepContent}>
                  <div className={styles.stepIcon}>
                    {step.icon === 'share' && <ShareIcon />}
                    {step.icon === 'add' && <AddIcon />}
                    {step.icon === 'install' && <InstallIcon />}
                    {step.icon === 'menu' && <MenuIcon />}
                    {step.icon === 'confirm' && <CheckIcon />}
                    {step.icon === 'scroll' && <span className={styles.scrollText}>↓</span>}
                    {step.icon === 'file' && <span className={styles.fileText}>File</span>}
                  </div>
                  <span className={styles.stepText}>{step.text}</span>
                </div>
              </div>
            ))}
          </div>

          {isIOS && (
            <div className={styles.iosShareHint}>
              <div className={styles.shareIconDemo}>
                <ShareIcon />
              </div>
              <span>Look for this icon at the bottom of Safari</span>
            </div>
          )}

          <div className={styles.modalActions}>
            <button className={styles.dismissButton} onClick={() => handleDismiss(false)}>
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not showing
  if (!isVisible || isInstalled) return null;

  const instructions = getInstallInstructions();

  // Inline variant (for profile page, etc.)
  if (variant === 'inline') {
    return (
      <div className={styles.inlineContainer}>
        <div className={styles.inlineContent}>
          <div className={styles.inlineIcon}>
            <InstallIcon />
          </div>
          <div className={styles.inlineText}>
            <span className={styles.inlineTitle}>Install AutoRev</span>
            <span className={styles.inlineDescription}>
              Add to your home screen for the best experience
            </span>
          </div>
          <button className={styles.inlineButton} onClick={handleInstall} disabled={installStarted}>
            {installStarted ? 'Installing...' : 'Install'}
          </button>
        </div>
      </div>
    );
  }

  // Modal variant (iOS instructions)
  if (showInstructions || (variant === 'modal' && isIOS)) {
    return (
      <div className={styles.modalOverlay} onClick={() => setShowInstructions(false)}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <button
            className={styles.modalClose}
            onClick={() => handleDismiss(false)}
            aria-label="Close"
          >
            <CloseIcon />
          </button>

          <div className={styles.modalHeader}>
            <div className={styles.appIconWrapper}>
              <Image
                src="/apple-touch-icon-v3.png"
                alt="AutoRev"
                width={64}
                height={64}
                className={styles.appIcon}
              />
            </div>
            <h2 className={styles.modalTitle}>Install AutoRev</h2>
            <p className={styles.modalSubtitle}>Get the full app experience on your home screen</p>
          </div>

          <div className={styles.stepsContainer}>
            {instructions.steps.map((step, index) => (
              <div key={index} className={styles.step}>
                <div className={styles.stepNumber}>{index + 1}</div>
                <div className={styles.stepContent}>
                  <div className={styles.stepIcon}>
                    {step.icon === 'share' && <ShareIcon />}
                    {step.icon === 'add' && <AddIcon />}
                    {step.icon === 'install' && <InstallIcon />}
                    {step.icon === 'menu' && <MenuIcon />}
                    {step.icon === 'confirm' && <CheckIcon />}
                    {step.icon === 'scroll' && <span className={styles.scrollText}>↓</span>}
                    {step.icon === 'file' && <span className={styles.fileText}>File</span>}
                  </div>
                  <span className={styles.stepText}>{step.text}</span>
                </div>
              </div>
            ))}
          </div>

          {isIOS && (
            <div className={styles.iosShareHint}>
              <div className={styles.shareIconDemo}>
                <ShareIcon />
              </div>
              <span>Look for this icon at the bottom of Safari</span>
            </div>
          )}

          <div className={styles.modalActions}>
            <button className={styles.dismissButton} onClick={() => handleDismiss(false)}>
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Banner variant (default)
  return (
    <div className={styles.banner}>
      <div className={styles.bannerContent}>
        <div className={styles.bannerLeft}>
          <Image
            src="/apple-touch-icon-v3.png"
            alt="AutoRev"
            width={44}
            height={44}
            className={styles.bannerIcon}
          />
          <div className={styles.bannerText}>
            <span className={styles.bannerTitle}>Install AutoRev</span>
            <span className={styles.bannerDescription}>
              {isIOS
                ? 'Add to home screen for the best experience'
                : 'Install our app for quick access'}
            </span>
          </div>
        </div>
        <div className={styles.bannerActions}>
          <button
            className={styles.installButton}
            onClick={handleInstall}
            disabled={installStarted}
          >
            {installStarted ? '...' : 'Install'}
          </button>
          <button
            className={styles.closeButton}
            onClick={() => handleDismiss(false)}
            aria-label="Dismiss"
          >
            <CloseIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact install button for embedding in other components (like profile menu)
 */
export function PWAInstallButton({ className }) {
  const {
    shouldShowInstallPrompt,
    isIOS: _isIOS,
    canPromptNatively,
    promptInstall,
    getInstallInstructions: _getInstallInstructions,
  } = usePWAInstall();

  const [showModal, setShowModal] = useState(false);
  const [installing, setInstalling] = useState(false);

  if (!shouldShowInstallPrompt) return null;

  const handleInstallClick = async () => {
    if (canPromptNatively) {
      setInstalling(true);
      await promptInstall();
      setInstalling(false);
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button className={className} onClick={handleInstallClick} disabled={installing}>
        <InstallIcon />
        <span>{installing ? 'Installing...' : 'Install App'}</span>
      </button>

      {showModal && (
        <PWAInstallPrompt
          variant="modal"
          forceShow={true}
          onDismissed={() => setShowModal(false)}
        />
      )}
    </>
  );
}
