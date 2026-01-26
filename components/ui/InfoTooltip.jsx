'use client';

/**
 * InfoTooltip Component
 * 
 * A lightweight educational tooltip that shows an info icon (ⓘ) next to labels.
 * Tapping opens a compact modal with educational content.
 * 
 * Usage:
 *   import InfoTooltip from '@/components/ui/InfoTooltip';
 *   
 *   <InfoTooltip topicKey="hp" carName="BMW M3" carSlug="bmw-m3">
 *     <span>Horsepower</span>
 *   </InfoTooltip>
 */

import { useState } from 'react';

import { WHY_CONTENT } from '@/data/whyContent';

import { Icons } from './Icons';
import styles from './InfoTooltip.module.css';
import Modal from './Modal';

/**
 * InfoTooltip - Educational tooltip with modal
 * 
 * @param {string} topicKey - Key from WHY_CONTENT (e.g., 'hp', 'torque', 'lapTimeEstimate')
 * @param {React.ReactNode} children - The label content to display
 * @param {string} carName - Optional car name for AL context
 * @param {string} carSlug - Optional car slug for AL context
 * @param {string} className - Additional CSS classes for the wrapper
 * @param {'inline' | 'block'} variant - Layout variant (default: 'inline')
 */
export default function InfoTooltip({
  topicKey,
  children,
  carName,
  carSlug,
  className = '',
  variant = 'inline',
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  const content = WHY_CONTENT[topicKey];
  
  // If no content found for this topic, just render children without tooltip
  if (!content) {
    console.warn(`[InfoTooltip] No content found for topicKey: ${topicKey}`);
    return <span className={className}>{children}</span>;
  }
  
  const handleOpen = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(true);
  };
  
  const handleClose = () => {
    setIsOpen(false);
  };
  
  return (
    <>
      <span className={`${styles.trigger} ${styles[variant]} ${className}`}>
        {children}
        <button
          type="button"
          className={styles.infoButton}
          onClick={handleOpen}
          aria-label={`Learn more about ${content.title}`}
          title={`Learn more about ${content.title}`}
        >
          <Icons.info size={14} />
        </button>
      </span>
      
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={content.title}
        size="sm"
      >
        <div className={styles.modalContent}>
          {/* Definition */}
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>What is it?</h4>
            <p className={styles.sectionText}>{content.definition}</p>
          </section>
          
          {/* Why it matters */}
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Why it matters</h4>
            <p className={styles.sectionText}>{content.whyMatters}</p>
          </section>
          
          {/* What affects it */}
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>What affects it</h4>
            <p className={styles.sectionText}>{content.whatAffects}</p>
          </section>
          
        </div>
      </Modal>
    </>
  );
}

/**
 * InfoTooltipIcon - Standalone info icon trigger (for cases where you need more control)
 */
export function InfoTooltipIcon({
  topicKey,
  carName,
  carSlug,
  size = 14,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  const content = WHY_CONTENT[topicKey];
  
  if (!content) {
    return null;
  }
  
  const handleOpen = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(true);
  };
  
  return (
    <>
      <button
        type="button"
        className={`${styles.standaloneIcon} ${className}`}
        onClick={handleOpen}
        aria-label={`Learn more about ${content.title}`}
        title={`Learn more about ${content.title}`}
      >
        <Icons.info size={size} />
      </button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={content.title}
        size="sm"
      >
        <div className={styles.modalContent}>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>What is it?</h4>
            <p className={styles.sectionText}>{content.definition}</p>
          </section>
          
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Why it matters</h4>
            <p className={styles.sectionText}>{content.whyMatters}</p>
          </section>
          
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>What affects it</h4>
            <p className={styles.sectionText}>{content.whatAffects}</p>
          </section>
          
        </div>
      </Modal>
    </>
  );
}
