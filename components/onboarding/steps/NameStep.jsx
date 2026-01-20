'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './NameStep.module.css';

/**
 * NameStep Component
 * Asks the user what we should call them
 */
export default function NameStep({ className, formData, updateFormData }) {
  const [name, setName] = useState(formData.display_name || '');
  const inputRef = useRef(null);
  
  // Auto-focus the input
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);
  
  const handleChange = (e) => {
    const value = e.target.value;
    setName(value);
    updateFormData({ display_name: value });
  };
  
  return (
    <div className={`${className || ''} ${styles.container}`}>
      <div className={styles.content}>
        <h2 className={styles.title}>
          What should we call you?
        </h2>
        
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder="Your name"
          value={name}
          onChange={handleChange}
          maxLength={50}
          autoComplete="given-name"
        />
        
        <p className={styles.hint}>
          First name is fine
        </p>
      </div>
    </div>
  );
}
