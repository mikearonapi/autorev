'use client';

/**
 * Shared AL Conversation View
 * 
 * Public, read-only view of a shared AL conversation.
 * No authentication required.
 */

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';
import { UI_IMAGES } from '@/lib/images';
import LoadingSpinner from '@/components/LoadingSpinner';

// Simple markdown formatter for AL responses
const FormattedMessage = ({ content }) => {
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
  
  return <div className={styles.formattedMessage}>{formatContent(content)}</div>;
};

export default function SharedConversationPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const fetchConversation = async () => {
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
        setError('Failed to load conversation');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (params.token) {
      fetchConversation();
    }
  }, [params.token]);

  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner 
          variant="branded" 
          text="Loading conversation" 
          fullPage 
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <h1>Conversation Not Found</h1>
          <p>{error}</p>
          <Link href="/" className={styles.homeLink}>
            Go to AutoRev
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
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

      <main className={styles.main}>
        <div className={styles.conversationHeader}>
          <h1 className={styles.title}>{conversation?.title || 'AL Conversation'}</h1>
          <p className={styles.meta}>
            {formatDate(conversation?.createdAt)} • {messages.length} messages
          </p>
        </div>

        <div className={styles.messages}>
          {messages.map((msg, i) => (
            <div 
              key={i} 
              className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.assistantMessage}`}
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
                  <FormattedMessage content={msg.content} />
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.cta}>
          <p>Want your own AI-powered automotive assistant?</p>
          <Link href="/join" className={styles.ctaBtn}>
            Try AL Free
          </Link>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>Powered by <Link href="/">AutoRev</Link> • The AI-Powered Automotive Platform</p>
      </footer>
    </div>
  );
}
