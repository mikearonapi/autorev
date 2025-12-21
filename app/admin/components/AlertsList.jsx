'use client';

/**
 * AlertsList Component
 * 
 * Displays action items and alerts with priority indicators.
 */

import Link from 'next/link';
import styles from './AlertsList.module.css';
import { InfoIcon, AlertTriangleIcon, AlertCircleIcon, CheckCircleIcon } from './Icons';

const ALERT_CONFIG = {
  info: { icon: InfoIcon, color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' },
  warning: { icon: AlertTriangleIcon, color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
  error: { icon: AlertCircleIcon, color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' },
};

export function AlertsList({ alerts = [], title = 'Action Items' }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <CheckCircleIcon size={32} />
          </div>
          <span className={styles.emptyText}>All caught up! No action items.</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <span className={styles.badge}>{alerts.length}</span>
      </div>
      
      <ul className={styles.list}>
        {alerts.map((alert, index) => {
          const config = ALERT_CONFIG[alert.type] || ALERT_CONFIG.info;
          const IconComponent = config.icon;
          
          return (
            <li 
              key={index} 
              className={styles.item}
              style={{ 
                backgroundColor: config.bgColor,
                borderLeftColor: config.color,
              }}
            >
              <div className={styles.icon} style={{ color: config.color }}>
                <IconComponent size={18} />
              </div>
              <div className={styles.content}>
                <p className={styles.message}>{alert.message}</p>
                {alert.action && alert.href && (
                  <Link href={alert.href} className={styles.action}>
                    {alert.action}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default AlertsList;
