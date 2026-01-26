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
import Image from 'next/image';
import styles from './page.module.css';
import ALAttachmentMenu, { ALAttachmentsBar } from '@/components/ALAttachmentMenu';
import ALPreferencesPanel, { useALPreferences } from '@/components/ALPreferencesPanel';
import ALSourcesList from '@/components/ALSourcesList';
import { getPendingALPrompt } from '@/components/AskALButton';
import AuthModal, { useAuthModal } from '@/components/AuthModal';
import FeedbackDimensionsModal from '@/components/FeedbackDimensionsModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCarSelection } from '@/components/providers/CarSelectionProvider';
import { usePointsNotification } from '@/components/providers/PointsNotificationProvider';
import { Icons } from '@/components/ui/Icons';
import PullToRefresh from '@/components/ui/PullToRefresh';
import { useAnalytics, ANALYTICS_EVENTS } from '@/hooks/useAnalytics';
import { useUserConversations, useUserConversation } from '@/hooks/useUserData';
import { trackALConversationStart } from '@/lib/ga4';
import { UI_IMAGES } from '@/lib/images';

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
          elements.push(
            <ul key={`list-${index}`} className="alMessageList">
              {listItems}
            </ul>
          );
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
        listItems.push(<li key={index}>{processInlineFormatting(trimmedLine.slice(2))}</li>);
      }
      // Handle regular paragraphs
      else if (trimmedLine) {
        if (inList && listItems.length > 0) {
          elements.push(
            <ul key={`list-${index}`} className="alMessageList">
              {listItems}
            </ul>
          );
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
      elements.push(
        <ul key="list-final" className="alMessageList">
          {listItems}
        </ul>
      );
    }

    return elements;
  };

  return <div className="alFormattedMessage">{formatContent(content)}</div>;
};

// AL Mascot component - Teal ring for brand consistency
const ALMascot = ({ size = 80 }) => (
  <Image
    src={UI_IMAGES.alMascotFull}
    alt="AL - AutoRev AI"
    width={size}
    height={size}
    className="alMascotImage"
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      objectFit: 'cover',
      border: '3px solid var(--color-accent-teal, #10b981)',
      boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
    }}
  />
);

// Local aliases for icons with newChat and history mappings
const LocalIcons = {
  send: Icons.send,
  thumbsUp: Icons.thumbsUp,
  thumbsDown: Icons.thumbsDown,
  arrowUp: Icons.arrowUp,
  newChat: Icons.plus,
  history: Icons.clock,
  sparkles: Icons.sparkles,
  attachment: Icons.attachment,
  settings: Icons.settings,
  camera: Icons.camera,
  // New icons for enhanced features
  stop: Icons.stop,
  copy: Icons.copy,
  refresh: Icons.refresh,
  trash: Icons.trash,
  search: Icons.search,
  mic: Icons.mic,
  share: Icons.share,
  x: Icons.x,
};

// Helper to check if a message is from AL (assistant)
// Handles case variations and potential API inconsistencies
const isAssistantMessage = (msg) => {
  if (!msg) return false;
  const role = (msg.role || '').toLowerCase();
  return role === 'assistant' || role === 'al' || role === 'ai';
};

// Helper to format relative time for timestamps
const formatRelativeTime = (dateString) => {
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
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Helper to copy text to clipboard
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (e) {
      document.body.removeChild(textArea);
      return false;
    }
  }
};

// Helper to get source type from tool name
const getSourceTypeFromTool = (toolName) => {
  const typeMap = {
    get_expert_reviews: 'youtube',
    get_known_issues: 'database',
    get_car_ai_context: 'database',
    get_car_details: 'database',
    search_community_insights: 'forum',
    search_forums: 'forum',
    search_knowledge: 'reference',
    get_track_lap_times: 'database',
    get_dyno_runs: 'database',
    search_encyclopedia: 'encyclopedia',
    search_parts: 'database',
    get_maintenance_schedule: 'database',
    search_events: 'database',
    search_web: 'web',
    compare_cars: 'database',
  };
  return typeMap[toolName] || 'database';
};

// Helper to get source label from tool name
const getSourceLabelFromTool = (toolName) => {
  const labelMap = {
    get_expert_reviews: 'YouTube Reviews',
    get_known_issues: 'Known Issues Database',
    get_car_ai_context: 'AutoRev Database',
    get_car_details: 'Car Specifications',
    search_community_insights: 'Forum Insights',
    search_forums: 'Forum Search',
    search_knowledge: 'Knowledge Base',
    get_track_lap_times: 'Lap Times Database',
    get_dyno_runs: 'Dyno Database',
    search_encyclopedia: 'AutoRev Encyclopedia',
    search_parts: 'Parts Catalog',
    get_maintenance_schedule: 'Maintenance Database',
    search_events: 'Events Database',
    search_web: 'Web Search',
    compare_cars: 'Car Comparison',
    analyze_vehicle_health: 'Vehicle Health Analysis',
    get_upgrade_info: 'Upgrade Information',
    recommend_build: 'Build Recommendations',
  };
  return labelMap[toolName] || 'AutoRev';
};

