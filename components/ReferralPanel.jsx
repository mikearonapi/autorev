'use client';

import { useState } from 'react';
import styles from './ReferralPanel.module.css';
import { useReferralData, useSendReferralInvite, useResendReferralInvite } from '@/hooks/useUserData';
import { platform } from '@/lib/platform';
import { formatEventDate } from '@/lib/dateUtils';

/**
 * ReferralPanel Component
 * 
 * A beautiful, compelling referral sharing panel with:
 * - One-click copy link
 * - Native share (mobile)
 * - Email invite option
 * - Progress toward milestones
 * - Stats dashboard
 * - List of referrals with resend functionality
 */
export default function ReferralPanel({ userId }) {
  // React Query hooks for data fetching and mutations
  const { 
    data: referralData, 
    isLoading, 
    error: queryError,
    refetch: fetchReferralData,
  } = useReferralData({ enabled: !!userId });
  
  const sendInviteMutation = useSendReferralInvite();
  const resendInviteMutation = useResendReferralInvite();
  
  const [copied, setCopied] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');
  const [inviteSent, setInviteSent] = useState(false);
  const [resendingId, setResendingId] = useState(null);
  
  const error = queryError?.message || null;
  const sendingInvite = sendInviteMutation.isPending;

  // Milestones configuration (balanced rewards)
  const MILESTONES = [
    { key: 'milestone_3', friends: 3, reward: '+200 credits', icon: '🎯', type: 'credits' },
    { key: 'milestone_5', friends: 5, reward: '+300 credits', icon: '⚡', type: 'credits' },
    { key: 'milestone_10', friends: 10, reward: '1 month Collector', icon: '🥉', type: 'tier' },
    { key: 'milestone_25', friends: 25, reward: '1 month Tuner', icon: '🏆', type: 'tier' },
  ];

  // Copy link to clipboard (using platform abstraction for cross-platform support)
  const handleCopyLink = async () => {
    if (!referralData?.referral_link) return;
    
    const success = await platform.copyToClipboard(referralData.referral_link);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Native share (mobile) - using platform abstraction for cross-platform support
  const handleNativeShare = async () => {
    if (!referralData?.referral_link) return;
    
    const shareData = {
      title: 'Join me on AutoRev',
      text: 'Check out AutoRev - the best resource for sports car enthusiasts! You\'ll get 200 bonus AL credits when you join:',
      url: referralData.referral_link,
    };

    const result = await platform.share(shareData);
    if (result.method === 'clipboard') {
      // Fallback was used - show copy success
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Send email invite
  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!friendEmail.trim()) return;
    
    try {
      await sendInviteMutation.mutateAsync({ email: friendEmail.trim() });
      setInviteSent(true);
      setFriendEmail('');
      // Data will be automatically refreshed by React Query
      setTimeout(() => {
        setInviteSent(false);
        setShowEmailModal(false);
      }, 2000);
    } catch (err) {
      alert(err.message || 'Failed to send invite');
    }
  };

  // Resend invite
  const handleResendInvite = async (referralId) => {
    setResendingId(referralId);
    try {
      await resendInviteMutation.mutateAsync({ referralId });
      alert('Invite resent!');
    } catch (err) {
      alert(err.message || 'Failed to resend invite');
    } finally {
      setResendingId(null);
    }
  };

  // Calculate milestone progress
  const getProgress = () => {
    if (!referralData?.stats) return { current: 0, next: MILESTONES[0], percentage: 0 };
    
    const current = referralData.stats.signed_up || 0;
    const achieved = referralData.stats.milestones_achieved || [];
    
    // Find next milestone
    const nextMilestone = MILESTONES.find(m => !achieved.includes(m.key));
    
    if (!nextMilestone) {
      return { current, next: null, percentage: 100, achieved: MILESTONES };
    }
    
    // Find previous milestone
    const prevMilestone = MILESTONES.filter(m => achieved.includes(m.key)).pop();
    const prevFriends = prevMilestone?.friends || 0;
    
    const range = nextMilestone.friends - prevFriends;
    const progress = current - prevFriends;
    const percentage = Math.min(100, Math.round((progress / range) * 100));
    
    return { current, next: nextMilestone, percentage, achieved: achieved.map(k => MILESTONES.find(m => m.key === k)) };
  };

  // Mask email for privacy
  const maskEmail = (email) => {
    if (!email) return '';
    const [local, domain] = email.split('@');
    if (local.length <= 2) return email;
    return `${local.slice(0, 2)}***@${domain}`;
  };

  if (isLoading) {
    return (
      <div className={styles.panel}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <span>Loading referral data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.panel}>
        <div className={styles.error}>
          <span>{error}</span>
          <button onClick={fetchReferralData} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const progress = getProgress();
  const canShare = typeof navigator !== 'undefined' && navigator.share;
  const referrals = referralData?.referrals || [];

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerIcon}>🎁</div>
        <div className={styles.headerText}>
          <h3 className={styles.title}>Refer Friends, Earn Rewards</h3>
          <p className={styles.subtitle}>
            You <strong>BOTH</strong> get <strong>200 credits</strong> when they join
          </p>
          <p className={styles.creditExplainer}>
            That's enough for <strong>100+ AI conversations</strong> with AL about cars, builds, and buying advice
          </p>
        </div>
      </div>

      {/* Share Link Section */}
      <div className={styles.shareSection}>
        <label className={styles.shareLabel}>Your Referral Link</label>
        <div className={styles.shareLinkBox}>
          <input
            type="text"
            readOnly
            value={referralData?.referral_link || ''}
            className={styles.shareLinkInput}
            onClick={(e) => e.target.select()}
          />
          <button
            onClick={handleCopyLink}
            className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
          >
            {copied ? (
              <>
                <CheckIcon /> Copied!
              </>
            ) : (
              <>
                <CopyIcon /> Copy
              </>
            )}
          </button>
        </div>

        {/* Share Actions - Clear, focused buttons */}
        <div className={styles.shareActions}>
          <button 
            onClick={() => setShowEmailModal(true)} 
            className={styles.emailActionButton}
          >
            <EmailIcon /> 
            <span className={styles.actionText}>
              <strong>Email Invite</strong>
              <small>We'll send a beautiful invite</small>
            </span>
          </button>
          <button 
            onClick={canShare ? handleNativeShare : handleCopyLink} 
            className={styles.textActionButton}
          >
            {canShare ? <ShareIcon /> : <MessageIcon />}
            <span className={styles.actionText}>
              <strong>{canShare ? 'Text or Share' : 'Copy for Text'}</strong>
              <small>{canShare ? 'iMessage, WhatsApp, etc.' : 'Paste anywhere'}</small>
            </span>
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{referralData?.stats?.signed_up || 0}</span>
          <span className={styles.statLabel}>Friends Joined</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{referralData?.stats?.pending || 0}</span>
          <span className={styles.statLabel}>Pending</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{referralData?.stats?.credits_earned || 0}</span>
          <span className={styles.statLabel}>Credits Earned</span>
        </div>
      </div>

      {/* Milestone Progress */}
      <div className={styles.milestonesSection}>
        <h4 className={styles.milestonesTitle}>
          <TrophyIcon /> Milestone Rewards
        </h4>
        
        {progress.next ? (
          <div className={styles.progressContainer}>
            <div className={styles.progressHeader}>
              <span className={styles.progressLabel}>
                {progress.current} / {progress.next.friends} friends to unlock:
              </span>
              <span className={styles.progressReward}>
                {progress.next.icon} {progress.next.reward}
              </span>
            </div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <span className={styles.progressNeeded}>
              {progress.next.friends - progress.current} more friend{progress.next.friends - progress.current !== 1 ? 's' : ''} to go!
            </span>
          </div>
        ) : (
          <div className={styles.allAchieved}>
            <span className={styles.achievedIcon}>🏆</span>
            <span>You've unlocked all milestones! Legendary!</span>
          </div>
        )}

        {/* Milestone List */}
        <div className={styles.milestonesList}>
          {MILESTONES.map((milestone) => {
            const isAchieved = progress.achieved?.some(a => a?.key === milestone.key);
            const isCurrent = progress.next?.key === milestone.key;
            
            return (
              <div 
                key={milestone.key}
                className={`${styles.milestoneItem} ${isAchieved ? styles.achieved : ''} ${isCurrent ? styles.current : ''}`}
              >
                <span className={styles.milestoneIcon}>{milestone.icon}</span>
                <div className={styles.milestoneInfo}>
                  <span className={styles.milestoneFriends}>{milestone.friends} friends</span>
                  <span className={styles.milestoneReward}>{milestone.reward}</span>
                </div>
                {isAchieved && <span className={styles.achievedBadge}>✓</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Referrals List */}
      {referrals.length > 0 && (
        <div className={styles.referralsListSection}>
          <h4 className={styles.referralsListTitle}>
            <UsersIcon /> Your Referrals
          </h4>
          <div className={styles.referralsList}>
            {referrals.map((referral) => (
              <div key={referral.id} className={styles.referralItem}>
                <div className={styles.referralInfo}>
                  <span className={styles.referralEmail}>{maskEmail(referral.email)}</span>
                  <span className={styles.referralDate}>Invited {formatEventDate(referral.created_at)}</span>
                </div>
                <div className={styles.referralActions}>
                  {referral.status === 'pending' ? (
                    <>
                      <span className={styles.statusPending}>⏳ Pending</span>
                      <button 
                        className={styles.resendButton}
                        onClick={() => handleResendInvite(referral.id)}
                        disabled={resendingId === referral.id}
                      >
                        {resendingId === referral.id ? '...' : '📧 Nudge'}
                      </button>
                    </>
                  ) : (
                    <>
                      <span className={styles.statusJoined}>✓ Joined</span>
                      <span className={styles.creditsEarned}>+{referral.credits_earned || 200}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className={styles.modalOverlay} onClick={() => setShowEmailModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowEmailModal(false)}>×</button>
            <h3 className={styles.modalTitle}>
              <EmailIcon /> Invite a Friend
            </h3>
            <p className={styles.modalDescription}>
              We'll send them a beautiful invite with your referral link. They'll get <strong>200 bonus credits</strong> when they join!
            </p>
            <form onSubmit={handleSendInvite} className={styles.inviteForm}>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="friend@email.com"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                className={styles.emailInput}
                required
              />
              <button 
                type="submit" 
                className={styles.sendButton}
                disabled={sendingInvite || inviteSent}
              >
                {inviteSent ? '✓ Sent!' : sendingInvite ? 'Sending...' : 'Send Invite'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Icons
const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/>
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

const EmailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const MessageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const TrophyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
