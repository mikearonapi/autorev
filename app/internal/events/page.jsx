'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { Icons } from '@/components/ui/Icons';
import EmptyState from '@/components/ui/EmptyState';

// Static icon elements for event metadata (pre-rendered at fixed size)
const StaticIcons = {
  calendar: <Icons.calendar size={14} />,
  mapPin: <Icons.mapPin size={14} />,
  tag: <Icons.tag size={14} />,
  externalLink: <Icons.externalLink size={14} />,
};

// Rejection reason options
const REJECTION_REASONS = [
  { value: 'duplicate', label: 'Duplicate Event' },
  { value: 'invalid_url', label: 'Invalid or Broken URL' },
  { value: 'not_car_event', label: 'Not a Car Event' },
  { value: 'spam', label: 'Spam or Self-Promotion' },
  { value: 'past_event', label: 'Event Already Passed' },
  { value: 'other', label: 'Other' },
];

// Format date for display
function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Format relative time
function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(dateString);
}

export default function EventModerationPage() {
  const [adminKey, setAdminKey] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState('pending');
  
  // Modal state
  const [approveModal, setApproveModal] = useState(null); // submission object
  const [rejectModal, setRejectModal] = useState(null); // submission object
  const [rejectReason, setRejectReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  
  // Approve form state
  const [approveForm, setApproveForm] = useState({});
  
  const canLoad = useMemo(() => Boolean(adminKey), [adminKey]);
  
  // Load submissions
  async function loadSubmissions() {
    if (!adminKey) return;
    setLoading(true);
    setMessage(null);
    
    try {
      const qs = new URLSearchParams();
      qs.set('status', statusFilter);
      qs.set('limit', '50');
      
      const res = await fetch(`/api/internal/events/submissions?${qs.toString()}`, {
        headers: { 'x-internal-admin-key': adminKey },
      });
      const json = await res.json();
      
      if (!res.ok) throw new Error(json?.error || 'Failed to load submissions');
      
      setSubmissions(json.submissions || []);
      setStats(json.stats || { pending: 0, approved: 0, rejected: 0 });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }
  
  // Open approve modal
  function openApproveModal(submission) {
    setApproveForm({
      name: submission.name,
      event_type_slug: submission.event_type_slug,
      source_url: submission.source_url,
      start_date: submission.start_date,
      end_date: submission.end_date || '',
      venue_name: submission.venue_name || '',
      city: submission.city,
      state: submission.state || '',
      description: submission.description || '',
      scope: 'local',
      region: '',
      is_free: false,
      featured: false,
    });
    setApproveModal(submission);
  }
  
  // Handle approve
  async function handleApprove() {
    if (!approveModal) return;
    setModalLoading(true);
    
    try {
      const res = await fetch('/api/internal/events/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-admin-key': adminKey,
        },
        body: JSON.stringify({
          submissionId: approveModal.id,
          eventData: approveForm,
        }),
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to approve');
      
      setMessage({ type: 'success', text: `Event "${json.event?.name}" created!` });
      setApproveModal(null);
      loadSubmissions();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setModalLoading(false);
    }
  }
  
  // Open reject modal
  function openRejectModal(submission) {
    setRejectReason('');
    setCustomReason('');
    setRejectModal(submission);
  }
  
  // Handle reject
  async function handleReject() {
    if (!rejectModal) return;
    
    const reason = rejectReason === 'other' ? customReason : REJECTION_REASONS.find(r => r.value === rejectReason)?.label || rejectReason;
    
    if (!reason) {
      setMessage({ type: 'error', text: 'Please select a rejection reason' });
      return;
    }
    
    setModalLoading(true);
    
    try {
      const res = await fetch(`/api/internal/events/submissions/${rejectModal.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-admin-key': adminKey,
        },
        body: JSON.stringify({ reason }),
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to reject');
      
      setMessage({ type: 'success', text: 'Submission rejected.' });
      setRejectModal(null);
      loadSubmissions();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setModalLoading(false);
    }
  }
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Event Moderation</h1>
        <p>Review and approve user-submitted events. Approved events appear on the public events calendar.</p>
      </header>
      
      {/* Admin Key Input */}
      <div className={styles.authSection}>
        <label>Admin Key</label>
        <input
          type="password"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          placeholder="INTERNAL_ADMIN_KEY"
        />
        <button disabled={!canLoad || loading} onClick={loadSubmissions}>
          {loading ? 'Loading…' : 'Load Submissions'}
        </button>
      </div>
      
      {/* Stats Row */}
      <div className={styles.statsRow}>
        <div className={`${styles.statCard} ${styles.statPending}`}>
          <span className={styles.statNumber}>{stats.pending}</span>
          <span className={styles.statLabel}>Pending</span>
        </div>
        <div className={`${styles.statCard} ${styles.statApproved}`}>
          <span className={styles.statNumber}>{stats.approved}</span>
          <span className={styles.statLabel}>Approved</span>
        </div>
        <div className={`${styles.statCard} ${styles.statRejected}`}>
          <span className={styles.statNumber}>{stats.rejected + (stats.duplicate || 0)}</span>
          <span className={styles.statLabel}>Rejected</span>
        </div>
      </div>
      
      {/* Filter Tabs */}
      <div className={styles.tabs}>
        {['pending', 'approved', 'rejected', 'all'].map(status => (
          <button
            key={status}
            className={`${styles.tab} ${statusFilter === status ? styles.tabActive : ''}`}
            onClick={() => {
              setStatusFilter(status);
              if (adminKey) loadSubmissions();
            }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>
      
      {/* Message */}
      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>
      )}
      
      {/* Submissions List */}
      <div className={styles.submissionsList}>
        {submissions.length === 0 && !loading ? (
          <EmptyState
            icon={Icons.calendar}
            title={canLoad ? 'No submissions found' : 'Authentication required'}
            description={canLoad ? 'No event submissions to review.' : 'Enter admin key to load submissions.'}
            variant="centered"
          />
        ) : (
          submissions.map(sub => (
            <div key={sub.id} className={styles.submissionCard}>
              <div className={styles.submissionHeader}>
                <h3 className={styles.submissionName}>{sub.name}</h3>
                <span className={`${styles.statusBadge} ${styles[`status_${sub.status}`]}`}>
                  {sub.status}
                </span>
              </div>
              
              <div className={styles.submissionMeta}>
                <span>
                  {StaticIcons.calendar} {formatDate(sub.start_date)}
                  {sub.end_date && sub.end_date !== sub.start_date && ` - ${formatDate(sub.end_date)}`}
                </span>
                <span>{StaticIcons.mapPin} {sub.city}{sub.state ? `, ${sub.state}` : ''}</span>
                <span>{StaticIcons.tag} {sub.event_type_slug}</span>
              </div>
              
              {sub.description && (
                <p className={styles.submissionDescription}>{sub.description}</p>
              )}
              
              <div className={styles.submissionFooter}>
                <div className={styles.submissionInfo}>
                  <span>
                    Submitted by: {sub.submitted_by?.display_name || sub.submitted_by?.email || 'Anonymous'}
                  </span>
                  <span>{formatRelativeTime(sub.created_at)}</span>
                </div>
                
                <div className={styles.submissionActions}>
                  <a
                    href={sub.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.previewLink}
                  >
                    View URL ↗
                  </a>
                  
                  {sub.status === 'pending' && (
                    <>
                      <button
                        className={styles.approveBtn}
                        onClick={() => openApproveModal(sub)}
                      >
                        Approve
                      </button>
                      <button
                        className={styles.rejectBtn}
                        onClick={() => openRejectModal(sub)}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  
                  {sub.status === 'approved' && sub.created_event_id && (
                    <Link 
                      href={`/events/${sub.created_event_id}`} 
                      className={styles.viewEventLink}
                    >
                      View Event
                    </Link>
                  )}
                  
                  {(sub.status === 'rejected' || sub.status === 'duplicate') && sub.rejection_reason && (
                    <span className={styles.rejectionReason}>
                      Reason: {sub.rejection_reason}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Approve Modal */}
      {approveModal && (
        <div className={styles.modalOverlay} onClick={() => !modalLoading && setApproveModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Approve & Create Event</h2>
            
            <div className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Event Name</label>
                <input
                  type="text"
                  value={approveForm.name}
                  onChange={(e) => setApproveForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={approveForm.start_date}
                    onChange={(e) => setApproveForm(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>End Date (optional)</label>
                  <input
                    type="date"
                    value={approveForm.end_date}
                    onChange={(e) => setApproveForm(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label>Venue Name (optional)</label>
                <input
                  type="text"
                  value={approveForm.venue_name}
                  onChange={(e) => setApproveForm(prev => ({ ...prev, venue_name: e.target.value }))}
                />
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>City</label>
                  <input
                    type="text"
                    value={approveForm.city}
                    onChange={(e) => setApproveForm(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>State</label>
                  <input
                    type="text"
                    value={approveForm.state}
                    onChange={(e) => setApproveForm(prev => ({ ...prev, state: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Scope</label>
                  <select
                    value={approveForm.scope}
                    onChange={(e) => setApproveForm(prev => ({ ...prev, scope: e.target.value }))}
                  >
                    <option value="local">Local</option>
                    <option value="regional">Regional</option>
                    <option value="national">National</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Region</label>
                  <select
                    value={approveForm.region}
                    onChange={(e) => setApproveForm(prev => ({ ...prev, region: e.target.value }))}
                  >
                    <option value="">Select Region</option>
                    <option value="Northeast">Northeast</option>
                    <option value="Southeast">Southeast</option>
                    <option value="Midwest">Midwest</option>
                    <option value="Southwest">Southwest</option>
                    <option value="West">West</option>
                  </select>
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label>Description (optional)</label>
                <textarea
                  value={approveForm.description}
                  onChange={(e) => setApproveForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div className={styles.formRow}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={approveForm.is_free}
                    onChange={(e) => setApproveForm(prev => ({ ...prev, is_free: e.target.checked }))}
                  />
                  Free Event
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={approveForm.featured}
                    onChange={(e) => setApproveForm(prev => ({ ...prev, featured: e.target.checked }))}
                  />
                  Featured
                </label>
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setApproveModal(null)}
                disabled={modalLoading}
              >
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleApprove}
                disabled={modalLoading}
              >
                {modalLoading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Reject Modal */}
      {rejectModal && (
        <div className={styles.modalOverlay} onClick={() => !modalLoading && setRejectModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Reject Submission</h2>
            <p className={styles.modalSubtitle}>
              Rejecting: <strong>{rejectModal.name}</strong>
            </p>
            
            <div className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Rejection Reason</label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                >
                  <option value="">Select reason...</option>
                  {REJECTION_REASONS.map(reason => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {rejectReason === 'other' && (
                <div className={styles.formGroup}>
                  <label>Custom Reason</label>
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    rows={3}
                  />
                </div>
              )}
            </div>
            
            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setRejectModal(null)}
                disabled={modalLoading}
              >
                Cancel
              </button>
              <button
                className={styles.rejectConfirmBtn}
                onClick={handleReject}
                disabled={modalLoading || (!rejectReason || (rejectReason === 'other' && !customReason))}
              >
                {modalLoading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

