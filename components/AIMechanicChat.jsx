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
import { useCompare } from './providers/CompareProvider';
import AuthModal, { useAuthModal } from './AuthModal';
import { carData } from '@/data/cars.js';
import { 
  loadALPreferences, 
  saveALPreferences, 
  saveALBookmark, 
  removeALBookmark, 
  loadALBookmarks,
  isBookmarked as checkIsBookmarked,
  getBookmarkByContent,
  addKnownCar
} from '../lib/stores/alPreferencesStore';

/**
 * Hook for responsive screen size detection
 * Returns breakpoint information for adaptive UI including viewport height
 */
function useResponsiveSize() {
  const [screenSize, setScreenSize] = useState({
    isMobile: false,
    isSmallMobile: false,
    isTablet: false,
    isShortViewport: false,
    isVeryShortViewport: false,
  });
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setScreenSize({
        isMobile: width <= 480,
        isSmallMobile: width <= 375,
        isTablet: width > 480 && width <= 1024,
        isShortViewport: height <= 600,
        isVeryShortViewport: height <= 500,
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

// Domain-aware loading messages
const LOADING_MESSAGES = {
  modifications: [
    "Searching the parts catalog...",
    "Looking up mod compatibility...",
    "Checking upgrade options...",
  ],
  performance: [
    "Pulling dyno data...",
    "Looking up performance specs...",
    "Checking power numbers...",
  ],
  reliability: [
    "Checking known issues...",
    "Searching community insights...",
    "Looking up reliability reports...",
  ],
  maintenance: [
    "Looking up maintenance specs...",
    "Checking service intervals...",
    "Finding fluid specifications...",
  ],
  buying: [
    "Checking market values...",
    "Looking up buyer's guides...",
    "Researching ownership costs...",
  ],
  track: [
    "Searching lap times...",
    "Looking up track data...",
    "Checking performance records...",
  ],
  events: [
    "Searching car events...",
    "Finding meetups nearby...",
    "Looking up track days...",
  ],
  education: [
    "Searching the encyclopedia...",
    "Looking up technical info...",
    "Finding educational content...",
  ],
  comparison: [
    "Comparing specifications...",
    "Analyzing differences...",
    "Looking up competitor data...",
  ],
  general: [
    "Thinking...",
    "Looking this up...",
    "Searching our database...",
  ],
};

// Get a loading message based on detected domains
function getLoadingMessage(domains = []) {
  const domain = domains[0] || 'general';
  const messages = LOADING_MESSAGES[domain] || LOADING_MESSAGES.general;
  return messages[Math.floor(Math.random() * messages.length)];
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
  thumbsUp: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
    </svg>
  ),
  thumbsDown: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
    </svg>
  ),
  bookmark: ({ size = 16, filled = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  copy: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  ),
  check: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  trash: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
};

/**
 * Format AI response with markdown and extract actionable elements
 */
function formatResponse(text, options = {}) {
  if (!text) return '';
  
  const escapeHtml = (s) => String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  // Escape first to avoid injecting arbitrary HTML via model output.
  let formatted = escapeHtml(text);

  // Convert markdown headers to proper HTML (before other formatting)
  // ### Smaller headers
  formatted = formatted.replace(/^### (.+)$/gm, '<h4 class="responseH4">$1</h4>');
  // ## Main section headers
  formatted = formatted.replace(/^## (.+)$/gm, '<h3 class="responseH3">$1</h3>');

  // Simple markdown-ish formatting
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/^• /gm, '<span class="bullet">•</span> ');
  formatted = formatted.replace(/^- /gm, '<span class="bullet">•</span> ');
  // Numbered lists (1. 2. etc.)
  formatted = formatted.replace(/^(\d+)\. /gm, '<span class="listNum">$1.</span> ');

  // Turn enforced citations into clickable links.
  // Expected: (Source: https://example.com/...)
  formatted = formatted.replace(
    /\(Source:\s*(https?:\/\/[^\s)]+)\)/gi,
    (_m, url) => `(<a class="sourceLink" href="${url}" target="_blank" rel="noopener noreferrer">Source</a>)`
  );
  
  // Add confidence indicators for data
  // Look for patterns like "Our database shows" or "According to X verified reports"
  formatted = formatted.replace(
    /\b(verified|confirmed|documented)\b/gi,
    '<span class="confidenceHigh" title="Verified data">$1</span>'
  );
  formatted = formatted.replace(
    /\b(community reports?|forum data|owner feedback)\b/gi,
    '<span class="confidenceMedium" title="Community-sourced data">$1</span>'
  );
  formatted = formatted.replace(
    /\b(limited data|sparse information|few reports)\b/gi,
    '<span class="confidenceLow" title="Limited data available">$1</span>'
  );

  formatted = formatted.replace(/\n\n/g, '</p><p>');
  formatted = formatted.replace(/\n/g, '<br/>');
  
  return `<p>${formatted}</p>`;
}

/**
 * Extract car mentions from text for action buttons
 */
function extractCarMentions(text) {
  if (!text) return [];
  
  // Common car name patterns - this is a simplified matcher
  // In production, you'd match against actual car database slugs
  const carPatterns = [
    /\b(Porsche\s+)?(\d{3}|Cayman|Boxster|GT[234]|Carrera|Taycan)\b/gi,
    /\b(BMW\s+)?M[234568]\b/gi,
    /\b(Corvette|C[5-8]|Z06|ZR1|Stingray)\b/gi,
    /\b(Mustang|GT350|GT500|Mach\s*1)\b/gi,
    /\b(MX-?5|Miata|RF)\b/gi,
    /\b(Supra|GR86|BRZ)\b/gi,
    /\b(GT-?R|370Z|400Z)\b/gi,
    /\b(Cayman\s+S|Cayman\s+GTS|Boxster\s+S)\b/gi,
  ];
  
  const mentions = new Set();
  for (const pattern of carPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(m => mentions.add(m.trim()));
    }
  }
  
  return Array.from(mentions).slice(0, 3); // Max 3 car mentions
}

// LocalStorage key for intro preference
const AL_INTRO_STORAGE_KEY = 'autorev_al_intro_seen';

/**
 * Response Actions Component - Shows contextual action buttons after responses
 */
function ResponseActions({ content, focusedCar, onCarClick, onCompare }) {
  if (!content) return null;
  
  const actions = [];
  const contentLower = content.toLowerCase();
  
  // Check for comparison context
  const hasComparison = contentLower.includes('compare') || contentLower.includes('vs') || contentLower.includes('versus');
  
  // Check for specific actionable content
  const hasMaintenance = contentLower.includes('maintenance') || contentLower.includes('service') || contentLower.includes('oil change');
  const hasIssues = contentLower.includes('issue') || contentLower.includes('problem') || contentLower.includes('recall');
  const hasMods = contentLower.includes('mod') || contentLower.includes('upgrade') || contentLower.includes('intake') || contentLower.includes('exhaust');
  const hasBuying = contentLower.includes('buy') || contentLower.includes('purchase') || contentLower.includes('ppi');
  
  // Extract mentioned cars
  const carMentions = extractCarMentions(content);
  
  // Add "View Car" action if focused car exists
  if (focusedCar?.slug) {
    actions.push({
      type: 'link',
      label: `View ${focusedCar.name?.split(' ').slice(-1)[0] || 'Car'}`,
      href: `/browse-cars/${focusedCar.slug}`,
      icon: '→',
      primary: true,
    });
  }
  
  // Add comparison action if multiple cars mentioned
  if (carMentions.length >= 2 || hasComparison) {
    actions.push({
      type: 'action',
      label: 'Compare These',
      icon: '⚖️',
      action: 'compare',
      carMentions: carMentions, // Pass the mentioned cars for comparison
    });
  }
  
  // Add contextual actions based on content
  if (hasMaintenance && focusedCar?.slug) {
    actions.push({
      type: 'link',
      label: 'Maintenance Guide',
      href: `/browse-cars/${focusedCar.slug}#maintenance`,
      icon: '🔧',
    });
  }
  
  if (hasIssues && focusedCar?.slug) {
    actions.push({
      type: 'link',
      label: 'Known Issues',
      href: `/browse-cars/${focusedCar.slug}#issues`,
      icon: '⚠️',
    });
  }
  
  if (hasMods) {
    actions.push({
      type: 'link',
      label: 'Explore Mods',
      href: `/encyclopedia`,
      icon: '🔩',
    });
  }
  
  // Limit to 3 actions
  const displayActions = actions.slice(0, 3);
  
  if (displayActions.length === 0) return null;
  
  return (
    <div className={styles.responseActions}>
      {displayActions.map((action, i) => (
        action.type === 'link' ? (
          <a
            key={i}
            href={action.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.responseActionBtn} ${action.primary ? styles.responseActionBtnPrimary : ''}`}
          >
            {action.icon && <span>{action.icon}</span>}
            <span>{action.label}</span>
          </a>
        ) : (
          <button
            key={i}
            className={styles.responseActionBtn}
            onClick={() => {
              if (action.action === 'compare' && onCompare) {
                onCompare(action.carMentions || []);
              }
            }}
          >
            {action.icon && <span>{action.icon}</span>}
            <span>{action.label}</span>
          </button>
        )
      ))}
    </div>
  );
}

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
  
  // Streaming state
  const [streamingContent, setStreamingContent] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('Thinking...');
  const [currentTool, setCurrentTool] = useState(null);
  const [detectedDomains, setDetectedDomains] = useState([]);
  
  // Feedback state
  const [feedbackGiven, setFeedbackGiven] = useState({}); // { messageIndex: 'positive' | 'negative' }
  const [showFeedbackInput, setShowFeedbackInput] = useState(null); // messageIndex for expanded feedback
  const [feedbackText, setFeedbackText] = useState('');
  
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
  
  // Context indicator state - which car AL is focused on
  const [focusedCar, setFocusedCar] = useState(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  
  // Quick reply chips state
  const [quickReplies, setQuickReplies] = useState([]);
  
  // Prefetched context state
  const [prefetchedContext, setPrefetchedContext] = useState(null);
  const [isPrefetching, setIsPrefetching] = useState(false);
  
  // Cost preview state
  const [showCostPreview, setShowCostPreview] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState(null);
  
  // User preferences and bookmarks state
  const [alPreferences, setAlPreferences] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  
  // Copy button state
  const [copiedMessageIndex, setCopiedMessageIndex] = useState(null);
  
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
  const { openCompareWithCars } = useCompare();
  
  // Responsive sizing
  const { isMobile, isSmallMobile, isTablet, isShortViewport, isVeryShortViewport } = useResponsiveSize();
  
  // Calculate responsive mascot sizes based on both width and height
  const introMascotSize = useMemo(() => {
    // Prioritize viewport height for very constrained spaces
    if (isVeryShortViewport) return 70;
    if (isShortViewport) return 90;
    if (isSmallMobile) return 100;
    if (isMobile) return 110;
    if (isTablet) return 130;
    return 140;
  }, [isMobile, isSmallMobile, isTablet, isShortViewport, isVeryShortViewport]);
  
  const signInMascotSize = useMemo(() => {
    if (isVeryShortViewport) return 60;
    if (isShortViewport) return 70;
    if (isSmallMobile) return 80;
    if (isMobile) return 90;
    if (isTablet) return 100;
    return 110;
  }, [isMobile, isSmallMobile, isTablet, isShortViewport, isVeryShortViewport]);
  
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
  
  // Auto-resize textarea when input changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const newHeight = Math.min(inputRef.current.scrollHeight, 120);
      inputRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    if (isOpen && messages.length === 0 && !showIntro) {
      setSuggestions(contextConfig.suggestions || []);
    }
  }, [isOpen, pathname, contextConfig.suggestions, messages.length, showIntro]);
  
  // Lock body scroll when chat is open on mobile to prevent page scrolling
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    // Check if mobile viewport
    const isMobileViewport = window.innerWidth <= 480;
    
    if (isOpen && isMobileViewport) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore scroll position when chat closes
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);
  
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
  
  // Prefetch context when chat opens
  useEffect(() => {
    const prefetchContext = async () => {
      if (!isOpen || !isAuthenticated || isPrefetching || prefetchedContext) return;
      
      setIsPrefetching(true);
      try {
        // Prefetch the current car context and garage vehicle
        const prefetchSlug = selectedCar?.slug || null;
        if (prefetchSlug) {
          const response = await fetch(`/api/cars/${prefetchSlug}/ai-context`);
          if (response.ok) {
            const data = await response.json();
            setPrefetchedContext(data);
            // Set focused car if we have context
            if (data?.car?.name) {
              setFocusedCar({
                slug: prefetchSlug,
                name: data.car.name,
                years: data.car.years,
                source: 'page'
              });
            }
          }
        }
      } catch (err) {
        console.warn('[AL Chat] Prefetch failed:', err);
      } finally {
        setIsPrefetching(false);
      }
    };
    
    // Only prefetch when chat is open and user is authenticated (not on intro/sign-in screens)
    if (isOpen && !showIntro && isAuthenticated) {
      prefetchContext();
    }
  }, [isOpen, isAuthenticated, selectedCar?.slug, isPrefetching, prefetchedContext, showIntro]);
  
  // Update focused car from selectedCar (page context)
  useEffect(() => {
    if (selectedCar?.slug && selectedCar?.name) {
      setFocusedCar({
        slug: selectedCar.slug,
        name: selectedCar.name,
        years: selectedCar.years,
        source: 'page'
      });
      // Track car in preferences
      addKnownCar(selectedCar.slug);
    }
  }, [selectedCar?.slug, selectedCar?.name, selectedCar?.years]);
  
  // Load preferences and bookmarks on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAlPreferences(loadALPreferences());
      setBookmarks(loadALBookmarks());
    }
  }, []);
  
  // Generate quick reply chips based on domains and response
  const generateQuickReplies = useCallback((domains, lastResponse, carContext) => {
    const replies = [];
    const domainSet = new Set(domains || []);
    
    // Car-specific quick replies
    if (carContext) {
      if (domainSet.has('reliability') || lastResponse?.includes('issue') || lastResponse?.includes('problem')) {
        replies.push({ text: 'What about maintenance costs?', icon: '🔧' });
        replies.push({ text: 'How to prevent these issues?', icon: '🛡️' });
      }
      if (domainSet.has('modifications') || lastResponse?.includes('mod') || lastResponse?.includes('upgrade')) {
        replies.push({ text: 'What order should I install these?', icon: '📋' });
        replies.push({ text: 'Total cost estimate?', icon: '💰' });
      }
      if (domainSet.has('buying')) {
        replies.push({ text: 'Best model years?', icon: '📅' });
        replies.push({ text: 'What to check during PPI?', icon: '🔍' });
      }
      if (domainSet.has('performance') || domainSet.has('track')) {
        replies.push({ text: 'Track prep checklist?', icon: '🏁' });
        replies.push({ text: 'Compare lap times', icon: '⏱️' });
      }
      if (domainSet.has('maintenance')) {
        replies.push({ text: 'DIY or dealer?', icon: '🏠' });
        replies.push({ text: 'Recommended fluids?', icon: '🛢️' });
      }
      // Always offer comparison if we have a car context
      if (!domainSet.has('comparison')) {
        replies.push({ text: 'Compare to alternatives', icon: '⚖️' });
      }
    }
    
    // General quick replies if no car context
    if (!carContext && replies.length === 0) {
      if (domainSet.has('education')) {
        replies.push({ text: 'Explain in more detail', icon: '📚' });
        replies.push({ text: 'Real-world examples?', icon: '🌍' });
      }
    }
    
    // Limit to 3 replies max
    return replies.slice(0, 3);
  }, []);
  
  // Handle compare action from ResponseActions
  const handleCompareAction = useCallback((carMentions) => {
    if (!carMentions || carMentions.length === 0) return;
    
    // Try to match mentioned car names to actual cars in carData
    const matchedCars = [];
    
    for (const mention of carMentions) {
      const mentionLower = mention.toLowerCase();
      
      // Search for a matching car in carData
      const matchedCar = carData.find(car => {
        const carNameLower = car.name.toLowerCase();
        const carSlugLower = car.slug.toLowerCase();
        
        // Check if the mention is contained in the car name or slug
        return carNameLower.includes(mentionLower) || 
               mentionLower.includes(carNameLower.split(' ').slice(-2).join(' ')) ||
               carSlugLower.includes(mentionLower.replace(/\s+/g, '-'));
      });
      
      if (matchedCar) {
        matchedCars.push({
          slug: matchedCar.slug,
          name: matchedCar.name,
          years: matchedCar.years,
          hp: matchedCar.hp,
          priceRange: matchedCar.priceRange,
        });
      }
    }
    
    // If we found at least 2 matches, open compare modal
    if (matchedCars.length >= 2) {
      openCompareWithCars(matchedCars.slice(0, 4)); // Max 4 cars
    } else if (focusedCar?.slug && matchedCars.length >= 1) {
      // If we have a focused car and at least one match, include focused car
      const focusedCarData = carData.find(c => c.slug === focusedCar.slug);
      if (focusedCarData && !matchedCars.some(c => c.slug === focusedCarData.slug)) {
        matchedCars.unshift({
          slug: focusedCarData.slug,
          name: focusedCarData.name,
          years: focusedCarData.years,
          hp: focusedCarData.hp,
          priceRange: focusedCarData.priceRange,
        });
      }
      if (matchedCars.length >= 2) {
        openCompareWithCars(matchedCars.slice(0, 4));
      }
    } else {
      // Fallback: just open the browse cars page
      console.log('[AL] Could not match cars for compare:', carMentions);
    }
  }, [openCompareWithCars, focusedCar]);
  
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
        
        // On mobile, auto-collapse expanded view after loading a conversation
        if (typeof window !== 'undefined' && window.innerWidth <= 480) {
          setIsExpanded(false);
        }
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
    setQuickReplies([]);
  }, [contextConfig.suggestions]);
  
  // Clear focused car context
  const clearFocusedCar = useCallback(() => {
    setFocusedCar(null);
    setShowContextMenu(false);
    setPrefetchedContext(null);
  }, []);
  
  // Change focused car (from search or manual input)
  const changeFocusedCar = useCallback((car) => {
    setFocusedCar({
      slug: car.slug,
      name: car.name,
      years: car.years,
      source: 'manual'
    });
    setShowContextMenu(false);
    setPrefetchedContext(null);
  }, []);
  
  // Toggle bookmark for a message
  const toggleBookmark = useCallback((content, query) => {
    const existing = getBookmarkByContent(content);
    if (existing) {
      removeALBookmark(existing.id);
      setBookmarks(loadALBookmarks());
    } else {
      saveALBookmark({
        content,
        query: query || messages.find(m => m.role === 'user')?.content || '',
        carSlug: focusedCar?.slug,
        carName: focusedCar?.name,
      });
      setBookmarks(loadALBookmarks());
    }
  }, [focusedCar, messages]);
  
  // Clean markdown formatting for plain text copy
  const cleanMarkdownForCopy = useCallback((text) => {
    if (!text) return '';
    
    let cleaned = text
      // Remove ## and ### headers but keep the text
      .replace(/^###\s+/gm, '')
      .replace(/^##\s+/gm, '')
      // Remove **bold** markers but keep text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      // Remove *italic* markers but keep text
      .replace(/\*([^*]+)\*/g, '$1')
      // Clean up bullet points - keep as simple dashes
      .replace(/^[•●]\s*/gm, '- ')
      // Clean up multiple consecutive newlines to max 2
      .replace(/\n{3,}/g, '\n\n')
      // Trim whitespace from start/end
      .trim();
    
    return cleaned;
  }, []);
  
  // Copy message content to clipboard (cleaned for sharing)
  const copyMessageContent = useCallback(async (content, messageIndex) => {
    try {
      const cleanedContent = cleanMarkdownForCopy(content);
      await navigator.clipboard.writeText(cleanedContent);
      setCopiedMessageIndex(messageIndex);
      // Reset after 2 seconds
      setTimeout(() => setCopiedMessageIndex(null), 2000);
    } catch (err) {
      console.warn('[AL] Copy failed:', err);
    }
  }, [cleanMarkdownForCopy]);
  
  // Auto-resize textarea
  const autoResizeTextarea = useCallback(() => {
    if (inputRef.current) {
      // Reset height to auto to get correct scrollHeight
      inputRef.current.style.height = 'auto';
      // Set height to scrollHeight, capped at max-height (120px)
      const newHeight = Math.min(inputRef.current.scrollHeight, 120);
      inputRef.current.style.height = `${newHeight}px`;
    }
  }, []);
  
  // Estimate query cost based on complexity
  const estimateQueryCost = useCallback((query) => {
    if (!query) return null;
    
    const queryLower = query.toLowerCase();
    const wordCount = query.split(/\s+/).length;
    
    // Check for expensive query patterns
    const isComparison = queryLower.includes('compare') || queryLower.includes(' vs ') || queryLower.includes('versus');
    const isComprehensive = queryLower.includes('everything') || queryLower.includes('tell me all') || queryLower.includes('in detail');
    const isBuildPlan = queryLower.includes('build plan') || queryLower.includes('mod plan') || queryLower.includes('upgrade path');
    const isResearch = queryLower.includes('should i buy') || queryLower.includes('worth it') || queryLower.includes('reliable');
    
    let costLevel = 'low'; // Default: 1-2 credits
    let estimate = '~1-2';
    let showPreview = false;
    
    if (isComparison || isComprehensive || isBuildPlan) {
      costLevel = 'high';
      estimate = '~3-5';
      showPreview = true;
    } else if (isResearch || wordCount > 25) {
      costLevel = 'medium';
      estimate = '~2-3';
      showPreview = false; // Only show preview for high-cost queries
    }
    
    return { costLevel, estimate, showPreview };
  }, []);
  
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

  // Ref for aborting streaming requests on unmount
  const abortControllerRef = useRef(null);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  const sendMessage = async (messageText = input) => {
    if (!messageText.trim() || isLoading) return;
    
    const userMessage = messageText.trim();
    setInput('');
    setError(null);
    setSuggestions([]);
    setQuickReplies([]);
    setStreamingContent('');
    setCurrentTool(null);
    setLoadingMessage('Thinking...');
    
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);
    
    // Create abort controller for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    // Use focused car or selected car
    const carSlugToUse = focusedCar?.slug || selectedCar?.slug;
    
    try {
      // Use streaming API
      const response = await fetch('/api/ai-mechanic?stream=true', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          message: userMessage,
          carSlug: carSlugToUse,
          userId: user?.id,
          currentPage: pathname,
          context: getPageContext(),
          conversationId: currentConversationId,
          history: messages.slice(-6),
          stream: true,
          prefetchedContext: prefetchedContext,
        }),
        signal,
      });
      
      // Check if we got a streaming response
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('text/event-stream')) {
        // Handle SSE streaming
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';
        let messageId = null;
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            // Check if aborted
            if (signal.aborted) {
              reader.cancel();
              break;
            }
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              // Skip event type lines (we determine type from data shape)
              if (line.startsWith('event: ')) continue;
              
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  // Handle different event types based on data shape
                  if (data.domains) {
                    // Connected event with domains
                    setDetectedDomains(data.domains || []);
                    setLoadingMessage(getLoadingMessage(data.domains));
                    if (data.conversationId && !currentConversationId) {
                      setCurrentConversationId(data.conversationId);
                    }
                  } else if (data.content !== undefined) {
                    // Text delta
                    fullContent += data.content;
                    setStreamingContent(fullContent);
                  } else if (data.tool) {
                    // Tool start/result
                    if (data.success === undefined) {
                      // Tool start
                      setCurrentTool(data.tool);
                      setLoadingMessage(getToolLoadingMessage(data.tool));
                    } else {
                      // Tool result
                      setCurrentTool(null);
                    }
                  } else if (data.usage) {
                    // Done event
                    if (data.conversationId) {
                      setCurrentConversationId(data.conversationId);
                    }
                    messageId = data.messageId;
                  } else if (data.message && !data.content) {
                    // Error event
                    throw new Error(data.message);
                  }
                } catch (parseErr) {
                  // Skip invalid JSON (might be partial), but rethrow actual errors
                  if (parseErr.message && !parseErr.message.includes('JSON')) {
                    throw parseErr;
                  }
                }
              }
            }
          }
        } finally {
          // Ensure reader is released
          reader.releaseLock();
        }
        
        // Finalize the message (only if not aborted)
        if (fullContent && !signal.aborted) {
          setMessages([...newMessages, { 
            role: 'assistant', 
            content: fullContent,
            messageId,
          }]);
          setStreamingContent('');
          
          // Generate quick reply chips based on domains and response
          const replies = generateQuickReplies(detectedDomains, fullContent, focusedCar || carSlugToUse);
          setQuickReplies(replies);
        }
      } else {
        // Fallback to non-streaming response
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.fallbackResponse || data.error);
        }
        
        if (data.conversationId && !currentConversationId) {
          setCurrentConversationId(data.conversationId);
        }
        
        setMessages([...newMessages, { role: 'assistant', content: data.response }]);
        
        // Generate quick reply chips
        const domains = data.context?.domains || [];
        const replies = generateQuickReplies(domains, data.response, focusedCar || carSlugToUse);
        setQuickReplies(replies);
      }
      
    } catch (err) {
      // Don't show error for aborted requests (user navigated away or sent new message)
      if (err.name === 'AbortError') {
        console.info('[AI] Request aborted');
        return;
      }
      console.error('[AI] Error:', err);
      setError(err.message || 'Failed to get response. Please try again.');
      setMessages(messages);
      setStreamingContent('');
    } finally {
      setIsLoading(false);
      setCurrentTool(null);
      abortControllerRef.current = null;
    }
  };
  
  // Get a friendly loading message for a tool
  const getToolLoadingMessage = (toolName) => {
    const toolMessages = {
      'search_cars': 'Searching cars...',
      'get_car_details': 'Loading car details...',
      'get_car_ai_context': 'Getting car info...',
      'get_expert_reviews': 'Checking expert reviews...',
      'get_known_issues': 'Looking up known issues...',
      'compare_cars': 'Comparing cars...',
      'search_encyclopedia': 'Searching encyclopedia...',
      'get_upgrade_info': 'Getting upgrade info...',
      'search_parts': 'Searching parts catalog...',
      'get_maintenance_schedule': 'Checking maintenance...',
      'search_knowledge': 'Searching knowledge base...',
      'get_track_lap_times': 'Looking up lap times...',
      'get_dyno_runs': 'Fetching dyno data...',
      'search_community_insights': 'Checking community insights...',
      'search_events': 'Finding car events...',
      'recommend_build': 'Building recommendations...',
    };
    return toolMessages[toolName] || 'Working on it...';
  };
  
  // Handle feedback submission
  const handleFeedback = async (messageIndex, rating) => {
    const message = messages[messageIndex];
    if (!message || !user?.id) return;
    
    setFeedbackGiven(prev => ({ ...prev, [messageIndex]: rating }));
    
    // If negative, show text input
    if (rating === 'negative') {
      setShowFeedbackInput(messageIndex);
      return;
    }
    
    // Submit positive feedback immediately
    try {
      await fetch('/api/ai-mechanic/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: currentConversationId,
          messageIndex,
          rating,
          userId: user?.id,
        }),
      });
    } catch (err) {
      console.warn('[AI Feedback] Failed to submit:', err);
    }
  };
  
  // Submit negative feedback with text
  const submitNegativeFeedback = async (messageIndex) => {
    try {
      await fetch('/api/ai-mechanic/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: currentConversationId,
          messageIndex,
          rating: 'negative',
          feedbackText: feedbackText,
          userId: user?.id,
        }),
      });
      setShowFeedbackInput(null);
      setFeedbackText('');
    } catch (err) {
      console.warn('[AI Feedback] Failed to submit:', err);
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
                  {bookmarks.length > 0 && (
                    <button 
                      onClick={() => setShowBookmarks(!showBookmarks)} 
                      className={`${styles.headerBtn} ${showBookmarks ? styles.headerBtnActive : ''}`}
                      aria-label="Saved responses"
                      title="Saved responses"
                    >
                      <Icons.bookmark size={16} filled={showBookmarks} />
                      {bookmarks.length > 0 && (
                        <span className={styles.bookmarkBadge}>{bookmarks.length}</span>
                      )}
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

              {/* Bookmarks Panel - slides over content when shown */}
              {showBookmarks && (
                <div className={styles.bookmarksPanel}>
                  <div className={styles.bookmarksPanelHeader}>
                    <Icons.bookmark size={16} filled />
                    <span>Saved Responses</span>
                    <button 
                      onClick={() => setShowBookmarks(false)}
                      className={styles.bookmarksPanelClose}
                    >
                      <Icons.x size={16} />
                    </button>
                  </div>
                  <div className={styles.bookmarksList}>
                    {bookmarks.length === 0 ? (
                      <div className={styles.noBookmarks}>
                        <Icons.bookmark size={24} />
                        <p>No saved responses yet</p>
                        <span>Click the bookmark icon on any response to save it</span>
                      </div>
                    ) : (
                      bookmarks.map(bm => (
                        <div key={bm.id} className={styles.bookmarkItem}>
                          <div className={styles.bookmarkMeta}>
                            {bm.carName && (
                              <span className={styles.bookmarkCar}>🚗 {bm.carName}</span>
                            )}
                            <span className={styles.bookmarkDate}>
                              {new Date(bm.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {bm.query && (
                            <div className={styles.bookmarkQuery}>
                              <strong>Q:</strong> {bm.query.slice(0, 80)}{bm.query.length > 80 ? '...' : ''}
                            </div>
                          )}
                          <div className={styles.bookmarkContent}>
                            {bm.content?.slice(0, 150)}{bm.content?.length > 150 ? '...' : ''}
                          </div>
                          <div className={styles.bookmarkActions}>
                            <button 
                              className={styles.bookmarkCopyBtn}
                              onClick={() => {
                                navigator.clipboard.writeText(bm.content);
                              }}
                              title="Copy to clipboard"
                            >
                              Copy
                            </button>
                            <button 
                              className={styles.bookmarkDeleteBtn}
                              onClick={() => {
                                removeALBookmark(bm.id);
                                setBookmarks(loadALBookmarks());
                              }}
                              title="Delete bookmark"
                            >
                              <Icons.trash size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

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
                            <ALMascot size={24} />
                          </div>
                        )}
                        <div className={styles.messageWrapper}>
                          {/* Message bubble with copy button wrapper */}
                          <div className={`${styles.messageBubble} ${msg.role === 'assistant' ? styles.assistantBubble : ''}`}>
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
                            {/* Copy button for assistant messages - inside the bubble */}
                            {msg.role === 'assistant' && (
                              <button
                                className={`${styles.messageCopyBtn} ${copiedMessageIndex === i ? styles.messageCopyBtnCopied : ''}`}
                                onClick={() => copyMessageContent(msg.content, i)}
                                title={copiedMessageIndex === i ? 'Copied!' : 'Copy response'}
                                aria-label={copiedMessageIndex === i ? 'Copied!' : 'Copy response'}
                              >
                                {copiedMessageIndex === i ? (
                                  <Icons.check size={14} />
                                ) : (
                                  <Icons.copy size={14} />
                                )}
                              </button>
                            )}
                          </div>
                          
                          {/* Action buttons for assistant messages */}
                          {msg.role === 'assistant' && (
                            <ResponseActions 
                              content={msg.content} 
                              focusedCar={focusedCar}
                              onCarClick={(slug) => {
                                // Navigate to car page
                                window.open(`/browse-cars/${slug}`, '_blank');
                              }}
                              onCompare={handleCompareAction}
                            />
                          )}
                          
                          {/* Feedback buttons for assistant messages */}
                          {msg.role === 'assistant' && (
                            <div className={styles.feedbackRow}>
                              {feedbackGiven[i] ? (
                                <span className={styles.feedbackThanks}>
                                  {feedbackGiven[i] === 'positive' ? <><Icons.thumbsUp size={14} /> Thanks!</> : <><Icons.thumbsDown size={14} /> Thanks for the feedback</>}
                                </span>
                              ) : (
                                <>
                                  <button
                                    className={styles.feedbackBtn}
                                    onClick={() => handleFeedback(i, 'positive')}
                                    title="Good response"
                                  >
                                    <Icons.thumbsUp size={14} />
                                  </button>
                                  <button
                                    className={styles.feedbackBtn}
                                    onClick={() => handleFeedback(i, 'negative')}
                                    title="Bad response"
                                  >
                                    <Icons.thumbsDown size={14} />
                                  </button>
                                </>
                              )}
                              
                              {/* Bookmark button */}
                              <button
                                className={`${styles.feedbackBtn} ${styles.bookmarkBtn} ${checkIsBookmarked(msg.content) ? styles.bookmarked : ''}`}
                                onClick={() => toggleBookmark(msg.content)}
                                title={checkIsBookmarked(msg.content) ? 'Remove bookmark' : 'Save response'}
                              >
                                <Icons.bookmark size={14} filled={checkIsBookmarked(msg.content)} />
                              </button>
                              
                              {/* Expanded feedback input for negative feedback */}
                              {showFeedbackInput === i && (
                                <div className={styles.feedbackInputRow}>
                                  <input
                                    type="text"
                                    className={styles.feedbackInput}
                                    placeholder="What was wrong? (optional)"
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        submitNegativeFeedback(i);
                                      }
                                    }}
                                  />
                                  <button
                                    className={styles.feedbackSubmitBtn}
                                    onClick={() => submitNegativeFeedback(i)}
                                  >
                                    Send
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Streaming response */}
                    {isLoading && streamingContent && (
                      <div className={`${styles.message} ${styles.assistant}`}>
                        <div className={styles.messageIcon}>
                          <ALMascot size={24} />
                        </div>
                        <div 
                          className={styles.messageContent}
                          dangerouslySetInnerHTML={{ __html: formatResponse(streamingContent) }}
                        />
                      </div>
                    )}
                    
                    {/* Loading indicator - animated thinking bubble */}
                    {isLoading && !streamingContent && (
                      <div className={styles.thinkingContainer}>
                        <div className={styles.thinkingBubble} key={loadingMessage}>
                          <div className={styles.thinkingIcon}>
                            <ALMascot size={24} className={styles.thinkingMascot} />
                          </div>
                          <div className={styles.thinkingContent}>
                            <span className={styles.thinkingText}>{loadingMessage}</span>
                            <div className={styles.thinkingDots}>
                              <span></span><span></span><span></span>
                            </div>
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

              {/* Context Indicator Bar */}
              {focusedCar && (
                <div className={styles.contextBar}>
                  <div className={styles.contextInfo}>
                    <span className={styles.contextIcon}>🚗</span>
                    <span className={styles.contextLabel}>Helping with:</span>
                    <span className={styles.contextCar}>{focusedCar.name}</span>
                    {focusedCar.years && (
                      <span className={styles.contextYears}>({focusedCar.years})</span>
                    )}
                  </div>
                  <button 
                    className={styles.contextClearBtn}
                    onClick={clearFocusedCar}
                    title="Clear car context"
                  >
                    <Icons.x size={14} />
                  </button>
                </div>
              )}
              
              {/* Quick Reply Chips - Hidden to save space; suggestions appear in messages */}

              {/* Cost Preview */}
              {showCostPreview && estimatedCost && (
                <div className={styles.costPreview}>
                  <div className={styles.costPreviewContent}>
                    <span className={styles.costPreviewIcon}>💡</span>
                    <span className={styles.costPreviewText}>
                      This detailed query may use <strong>{estimatedCost.estimate} credits</strong>
                    </span>
                  </div>
                  <div className={styles.costPreviewActions}>
                    <button 
                      className={styles.costPreviewSend}
                      onClick={() => {
                        setShowCostPreview(false);
                        sendMessage();
                      }}
                    >
                      Send anyway
                    </button>
                    <button 
                      className={styles.costPreviewCancel}
                      onClick={() => setShowCostPreview(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className={styles.inputArea}>
                <div className={styles.inputWrapper}>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      // Check if query might be expensive
                      const cost = estimateQueryCost(e.target.value);
                      if (cost?.showPreview) {
                        setEstimatedCost(cost);
                      } else {
                        setEstimatedCost(null);
                        setShowCostPreview(false);
                      }
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        // Check for cost preview before sending
                        if (estimatedCost?.showPreview && !showCostPreview) {
                          setShowCostPreview(true);
                        } else {
                          setShowCostPreview(false);
                          sendMessage();
                        }
                      }
                    }}
                    placeholder={focusedCar ? `Ask about ${focusedCar.name}...` : contextConfig.placeholder}
                    className={styles.input}
                    rows={1}
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => {
                      if (estimatedCost?.showPreview && !showCostPreview) {
                        setShowCostPreview(true);
                      } else {
                        setShowCostPreview(false);
                        sendMessage();
                      }
                    }}
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
