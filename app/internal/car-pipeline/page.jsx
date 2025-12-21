'use client';

/**
 * Car Pipeline Dashboard
 * 
 * Admin page for tracking car addition progress through the 8-phase pipeline.
 * Features:
 * - List all pipeline runs with status badges
 * - Progress bar showing phases complete (0-8)
 * - Filter by status (in_progress, completed, blocked)
 * - "Start New Car" button to create pipeline run
 */

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

// Phase configuration
const PHASES = [
  { key: 'phase1', name: 'Selection', fields: ['phase1_validated'] },
  { key: 'phase2', name: 'Core Data', fields: ['phase2_core_data'] },
  { key: 'phase3', name: 'Enrichment', fields: ['phase3_fuel_economy', 'phase3_safety_ratings', 'phase3_recalls'] },
  { key: 'phase4', name: 'Research', fields: ['phase4_known_issues', 'phase4_maintenance_specs', 'phase4_service_intervals', 'phase4_variants'] },
  { key: 'phase5', name: 'Scoring', fields: ['phase5_scores_assigned', 'phase5_strengths', 'phase5_weaknesses', 'phase5_alternatives'] },
  { key: 'phase6', name: 'Media', fields: ['phase6_hero_image', 'phase6_gallery_images'] },
  { key: 'phase7', name: 'YouTube', fields: ['phase7_videos_queued', 'phase7_videos_processed', 'phase7_car_links_verified'] },
  { key: 'phase8', name: 'QA', fields: ['phase8_data_complete', 'phase8_page_renders', 'phase8_al_tested', 'phase8_search_works', 'phase8_mobile_checked'] },
];

// Calculate phase completion status
function getPhaseStatus(run, phase) {
  const completedFields = phase.fields.filter(field => run[field] === true);
  if (completedFields.length === phase.fields.length) return 'complete';
  if (completedFields.length > 0) return 'partial';
  return 'pending';
}

