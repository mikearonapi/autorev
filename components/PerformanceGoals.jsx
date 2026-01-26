'use client';

/**
 * Performance Goals Component
 * 
 * Part of the "My Data" gamification system.
 * Allows users to set performance targets and track progress.
 * 
 * "The track stuff is really cool, love the idea of it being a challenge. 
 *  Did you hit that number?" - Creates engagement loop and realistic expectation-setting
 * 
 * Brand Colors:
 * - Lime (#d4ff00): User actions, CTAs
 * - Teal (#10b981): Completed/achieved goals
 * - Blue (#3b82f6): In-progress/baseline
 * - Amber (#f59e0b): Warning/close to deadline (sparingly)
 */

import { useState, useCallback } from 'react';

import { formatDateSimple } from '@/lib/dateUtils';

import styles from './PerformanceGoals.module.css';

// Icons
const TargetIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const TrophyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

// Icons
const ZapIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const FlagIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
    <line x1="4" y1="22" x2="4" y2="15"/>
  </svg>
);

const RocketIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
);

// Goal type definitions
const GOAL_TYPES = {
  power: {
    label: 'Power Target',
    unit: 'WHP',
    Icon: ZapIcon,
    description: 'Set a wheel horsepower goal',
    placeholder: '500',
  },
  laptime: {
    label: 'Lap Time',
    unit: '',
    Icon: FlagIcon,
    description: 'Beat a target lap time',
    placeholder: '1:45.0',
  },
  acceleration: {
    label: '0-60 Time',
    unit: 's',
    Icon: RocketIcon,
    description: 'Hit a 0-60 mph target',
    placeholder: '4.0',
  },
};

// Suggested goals based on predicted performance
const getSuggestedGoals = (predictedWhp, predictedLapTime, predictedAccel) => {
  const suggestions = [];
  
  if (predictedWhp) {
    // Round up to nearest 50 as a nice target
    const roundedTarget = Math.ceil(predictedWhp / 50) * 50;
    suggestions.push({
      type: 'power',
      title: `Hit ${roundedTarget} WHP`,
      targetValue: roundedTarget,
      description: 'Your predicted WHP + a stretch goal',
    });
  }
  
  if (predictedAccel) {
    // Target 0.5s faster than predicted
    const targetAccel = Math.max(2.5, predictedAccel - 0.5);
    suggestions.push({
      type: 'acceleration',
      title: `${targetAccel.toFixed(1)}s 0-60`,
      targetValue: targetAccel,
      description: 'Beat your predicted acceleration',
    });
  }
  
  return suggestions;
};

/**
 * GoalCard Component - Individual goal display
 */
