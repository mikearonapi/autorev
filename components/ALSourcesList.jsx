'use client';

/**
 * AL Sources List Component
 * 
 * Displays sources in Perplexity-style format below AL responses.
 * Shows source type, label, and links when available.
 * 
 * @module components/ALSourcesList
 */

import { useState } from 'react';

import { extractDomainFromUrl, getSourceIcon } from '@/lib/alCitationParser';

import styles from './ALSourcesList.module.css';

// Source type icons (inline SVG for minimal dependencies)
const SourceIcons = {
  database: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  ),
  youtube: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.5 6.2c-.3-1-1-1.8-2-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.5.6c-1 .3-1.7 1.1-2 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8c.3 1 1 1.8 2 2.1 1.9.6 9.5.6 9.5.6s7.6 0 9.5-.6c1-.3 1.7-1.1 2-2.1.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.5v-7l6.4 3.5-6.4 3.5z"/>
    </svg>
  ),
  forum: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
  link: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  document: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  book: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  shield: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
};

/**
 * Single source item component
 */
function SourceItem({ source, number }) {
  const IconComponent = SourceIcons[getSourceIcon(source.type)] || SourceIcons.link;
  const domain = source.url ? extractDomainFromUrl(source.url) : null;
  
  const content = (
    <div className={styles.sourceContent}>
      <span className={styles.sourceNumber}>[{number}]</span>
      <span className={styles.sourceIcon}>
        <IconComponent size={14} />
      </span>
      <span className={styles.sourceLabel}>{source.label}</span>
      {domain && (
        <span className={styles.sourceDomain}>· {domain}</span>
      )}
      {source.detail && !source.url && (
        <span className={styles.sourceDetail}>· {source.detail}</span>
      )}
    </div>
  );
  
  if (source.url) {
    return (
      <a 
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${styles.sourceItem} ${styles.sourceItemLink}`}
      >
        {content}
        <svg className={styles.externalIcon} width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
    );
  }
  
  return <div className={styles.sourceItem}>{content}</div>;
}

/**
 * ALSourcesList Component
 * Displays a list of sources with optional expand/collapse for long lists
 */
export default function ALSourcesList({ sources = [], className = '' }) {
  const [expanded, setExpanded] = useState(false);
  
  if (!sources || sources.length === 0) {
    return null;
  }
  
  // Show first 3 by default, rest on expand
  const visibleSources = expanded ? sources : sources.slice(0, 3);
  const hasMore = sources.length > 3;
  
  return (
    <div className={`${styles.sourcesContainer} ${className}`}>
      <div className={styles.sourcesHeader}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        <span>Sources</span>
        {hasMore && (
          <span className={styles.sourceCount}>({sources.length})</span>
        )}
      </div>
      
      <div className={styles.sourcesList}>
        {visibleSources.map((source, index) => (
          <SourceItem 
            key={source.id || index}
            source={source}
            number={source.id || index + 1}
          />
        ))}
      </div>
      
      {hasMore && (
        <button
          className={styles.expandButton}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show less' : `Show ${sources.length - 3} more`}
          <svg 
            width={12} 
            height={12} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * Inline citation badge component
 * For rendering [1], [2], etc. as clickable superscripts
 */
export function CitationBadge({ number, onClick }) {
  return (
    <sup 
      className={styles.citationBadge}
      onClick={() => onClick?.(number)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(number)}
    >
      [{number}]
    </sup>
  );
}