// Calculate overall progress percentage
function getProgressPercent(run) {
  let completed = 0;
  let total = 0;
  
  PHASES.forEach(phase => {
    phase.fields.forEach(field => {
      total++;
      if (run[field] === true) completed++;
    });
  });
  
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

// Count completed phases
function getCompletedPhaseCount(run) {
  return PHASES.filter(phase => getPhaseStatus(run, phase) === 'complete').length;
}

export default function CarPipelinePage() {
  const router = useRouter();
  const [runs, setRuns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New car modal
  const [showNewCarModal, setShowNewCarModal] = useState(false);
  const [newCarSlug, setNewCarSlug] = useState('');
  const [newCarName, setNewCarName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // AI car modal
  const [showAICarModal, setShowAICarModal] = useState(false);
  const [aiCarName, setAiCarName] = useState('');
  const [isAIProcessing, setIsAIProcessing] = useState(false);

  useEffect(() => {
    fetchPipelineRuns();
  }, []);

  const fetchPipelineRuns = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/internal/car-pipeline');
      if (!response.ok) {
        throw new Error('Failed to fetch pipeline runs');
      }
      
      const data = await response.json();
      setRuns(data.runs || []);
    } catch (err) {
      console.error('[CarPipeline] Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter runs
  const filteredRuns = useMemo(() => {
    return runs.filter(run => {
      // Status filter
      if (statusFilter !== 'all' && run.status !== statusFilter) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = run.car_name?.toLowerCase().includes(query);
        const matchesSlug = run.car_slug?.toLowerCase().includes(query);
        if (!matchesName && !matchesSlug) {
          return false;
        }
      }
      
      return true;
    });
  }, [runs, statusFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: runs.length,
      inProgress: runs.filter(r => r.status === 'in_progress').length,
      completed: runs.filter(r => r.status === 'completed').length,
      blocked: runs.filter(r => r.status === 'blocked').length,
    };
  }, [runs]);

  // Create new pipeline run
  const handleCreateRun = async (e) => {
    e.preventDefault();
    
    if (!newCarSlug || !newCarName) return;
    
    setIsCreating(true);
    try {
      const response = await fetch('/api/internal/car-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          car_slug: newCarSlug,
          car_name: newCarName,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create pipeline run');
      }
      
      const data = await response.json();
      
      // Close modal and refresh
      setShowNewCarModal(false);
      setNewCarSlug('');
      setNewCarName('');
      await fetchPipelineRuns();
      
      // Navigate to the new run
      router.push(`/internal/car-pipeline/${data.run.car_slug}`);
    } catch (err) {
      console.error('[CarPipeline] Create error:', err);
      alert(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  // AI car addition
  const handleAICarAddition = async (e) => {
    e.preventDefault();
    
    if (!aiCarName) return;
    
    setIsAIProcessing(true);
    try {
      const response = await fetch('/api/internal/add-car-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          car_name: aiCarName,
          options: { verbose: true }
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start AI car research');
      }
      
      const data = await response.json();
      
      // Show success message
      alert(`🤖 AI is now researching "${aiCarName}"!\n\nEstimated time: ${data.estimated_duration}\n\nYou can track progress in the pipeline dashboard.`);
      
      // Close modal and refresh
      setShowAICarModal(false);
      setAiCarName('');
      await fetchPipelineRuns();
      
      // Navigate to the pipeline run if available
      if (data.status_url) {
        setTimeout(() => {
          router.push(data.status_url);
        }, 1000);
      }
    } catch (err) {
      console.error('[CarPipeline] AI error:', err);
      alert(`AI car research failed: ${err.message}`);
    } finally {
      setIsAIProcessing(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
          <p>Loading pipeline runs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error Loading Pipeline</h2>
          <p>{error}</p>
          <button onClick={fetchPipelineRuns} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🚗 Car Pipeline Dashboard</h1>
        <p className={styles.subtitle}>
          Track progress of new car additions through the 8-phase pipeline
        </p>
      </header>

      {/* Stats Row */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Total Cars</div>
        </div>
        <div className={`${styles.statCard} ${styles.inProgress}`}>
          <div className={styles.statValue}>{stats.inProgress}</div>
          <div className={styles.statLabel}>In Progress</div>
        </div>
        <div className={`${styles.statCard} ${styles.completed}`}>
          <div className={styles.statValue}>{stats.completed}</div>
          <div className={styles.statLabel}>Completed</div>
        </div>
        <div className={`${styles.statCard} ${styles.blocked}`}>
          <div className={styles.statValue}>{stats.blocked}</div>
          <div className={styles.statLabel}>Blocked</div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className={styles.actionsBar}>
        <div className={styles.filtersGroup}>
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </select>
          
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className={styles.actionsGroup}>
          <button
            className={styles.secondaryButton}
            onClick={fetchPipelineRuns}
          >
            🔄 Refresh
          </button>
          <button
            className={styles.secondaryButton}
            onClick={() => setShowNewCarModal(true)}
          >
            ➕ Manual Pipeline
          </button>
          <button
            className={styles.primaryButton}
            onClick={() => setShowAICarModal(true)}
          >
            🤖 AI Add Car
          </button>
        </div>
      </div>

      {/* Pipeline List */}
      {filteredRuns.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No Pipeline Runs</h3>
          <p>
            {searchQuery || statusFilter !== 'all'
              ? 'No cars match your filters. Try adjusting your search.'
              : 'Start tracking your first car addition by clicking "Start New Car".'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <button
              className={styles.primaryButton}
              onClick={() => setShowAICarModal(true)}
            >
              🤖 AI Add Car
            </button>
          )}
        </div>
      ) : (
        <div className={styles.pipelineList}>
          {filteredRuns.map((run) => {
            const progress = getProgressPercent(run);
            const completedPhases = getCompletedPhaseCount(run);
            
            return (
              <Link
                key={run.id}
                href={`/internal/car-pipeline/${run.car_slug}`}
                className={styles.pipelineCard}
              >
                <div className={styles.pipelineCardHeader}>
                  <div className={styles.pipelineCardTitle}>
                    <span className={styles.carName}>{run.car_name}</span>
                    <span className={styles.carSlug}>{run.car_slug}</span>
                  </div>
                  <span className={`${styles.statusBadge} ${styles[run.status === 'in_progress' ? 'inProgress' : run.status]}`}>
                    {run.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className={styles.progressSection}>
                  <div className={styles.progressBarContainer}>
                    <div
                      className={styles.progressBar}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className={styles.progressText}>
                    {completedPhases}/8 phases • {progress}%
                  </span>
                </div>
                
                <div className={styles.phasePills}>
                  {PHASES.map((phase) => {
                    const status = getPhaseStatus(run, phase);
                    return (
                      <span
                        key={phase.key}
                        className={`${styles.phasePill} ${styles[status]}`}
                      >
                        {status === 'complete' && '✓ '}
                        {status === 'partial' && '◐ '}
                        {phase.name}
                      </span>
                    );
                  })}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* New Car Modal */}
      {showNewCarModal && (
        <div className={styles.modalOverlay} onClick={() => setShowNewCarModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Start New Car Pipeline</h2>
              <button
                className={styles.closeButton}
                onClick={() => setShowNewCarModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateRun}>
              <div className={styles.formGroup}>
                <label htmlFor="carSlug">Car Slug</label>
                <input
                  id="carSlug"
                  type="text"
                  value={newCarSlug}
                  onChange={(e) => setNewCarSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="brand-model-generation"
                  required
                />
                <p className={styles.formHint}>
                  Format: brand-model-generation (e.g., porsche-911-992)
                </p>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="carName">Car Name</label>
                <input
                  id="carName"
                  type="text"
                  value={newCarName}
                  onChange={(e) => setNewCarName(e.target.value)}
                  placeholder="Porsche 911 (992)"
                  required
                />
                <p className={styles.formHint}>
                  Display name for the car
                </p>
              </div>
              
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setShowNewCarModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={isCreating || !newCarSlug || !newCarName}
                >
                  {isCreating ? 'Creating...' : 'Create Pipeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Car Modal */}
      {showAICarModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAICarModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>🤖 AI Add Car</h2>
              <button
                className={styles.closeButton}
                onClick={() => setShowAICarModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className={styles.aiModalDesc}>
              <p>
                <strong>Fully automated car addition!</strong> Just enter the car name and AI will:
              </p>
              <ul>
                <li>🔬 Research all specifications and pricing</li>
                <li>🔍 Find known issues and maintenance schedules</li>
                <li>📊 Assign expert scores and write editorial content</li>
                <li>🖼️ Generate hero images</li>
                <li>💾 Save everything to the database</li>
              </ul>
              <p><em>Estimated time: 3-5 minutes</em></p>
            </div>
            
            <form onSubmit={handleAICarAddition}>
              <div className={styles.formGroup}>
                <label htmlFor="aiCarName">Car Name</label>
                <input
                  id="aiCarName"
                  type="text"
                  value={aiCarName}
                  onChange={(e) => setAiCarName(e.target.value)}
                  placeholder="Porsche 911 GT3 (992)"
                  required
                  autoFocus
                />
                <p className={styles.formHint}>
                  Examples: "BMW M3 Competition (G80)", "McLaren 570S", "Toyota Supra (A90)"
                </p>
              </div>
              
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setShowAICarModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={isAIProcessing || !aiCarName}
                >
                  {isAIProcessing ? '🤖 AI Researching...' : '🚀 Start AI Research'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

