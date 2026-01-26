'use client';

/**
 * Base Modal Component
 * 
 * A reusable modal primitive that handles:
 * - Portal rendering (renders at document.body level)
 * - ESC key to close
 * - Click outside to close
 * - Body scroll lock
 * - Accessible focus management
 * 
 * Usage:
 *   import Modal from '@/components/ui/Modal';
 *   
 *   <Modal isOpen={isOpen} onClose={handleClose} title="My Modal">
 *     <p>Modal content here</p>
 *   </Modal>
 * 
 * Or with compound components:
 *   <Modal isOpen={isOpen} onClose={handleClose}>
 *     <Modal.Header>Custom Header</Modal.Header>
 *     <Modal.Body>Content</Modal.Body>
 *     <Modal.Footer>
 *       <button onClick={handleClose}>Close</button>
 *     </Modal.Footer>
 *   </Modal>
 */

import { useEffect, useCallback, useRef } from 'react';

import { createPortal } from 'react-dom';

import { Icons } from './Icons';
import styles from './Modal.module.css';

/**
 * Modal Component
 * 
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Callback when modal should close
 * @param {string} title - Optional title for the modal header
 * @param {React.ReactNode} children - Modal content
 * @param {'sm' | 'md' | 'lg' | 'xl' | 'full'} size - Modal size variant
 * @param {boolean} closeOnEsc - Close when ESC key is pressed (default: true)
 * @param {boolean} closeOnOverlay - Close when clicking overlay (default: true)
 * @param {boolean} showCloseButton - Show X button in header (default: true)
 * @param {string} className - Additional CSS class for the modal container
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnEsc = true,
  closeOnOverlay = true,
  showCloseButton = true,
  className = '',
}) {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEsc, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    
    // Get scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (!isOpen) return;
    
    // Store previously focused element
    previousActiveElement.current = document.activeElement;
    
    // Focus the modal
    if (modalRef.current) {
      modalRef.current.focus();
    }
    
    return () => {
      // Restore focus when modal closes
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen]);

  // Handle overlay click
  const handleOverlayClick = useCallback((e) => {
    if (closeOnOverlay && e.target === e.currentTarget) {
      onClose();
    }
  }, [closeOnOverlay, onClose]);

  // Don't render if not open
  if (!isOpen) return null;

  // Don't render on server
  if (typeof window === 'undefined') return null;

  const modalContent = (
    <div 
      className={styles.overlay} 
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      data-overlay-modal
    >
      <div 
        ref={modalRef}
        className={`${styles.modal} ${styles[size]} ${className}`}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Header with title and close button */}
        {(title || showCloseButton) && (
          <div className={styles.header}>
            {title && (
              <h2 id="modal-title" className={styles.title}>
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button 
                className={styles.closeButton} 
                onClick={onClose}
                aria-label="Close modal"
                type="button"
              >
                <Icons.x size={20} />
              </button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// =============================================================================
// COMPOUND COMPONENTS
// =============================================================================

/**
 * Modal.Header - Custom header content
 */
Modal.Header = function ModalHeader({ children, className = '' }) {
  return (
    <div className={`${styles.customHeader} ${className}`}>
      {children}
    </div>
  );
};

/**
 * Modal.Body - Scrollable body content
 */
Modal.Body = function ModalBody({ children, className = '' }) {
  return (
    <div className={`${styles.body} ${className}`}>
      {children}
    </div>
  );
};

/**
 * Modal.Footer - Footer with actions
 */
Modal.Footer = function ModalFooter({ children, className = '' }) {
  return (
    <div className={`${styles.footer} ${className}`}>
      {children}
    </div>
  );
};

/**
 * Modal.Title - Styled title (for use within Modal.Header)
 */
Modal.Title = function ModalTitle({ children, className = '' }) {
  return (
    <h2 className={`${styles.title} ${className}`}>
      {children}
    </h2>
  );
};

/**
 * Modal.Description - Styled description text
 */
Modal.Description = function ModalDescription({ children, className = '' }) {
  return (
    <p className={`${styles.description} ${className}`}>
      {children}
    </p>
  );
};