// Helper to get real-time activity label for tool (shown during streaming)
// NOTE: Reserved for future use when showing per-tool status during streaming
const _getToolActivityLabel = (toolName) => {
  const labels = {
    get_car_ai_context: 'Loading vehicle data...',
    search_cars: 'Searching car database...',
    search_community_insights: 'Searching forum discussions...',
    get_expert_reviews: 'Finding expert reviews...',
    search_web: 'Searching the web...',
    search_encyclopedia: 'Checking encyclopedia...',
    get_known_issues: 'Looking up known issues...',
    search_parts: 'Searching parts catalog...',
    get_maintenance_schedule: 'Loading maintenance info...',
    search_events: 'Finding events...',
    compare_cars: 'Comparing vehicles...',
    get_track_lap_times: 'Loading lap times...',
    get_dyno_runs: 'Loading dyno data...',
    search_knowledge: 'Searching knowledge base...',
    get_car_details: 'Loading car details...',
    analyze_vehicle_health: 'Analyzing vehicle health...',
    get_upgrade_info: 'Finding upgrade info...',
    recommend_build: 'Generating recommendations...',
  };
  return labels[toolName] || 'Researching...';
};

// Daily usage counter component - shows "X queries today" with beta badge
const ALQueryCounter = ({ queriesToday, isBeta, isUnlimited }) => {
  return (
    <div className={styles.queryCounter}>
      <span className={styles.queryCountNumber}>{queriesToday}</span>
      <span className={styles.queryCountLabel}>
        {queriesToday === 1 ? 'query today' : 'queries today'}
      </span>
      {isBeta && <span className={styles.betaBadge}>Unlimited (Beta)</span>}
      {isUnlimited && !isBeta && <span className={styles.unlimitedBadge}>Unlimited</span>}
    </div>
  );
};

