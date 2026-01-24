/**
 * Share Utilities - Single Source of Truth for sharing functionality
 * 
 * Consolidates all share URL generation and native share APIs.
 * 
 * @module lib/shareUtils
 * @see docs/SOURCE_OF_TRUTH.md
 */

// Re-export from communityService (where these were originally defined)
export {
  getPostShareUrl,
  getGarageShareUrl,
  getFacebookShareUrl,
  getTwitterShareUrl,
  getInstagramShareInfo,
  getNativeShareData,
} from './communityService.js';

/**
 * Get LinkedIn share URL
 * 
 * @param {string} url - URL to share
 * @returns {string} LinkedIn share URL
 */
export function getLinkedInShareUrl(url) {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}

/**
 * Copy text to clipboard with fallback
 * 
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

/**
 * Check if native share API is available
 * 
 * @returns {boolean} True if navigator.share is available
 */
export function canUseNativeShare() {
  return typeof navigator !== 'undefined' && !!navigator.share;
}

/**
 * Trigger native share dialog
 * 
 * @param {Object} options - Share options
 * @param {string} options.title - Share title
 * @param {string} options.text - Share text
 * @param {string} options.url - URL to share
 * @returns {Promise<boolean>} Success status
 */
export async function triggerNativeShare({ title, text, url }) {
  if (!canUseNativeShare()) {
    return false;
  }
  
  try {
    await navigator.share({ title, text, url });
    return true;
  } catch (err) {
    // User cancelled or error
    if (err.name !== 'AbortError') {
      console.error('Share failed:', err);
    }
    return false;
  }
}

/**
 * Generate article share URL for a specific platform
 * 
 * @param {string} platform - Platform name (facebook, twitter, linkedin)
 * @param {string} url - URL to share
 * @param {string} [text] - Optional share text
 * @returns {string|null} Share URL or null if platform not supported
 */
export function getShareUrlForPlatform(platform, url, text = '') {
  switch (platform.toLowerCase()) {
    case 'facebook':
      return getFacebookShareUrl(url);
    case 'twitter':
    case 'x':
      return getTwitterShareUrl(url, text);
    case 'linkedin':
      return getLinkedInShareUrl(url);
    default:
      return null;
  }
}

// Default export for convenient destructuring
export default {
  getPostShareUrl,
  getGarageShareUrl,
  getFacebookShareUrl,
  getTwitterShareUrl,
  getLinkedInShareUrl,
  getInstagramShareInfo,
  getNativeShareData,
  copyToClipboard,
  canUseNativeShare,
  triggerNativeShare,
  getShareUrlForPlatform,
};
