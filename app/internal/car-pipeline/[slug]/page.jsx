'use client';

/**
 * Car Pipeline Detail Page
 * 
 * Full checklist view for a single car in the pipeline.
 * Features:
 * - Toggle checkboxes for each step
 * - Notes field per phase
 * - "Run Enrichment" buttons that call APIs
 * - Validation status indicators
 * - Links to relevant admin pages
 */

import { useState, useEffect, use } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import styles from './page.module.css';

// Phase configuration with detailed checklist items
const PHASE_CONFIG = [
  {
    key: 'phase1',
    number: 1,
    name: 'Selection & Validation',
    description: 'Verify car meets inclusion criteria and slug is correct',
    notesKey: 'phase1_notes',
    items: [
      { key: 'phase1_validated', label: 'Selection Validated', hint: 'Car meets AutoRev inclusion criteria, slug follows convention' },
    ],
    actions: [],
  },
  {
    key: 'phase2',
    number: 2,
    name: 'Core Data Entry',
    description: 'Insert car record into database with required fields',
    notesKey: 'phase2_notes',
    items: [
      { key: 'phase2_core_data', label: 'Core Data Entered', hint: 'All 18 required fields populated in cars table' },
    ],
    actions: [
      { label: 'Open Car Detail', href: '/browse-cars/{slug}', external: false },
    ],
  },
  {
    key: 'phase3',
    number: 3,
    name: 'Automated Enrichment',
    description: 'Run EPA, NHTSA, and recall data enrichment',
    notesKey: 'phase3_notes',
    items: [
      { key: 'phase3_fuel_economy', label: 'Fuel Economy', hint: 'EPA data in car_fuel_economy table' },
      { key: 'phase3_safety_ratings', label: 'Safety Ratings', hint: 'NHTSA/IIHS data in car_safety_data table' },
      { key: 'phase3_recalls', label: 'Recalls', hint: 'NHTSA recalls in car_recalls table' },
    ],
    actions: [
      { label: '🔄 Run EPA Enrichment', api: '/api/cars/{slug}/fuel-economy' },
      { label: '🔄 Run Safety Enrichment', api: '/api/cars/{slug}/safety' },
    ],
  },
  {
    key: 'phase4',
    number: 4,
    name: 'Manual Research',
    description: 'Research and add known issues, maintenance specs, and service intervals',
    notesKey: 'phase4_notes',
    items: [
      { key: 'phase4_known_issues', label: 'Known Issues', hint: 'At least 3 issues in car_issues table' },
      { key: 'phase4_maintenance_specs', label: 'Maintenance Specs', hint: 'Record in vehicle_maintenance_specs table' },
      { key: 'phase4_service_intervals', label: 'Service Intervals', hint: 'At least 5 intervals in vehicle_service_intervals table' },
      { key: 'phase4_variants', label: 'Variants', hint: 'Year/trim variants in car_variants table' },
    ],
    actions: [
      { label: 'Open Variant Admin', href: '/internal/variant-maintenance', external: false },
    ],
  },
  {
    key: 'phase5',
    number: 5,
    name: 'Scoring & Editorial',
    description: 'Assign scores and write strengths/weaknesses',
    notesKey: 'phase5_notes',
    items: [
      { key: 'phase5_scores_assigned', label: 'All 7 Scores Assigned', hint: 'score_sound through score_aftermarket (1-10 scale)' },
      { key: 'phase5_strengths', label: 'Strengths Written', hint: 'defining_strengths JSONB array populated' },
      { key: 'phase5_weaknesses', label: 'Weaknesses Written', hint: 'honest_weaknesses JSONB array populated' },
      { key: 'phase5_alternatives', label: 'Alternatives Set', hint: 'direct_competitors, if_you_want_more, if_you_want_less populated' },
    ],
    actions: [],
  },
  {
    key: 'phase6',
    number: 6,
    name: 'Media',
    description: 'Upload hero image and optional gallery',
    notesKey: 'phase6_notes',
    items: [
      { key: 'phase6_hero_image', label: 'Hero Image Uploaded', hint: 'image_hero_url populated in cars table' },
      { key: 'phase6_gallery_images', label: 'Gallery Images (Optional)', hint: 'image_gallery JSONB array if multiple images' },
    ],
    actions: [],
  },
  {
    key: 'phase7',
    number: 7,
    name: 'YouTube Enrichment',
    description: 'Queue and process expert review videos',
    notesKey: 'phase7_notes',
    items: [
      { key: 'phase7_videos_queued', label: 'Videos Queued', hint: 'Videos added to youtube_ingestion_queue' },
      { key: 'phase7_videos_processed', label: 'Videos Processed', hint: 'AI summaries generated in youtube_videos' },
      { key: 'phase7_car_links_verified', label: 'Car Links Verified', hint: 'youtube_video_car_links connect to this car' },
    ],
    actions: [],
  },
  {
    key: 'phase8',
    number: 8,
    name: 'Validation & QA',
    description: 'Final checks and verification',
    notesKey: 'phase8_notes',
    items: [
      { key: 'phase8_data_complete', label: 'Data Completeness Check', hint: 'All validation queries pass' },
      { key: 'phase8_page_renders', label: 'Page Renders Correctly', hint: '/browse-cars/{slug} loads without errors' },
      { key: 'phase8_al_tested', label: 'AL Assistant Tested', hint: 'AL can answer questions about this car' },
      { key: 'phase8_search_works', label: 'Search/Filter Works', hint: 'Car appears in browse and search results' },
      { key: 'phase8_mobile_checked', label: 'Mobile Checked', hint: 'Page renders correctly on mobile' },
    ],
    actions: [
      { label: 'Open QA Dashboard', href: '/internal/qa', external: false },
      { label: '🔍 Run Validation', api: '/api/internal/car-pipeline/{slug}/validate' },
    ],
  },
];

