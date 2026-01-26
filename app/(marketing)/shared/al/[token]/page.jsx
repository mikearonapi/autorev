'use client';

/**
 * Shared AL Conversation View
 * 
 * Public, read-only view of a shared AL conversation.
 * No authentication required - accessed via share token.
 * 
 * Features:
 * - Token-based access
 * - Read-only conversation display
 * - Vehicle context shown
 * - Citations visible
 * - Share buttons
 * - CTA to try AL
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';
import { UI_IMAGES } from '@/lib/images';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';

// =============================================================================
// SKELETON LOADER
// =============================================================================

function ConversationSkeleton() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Skeleton width={120} height={32} variant="rounded" />
        </div>
        <div className={styles.headerMeta}>
          <Skeleton width={140} height={28} variant="rounded" />
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.conversationHeader}>
          <Skeleton width="60%" height={28} variant="rounded" style={{ margin: '0 auto 8px' }} />
          <Skeleton width={180} height={14} variant="rounded" style={{ margin: '0 auto' }} />
        </div>

        <div className={styles.messages} aria-label="Loading conversation">
          {/* User message skeleton */}
          <div className={`${styles.message} ${styles.userMessage}`}>
            <div className={styles.messageContent}>
              <Skeleton width="100%" height={40} variant="rounded" />
            </div>
          </div>
          
          {/* Assistant message skeleton */}
          <div className={`${styles.message} ${styles.assistantMessage}`}>
            <Skeleton width={36} height={36} variant="circular" />
            <div className={styles.messageContent}>
              <SkeletonText lines={4} lineHeight={16} gap={8} />
            </div>
          </div>
          
          {/* Another user message */}
          <div className={`${styles.message} ${styles.userMessage}`}>
            <div className={styles.messageContent}>
              <Skeleton width="80%" height={40} variant="rounded" />
            </div>
          </div>
          
          {/* Another assistant message */}
          <div className={`${styles.message} ${styles.assistantMessage}`}>
            <Skeleton width={36} height={36} variant="circular" />
            <div className={styles.messageContent}>
              <SkeletonText lines={6} lineHeight={16} gap={8} />
            </div>
          </div>
        </div>

        <div className={styles.cta}>
          <Skeleton width="70%" height={20} variant="rounded" style={{ margin: '0 auto 16px' }} />
          <Skeleton width={140} height={48} variant="rounded" style={{ margin: '0 auto' }} />
        </div>
      </main>
    </div>
  );
}

// =============================================================================
// CITATION DISPLAY
// =============================================================================

function CitationBadge({ source, index }) {
  const label = source.title || source.name || `Source ${index + 1}`;
  const url = source.url || source.link;
  
  if (url) {
    return (
      <a 
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.citation}
        aria-label={`Source ${index + 1}: ${label}`}
      >
        [{index + 1}] {label}
      </a>
    );
  }
  
  return (
    <span className={styles.citation} aria-label={`Source ${index + 1}: ${label}`}>
      [{index + 1}] {label}
    </span>
  );
}

