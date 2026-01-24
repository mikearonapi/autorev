'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './NotificationCenter.module.css';
import { CATEGORY_CONFIG } from '@/lib/notificationService';
import { useAuth } from './providers/AuthProvider';
import { supabase } from '@/lib/supabase';

/**
 * NotificationCenter Component
 * 
 * Displays a bell icon with unread badge and a dropdown panel
 * containing the user's notifications grouped by date.
 * Supports real-time updates via Supabase Realtime subscriptions.
 */
export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const channelRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async (reset = false) => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const offset = reset ? 0 : notifications.length;
      const res = await fetch(`/api/notifications?limit=20&offset=${offset}`);
      if (!res.ok) throw new Error('Failed to fetch');
      
      const data = await res.json();
      
      if (reset) {
        setNotifications(data.notifications || []);
      } else {
        setNotifications(prev => [...prev, ...(data.notifications || [])]);
      }
      setUnreadCount(data.unreadCount || 0);
      setHasMore(data.hasMore || false);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [notifications.length, isAuthenticated]);

  // Fetch unread count periodically
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const res = await fetch('/api/notifications/unread-count');
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.count || 0);
    } catch (err) {
      // Silent fail for polling
    }
  }, [isAuthenticated]);

  // Set up Supabase Realtime subscription for instant notifications
  useEffect(() => {
    if (!isAuthenticated || !user?.id || !supabase) return;
    
    // Subscribe to new notifications for this user
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Add new notification to the top of the list
          const newNotification = payload.new;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Update notification in place (e.g., when marked as read)
          const updatedNotification = payload.new;
          setNotifications(prev =>
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [isAuthenticated, user?.id]);

  // Initial fetch and polling (as fallback for realtime)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000); // Poll every minute as fallback
    return () => clearInterval(interval);
  }, [fetchUnreadCount, isAuthenticated]);

  // Fetch full list when opening
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      fetchNotifications(true);
    }
  }, [isOpen, notifications.length, fetchNotifications]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Mark single notification as read
  const markAsRead = async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, { method: 'PATCH' });
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.action_url) {
      router.push(notification.action_url);
      setIsOpen(false);
    }
  };

  // Group notifications by date
  const groupedNotifications = groupByDate(notifications);

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button
        className={styles.bellButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className={styles.badge}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <h2 className={styles.title}>Notifications</h2>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className={styles.markAllButton}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className={styles.content}>
            {loading && notifications.length === 0 ? (
              <div className={styles.loading}>Loading...</div>
            ) : notifications.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                {Object.entries(groupedNotifications).map(([dateLabel, items]) => (
                  <div key={dateLabel} className={styles.dateGroup}>
                    <div className={styles.dateLabel}>{dateLabel}</div>
                    {items.map(notification => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onClick={() => handleNotificationClick(notification)}
                      />
                    ))}
                  </div>
                ))}
                {hasMore && (
                  <button
                    className={styles.loadMoreButton}
                    onClick={() => fetchNotifications(false)}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load more'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function NotificationItem({ notification, onClick }) {
  const config = CATEGORY_CONFIG[notification.category] || CATEGORY_CONFIG.system;
  const timeAgo = formatTimeAgo(notification.created_at);

  return (
    <div
      className={`${styles.item} ${!notification.is_read ? styles.unread : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className={styles.itemIcon} style={{ backgroundColor: config.color }}>
        {config.icon}
      </div>
      <div className={styles.itemContent}>
        <div className={styles.itemTitle}>{notification.title}</div>
        <div className={styles.itemBody}>{notification.body}</div>
        <div className={styles.itemTime}>{timeAgo}</div>
      </div>
      {!notification.is_read && <div className={styles.unreadDot} />}
    </div>
  );
}

function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>🔔</div>
      <div className={styles.emptyTitle}>All caught up!</div>
      <div className={styles.emptyText}>
        You don&apos;t have any notifications right now.
      </div>
    </div>
  );
}

function BellIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function groupByDate(notifications) {
  const groups = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  notifications.forEach(notification => {
    const date = new Date(notification.created_at);
    date.setHours(0, 0, 0, 0);

    let label;
    if (date.getTime() === today.getTime()) {
      label = 'Today';
    } else if (date.getTime() === yesterday.getTime()) {
      label = 'Yesterday';
    } else {
      label = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }

    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(notification);
  });

  return groups;
}

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
