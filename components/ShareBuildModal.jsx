'use client';

/**
 * Share Build Modal
 * 
 * Modal for sharing a build to the community.
 * Images are now managed in the UpgradeCenter - this modal just handles
 * title, description, and publishing to community.
 */

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Modal from '@/components/ui/Modal';
import { Icons } from '@/components/ui/Icons';
import { getFacebookShareUrl, getTwitterShareUrl, getInstagramShareInfo, getNativeShareData } from '@/lib/communityService';
import { platform } from '@/lib/platform';
import styles from './ShareBuildModal.module.css';

export default function ShareBuildModal({
  isOpen,
  onClose,
  build,      // Build data from tuning shop
  vehicle,    // Vehicle data from garage
  carSlug,
  carName,
  userId,
  existingImages = [], // Images already uploaded in UpgradeCenter
}) {
  const [step, setStep] = useState('details'); // Start directly at 'details' step
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [shareUrl, setShareUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Set default title based on build/vehicle
  useEffect(() => {
    if (build) {
      setTitle(build.build_name || `${carName} Build`);
      setDescription(build.notes || '');
    } else if (vehicle) {
      setTitle(vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`);
    }
  }, [build, vehicle, carName]);

  // Reset step when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('details');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postType: build ? 'build' : 'vehicle',
          title: title.trim(),
          description: description.trim(),
          vehicleId: vehicle?.id,
          buildId: build?.id,
          carSlug,
          carName,
          // Use existing images from the build (uploaded in UpgradeCenter)
          imageIds: existingImages.map(img => img.id),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to share');
      }

      const data = await response.json();
      setShareUrl(data.shareUrl);
      setStep('success');

    } catch (err) {
      console.error('[ShareBuildModal] Error:', err);
      setError(err.message || 'Failed to share. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyShareLink = async () => {
    const success = await platform.copyToClipboard(shareUrl);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Handle native share (for mobile devices) - using platform abstraction
  const handleNativeShare = async () => {
    const shareData = getNativeShareData({
      title: title,
      text: `Check out my ${title} on AutoRev!`,
      url: shareUrl,
    });
    
    const result = await platform.share(shareData);
    if (result.method === 'clipboard') {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Handle Instagram share (copy link with instructions) - using platform abstraction
  const handleInstagramShare = async () => {
    const instagramInfo = getInstagramShareInfo(shareUrl);
    const success = await platform.copyToClipboard(instagramInfo.copyUrl);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
    // On mobile, try to open Instagram
    if (platform.isIOS || platform.isAndroid) {
      window.location.href = instagramInfo.storiesUrl;
    }
  };

  // Get hero image from existing images
  const heroImage = existingImages.find(img => img.is_primary) || existingImages[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'success' ? '🎉 Shared!' : 'Share Your Build'}
      size="md"
      className={styles.modal}
    >

        {/* Content */}
        <div className={styles.content}>
          {step === 'details' && (
            <>
              {/* Build Preview with Hero Image */}
              <div className={styles.buildPreviewLarge}>
                {heroImage ? (
                  <div className={styles.heroImagePreview}>
                    <Image
                      src={heroImage.blob_url || heroImage.thumbnail_url}
                      alt={title}
                      width={400}
                      height={200}
                      className={styles.heroImage}
                    />
                    {existingImages.length > 1 && (
                      <span className={styles.imageCount}>+{existingImages.length - 1} more</span>
                    )}
                  </div>
                ) : (
                  <div className={styles.noImageNotice}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <p>No photos yet</p>
                    <span className={styles.noImageHint}>
                      Add photos in the Upgrade Center to show off your build
                    </span>
                  </div>
                )}
                
                {/* Build Stats */}
                {build && (
                  <div className={styles.buildStatsOverlay}>
                    <span className={styles.buildStatBadge}>
                      <strong>+{build.total_hp_gain || 0}</strong> HP
                    </span>
                    <span className={styles.buildStatBadge}>
                      ${(build.total_cost_low || 0).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My Porsche GT4 Track Build"
                  className={styles.input}
                  maxLength={100}
                  autoFocus
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell the community about your build - mods, goals, track results..."
                  className={styles.textarea}
                  rows={3}
                  maxLength={500}
                />
                <span className={styles.charCount}>{description.length}/500</span>
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <div className={styles.actions}>
                <button className={styles.secondaryBtn} onClick={onClose}>
                  Cancel
                </button>
                <button 
                  className={styles.primaryBtn}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sharing...' : 'Share to Community'}
                </button>
              </div>
            </>
          )}

          {step === 'success' && (
            <>
              <div className={styles.successContent}>
                <div className={styles.successIcon}>
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h3 className={styles.successTitle}>Build Shared!</h3>
                <p className={styles.successText}>Your build is now live on the Community page</p>
                
                <div className={styles.shareUrlSection}>
                  <label className={styles.shareUrlLabel}>Share Link</label>
                  <div className={styles.shareUrl}>
                    <input 
                      type="text" 
                      value={shareUrl} 
                      readOnly 
                      className={styles.urlInput}
                    />
                    <button className={styles.copyBtn} onClick={copyShareLink}>
                      {copySuccess ? (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                      )}
                      <span>{copySuccess ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className={styles.socialSection}>
                  <span className={styles.socialLabel}>Share on social</span>
                  <div className={styles.socialShare}>
                    <a 
                      href={getFacebookShareUrl(shareUrl)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.socialBtn}
                      title="Share on Facebook"
                    >
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                      </svg>
                    </a>
                    <button 
                      onClick={handleInstagramShare}
                      className={styles.socialBtn}
                      title="Share on Instagram"
                    >
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/>
                      </svg>
                    </button>
                    <a 
                      href={getTwitterShareUrl(shareUrl, `Check out my ${title} on AutoRev!`)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.socialBtn}
                      title="Share on Twitter/X"
                    >
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </a>
                    {/* Native Share for mobile */}
                    {platform.canShare && (
                      <button 
                        onClick={handleNativeShare}
                        className={styles.socialBtn}
                        title="More sharing options"
                      >
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="18" cy="5" r="3"/>
                          <circle cx="6" cy="12" r="3"/>
                          <circle cx="18" cy="19" r="3"/>
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.successActions}>
                <a 
                  href={shareUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.viewPostBtn}
                >
                  View Post
                </a>
                <button className={styles.doneBtn} onClick={onClose}>
                  Done
                </button>
              </div>
            </>
          )}
        </div>
    </Modal>
  );
}
