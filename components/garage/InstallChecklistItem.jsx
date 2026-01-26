'use client';

/**
 * InstallChecklistItem Component
 * 
 * Individual part row in the installation checklist showing:
 * - Part name and brand (if specified)
 * - Difficulty badge (from upgradeTools.js)
 * - Estimated labor hours
 * - Warning badges (requires tune, etc.)
 * - Action buttons (Show Videos, Show Tools, Mark Installed)
 * - DIY videos fetched from API when expanded
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';

import { DIYVideoList } from '@/components/garage/DIYVideoEmbed';
import { Icons } from '@/components/ui/Icons';
import InfoTooltip from '@/components/ui/InfoTooltip';
import { getToolsForUpgrade, difficultyLevels } from '@/data/upgradeTools';

import styles from './InstallChecklistItem.module.css';

// Difficulty colors matching brand guidelines
// Difficulty colors - matching design system tokens
const DIFFICULTY_COLORS = {
  easy: '#10b981', // var(--color-accent-teal)
  moderate: '#3b82f6', // var(--color-accent-blue)
  difficult: '#f59e0b', // var(--color-warning)
  expert: '#ef4444', // var(--color-error)
  'shop-only': '#7c3aed', // purple
};

/**
 * InstallChecklistItem - Single part in the installation checklist
 * 
 * @param {Object} part - Part data with id, upgradeKey, name, installed, etc.
 * @param {string} carName - Vehicle name for context
 * @param {string} carSlug - Vehicle slug for API calls
 * @param {boolean} isExpanded - Whether this item is expanded
 * @param {function} onToggleExpand - Callback to toggle expansion
 * @param {boolean} showVideos - Whether to show videos section
 * @param {function} onToggleVideos - Callback to toggle videos
 * @param {boolean} showTools - Whether to show tools section
 * @param {function} onToggleTools - Callback to toggle tools
 * @param {function} onMarkInstalled - Callback when marking as installed
 */
