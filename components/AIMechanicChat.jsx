'use client';

/**
 * AIMechanicChat Component
 * 
 * Premium AI assistant for AutoRev - inspired by ChatGPT/Claude simplicity.
 * Context-aware help across all pages.
 */

import { useState, useEffect, useRef, useCallback, createContext, useContext, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './AIMechanicChat.module.css';
import { useAuth } from './providers/AuthProvider';
import { useCarSelection } from './providers/CarSelectionProvider';
import AuthModal, { useAuthModal } from './AuthModal';

/**
 * Hook for responsive screen size detection
 * Returns breakpoint information for adaptive UI
 */
function useResponsiveSize() {
  const [screenSize, setScreenSize] = useState({
    isMobile: false,
    isSmallMobile: false,
    isTablet: false,
  });
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkSize = () => {
      const width = window.innerWidth;
      setScreenSize({
        isMobile: width <= 480,
        isSmallMobile: width <= 375,
        isTablet: width > 480 && width <= 1024,
      });
    };
    
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);
  
  return screenSize;
}

// Context for controlling chat from anywhere
const AIChatContext = createContext({
  isOpen: false,
  openChat: () => {},
  closeChat: () => {},
  toggleChat: () => {},
});

export function useAIChat() {
  return useContext(AIChatContext);
}

// Page-specific context configurations
const PAGE_CONTEXT_CONFIG = {
  'browse': {
    title: 'Browse Cars',
    welcome: "Looking for something specific? I can help you explore our collection, compare models, or find cars that match your criteria.",
    placeholder: "What kind of car are you looking for?",
    suggestions: [
      "Best track cars under $60k",
      "Compare AWD vs RWD sports cars",
      "Most reliable daily drivers",
      "Cars with manual transmissions"
    ]
  },
  'car-selector': {
    title: 'Find Your Match',
    welcome: "I'll help you narrow down your perfect sports car. Ask me about differences between models, what to expect from each, or trade-offs to consider.",
    placeholder: "Ask about any car or comparison...",
    suggestions: [
      "Cayman vs 911 – which is better?",
      "Best M car for daily driving",
      "Explain Mustang GT vs Mach 1",
      "What makes a good first sports car?"
    ]
  },
  'car-detail': {
    title: 'Car Expert',
    welcome: "I can tell you everything about this car – common issues, best years, how it compares, and what to look for when buying.",
    placeholder: "What would you like to know?",
    suggestions: [
      "Common issues to watch for",
      "How does this compare to rivals?",
      "Best model year to buy",
      "Is this good for track days?"
    ]
  },
  'tuning': {
    title: 'Tuning Advisor',
    welcome: "Planning modifications? I can help you understand what mods to prioritize, their effects, and the best order to install them.",
    placeholder: "Ask about mods or tuning...",
    suggestions: [
      "Best first mods for power",
      "Do I need supporting mods?",
      "Intake vs exhaust – which first?",
      "What's the best tune for my car?"
    ]
  },
  'garage': {
    title: 'Your Assistant',
    welcome: "I'm here to help with your collection. Ask about maintenance schedules, troubleshooting, or planning your next build.",
    placeholder: "How can I help with your cars?",
    suggestions: [
      "Maintenance at 30k miles",
      "Help diagnose an issue",
      "Recommend mods for my car",
      "Best oil and fluids to use"
    ]
  },
  'encyclopedia': {
    title: 'Learn Mods',
    welcome: "Curious how modifications work? I can explain the technical details, what each upgrade does, and help you understand the science.",
    placeholder: "What would you like to learn?",
    suggestions: [
      "How does turbo work?",
      "Coilovers vs lowering springs",
      "What does an ECU tune change?",
      "How headers improve power"
    ]
  },
  'general': {
    title: 'AutoRev AI',
    welcome: "I'm your automotive AI assistant. Ask me anything about cars, modifications, maintenance, or help finding your next ride.",
    placeholder: "Ask me anything about cars...",
    suggestions: [
      "Help me find a sports car",
      "Best beginner modifications",
      "Explain forced induction",
      "Manual vs automatic for track"
    ]
  }
};

