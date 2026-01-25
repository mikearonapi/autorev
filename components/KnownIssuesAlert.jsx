'use client';

/**
 * Known Issues Alert - Shows critical/high severity issues for user's specific car
 * 
 * EXTREMELY VALUABLE: Users see real issues that affect their specific vehicle,
 * with symptoms to watch for, prevention tips, and estimated repair costs.
 * This is exactly the kind of information that saves owners money and heartache.
 */

import React, { useMemo, useState } from 'react';
import InsightFeedback from './ui/InsightFeedback';
import styles from './KnownIssuesAlert.module.css';

// Icons
const AlertTriangleIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <path d="M12 9v4"/>
    <path d="M12 17h.01"/>
  </svg>
);

const AlertCircleIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 8v4"/>
    <path d="M12 16h.01"/>
  </svg>
);

const ShieldIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const WrenchIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

const ChevronDownIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const DollarIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const EyeIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

// Severity configuration
const SEVERITY_CONFIG = {
  critical: {
    label: 'Critical',
    color: '#ef4444', // var(--color-error)
    bgColor: 'rgba(239, 68, 68, 0.08)', // Reduced opacity for premium feel
    borderColor: 'rgba(239, 68, 68, 0.2)',
    priority: 0,
  },
  high: {
    label: 'High',
    color: '#f59e0b', // var(--color-warning)
    bgColor: 'rgba(245, 158, 11, 0.08)', // Reduced opacity
    borderColor: 'rgba(245, 158, 11, 0.2)',
    priority: 1,
  },
  medium: {
    label: 'Medium',
    color: '#3b82f6', // var(--color-accent-blue)
    bgColor: 'rgba(59, 130, 246, 0.06)', // Reduced opacity
    borderColor: 'rgba(59, 130, 246, 0.15)',
    priority: 2,
  },
  low: {
    label: 'Low',
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.05)',
    borderColor: 'rgba(107, 114, 128, 0.15)',
    priority: 3,
  },
};

// Issue kind labels
const KIND_LABELS = {
  engine: 'Engine',
  transmission: 'Transmission',
  electrical: 'Electrical',
  suspension: 'Suspension',
  cooling: 'Cooling',
  fuel: 'Fuel System',
  brakes: 'Brakes',
  interior: 'Interior',
  exterior: 'Exterior',
  drivetrain: 'Drivetrain',
  other: 'General',
};

