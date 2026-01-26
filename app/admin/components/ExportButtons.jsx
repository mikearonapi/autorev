'use client';

/**
 * Export Buttons Component
 * 
 * Download financial data in various formats.
 * Supports compact mode for inline display.
 */

import { useState, useRef, useEffect } from 'react';

import styles from './ExportButtons.module.css';

// SVG Icons
const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7,10 12,15 17,10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6,9 12,15 18,9"/>
  </svg>
);

const EXPORT_OPTIONS = [
  { id: 'monthly', label: 'Monthly Financials', description: 'All months P&L summary' },
  { id: 'costs', label: 'Cost Entries', description: 'Detailed cost breakdown' },
  { id: 'pl', label: 'P&L Statement', description: 'Current period P&L' },
  { id: 'users', label: 'User Data', description: 'User growth export' },
  { id: 'gl', label: 'Chart of Accounts', description: 'GL structure' },
];

export function ExportButtons({ token, year, month, compact = false }) {
  const [downloading, setDownloading] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleExport = async (type) => {
    setDownloading(type);
    setDropdownOpen(false);
    
    try {
      let url = `/api/admin/export?type=${type}&format=csv`;
      if (year) url += `&year=${year}`;
      if (month) url += `&month=${month}`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error('Export failed');
      
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const contentDisposition = res.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `export-${type}.csv`;
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export data. Please try again.');
    } finally {
      setDownloading(null);
    }
  };
  
  // Compact mode: dropdown button
  if (compact) {
    return (
      <div className={styles.compactWrapper} ref={dropdownRef}>
        <button 
          className={styles.compactButton}
          onClick={() => setDropdownOpen(!dropdownOpen)}
          disabled={downloading !== null}
        >
          <DownloadIcon />
          <span>Export</span>
          <ChevronDownIcon />
        </button>
        
        {dropdownOpen && (
          <div className={styles.dropdown}>
            {EXPORT_OPTIONS.map(opt => (
              <button
                key={opt.id}
                className={styles.dropdownItem}
                onClick={() => handleExport(opt.id)}
                disabled={downloading !== null}
              >
                <span className={styles.dropdownLabel}>{opt.label}</span>
                {downloading === opt.id && <span className={styles.spinnerSmall} />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  // Full mode: card grid
  return (
    <div className={styles.container}>
      <h4 className={styles.title}>Export Data</h4>
      <div className={styles.buttonGrid}>
        {EXPORT_OPTIONS.map(opt => (
          <button
            key={opt.id}
            className={styles.exportButton}
            onClick={() => handleExport(opt.id)}
            disabled={downloading !== null}
          >
            <span className={styles.buttonLabel}>{opt.label}</span>
            <span className={styles.buttonDesc}>{opt.description}</span>
            {downloading === opt.id && (
              <span className={styles.spinner}>⟳</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ExportButtons;