export default function CarPipelineDetailPage({ params }) {
  const { slug } = use(params);
  const _router = useRouter();
  
  const [_run, setRun] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [expandedPhases, setExpandedPhases] = useState(new Set([1, 2, 3])); // First 3 expanded by default
  const [runningAction, setRunningAction] = useState(null);
  
  // Track local changes
  const [localRun, setLocalRun] = useState(null);

  useEffect(() => {
    fetchPipelineRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const fetchPipelineRun = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/internal/car-pipeline/${slug}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Pipeline run not found');
        }
        throw new Error('Failed to fetch pipeline run');
      }
      
      const data = await response.json();
      setRun(data.run);
      setLocalRun(data.run);
    } catch (err) {
      console.error('[CarPipelineDetail] Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle checkbox
  const handleCheckboxChange = (key) => {
    setLocalRun(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Update notes
  const handleNotesChange = (key, value) => {
    setLocalRun(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // Update status
  const handleStatusChange = (status) => {
    setLocalRun(prev => ({
      ...prev,
      status,
    }));
  };

  // Toggle phase expansion
  const togglePhase = (phaseNumber) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phaseNumber)) {
        next.delete(phaseNumber);
      } else {
        next.add(phaseNumber);
      }
      return next;
    });
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/internal/car-pipeline/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localRun),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save');
      }
      
      const data = await response.json();
      setRun(data.run);
      setLocalRun(data.run);
      showToast('Changes saved successfully');
    } catch (err) {
      console.error('[CarPipelineDetail] Save error:', err);
      showToast('Failed to save changes', true);
    } finally {
      setIsSaving(false);
    }
  };

  // Run enrichment action
  const runAction = async (action) => {
    if (!action.api) return;
    
    const apiUrl = action.api.replace('{slug}', slug);
    setRunningAction(action.label);
    
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (response.ok) {
        showToast(`${action.label} completed`);
      } else {
        showToast(data.error || 'Action failed', true);
      }
    } catch (err) {
      showToast('Action failed: ' + err.message, true);
    } finally {
      setRunningAction(null);
    }
  };

  // Show toast notification
  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3000);
  };

  // Calculate phase status
  const getPhaseStatus = (phase) => {
    const completedItems = phase.items.filter(item => localRun?.[item.key] === true);
    if (completedItems.length === phase.items.length) return 'complete';
    if (completedItems.length > 0) return 'partial';
    return 'pending';
  };

  // Calculate overall progress
  const getOverallProgress = () => {
    if (!localRun) return { completed: 0, total: 0, percent: 0 };
    
    let completed = 0;
    let total = 0;
    
    PHASE_CONFIG.forEach(phase => {
      phase.items.forEach(item => {
        total++;
        if (localRun[item.key] === true) completed++;
      });
    });
    
    return {
      completed,
      total,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
          <p>Loading pipeline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Link href="/internal/car-pipeline" className={styles.backLink}>
          ← Back to Pipeline Dashboard
        </Link>
        <div className={styles.error}>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={fetchPipelineRun} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const progress = getOverallProgress();

  return (
    <div className={styles.container}>
      <Link href="/internal/car-pipeline" className={styles.backLink}>
        ← Back to Pipeline Dashboard
      </Link>

      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerTitle}>
            <h1>{localRun?.car_name}</h1>
            <span className={styles.carSlug}>{localRun?.car_slug}</span>
          </div>
          <span className={`${styles.statusBadge} ${styles[localRun?.status === 'in_progress' ? 'inProgress' : localRun?.status]}`}>
            {localRun?.status?.replace('_', ' ')}
          </span>
        </div>
      </header>

      {/* Overall Progress */}
      <div className={styles.overallProgress}>
        <div className={styles.progressHeader}>
          <span className={styles.progressLabel}>Overall Progress</span>
          <span className={styles.progressValue}>
            {progress.completed}/{progress.total} steps ({progress.percent}%)
          </span>
        </div>
        <div className={styles.progressBarContainer}>
          <div
            className={styles.progressBar}
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      {/* Phase Sections */}
      <div className={styles.phaseGrid}>
        {PHASE_CONFIG.map((phase) => {
          const status = getPhaseStatus(phase);
          const isExpanded = expandedPhases.has(phase.number);
          
          return (
            <div
              key={phase.key}
              className={`${styles.phaseSection} ${styles[status]}`}
            >
              <div
                className={styles.phaseHeader}
                onClick={() => togglePhase(phase.number)}
              >
                <div className={styles.phaseTitle}>
                  <span className={`${styles.phaseNumber} ${styles[status]}`}>
                    {status === 'complete' ? '✓' : phase.number}
                  </span>
                  <div>
                    <div className={styles.phaseName}>{phase.name}</div>
                    <div className={styles.phaseStatus}>
                      {phase.items.filter(i => localRun?.[i.key]).length}/{phase.items.length} complete
                    </div>
                  </div>
                </div>
                <span className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}>
                  ▼
                </span>
              </div>
              
              {isExpanded && (
                <div className={styles.phaseContent}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    {phase.description}
                  </p>
                  
                  <div className={styles.checklist}>
                    {phase.items.map((item) => (
                      <div key={item.key} className={styles.checklistItem}>
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={localRun?.[item.key] || false}
                          onChange={() => handleCheckboxChange(item.key)}
                        />
                        <div className={styles.checklistLabel}>
                          <div className={styles.checklistLabelText}>{item.label}</div>
                          <div className={styles.checklistLabelHint}>{item.hint}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Phase Actions */}
                  {phase.actions.length > 0 && (
                    <div className={styles.phaseActions}>
                      {phase.actions.map((action, idx) => {
                        if (action.href) {
                          const href = action.href.replace('{slug}', slug);
                          return (
                            <Link
                              key={idx}
                              href={href}
                              className={`${styles.actionButton} ${styles.secondary}`}
                              target={action.external ? '_blank' : undefined}
                            >
                              {action.label}
                            </Link>
                          );
                        }
                        if (action.api) {
                          return (
                            <button
                              key={idx}
                              className={styles.actionButton}
                              onClick={() => runAction(action)}
                              disabled={runningAction === action.label}
                            >
                              {runningAction === action.label ? 'Running...' : action.label}
                            </button>
                          );
                        }
                        return null;
                      })}
                    </div>
                  )}
                  
                  {/* Quick Links */}
                  <div className={styles.linksRow}>
                    {phase.number === 2 && (
                      <Link
                        href={`/browse-cars/${slug}`}
                        className={styles.linkButton}
                        target="_blank"
                      >
                        🔗 View Car Page
                      </Link>
                    )}
                    {phase.number === 8 && (
                      <>
                        <Link
                          href={`/browse-cars/${slug}`}
                          className={styles.linkButton}
                          target="_blank"
                        >
                          🔗 View Car Page
                        </Link>
                        <Link
                          href="/ai-mechanic"
                          className={styles.linkButton}
                          target="_blank"
                        >
                          🤖 Test in AL
                        </Link>
                      </>
                    )}
                  </div>
                  
                  {/* Notes */}
                  <div className={styles.notesSection}>
                    <div className={styles.notesLabel}>Notes</div>
                    <textarea
                      className={styles.notesInput}
                      value={localRun?.[phase.notesKey] || ''}
                      onChange={(e) => handleNotesChange(phase.notesKey, e.target.value)}
                      placeholder="Add notes about this phase..."
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className={styles.footerActions}>
        <div>
          <label style={{ marginRight: '0.5rem', color: 'var(--text-secondary)' }}>
            Status:
          </label>
          <select
            className={styles.statusSelect}
            value={localRun?.status || 'in_progress'}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
        
        <button
          className={styles.saveButton}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : '💾 Save Changes'}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toast.isError ? styles.error : ''}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