export default function KnownIssuesAlert({ issues, vehicleYear, carName, onFeedback }) {
  const [expandedIssue, setExpandedIssue] = useState(null);
  const [showAll, setShowAll] = useState(false);

  // Process and filter issues
  const processedIssues = useMemo(() => {
    if (!issues || issues.length === 0) return [];

    // Filter to critical and high severity issues first, then sort
    return issues
      .filter(issue => {
        // Only show critical, high, medium (skip low/cosmetic for relevance)
        const severity = issue.severity?.toLowerCase() || 'unknown';
        return ['critical', 'high', 'medium'].includes(severity);
      })
      .filter(issue => {
        // If we have affected years and vehicle year, filter to relevant issues
        if (!vehicleYear) return true;
        if (issue.affected_year_start && vehicleYear < issue.affected_year_start) return false;
        if (issue.affected_year_end && vehicleYear > issue.affected_year_end) return false;
        return true;
      })
      .map(issue => ({
        ...issue,
        severityConfig: SEVERITY_CONFIG[issue.severity?.toLowerCase()] || SEVERITY_CONFIG.medium,
        kindLabel: KIND_LABELS[issue.kind] || issue.kind || 'General',
      }))
      .sort((a, b) => {
        // Sort by severity priority
        const aPriority = a.severityConfig.priority;
        const bPriority = b.severityConfig.priority;
        return aPriority - bPriority;
      });
  }, [issues, vehicleYear]);

  // Split into critical/high vs medium
  const criticalHighIssues = processedIssues.filter(i => 
    ['critical', 'high'].includes(i.severity?.toLowerCase())
  );
  const mediumIssues = processedIssues.filter(i => 
    i.severity?.toLowerCase() === 'medium'
  );

  // Decide what to show
  const displayedIssues = showAll ? processedIssues : criticalHighIssues.slice(0, 3);
  const hiddenCount = processedIssues.length - displayedIssues.length;

  if (processedIssues.length === 0) {
    return (
      <div className={styles.knownIssues}>
        <div className={styles.header}>
          <ShieldIcon size={18} />
          <span className={styles.headerTitle}>Known Issues</span>
          {onFeedback && (
            <InsightFeedback 
              insightType="known-issues"
              insightKey="known-issues-none"
              insightTitle="Known Issues (None)"
              onFeedback={onFeedback}
              variant="inline"
            />
          )}
        </div>
        <div className={styles.noIssues}>
          <div className={styles.noIssuesIcon}>✓</div>
          <p>No significant known issues documented for this platform</p>
          <span className={styles.noIssuesSubtext}>
            This doesn't mean the car is issue-free—always do a pre-purchase inspection
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.knownIssues}>
      <div className={styles.header}>
        <AlertTriangleIcon size={18} />
        <span className={styles.headerTitle}>Known Issues</span>
        <span className={styles.issueCount}>
          {criticalHighIssues.length > 0 && (
            <span className={styles.criticalCount}>
              {criticalHighIssues.length} priority
            </span>
          )}
        </span>
        {onFeedback && (
          <InsightFeedback 
            insightType="known-issues"
            insightKey={`known-issues-${criticalHighIssues.length}`}
            insightTitle={`Known Issues (${criticalHighIssues.length})`}
            onFeedback={onFeedback}
            variant="inline"
          />
        )}
      </div>

      {/* Summary Bar */}
      {criticalHighIssues.length > 0 && (
        <div className={styles.summaryBar}>
          <AlertCircleIcon size={14} />
          <span>
            {criticalHighIssues.length} known issue{criticalHighIssues.length > 1 ? 's' : ''} to watch for
            {carName && ` on your ${carName}`}
          </span>
        </div>
      )}

      {/* Issues List */}
      <div className={styles.issuesList}>
        {displayedIssues.map((issue, idx) => {
          const isExpanded = expandedIssue === idx;
          const config = issue.severityConfig;

          return (
            <div 
              key={issue.id || idx}
              className={styles.issueCard}
              style={{ 
                '--severity-color': config.color,
                '--severity-bg': config.bgColor,
                '--severity-border': config.borderColor,
              }}
            >
              <button 
                className={styles.issueHeader}
                onClick={() => setExpandedIssue(isExpanded ? null : idx)}
                aria-expanded={isExpanded}
              >
                <div className={styles.issueMeta}>
                  <span className={styles.severityBadge}>
                    {config.label}
                  </span>
                  <span className={styles.kindBadge}>{issue.kindLabel}</span>
                </div>
                <h4 className={styles.issueTitle}>{issue.title || issue.name}</h4>
                <ChevronDownIcon 
                  size={16} 
                  className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}
                />
              </button>

              {isExpanded && (
                <div className={styles.issueDetails}>
                  {/* Description */}
                  {issue.description && (
                    <p className={styles.issueDescription}>{issue.description}</p>
                  )}

                  {/* Symptoms */}
                  {issue.symptoms && issue.symptoms.length > 0 && (
                    <div className={styles.detailSection}>
                      <h5 className={styles.detailLabel}>
                        <EyeIcon size={12} />
                        Symptoms to Watch For
                      </h5>
                      <ul className={styles.symptomsList}>
                        {(Array.isArray(issue.symptoms) ? issue.symptoms : [issue.symptoms]).map((symptom, sIdx) => (
                          <li key={sIdx}>{symptom}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Prevention */}
                  {issue.prevention && (
                    <div className={styles.detailSection}>
                      <h5 className={styles.detailLabel}>
                        <ShieldIcon size={12} />
                        Prevention
                      </h5>
                      <p className={styles.detailText}>{issue.prevention}</p>
                    </div>
                  )}

                  {/* Fix / Repair */}
                  {issue.fix_description && (
                    <div className={styles.detailSection}>
                      <h5 className={styles.detailLabel}>
                        <WrenchIcon size={12} />
                        Repair
                      </h5>
                      <p className={styles.detailText}>{issue.fix_description}</p>
                    </div>
                  )}

                  {/* Cost & Affected Years */}
                  <div className={styles.issueFooter}>
                    {(issue.estimated_cost_text || issue.estimated_cost_low) && (
                      <div className={styles.costEstimate}>
                        <DollarIcon size={12} />
                        <span>
                          Est. repair: {issue.estimated_cost_text || 
                            (issue.estimated_cost_low && issue.estimated_cost_high 
                              ? `$${issue.estimated_cost_low.toLocaleString()}–$${issue.estimated_cost_high.toLocaleString()}`
                              : issue.estimated_cost_low 
                                ? `$${issue.estimated_cost_low.toLocaleString()}+`
                                : 'Varies'
                            )
                          }
                        </span>
                      </div>
                    )}
                    {issue.affected_years_text && (
                      <span className={styles.affectedYears}>
                        Affects: {issue.affected_years_text}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show More / Less */}
      {hiddenCount > 0 && (
        <button 
          className={styles.showMoreBtn}
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Show less' : `Show ${hiddenCount} more issues`}
          <ChevronDownIcon 
            size={14} 
            className={showAll ? styles.rotated : ''}
          />
        </button>
      )}

      {/* Disclaimer */}
      <p className={styles.disclaimer}>
        Issues based on community reports and enthusiast documentation. Not all issues affect all vehicles.
      </p>
    </div>
  );
}
