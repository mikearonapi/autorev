'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '@/components/providers/AuthProvider';
import styles from './CommentsSheet.module.css';

/**
 * Comments Sheet - Bottom sheet for viewing and posting comments
 * Includes AI moderation notification with AL's profile picture
 * Supports edit and delete for own comments
 */

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
  </svg>
);

const MoreIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5" r="2"/>
    <circle cx="12" cy="12" r="2"/>
    <circle cx="12" cy="19" r="2"/>
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

export default function CommentsSheet({ postId, postTitle, commentCount = 0, onClose, onCommentAdded }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [guidance, setGuidance] = useState(null);
  
  // Edit/Delete state
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  
  const inputRef = useRef(null);
  const editInputRef = useRef(null);
  const commentsEndRef = useRef(null);

  // Fetch comments
  useEffect(() => {
    async function fetchComments() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/community/posts/${postId}/comments`);
        if (!res.ok) throw new Error('Failed to fetch comments');
        const data = await res.json();
        setComments(data.comments || []);
        setGuidance(data.guidance);
      } catch (err) {
        setError('Unable to load comments');
        console.error('[CommentsSheet] Fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (postId) {
      fetchComments();
    }
  }, [postId]);

  // Focus input when sheet opens
  useEffect(() => {
    if (!isLoading && inputRef.current && !editingCommentId) {
      inputRef.current.focus();
    }
  }, [isLoading, editingCommentId]);

  // Focus edit input when editing
  useEffect(() => {
    if (editingCommentId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCommentId]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setMenuOpenId(null);
    };
    if (menuOpenId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [menuOpenId]);

  // Scroll to bottom when new comments are added
  const scrollToBottom = useCallback(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Submit new comment
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setSubmitError('Please sign in to comment');
      return;
    }
    
    const content = newComment.trim();
    if (!content) return;
    
    if (content.length > 1000) {
      setSubmitError('Comment is too long (max 1000 characters)');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (data.rejected) {
          setSubmitError(data.reason || 'Comment did not meet community standards');
        } else if (data.requiresAuth) {
          setSubmitError('Please sign in to comment');
        } else if (data.rateLimited) {
          setSubmitError('Please wait a moment before posting again');
        } else {
          setSubmitError(data.error || 'Failed to post comment');
        }
        return;
      }
      
      // Success! Add comment to list
      if (data.comment) {
        setComments(prev => [...prev, data.comment]);
        setNewComment('');
        onCommentAdded?.();
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      setSubmitError('Network error. Please try again.');
      console.error('[CommentsSheet] Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start editing a comment
  const startEditing = (comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
    setMenuOpenId(null);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  // Save edited comment
  const saveEdit = async (commentId) => {
    const content = editContent.trim();
    if (!content || content.length > 1000) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, content }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.rejected) {
          setSubmitError(data.reason || 'Edited comment did not meet community standards');
        } else {
          setSubmitError(data.error || 'Failed to update comment');
        }
        return;
      }

      // Update comment in list
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, content, isPending: data.comment?.isPending } : c
      ));
      setEditingCommentId(null);
      setEditContent('');
    } catch (err) {
      setSubmitError('Failed to update comment');
      console.error('[CommentsSheet] Edit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete comment
  const deleteComment = async (commentId) => {
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        setSubmitError(data.error || 'Failed to delete comment');
        return;
      }

      // Remove from list
      setComments(prev => prev.filter(c => c.id !== commentId));
      setDeleteConfirmId(null);
      setMenuOpenId(null);
    } catch (err) {
      setSubmitError('Failed to delete comment');
      console.error('[CommentsSheet] Delete error:', err);
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (editingCommentId) {
          cancelEditing();
        } else if (deleteConfirmId) {
          setDeleteConfirmId(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, editingCommentId, deleteConfirmId]);

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Toggle menu for a comment
  const toggleMenu = (e, commentId) => {
    e.stopPropagation();
    setMenuOpenId(menuOpenId === commentId ? null : commentId);
    setDeleteConfirmId(null);
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.sheet}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <h2>Comments</h2>
            <span className={styles.commentCount}>{comments.length || commentCount}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        
        {/* Comments List */}
        <div className={styles.commentsContainer}>
          {isLoading ? (
            <div className={styles.loadingState}>
              <div className={styles.loadingSpinner} />
              <span>Loading comments...</span>
            </div>
          ) : error ? (
            <div className={styles.errorState}>
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>Retry</button>
            </div>
          ) : comments.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>💬</div>
              <h3>No comments yet</h3>
              <p>Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className={styles.commentsList}>
              {comments.map((comment) => (
                <div 
                  key={comment.id} 
                  className={`${styles.comment} ${comment.isPending ? styles.pending : ''}`}
                >
                  <div className={styles.commentAvatar}>
                    {comment.user?.avatarUrl ? (
                      <Image 
                        src={comment.user.avatarUrl} 
                        alt="" 
                        width={36} 
                        height={36}
                        className={styles.avatarImg}
                      />
                    ) : (
                      <span>{comment.user?.displayName?.charAt(0) || '?'}</span>
                    )}
                  </div>
                  <div className={styles.commentBody}>
                    <div className={styles.commentHeader}>
                      <span className={styles.commentAuthor}>
                        {comment.user?.displayName || 'Anonymous'}
                      </span>
                      <span className={styles.commentTime}>{formatTime(comment.created_at)}</span>
                      
                      {/* Edit/Delete menu for own comments */}
                      {comment.isOwn && (
                        <div className={styles.commentMenu}>
                          <button 
                            className={styles.menuBtn}
                            onClick={(e) => toggleMenu(e, comment.id)}
                          >
                            <MoreIcon />
                          </button>
                          
                          {menuOpenId === comment.id && (
                            <div className={styles.menuDropdown}>
                              <button onClick={() => startEditing(comment)}>
                                <EditIcon /> Edit
                              </button>
                              <button 
                                className={styles.deleteBtn}
                                onClick={() => setDeleteConfirmId(comment.id)}
                              >
                                <TrashIcon /> Delete
                              </button>
                            </div>
                          )}
                          
                          {deleteConfirmId === comment.id && (
                            <div className={styles.deleteConfirm}>
                              <span>Delete this comment?</span>
                              <div className={styles.confirmBtns}>
                                <button onClick={() => setDeleteConfirmId(null)}>Cancel</button>
                                <button 
                                  className={styles.confirmDelete}
                                  onClick={() => deleteComment(comment.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Comment content or edit input */}
                    {editingCommentId === comment.id ? (
                      <div className={styles.editWrapper}>
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          maxLength={1000}
                          className={styles.editInput}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(comment.id);
                            if (e.key === 'Escape') cancelEditing();
                          }}
                        />
                        <div className={styles.editActions}>
                          <button onClick={cancelEditing}>Cancel</button>
                          <button 
                            onClick={() => saveEdit(comment.id)}
                            disabled={!editContent.trim() || isSubmitting}
                            className={styles.saveBtn}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className={styles.commentContent}>{comment.content}</p>
                    )}
                    
                    {comment.isPending && (
                      <span className={styles.pendingBadge}>Pending review</span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={commentsEndRef} />
            </div>
          )}
        </div>
        
        {/* AI Moderation Notice */}
        <div className={styles.moderationNotice}>
          <div className={styles.alAvatar}>
            <Image 
              src="/images/al-mascot-64.png" 
              alt="AL" 
              width={24} 
              height={24}
              className={styles.alAvatarImg}
            />
          </div>
          <span>Comments are reviewed by AI AL to ensure they follow community standards</span>
        </div>
        
        {/* Comment Input */}
        <form className={styles.inputContainer} onSubmit={handleSubmit}>
          {submitError && (
            <div className={styles.submitError}>
              <span>{submitError}</span>
              <button type="button" onClick={() => setSubmitError(null)}>×</button>
            </div>
          )}
          
          {!user ? (
            <div className={styles.signInPrompt}>
              <a href="/login" className={styles.signInBtn}>Sign in to comment</a>
            </div>
          ) : (
            <div className={styles.inputWrapper}>
              <input
                ref={inputRef}
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                maxLength={1000}
                disabled={isSubmitting}
                className={styles.input}
              />
              <button 
                type="submit" 
                className={styles.sendBtn}
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <div className={styles.sendSpinner} />
                ) : (
                  <SendIcon />
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
