'use client';

/**
 * AL Chat Page - Client Component
 * 
 * Dedicated page for the AL AI assistant.
 * Renders as a full page within the app shell (with bottom tab bar).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCarSelection } from '@/components/providers/CarSelectionProvider';
import AuthModal, { useAuthModal } from '@/components/AuthModal';
import { UI_IMAGES } from '@/lib/images';
import { 
  loadALPreferences, 
  saveALPreferences, 
  loadALBookmarks,
  addKnownCar
} from '@/lib/stores/alPreferencesStore';
import { useAnalytics, ANALYTICS_EVENTS } from '@/hooks/useAnalytics';
import { trackALConversationStart } from '@/lib/ga4';
import LoadingSpinner from '@/components/LoadingSpinner';

// AL Mascot component
const ALMascot = ({ size = 80 }) => (
  <img 
    src={UI_IMAGES.alMascotFull}
    alt="AL - AutoRev AI"
    width={size} 
    height={size}
    style={{ 
      width: size, 
      height: size, 
      borderRadius: '50%',
      objectFit: 'cover',
      border: '3px solid #d4a04a',
      boxShadow: '0 4px 20px rgba(212, 160, 74, 0.3)',
    }}
  />
);

// Simple icons
const Icons = {
  send: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  arrowUp: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 19V5M5 12L12 5L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  newChat: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  history: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  sparkles: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10l1.4 1.4M5.6 18.4l1.4-1.4m10-10l1.4-1.4"/>
      <circle cx="12" cy="12" r="4"/>
    </svg>
  ),
};

// Suggested prompts for new users
const SUGGESTED_PROMPTS = [
  { text: "What mods should I do first?", icon: "🔧" },
  { text: "Compare two cars for me", icon: "⚖️" },
  { text: "Help me diagnose an issue", icon: "🔍" },
  { text: "What's the best oil for my car?", icon: "🛢️" },
];

export default function ALPageClient() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);
  
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { selectedCar } = useCarSelection();
  const authModal = useAuthModal();
  const { trackEvent } = useAnalytics();
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);
  
  // Focus input on mount
  useEffect(() => {
    if (isAuthenticated && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAuthenticated]);
  
  // Load conversation history
  const loadConversations = useCallback(async () => {
    if (!user?.id) return;
    
    setConversationsLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}/al-conversations?limit=20`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setConversationsLoading(false);
    }
  }, [user?.id]);
  
  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated, loadConversations]);
  
  // Load a specific conversation
  const loadConversation = useCallback(async (conversationId) => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/users/${user.id}/al-conversations/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages?.map(msg => ({
          role: msg.role,
          content: msg.content,
        })) || []);
        setCurrentConversationId(conversationId);
        setShowHistory(false);
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  }, [user?.id]);
  
  // Start new chat
  const startNewChat = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
    setShowHistory(false);
    setInput('');
    inputRef.current?.focus();
  }, []);
  
  // Send message
  const sendMessage = async (messageText = input) => {
    if (!messageText.trim() || isLoading) return;
    
    if (!isAuthenticated) {
      authModal.openSignIn();
      return;
    }
    
    const userMessage = messageText.trim();
    setInput('');
    setError(null);
    setStreamingContent('');
    
    // Track analytics
    const isFirstMessage = messages.length === 0;
    trackEvent(isFirstMessage ? ANALYTICS_EVENTS.AL_CONVERSATION_STARTED : ANALYTICS_EVENTS.AL_QUESTION_ASKED, {
      carSlug: selectedCar?.slug,
      messageLength: userMessage.length,
      isFirstMessage
    });
    
    if (isFirstMessage) {
      trackALConversationStart(user?.id || 'anonymous', userMessage, selectedCar?.slug);
    }
    
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);
    
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch('/api/ai-mechanic?stream=true', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          message: userMessage,
          carSlug: selectedCar?.slug,
          userId: user?.id,
          conversationId: currentConversationId,
          history: messages.slice(-6),
        }),
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');
      
      const decoder = new TextDecoder();
      let fullContent = '';
      let newConversationId = currentConversationId;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.conversationId) {
                newConversationId = data.conversationId;
              }
              
              if (data.content) {
                fullContent += data.content;
                setStreamingContent(fullContent);
              }
              
              if (data.done) {
                setMessages([...newMessages, { role: 'assistant', content: fullContent }]);
                setStreamingContent('');
                setCurrentConversationId(newConversationId);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('Sorry, something went wrong. Please try again.');
        console.error('AL error:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format date for conversation list
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  // Not authenticated - show sign in prompt
  if (!authLoading && !isAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.signInPrompt}>
          <ALMascot size={100} />
          <h1 className={styles.title}>Meet AL</h1>
          <p className={styles.subtitle}>Your AutoRev AI Assistant</p>
          <p className={styles.description}>
            Get personalized car recommendations, learn about modifications, 
            compare models, and get expert automotive advice.
          </p>
          <button className={styles.signInBtn} onClick={() => authModal.openSignIn()}>
            Sign In to Chat with AL
          </button>
        </div>
        <AuthModal 
          isOpen={authModal.isOpen} 
          onClose={authModal.close}
          defaultMode={authModal.defaultMode}
        />
      </div>
    );
  }
  
  // Loading auth
  if (authLoading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner 
          variant="branded" 
          text="Loading AL" 
          subtext="Connecting to your AI assistant..."
          fullPage 
        />
      </div>
    );
  }
  
  // History view
  if (showHistory) {
    return (
      <div className={styles.container}>
        <div className={styles.historyView}>
          <div className={styles.historyHeader}>
            <Icons.history size={18} />
            <span>HISTORY</span>
            <button 
              className={styles.closeHistoryBtn}
              onClick={() => setShowHistory(false)}
            >
              ✕
            </button>
          </div>
          
          <button className={styles.newChatBtn} onClick={startNewChat}>
            <Icons.newChat size={18} />
            New Chat
          </button>
          
          <div className={styles.conversationsList}>
            {conversationsLoading ? (
              <div className={styles.loadingConversations}>Loading...</div>
            ) : conversations.length === 0 ? (
              <div className={styles.noConversations}>
                <p>No conversations yet</p>
                <p className={styles.noConversationsHint}>Start chatting with AL!</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  className={`${styles.conversationItem} ${conv.id === currentConversationId ? styles.conversationItemActive : ''}`}
                  onClick={() => loadConversation(conv.id)}
                >
                  <span className={styles.conversationTitle}>{conv.title || 'New conversation'}</span>
                  <span className={styles.conversationDate}>{formatDate(conv.created_at)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Main chat view
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button 
          className={styles.historyBtn}
          onClick={() => {
            loadConversations();
            setShowHistory(true);
          }}
          title="Chat history"
        >
          <Icons.history size={20} />
        </button>
        
        <div className={styles.headerCenter}>
          <img 
            src={UI_IMAGES.alMascotFull}
            alt="AL"
            className={styles.headerAvatar}
          />
          <span className={styles.headerTitle}>AL</span>
        </div>
        
        <button 
          className={styles.newChatHeaderBtn}
          onClick={startNewChat}
          title="New chat"
        >
          <Icons.newChat size={20} />
        </button>
      </div>
      
      {/* Messages Area */}
      <div className={styles.messagesArea}>
        {messages.length === 0 && !streamingContent ? (
          // Empty state with suggestions
          <div className={styles.emptyState}>
            <ALMascot size={80} />
            <h2 className={styles.emptyTitle}>How can I help?</h2>
            <p className={styles.emptySubtitle}>
              {selectedCar ? `Ask me anything about your ${selectedCar.name}` : 'Ask me anything about cars'}
            </p>
            
            <div className={styles.suggestions}>
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  className={styles.suggestionBtn}
                  onClick={() => sendMessage(prompt.text)}
                >
                  <span className={styles.suggestionIcon}>{prompt.icon}</span>
                  {prompt.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Messages
          <div className={styles.messages}>
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.assistantMessage}`}
              >
                {msg.role === 'assistant' && (
                  <img 
                    src={UI_IMAGES.alMascotFull}
                    alt="AL"
                    className={styles.messageAvatar}
                  />
                )}
                <div className={styles.messageContent}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {streamingContent && (
              <div className={`${styles.message} ${styles.assistantMessage}`}>
                <img 
                  src={UI_IMAGES.alMascotFull}
                  alt="AL"
                  className={styles.messageAvatar}
                />
                <div className={styles.messageContent}>
                  {streamingContent}
                  <span className={styles.cursor}>▊</span>
                </div>
              </div>
            )}
            
            {isLoading && !streamingContent && (
              <div className={`${styles.message} ${styles.assistantMessage}`}>
                <img 
                  src={UI_IMAGES.alMascotFull}
                  alt="AL"
                  className={styles.messageAvatar}
                />
                <div className={styles.messageContent}>
                  <span className={styles.typing}>Thinking...</span>
                </div>
              </div>
            )}
            
            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Input Area */}
      <div className={styles.inputArea}>
        <div className={styles.inputWrapper}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={selectedCar ? `Ask about ${selectedCar.name}...` : "Ask AL anything..."}
            className={styles.input}
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className={styles.sendBtn}
            aria-label="Send"
          >
            <Icons.arrowUp size={18} />
          </button>
        </div>
      </div>
      
      <AuthModal 
        isOpen={authModal.isOpen} 
        onClose={authModal.close}
        defaultMode={authModal.defaultMode}
      />
    </div>
  );
}
