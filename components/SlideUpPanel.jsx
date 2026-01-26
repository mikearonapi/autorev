'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

import { createPortal } from 'react-dom';

import styles from './SlideUpPanel.module.css';

/**
 * SlideUpPanel - Native iOS/Android style slide-up panel
 * 
 * Inspired by GRAVL's workout detail views:
 * - Full-height slide-up animation
 * - Drag handle for swipe-to-dismiss
 * - Backdrop overlay with blur
 * - Supports custom height (full, half, auto)
 * 
 * Usage:
 * <SlideUpPanel isOpen={isOpen} onClose={handleClose} title="Build Details">
 *   <YourContent />
 * </SlideUpPanel>
 */

const SWIPE_THRESHOLD = 100; // px to trigger close

export default function SlideUpPanel({
  isOpen,
  onClose,
  title,
  children,
  height = 'full', // 'full' | 'half' | 'auto'
  showHandle = true,
  showHeader = true,
  className = '',
}) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);
  
  // Mount check for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  // Lock body scroll when open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);
  
  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  
  // Touch handlers for swipe-to-dismiss
  const handleTouchStart = useCallback((e) => {
    if (!showHandle) return;
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  }, [showHandle]);
  
  const handleTouchMove = useCallback((e) => {
    if (!isDragging.current || !panelRef.current) return;
    
    currentY.current = e.touches[0].clientY - startY.current;
    
    // Only allow dragging down
    if (currentY.current > 0) {
      panelRef.current.style.transform = `translateY(${currentY.current}px)`;
      panelRef.current.style.transition = 'none';
    }
  }, []);
  
  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current || !panelRef.current) return;
    
    isDragging.current = false;
    panelRef.current.style.transition = '';
    panelRef.current.style.transform = '';
    
    // Close if dragged past threshold
    if (currentY.current > SWIPE_THRESHOLD) {
      onClose?.();
    }
    
    currentY.current = 0;
  }, [onClose]);
  
  // Handle backdrop click
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  }, [onClose]);
  
  // Height classes
  const heightClass = {
    full: styles.heightFull,
    half: styles.heightHalf,
    auto: styles.heightAuto,
  }[height] || styles.heightFull;
  
  if (!mounted) return null;
  
  const panel = (
    <div 
      className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`}
      onClick={handleBackdropClick}
      aria-hidden={!isOpen}
      {...(isOpen && { 'data-overlay-modal': true })}
    >
      <div
        ref={panelRef}
        className={`${styles.panel} ${heightClass} ${isOpen ? styles.panelOpen : ''} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Panel'}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle */}
        {showHandle && (
          <div className={styles.handleArea}>
            <div className={styles.handle} />
          </div>
        )}
        
        {/* Header */}
        {showHeader && title && (
          <header className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close panel"
            >
              <CloseIcon />
            </button>
          </header>
        )}
        
        {/* Content */}
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
  
  // Render in portal for proper stacking
  return createPortal(panel, document.body);
}

// Close Icon
const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
