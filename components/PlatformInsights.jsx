'use client';

/**
 * Platform Insights - Shows defining strengths & weaknesses of the platform
 * 
 * EXTREMELY VALUABLE: Users see what makes their car special and what to
 * watch out for. This is expert-level knowledge distilled into digestible format.
 * Includes community tips and YouTube-sourced insights when available.
 */

import React, { useState, useMemo } from 'react';
import InsightFeedback from './ui/InsightFeedback';
import styles from './PlatformInsights.module.css';

// Icons
const SparklesIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/>
    <path d="M19 17v4"/>
    <path d="M3 5h4"/>
    <path d="M17 19h4"/>
  </svg>
);

const ThumbsUpIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 10v12"/>
    <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/>
  </svg>
);

const ThumbsDownIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 14V2"/>
    <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"/>
  </svg>
);

const LightbulbIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
    <path d="M9 18h6"/>
    <path d="M10 22h4"/>
  </svg>
);

const YoutubeIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const UserIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const ChevronDownIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

// Tab options
const TABS = [
  { id: 'strengths', label: 'Strengths', icon: ThumbsUpIcon },
  { id: 'weaknesses', label: 'Weaknesses', icon: ThumbsDownIcon },
  { id: 'tips', label: 'Community Tips', icon: LightbulbIcon },
];

// Ask AL button icon
const AskALIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
  </svg>
);