export default function InstallChecklistItem({
  part,
  carName,
  carSlug,
  isExpanded,
  onToggleExpand,
  showVideos,
  onToggleVideos,
  showTools,
  onToggleTools,
  onMarkInstalled,
}) {
  // Video loading state
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videosError, setVideosError] = useState(null);
  const [videosFetched, setVideosFetched] = useState(false);

  // Get tool requirements for this upgrade
  const toolReqs = useMemo(() => {
    return getToolsForUpgrade(part.upgradeKey);
  }, [part.upgradeKey]);
  
  // Get difficulty info
  const difficultyInfo = useMemo(() => {
    if (!toolReqs?.difficulty) return null;
    return difficultyLevels[toolReqs.difficulty] || null;
  }, [toolReqs]);
  
  const difficultyColor = DIFFICULTY_COLORS[toolReqs?.difficulty] || '#64748b';

  // Fetch videos when showVideos is toggled on (only fetch once per part)
  const fetchVideos = useCallback(async () => {
    if (videosFetched || videosLoading) return;
    
    // Determine the category from the upgrade key
    const category = part.upgradeKey?.split('-')[0] || part.name?.toLowerCase().split(' ')[0] || 'upgrade';
    
    setVideosLoading(true);
    setVideosError(null);
    
    try {
      const response = await fetch('/api/diy-videos/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carName,
          category,
          limit: 5,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch videos: ${response.status}`);
      }
      
      const data = await response.json();
      setVideos(data.videos || []);
      setVideosFetched(true);
    } catch (err) {
      console.error('[InstallChecklistItem] Video fetch error:', err);
      setVideosError(err.message || 'Failed to load videos');
    } finally {
      setVideosLoading(false);
    }
  }, [carName, part.upgradeKey, part.name, videosFetched, videosLoading]);

  // Trigger video fetch when showVideos becomes true
  useEffect(() => {
    if (showVideos && !videosFetched && !videosLoading) {
      fetchVideos();
    }
  }, [showVideos, videosFetched, videosLoading, fetchVideos]);
  
  // Determine if part requires tune (check by name pattern)
  const requiresTune = part.upgradeKey?.includes('tune') || 
    part.upgradeKey?.includes('turbo') ||
    part.upgradeKey?.includes('supercharger') ||
    part.upgradeKey?.includes('headers') ||
    part.upgradeKey?.includes('downpipe');
  
  return (
    <div className={`${styles.item} ${part.installed ? styles.installed : ''}`}>
      {/* Main Row - Compact single-line layout */}
      <div className={styles.mainRow} onClick={onToggleExpand}>
        {/* Checkbox/Status */}
        <div className={styles.statusIcon}>
          {part.installed ? (
            <span className={styles.checkmark}>
              <Icons.check size={14} />
            </span>
          ) : part.status === 'purchased' ? (
            <span className={styles.purchasedCircle}>
              <Icons.shoppingCart size={10} />
            </span>
          ) : (
            <span className={styles.pendingCircle} />
          )}
        </div>
        
        {/* Part Info - Compact layout */}
        <div className={styles.partInfo}>
          <span className={styles.partName}>
            {part.name}
            {part.brandName && (
              <span className={styles.partBrand}> · {part.brandName}</span>
            )}
          </span>
        </div>
        
        {/* Inline Badge - Only difficulty */}
        <div className={styles.inlineBadges}>
          {toolReqs?.difficulty && (
            <span 
              className={styles.difficultyBadge}
              style={{ '--badge-color': difficultyColor }}
            >
              {difficultyInfo?.label || toolReqs.difficulty}
            </span>
          )}
        </div>
        
        {/* Expand Chevron */}
        <button 
          className={`${styles.expandBtn} ${isExpanded ? styles.expanded : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          <Icons.chevronDown size={16} />
        </button>
      </div>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className={styles.expandedContent}>
          {/* Status + Additional Badges Row */}
          <div className={styles.expandedBadges}>
            {/* Part status */}
            {part.status === 'purchased' && !part.installed && (
              <span className={styles.readyBadge}>Ready to Install</span>
            )}
            {(!part.status || part.status === 'planned') && !part.installed && (
              <span className={styles.plannedBadge}>Not Purchased</span>
            )}
            {/* Time estimate */}
            {toolReqs?.timeEstimate && (
              <span className={styles.timeDetailBadge}>
                <Icons.clock size={12} />
                {toolReqs.timeEstimate}
              </span>
            )}
            {/* Requires Tune Warning */}
            {requiresTune && (
              <span className={styles.warningBadge}>
                <Icons.alertTriangle size={12} />
                Requires Tune
              </span>
            )}
            {/* DIY Friendly */}
            {toolReqs?.diyFriendly && (
              <span className={styles.diyBadge}>DIY OK</span>
            )}
          </div>
          
          {/* Notes */}
          {toolReqs?.notes && (
            <p className={styles.notes}>{toolReqs.notes}</p>
          )}
          
          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button 
              className={`${styles.actionBtn} ${showVideos ? styles.actionBtnActive : ''}`}
              onClick={onToggleVideos}
            >
              <Icons.video size={16} />
              {showVideos ? 'Hide Videos' : 'Show Install Videos'}
            </button>
            
            <button 
              className={`${styles.actionBtn} ${showTools ? styles.actionBtnActive : ''}`}
              onClick={onToggleTools}
            >
              <Icons.wrench size={16} />
              {showTools ? 'Hide Tools' : 'Show Required Tools'}
            </button>
            
            {!part.installed && (
              <button 
                className={styles.markInstalledBtn}
                onClick={onMarkInstalled}
              >
                <Icons.check size={16} />
                Mark Installed
              </button>
            )}
          </div>
          
          {/* Tools Section (inline for this specific part) */}
          {showTools && (
            <div className={styles.toolsInline}>
              <h4 className={styles.inlineTitle}>Tools Needed</h4>
              {toolReqs && (toolReqs.essential?.length > 0 || toolReqs.recommended?.length > 0) ? (
                <div className={styles.toolsList}>
                  {toolReqs.essential?.length > 0 && (
                    <div className={styles.toolGroup}>
                      <span className={styles.toolGroupLabel}>Essential:</span>
                      <div className={styles.toolTags}>
                        {toolReqs.essential.map(t => (
                          <span key={t} className={styles.toolTag}>{t.split('-').join(' ')}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {toolReqs.recommended?.length > 0 && (
                    <div className={styles.toolGroup}>
                      <span className={styles.toolGroupLabel}>Recommended:</span>
                      <div className={styles.toolTags}>
                        {toolReqs.recommended.map(t => (
                          <span key={t} className={`${styles.toolTag} ${styles.toolTagRecommended}`}>
                            {t.split('-').join(' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.noToolsFound}>
                  <Icons.info size={18} />
                  <div className={styles.noToolsText}>
                    <span className={styles.noToolsTitle}>Tool list not available</span>
                    <p className={styles.noToolsSubtext}>
                      We don&apos;t have specific tool requirements for this upgrade yet. 
                      Check your part&apos;s instructions or watch install videos for guidance.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Videos Section - fetches and displays DIY tutorial videos */}
          {showVideos && (
            <div className={styles.videosInline}>
              <h4 className={styles.inlineTitle}>Install Videos</h4>
              <DIYVideoList
                videos={videos}
                carName={carName}
                category={part.upgradeKey?.split('-')[0] || part.name}
                isLoading={videosLoading}
                error={videosError}
              />
            </div>
          )}
          
          {/* Installed Date */}
          {part.installed && part.installedAt && (
            <div className={styles.installedInfo}>
              <Icons.checkCircle size={14} />
              Installed {new Date(part.installedAt).toLocaleDateString()}
              {part.installedBy && ` (${part.installedBy === 'self' ? 'DIY' : 'Shop'})`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
