'use client';

/**
 * Site Analytics Dashboard Component
 * 
 * Replicates Vercel Web Analytics functionality using our own Supabase data.
 * Shows visitors, page views, bounce rate, top pages, referrers,
 * countries, devices, browsers, and OS breakdown.
 */

import { useState, useEffect, useCallback } from 'react';
import styles from './SiteAnalytics.module.css';

// Simple chart component for the time series
function VisitorChart({ data, height = 200 }) {
  if (!data || data.length === 0) {
    return (
      <div className={styles.chartEmpty}>
        <p>No data for selected period</p>
      </div>
    );
  }
  
  const maxViews = Math.max(...data.map(d => d.visitors || 0), 1);
  
  return (
    <div className={styles.chart} style={{ height }}>
      <div className={styles.chartBars}>
        {data.map((day, i) => {
          const heightPercent = ((day.visitors || 0) / maxViews) * 100;
          return (
            <div key={i} className={styles.chartBarWrapper}>
              <div 
                className={styles.chartBar}
                style={{ height: `${heightPercent}%` }}
                title={`${day.date}: ${day.visitors} visitors, ${day.views} views`}
              />
              <span className={styles.chartLabel}>
                {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          );
        })}
      </div>
      <div className={styles.chartYAxis}>
        <span>{maxViews}</span>
        <span>{Math.round(maxViews / 2)}</span>
        <span>0</span>
      </div>
    </div>
  );
}

// Stats card with label and value
function StatCard({ label, value, subtext, icon, color = 'blue' }) {
  return (
    <div className={`${styles.statCard} ${styles[`stat${color}`]}`}>
      <div className={styles.statHeader}>
        <span className={styles.statLabel}>{label}</span>
        {icon && <span className={styles.statIcon}>{icon}</span>}
      </div>
      <div className={styles.statValue}>{value}</div>
      {subtext && <div className={styles.statSubtext}>{subtext}</div>}
    </div>
  );
}

// Data table component
function DataTable({ title, data, columns, emptyMessage = 'No data' }) {
  if (!data || data.length === 0) {
    return (
      <div className={styles.tableCard}>
        <h3 className={styles.tableTitle}>{title}</h3>
        <div className={styles.tableEmpty}>{emptyMessage}</div>
      </div>
    );
  }
  
  return (
    <div className={styles.tableCard}>
      <h3 className={styles.tableTitle}>{title}</h3>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} className={col.align === 'right' ? styles.alignRight : ''}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {columns.map((col, j) => (
                  <td key={j} className={col.align === 'right' ? styles.alignRight : ''}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Progress bar for percentage displays
function ProgressBar({ value, max, label }) {
  const percent = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className={styles.progressRow}>
      <div className={styles.progressLabel}>{label}</div>
      <div className={styles.progressBarWrapper}>
        <div className={styles.progressBar} style={{ width: `${percent}%` }} />
      </div>
      <div className={styles.progressValue}>{value}</div>
    </div>
  );
}

// Country flag emoji helper
function getCountryFlag(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function SiteAnalytics({ token, range = '7d', loading: externalLoading }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pages');
  
  const fetchAnalytics = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/site-analytics?range=${range}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('[SiteAnalytics] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, range]);
  
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);
  
  if (loading || externalLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>Error loading analytics: {error}</p>
          <button onClick={fetchAnalytics} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <p>No analytics data available</p>
        </div>
      </div>
    );
  }
  
  const { summary, topPages, referrers, countries, devices, browsers, operatingSystems, dailyStats } = data;
  
  // Calculate totals for progress bars
  const totalDeviceVisitors = devices?.reduce((sum, d) => sum + (d.visitors || 0), 0) || 1;
  const totalCountryVisitors = countries?.reduce((sum, c) => sum + (c.visitors || 0), 0) || 1;
  
  return (
    <div className={styles.container}>
      {/* Header Stats */}
      <div className={styles.statsGrid}>
        <StatCard
          label="Visitors"
          value={summary?.visitors?.toLocaleString() || '0'}
          subtext="Unique sessions"
          color="blue"
        />
        <StatCard
          label="Page Views"
          value={summary?.pageViews?.toLocaleString() || '0'}
          subtext="Total views"
          color="purple"
        />
        <StatCard
          label="Bounce Rate"
          value={`${summary?.bounceRate || 0}%`}
          subtext="Single page visits"
          color="amber"
        />
        <StatCard
          label="Online Now"
          value={summary?.online || '0'}
          subtext="Last 5 minutes"
          color="green"
        />
      </div>
      
      {/* Visitor Chart */}
      <div className={styles.chartSection}>
        <h3 className={styles.sectionTitle}>Visitors Over Time</h3>
        <VisitorChart data={dailyStats} height={180} />
      </div>
      
      {/* Tab Navigation */}
      <div className={styles.tabNav}>
        <button 
          className={`${styles.tab} ${activeTab === 'pages' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('pages')}
        >
          Pages
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'referrers' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('referrers')}
        >
          Referrers
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'geo' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('geo')}
        >
          Geography
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'tech' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('tech')}
        >
          Technology
        </button>
      </div>
      
      {/* Tab Content */}
      <div className={styles.tabContent}>
        {/* Pages Tab */}
        {activeTab === 'pages' && (
          <DataTable
            title="Top Pages"
            data={topPages}
            columns={[
              { 
                header: 'Page', 
                key: 'path',
                render: (row) => (
                  <span className={styles.pathCell} title={row.path}>
                    {row.path}
                  </span>
                )
              },
              { header: 'Views', key: 'views', align: 'right' },
              { header: 'Visitors', key: 'visitors', align: 'right' }
            ]}
            emptyMessage="No page views yet"
          />
        )}
        
        {/* Referrers Tab */}
        {activeTab === 'referrers' && (
          <DataTable
            title="Referrers"
            data={referrers}
            columns={[
              { 
                header: 'Source', 
                key: 'source',
                render: (row) => (
                  <span className={styles.sourceCell}>
                    {row.source === 'Direct' ? '🔗 Direct / None' : row.source}
                  </span>
                )
              },
              { header: 'Visitors', key: 'visitors', align: 'right' }
            ]}
            emptyMessage="No referrer data"
          />
        )}
        
        {/* Geography Tab */}
        {activeTab === 'geo' && (
          <div className={styles.geoSection}>
            <h3 className={styles.tableTitle}>Countries</h3>
            <div className={styles.progressList}>
              {countries?.length > 0 ? (
                countries.map((country, i) => (
                  <div key={i} className={styles.countryRow}>
                    <span className={styles.countryFlag}>
                      {getCountryFlag(country.country_code)}
                    </span>
                    <span className={styles.countryName}>{country.country}</span>
                    <div className={styles.countryBar}>
                      <div 
                        className={styles.countryBarFill}
                        style={{ width: `${(country.visitors / totalCountryVisitors) * 100}%` }}
                      />
                    </div>
                    <span className={styles.countryPercent}>
                      {Math.round((country.visitors / totalCountryVisitors) * 100)}%
                    </span>
                  </div>
                ))
              ) : (
                <div className={styles.tableEmpty}>No country data</div>
              )}
            </div>
          </div>
        )}
        
        {/* Technology Tab */}
        {activeTab === 'tech' && (
          <div className={styles.techGrid}>
            {/* Devices */}
            <div className={styles.techSection}>
              <h3 className={styles.tableTitle}>Devices</h3>
              <div className={styles.progressList}>
                {devices?.length > 0 ? (
                  devices.map((device, i) => (
                    <div key={i} className={styles.techRow}>
                      <span className={styles.techIcon}>
                        {device.device === 'Mobile' ? '📱' : 
                         device.device === 'Tablet' ? '📲' : '💻'}
                      </span>
                      <span className={styles.techName}>{device.device}</span>
                      <div className={styles.techBar}>
                        <div 
                          className={styles.techBarFill}
                          style={{ width: `${(device.visitors / totalDeviceVisitors) * 100}%` }}
                        />
                      </div>
                      <span className={styles.techPercent}>
                        {Math.round((device.visitors / totalDeviceVisitors) * 100)}%
                      </span>
                    </div>
                  ))
                ) : (
                  <div className={styles.tableEmpty}>No device data</div>
                )}
              </div>
            </div>
            
            {/* Browsers */}
            <div className={styles.techSection}>
              <h3 className={styles.tableTitle}>Browsers</h3>
              <div className={styles.progressList}>
                {browsers?.length > 0 ? (
                  browsers.slice(0, 5).map((browser, i) => (
                    <div key={i} className={styles.techRow}>
                      <span className={styles.techIcon}>
                        {browser.browser === 'Chrome' ? '🌐' :
                         browser.browser === 'Safari' ? '🧭' :
                         browser.browser === 'Firefox' ? '🦊' :
                         browser.browser === 'Edge' ? '🔷' : '🌍'}
                      </span>
                      <span className={styles.techName}>{browser.browser}</span>
                      <span className={styles.techValue}>{browser.visitors}</span>
                    </div>
                  ))
                ) : (
                  <div className={styles.tableEmpty}>No browser data</div>
                )}
              </div>
            </div>
            
            {/* Operating Systems */}
            <div className={styles.techSection}>
              <h3 className={styles.tableTitle}>Operating Systems</h3>
              <div className={styles.progressList}>
                {operatingSystems?.length > 0 ? (
                  operatingSystems.slice(0, 5).map((os, i) => (
                    <div key={i} className={styles.techRow}>
                      <span className={styles.techIcon}>
                        {os.os === 'Mac' ? '🍎' :
                         os.os === 'Windows' ? '🪟' :
                         os.os === 'iOS' ? '📱' :
                         os.os === 'Android' ? '🤖' :
                         os.os === 'Linux' ? '🐧' : '💻'}
                      </span>
                      <span className={styles.techName}>{os.os}</span>
                      <span className={styles.techValue}>{os.visitors}</span>
                    </div>
                  ))
                ) : (
                  <div className={styles.tableEmpty}>No OS data</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SiteAnalytics;