export default function PlatformInsights({ 
  definingStrengths = [], 
  honestWeaknesses = [], 
  platformInsights = {},
  idealOwner,
  notIdealFor,
  carName,
  onAskAL,
  onFeedback,
}) {
  const [activeTab, setActiveTab] = useState('strengths');
  const [expandedItem, setExpandedItem] = useState(null);

  // Process YouTube insights from platform_insights
  const youtubeData = useMemo(() => {
    const yt = platformInsights?.youtube_insights || {};
    return {
      pros: yt.pros || [],
      cons: yt.cons || [],
      keyPoints: yt.key_points || [],
      videoCount: yt.youtube_video_count || 0,
    };
  }, [platformInsights]);

  // Combine community tips
  const communityTips = useMemo(() => {
    const tips = platformInsights?.community_tips || [];
    // Also include key_points from YouTube as tips
    const ytKeyPoints = youtubeData.keyPoints.map(point => ({
      text: point,
      source: 'youtube',
    }));
    const manualTips = tips.map(tip => ({
      text: typeof tip === 'string' ? tip : tip.text || tip,
      source: 'community',
    }));
    return [...manualTips, ...ytKeyPoints].slice(0, 8);
  }, [platformInsights, youtubeData]);

  // Check if we have any content
  const hasStrengths = definingStrengths.length > 0 || youtubeData.pros.length > 0;
  const hasWeaknesses = honestWeaknesses.length > 0 || youtubeData.cons.length > 0;
  const hasTips = communityTips.length > 0;
  const hasAnyContent = hasStrengths || hasWeaknesses || hasTips || idealOwner || notIdealFor;

  if (!hasAnyContent) {
    return (
      <div className={styles.platformInsights}>
        <div className={styles.header}>
          <SparklesIcon size={18} />
          <span className={styles.headerTitle}>Platform Insights</span>
          {onFeedback && (
            <InsightFeedback 
              insightType="platform-insights"
              insightKey="platform-insights-empty"
              insightTitle="Platform Insights (Empty)"
              onFeedback={onFeedback}
              variant="inline"
            />
          )}
        </div>
        <div className={styles.noData}>
          <p>Detailed platform insights not yet available for this vehicle</p>
        </div>
      </div>
    );
  }

  // Filter tabs to only show ones with content
  const availableTabs = TABS.filter(tab => {
    if (tab.id === 'strengths') return hasStrengths;
    if (tab.id === 'weaknesses') return hasWeaknesses;
    if (tab.id === 'tips') return hasTips;
    return false;
  });

  // Ensure activeTab is valid
  if (!availableTabs.find(t => t.id === activeTab) && availableTabs.length > 0) {
    setActiveTab(availableTabs[0].id);
  }

  return (
    <div className={styles.platformInsights}>
      <div className={styles.header}>
        <SparklesIcon size={18} />
        <span className={styles.headerTitle}>Platform Insights</span>
        {carName && <span className={styles.carLabel}>{carName}</span>}
        {onAskAL && (
          <button className={styles.askAlBtn} onClick={onAskAL}>
            <AskALIcon size={12} />
            Ask AL
          </button>
        )}
        {onFeedback && (
          <InsightFeedback 
            insightType="platform-insights"
            insightKey={`platform-${activeTab}`}
            insightTitle={`Platform Insights (${activeTab})`}
            onFeedback={onFeedback}
            variant="inline"
          />
        )}
      </div>

      {/* Tabs */}
      {availableTabs.length > 1 && (
        <div className={styles.tabs}>
          {availableTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Strengths Tab */}
      {activeTab === 'strengths' && (
        <div className={styles.tabContent}>
          {/* Defining Strengths */}
          {definingStrengths.length > 0 && (
            <div className={styles.insightsList}>
              {definingStrengths.map((strength, idx) => (
                <div key={idx} className={styles.insightCard + ' ' + styles.strength}>
                  <button 
                    className={styles.insightHeader}
                    onClick={() => setExpandedItem(expandedItem === `s-${idx}` ? null : `s-${idx}`)}
                  >
                    <ThumbsUpIcon size={14} />
                    <span className={styles.insightTitle}>{strength.title}</span>
                    <ChevronDownIcon 
                      size={14} 
                      className={`${styles.chevron} ${expandedItem === `s-${idx}` ? styles.expanded : ''}`}
                    />
                  </button>
                  {expandedItem === `s-${idx}` && strength.description && (
                    <p className={styles.insightDescription}>{strength.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* YouTube Pros */}
          {youtubeData.pros.length > 0 && (
            <div className={styles.youtubeSection}>
              <div className={styles.youtubeSectionHeader}>
                <YoutubeIcon size={14} />
                <span>From YouTube Reviews</span>
                {youtubeData.videoCount > 0 && (
                  <span className={styles.videoCount}>{youtubeData.videoCount} videos</span>
                )}
              </div>
              <ul className={styles.youtubeList}>
                {youtubeData.pros.slice(0, 5).map((pro, idx) => (
                  <li key={idx} className={styles.youtubePro}>
                    "{pro}"
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ideal Owner */}
          {idealOwner && (
            <div className={styles.ownerSection}>
              <div className={styles.ownerHeader}>
                <UserIcon size={14} />
                <span>Ideal Owner</span>
              </div>
              <p className={styles.ownerText}>{idealOwner}</p>
            </div>
          )}
        </div>
      )}

      {/* Weaknesses Tab */}
      {activeTab === 'weaknesses' && (
        <div className={styles.tabContent}>
          {/* Honest Weaknesses */}
          {honestWeaknesses.length > 0 && (
            <div className={styles.insightsList}>
              {honestWeaknesses.map((weakness, idx) => (
                <div key={idx} className={styles.insightCard + ' ' + styles.weakness}>
                  <button 
                    className={styles.insightHeader}
                    onClick={() => setExpandedItem(expandedItem === `w-${idx}` ? null : `w-${idx}`)}
                  >
                    <ThumbsDownIcon size={14} />
                    <span className={styles.insightTitle}>{weakness.title}</span>
                    <ChevronDownIcon 
                      size={14} 
                      className={`${styles.chevron} ${expandedItem === `w-${idx}` ? styles.expanded : ''}`}
                    />
                  </button>
                  {expandedItem === `w-${idx}` && weakness.description && (
                    <p className={styles.insightDescription}>{weakness.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* YouTube Cons */}
          {youtubeData.cons.length > 0 && (
            <div className={styles.youtubeSection + ' ' + styles.cons}>
              <div className={styles.youtubeSectionHeader}>
                <YoutubeIcon size={14} />
                <span>From YouTube Reviews</span>
              </div>
              <ul className={styles.youtubeList}>
                {youtubeData.cons.slice(0, 5).map((con, idx) => (
                  <li key={idx} className={styles.youtubeCon}>
                    "{con}"
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Not Ideal For */}
          {notIdealFor && (
            <div className={styles.ownerSection + ' ' + styles.notIdeal}>
              <div className={styles.ownerHeader}>
                <UserIcon size={14} />
                <span>Not Ideal For</span>
              </div>
              <p className={styles.ownerText}>{notIdealFor}</p>
            </div>
          )}
        </div>
      )}

      {/* Tips Tab */}
      {activeTab === 'tips' && (
        <div className={styles.tabContent}>
          {communityTips.length > 0 && (
            <div className={styles.tipsList}>
              {communityTips.map((tip, idx) => (
                <div key={idx} className={styles.tipCard}>
                  <LightbulbIcon size={14} />
                  <span className={styles.tipText}>{tip.text}</span>
                  {tip.source === 'youtube' && (
                    <span className={styles.tipSource}>
                      <YoutubeIcon size={10} />
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Source Note */}
      <p className={styles.sourceNote}>
        Insights compiled from expert reviews, community forums, and owner experiences
      </p>
    </div>
  );
}
