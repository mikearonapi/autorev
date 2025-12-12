'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './AIMechanic.module.css';
import { useAuth } from '@/components/providers/AuthProvider';

/**
 * Icons
 */
const Icons = {
  bot: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2"/>
      <circle cx="12" cy="5" r="2"/>
      <path d="M12 7v4"/>
      <line x1="8" y1="16" x2="8" y2="16"/>
      <line x1="16" y1="16" x2="16" y2="16"/>
    </svg>
  ),
  send: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  x: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  minimize: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  user: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  loader: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.spinIcon}>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
      <path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="1"/>
    </svg>
  ),
};

/**
 * Suggested prompts for quick access
 */
const SUGGESTED_PROMPTS = [
  "What oil should I use?",
  "What's the service schedule?",
  "Common issues to watch for?",
  "What mods give the best value?",
];

/**
 * Message component
 */
function Message({ message, isUser }) {
  return (
    <div className={`${styles.message} ${isUser ? styles.userMessage : styles.botMessage}`}>
      <div className={styles.messageAvatar}>
        {isUser ? <Icons.user size={16} /> : <Icons.bot size={16} />}
      </div>
      <div className={styles.messageContent}>
        <div className={styles.messageText}>{message.content}</div>
        <div className={styles.messageTime}>
          {new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * AI Mechanic Chat Component
 */
export default function AIMechanic({ isOpen, onClose, carContext }) {
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [maintenanceSpecs, setMaintenanceSpecs] = useState(null);

  // Fetch maintenance specs when car context changes
  useEffect(() => {
    const fetchSpecs = async () => {
      if (carContext?.slug) {
        try {
          const response = await fetch(`/api/cars/${carContext.slug}/maintenance`);
          const data = await response.json();
          if (data.success && data.data?.specs) {
            setMaintenanceSpecs(data.data.specs);
          }
        } catch (err) {
          console.warn('[AIMechanic] Could not fetch maintenance specs:', err);
        }
      } else {
        setMaintenanceSpecs(null);
      }
    };
    
    fetchSpecs();
  }, [carContext?.slug]);

  // Initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = carContext 
        ? `Hey! I'm your AI Mechanic. I see you're looking at the ${carContext.name}. What would you like to know about this car? I can help with maintenance schedules, fluid specs, common issues, modifications, and more!`
        : "Hey! I'm your AI Mechanic. Ask me anything about sports cars, maintenance, modifications, or buying advice!";
      
      setMessages([{
        id: 'greeting',
        role: 'assistant',
        content: greeting,
        timestamp: Date.now(),
      }]);
    }
  }, [isOpen, carContext, messages.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Send message
  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-mechanic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          carContext: carContext ? {
            name: carContext.name,
            slug: carContext.slug,
            year: carContext.years,
            hp: carContext.hp,
            engine: carContext.engine,
          } : null,
          maintenanceSpecs: maintenanceSpecs,
          history: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const botMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.response || "I'm sorry, I couldn't process that. Please try again.",
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error('[AIMechanic] Error:', err);
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, carContext, maintenanceSpecs, messages]);

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  // Handle suggested prompt click
  const handleSuggestedPrompt = (prompt) => {
    sendMessage(prompt);
  };

  if (!isOpen) return null;

  return (
    <div className={`${styles.container} ${isMinimized ? styles.minimized : ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <div className={styles.headerIcon}>
            <Icons.bot size={20} />
          </div>
          <div>
            <span className={styles.headerTitle}>AI Mechanic</span>
            {carContext && (
              <span className={styles.headerContext}>{carContext.name}</span>
            )}
          </div>
        </div>
        <div className={styles.headerActions}>
          <button 
            className={styles.headerBtn}
            onClick={() => setIsMinimized(!isMinimized)}
            aria-label={isMinimized ? 'Expand' : 'Minimize'}
          >
            <Icons.minimize size={18} />
          </button>
          <button 
            className={styles.headerBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <Icons.x size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className={styles.messages}>
            {messages.map(message => (
              <Message 
                key={message.id} 
                message={message} 
                isUser={message.role === 'user'} 
              />
            ))}
            
            {isLoading && (
              <div className={styles.loadingMessage}>
                <div className={styles.messageAvatar}>
                  <Icons.bot size={16} />
                </div>
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts */}
          {messages.length <= 1 && (
            <div className={styles.suggestions}>
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  className={styles.suggestionBtn}
                  onClick={() => handleSuggestedPrompt(prompt)}
                  disabled={isLoading}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className={styles.inputForm}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className={styles.input}
              disabled={isLoading}
            />
            <button
              type="submit"
              className={styles.sendBtn}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? <Icons.loader size={18} /> : <Icons.send size={18} />}
            </button>
          </form>

          {/* Auth prompt removed for testing */}
        </>
      )}
    </div>
  );
}

/**
 * Floating trigger button for AI Mechanic
 */
export function AIMechanicTrigger({ onClick, hasUnread = false }) {
  return (
    <button className={styles.trigger} onClick={onClick} aria-label="Open AI Mechanic">
      <Icons.bot size={24} />
      {hasUnread && <span className={styles.triggerBadge}></span>}
    </button>
  );
}