export default function ALPageClient() {
  // NOTE: router available for future navigation needs
  const _router = useRouter();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [currentPhase, setCurrentPhase] = useState(null); // Current processing phase (understanding, thinking, researching, formulating)
  const [activeTools, setActiveTools] = useState([]); // Track tools being queried in real-time
  const [showHistory, setShowHistory] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [selectedConversationId, setSelectedConversationId] = useState(null); // For loading a conversation

  // Daily usage counter state (for "X queries today" display)
  const [dailyUsage, setDailyUsage] = useState({
    queriesToday: 0,
    isBeta: true,
    isUnlimited: false,
  });

  // Pending prompt from AskALButton navigation
  const [pendingPrompt, setPendingPrompt] = useState(null);

  // Attachment state
  const [attachments, setAttachments] = useState([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  // Preferences state
  const [showPreferences, setShowPreferences] = useState(false);
  const { preferences: _alPreferences, updatePreferences } = useALPreferences();

  // Feedback state
  const [feedbackGiven, setFeedbackGiven] = useState({}); // { messageIndex: 'positive' | 'negative' }
  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    messageIndex: null,
    type: null,
  });

  // New feature states
  const [copiedMessageIndex, setCopiedMessageIndex] = useState(null); // For copy confirmation
  const [lastUserMessage, setLastUserMessage] = useState(null); // For regenerate feature
  const [historySearchQuery, setHistorySearchQuery] = useState(''); // For conversation search
  const [isSearchingHistory, setIsSearchingHistory] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { conversationId, title }
  const [isListening, setIsListening] = useState(false); // For voice input
  const [voiceSupported, setVoiceSupported] = useState(false); // Check for Speech API support
  const [showShareModal, setShowShareModal] = useState(false); // Share modal
  const [shareUrl, setShareUrl] = useState(null); // Share URL
  const [isSharing, setIsSharing] = useState(false); // Loading state for sharing

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showPointsEarned } = usePointsNotification();
  const { selectedCar } = useCarSelection();
  const authModal = useAuthModal();
  const { trackEvent } = useAnalytics();
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    if (!authLoading) {
      setLoadingTimedOut(false);
      return;
    }
    const timeout = setTimeout(() => {
      console.warn('[AL] Loading timeout - showing content');
      setLoadingTimedOut(true);
    }, 6000);
    return () => clearTimeout(timeout);
  }, [authLoading]);

  // React Query hooks for conversations
  const {
    data: conversations = [],
    isLoading: conversationsLoading,
    refetch: refetchConversations,
  } = useUserConversations(user?.id, { enabled: isAuthenticated && showHistory });

  // Note: We use direct API calls for loading conversations (see loadConversation)
  // This hook is kept but disabled - could be used for caching in the future
  const { data: _selectedConversationData } = useUserConversation(
    user?.id,
    null, // Always disabled - we load conversations directly
    { enabled: false }
  );

  // Auto-scroll disabled - user prefers to see top of AL's response first
  // If you want to re-enable, uncomment the following:
  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, [messages, streamingContent]);

  // Focus input on mount
  useEffect(() => {
    if (isAuthenticated && inputRef.current && !pendingPrompt) {
      inputRef.current.focus();
    }
  }, [isAuthenticated, pendingPrompt]);

  // Check for voice input support
  const speechRecognitionRef = useRef(null);
  useEffect(() => {
    // Check if Speech Recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
      speechRecognitionRef.current = new SpeechRecognition();
      speechRecognitionRef.current.continuous = false;
      speechRecognitionRef.current.interimResults = true;
      speechRecognitionRef.current.lang = 'en-US';

      speechRecognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('');
        setInput(transcript);
      };

      speechRecognitionRef.current.onend = () => {
        setIsListening(false);
      };

      speechRecognitionRef.current.onerror = (event) => {
        console.warn('[AL] Speech recognition error:', event.error);
        setIsListening(false);
      };
    }

    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.abort();
      }
    };
  }, []);

  // Check for pending prompt from AskALButton navigation
  useEffect(() => {
    const pending = getPendingALPrompt();
    if (pending) {
      setPendingPrompt(pending);
    }
  }, []);

  // Auto-send pending prompt if autoSend flag is true
  // Uses a small delay to ensure sendMessageRef is populated
  useEffect(() => {
    if (pendingPrompt?.autoSend && sendMessageRef.current) {
      const timer = setTimeout(() => {
        if (pendingPrompt && sendMessageRef.current) {
          const promptText = pendingPrompt.prompt;
          setPendingPrompt(null);
          sendMessageRef.current(promptText);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pendingPrompt]);

  // Fetch initial daily usage on mount
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const fetchDailyUsage = async () => {
      try {
        const response = await fetch(`/api/users/${user.id}/al-credits`);
        if (response.ok) {
          const data = await response.json();
          if (data.dailyUsage) {
            setDailyUsage({
              queriesToday: data.dailyUsage.queriesToday || 0,
              isBeta: data.dailyUsage.isBeta ?? true,
              isUnlimited: data.dailyUsage.isUnlimited ?? false,
            });
          }
        }
      } catch (err) {
        console.warn('[AL] Failed to fetch initial daily usage:', err);
      }
    };

    fetchDailyUsage();
  }, [isAuthenticated, user?.id]);

  // Note: Conversation loading is now handled directly in loadConversation()
  // The React Query hook is kept for potential future caching but not used for loading

  // Load a specific conversation - direct API call for reliability
  const [isLoadingConversationDirect, setIsLoadingConversationDirect] = useState(false);

  const loadConversation = useCallback(
    async (conversationId) => {
      // Prevent loading while already loading
      if (isLoadingConversationDirect) return;
      if (!user?.id) {
        console.error('[AL] Cannot load conversation: no user ID');
        return;
      }

      // eslint-disable-next-line no-console
      console.log('[AL] Loading conversation:', conversationId);
      setIsLoadingConversationDirect(true);
      setSelectedConversationId(conversationId); // For loading indicator

      try {
        const response = await fetch(`/api/users/${user.id}/al-conversations/${conversationId}`);

        if (response.status === 404) {
          // Conversation was likely soft-deleted but still showing in list
          // Refresh the list and show a message
          console.warn('[AL] Conversation not found (may have been deleted)');
          refetchConversations();
          setShowHistory(false);
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to load conversation: ${response.status}`);
        }

        const data = await response.json();
        // eslint-disable-next-line no-console
        console.log('[AL] Conversation loaded:', data.messages?.length || 0, 'messages');

        if (data.messages && data.messages.length > 0) {
          // Normalize role to lowercase and preserve all message properties
          setMessages(
            data.messages.map((msg) => ({
              role: (msg.role || 'user').toLowerCase(),
              content: msg.content,
              sources: msg.sources,
              toolsUsed: msg.toolsUsed || msg.tools_used,
              timestamp: msg.timestamp || msg.created_at,
            }))
          );
          setCurrentConversationId(conversationId);
          setShowHistory(false);
        } else {
          console.warn('[AL] Conversation has no messages');
          setError({ message: 'This conversation has no messages.', canRetry: false });
        }
      } catch (err) {
        console.error('[AL] Failed to load conversation:', err);
        setError({ message: 'Failed to load conversation. Please try again.', canRetry: false });
      } finally {
        setIsLoadingConversationDirect(false);
        setSelectedConversationId(null);
      }
    },
    [user?.id, isLoadingConversationDirect, refetchConversations]
  );

  // Start new chat
  const startNewChat = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
    setShowHistory(false);
    setInput('');
    setAttachments([]);
    setPendingPrompt(null);
    setLastUserMessage(null);
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    inputRef.current?.focus();
  }, []);

  // Stop generation - abort the current streaming request
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setStreamingContent('');
      setCurrentPhase(null);
      setActiveTools([]);
    }
  }, []);

  // Toggle voice input
  const toggleVoiceInput = useCallback(() => {
    if (!speechRecognitionRef.current) return;

    if (isListening) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      speechRecognitionRef.current.start();
    }
  }, [isListening]);

  // Generate share link for conversation
  const generateShareLink = useCallback(async () => {
    if (!user?.id || !currentConversationId) return;

    setIsSharing(true);
    try {
      const response = await fetch(
        `/api/users/${user.id}/al-conversations/${currentConversationId}/share`,
        { method: 'POST' }
      );

      if (response.ok) {
        const data = await response.json();
        setShareUrl(data.shareUrl);
        setShowShareModal(true);
      }
    } catch (err) {
      console.error('[AL] Failed to generate share link:', err);
    } finally {
      setIsSharing(false);
    }
  }, [user?.id, currentConversationId]);

  // Copy share URL to clipboard
  const copyShareUrl = useCallback(async () => {
    if (!shareUrl) return;
    const success = await copyToClipboard(shareUrl);
    if (success) {
      // Show brief confirmation
      setTimeout(() => setShowShareModal(false), 1500);
    }
  }, [shareUrl]);

  // Copy message to clipboard
  const handleCopyMessage = useCallback(
    async (messageIndex) => {
      const message = messages[messageIndex];
      if (!message) return;

      const success = await copyToClipboard(message.content);
      if (success) {
        setCopiedMessageIndex(messageIndex);
        // Reset after 2 seconds
        setTimeout(() => setCopiedMessageIndex(null), 2000);
      }
    },
    [messages]
  );

  // Regenerate last response
  const handleRegenerate = useCallback(() => {
    if (!lastUserMessage || isLoading) return;

    // Remove the last assistant message
    setMessages((prev) => {
      const newMessages = [...prev];
      // Find and remove the last assistant message
      for (let i = newMessages.length - 1; i >= 0; i--) {
        if (newMessages[i].role === 'assistant') {
          newMessages.splice(i, 1);
          break;
        }
      }
      return newMessages;
    });

    // Resend the last user message
    if (sendMessageRef.current) {
      sendMessageRef.current(lastUserMessage);
    }
  }, [lastUserMessage, isLoading]);

  // Delete a conversation
  const handleDeleteConversation = useCallback(
    async (conversationId) => {
      if (!user?.id || !conversationId) return;

      try {
        const response = await fetch(`/api/users/${user.id}/al-conversations/${conversationId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          refetchConversations();
          // If we deleted the current conversation, start a new chat
          if (conversationId === currentConversationId) {
            startNewChat();
          }
        }
      } catch (err) {
        console.error('[AL] Failed to delete conversation:', err);
      } finally {
        setDeleteConfirm(null);
      }
    },
    [user?.id, currentConversationId, refetchConversations, startNewChat]
  );

  // Search conversations
  const handleSearchConversations = useCallback(
    async (query) => {
      if (!user?.id || !query.trim()) {
        setSearchResults(null);
        return;
      }

      setIsSearchingHistory(true);
      try {
        const response = await fetch(
          `/api/users/${user.id}/al-conversations?search=${encodeURIComponent(query)}`
        );
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.conversations || []);
        }
      } catch (err) {
        console.error('[AL] Search failed:', err);
      } finally {
        setIsSearchingHistory(false);
      }
    },
    [user?.id]
  );

  // Handle sending pending prompt (from AskALButton navigation)
  // Note: sendMessage is defined below, use ref pattern to avoid circular dependency
  const sendMessageRef = useRef(null);

  const handleSendPendingPrompt = useCallback(() => {
    if (pendingPrompt && sendMessageRef.current) {
      const promptText = pendingPrompt.prompt;
      setPendingPrompt(null);
      sendMessageRef.current(promptText);
    }
  }, [pendingPrompt]);

  // Handle dismissing pending prompt
  const handleDismissPendingPrompt = useCallback(() => {
    setPendingPrompt(null);
    inputRef.current?.focus();
  }, []);

  // Handle attachment added
  const handleAttachmentAdd = useCallback((attachment) => {
    setAttachments((prev) => [...prev, attachment]);
    setShowAttachmentMenu(false);
  }, []);

  // Handle attachment removed
  const handleAttachmentRemove = useCallback((attachmentId) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
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
    // Reset textarea height after sending
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    setError(null);
    setStreamingContent('');
    setAttachments([]); // Clear attachments after sending

    // Track analytics
    const isFirstMessage = messages.length === 0;
    trackEvent(
      isFirstMessage
        ? ANALYTICS_EVENTS.AL_CONVERSATION_STARTED
        : ANALYTICS_EVENTS.AL_QUESTION_ASKED,
      {
        carSlug: selectedCar?.slug,
        messageLength: userMessage.length,
        isFirstMessage,
        hasAttachments: messageAttachments.length > 0,
        attachmentCount: messageAttachments.length,
      }
    );

    if (isFirstMessage) {
      trackALConversationStart(user?.id || 'anonymous', userMessage, selectedCar?.slug);
    }

    // Build user message with attachment indicators and timestamp
    const newMessages = [
      ...messages,
      {
        role: 'user',
        content: userMessage,
        attachments: messageAttachments, // Store attachments with message
        timestamp: new Date().toISOString(),
      },
    ];
    setMessages(newMessages);
    setLastUserMessage(userMessage); // Track for regenerate feature
    setIsLoading(true);
    setActiveTools([]); // Clear any previous tool activity indicators
    setCurrentPhase(null); // Clear any previous phase

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/ai-mechanic?stream=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          message: userMessage,
          carSlug: selectedCar?.slug,
          userId: user?.id,
          conversationId: currentConversationId,
          history: messages.slice(-6),
          attachments: messageAttachments.map((a) => ({
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
      // NOTE: Tool result tracking for future enhanced source display
      const _collectedToolResults = []; // Track tool results for sources
      const _toolsUsed = []; // Track which tools were used

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        let currentEventType = '';
        for (const line of lines) {
          // Parse SSE event type
          if (line.startsWith('event: ')) {
            currentEventType = line.slice(7).trim();
            continue;
          }

          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              // Handle different event types
              if (currentEventType === 'connected') {
                if (data.conversationId) {
                  newConversationId = data.conversationId;
                }
                // Update daily usage from connected event
                if (data.dailyUsage) {
                  setDailyUsage((prev) => ({
                    ...prev,
                    queriesToday: data.dailyUsage.queriesToday,
                    isBeta: data.dailyUsage.isBeta ?? prev.isBeta,
                    isUnlimited: data.dailyUsage.isUnlimited ?? prev.isUnlimited,
                  }));
                }
              } else if (currentEventType === 'text') {
                if (data.content) {
                  fullContent += data.content;
                  setStreamingContent(fullContent);
                  // Clear phase when text starts streaming (response is being generated)
                  setCurrentPhase(null);
                }
              } else if (currentEventType === 'phase') {
                // Update current processing phase (understanding, thinking, researching, formulating)
                if (data.phase && data.label) {
                  setCurrentPhase({ phase: data.phase, label: data.label });
                }
              } else if (currentEventType === 'tool_start') {
                // A tool is about to be called - add to active tools list
                if (data.tool && data.label) {
                  setActiveTools((prev) => {
                    // Avoid duplicates
                    if (prev.some((t) => t.name === data.tool)) return prev;
                    return [...prev, { name: data.tool, label: data.label, status: 'running' }];
                  });
                }
              } else if (currentEventType === 'tool_result') {
                // Tool completed - mark it as done
                if (data.tool) {
                  toolsUsed.push({
                    name: data.tool,
                    sources: data.sources || [], // Rich source data from backend (URLs, titles, etc.)
                  });
                  // Mark tool as completed in the UI
                  setActiveTools((prev) =>
                    prev.map((t) => (t.name === data.tool ? { ...t, status: 'completed' } : t))
                  );
                }
              } else if (currentEventType === 'done') {
                if (data.conversationId) {
                  newConversationId = data.conversationId;
                }
                // Update daily usage from done event
                if (data.dailyUsage) {
                  setDailyUsage((prev) => ({
                    ...prev,
                    queriesToday: data.dailyUsage.queriesToday,
                    isBeta: data.dailyUsage.isBeta ?? prev.isBeta,
                    isUnlimited: data.dailyUsage.isUnlimited ?? prev.isUnlimited,
                  }));
                }

                // Extract sources from tool usage for citation display
                // Use rich sources when available, fall back to generic labels
                const sources = toolsUsed
                  .flatMap((toolInfo, toolIdx) => {
                    const toolName = typeof toolInfo === 'string' ? toolInfo : toolInfo.name;
                    const toolSources = typeof toolInfo === 'object' ? toolInfo.sources : [];

                    // Use rich sources if available (URLs, titles, etc.)
                    if (toolSources && toolSources.length > 0) {
                      return toolSources;
                    }
                    // Fall back to generic labels from tool name
                    return [
                      {
                        id: toolIdx + 1,
                        type: getSourceTypeFromTool(toolName),
                        label: getSourceLabelFromTool(toolName),
                        detail: toolName.replace(/_/g, ' '),
                      },
                    ];
                  })
                  .map((s, idx) => ({ ...s, id: idx + 1 })); // Re-index for display

                // Add message with sources and timestamp
                // Extract tool names for backwards compatibility
                const toolNames = toolsUsed.map((t) => (typeof t === 'string' ? t : t.name));
                setMessages([
                  ...newMessages,
                  {
                    role: 'assistant',
                    content: fullContent,
                    sources: sources.length > 0 ? sources : undefined,
                    toolsUsed: toolNames.length > 0 ? toolNames : undefined,
                    timestamp: new Date().toISOString(),
                  },
                ]);
                setStreamingContent('');
                setCurrentConversationId(newConversationId);

                // Show points notification for asking AL
                showPointsEarned(10, 'Asked AL');
              }

              // Legacy fallback for non-typed events
              if (!currentEventType) {
                if (data.conversationId) {
                  newConversationId = data.conversationId;
                }
                if (data.content) {
                  fullContent += data.content;
                  setStreamingContent(fullContent);
                }
                if (data.done) {
                  setMessages([
                    ...newMessages,
                    {
                      role: 'assistant',
                      content: fullContent,
                      timestamp: new Date().toISOString(),
                    },
                  ]);
                  setStreamingContent('');
                  setCurrentConversationId(newConversationId);
                }
              }

              currentEventType = ''; // Reset for next event
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        // Determine error type for user-friendly message
        let errorMessage = 'Sorry, something went wrong. Please try again.';
        let errorType = 'unknown';

        if (err.message?.includes('rate limit') || err.message?.includes('429')) {
          errorMessage = 'Rate limit reached. Please wait a moment before trying again.';
          errorType = 'rate_limit';
        } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
          errorType = 'network';
        } else if (err.message?.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
          errorType = 'timeout';
        }

        setError({ message: errorMessage, type: errorType, canRetry: true });
        console.error('AL error:', err);
      }
    } finally {
      setIsLoading(false);
      setActiveTools([]); // Clear tool activity indicators
      setCurrentPhase(null); // Clear phase indicator
    }
  };

  // Keep ref updated for useCallback that references sendMessage
  sendMessageRef.current = sendMessage;

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

  // Handle feedback submission
  const handleFeedback = async (messageIndex, rating) => {
    const message = messages[messageIndex];
    if (!message || !user?.id) return;

    setFeedbackGiven((prev) => ({ ...prev, [messageIndex]: rating }));

    // Map rating to feedbackType expected by alFeedbackService
    const feedbackType = rating === 'positive' ? 'thumbs_up' : 'thumbs_down';

    // Find the preceding user message for context
    let queryText = null;
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        queryText = messages[i].content;
        break;
      }
    }

    // Submit feedback to the proper AL feedback route
    try {
      await fetch('/api/al/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: `${currentConversationId}-${messageIndex}`, // Composite ID for tracking
          conversationId: currentConversationId,
          feedbackType,
          queryText,
          responseText: message.content?.substring(0, 2000), // Truncate for storage
          toolsUsed: message.toolsUsed || [],
        }),
      });
    } catch (err) {
      console.warn('[AL Feedback] Failed to submit:', err);
    }

    // Show enhanced feedback modal for negative feedback
    if (rating === 'negative') {
      setFeedbackModal({ isOpen: true, messageIndex, type: 'negative' });
    }
  };

  // Submit enhanced feedback from modal
  const submitEnhancedFeedback = async (feedbackData) => {
    const { tags, feedbackText, dimensions } = feedbackData;
    const { messageIndex, type } = feedbackModal;

    if (tags.length === 0 && !feedbackText && !dimensions) {
      return;
    }

    const message = messages[messageIndex];
    const feedbackType = type === 'positive' ? 'thumbs_up' : 'thumbs_down';

    // Find the preceding user message for context
    let queryText = null;
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        queryText = messages[i].content;
        break;
      }
    }

    // Map tags to feedbackCategory (use first tag as primary category)
    const feedbackCategory = tags.length > 0 ? tags[0] : null;

    try {
      await fetch('/api/al/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: `${currentConversationId}-${messageIndex}`,
          conversationId: currentConversationId,
          feedbackType,
          feedbackCategory,
          feedbackReason: feedbackText,
          queryText,
          responseText: message?.content?.substring(0, 2000),
          toolsUsed: message?.toolsUsed || [],
        }),
      });
    } catch (err) {
      console.warn('[AL Feedback] Failed to submit enhanced feedback:', err);
    }
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
            Get personalized car recommendations, learn about modifications, compare models, and get
            expert automotive advice.
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

  // Loading auth - with safety timeout to prevent stuck state
  if (authLoading && !loadingTimedOut) {
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
    const displayedConversations = searchResults !== null ? searchResults : conversations;

    return (
      <div className={styles.container}>
        <div className={styles.historyView}>
          <div className={styles.historyHeader}>
            <LocalIcons.history size={18} />
            <span>HISTORY</span>
            <button
              className={styles.closeHistoryBtn}
              onClick={() => {
                setShowHistory(false);
                setHistorySearchQuery('');
                setSearchResults(null);
              }}
            >
              ✕
            </button>
          </div>

          {/* Search bar */}
          <div className={styles.historySearch}>
            <LocalIcons.search size={16} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={historySearchQuery}
              onChange={(e) => {
                setHistorySearchQuery(e.target.value);
                if (e.target.value.length > 2) {
                  handleSearchConversations(e.target.value);
                } else if (e.target.value.length === 0) {
                  setSearchResults(null);
                }
              }}
              className={styles.historySearchInput}
            />
            {historySearchQuery && (
              <button
                className={styles.clearSearchBtn}
                onClick={() => {
                  setHistorySearchQuery('');
                  setSearchResults(null);
                }}
              >
                <LocalIcons.x size={14} />
              </button>
            )}
          </div>

          <PullToRefresh onRefresh={refetchConversations}>
            <div className={styles.conversationsList}>
              {conversationsLoading || isSearchingHistory ? (
                <div className={styles.loadingConversations}>Loading...</div>
              ) : displayedConversations.length === 0 ? (
                <div className={styles.noConversations}>
                  {searchResults !== null ? (
                    <>
                      <p>No matching conversations</p>
                      <p className={styles.noConversationsHint}>Try different keywords</p>
                    </>
                  ) : (
                    <>
                      <p>No conversations yet</p>
                      <p className={styles.noConversationsHint}>Start chatting with AL!</p>
                    </>
                  )}
                </div>
              ) : (
                displayedConversations.map((conv) => (
                  <button
                    key={conv.id}
                    type="button"
                    className={`${styles.conversationItem} ${conv.id === currentConversationId ? styles.conversationItemActive : ''} ${isLoadingConversationDirect && selectedConversationId === conv.id ? styles.conversationItemLoading : ''}`}
                    onClick={() => !isLoadingConversationDirect && loadConversation(conv.id)}
                    disabled={isLoadingConversationDirect}
                  >
                    <div className={styles.conversationContent}>
                      <span className={styles.conversationTitle}>
                        {conv.title || 'New conversation'}
                      </span>
                      {conv.preview && (
                        <span className={styles.conversationPreview}>{conv.preview}</span>
                      )}
                      {isLoadingConversationDirect && selectedConversationId === conv.id && (
                        <span className={styles.conversationLoading}>Loading...</span>
                      )}
                    </div>
                    <div className={styles.conversationMeta}>
                      <span className={styles.conversationDate}>{formatDate(conv.created_at)}</span>
                      <span
                        role="button"
                        tabIndex={0}
                        className={styles.deleteConversationBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setDeleteConfirm({ conversationId: conv.id, title: conv.title });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation();
                            e.preventDefault();
                            setDeleteConfirm({ conversationId: conv.id, title: conv.title });
                          }
                        }}
                        title="Delete conversation"
                      >
                        <LocalIcons.trash size={14} />
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </PullToRefresh>
        </div>

        {/* Delete confirmation modal */}
        {deleteConfirm && (
          <div className={styles.deleteModal}>
            <div className={styles.deleteModalContent}>
              <h3>Delete conversation?</h3>
              <p>"{deleteConfirm.title || 'This conversation'}" will be permanently deleted.</p>
              <div className={styles.deleteModalActions}>
                <button className={styles.deleteModalCancel} onClick={() => setDeleteConfirm(null)}>
                  Cancel
                </button>
                <button
                  className={styles.deleteModalConfirm}
                  onClick={() => handleDeleteConversation(deleteConfirm.conversationId)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
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
            refetchConversations();
            setShowHistory(true);
          }}
          title="Chat history"
        >
          <LocalIcons.history size={18} />
        </button>

        {/* Daily query counter - centered in header */}
        <ALQueryCounter
          queriesToday={dailyUsage.queriesToday}
          isBeta={dailyUsage.isBeta}
          isUnlimited={dailyUsage.isUnlimited}
        />

        <div className={styles.headerRight}>
          {/* Share button - only show when there's a saved conversation */}
          {messages.length > 0 && currentConversationId && (
            <button
              className={styles.settingsBtn}
              onClick={generateShareLink}
              disabled={isSharing}
              title="Share conversation"
            >
              <LocalIcons.share size={18} />
            </button>
          )}

          <button
            className={styles.settingsBtn}
            onClick={() => setShowPreferences(!showPreferences)}
            title="AL preferences"
          >
            <LocalIcons.settings size={18} />
          </button>

          <button className={styles.newChatHeaderBtn} onClick={startNewChat} title="New chat">
            <LocalIcons.newChat size={18} />
          </button>
        </div>
      </div>

      {/* Preferences Panel */}
      {showPreferences && (
        <div className={styles.preferencesOverlay} data-overlay-modal>
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
          // Empty state OR pending prompt
          <div className={styles.emptyState}>
            {pendingPrompt ? (
              // Pending prompt confirmation card
              <div className={styles.pendingPromptCard}>
                <ALMascot size={64} />
                {pendingPrompt.context?.carName && (
                  <span className={styles.pendingPromptCar}>{pendingPrompt.context.carName}</span>
                )}
                <p className={styles.pendingPromptText}>{pendingPrompt.displayMessage}</p>
                <div className={styles.pendingPromptActions}>
                  <button className={styles.pendingPromptSend} onClick={handleSendPendingPrompt}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 19V5M5 12L12 5L19 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    SEND
                  </button>
                  <button
                    className={styles.pendingPromptDismiss}
                    onClick={handleDismissPendingPrompt}
                    aria-label="Dismiss"
                  >
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <path
                        d="M18 6L6 18M6 6l12 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
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
                  {selectedCar
                    ? `Ask me anything about your ${selectedCar.name}`
                    : 'Ask me anything about cars'}
                </p>
              </div>
            )}
          </div>
        ) : (
          // Messages
          <div className={styles.messages}>
            {messages.map((msg, i) => {
              const isAL = isAssistantMessage(msg);
              return (
                <div
                  key={i}
                  className={`${styles.message} ${isAL ? styles.assistantMessage : styles.userMessage}`}
                >
                  {isAL && (
                    <Image
                      src={UI_IMAGES.alMascotFull}
                      alt="AL"
                      width={32}
                      height={32}
                      className={styles.messageAvatar}
                    />
                  )}
                  <div className={styles.messageContent}>
                    {/* Show attachment thumbnails for user messages */}
                    {!isAL && msg.attachments?.length > 0 && (
                      <div className={styles.messageAttachments}>
                        {msg.attachments.map((att, idx) =>
                          att.file_type?.startsWith('image/') ? (
                            <Image
                              key={idx}
                              src={att.public_url}
                              alt={att.file_name}
                              width={80}
                              height={80}
                              className={styles.attachmentThumbnail}
                              style={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <div key={idx} className={styles.attachmentDoc}>
                              📄 {att.file_name}
                            </div>
                          )
                        )}
                      </div>
                    )}
                    {isAL ? (
                      <>
                        <FormattedMessage content={msg.content} />
                        {/* Sources list - Perplexity-style citations */}
                        {msg.sources && msg.sources.length > 0 && (
                          <ALSourcesList sources={msg.sources} />
                        )}
                      </>
                    ) : (
                      msg.content
                    )}

                    {/* Action buttons for AL messages - ALWAYS visible */}
                    {isAL && (
                      <div className={styles.messageActions}>
                        {/* Copy button */}
                        <button
                          className={`${styles.actionBtn} ${copiedMessageIndex === i ? styles.actionBtnActive : ''}`}
                          onClick={() => handleCopyMessage(i)}
                          title={copiedMessageIndex === i ? 'Copied!' : 'Copy message'}
                          aria-label="Copy message"
                        >
                          {copiedMessageIndex === i ? (
                            <span className={styles.copiedCheck}>✓</span>
                          ) : (
                            <LocalIcons.copy size={14} />
                          )}
                        </button>

                        {/* Regenerate button - only on the last assistant message */}
                        {i === messages.length - 1 && lastUserMessage && !isLoading && (
                          <button
                            className={styles.actionBtn}
                            onClick={handleRegenerate}
                            title="Regenerate response"
                            aria-label="Regenerate response"
                          >
                            <LocalIcons.refresh size={14} />
                          </button>
                        )}

                        {/* Divider */}
                        <span className={styles.actionDivider} />

                        {/* Feedback buttons */}
                        {feedbackGiven[i] ? (
                          <span className={styles.feedbackThanks}>
                            {feedbackGiven[i] === 'positive' ? (
                              <>
                                <LocalIcons.thumbsUp size={14} /> Thanks!
                              </>
                            ) : (
                              <>
                                <LocalIcons.thumbsDown size={14} /> Thanks
                              </>
                            )}
                          </span>
                        ) : (
                          <>
                            <button
                              className={styles.actionBtn}
                              onClick={() => handleFeedback(i, 'positive')}
                              title="Good response"
                              aria-label="Thumbs up - good response"
                            >
                              <LocalIcons.thumbsUp size={14} />
                            </button>
                            <button
                              className={styles.actionBtn}
                              onClick={() => handleFeedback(i, 'negative')}
                              title="Bad response"
                              aria-label="Thumbs down - bad response"
                            >
                              <LocalIcons.thumbsDown size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Timestamp */}
                    {msg.timestamp && (
                      <span className={styles.messageTimestamp}>
                        {formatRelativeTime(msg.timestamp)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {streamingContent && (
              <div className={`${styles.message} ${styles.assistantMessage}`}>
                <Image
                  src={UI_IMAGES.alMascotFull}
                  alt="AL"
                  width={32}
                  height={32}
                  className={styles.messageAvatar}
                />
                <div className={styles.messageContent}>
                  <FormattedMessage content={streamingContent} />
                </div>
              </div>
            )}

            {isLoading && !streamingContent && (
              <div
                className={`${styles.message} ${styles.assistantMessage} ${styles.loadingMessage}`}
              >
                <Image
                  src={UI_IMAGES.alMascotFull}
                  alt="AL"
                  width={32}
                  height={32}
                  className={styles.messageAvatar}
                />
                <div className={styles.messageContent}>
                  <div className={styles.processingStatus}>
                    {/* Show current phase */}
                    {currentPhase && (
                      <div className={styles.phaseIndicator}>
                        <span className={styles.phaseDot} />
                        <span className={styles.phaseLabel}>{currentPhase.label}</span>
                      </div>
                    )}

                    {/* Show active tools with status */}
                    {activeTools.length > 0 && (
                      <div className={styles.toolActivity}>
                        {activeTools.map((tool, idx) => (
                          <div
                            key={`${tool.name}-${idx}`}
                            className={`${styles.toolActivityItem} ${tool.status === 'completed' ? styles.toolCompleted : ''}`}
                          >
                            <span
                              className={
                                tool.status === 'completed'
                                  ? styles.toolCheckmark
                                  : styles.toolSpinner
                              }
                            />
                            <span>{tool.label}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Fallback when no phase or tools yet */}
                    {!currentPhase && activeTools.length === 0 && (
                      <span className={styles.thinking}>Thinking...</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className={styles.errorMessage}>
                <span className={styles.errorText}>
                  {typeof error === 'string' ? error : error.message}
                </span>
                {typeof error === 'object' && error.canRetry && lastUserMessage && (
                  <button
                    className={styles.retryBtn}
                    onClick={() => {
                      setError(null);
                      if (sendMessageRef.current) {
                        sendMessageRef.current(lastUserMessage);
                      }
                    }}
                  >
                    <LocalIcons.refresh size={14} />
                    Try again
                  </button>
                )}
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
              <LocalIcons.camera size={18} />
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

          {/* Voice Input Button */}
          {voiceSupported && (
            <button
              className={`${styles.voiceBtn} ${isListening ? styles.voiceBtnActive : ''}`}
              onClick={toggleVoiceInput}
              title={isListening ? 'Stop listening' : 'Voice input'}
              aria-label={isListening ? 'Stop listening' : 'Start voice input'}
              disabled={isLoading}
            >
              <LocalIcons.mic size={18} />
            </button>
          )}

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Auto-resize textarea
              const textarea = e.target;
              textarea.style.height = 'auto';
              textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
            }}
            onKeyDown={(e) => {
              // Cmd/Ctrl + Enter or just Enter (without shift) to send
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!isLoading) {
                  sendMessage();
                }
              }
              // Escape to stop generation or clear input
              if (e.key === 'Escape') {
                if (isLoading) {
                  stopGeneration();
                } else if (input) {
                  setInput('');
                  // Reset textarea height
                  e.target.style.height = 'auto';
                }
              }
              // Up arrow to edit last message (when input is empty)
              if (e.key === 'ArrowUp' && !input && messages.length > 0) {
                // Find last user message
                for (let i = messages.length - 1; i >= 0; i--) {
                  if (messages[i].role === 'user') {
                    setInput(messages[i].content);
                    break;
                  }
                }
              }
            }}
            placeholder={selectedCar ? `Ask about ${selectedCar.name}...` : 'Ask AL anything...'}
            className={styles.input}
            rows={1}
            disabled={isLoading}
          />
          {/* Show stop button when loading, send button otherwise */}
          {isLoading ? (
            <button
              onClick={stopGeneration}
              className={styles.stopBtn}
              aria-label="Stop generation"
              title="Stop generation (Esc)"
            >
              <LocalIcons.stop size={16} />
            </button>
          ) : (
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() && attachments.length === 0}
              className={styles.sendBtn}
              aria-label="Send"
              title="Send message (Enter)"
            >
              <LocalIcons.arrowUp size={18} />
            </button>
          )}
        </div>
      </div>

      <AuthModal
        isOpen={authModal.isOpen}
        onClose={authModal.close}
        defaultMode={authModal.defaultMode}
      />

      {/* Enhanced Feedback Modal */}
      <FeedbackDimensionsModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal({ isOpen: false, messageIndex: null, type: null })}
        onSubmit={submitEnhancedFeedback}
        feedbackType={feedbackModal.type || 'negative'}
      />

      {/* Share Modal */}
      {showShareModal && (
        <div className={styles.shareModal}>
          <div className={styles.shareModalContent}>
            <button className={styles.shareModalClose} onClick={() => setShowShareModal(false)}>
              <LocalIcons.x size={18} />
            </button>
            <h3>Share Conversation</h3>
            <p>Anyone with this link can view this conversation.</p>
            <div className={styles.shareUrlBox}>
              <input type="text" value={shareUrl || ''} readOnly className={styles.shareUrlInput} />
              <button className={styles.copyUrlBtn} onClick={copyShareUrl}>
                <LocalIcons.copy size={16} />
                Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
