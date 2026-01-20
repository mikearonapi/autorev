'use client';

/**
 * Lap Time Estimator Component
 * 
 * Uses physics simulation to estimate track lap times based on:
 * - Vehicle power, weight, drivetrain
 * - Modifications (tires, suspension, brakes, aero)
 * - Driver skill level
 * - Track characteristics
 * 
 * Also allows users to log their actual track times for comparison.
 */

import React, { useState, useEffect, useMemo } from 'react';
import AskALButton from './AskALButton';
import styles from './LapTimeEstimator.module.css';
import { Icons } from '@/components/ui/Icons';

// ==========================================================================
// DRIVER SKILL DEFINITIONS
// Key insight: Mods raise the ceiling, skill determines how much you use
// ==========================================================================
const DRIVER_SKILLS = {
  beginner: {
    label: 'Beginner',
    description: '0-2 years track experience',
    modUtilization: {
      power: 0.10,
      grip: 0.25,
      suspension: 0.15,
      brakes: 0.30,
      aero: 0.05,
      weight: 0.20,
    },
    tip: 'The best mod for you is seat time! Consider a driving school before spending on parts.',
    insight: 'At your skill level, improving your driving will gain you 3-5x more time than any modification.',
  },
  intermediate: {
    label: 'Intermediate',
    description: '2-5 years, consistent laps',
    modUtilization: {
      power: 0.45,
      grip: 0.60,
      suspension: 0.50,
      brakes: 0.55,
      aero: 0.35,
      weight: 0.50,
    },
    tip: 'Grip mods (tires, suspension) will help you most. Consider advanced driving instruction!',
    insight: 'You can extract about half of what mods offer. More seat time will unlock the rest.',
  },
  advanced: {
    label: 'Advanced',
    description: '5+ years, pushing limits',
    modUtilization: {
      power: 0.80,
      grip: 0.85,
      suspension: 0.80,
      brakes: 0.85,
      aero: 0.75,
      weight: 0.80,
    },
    tip: 'You can extract most performance from mods. Focus on balanced upgrades.',
    insight: 'Your skill extracts 80%+ of mod potential. Fine-tuning setup is your next step.',
  },
  professional: {
    label: 'Pro',
    description: 'Instructor / racer',
    modUtilization: {
      power: 0.98,
      grip: 0.98,
      suspension: 0.95,
      brakes: 0.98,
      aero: 0.95,
      weight: 0.95,
    },
    tip: 'You\'re extracting the car\'s full potential. Mods directly translate to lap time.',
    insight: 'This represents the theoretical maximum - what the modifications can truly deliver.',
  }
};

// Fallback tracks if API fails
const FALLBACK_TRACKS = [
  {
    slug: 'laguna-seca', name: 'WeatherTech Raceway Laguna Seca', shortName: 'Laguna Seca',
    length: 2.238, corners: 11, state: 'CA', city: 'Monterey', country: 'USA',
    proTime: 95, powerGainMax: 4.0, gripGainMax: 5.0, suspGainMax: 3.5,
    brakeGainMax: 2.5, aeroGainMax: 2.0, weightGainMax: 2.0,
    beginnerPenalty: 25, intermediatePenalty: 10, advancedPenalty: 3, isPopular: true,
    longestStraight: 2000, elevationChange: 180, surfaceType: 'Asphalt',
    characterTags: ['Technical', 'Elevation', 'Iconic', 'Corkscrew'],
  },
  {
    slug: 'road-atlanta', name: 'Road Atlanta', shortName: 'Road Atlanta',
    length: 2.54, corners: 12, icon: '🍑', state: 'GA', country: 'USA',
    proTime: 98, powerGainMax: 6.0, gripGainMax: 4.5, suspGainMax: 3.5,
    brakeGainMax: 3.0, aeroGainMax: 3.0, weightGainMax: 2.0,
    beginnerPenalty: 30, intermediatePenalty: 12, advancedPenalty: 4, isPopular: true,
  },
  {
    slug: 'cota', name: 'Circuit of the Americas', shortName: 'COTA',
    length: 3.426, corners: 20, icon: '⭐', state: 'TX', country: 'USA',
    proTime: 135, powerGainMax: 8.0, gripGainMax: 5.0, suspGainMax: 4.0,
    brakeGainMax: 3.5, aeroGainMax: 4.0, weightGainMax: 2.5,
    beginnerPenalty: 40, intermediatePenalty: 16, advancedPenalty: 5, isPopular: true,
  },
  {
    slug: 'autocross-standard', name: 'Autocross', shortName: 'Autocross',
    length: 0.5, corners: 20, icon: '🔀', state: null, country: 'USA',
    proTime: 48, powerGainMax: 0.5, gripGainMax: 4.0, suspGainMax: 2.5,
    brakeGainMax: 1.5, aeroGainMax: 0.3, weightGainMax: 1.5,
    beginnerPenalty: 15, intermediatePenalty: 6, advancedPenalty: 2, isPopular: true,
  },
];

