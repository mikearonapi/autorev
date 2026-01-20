'use client';

/**
 * AL Chat Page - Client Component
 * 
 * Dedicated page for the AL AI assistant.
 * Renders as a full page within the app shell (with bottom tab bar).
 * 
 * Features:
 * - Streaming responses
 * - Image/file attachments via ALAttachmentMenu
 * - User preferences via ALPreferencesPanel
 * - Receives prompts from AskALButton via sessionStorage
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
import ALPreferencesPanel, { useALPreferences } from '@/components/ALPreferencesPanel';
import ALAttachmentMenu, { ALAttachmentsBar } from '@/components/ALAttachmentMenu';
import { getPendingALPrompt } from '@/components/AskALButton';

// Simple markdown formatter for AL responses
const FormattedMessage = ({ content }) => {
  if (!content) return null;
  
  // Process the content into formatted elements
  const formatContent = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let listItems = [];
    let inList = false;
    
    const processInlineFormatting = (line) => {
      // Handle bold **text**
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
      
      // Handle headers
      if (trimmedLine.startsWith('## ')) {
        if (inList && listItems.length > 0) {
          elements.push(<ul key={`list-${index}`} className="alMessageList">{listItems}</ul>);
          listItems = [];
          inList = false;
        }
        elements.push(
          <h3 key={index} className="alMessageHeading">
            {processInlineFormatting(trimmedLine.slice(3))}
          </h3>
        );
      }
      // Handle list items
      else if (trimmedLine.startsWith('- ')) {
        inList = true;
        listItems.push(
          <li key={index}>{processInlineFormatting(trimmedLine.slice(2))}</li>
        );
      }
      // Handle regular paragraphs
      else if (trimmedLine) {
        if (inList && listItems.length > 0) {
          elements.push(<ul key={`list-${index}`} className="alMessageList">{listItems}</ul>);
          listItems = [];
          inList = false;
        }
        elements.push(
          <p key={index} className="alMessageParagraph">
            {processInlineFormatting(trimmedLine)}
          </p>
        );
      }
    });
    
    // Don't forget remaining list items
    if (listItems.length > 0) {
      elements.push(<ul key="list-final" className="alMessageList">{listItems}</ul>);
    }
    
    return elements;
  };
  
  return <div className="alFormattedMessage">{formatContent(content)}</div>;
};

// AL Mascot component - Teal ring for brand consistency
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
      border: '3px solid #10b981', // Brand teal
      boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
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
  attachment: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
    </svg>
  ),
  settings: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  camera: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  ),
};

// Suggested prompts for new users - no emojis, clean design
const SUGGESTED_PROMPTS = [
  { text: "What mods should I do first?" },
  { text: "Compare two cars for me" },
  { text: "Help me diagnose an issue" },
  { text: "What's the best oil for my car?" },
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
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  // Pending prompt from AskALButton navigation
  const [pendingPrompt, setPendingPrompt] = useState(null);
  
  // Attachment state
  const [attachments, setAttachments] = useState([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  
  // Preferences state
  const [showPreferences, setShowPreferences] = useState(false);
  const { preferences: alPreferences, updatePreferences } = useALPreferences();
  
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
    if (isAuthenticated && inputRef.current && !pendingPrompt) {
      inputRef.current.focus();
    }
  }, [isAuthenticated, pendingPrompt]);
  
  // Check for pending prompt from AskALButton navigation
  useEffect(() => {
    const pending = getPendingALPrompt();
    if (pending) {
      setPendingPrompt(pending);
    }
  }, []);
  
  // Auto-hide suggestions after 3 seconds
  useEffect(() => {
    if (messages.length === 0 && showSuggestions) {
      const timer = setTimeout(() => {
        setShowSuggestions(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [messages.length, showSuggestions]);
  
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
    setAttachments([]);
    setPendingPrompt(null);
    inputRef.current?.focus();
  }, []);
  
  // Handle sending pending prompt (from AskALButton navigation)
  const handleSendPendingPrompt = useCallback(() => {
    if (pendingPrompt) {
      const promptText = pendingPrompt.prompt;
      setPendingPrompt(null);
      sendMessage(promptText);
    }
  }, [pendingPrompt]);
  
  // Handle dismissing pending prompt
  const handleDismissPendingPrompt = useCallback(() => {
    setPendingPrompt(null);
    inputRef.current?.focus();
  }, []);
  
  // Handle attachment added
  const handleAttachmentAdd = useCallback((attachment) => {
    setAttachments(prev => [...prev, attachment]);
    setShowAttachmentMenu(false);
  }, []);
  
  // Handle attachment removed
  const handleAttachmentRemove = useCallback((attachmentId) => {
    setAttachments(prev => prev.filter(a => a.id !== attachmentId));
  }, []);
  
  // Send message
  const sendMessage = async (messageText = input) => {
    if (!messageText.trim() || isLoading) return;
    
    if (!isAuthenticated) {
      authModal.openSignIn();
      return;
    }
    
    const userMessage = messageText.trim();
    const messageAttachments = [...attachments]; // Capture current attachments
    setInput('');
    setError(null);
    setStreamingContent('');
    setAttachments([]); // Clear attachments after sending
    
    // Track analytics
    const isFirstMessage = messages.length === 0;
    trackEvent(isFirstMessage ? ANALYTICS_EVENTS.AL_CONVERSATION_STARTED : ANALYTICS_EVENTS.AL_QUESTION_ASKED, {
      carSlug: selectedCar?.slug,
      messageLength: userMessage.length,
      isFirstMessage,
      hasAttachments: messageAttachments.length > 0,
      attachmentCount: messageAttachments.length,
    });
    
    if (isFirstMessage) {
      trackALConversationStart(user?.id || 'anonymous', userMessage, selectedCar?.slug);
    }
    
    // Build user message with attachment indicators
    const newMessages = [...messages, { 
      role: 'user', 
      content: userMessage,
      attachments: messageAttachments, // Store attachments with message
    }];
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
          attachments: messageAttachments.map(a => ({
            public_url: a.public_url,
            file_type: a.file_type,
            file_name: a.file_name,
            analysis_context: a.source,
          })),
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
                  <div className={styles.conversationContent}>
                    <span className={styles.conversationTitle}>{conv.title || 'New conversation'}</span>
                    {conv.preview && (
                      <span className={styles.conversationPreview}>{conv.preview}</span>
                    )}
                  </div>
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
        
        <div className={styles.headerRight}>
          <button 
            className={styles.settingsBtn}
            onClick={() => setShowPreferences(!showPreferences)}
            title="AL preferences"
          >
            <Icons.settings size={20} />
          </button>
          
          <button 
            className={styles.newChatHeaderBtn}
            onClick={startNewChat}
            title="New chat"
          >
            <Icons.newChat size={20} />
          </button>
        </div>
      </div>
      
      {/* Preferences Panel */}
      {showPreferences && (
        <div className={styles.preferencesOverlay}>
          <ALPreferencesPanel
            isOpen={showPreferences}
            onClose={() => setShowPreferences(false)}
            userTier={user?.tier || 'free'}
            onPreferencesChange={updatePreferences}
          />
        </div>
      )}
      
      {/* Messages Area */}
      <div className={styles.messagesArea}>
        {messages.length === 0 && !streamingContent ? (
          // Empty state with suggestions OR pending prompt
          <div className={styles.emptyState}>
            {pendingPrompt ? (
              // Pending prompt confirmation card
              <div className={styles.pendingPromptCard}>
                <ALMascot size={64} />
                {pendingPrompt.context?.carName && (
                  <span className={styles.pendingPromptCar}>
                    {pendingPrompt.context.carName}
                  </span>
                )}
                <p className={styles.pendingPromptText}>
                  {pendingPrompt.displayMessage}
                </p>
                <div className={styles.pendingPromptActions}>
                  <button
                    className={styles.pendingPromptSend}
                    onClick={handleSendPendingPrompt}
                  >
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <path d="M12 19V5M5 12L12 5L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    SEND
                  </button>
                  <button
                    className={styles.pendingPromptDismiss}
                    onClick={handleDismissPendingPrompt}
                    aria-label="Dismiss"
                  >
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              // Standard empty state
              <div className={styles.emptyStateContent}>
                <ALMascot size={80} />
                <h2 className={styles.emptyTitle}>How can I help?</h2>
                <p className={styles.emptySubtitle}>
                  {selectedCar ? `Ask me anything about your ${selectedCar.name}` : 'Ask me anything about cars'}
                </p>
                
                <div className={`${styles.suggestions} ${!showSuggestions ? styles.suggestionsHidden : ''}`}>
                  {SUGGESTED_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      className={styles.suggestionBtn}
                      onClick={() => sendMessage(prompt.text)}
                    >
                      {prompt.text}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
                  {/* Show attachment thumbnails for user messages */}
                  {msg.role === 'user' && msg.attachments?.length > 0 && (
                    <div className={styles.messageAttachments}>
                      {msg.attachments.map((att, idx) => (
                        att.file_type?.startsWith('image/') ? (
                          <img 
                            key={idx}
                            src={att.public_url}
                            alt={att.file_name}
                            className={styles.attachmentThumbnail}
                          />
                        ) : (
                          <div key={idx} className={styles.attachmentDoc}>
                            📄 {att.file_name}
                          </div>
                        )
                      ))}
                    </div>
                  )}
                  {msg.role === 'assistant' ? (
                    <FormattedMessage content={msg.content} />
                  ) : (
                    msg.content
                  )}
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
                  <FormattedMessage content={streamingContent} />
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
                  <span className={styles.thinking}>Thinking...</span>
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
      
      {/* Attachments Bar (above input) */}
      {attachments.length > 0 && (
        <ALAttachmentsBar
          attachments={attachments}
          onRemove={handleAttachmentRemove}
          onAddClick={() => setShowAttachmentMenu(true)}
          maxAttachments={5}
        />
      )}
      
      {/* Input Area */}
      <div className={styles.inputArea}>
        <div className={styles.inputWrapper}>
          {/* Attachment Button */}
          <div className={styles.attachmentBtnWrapper}>
            <button
              className={styles.attachmentBtn}
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              title="Add photo or file"
              aria-label="Add attachment"
            >
              <Icons.camera size={18} />
            </button>
            
            {/* Attachment Menu */}
            {showAttachmentMenu && (
              <div className={styles.attachmentMenuWrapper}>
                <ALAttachmentMenu
                  isOpen={showAttachmentMenu}
                  onClose={() => setShowAttachmentMenu(false)}
                  onAttachmentAdd={handleAttachmentAdd}
                  currentAttachments={attachments}
                  maxAttachments={5}
                />
              </div>
            )}
          </div>
          
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
            disabled={(!input.trim() && attachments.length === 0) || isLoading}
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
