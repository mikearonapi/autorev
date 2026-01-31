'use client';

/**
 * TypingAnimation Component
 *
 * Client component that displays a typing animation effect for AL sample questions.
 * Extracted from homepage to allow the main page to be a Server Component.
 *
 * @param {Object} props
 * @param {string[]} props.questions - Array of questions to cycle through
 */

import { useState, useEffect } from 'react';

import { Icons } from '@/components/ui/Icons';

import styles from './TypingAnimation.module.css';

export default function TypingAnimation({ questions }) {
  const [typedText, setTypedText] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  // Typing animation effect
  useEffect(() => {
    const currentQuestion = questions[questionIndex];
    let charIndex = 0;
    let timeout;

    if (isTyping) {
      // Type characters one by one
      const typeChar = () => {
        if (charIndex <= currentQuestion.length) {
          setTypedText(currentQuestion.slice(0, charIndex));
          charIndex++;
          timeout = setTimeout(typeChar, 50 + Math.random() * 30); // Natural typing speed
        } else {
          // Pause at end of question, then clear and move to next
          timeout = setTimeout(() => {
            setIsTyping(false);
          }, 2000);
        }
      };
      typeChar();
    } else {
      // Clear text and move to next question
      timeout = setTimeout(() => {
        setTypedText('');
        setQuestionIndex((prev) => (prev + 1) % questions.length);
        setIsTyping(true);
      }, 500);
    }

    return () => clearTimeout(timeout);
  }, [questionIndex, isTyping, questions]);

  return (
    <div className={styles.alInputDemo}>
      <div className={styles.alInputWrapper}>
        <button className={styles.alAttachmentBtn} aria-label="Add attachment">
          <Icons.camera size={18} />
        </button>
        <div className={styles.alInputText}>
          {typedText || <span className={styles.alInputPlaceholder}>Ask AL anything...</span>}
          <span className={styles.alCursor} />
        </div>
        <button
          className={`${styles.alSendBtn} ${typedText ? styles.alSendBtnActive : ''}`}
          aria-label="Send"
        >
          <Icons.arrowUp size={18} />
        </button>
      </div>
    </div>
  );
}
