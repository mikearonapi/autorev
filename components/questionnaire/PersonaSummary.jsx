'use client';

/**
 * PersonaSummary Component
 * 
 * Displays the user's derived "Enthusiast Profile" based on questionnaire answers.
 * Shows persona type, key traits, and how well AL knows them.
 */

import styles from './PersonaSummary.module.css';
import { PERSONA_TYPES, KNOWLEDGE_LEVELS } from '@/data/questionnaireLibrary';

export default function PersonaSummary({
  drivingPersona,
  knowledgeLevel,
  interests = [],
  answeredCount = 0,
  completenessPercent = 0,
  compact = false,
}) {
  // Get persona details
  const persona = drivingPersona ? PERSONA_TYPES[drivingPersona] : null;
  const knowledge = knowledgeLevel ? KNOWLEDGE_LEVELS[knowledgeLevel] : null;
  
  // Interest labels
  const INTEREST_LABELS = {
    power: '⚡ Power',
    handling: '🏎️ Handling',
    daily: '🛣️ Daily',
    track: '🏁 Track',
    show: '✨ Show',
    more_power: '💪 More Power',
    better_handling: '🎯 Handling',
    reliability: '🔒 Reliability',
    sound: '🔊 Sound',
    aesthetics: '👁️ Aesthetics',
  };
  
  const displayInterests = interests
    .slice(0, 4)
    .map(i => INTEREST_LABELS[i] || i);
  
  // If no data yet, show placeholder
  if (answeredCount === 0) {
    return (
      <div className={`${styles.card} ${styles.empty} ${compact ? styles.compact : ''}`}>
        <div className={styles.emptyIcon}>🎯</div>
        <h4 className={styles.emptyTitle}>Your Enthusiast Profile</h4>
        <p className={styles.emptyText}>
          Answer questions to help AL understand you better
        </p>
      </div>
    );
  }
  
  return (
    <div className={`${styles.card} ${compact ? styles.compact : ''}`}>
      {/* Header with AL context */}
      <div className={styles.header}>
        <span className={styles.headerIcon}>🤖</span>
        <span className={styles.headerText}>
          AL knows you <strong>{completenessPercent}%</strong>
        </span>
      </div>
      
      {/* Persona */}
      {persona ? (
        <div className={styles.persona}>
          <span className={styles.personaIcon}>{persona.icon}</span>
          <div className={styles.personaInfo}>
            <span className={styles.personaName}>{persona.name}</span>
            <span className={styles.personaDesc}>{persona.description}</span>
          </div>
        </div>
      ) : (
        <div className={styles.persona}>
          <span className={styles.personaIcon}>🔍</span>
          <div className={styles.personaInfo}>
            <span className={styles.personaName}>Discovering...</span>
            <span className={styles.personaDesc}>Answer more questions to reveal your profile</span>
          </div>
        </div>
      )}
      
      {/* Traits */}
      <div className={styles.traits}>
        {/* Knowledge Level */}
        {knowledge && (
          <div className={styles.trait}>
            <span className={styles.traitLabel}>Knowledge</span>
            <span className={styles.traitValue}>{knowledge.name}</span>
          </div>
        )}
        
        {/* Answers count */}
        <div className={styles.trait}>
          <span className={styles.traitLabel}>Answers</span>
          <span className={styles.traitValue}>{answeredCount}</span>
        </div>
      </div>
      
      {/* Interests */}
      {displayInterests.length > 0 && (
        <div className={styles.interests}>
          <span className={styles.interestsLabel}>Interests</span>
          <div className={styles.interestTags}>
            {displayInterests.map((interest, idx) => (
              <span key={idx} className={styles.interestTag}>
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