export default function LapTimeEstimator({
  stockHp,
  estimatedHp,
  weight = 3500,
  drivetrain = 'RWD',
  tireCompound = 'summer',
  suspensionSetup = {},
  brakeSetup = {},
  aeroSetup = {},
  weightMod = 0,
  driverWeight = 180,
  user = null,
  carSlug = null,
  carName = null,
  modsSummary = null,
  compact = false,
  hideLogging = false,
}) {
  const [selectedTrackSlug, setSelectedTrackSlug] = useState('laguna-seca');
  const [driverSkill, setDriverSkill] = useState('intermediate');
  const [showInfo, setShowInfo] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTrackSelector, setShowTrackSelector] = useState(false);
  const [trackSearch, setTrackSearch] = useState('');
  const [trackHistory, setTrackHistory] = useState([]);
  const [allTracks, setAllTracks] = useState([]);
  const [tracksLoading, setTracksLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  
  // Form state for logging a track time
  const [logForm, setLogForm] = useState({
    lapTimeMinutes: '',
    lapTimeSeconds: '',
    sessionDate: new Date().toISOString().split('T')[0],
    conditions: 'dry',
    notes: ''
  });
  
  // Fetch tracks from database on mount
  useEffect(() => {
    async function fetchTracks() {
      try {
        const res = await fetch('/api/tracks');
        if (res.ok) {
          const data = await res.json();
          setAllTracks(data.tracks || []);
        }
      } catch (err) {
        console.error('Failed to fetch tracks:', err);
      } finally {
        setTracksLoading(false);
      }
    }
    fetchTracks();
  }, []);
  
  // Fetch track history when history panel is opened
  useEffect(() => {
    if (showHistory && user?.id && carSlug) {
      fetchTrackHistory();
    }
  }, [showHistory, user?.id, carSlug]);
  
  const fetchTrackHistory = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}/track-times?carSlug=${carSlug || ''}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setTrackHistory(data.times || []);
      }
    } catch (err) {
      console.error('Failed to fetch track history:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Use database tracks or fallback
  const tracks = allTracks.length > 0 ? allTracks : FALLBACK_TRACKS;
  const popularTracks = tracks.filter(t => t.isPopular).slice(0, 6);
  
  // Get currently selected track data
  const selectedTrack = tracks.find(t => t.slug === selectedTrackSlug) || tracks[0];
  
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
  // CALCULATE THEORETICAL MOD IMPROVEMENT
  // ==========================================================================
  const calculateModImprovement = () => {
    const track = selectedTrack;
    const improvements = { power: 0, grip: 0, suspension: 0, brakes: 0, aero: 0, weight: 0 };

    // Power gains
    const hpGain = Math.max(0, safeEstimatedHp - safeStockHp);
    const powerFactor = Math.min(1.0, hpGain / 200);
    improvements.power = powerFactor * (track.powerGainMax || 4);

    // Tire compound
    const tireLevel = {
      'all-season': 0,
      'summer': 0.15,
      'max-performance': 0.35,
      'r-comp': 0.75,
      'drag-radial': 0.10,
      'slick': 1.0
    }[tireCompound] || 0.15;
    improvements.grip = tireLevel * (track.gripGainMax || 5);

    // Suspension
    const suspLevel = {
      'stock': 0,
      'lowering-springs': 0.25,
      'coilovers': 0.60,
      'coilovers-race': 1.0,
      'air': 0.10
    }[suspensionSetup?.type] || 0;
    improvements.suspension = suspLevel * (track.suspGainMax || 3.5);

    // Brakes
    let brakeLevel = 0;
    if (brakeSetup?.bbkFront) brakeLevel += 0.40;
    if (brakeSetup?.brakePads === 'track') brakeLevel += 0.25;
    if (brakeSetup?.brakePads === 'race') brakeLevel += 0.40;
    if (brakeSetup?.brakeFluid === 'racing') brakeLevel += 0.10;
    if (brakeSetup?.stainlessLines) brakeLevel += 0.05;
    brakeLevel = Math.min(1.0, brakeLevel);
    improvements.brakes = brakeLevel * (track.brakeGainMax || 2.5);

    // Aero
    let aeroLevel = 0;
    if (aeroSetup?.rearWing === 'lip-spoiler') aeroLevel += 0.15;
    if (aeroSetup?.rearWing === 'ducktail') aeroLevel += 0.25;
    if (aeroSetup?.rearWing === 'gt-wing-low') aeroLevel += 0.60;
    if (aeroSetup?.rearWing === 'gt-wing-high') aeroLevel += 1.0;
    if (aeroSetup?.frontSplitter === 'lip') aeroLevel += 0.15;
    if (aeroSetup?.frontSplitter === 'splitter-rods') aeroLevel += 0.40;
    if (aeroSetup?.diffuser) aeroLevel += 0.25;
    aeroLevel = Math.min(1.0, aeroLevel);
    improvements.aero = aeroLevel * (track.aeroGainMax || 2);

    // Weight reduction
    const weightSaved = Math.abs(weightMod || 0);
    const weightLevel = Math.min(1.0, weightSaved / 200);
    improvements.weight = weightLevel * (track.weightGainMax || 2);

    return improvements;
  };

  // ==========================================================================
  // CALCULATE LAP TIMES
  // ==========================================================================
  const track = selectedTrack;
  const skill = DRIVER_SKILLS[driverSkill];
  
  const modImprovements = calculateModImprovement();
  const theoreticalTotal = Object.values(modImprovements).reduce((sum, val) => sum + val, 0);
  
  const realizedByCategory = {
    power: modImprovements.power * skill.modUtilization.power,
    grip: modImprovements.grip * skill.modUtilization.grip,
    suspension: modImprovements.suspension * skill.modUtilization.suspension,
    brakes: modImprovements.brakes * skill.modUtilization.brakes,
    aero: modImprovements.aero * skill.modUtilization.aero,
    weight: modImprovements.weight * skill.modUtilization.weight,
  };
  const realizedTotal = Object.values(realizedByCategory).reduce((sum, val) => sum + val, 0);
  
  // Stock lap time calculation
  const hpDifference = 400 - safeStockHp;
  const trackLengthFactor = (track.length || 3.0) / 3.0;
  const powerPenalty = hpDifference * 0.025 * trackLengthFactor;
  
  const skillPenalty = driverSkill === 'professional' 
    ? 0 
    : (track[`${driverSkill}Penalty`] || track.intermediatePenalty || 10);
  
  const stockLapTime = (track.proTime || 95) + powerPenalty + skillPenalty;
  const moddedLapTime = stockLapTime - realizedTotal;
  const unrealizedGains = theoreticalTotal - realizedTotal;
  const avgUtilization = theoreticalTotal > 0 ? (realizedTotal / theoreticalTotal) * 100 : 0;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${mins}:${secs.padStart(5, '0')}`;
  };

  const formatLapTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${mins}:${secs.padStart(5, '0')}`;
  };

  const handleLogTime = async () => {
    if (!user?.id) return;
    
    const minutes = parseInt(logForm.lapTimeMinutes || '0', 10);
    const seconds = parseFloat(logForm.lapTimeSeconds || '0');
    const totalSeconds = (minutes * 60) + seconds;
    
    if (totalSeconds < 20 || totalSeconds > 1200) {
      alert('Please enter a valid lap time between 20 seconds and 20 minutes');
      return;
    }
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}/track-times`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackName: selectedTrack.name,
          trackSlug: selectedTrack.slug,
          trackLengthMiles: selectedTrack.length,
          lapTimeSeconds: totalSeconds,
          sessionDate: logForm.sessionDate,
          conditions: logForm.conditions,
          tireCompound: tireCompound,
          modsSummary: modsSummary || {},
          estimatedHp: safeEstimatedHp,
          estimatedTimeSeconds: moddedLapTime,
          driverSkillLevel: driverSkill,
          notes: logForm.notes,
          carSlug: carSlug
        })
      });
      
      if (res.ok) {
        setLogForm({
          lapTimeMinutes: '',
          lapTimeSeconds: '',
          sessionDate: new Date().toISOString().split('T')[0],
          conditions: 'dry',
          notes: ''
        });
        setShowLogForm(false);
        fetchTrackHistory();
        setShowHistory(true);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save track time');
      }
    } catch (err) {
      console.error('Failed to log track time:', err);
      alert('Failed to save track time');
    } finally {
      setIsSaving(false);
    }
  };

  const requestAnalysis = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}/track-times/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carSlug })
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data.analysis);
      }
    } catch (err) {
      console.error('Failed to get analysis:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Build contextual prompt for Ask AL
  const hasModifications = safeEstimatedHp > safeStockHp;
  const timeImprovement = realizedTotal >= 0.01 ? realizedTotal.toFixed(2) : '0';
  
  const lapTimePrompt = carName
    ? `Help me understand my ${carName}'s lap time estimates at ${selectedTrack?.name || 'track'}. ${hasModifications ? `With my mods, I'm estimated to gain ${timeImprovement}s per lap, going from ${formatTime(stockLapTime)} to ${formatTime(moddedLapTime)}.` : 'It\'s currently stock.'} As a ${skill.label.toLowerCase()} driver, what mods would help me most on this track? Should I focus on power, grip, or driver skill improvement?`
    : `Explain these lap time estimates: ${formatTime(stockLapTime)} stock to ${formatTime(moddedLapTime)} modified at ${selectedTrack?.name || 'this track'}. What factors affect lap times most?`;
  
  const lapTimeDisplayMessage = hasModifications
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
        <AskALButton
          category="Lap Time Estimator"
          prompt={lapTimePrompt}
          displayMessage={lapTimeDisplayMessage}
          carName={carName}
          carSlug={carSlug}
          variant="header"
          metadata={{
            section: 'lap-time-estimator',
            trackName: selectedTrack?.name,
            trackSlug: selectedTrack?.slug,
            stockLapTime,
            moddedLapTime,
            timeImprovement: realizedTotal,
            driverSkill,
          }}
        />
      </div>

      {/* Info Panel - How it works */}
      {showInfo && (
        <div className={styles.lapTimeInfoPanel}>
          <h4>How Lap Time Estimation Works</h4>
          <p>
            We calculate potential time gains from your modifications based on power, 
            grip, suspension, brakes, aero, and weight. <strong>But here's the key insight:</strong>
          </p>
          <p>
            Modifications raise the <em>ceiling</em> of what's possible, but your skill 
            determines how much of that potential you can actually use.
          </p>
          <ul>
            <li><strong>Beginner:</strong> ~15-25% of mod potential (skill is the limiting factor)</li>
            <li><strong>Intermediate:</strong> ~45-55% of mod potential</li>
            <li><strong>Advanced:</strong> ~75-85% of mod potential</li>
            <li><strong>Professional:</strong> ~95-98% of mod potential (theoretical max)</li>
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
              {selectedTrack?.city && selectedTrack?.state 
                ? `${selectedTrack.city}, ${selectedTrack.state}` 
                : selectedTrack?.state || selectedTrack?.country}
              {selectedTrack?.length && ` • ${selectedTrack.length} mi • ${selectedTrack.corners} turns`}
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
        <div className={styles.lapTimeComparison}>
          <div className={styles.lapTimeColumn}>
            <span className={styles.lapTimeLabel}>Stock</span>
            <span className={styles.lapTimeStock}>{formatTime(stockLapTime)}</span>
          </div>
          <div className={styles.lapTimeDelta}>
            <Icons.chevronsRight size={20} />
            <span className={`${styles.lapTimeImprovement} ${realizedTotal > 0.5 ? styles.lapTimeGood : ''}`}>
              {realizedTotal >= 0.01 ? `-${realizedTotal.toFixed(2)}s` : '0.00s'}
            </span>
          </div>
          <div className={styles.lapTimeColumn}>
            <span className={styles.lapTimeLabel}>Modified</span>
            <span className={styles.lapTimeMod}>{formatTime(moddedLapTime)}</span>
          </div>
        </div>
      </div>
      
      {/* Contextual tip - only show when there's significant unrealized potential */}
      {unrealizedGains > 1.5 && driverSkill !== 'professional' && (
        <div className={styles.lapTimeTip}>
          <span>{skill.tip}</span>
        </div>
      )}
      
      {/* Track Time Logging Section */}
      {user && !hideLogging && (
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
                        <span>{new Date(time.session_date).toLocaleDateString()}</span>
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
