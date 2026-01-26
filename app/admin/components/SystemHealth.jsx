'use client';

/**
 * SystemHealth Component
 * 
 * Status grid showing health of key system components.
 */

import { DatabaseIcon, ZapIcon, ClockIcon } from './Icons';
import styles from './SystemHealth.module.css';

const STATUS_CONFIG = {
  healthy: { color: '#22c55e', label: 'Healthy' },
  degraded: { color: '#f59e0b', label: 'Degraded' },
  down: { color: '#ef4444', label: 'Down' },
};

const SERVICE_CONFIG = {
  database: { icon: DatabaseIcon, name: 'Database' },
  api: { icon: ZapIcon, name: 'API' },
  cron: { icon: ClockIcon, name: 'Cron Jobs' },
};

function StatusIndicator({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.healthy;
  
  return (
    <div 
      className={styles.statusIndicator}
      style={{ 
        backgroundColor: `${config.color}20`,
        borderColor: `${config.color}40`,
      }}
    >
      <span 
        className={styles.statusDot}
        style={{ backgroundColor: config.color }}
      />
      <span 
        className={styles.statusLabel}
        style={{ color: config.color }}
      >
        {config.label}
      </span>
    </div>
  );
}

export function SystemHealth({ system, title = 'System Health' }) {
  if (!system) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.emptyState}>No system data available</div>
      </div>
    );
  }
  
  const services = [
    { key: 'database', status: system.database, ...SERVICE_CONFIG.database },
    { key: 'api', status: system.api, ...SERVICE_CONFIG.api },
    { key: 'cron', status: system.cron, ...SERVICE_CONFIG.cron },
  ];
  
  // Overall status is the worst of all statuses
  const statusPriority = { down: 0, degraded: 1, healthy: 2 };
  const overallStatus = services.reduce((worst, service) => {
    return statusPriority[service.status] < statusPriority[worst] ? service.status : worst;
  }, 'healthy');
  
  const lastCronTime = system.lastCronRun 
    ? new Date(system.lastCronRun).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Unknown';
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <StatusIndicator status={overallStatus} />
      </div>
      
      <div className={styles.grid}>
        {services.map((service) => {
          const IconComponent = service.icon;
          return (
            <div key={service.key} className={styles.serviceCard}>
              <div className={styles.serviceIcon}>
                <IconComponent size={20} />
              </div>
              <div className={styles.serviceInfo}>
                <span className={styles.serviceName}>{service.name}</span>
                <StatusIndicator status={service.status} />
              </div>
            </div>
          );
        })}
      </div>
      
      <div className={styles.lastRun}>
        <span className={styles.lastRunLabel}>Last cron execution:</span>
        <span className={styles.lastRunTime}>{lastCronTime}</span>
      </div>
    </div>
  );
}

export default SystemHealth;
