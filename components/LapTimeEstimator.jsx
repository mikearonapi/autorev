'use client';

/**
 * Lap Time Estimator Component
 * 
 * Data-driven lap time estimation using real lap time data.
 * Uses the centralized lapTimeService for all calculations.
 * 
 * Features:
 * - Real data from 3,800+ lap times across 340+ tracks
 * - Driver skill-based estimation (beginner to pro)
 * - Modification impact calculation
 * - Track time logging and history
 */

import React, { useState, useMemo } from 'react';

import { Icons } from '@/components/ui/Icons';
import { useTracks } from '@/hooks/useEventsData';
import { useLapTimeEstimate, useTrackStats, DRIVER_SKILLS, formatLapTime } from '@/hooks/useLapTimeEstimate';
import { useUserTrackTimes, useAddTrackTime, useAnalyzeTrackTimes } from '@/hooks/useUserData';
import { formatDateSimple } from '@/lib/dateUtils';

import styles from './LapTimeEstimator.module.css';
import InfoTooltip from './ui/InfoTooltip';

export default function LapTimeEstimator({
  stockHp,
  estimatedHp,
  weight = 3500,
  drivetrain: _drivetrain = 'RWD',
  tireCompound = 'summer',
  suspensionSetup = {},
  brakeSetup = {},
  aeroSetup = {},
  weightMod = 0,
  driverWeight: _driverWeight = 180,
  user = null,
  carSlug = null,
  carName = null,
  modsSummary = null,
  compact = false,
  hideLogging = false,
}) {
  const [selectedTrackSlug, setSelectedTrackSlug] = useState(null); // No default - user must select
  const [driverSkill, setDriverSkill] = useState('intermediate');
  const [showInfo, setShowInfo] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTrackSelector, setShowTrackSelector] = useState(false);
  const [trackSearch, setTrackSearch] = useState('');
  const [analysis, setAnalysis] = useState(null);
  
  // Fetch tracks using React Query (cached)
  const { data: allTracks = [], isLoading: _tracksLoading } = useTracks();
  
  // React Query hooks for track times
  const { 
    data: trackHistory = [], 
    isLoading: isLoadingHistory,
    refetch: _refetchHistory,
  } = useUserTrackTimes(user?.id, carSlug, { 
    enabled: showHistory && !!user?.id,
    limit: 10,
  });
  
  const addTrackTime = useAddTrackTime();
  const analyzeTrackTimes = useAnalyzeTrackTimes();
  
  const isLoading = isLoadingHistory || analyzeTrackTimes.isPending;
  const isSaving = addTrackTime.isPending;
  
  // Form state for logging a track time
  const [logForm, setLogForm] = useState({
    lapTimeMinutes: '',
    lapTimeSeconds: '',
    sessionDate: new Date().toISOString().split('T')[0],
    conditions: 'dry',
    notes: ''
  });
  
  // Use database tracks
  const tracks = allTracks;
  const popularTracks = tracks.filter(t => t.isPopular).slice(0, 6);
  
  // Get currently selected track data (null if none selected)
  const selectedTrack = selectedTrackSlug ? tracks.find(t => t.slug === selectedTrackSlug) : null;
  
  // Filter tracks for search
  const filteredTracks = useMemo(() => {
    if (!trackSearch.trim()) return tracks;
    const search = trackSearch.toLowerCase();
    return tracks.filter(t => 
      t.name.toLowerCase().includes(search) ||
      t.shortName?.toLowerCase().includes(search) ||
      t.state?.toLowerCase().includes(search) ||
      t.city?.toLowerCase().includes(search)
    );
  }, [tracks, trackSearch]);

  // Safe values
  const safeStockHp = (typeof stockHp === 'number' && !isNaN(stockHp) && stockHp > 0) ? stockHp : 300;
  const safeEstimatedHp = (typeof estimatedHp === 'number' && !isNaN(estimatedHp) && estimatedHp > 0) ? estimatedHp : safeStockHp;
  const safeWeight = (typeof weight === 'number' && !isNaN(weight) && weight > 0) ? weight : 3500;

  // ==========================================================================
  // DATA-DRIVEN LAP TIME ESTIMATION (via lapTimeService)
  // ==========================================================================
  
  // Build mods object for the service
  const modsForEstimate = useMemo(() => ({
    tireCompound,
    suspension: suspensionSetup,
    brakes: {
      bbkFront: brakeSetup?.bbkFront,
      pads: brakeSetup?.brakePads,
      fluid: brakeSetup?.brakeFluid,
      stainlessLines: brakeSetup?.stainlessLines,
    },
    aero: aeroSetup,
    weightReduction: Math.abs(weightMod || 0),
  }), [tireCompound, suspensionSetup, brakeSetup, aeroSetup, weightMod]);
  
  // Use the data-driven lap time estimation hook
  const { 
    data: lapTimeEstimate,
    isLoading: isEstimateLoading,
  } = useLapTimeEstimate({
    trackSlug: selectedTrackSlug,
    stockHp: safeStockHp,
    currentHp: safeEstimatedHp,
    weight: safeWeight,
    driverSkill,
    mods: modsForEstimate,
  }, {
    enabled: !!selectedTrackSlug,
  });
  
  // Get track statistics for context
  const { data: _trackStats } = useTrackStats(selectedTrackSlug, {
    enabled: !!selectedTrackSlug,
  });

  // Extract values from estimate (with fallbacks for loading state)
  const skill = DRIVER_SKILLS[driverSkill];
  const hasRealData = lapTimeEstimate?.source === 'real_data';
  const stockLapTime = lapTimeEstimate?.stockLapTime || 0;
  const moddedLapTime = lapTimeEstimate?.moddedLapTime || 0;
  const realizedTotal = lapTimeEstimate?.improvement || 0;
  const theoreticalTotal = lapTimeEstimate?.theoreticalImprovement || 0;
  const unrealizedGains = theoreticalTotal - realizedTotal;
  const sampleSize = lapTimeEstimate?.sampleSize || 0;

  // Format time helper (use imported formatLapTime from hook)
  const formatTime = formatLapTime;

  const handleLogTime = async () => {
    if (!user?.id) return;
    
    const minutes = parseInt(logForm.lapTimeMinutes || '0', 10);
    const seconds = parseFloat(logForm.lapTimeSeconds || '0');
    const totalSeconds = (minutes * 60) + seconds;
    
    if (totalSeconds < 20 || totalSeconds > 1200) {
      alert('Please enter a valid lap time between 20 seconds and 20 minutes');
      return;
    }
    
    try {
      await addTrackTime.mutateAsync({
        userId: user.id,
        trackTime: {
          trackName: selectedTrack?.name || 'Unknown Track',
          trackSlug: selectedTrack?.slug || selectedTrackSlug,
          trackLengthMiles: selectedTrack?.length,
          lapTimeSeconds: totalSeconds,
          sessionDate: logForm.sessionDate,
          conditions: logForm.conditions,
          tireCompound: tireCompound,
          modsSummary: modsSummary || {},
          estimatedHp: safeEstimatedHp,
          estimatedTimeSeconds: moddedLapTime || null,
          driverSkillLevel: driverSkill,
          notes: logForm.notes,
          carSlug: carSlug
        }
      });
      
      setLogForm({
        lapTimeMinutes: '',
        lapTimeSeconds: '',
        sessionDate: new Date().toISOString().split('T')[0],
        conditions: 'dry',
        notes: ''
      });
      setShowLogForm(false);
      setShowHistory(true);
    } catch (err) {
      console.error('Failed to log track time:', err);
      alert(err.message || 'Failed to save track time');
    }
  };

  const requestAnalysis = async () => {
    if (!user?.id) return;
    try {
      const data = await analyzeTrackTimes.mutateAsync({ userId: user.id, carSlug });
      setAnalysis(data.analysis);
    } catch (err) {
      console.error('Failed to get analysis:', err);
    }
  };

  // Build contextual prompt for Ask AL
  const hasModifications = safeEstimatedHp > safeStockHp;
  const timeImprovement = realizedTotal >= 0.01 ? realizedTotal.toFixed(2) : '0';
  
  const _lapTimePrompt = carName
    ? `Help me understand my ${carName}'s lap time estimates at ${selectedTrack?.name || 'track'}. ${hasModifications ? `With my mods, I'm estimated to gain ${timeImprovement}s per lap, going from ${formatTime(stockLapTime)} to ${formatTime(moddedLapTime)}.` : 'It\'s currently stock.'} As a ${skill.label.toLowerCase()} driver, what mods would help me most on this track? Should I focus on power, grip, or driver skill improvement?`
    : `Explain these lap time estimates: ${formatTime(stockLapTime)} stock to ${formatTime(moddedLapTime)} modified at ${selectedTrack?.name || 'this track'}. What factors affect lap times most?`;
  
  const _lapTimeDisplayMessage = hasModifications
    ? `How can I get faster at ${selectedTrack?.shortName || 'track'}?`
    : 'What mods help lap times most?';

  return (
    <div className={`${styles.lapTimeEstimator} ${compact ? styles.compact : ''}`}>
      <div className={styles.lapTimeHeader}>
        <div className={styles.lapTimeTitleRow}>
          <Icons.flag size={18} />
          <span>Lap Time Estimator</span>
          <button 
            className={styles.lapTimeInfoBtn}
            onClick={() => setShowInfo(!showInfo)}
            title="How this works"
          >
            <Icons.info size={14} />
          </button>
        </div>
      </div>

      {/* Info Panel - How it works */}
      {showInfo && (
        <div className={styles.lapTimeInfoPanel}>
          <h4>How Lap Time Estimation Works</h4>
          {hasRealData ? (
            <>
              <p>
                <strong>Data-driven estimates</strong> using {sampleSize.toLocaleString()}+ real lap times 
                from this track. We analyze times from similar cars to estimate yours.
              </p>
              <p>
                Modifications raise the <em>ceiling</em> of what's possible, but your skill 
                determines how much of that potential you can actually use.
              </p>
            </>
          ) : (
            <p>
              Limited data for this track. Log your times to help build our database!
            </p>
          )}
          <ul>
            <li><strong>Beginner:</strong> ~20% of mod potential (skill is the limiting factor)</li>
            <li><strong>Intermediate:</strong> ~50% of mod potential</li>
            <li><strong>Advanced:</strong> ~80% of mod potential</li>
            <li><strong>Professional:</strong> ~95% of mod potential (theoretical max)</li>
          </ul>
          <p className={styles.lapTimeInfoHighlight}>
            The fastest path to quicker lap times is often improving YOUR skills, not adding parts!
          </p>
        </div>
      )}

      {/* Track Selector - WHERE are you racing? */}
      <div className={styles.trackSelectorWrapper}>
        <button 
          className={styles.trackSelectedBtn}
          onClick={() => setShowTrackSelector(!showTrackSelector)}
        >
          <div className={styles.trackSelectedInfo}>
            <span className={styles.trackSelectedName}>{selectedTrack?.name || 'Select Track'}</span>
            <span className={styles.trackSelectedMeta}>
              {selectedTrack ? (
                <>
                  {selectedTrack.city && selectedTrack.state 
                    ? `${selectedTrack.city}, ${selectedTrack.state}` 
                    : selectedTrack.state || selectedTrack.country}
                  {selectedTrack.length && ` • ${selectedTrack.length} mi • ${selectedTrack.corners} turns`}
                </>
              ) : (
                'Choose a track to estimate lap times'
              )}
            </span>
          </div>
          <Icons.chevronDown size={16} />
        </button>
        
        {/* Dropdown */}
        {showTrackSelector && (
          <div className={styles.trackDropdown}>
            <div className={styles.trackSearchContainer}>
              <Icons.search size={14} />
              <input
                type="text"
                className={styles.trackSearchInput}
                placeholder="Search tracks..."
                value={trackSearch}
                onChange={(e) => setTrackSearch(e.target.value)}
                autoFocus
              />
              {trackSearch && (
                <button 
                  className={styles.trackClearBtn}
                  onClick={() => setTrackSearch('')}
                >
                  <Icons.x size={12} />
                </button>
              )}
            </div>
            
            {!trackSearch && (
              <div className={styles.trackQuickPicks}>
                <span className={styles.trackQuickLabel}>Popular Tracks</span>
                {popularTracks.slice(0, 6).map((t) => (
                  <button
                    key={t.slug}
                    className={`${styles.trackResultItem} ${selectedTrackSlug === t.slug ? styles.trackResultItemActive : ''}`}
                    onClick={() => { setSelectedTrackSlug(t.slug); setShowTrackSelector(false); }}
                  >
                    <div className={styles.trackResultInfo}>
                      <span className={styles.trackResultName}>{t.name}</span>
                      <span className={styles.trackResultMeta}>
                        {t.city && t.state ? `${t.city}, ${t.state}` : t.state}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            <div className={styles.trackResultsSection}>
              <span className={styles.trackQuickLabel}>
                {trackSearch ? `Results for "${trackSearch}"` : 'All Tracks'}
              </span>
              <div className={styles.trackResultsList}>
                {(trackSearch ? filteredTracks : tracks).slice(0, 20).map((t) => (
                  <button
                    key={t.slug}
                    className={`${styles.trackResultItem} ${selectedTrackSlug === t.slug ? styles.trackResultItemActive : ''}`}
                    onClick={() => { setSelectedTrackSlug(t.slug); setShowTrackSelector(false); setTrackSearch(''); }}
                  >
                    <div className={styles.trackResultInfo}>
                      <span className={styles.trackResultName}>{t.name}</span>
                      <span className={styles.trackResultMeta}>
                        {t.city && t.state ? `${t.city}, ${t.state}` : t.state || t.country}
                        {t.length && ` • ${t.length} mi`}
                      </span>
                    </div>
                  </button>
                ))}
                {trackSearch && filteredTracks.length === 0 && (
                  <div className={styles.trackNoResults}>
                    No tracks found for "{trackSearch}"
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Driver Skill Selector - WHO is driving? */}
      <div className={styles.skillSelector}>
        <span className={styles.skillLabel}>Driver Skill:</span>
        <div className={styles.skillBtns}>
          {Object.entries(DRIVER_SKILLS).map(([key, skillDef]) => (
            <button
              key={key}
              className={`${styles.skillBtn} ${driverSkill === key ? styles.skillBtnActive : ''}`}
              onClick={() => setDriverSkill(key)}
              title={skillDef.description}
            >
              {skillDef.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lap Time Comparison */}
      <div className={styles.lapTimeBody}>
        {!selectedTrack ? (
          <div className={styles.lapTimeNoData}>
            <p>Select a track above to see lap time estimates</p>
            <p className={styles.lapTimeNoDataHint}>Choose from {tracks.length > 0 ? `${tracks.length} tracks` : 'popular tracks'} worldwide</p>
          </div>
        ) : isEstimateLoading ? (
          <div className={styles.lapTimeLoading}>
            <span>Calculating estimate...</span>
          </div>
        ) : !hasRealData ? (
          <div className={styles.lapTimeNoData}>
            <p>Limited lap time data for this track.</p>
            <p className={styles.lapTimeNoDataHint}>Log your times to help build the database!</p>
          </div>
        ) : (
          <div className={styles.lapTimeComparison}>
            <div className={styles.lapTimeColumn}>
              <InfoTooltip topicKey="lapTimeEstimate" carName={carName} carSlug={carSlug}>
                <span className={styles.lapTimeLabel}>Stock</span>
              </InfoTooltip>
              <span className={styles.lapTimeStock}>{formatTime(stockLapTime)}</span>
            </div>
            <div className={styles.lapTimeDelta}>
              <Icons.chevronsRight size={20} />
              <span className={`${styles.lapTimeImprovement} ${realizedTotal > 0.5 ? styles.lapTimeGood : ''}`}>
                {realizedTotal >= 0.01 ? `-${realizedTotal.toFixed(2)}s` : '0.00s'}
              </span>
            </div>
            <div className={styles.lapTimeColumn}>
              <InfoTooltip topicKey="lapTimeEstimate" carName={carName} carSlug={carSlug}>
                <span className={styles.lapTimeLabel}>Modified</span>
              </InfoTooltip>
              <span className={styles.lapTimeMod}>{formatTime(moddedLapTime)}</span>
            </div>
          </div>
        )}
        
        {/* Data source indicator */}
        {selectedTrack && hasRealData && sampleSize > 0 && (
          <div className={styles.lapTimeDataSource}>
            Based on {sampleSize.toLocaleString()} real lap times
          </div>
        )}
      </div>
      
      {/* Contextual tip - only show when there's significant unrealized potential */}
      {selectedTrack && hasRealData && unrealizedGains > 1.5 && driverSkill !== 'professional' && (
        <div className={styles.lapTimeTip}>
          <span>{skill?.tip}</span>
        </div>
      )}
      
      {/* Track Time Logging Section - only show when track is selected */}
      {selectedTrack && user && !hideLogging && (
        <div className={styles.trackTimeLogging}>
          <div className={styles.trackTimeActions}>
            <button 
              className={`${styles.trackTimeBtn} ${showLogForm ? styles.trackTimeBtnActive : ''}`}
              onClick={() => { setShowLogForm(!showLogForm); setShowHistory(false); }}
            >
              <Icons.plus size={14} />
              Log Your Time
            </button>
            <button 
              className={`${styles.trackTimeBtn} ${showHistory ? styles.trackTimeBtnActive : ''}`}
              onClick={() => { setShowHistory(!showHistory); setShowLogForm(false); }}
            >
              <Icons.clock size={14} />
              History
            </button>
          </div>
          
          {/* Log Form */}
          {showLogForm && (
            <div className={styles.logTimeForm}>
              <div className={styles.logTimeHeader}>
                <h4>Log Track Time at {selectedTrack.name}</h4>
                <p>Record your actual lap time to compare with estimates</p>
              </div>
              
              <div className={styles.logTimeFields}>
                <div className={styles.logTimeRow}>
                  <label className={styles.logTimeLabel}>Lap Time</label>
                  <div className={styles.logTimeInputGroup}>
                    <input
                      type="number"
                      className={styles.logTimeInput}
                      placeholder="0"
                      min="0"
                      max="20"
                      value={logForm.lapTimeMinutes}
                      onChange={(e) => setLogForm({ ...logForm, lapTimeMinutes: e.target.value })}
                    />
                    <span className={styles.logTimeInputLabel}>min</span>
                    <input
                      type="number"
                      className={styles.logTimeInput}
                      placeholder="00.00"
                      min="0"
                      max="59.99"
                      step="0.01"
                      value={logForm.lapTimeSeconds}
                      onChange={(e) => setLogForm({ ...logForm, lapTimeSeconds: e.target.value })}
                    />
                    <span className={styles.logTimeInputLabel}>sec</span>
                  </div>
                </div>
                
                <div className={styles.logTimeRow}>
                  <label className={styles.logTimeLabel}>Date</label>
                  <input
                    type="date"
                    className={styles.logTimeDateInput}
                    value={logForm.sessionDate}
                    onChange={(e) => setLogForm({ ...logForm, sessionDate: e.target.value })}
                  />
                </div>
                
                <div className={styles.logTimeRow}>
                  <label className={styles.logTimeLabel}>Conditions</label>
                  <select
                    className={styles.logTimeSelect}
                    value={logForm.conditions}
                    onChange={(e) => setLogForm({ ...logForm, conditions: e.target.value })}
                  >
                    <option value="dry">Dry</option>
                    <option value="damp">Damp</option>
                    <option value="wet">Wet</option>
                    <option value="cold">Cold Track</option>
                    <option value="hot">Hot Track</option>
                    <option value="optimal">Optimal</option>
                  </select>
                </div>
                
                <div className={styles.logTimeRow}>
                  <label className={styles.logTimeLabel}>Notes</label>
                  <textarea
                    className={styles.logTimeTextarea}
                    placeholder="How did the car feel? Any issues? What worked well?"
                    value={logForm.notes}
                    onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
              
              <div className={styles.logTimeCompare}>
                <div className={styles.logTimeCompareItem}>
                  <span className={styles.logTimeCompareLabel}>Estimated time:</span>
                  <span className={styles.logTimeCompareValue}>{formatTime(moddedLapTime)}</span>
                </div>
                {(logForm.lapTimeMinutes || logForm.lapTimeSeconds) && (
                  <div className={styles.logTimeCompareItem}>
                    <span className={styles.logTimeCompareLabel}>Your time:</span>
                    <span className={styles.logTimeCompareValue}>
                      {formatLapTime((parseInt(logForm.lapTimeMinutes || '0', 10) * 60) + parseFloat(logForm.lapTimeSeconds || '0'))}
                    </span>
                  </div>
                )}
              </div>
              
              <button 
                className={styles.logTimeSaveBtn}
                onClick={handleLogTime}
                disabled={isSaving || (!logForm.lapTimeMinutes && !logForm.lapTimeSeconds)}
              >
                {isSaving ? 'Saving...' : 'Save Track Time'}
              </button>
            </div>
          )}
          
          {/* History Panel */}
          {showHistory && (
            <div className={styles.trackHistoryPanel}>
              <div className={styles.trackHistoryHeader}>
                <h4>Your Track Times</h4>
                {trackHistory.length >= 2 && (
                  <button 
                    className={styles.trackAnalyzeBtn}
                    onClick={requestAnalysis}
                    disabled={isLoading}
                  >
                    <Icons.brain size={14} />
                    {isLoading ? 'Analyzing...' : 'Get AL Insights'}
                  </button>
                )}
              </div>
              
              {isLoading && trackHistory.length === 0 ? (
                <div className={styles.trackHistoryLoading}>Loading...</div>
              ) : trackHistory.length === 0 ? (
                <div className={styles.trackHistoryEmpty}>
                  <p>No track times logged yet.</p>
                  <p>Log your first time to start tracking your progress!</p>
                </div>
              ) : (
                <div className={styles.trackHistoryList}>
                  {trackHistory.map((time, idx) => (
                    <div key={time.id || idx} className={styles.trackHistoryItem}>
                      <div className={styles.trackHistoryItemMain}>
                        <span className={styles.trackHistoryTrack}>{time.track_name}</span>
                        <span className={styles.trackHistoryTime}>{formatLapTime(time.lap_time_seconds)}</span>
                      </div>
                      <div className={styles.trackHistoryItemMeta}>
                        <span>{formatDateSimple(time.session_date)}</span>
                        {time.conditions && time.conditions !== 'dry' && (
                          <span className={styles.trackHistoryCondition}>{time.conditions}</span>
                        )}
                        {time.improvement_from_previous > 0 && (
                          <span className={styles.trackHistoryImprovement}>
                            ↓ {time.improvement_from_previous.toFixed(2)}s
                          </span>
                        )}
                      </div>
                      {time.notes && (
                        <div className={styles.trackHistoryNotes}>{time.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* AL Analysis Results */}
              {analysis && (
                <div className={styles.trackAnalysis}>
                  <div className={styles.trackAnalysisHeader}>
                    <Icons.brain size={16} />
                    <span>AL Analysis</span>
                  </div>
                  
                  {analysis.insights?.length > 0 && (
                    <div className={styles.trackAnalysisSection}>
                      <h5>Insights</h5>
                      {analysis.insights.map((insight, idx) => (
                        <div key={idx} className={`${styles.trackAnalysisItem} ${styles[`trackAnalysis${insight.type}`]}`}>
                          {insight.message}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {analysis.recommendations?.length > 0 && (
                    <div className={styles.trackAnalysisSection}>
                      <h5>Recommendations</h5>
                      {analysis.recommendations.map((rec, idx) => (
                        <div key={idx} className={styles.trackAnalysisRec}>
                          <strong>{rec.title}</strong>
                          <p>{rec.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
