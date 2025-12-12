'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/providers/AuthProvider';
import styles from './UserMenu.module.css';

/**
 * Icons
 */
const Icons = {
  user: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  garage: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <path d="M9 22V12h6v10"/>
    </svg>
  ),
  settings: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  logout: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  chevronDown: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
};

/**
 * UserMenu Component
 * Dropdown menu for authenticated users
 */
export default function UserMenu({ onSignInClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const { user, profile, isAuthenticated, isLoading, logout } = useAuth();

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle sign out
  const handleSignOut = async () => {
    setIsOpen(false);
    await logout();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  // Not authenticated - show circular avatar icon only
  if (!isAuthenticated) {
    return (
      <button 
        className={styles.signInBtn} 
        onClick={onSignInClick}
        aria-label="Log in"
        title="Log in"
      >
        <div className={styles.avatarPlaceholder}>
          <Icons.user size={18} />
        </div>
      </button>
    );
  }

  // Get display info
  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className={styles.container} ref={menuRef}>
      <button 
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className={styles.avatar}>
          {avatarUrl ? (
            <Image 
              src={avatarUrl} 
              alt={displayName}
              width={32}
              height={32}
              className={styles.avatarImage}
            />
          ) : (
            <span className={styles.avatarInitials}>{initials}</span>
          )}
        </div>
        <span className={styles.name}>{displayName}</span>
        <Icons.chevronDown size={16} />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {/* User Info */}
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {avatarUrl ? (
                <Image 
                  src={avatarUrl} 
                  alt={displayName}
                  width={40}
                  height={40}
                  className={styles.avatarImage}
                />
              ) : (
                <span className={styles.avatarInitials}>{initials}</span>
              )}
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{displayName}</span>
              <span className={styles.userEmail}>{user?.email}</span>
            </div>
          </div>

          <div className={styles.divider}></div>

          {/* Menu Items */}
          <nav className={styles.menu}>
            <Link 
              href="/garage" 
              className={styles.menuItem}
              onClick={() => setIsOpen(false)}
            >
              <Icons.garage size={18} />
              <span>My Garage</span>
            </Link>
            <Link 
              href="/profile" 
              className={styles.menuItem}
              onClick={() => setIsOpen(false)}
            >
              <Icons.settings size={18} />
              <span>Settings</span>
            </Link>
          </nav>

          <div className={styles.divider}></div>

          {/* Sign Out */}
          <button className={styles.signOutBtn} onClick={handleSignOut}>
            <Icons.logout size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