// AL Mascot Avatar - The AutoRev AI Assistant
const ALMascot = ({ size = 24, className = '' }) => (
  <img 
    src="/images/al-mascot.png" 
    alt="AL - AutoRev AI"
    width={size} 
    height={size}
    className={`${styles.alMascot} ${className}`}
    style={{ 
      width: size, 
      height: size, 
      borderRadius: '50%',
      objectFit: 'cover',
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
  x: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  newChat: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  arrowUp: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 19V5M5 12L12 5L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  expand: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
    </svg>
  ),
  collapse: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/>
    </svg>
  ),
  history: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
      <path d="M3 3v5h5"/>
      <path d="M12 7v5l4 2"/>
    </svg>
  ),
  messageSquare: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  sparkle: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z"/>
    </svg>
  ),
  user: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
};

/**
 * Format AI response with markdown
 */
function formatResponse(text) {
  if (!text) return '';
  
  const escapeHtml = (s) => String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  // Escape first to avoid injecting arbitrary HTML via model output.
  let formatted = escapeHtml(text);

  // Simple markdown-ish formatting
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/^• /gm, '<span class="bullet">•</span> ');
  formatted = formatted.replace(/^- /gm, '<span class="bullet">•</span> ');

  // Turn enforced citations into clickable links.
  // Expected: (Source: https://example.com/...)
  formatted = formatted.replace(
    /\(Source:\s*(https?:\/\/[^\s)]+)\)/gi,
    (_m, url) => `(<a class="sourceLink" href="${url}" target="_blank" rel="noopener noreferrer">Source</a>)`
  );

  formatted = formatted.replace(/\n\n/g, '</p><p>');
  formatted = formatted.replace(/\n/g, '<br/>');
  
  return `<p>${formatted}</p>`;
}

// LocalStorage key for intro preference
const AL_INTRO_STORAGE_KEY = 'autorev_al_intro_seen';

/**
 * Main AIMechanicChat Component
 */
