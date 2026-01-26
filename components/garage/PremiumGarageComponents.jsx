'use client';

/**
 * Premium Garage Components
 * GRAVL-inspired Design System
 * 
 * Components:
 * - VehicleSelector: Premium dropdown for vehicle selection
 * - QuickActionBar: Icon+label action buttons
 * - CircularGauge: Animated progress ring
 * - PremiumSpecCard: Gradient card with visual flair
 * - FloatingCTA: Bottom action bar
 * - HealthSummaryRow: Horizontal health metrics
 * - SegmentControl: Toggle between views
 */

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import styles from './PremiumGarage.module.css';

// ============================================================================
// ICONS
// ============================================================================

const IconWrapper = ({ children }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 0 }}>
    {children}
  </span>
);

const Icons = {
  chevronDown: ({ size = 16 }) => (
    <IconWrapper>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </IconWrapper>
  ),
  check: ({ size = 16 }) => (
    <IconWrapper>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </IconWrapper>
  ),
  plus: ({ size = 16 }) => (
    <IconWrapper>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </IconWrapper>
  ),
  camera: ({ size = 20 }) => (
    <IconWrapper>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>
    </IconWrapper>
  ),
  gauge: ({ size = 20 }) => (
    <IconWrapper>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    </IconWrapper>
  ),
  book: ({ size = 20 }) => (
    <IconWrapper>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    </IconWrapper>
  ),
  heart: ({ size = 20 }) => (
    <IconWrapper>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </IconWrapper>
  ),
  wrench: ({ size = 20 }) => (
    <IconWrapper>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    </IconWrapper>
  ),
  car: ({ size = 20 }) => (
    <IconWrapper>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
        <circle cx="7" cy="17" r="2"/>
        <path d="M9 17h6"/>
        <circle cx="17" cy="17" r="2"/>
      </svg>
    </IconWrapper>
  ),
};

// ============================================================================
// VEHICLE SELECTOR DROPDOWN
// Premium dropdown like GRAVL's gym selector
// ============================================================================

