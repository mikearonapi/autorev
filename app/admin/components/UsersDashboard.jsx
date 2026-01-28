'use client';

/**
 * Users Dashboard Component
 * 
 * Searchable, filterable table of all users with:
 * - User info (name, email, tier)
 * - Attribution (source, campaign)
 * - Engagement metrics (cars viewed, AL usage)
 * - Activity indicators
 */

import { useState, useEffect, useCallback } from 'react';

import Image from 'next/image';

import {
  UsersIcon,
  SearchIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from './Icons';
import styles from './UsersDashboard.module.css';

// Tier badge colors - Dark theme compatible
const TIER_COLORS = {
  free: { bg: 'rgba(100, 116, 139, 0.15)', text: '#94a3b8', border: 'rgba(100, 116, 139, 0.3)' },
  collector: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' },
  tuner: { bg: 'rgba(139, 92, 246, 0.15)', text: '#a78bfa', border: 'rgba(139, 92, 246, 0.3)' },
  admin: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' },
};

// Format relative time - using UTC dates to avoid timezone issues
function formatRelativeTime(dateStr) {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  
  // Compare UTC date strings to get accurate day difference
  const dateUTC = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const nowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  
  const diffMs = nowUTC - dateUTC;
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

// Format date
function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Summary card
function SummaryCard({ label, value, icon: Icon, color = '#3b82f6' }) {
  return (
    <div className={styles.summaryCard}>
      <div className={styles.summaryIcon} style={{ color }}>
        <Icon size={18} />
      </div>
      <div className={styles.summaryContent}>
        <span className={styles.summaryValue}>{value}</span>
        <span className={styles.summaryLabel}>{label}</span>
      </div>
    </div>
  );
}

// Tier badge
function TierBadge({ tier }) {
  const colors = TIER_COLORS[tier] || TIER_COLORS.free;
  return (
    <span 
      className={styles.tierBadge} 
      style={{ 
        backgroundColor: colors.bg, 
        color: colors.text,
        borderColor: colors.border 
      }}
    >
      {tier}
    </span>
  );
}

// Source badge
function SourceBadge({ source }) {
  const sourceColors = {
    Direct: '#94a3b8',
    google: '#ea4335',
    facebook: '#1877f2',
    twitter: '#1da1f2',
    instagram: '#e4405f',
    reddit: '#ff4500',
    youtube: '#ff0000',
    referral: '#22c55e',
  };
  const color = sourceColors[source] || '#94a3b8';
  
  return (
    <span className={styles.sourceBadge} style={{ borderColor: color, color }}>
      {source}
    </span>
  );
}

// Engagement value - just the number, aligned with column header
function EngagementValue({ value, label }) {
  return (
    <div className={styles.engagementValue} title={label}>
      {value}
    </div>
  );
}

// Activity indicator
function ActivityIndicator({ level }) {
  // level: 0 = inactive, 1 = low, 2 = medium, 3 = high
  const colors = ['rgba(100, 116, 139, 0.3)', '#fbbf24', '#34d399', '#3b82f6'];
  const labels = ['Inactive', 'Low activity', 'Medium activity', 'High activity'];
  return (
    <div className={styles.activityIndicator} title={labels[level]}>
      {[0, 1, 2].map(i => (
        <span 
          key={i} 
          className={styles.activityDot}
          style={{ backgroundColor: i < level ? colors[level] : colors[0] }}
        />
      ))}
    </div>
  );
}

// Main component
export function UsersDashboard({ token, range: _range = '7d', currentUserId = null }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters and pagination
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [expandedUser, setExpandedUser] = useState(null);
  
  const limit = 25;

  const fetchData = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort,
        order,
      });
      
      if (search) params.set('search', search);
      if (tierFilter) params.set('tier', tierFilter);
      
      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to fetch users');
      
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error('[UsersDashboard] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, page, sort, order, search, tierFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSort = (field) => {
    if (sort === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(field);
      setOrder('desc');
    }
    setPage(1);
  };

  const getActivityLevel = (user) => {
    if (!user.recentActivityCount) return 0;
    if (user.recentActivityCount < 5) return 1;
    if (user.recentActivityCount < 20) return 2;
    return 3;
  };

  if (loading && !data) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>Error: {error}</p>
          <button onClick={fetchData} className={styles.retryButton}>Retry</button>
        </div>
      </div>
    );
  }

  const { users = [], pagination = {}, summary = {} } = data || {};

  return (
    <div className={styles.container}>
      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <SummaryCard 
          label="Total Users" 
          value={summary.totalUsers?.toLocaleString() || '0'} 
          icon={UsersIcon}
          color="#3b82f6"
        />
        <SummaryCard 
          label="Active (7d)" 
          value={summary.activeUsers7d?.toLocaleString() || '0'} 
          icon={UsersIcon}
          color="#22c55e"
        />
        <SummaryCard 
          label="Free" 
          value={summary.tierBreakdown?.free || 0} 
          icon={UsersIcon}
          color="#6b7280"
        />
        <SummaryCard 
          label="Collector" 
          value={summary.tierBreakdown?.collector || 0} 
          icon={UsersIcon}
          color="#1d4ed8"
        />
        <SummaryCard 
          label="Tuner" 
          value={summary.tierBreakdown?.tuner || 0} 
          icon={UsersIcon}
          color="#a21caf"
        />
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <SearchIcon size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <select
          value={tierFilter}
          onChange={(e) => { setTierFilter(e.target.value); setPage(1); }}
          className={styles.filterSelect}
        >
          <option value="">All Tiers</option>
          <option value="free">Free</option>
          <option value="collector">Collector</option>
          <option value="tuner">Tuner</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Users Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th onClick={() => handleSort('display_name')} className={styles.sortable}>
                User
                {sort === 'display_name' && (order === 'asc' ? <ChevronUpIcon size={12} /> : <ChevronDownIcon size={12} />)}
              </th>
              <th onClick={() => handleSort('subscription_tier')} className={styles.sortable}>
                Tier
                {sort === 'subscription_tier' && (order === 'asc' ? <ChevronUpIcon size={12} /> : <ChevronDownIcon size={12} />)}
              </th>
              <th>Source</th>
              <th onClick={() => handleSort('created_at')} className={styles.sortable}>
                Joined
                {sort === 'created_at' && (order === 'asc' ? <ChevronUpIcon size={12} /> : <ChevronDownIcon size={12} />)}
              </th>
              <th onClick={() => handleSort('last_sign_in')} className={styles.sortable}>
                Last Active
                {sort === 'last_sign_in' && (order === 'asc' ? <ChevronUpIcon size={12} /> : <ChevronDownIcon size={12} />)}
              </th>
              <th onClick={() => handleSort('recent_activity')} className={styles.sortable}>
                Activity
                {sort === 'recent_activity' && (order === 'asc' ? <ChevronUpIcon size={12} /> : <ChevronDownIcon size={12} />)}
              </th>
              <th onClick={() => handleSort('garage')} className={`${styles.sortable} ${styles.engagementCol}`} title="Cars in user's garage">
                🚗
                {sort === 'garage' && (order === 'asc' ? <ChevronUpIcon size={12} /> : <ChevronDownIcon size={12} />)}
              </th>
              <th onClick={() => handleSort('favorites')} className={`${styles.sortable} ${styles.engagementCol}`} title="Favorited cars">
                ❤️
                {sort === 'favorites' && (order === 'asc' ? <ChevronUpIcon size={12} /> : <ChevronDownIcon size={12} />)}
              </th>
              <th onClick={() => handleSort('builds')} className={`${styles.sortable} ${styles.engagementCol}`} title="Saved tuning builds">
                🔧
                {sort === 'builds' && (order === 'asc' ? <ChevronUpIcon size={12} /> : <ChevronDownIcon size={12} />)}
              </th>
              <th onClick={() => handleSort('events')} className={`${styles.sortable} ${styles.engagementCol}`} title="Saved events">
                📅
                {sort === 'events' && (order === 'asc' ? <ChevronUpIcon size={12} /> : <ChevronDownIcon size={12} />)}
              </th>
              <th onClick={() => handleSort('al_chats')} className={`${styles.sortable} ${styles.engagementCol}`} title="AL conversations">
                💬
                {sort === 'al_chats' && (order === 'asc' ? <ChevronUpIcon size={12} /> : <ChevronDownIcon size={12} />)}
              </th>
              <th onClick={() => handleSort('compares')} className={`${styles.sortable} ${styles.engagementCol}`} title="Compare lists">
                🔀
                {sort === 'compares' && (order === 'asc' ? <ChevronUpIcon size={12} /> : <ChevronDownIcon size={12} />)}
              </th>
              <th onClick={() => handleSort('service')} className={`${styles.sortable} ${styles.engagementCol}`} title="Service logs">
                🛠️
                {sort === 'service' && (order === 'asc' ? <ChevronUpIcon size={12} /> : <ChevronDownIcon size={12} />)}
              </th>
              <th onClick={() => handleSort('feedback')} className={`${styles.sortable} ${styles.engagementCol}`} title="Feedback submitted">
                📝
                {sort === 'feedback' && (order === 'asc' ? <ChevronUpIcon size={12} /> : <ChevronDownIcon size={12} />)}
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <>
                <tr 
                  key={user.id}
                  className={`${styles.userRow} ${expandedUser === user.id ? styles.expanded : ''}`}
                  onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                >
                  <td>
                    <div className={styles.userCell}>
                      <div className={styles.avatar}>
                        {user.avatar ? (
                          <Image src={user.avatar} alt="" width={32} height={32} style={{ objectFit: 'cover', borderRadius: '50%' }} />
                        ) : (
                          <span>{(user.displayName?.[0] || '?').toUpperCase()}</span>
                        )}
                      </div>
                      <div className={styles.userInfo}>
                        <span className={styles.userName}>{user.displayName || 'Anonymous'}</span>
                        <span className={styles.userEmail}>{user.email || 'No email'}</span>
                      </div>
                    </div>
                  </td>
                  <td><TierBadge tier={user.tier} /></td>
                  <td><SourceBadge source={user.source} /></td>
                  <td className={styles.dateCell}>{formatRelativeTime(user.createdAt)}</td>
                  <td className={styles.dateCell}>
                    {user.id === currentUserId ? (
                      <span className={styles.activeNow}>Active Now</span>
                    ) : (
                      formatRelativeTime(user.lastSignIn)
                    )}
                  </td>
                  <td><ActivityIndicator level={getActivityLevel(user)} /></td>
                  <td className={styles.engagementCol}><EngagementValue value={user.garageVehicles} label="Garage vehicles" /></td>
                  <td className={styles.engagementCol}><EngagementValue value={user.favorites} label="Favorited cars" /></td>
                  <td className={styles.engagementCol}><EngagementValue value={user.savedBuilds} label="Saved builds" /></td>
                  <td className={styles.engagementCol}><EngagementValue value={user.savedEvents} label="Saved events" /></td>
                  <td className={styles.engagementCol}><EngagementValue value={user.alConversations} label="AL conversations" /></td>
                  <td className={styles.engagementCol}><EngagementValue value={user.compareLists} label="Compare lists" /></td>
                  <td className={styles.engagementCol}><EngagementValue value={user.serviceLogs} label="Service logs" /></td>
                  <td className={styles.engagementCol}><EngagementValue value={user.feedbackCount} label="Feedback submitted" /></td>
                </tr>
                
                {/* Expanded Row */}
                {expandedUser === user.id && (
                  <tr className={styles.expandedRow}>
                    <td colSpan="14">
                      <div className={styles.expandedContent}>
                        <div className={styles.expandedSection}>
                          <h4>Attribution</h4>
                          <div className={styles.expandedGrid}>
                            <div><span>Source:</span> {user.source}</div>
                            <div><span>Medium:</span> {user.medium || '-'}</div>
                            <div><span>Campaign:</span> {user.campaign || '-'}</div>
                            <div><span>Device:</span> {user.signupDevice || '-'}</div>
                            <div><span>Country:</span> {user.signupCountry || '-'}</div>
                            {user.referredByCode && <div><span>Referral:</span> {user.referredByCode}</div>}
                          </div>
                        </div>
                        
                        <div className={styles.expandedSection}>
                          <h4>Platform Usage</h4>
                          <div className={styles.expandedGrid}>
                            <div><span>🚗 Garage:</span> {user.garageVehicles} {user.garageVehicles === 1 ? 'vehicle' : 'vehicles'}</div>
                            <div><span>❤️ Favorites:</span> {user.favorites} {user.favorites === 1 ? 'car' : 'cars'}</div>
                            <div><span>🔧 Builds:</span> {user.savedBuilds} {user.savedBuilds === 1 ? 'project' : 'projects'}</div>
                            <div><span>📅 Events:</span> {user.savedEvents} saved</div>
                            <div><span>🔀 Compares:</span> {user.compareLists} {user.compareLists === 1 ? 'list' : 'lists'}</div>
                            <div><span>🔧 Service:</span> {user.serviceLogs} {user.serviceLogs === 1 ? 'log' : 'logs'}</div>
                            <div><span>💬 Feedback:</span> {user.feedbackCount} submitted</div>
                            <div><span>📈 Activity:</span> {user.recentActivityCount} actions (30d)</div>
                          </div>
                        </div>
                        
                        <div className={styles.expandedSection}>
                          <h4>AL Usage</h4>
                          <div className={styles.expandedGrid}>
                            <div><span>Credits:</span> {user.isUnlimited ? '∞' : user.alCredits}</div>
                            <div><span>Messages:</span> {user.alMessagesThisMonth || 0}</div>
                            <div><span>Conversations:</span> {user.alConversations}</div>
                            <div><span>Last Used:</span> {formatDate(user.alLastUsed)}</div>
                          </div>
                        </div>
                        
                        <div className={styles.expandedSection}>
                          <h4>Dates</h4>
                          <div className={styles.expandedGrid}>
                            <div><span>Joined:</span> {formatDate(user.createdAt)}</div>
                            <div>
                              <span>Last Sign In:</span>{' '}
                              {user.id === currentUserId ? (
                                <span className={styles.activeNow}>Active Now</span>
                              ) : (
                                formatDate(user.lastSignIn)
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className={styles.userIdRow}>
                          <code>{user.id}</code>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className={styles.pageButton}
          >
            Previous
          </button>
          
          <span className={styles.pageInfo}>
            Page {page} of {pagination.totalPages} ({pagination.total} users)
          </span>
          
          <button 
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className={styles.pageButton}
          >
            Next
          </button>
        </div>
      )}
      
      {/* Empty state */}
      {users.length === 0 && !loading && (
        <div className={styles.emptyState}>
          <p>No users found{search ? ` matching "${search}"` : ''}.</p>
        </div>
      )}
    </div>
  );
}

export default UsersDashboard;

