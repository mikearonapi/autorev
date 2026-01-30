'use client';

import { useState, useEffect, useCallback } from 'react';

import styles from './ALConversationsDashboard.module.css';

/**
 * ALConversationsDashboard Component
 *
 * Admin dashboard for viewing all AL conversations.
 * Shows user questions and AL responses for monitoring and quality assurance.
 */

// SVG Icons
const Icons = {
  user: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  bot: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  ),
  search: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  refresh: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  ),
  chevronDown: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  chevronUp: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m18 15-6-6-6 6" />
    </svg>
  ),
  message: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  car: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  ),
};

function formatDate(dateString) {
  if (!dateString) return '';
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
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Deduplicate consecutive messages with same role and similar content
 * Groups duplicates together with a count
 */
function deduplicateMessages(messages) {
  if (!messages || messages.length === 0) return [];

  const result = [];
  let currentGroup = null;

  for (const msg of messages) {
    // Normalize content for comparison (trim, lowercase, remove extra whitespace)
    const normalizedContent = msg.content?.trim().toLowerCase().replace(/\s+/g, ' ') || '';

    if (
      currentGroup &&
      currentGroup.role === msg.role &&
      currentGroup.normalizedContent === normalizedContent
    ) {
      // Same role and content - increment duplicate count
      currentGroup.duplicateCount++;
      currentGroup.allIds.push(msg.id);
    } else {
      // New unique message - save current group and start new one
      if (currentGroup) {
        result.push(currentGroup);
      }
      currentGroup = {
        ...msg,
        normalizedContent,
        duplicateCount: 1,
        allIds: [msg.id],
      };
    }
  }

  // Don't forget the last group
  if (currentGroup) {
    result.push(currentGroup);
  }

  return result;
}

function ConversationCard({ conversation, isExpanded, onToggle }) {
  // Deduplicate messages for cleaner display
  const deduplicatedMessages = deduplicateMessages(conversation.messages);
  const userCount = deduplicatedMessages.filter((m) => m.role === 'user').length;
  const alCount = deduplicatedMessages.filter((m) => m.role === 'assistant').length;

  return (
    <div className={`${styles.conversationCard} ${isExpanded ? styles.expanded : ''}`}>
      <button className={styles.cardHeader} onClick={onToggle}>
        <div className={styles.cardHeaderLeft}>
          <div className={styles.userRow}>
            <span className={styles.userEmail}>{conversation.userEmail}</span>
            {conversation.userDisplayName && (
              <span className={styles.userName}>({conversation.userDisplayName})</span>
            )}
            <span className={`${styles.tierBadge} ${styles[conversation.userTier]}`}>
              {conversation.userTier}
            </span>
          </div>
          <div className={styles.titleRow}>{conversation.title || 'Untitled conversation'}</div>
        </div>
        <div className={styles.cardHeaderRight}>
          <span className={styles.messageCount}>
            {Icons.message}
            {userCount}/{alCount}
          </span>
          <span className={styles.timestamp}>{formatDate(conversation.lastMessageAt)}</span>
          <span className={styles.expandIcon}>
            {isExpanded ? Icons.chevronUp : Icons.chevronDown}
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className={styles.messagesContainer}>
          {deduplicatedMessages.length === 0 ? (
            <div className={styles.noMessages}>No messages</div>
          ) : (
            deduplicatedMessages.map((message, idx) => (
              <div key={message.id || idx} className={`${styles.message} ${styles[message.role]}`}>
                <div className={styles.messageHeader}>
                  <span className={styles.roleLabel}>{message.role === 'user' ? 'Q' : 'A'}</span>
                  {message.duplicateCount > 1 && (
                    <span className={styles.duplicateBadge}>{message.duplicateCount}x</span>
                  )}
                  <span className={styles.messageTime}>{formatDate(message.createdAt)}</span>
                </div>
                <div className={styles.messageContent}>{message.content}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function ALConversationsDashboard({ token }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const fetchConversations = useCallback(
    async (searchTerm = '', newOffset = 0) => {
      if (!token) {
        console.log('[AL Conversations] No token yet');
        return;
      }

      console.log('[AL Conversations] Starting fetch...');
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: newOffset.toString(),
        });
        if (searchTerm) params.set('search', searchTerm);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const response = await fetch(`/api/admin/al-conversations?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log('[AL Conversations] Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[AL Conversations] Error response:', errorText);
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const data = await response.json();
        console.log('[AL Conversations] Got data:', {
          total: data.total,
          count: data.conversations?.length,
        });
        setConversations(data.conversations || []);
        setTotal(data.total || 0);
        setOffset(newOffset);
      } catch (err) {
        console.error('[AL Conversations] Error:', err);
        if (err.name === 'AbortError') {
          setError('Request timed out. Please try again.');
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // Fetch when token becomes available
  useEffect(() => {
    console.log('[AL Conversations] useEffect triggered, token:', !!token);
    if (token) {
      fetchConversations();
    }
  }, [token, fetchConversations]);

  const handleSearch = (e) => {
    e.preventDefault();
    setExpandedId(null);
    fetchConversations(search, 0);
  };

  const handleRefresh = () => {
    setExpandedId(null);
    fetchConversations(search, offset);
  };

  const handlePrevPage = () => {
    if (offset > 0) {
      setExpandedId(null);
      fetchConversations(search, Math.max(0, offset - limit));
    }
  };

  const handleNextPage = () => {
    if (offset + limit < total) {
      setExpandedId(null);
      fetchConversations(search, offset + limit);
    }
  };

  const toggleExpanded = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>
            {Icons.message}
            AL Conversations
          </h2>
          <p className={styles.subtitle}>Monitor user questions and AL responses</p>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.totalCount}>{total} conversations</span>
          <button
            className={styles.refreshButton}
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh"
          >
            {Icons.refresh}
          </button>
        </div>
      </div>

      {/* Search */}
      <form className={styles.searchForm} onSubmit={handleSearch}>
        <div className={styles.searchInputWrapper}>
          {Icons.search}
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search conversations by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button type="submit" className={styles.searchButton} disabled={loading}>
          Search
        </button>
      </form>

      {/* Error State */}
      {error && (
        <div className={styles.error}>
          <span>Error: {error}</span>
          <button onClick={handleRefresh}>Retry</button>
        </div>
      )}

      {/* Loading State */}
      {(loading || !token) && conversations.length === 0 && !error && (
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
          <span>{!token ? 'Waiting for auth...' : 'Loading conversations...'}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && token && conversations.length === 0 && (
        <div className={styles.empty}>
          {Icons.message}
          <span>No conversations found</span>
          {search && <p>Try adjusting your search terms</p>}
        </div>
      )}

      {/* Conversations List */}
      {conversations.length > 0 && (
        <>
          <div className={styles.conversationsList}>
            {conversations.map((conv) => (
              <ConversationCard
                key={conv.id}
                conversation={conv}
                isExpanded={expandedId === conv.id}
                onToggle={() => toggleExpanded(conv.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className={styles.pagination}>
            <button
              className={styles.pageButton}
              onClick={handlePrevPage}
              disabled={offset === 0 || loading}
            >
              Previous
            </button>
            <span className={styles.pageInfo}>
              {offset + 1} - {Math.min(offset + limit, total)} of {total}
            </span>
            <button
              className={styles.pageButton}
              onClick={handleNextPage}
              disabled={offset + limit >= total || loading}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ALConversationsDashboard;