function Citations({ sources }) {
  if (!sources || sources.length === 0) return null;
  
  return (
    <div className={styles.citationsWrapper} aria-label="Sources">
      <span className={styles.citationsLabel}>Sources:</span>
      <div className={styles.citationsList}>
        {sources.map((source, i) => (
          <CitationBadge key={i} source={source} index={i} />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// FORMATTED MESSAGE
// =============================================================================

function FormattedMessage({ content, sources }) {
  if (!content) return null;
  
  const formatContent = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let listItems = [];
    let inList = false;
    
    const processInlineFormatting = (line) => {
      const parts = [];
      let remaining = line;
      let key = 0;
      
      while (remaining) {
        const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
        if (boldMatch) {
          const beforeBold = remaining.slice(0, boldMatch.index);
          if (beforeBold) parts.push(<span key={key++}>{beforeBold}</span>);
          parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
          remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
        } else {
          if (remaining) parts.push(<span key={key++}>{remaining}</span>);
          break;
        }
      }
      return parts.length > 0 ? parts : line;
    };
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('## ')) {
        if (inList && listItems.length > 0) {
          elements.push(<ul key={`list-${index}`} className={styles.messageList}>{listItems}</ul>);
          listItems = [];
          inList = false;
        }
        elements.push(
          <h3 key={index} className={styles.messageHeading}>
            {processInlineFormatting(trimmedLine.slice(3))}
          </h3>
        );
      } else if (trimmedLine.startsWith('- ')) {
        inList = true;
        listItems.push(
          <li key={index}>{processInlineFormatting(trimmedLine.slice(2))}</li>
        );
      } else if (trimmedLine) {
        if (inList && listItems.length > 0) {
          elements.push(<ul key={`list-${index}`} className={styles.messageList}>{listItems}</ul>);
          listItems = [];
          inList = false;
        }
        elements.push(
          <p key={index} className={styles.messageParagraph}>
            {processInlineFormatting(trimmedLine)}
          </p>
        );
      }
    });
    
    if (listItems.length > 0) {
      elements.push(<ul key="list-final" className={styles.messageList}>{listItems}</ul>);
    }
    
    return elements;
  };
  
  return (
    <div className={styles.formattedMessage}>
      {formatContent(content)}
      <Citations sources={sources} />
    </div>
  );
}

// =============================================================================
// SHARE BUTTONS
// =============================================================================

function ShareButtons({ url, title }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [url]);
  
  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: 'Check out this AL conversation from AutoRev',
          url: url,
        });
      } catch (err) {
        // User cancelled or error
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    }
  }, [title, url]);
  
  const handleTwitterShare = useCallback(() => {
    const tweetText = encodeURIComponent(`${title} - Check out this helpful car advice from AL!`);
    const tweetUrl = encodeURIComponent(url);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`, '_blank');
  }, [title, url]);
  
  return (
    <div className={styles.shareButtons}>
      <button 
        onClick={handleCopyLink}
        className={styles.shareButton}
        aria-label={copied ? 'Link copied!' : 'Copy link to clipboard'}
      >
        {copied ? '✓ Copied!' : 'Copy Link'}
      </button>
      
      {typeof navigator !== 'undefined' && navigator.share && (
        <button 
          onClick={handleNativeShare}
          className={styles.shareButton}
          aria-label="Share conversation"
        >
          Share
        </button>
      )}
      
      <button 
        onClick={handleTwitterShare}
        className={styles.shareButton}
        aria-label="Share on Twitter/X"
      >
        Tweet
      </button>
    </div>
  );
}

// =============================================================================
// ERROR STATE
// =============================================================================

function ErrorState({ error, onRetry }) {
  return (
    <div className={styles.container}>
      <div className={styles.errorState} role="alert" aria-live="assertive">
        <h1>Conversation Not Found</h1>
        <p>{error}</p>
        {onRetry && (
          <button onClick={onRetry} className={styles.retryButton} aria-label="Retry loading conversation">
            Try Again
          </button>
        )}
        <Link href="/" className={styles.homeLink}>
          Go to AutoRev
        </Link>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function SharedConversationPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  const fetchConversation = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/shared/al/${params.token}`);
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to load conversation');
        return;
      }
      
      setConversation(data.conversation);
      setMessages(data.messages);
    } catch (err) {
      setError('Failed to load conversation. Please check your connection and try again.');
      console.error('[SharedAL] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [params.token]);

  useEffect(() => {
    if (params.token) {
      fetchConversation();
    }
  }, [params.token, fetchConversation]);

  // Loading state - skeleton that matches content shape
  if (loading) {
    return <ConversationSkeleton />;
  }

  // Error state with retry option
  if (error) {
    return <ErrorState error={error} onRetry={fetchConversation} />;
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = conversation?.title || 'AL Conversation';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo} aria-label="AutoRev Home">
          <Image 
            src="/logo.svg" 
            alt="AutoRev" 
            width={120} 
            height={32}
          />
        </Link>
        <div className={styles.headerMeta}>
          <span className={styles.sharedBadge}>Shared Conversation</span>
        </div>
      </header>

      <main className={styles.main} role="main">
        <div className={styles.conversationHeader}>
          <h1 className={styles.title}>{conversation?.title || 'AL Conversation'}</h1>
          {conversation?.carName && (
            <p className={styles.carContext}>
              About: <strong>{conversation.carName}</strong>
            </p>
          )}
          <p className={styles.meta}>
            {formatDate(conversation?.createdAt)} • {messages.length} messages
          </p>
          <ShareButtons url={shareUrl} title={shareTitle} />
        </div>

        <div 
          className={styles.messages} 
          role="log" 
          aria-label="Conversation messages"
          aria-live="polite"
        >
          {messages.map((msg, i) => (
            <article 
              key={i} 
              className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.assistantMessage}`}
              aria-label={msg.role === 'user' ? 'Your question' : 'AL response'}
            >
              {msg.role === 'assistant' && (
                <Image 
                  src={UI_IMAGES.alMascotFull}
                  alt="AL"
                  width={36}
                  height={36}
                  className={styles.avatar}
                />
              )}
              <div className={styles.messageContent}>
                {msg.role === 'assistant' ? (
                  <FormattedMessage content={msg.content} sources={msg.sources} />
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </article>
          ))}
        </div>

        <section className={styles.cta} aria-labelledby="cta-heading">
          <h2 id="cta-heading" className={styles.ctaHeading}>
            Want answers like this for your car?
          </h2>
          <p className={styles.ctaText}>
            AL knows your specific vehicle and can help with maintenance, mods, and more.
          </p>
          <Link href="/join" className={styles.ctaBtn}>
            Try AL Free
          </Link>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>Powered by <Link href="/">AutoRev</Link> • The AI-Powered Automotive Platform</p>
      </footer>
    </div>
  );
}