function GoalCard({ goal, onComplete, onDelete, onUpdate }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const goalType = GOAL_TYPES[goal.type] || GOAL_TYPES.power;
  const progress = goal.achievedValue && goal.targetValue 
    ? Math.min(100, (goal.achievedValue / goal.targetValue) * 100)
    : 0;
  const isCompleted = goal.status === 'completed';
  const isAchieved = goal.achievedValue >= goal.targetValue;
  
  // Format value based on type
  const formatValue = (val, type) => {
    if (type === 'laptime') {
      // Convert seconds to MM:SS.mmm
      const mins = Math.floor(val / 60);
      const secs = (val % 60).toFixed(1);
      return mins > 0 ? `${mins}:${secs.padStart(4, '0')}` : `${secs}s`;
    }
    return `${Math.round(val)}${goalType.unit}`;
  };
  
  const GoalIcon = goalType.Icon;
  
  return (
    <div className={`${styles.goalCard} ${isCompleted ? styles.completed : ''}`}>
      <div className={styles.goalHeader}>
        <div className={styles.goalIcon}>
          {isCompleted ? <TrophyIcon /> : <GoalIcon />}
        </div>
        <div className={styles.goalInfo}>
          <h4 className={styles.goalTitle}>{goal.title}</h4>
          <div className={styles.goalMeta}>
            <span className={styles.goalTarget}>
              Target: {formatValue(goal.targetValue, goal.type)}
            </span>
            {goal.deadline && (
              <span className={styles.goalDeadline}>
                <ClockIcon />
                {formatDateSimple(goal.deadline)}
              </span>
            )}
          </div>
        </div>
        <div className={styles.goalActions}>
          {!isCompleted && (
            <button 
              className={styles.completeBtn}
              onClick={() => onComplete(goal.id)}
              title="Mark as complete"
            >
              <CheckIcon />
            </button>
          )}
          <button 
            className={styles.deleteBtn}
            onClick={() => onDelete(goal.id)}
            title="Remove goal"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
      
      {/* Progress Bar */}
      {!isCompleted && goal.achievedValue !== null && (
        <div className={styles.progressSection}>
          <div className={styles.progressTrack}>
            <div 
              className={`${styles.progressFill} ${isAchieved ? styles.achieved : ''}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className={styles.progressLabels}>
            <span className={styles.currentValue}>
              Current: {formatValue(goal.achievedValue, goal.type)}
            </span>
            <span className={styles.progressPercent}>
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      )}
      
      {/* Completion Badge */}
      {isCompleted && (
        <div className={styles.completedBadge}>
          <TrophyIcon />
          <span>Goal Achieved!</span>
          {goal.completedAt && (
            <span className={styles.completedDate}>
              {formatDateSimple(goal.completedAt)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * AddGoalForm Component - Form for adding new goals
 */
function AddGoalForm({ onAdd, onCancel, suggestions }) {
  const [goalType, setGoalType] = useState('power');
  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [deadline, setDeadline] = useState('');
  
  const selectedType = GOAL_TYPES[goalType];
  
  const handleGoalSubmit = (e) => {
    e.preventDefault();
    if (!title || !targetValue) return;
    
    onAdd({
      type: goalType,
      title,
      targetValue: parseFloat(targetValue),
      deadline: deadline || null,
    });
    
    // Reset form
    setTitle('');
    setTargetValue('');
    setDeadline('');
  };
  
  const handleUseSuggestion = (suggestion) => {
    setGoalType(suggestion.type);
    setTitle(suggestion.title);
    setTargetValue(suggestion.targetValue.toString());
  };
  
  return (
    <form onSubmit={handleGoalSubmit} className={styles.addGoalForm}>
      <h4 className={styles.formTitle}>Set a New Goal</h4>
      
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className={styles.suggestions}>
          <span className={styles.suggestionsLabel}>Quick Add:</span>
          {suggestions.map((sug, idx) => (
            <button
              key={idx}
              type="button"
              className={styles.suggestionBtn}
              onClick={() => handleUseSuggestion(sug)}
            >
              {sug.title}
            </button>
          ))}
        </div>
      )}
      
      {/* Goal Type Selection */}
      <div className={styles.typeSelection}>
        {Object.entries(GOAL_TYPES).map(([key, type]) => {
          const TypeIcon = type.Icon;
          return (
            <button
              key={key}
              type="button"
              className={`${styles.typeBtn} ${goalType === key ? styles.typeActive : ''}`}
              onClick={() => setGoalType(key)}
            >
              <span className={styles.typeIcon}><TypeIcon /></span>
              <span className={styles.typeLabel}>{type.label}</span>
            </button>
          );
        })}
      </div>
      
      {/* Form Fields */}
      <div className={styles.formFields}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Goal Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`e.g., Hit ${selectedType.placeholder}${selectedType.unit}`}
            className={styles.input}
            autoComplete="off"
            required
          />
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Target Value</label>
            <div className={styles.inputWithSuffix}>
              <input
                type="number"
                inputMode="decimal"
                step={goalType === 'laptime' ? '0.1' : '1'}
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder={selectedType.placeholder}
                className={styles.input}
                autoComplete="off"
                required
              />
              {selectedType.unit && (
                <span className={styles.suffix}>{selectedType.unit}</span>
              )}
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Deadline (Optional)</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={styles.input}
              autoComplete="off"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className={styles.formActions}>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={styles.submitBtn}>
          <PlusIcon />
          Add Goal
        </button>
      </div>
    </form>
  );
}

/**
 * PerformanceGoals Component
 * 
 * Main component for displaying and managing performance goals.
 */
export default function PerformanceGoals({
  vehicleId,
  predictedWhp,
  predictedLapTime,
  predictedAccel,
  actualWhp,
}) {
  // Local state for goals (would be fetched from API in production)
  const [goals, setGoals] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get suggested goals based on predictions
  const suggestions = getSuggestedGoals(predictedWhp, predictedLapTime, predictedAccel);
  
  // Filter goals
  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  
  // Add a new goal
  const handleAddGoal = useCallback((goalData) => {
    const newGoal = {
      id: `goal-${Date.now()}`,
      ...goalData,
      status: 'active',
      achievedValue: goalData.type === 'power' ? actualWhp : null,
      createdAt: new Date().toISOString(),
    };
    
    setGoals(prev => [newGoal, ...prev]);
    setShowAddForm(false);
    
    // TODO: Save to API
    // await fetch('/api/performance-goals', { method: 'POST', body: JSON.stringify(newGoal) });
  }, [actualWhp]);
  
  // Mark goal as complete
  const handleCompleteGoal = useCallback((goalId) => {
    setGoals(prev => prev.map(g => 
      g.id === goalId 
        ? { ...g, status: 'completed', completedAt: new Date().toISOString() }
        : g
    ));
    
    // TODO: Update via API
  }, []);
  
  // Delete a goal
  const handleDeleteGoal = useCallback((goalId) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
    
    // TODO: Delete via API
  }, []);
  
  // Update goal's achieved value (when new dyno/track data is logged)
  const handleUpdateGoal = useCallback((goalId, achievedValue) => {
    setGoals(prev => prev.map(g => 
      g.id === goalId 
        ? { ...g, achievedValue, achievedAt: new Date().toISOString() }
        : g
    ));
    
    // TODO: Update via API
  }, []);
  
  return (
    <div className={styles.performanceGoals}>
      {/* Header - only show Add button when goals exist */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerIcon}>
            <TargetIcon />
          </div>
          <div>
            <h3 className={styles.headerTitle}>Performance Goals</h3>
            <p className={styles.headerSubtitle}>
              {goals.length > 0 
                ? `${activeGoals.length} active · ${completedGoals.length} completed`
                : 'Challenge yourself to hit your numbers'
              }
            </p>
          </div>
        </div>
        {/* Only show Add button in header when user has goals (not in empty state) */}
        {!showAddForm && goals.length > 0 && (
          <button 
            className={styles.addBtn}
            onClick={() => setShowAddForm(true)}
          >
            <PlusIcon />
            <span>Add</span>
          </button>
        )}
      </div>
      
      {/* Add Goal Form */}
      {showAddForm && (
        <AddGoalForm
          onAdd={handleAddGoal}
          onCancel={() => setShowAddForm(false)}
          suggestions={suggestions}
        />
      )}
      
      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className={styles.goalsSection}>
          <h4 className={styles.sectionLabel}>Active Goals</h4>
          <div className={styles.goalsList}>
            {activeGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onComplete={handleCompleteGoal}
                onDelete={handleDeleteGoal}
                onUpdate={handleUpdateGoal}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className={styles.goalsSection}>
          <h4 className={styles.sectionLabel}>Completed</h4>
          <div className={styles.goalsList}>
            {completedGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onComplete={handleCompleteGoal}
                onDelete={handleDeleteGoal}
                onUpdate={handleUpdateGoal}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Empty State - Single prominent CTA */}
      {goals.length === 0 && !showAddForm && (
        <div className={styles.emptyState}>
          <p className={styles.emptyDescription}>
            Will your build actually hit <strong>{predictedWhp ? `${predictedWhp} WHP` : 'the numbers'}</strong>? 
            Set a goal and find out.
          </p>
          <button 
            className={styles.emptyAddBtn}
            onClick={() => setShowAddForm(true)}
          >
            <PlusIcon />
            Set a Goal
          </button>
        </div>
      )}
    </div>
  );
}