export function VehicleSelector({ 
  vehicles = [], 
  selectedIndex = 0, 
  onSelect, 
  onAddVehicle,
  getVehicleImage,
  getVehicleName,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  
  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);
  
  const selectedVehicle = vehicles[selectedIndex];
  
  const handleSelect = (index) => {
    onSelect?.(index);
    setIsOpen(false);
  };
  
  if (!selectedVehicle) {
    return (
      <div className={styles.vehicleSelector} ref={menuRef}>
        <button 
          className={styles.vehicleSelectorTrigger}
          onClick={() => onAddVehicle?.()}
        >
          <div className={styles.vehicleSelectorIcon}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Icons.plus size={20} />
            </div>
          </div>
          <div className={styles.vehicleSelectorInfo}>
            <span className={styles.vehicleSelectorLabel}>My Garage</span>
            <span className={styles.vehicleSelectorName}>Add Vehicle</span>
          </div>
        </button>
      </div>
    );
  }
  
  return (
    <div className={styles.vehicleSelector} ref={menuRef}>
      <button 
        className={`${styles.vehicleSelectorTrigger} ${isOpen ? styles.vehicleSelectorTriggerActive : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={styles.vehicleSelectorIcon}>
          {getVehicleImage?.(selectedVehicle)}
        </div>
        <div className={styles.vehicleSelectorInfo}>
          <span className={styles.vehicleSelectorLabel}>Selected Vehicle</span>
          <span className={styles.vehicleSelectorName}>
            {getVehicleName?.(selectedVehicle) || 'Unknown'}
          </span>
        </div>
        <span className={styles.vehicleSelectorChevron}>
          <Icons.chevronDown size={18} />
        </span>
      </button>
      
      {isOpen && (
        <div className={styles.vehicleSelectorMenu}>
          {vehicles.map((vehicle, index) => (
            <button
              key={index}
              className={`${styles.vehicleSelectorMenuItem} ${index === selectedIndex ? styles.vehicleSelectorMenuItemActive : ''}`}
              onClick={() => handleSelect(index)}
            >
              <div className={styles.vehicleSelectorMenuItemImage}>
                {getVehicleImage?.(vehicle)}
              </div>
              <div className={styles.vehicleSelectorMenuItemInfo}>
                <div className={styles.vehicleSelectorMenuItemName}>
                  {getVehicleName?.(vehicle)}
                </div>
                <div className={styles.vehicleSelectorMenuItemSub}>
                  {vehicle?.vehicle?.year || vehicle?.matchedCar?.years || ''}
                </div>
              </div>
              {index === selectedIndex && (
                <span className={styles.vehicleSelectorMenuItemCheck}>
                  <Icons.check size={18} />
                </span>
              )}
            </button>
          ))}
          
          <div className={styles.vehicleSelectorDivider} />
          
          <button 
            className={styles.vehicleSelectorAddItem}
            onClick={() => {
              setIsOpen(false);
              onAddVehicle?.();
            }}
          >
            <div className={styles.vehicleSelectorAddIcon}>
              <Icons.plus size={22} />
            </div>
            <span className={styles.vehicleSelectorAddText}>Add New Vehicle</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// QUICK ACTION BAR
// GRAVL-style icon+label buttons
// ============================================================================

const defaultQuickActions = [
  { id: 'photos', icon: Icons.camera, label: 'Photos' },
  { id: 'specs', icon: Icons.gauge, label: 'Specs' },
  { id: 'reference', icon: Icons.book, label: 'Reference' },
  { id: 'health', icon: Icons.heart, label: 'Health' },
];

export function QuickActionBar({ 
  actions = defaultQuickActions, 
  activeAction, 
  onAction,
  className = '',
}) {
  return (
    <div className={`${styles.quickActions} ${className}`}>
      {actions.map((action) => {
        const IconComponent = action.icon;
        const isActive = activeAction === action.id;
        
        return (
          <button
            key={action.id}
            className={`${styles.quickActionBtn} ${isActive ? styles.quickActionBtnActive : ''}`}
            onClick={() => onAction?.(action.id)}
          >
            <span className={styles.quickActionIcon}>
              <IconComponent size={22} />
            </span>
            <span className={styles.quickActionLabel}>{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// CIRCULAR GAUGE
// Animated progress ring for scores
// ============================================================================

export function CircularGauge({ 
  value = 0, 
  maxValue = 100, 
  size = 'medium', // 'small' | 'medium' | 'large'
  label = '',
  meta = '',
  color,
  showValue = true,
}) {
  // Size configurations
  const sizeConfig = {
    small: { width: 64, strokeWidth: 4, radius: 26 },
    medium: { width: 100, strokeWidth: 6, radius: 40 },
    large: { width: 140, strokeWidth: 8, radius: 56 },
  };
  
  const config = sizeConfig[size] || sizeConfig.medium;
  const { width, strokeWidth, radius } = config;
  
  const center = width / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(value / maxValue, 0), 1);
  const offset = circumference * (1 - progress);
  
  const sizeClass = {
    small: styles.circularGaugeSmall,
    medium: styles.circularGaugeMedium,
    large: styles.circularGaugeLarge,
  }[size] || '';
  
  return (
    <div 
      className={`${styles.circularGauge} ${sizeClass}`}
      style={color ? { '--gauge-color': color } : {}}
    >
      <svg 
        className={styles.circularGaugeSvg}
        width={width} 
        height={width} 
        viewBox={`0 0 ${width} ${width}`}
      >
        <circle
          className={styles.circularGaugeTrack}
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className={styles.circularGaugeProgress}
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      
      {showValue && (
        <div className={styles.circularGaugeCenter}>
          <div className={styles.circularGaugeValue}>{Math.round(value)}</div>
          {label && <div className={styles.circularGaugeLabel}>{label}</div>}
        </div>
      )}
      
      {meta && <div className={styles.circularGaugeMeta}>{meta}</div>}
    </div>
  );
}

// ============================================================================
// PREMIUM SPEC CARD
// Gradient card with visual flair
// ============================================================================

export function PremiumSpecCard({ 
  title, 
  badge,
  badgeIcon,
  children,
  action,
  className = '',
}) {
  const BadgeIcon = badgeIcon;
  
  return (
    <div className={`${styles.premiumCard} ${className}`}>
      <div className={styles.premiumCardHeader}>
        <h4 className={styles.premiumCardTitle}>{title}</h4>
        {badge && (
          <div className={styles.premiumCardBadge}>
            {BadgeIcon && <BadgeIcon size={12} />}
            {badge}
          </div>
        )}
        {action}
      </div>
      <div className={styles.premiumCardDivider} />
      {children}
    </div>
  );
}

export function PremiumSpecRow({ 
  label, 
  value, 
  unit, 
  gain,
  isModified = false,
}) {
  return (
    <div className={styles.premiumSpecRow}>
      <span className={styles.premiumSpecLabel}>{label}</span>
      <span className={`${styles.premiumSpecValue} ${isModified ? styles.premiumSpecValueModified : ''}`}>
        {value}
        {unit && <span className={styles.premiumSpecUnit}>{unit}</span>}
        {gain && <span className={styles.premiumSpecGain}>+{gain}</span>}
      </span>
    </div>
  );
}

// ============================================================================
// FLOATING CTA BAR
// Bottom action bar like GRAVL's "START WORKOUT"
// ============================================================================

export function FloatingCTA({ 
  primaryLabel, 
  primaryIcon,
  onPrimaryClick,
  secondaryIcon,
  onSecondaryClick,
  visible = true,
}) {
  if (!visible) return null;
  
  const PrimaryIcon = primaryIcon;
  const SecondaryIcon = secondaryIcon;
  
  return (
    <div className={styles.floatingCta}>
      <button className={styles.floatingCtaPrimary} onClick={onPrimaryClick}>
        {PrimaryIcon && <PrimaryIcon size={20} />}
        {primaryLabel}
      </button>
      {SecondaryIcon && onSecondaryClick && (
        <button className={styles.floatingCtaSecondary} onClick={onSecondaryClick}>
          <SecondaryIcon size={22} />
        </button>
      )}
    </div>
  );
}

// ============================================================================
// HEALTH SUMMARY ROW
// Horizontal scroll of health metrics
// ============================================================================

export function HealthSummaryRow({ items = [] }) {
  return (
    <div className={styles.healthSummaryRow}>
      {items.map((item, index) => {
        const statusClass = {
          good: styles.healthSummaryItemGood,
          warning: styles.healthSummaryItemWarning,
          danger: styles.healthSummaryItemDanger,
        }[item.status] || '';
        
        const ItemIcon = item.icon;
        
        return (
          <div key={index} className={`${styles.healthSummaryItem} ${statusClass}`}>
            {ItemIcon && (
              <span className={styles.healthSummaryIcon}>
                <ItemIcon size={24} />
              </span>
            )}
            <span className={styles.healthSummaryValue}>{item.value}</span>
            <span className={styles.healthSummaryLabel}>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// SEGMENT CONTROL
// Toggle between views
// ============================================================================

export function SegmentControl({ 
  options = [], 
  activeOption, 
  onSelect,
  className = '',
}) {
  return (
    <div className={`${styles.segmentControl} ${className}`}>
      {options.map((option) => (
        <button
          key={option.id}
          className={`${styles.segmentOption} ${activeOption === option.id ? styles.segmentOptionActive : ''}`}
          onClick={() => onSelect?.(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// RATING BAR
// Visual progress bar for X/10 ratings (GRAVL-style)
// ============================================================================

export function RatingBar({ 
  value, 
  maxValue = 10, 
  label,
  showValue = true,
  size = 'default', // 'compact' | 'default' | 'large'
  color,
}) {
  const percentage = Math.min(Math.max((value / maxValue) * 100, 0), 100);
  
  // Determine color based on value if not provided
  const barColor = color || (
    percentage >= 80 ? 'var(--color-accent-teal, #10b981)' : // Teal for high scores
    percentage >= 60 ? 'var(--color-accent-amber, #f59e0b)' : // Amber for good scores
    percentage >= 40 ? 'var(--color-accent-amber-light, #fbbf24)' : // Yellow for medium
    'var(--color-error, #ef4444)' // Red for low
  );
  
  const sizeStyles = {
    compact: { height: '4px', fontSize: '12px' },
    default: { height: '6px', fontSize: '14px' },
    large: { height: '8px', fontSize: '16px' },
  };
  
  const style = sizeStyles[size] || sizeStyles.default;
  
  return (
    <div className="ratingBarContainer" style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
      {label && (
        <span style={{ 
          flex: '0 0 auto',
          minWidth: '100px',
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: style.fontSize,
        }}>
          {label}
        </span>
      )}
      <div style={{ 
        flex: 1,
        height: style.height,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '4px',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${percentage}%`,
          backgroundColor: barColor,
          borderRadius: '4px',
          transition: 'width 0.5s ease',
        }} />
      </div>
      {showValue && (
        <span style={{
          flex: '0 0 auto',
          minWidth: '48px',
          textAlign: 'right',
          fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
          fontWeight: 700,
          fontSize: style.fontSize,
          color: barColor,
        }}>
          {value}/{maxValue}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// PERFORMANCE SCORE CARD
// Combines circular gauge with key stats (GRAVL Strength Score style)
// ============================================================================

export function PerformanceScoreCard({
  score,
  label = 'Performance',
  subtitle,
  stats = [], // Array of { label, value, unit }
  color,
}) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '18px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px',
    }}>
      <CircularGauge 
        value={score} 
        maxValue={100}
        size="large"
        label={label}
        color={color}
      />
      
      {subtitle && (
        <div style={{
          fontSize: '14px',
          fontWeight: 600,
          color: color || 'var(--color-accent-amber, #f59e0b)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          {subtitle}
        </div>
      )}
      
      {stats.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '24px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          width: '100%',
          justifyContent: 'center',
        }}>
          {stats.map((stat, index) => (
            <div key={index} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '20px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono, monospace)',
                color: '#fff',
              }}>
                {stat.value}
                {stat.unit && <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginLeft: '2px' }}>{stat.unit}</span>}
              </div>
              <div style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginTop: '4px',
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PREMIUM HERO INFO
// Enhanced vehicle name/brand display for hero section
// ============================================================================

export function PremiumHeroInfo({
  brand,
  name,
  year,
  tagline,
  badges = [], // Array of { text, icon?, color? }
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    }}>
      {/* Brand */}
      <div style={{
        fontSize: '11px',
        fontWeight: 700,
        color: 'var(--color-text-secondary, rgba(255, 255, 255, 0.6))',
        textTransform: 'uppercase',
        letterSpacing: '2px',
      }}>
        {brand}
      </div>
      
      {/* Name with badges */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#fff',
          margin: 0,
          fontFamily: 'var(--font-display, system-ui)',
          letterSpacing: '-0.02em',
        }}>
          {name}
        </h2>
        
        {badges.map((badge, index) => (
          <span
            key={index}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              background: badge.color ? `${badge.color}20` : 'rgba(245, 158, 11, 0.15)',
              border: `1px solid ${badge.color || 'var(--color-accent-amber, #f59e0b)'}`,
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: 700,
              color: badge.color || 'var(--color-accent-amber, #f59e0b)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {badge.icon}
            {badge.text}
          </span>
        ))}
      </div>
      
      {/* Year */}
      <div style={{
        fontSize: '15px',
        color: 'rgba(255, 255, 255, 0.5)',
        fontStyle: 'italic',
      }}>
        {year}
      </div>
      
      {/* Tagline */}
      {tagline && (
        <p style={{
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.6)',
          fontStyle: 'italic',
          margin: '8px 0 0',
          lineHeight: 1.4,
        }}>
          {tagline}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// STAT PILL
// Compact inline stat display
// ============================================================================

export function StatPill({ icon, value, label, color }) {
  const IconComponent = icon;
  
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      background: 'rgba(255, 255, 255, 0.06)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '20px',
    }}>
      {IconComponent && (
        <span style={{ color: color || 'var(--accent-primary)', opacity: 0.8 }}>
          <IconComponent size={14} />
        </span>
      )}
      <span style={{
        fontFamily: 'var(--font-mono, monospace)',
        fontWeight: 700,
        fontSize: '13px',
        color: '#fff',
      }}>
        {value}
      </span>
      {label && (
        <span style={{
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.5)',
          textTransform: 'uppercase',
        }}>
          {label}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export { Icons as PremiumIcons };