export default function AIMechanicChat({ showFloatingButton = false, externalOpen, onOpenChange }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);
  
  // Intro screen state
  const [showIntro, setShowIntro] = useState(true);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  
  // Expanded view state
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Conversation history state (for expanded mode)
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  
  // Wiggle animation state (like FeedbackCorner)
  const [isWiggling, setIsWiggling] = useState(false);
  
  // Auth modal
  const authModal = useAuthModal();
  
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = (value) => {
    if (onOpenChange) onOpenChange(value);
    setInternalOpen(value);
  };
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const pathname = usePathname();
  
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { selectedCar } = useCarSelection();
  
  // Responsive sizing
  const { isMobile, isSmallMobile, isTablet } = useResponsiveSize();
  
  // Calculate responsive mascot sizes
  const introMascotSize = useMemo(() => {
    if (isSmallMobile) return 100;
    if (isMobile) return 120;
    if (isTablet) return 140;
    return 160;
  }, [isMobile, isSmallMobile, isTablet]);
  
  const signInMascotSize = useMemo(() => {
    if (isSmallMobile) return 80;
    if (isMobile) return 100;
    if (isTablet) return 110;
    return 120;
  }, [isMobile, isSmallMobile, isTablet]);
  
  // Check localStorage on mount to see if user has seen intro
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const seen = localStorage.getItem(AL_INTRO_STORAGE_KEY);
      if (seen === 'true') {
        setHasSeenIntro(true);
        setShowIntro(false);
      }
    }
  }, []);
  
  // Wiggle animation effect (like FeedbackCorner) - only when button is visible
  useEffect(() => {
    if (!showFloatingButton || internalOpen) return;
    
    const triggerWiggle = () => {
      setIsWiggling(true);
      setTimeout(() => setIsWiggling(false), 1000);
    };
    
    // Initial wiggle after 8 seconds (slightly offset from feedback button)
    const initialTimeout = setTimeout(triggerWiggle, 8000);
    
    // Then wiggle at random intervals (18-24 seconds)
    const interval = setInterval(() => {
      const randomDelay = Math.random() * 6000;
      setTimeout(triggerWiggle, randomDelay);
    }, 20000);
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [showFloatingButton, internalOpen]);
  
  // Determine page context
  const getPageContext = useCallback(() => {
    if (pathname.includes('/garage')) return 'garage';
    if (pathname.includes('/tuning-shop') || pathname.includes('/mod-planner')) return 'tuning';
    if (pathname.includes('/car-selector')) return 'car-selector';
    if (pathname.includes('/browse-cars/') && pathname !== '/browse-cars') return 'car-detail';
    if (pathname.includes('/browse')) return 'browse';
    if (pathname.includes('/encyclopedia')) return 'encyclopedia';
    return 'general';
  }, [pathname]);
  
  const contextConfig = PAGE_CONTEXT_CONFIG[getPageContext()] || PAGE_CONTEXT_CONFIG.general;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !showIntro) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, showIntro]);

  useEffect(() => {
    if (isOpen && messages.length === 0 && !showIntro) {
      setSuggestions(contextConfig.suggestions || []);
    }
  }, [isOpen, pathname, contextConfig.suggestions, messages.length, showIntro]);
  
  // Fetch conversation history when expanded and authenticated
  useEffect(() => {
    const fetchConversations = async () => {
      if (!isAuthenticated || !user?.id || !isExpanded) return;
      
      setConversationsLoading(true);
      try {
        const response = await fetch(`/api/users/${user.id}/al-conversations?limit=20`);
        if (response.ok) {
          const data = await response.json();
          setConversations(data.conversations || []);
        }
      } catch (err) {
        console.warn('[AL Chat] Could not fetch conversations:', err);
      } finally {
        setConversationsLoading(false);
      }
    };
    
    if (isExpanded && isAuthenticated) {
      fetchConversations();
    }
  }, [isExpanded, isAuthenticated, user?.id]);
  
  // Load a specific conversation
  const loadConversation = useCallback(async (convId) => {
    if (!user?.id || !convId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}/al-conversations/${convId}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentConversationId(convId);
        setMessages(data.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })));
        setSuggestions([]);
      }
    } catch (err) {
      console.error('[AL Chat] Error loading conversation:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);
  
  // Start a new conversation
  const startNewConversation = useCallback(() => {
    setCurrentConversationId(null);
    setMessages([]);
    setSuggestions(contextConfig.suggestions || []);
    setError(null);
  }, [contextConfig.suggestions]);
  
  // Handle "Get Started" button
  const handleGetStarted = () => {
    if (dontShowAgain) {
      localStorage.setItem(AL_INTRO_STORAGE_KEY, 'true');
      setHasSeenIntro(true);
    }
    setShowIntro(false);
    setSuggestions(contextConfig.suggestions || []);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMessage = async (messageText = input) => {
    if (!messageText.trim() || isLoading) return;
    
    const userMessage = messageText.trim();
    setInput('');
    setError(null);
    setSuggestions([]);
    
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/ai-mechanic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          carSlug: selectedCar?.slug,
          userId: user?.id,
          currentPage: pathname,
          context: getPageContext(),
          conversationId: currentConversationId,
          history: messages.slice(-6),
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.fallbackResponse || data.error);
      }
      
      // Update conversation ID if a new one was created
      if (data.conversationId && !currentConversationId) {
        setCurrentConversationId(data.conversationId);
      }
      
      setMessages([...newMessages, { role: 'assistant', content: data.response }]);
      
    } catch (err) {
      console.error('[AI] Error:', err);
      setError(err.message || 'Failed to get response. Please try again.');
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setSuggestions(contextConfig.suggestions || []);
    setError(null);
  };
  
  // Format relative time for conversation history
  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Determine if we should show intro (only if never seen before)
  const shouldShowIntro = showIntro && !hasSeenIntro;
  
  // Check if user needs to sign in (show after intro is dismissed)
  const needsAuth = !authLoading && !isAuthenticated;
  
  // Show sign-in screen: after intro is dismissed AND user is not authenticated
  const showSignIn = !shouldShowIntro && needsAuth;

  return (
    <>
      {showFloatingButton && (
        <button
          className={`${styles.floatingButton} ${isOpen ? styles.hidden : ''} ${isWiggling ? styles.wiggle : ''}`}
          onClick={() => setIsOpen(true)}
          aria-label="Chat with AI AL"
        >
          <span className={styles.glowRing}></span>
          <ALMascot size={44} className={styles.floatingIcon} />
          <span className={styles.tooltip}>Chat with AI AL</span>
        </button>
      )}

      {isOpen && (
        <div className={`${styles.chatPanel} ${isExpanded ? styles.chatPanelExpanded : ''}`}>
          {shouldShowIntro ? (
            /* ===== AL INTRO SCREEN ===== */
            <div className={styles.introScreen}>
              <button 
                onClick={() => setIsOpen(false)} 
                className={styles.introCloseBtn}
                aria-label="Close"
              >
                <Icons.x size={20} />
              </button>
              
              <div className={styles.introContent}>
                <div className={styles.introMascot}>
                  <ALMascot size={introMascotSize} className={styles.introMascotImg} />
                </div>
                
                <h2 className={styles.introTitle}>
                  Meet AL, Your<br />
                  <span className={styles.introTitleAccent}>AutoRev AI</span>
                </h2>
                
                <p className={styles.introDescription}>
                  Get personalized car recommendations, learn about modifications, 
                  compare models, and get expert automotive advice — all powered by AI.
                </p>
                
                <button 
                  className={styles.introStartBtn}
                  onClick={handleGetStarted}
                >
                  Get Started
                </button>
                
                <label className={styles.introCheckbox}>
                  <input 
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                  />
                  <span className={styles.checkboxMark}></span>
                  <span className={styles.checkboxLabel}>Don't show this again</span>
                </label>
              </div>
            </div>
          ) : showSignIn ? (
            /* ===== SIGN IN REQUIRED SCREEN ===== */
            <div className={styles.signInScreen}>
              <button 
                onClick={() => setIsOpen(false)} 
                className={styles.introCloseBtn}
                aria-label="Close"
              >
                <Icons.x size={20} />
              </button>
              
              <div className={styles.signInContent}>
                <div className={styles.introMascot}>
                  <ALMascot size={signInMascotSize} className={styles.introMascotImg} />
                </div>
                
                <h2 className={styles.signInTitle}>
                  Sign In to Chat with AL
                </h2>
                
                <p className={styles.signInDescription}>
                  To start chatting with AL, please sign in or create a free account.
                </p>
                
                <button 
                  className={styles.signInBtn}
                  onClick={() => authModal.openSignIn()}
                >
                  <Icons.user size={18} />
                  Sign In
                </button>
                
                <p className={styles.signInDivider}>or</p>
                
                <Link href="/join" className={styles.joinLink}>
                  Create a Free Account
                </Link>
                
                <p className={styles.signInNote}>
                  Free members get ~15-25 AL conversations/month
                </p>
              </div>
            </div>
          ) : (
            /* ===== CHAT INTERFACE ===== */
            <>
              {/* Header */}
              <div className={styles.header}>
                <div className={styles.headerLeft}>
                  <div className={styles.headerIcon}>
                    <ALMascot size={28} />
                  </div>
                  <span className={styles.headerTitle}>Chat with AL</span>
                </div>
                <div className={styles.headerActions}>
                  {messages.length > 0 && (
                    <button 
                      onClick={clearChat} 
                      className={styles.headerBtn}
                      aria-label="New chat"
                    >
                      <Icons.newChat size={16} />
                    </button>
                  )}
                  <button 
                    onClick={() => setIsExpanded(!isExpanded)} 
                    className={styles.headerBtn}
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                    title={isExpanded ? "Collapse" : "Expand"}
                  >
                    {isExpanded ? <Icons.collapse size={16} /> : <Icons.expand size={16} />}
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)} 
                    className={styles.headerBtn}
                    aria-label="Close"
                  >
                    <Icons.x size={18} />
                  </button>
                </div>
              </div>

              {/* Main Content - with sidebar in expanded mode */}
              <div className={`${styles.chatContent} ${isExpanded ? styles.chatContentExpanded : ''}`}>
                {/* Conversation History Sidebar - only visible in expanded mode */}
                {isExpanded && (
                  <div className={styles.historySidebar}>
                    <div className={styles.historySidebarHeader}>
                      <Icons.history size={16} />
                      <span>History</span>
                    </div>
                    <button 
                      className={styles.newConversationBtn}
                      onClick={startNewConversation}
                    >
                      <Icons.newChat size={14} />
                      <span>New Chat</span>
                    </button>
                    <div className={styles.conversationsList}>
                      {conversationsLoading ? (
                        <div className={styles.loadingConversations}>
                          <div className={styles.typing}>
                            <span></span><span></span><span></span>
                          </div>
                        </div>
                      ) : conversations.length === 0 ? (
                        <div className={styles.noConversations}>
                          <Icons.messageSquare size={24} />
                          <p>No previous chats</p>
                        </div>
                      ) : (
                        conversations.map(conv => (
                          <button
                            key={conv.id}
                            className={`${styles.conversationItem} ${conv.id === currentConversationId ? styles.conversationItemActive : ''}`}
                            onClick={() => loadConversation(conv.id)}
                          >
                            <span className={styles.conversationTitle}>
                              {conv.title || 'Untitled conversation'}
                            </span>
                            <span className={styles.conversationMeta}>
                              {formatRelativeTime(conv.last_message_at)}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
                
                {/* Messages Area */}
                <div className={styles.messagesArea}>
                {messages.length === 0 ? (
                  <div className={styles.welcomeSimple}>
                    {suggestions.length > 0 && (
                      <div className={styles.suggestionsTop}>
                        <p className={styles.suggestionsLabel}>Ask AL about:</p>
                        {suggestions.map((suggestion, i) => (
                          <button
                            key={i}
                            className={styles.suggestionBtn}
                            onClick={() => sendMessage(suggestion)}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.messages}>
                    {messages.map((msg, i) => (
                      <div 
                        key={i} 
                        className={`${styles.message} ${styles[msg.role]}`}
                      >
                        {msg.role === 'assistant' && (
                          <div className={styles.messageIcon}>
                            <ALMascot size={28} />
                          </div>
                        )}
                        <div 
                          className={styles.messageContent}
                          dangerouslySetInnerHTML={
                            msg.role === 'assistant' 
                              ? { __html: formatResponse(msg.content) }
                              : undefined
                          }
                        >
                          {msg.role === 'user' ? msg.content : null}
                        </div>
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className={`${styles.message} ${styles.assistant}`}>
                        <div className={styles.messageIcon}>
                          <ALMascot size={28} className={styles.loadingIcon} />
                        </div>
                        <div className={styles.messageContent}>
                          <div className={styles.typing}>
                            <span></span><span></span><span></span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {error && (
                      <div className={styles.errorMessage}>{error}</div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                )}
                </div>
              </div>

              {/* Input Area */}
              <div className={styles.inputArea}>
                <div className={styles.inputWrapper}>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={contextConfig.placeholder}
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
            </>
          )}
        </div>
      )}
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModal.isOpen} 
        onClose={authModal.close} 
        defaultMode={authModal.defaultMode}
      />
    </>
  );
}

/**
 * AI Mechanic Provider
 * Shows floating button in bottom right corner
 */
export function AIMechanicProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const value = {
    isOpen,
    openChat: () => setIsOpen(true),
    closeChat: () => setIsOpen(false),
    toggleChat: () => setIsOpen(prev => !prev),
  };
  
  return (
    <AIChatContext.Provider value={value}>
      {children}
      <AIMechanicChat 
        externalOpen={isOpen} 
        onOpenChange={setIsOpen}
        showFloatingButton={true}
      />
    </AIChatContext.Provider>
  );
}

/**
 * AI Header Button - With glow effect
 */
export function AIMechanicHeaderButton({ className = '' }) {
  const { toggleChat, isOpen } = useAIChat();
  
  return (
    <button
      className={`${styles.headerButton} ${isOpen ? styles.headerButtonActive : ''} ${className}`}
      onClick={toggleChat}
      aria-label="Ask AL - AI Assistant"
      data-tooltip="Ask AL"
    >
      <ALMascot size={36} className={styles.headerButtonIcon} />
      <span className={styles.pulseRing}></span>
    </button>
  );
}
