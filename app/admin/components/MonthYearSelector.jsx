'use client';

/**
 * MonthYearSelector Component
 * 
 * Allows selecting specific months for financial data viewing.
 * Supports navigation between months with prev/next buttons.
 */

import { useMemo } from 'react';
import styles from './MonthYearSelector.module.css';

// Generate available months (from Dec 2025 onwards for this app)
function getAvailableMonths() {
  const months = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  // Start from December 2025 (first month with financial data)
  const startYear = 2025;
  const startMonth = 12;
  
  let year = startYear;
  let month = startMonth;
  
  while (year < currentYear || (year === currentYear && month <= currentMonth)) {
    months.push({ year, month });
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
  
  return months;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function MonthYearSelector({ 
  selectedMonth, 
  selectedYear, 
  onChange, 
  disabled = false,
  showAllTime = true 
}) {
  const availableMonths = useMemo(() => getAvailableMonths(), []);
  
  // Find current index in available months
  const currentIndex = useMemo(() => {
    if (!selectedMonth || !selectedYear) return -1; // "All Time" selected
    return availableMonths.findIndex(
      m => m.year === selectedYear && m.month === selectedMonth
    );
  }, [selectedMonth, selectedYear, availableMonths]);
  
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < availableMonths.length - 1 && currentIndex !== -1;
  const isAllTime = currentIndex === -1;
  
  const handlePrev = () => {
    if (!canGoPrev) return;
    const prev = availableMonths[currentIndex - 1];
    onChange(prev.month, prev.year);
  };
  
  const handleNext = () => {
    if (!canGoNext) return;
    const next = availableMonths[currentIndex + 1];
    onChange(next.month, next.year);
  };
  
  const handleSelectMonth = (e) => {
    const value = e.target.value;
    if (value === 'all') {
      onChange(null, null);
    } else {
      const [year, month] = value.split('-').map(Number);
      onChange(month, year);
    }
  };
  
  const displayLabel = isAllTime 
    ? 'All Time' 
    : `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;
  
  return (
    <div className={styles.container}>
      <div className={styles.selector}>
        {/* Previous Button */}
        <button
          type="button"
          className={styles.navButton}
          onClick={handlePrev}
          disabled={disabled || !canGoPrev || isAllTime}
          aria-label="Previous month"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15,18 9,12 15,6" />
          </svg>
        </button>
        
        {/* Month/Year Dropdown */}
        <select
          className={styles.dropdown}
          value={isAllTime ? 'all' : `${selectedYear}-${selectedMonth}`}
          onChange={handleSelectMonth}
          disabled={disabled}
          aria-label="Select month"
        >
          {showAllTime && (
            <option value="all">All Time</option>
          )}
          {availableMonths.map(({ year, month }) => (
            <option key={`${year}-${month}`} value={`${year}-${month}`}>
              {SHORT_MONTH_NAMES[month - 1]} {year}
            </option>
          ))}
        </select>
        
        {/* Next Button */}
        <button
          type="button"
          className={styles.navButton}
          onClick={handleNext}
          disabled={disabled || !canGoNext || isAllTime}
          aria-label="Next month"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9,6 15,12 9,18" />
          </svg>
        </button>
      </div>
      
      {/* Quick toggle buttons for recent months */}
      <div className={styles.quickButtons}>
        {availableMonths.slice(-3).reverse().map(({ year, month }) => {
          const isSelected = selectedMonth === month && selectedYear === year;
          const isCurrent = year === new Date().getFullYear() && month === (new Date().getMonth() + 1);
          return (
            <button
              key={`${year}-${month}`}
              type="button"
              className={`${styles.quickButton} ${isSelected ? styles.active : ''}`}
              onClick={() => onChange(month, year)}
              disabled={disabled}
            >
              {SHORT_MONTH_NAMES[month - 1]} {isCurrent ? '(Current)' : year.toString().slice(-2)}
            </button>
          );
        })}
        {showAllTime && (
          <button
            type="button"
            className={`${styles.quickButton} ${isAllTime ? styles.active : ''}`}
            onClick={() => onChange(null, null)}
            disabled={disabled}
          >
            All
          </button>
        )}
      </div>
    </div>
  );
}

export default MonthYearSelector;

