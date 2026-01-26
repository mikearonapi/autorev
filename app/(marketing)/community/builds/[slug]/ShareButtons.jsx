'use client';

/**
 * Share Buttons Component
 * 
 * Client component for social sharing with Instagram, Facebook, Twitter/X support.
 * Includes native Web Share API integration for mobile devices.
 */

import { useState } from 'react';

import { getFacebookShareUrl, getTwitterShareUrl, getInstagramShareInfo, getNativeShareData } from '@/lib/communityService';

import styles from './page.module.css';

export default function ShareButtons({ shareUrl, title, carName }) {
  const [copySuccess, setCopySuccess] = useState(false);

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Handle native share (for mobile devices)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(getNativeShareData({
          title: title,
          text: `Check out this ${carName || 'build'} on AutoRev!`,
          url: shareUrl,
        }));
      } catch (err) {
        // User cancelled or share failed - fall back to copy
        if (err.name !== 'AbortError') {
          copyShareLink();
        }
      }
    } else {
      copyShareLink();
    }
  };

  // Handle Instagram share (copy link with instructions)
  const handleInstagramShare = () => {
    const instagramInfo = getInstagramShareInfo(shareUrl);
    navigator.clipboard.writeText(instagramInfo.copyUrl);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
    // On mobile, try to open Instagram Stories
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      window.location.href = instagramInfo.storiesUrl;
    }
  };

  return (
    <>
      <div className={styles.shareButtons}>
        <a 
          href={getFacebookShareUrl(shareUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.shareBtn}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
          </svg>
          Facebook
        </a>
        <button 
          onClick={handleInstagramShare}
          className={styles.shareBtn}
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2"/>
            <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2"/>
            <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/>
          </svg>
          Instagram
        </button>
        <a 
          href={getTwitterShareUrl(shareUrl, `Check out this ${carName || 'build'} on AutoRev!`)}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.shareBtn}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
          </svg>
          Twitter/X
        </a>
        <button 
          className={styles.shareBtn}
          onClick={copyShareLink}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          Copy Link
        </button>
        {/* Native Share for mobile */}
        <button 
          onClick={handleNativeShare}
          className={styles.shareBtn}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3"/>
            <circle cx="6" cy="12" r="3"/>
            <circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          More...
        </button>
      </div>
      {copySuccess && (
        <p className={styles.copySuccessText}>
          Link copied! Share it anywhere!
        </p>
      )}
    </>
  );
}

