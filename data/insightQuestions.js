/**
 * Insight Questions Configuration
 * 
 * Questions for the personalization questionnaire.
 * Answers are stored in user_preferences table and used for:
 * - Filtering/ranking insights on the Insights page
 * - Providing context to AL conversations
 * 
 * Each answer awards POINTS_PER_QUESTION points.
 */

export const POINTS_PER_QUESTION = 10;

export const INSIGHT_QUESTIONS = [
  {
    id: 'driving_focus',
    question: "What's your main driving focus?",
    hint: 'This helps us prioritize relevant insights',
    multiSelect: true,
    dbField: 'driving_focus',
    options: [
      { value: 'power', label: 'Power & acceleration', emoji: '⚡' },
      { value: 'handling', label: 'Handling & cornering', emoji: '🏎️' },
      { value: 'daily', label: 'Daily comfort & reliability', emoji: '🛣️' },
      { value: 'track', label: 'Track performance', emoji: '🏁' },
      { value: 'show', label: 'Show & aesthetics', emoji: '✨' },
    ],
  },
  {
    id: 'work_preference',
    question: 'Do you typically do your own work?',
    hint: 'DIY tips or shop recommendations',
    multiSelect: false,
    dbField: 'work_preference',
    options: [
      { value: 'diy', label: 'I do everything myself', emoji: '🔧' },
      { value: 'shop', label: 'I take it to a shop', emoji: '🏪' },
      { value: 'mixed', label: 'Mix of both', emoji: '⚖️' },
    ],
  },
  {
    id: 'budget_comfort',
    question: "What's your mod budget comfort level?",
    hint: 'Helps us suggest appropriate upgrades',
    multiSelect: false,
    dbField: 'budget_comfort',
    options: [
      { value: 'budget', label: 'Budget-friendly options', emoji: '💰' },
      { value: 'moderate', label: 'Mid-range is fine', emoji: '💵' },
      { value: 'no_limit', label: "Sky's the limit", emoji: '💎' },
    ],
  },
  {
    id: 'mod_experience',
    question: 'What experience level are you?',
    hint: 'Tailors the detail of our recommendations',
    multiSelect: false,
    dbField: 'mod_experience',
    options: [
      { value: 'beginner', label: "I'm new to modding", emoji: '🌱' },
      { value: 'intermediate', label: "I've done some mods", emoji: '🛠️' },
      { value: 'expert', label: "I'm an experienced builder", emoji: '🏆' },
    ],
  },
  {
    id: 'primary_goals',
    question: 'What are your primary goals?',
    hint: 'Select all that apply',
    multiSelect: true,
    dbField: 'primary_goals',
    options: [
      { value: 'more_power', label: 'More power', emoji: '💪' },
      { value: 'better_handling', label: 'Better handling', emoji: '🎯' },
      { value: 'reliability', label: 'Improved reliability', emoji: '🔒' },
      { value: 'sound', label: 'Better sound', emoji: '🔊' },
      { value: 'aesthetics', label: 'Aesthetics & looks', emoji: '👁️' },
    ],
  },
  {
    id: 'track_frequency',
    question: 'How often do you track your car?',
    hint: 'Affects maintenance and upgrade priorities',
    multiSelect: false,
    dbField: 'track_frequency',
    options: [
      { value: 'never', label: 'Never or rarely', emoji: '🏠' },
      { value: 'occasionally', label: 'A few times a year', emoji: '📅' },
      { value: 'regularly', label: 'Monthly or more', emoji: '🗓️' },
      { value: 'competitive', label: 'Competitively', emoji: '🏆' },
    ],
  },
  {
    id: 'detail_level',
    question: 'How detailed should insights be?',
    hint: 'Quick tips vs deep dives',
    multiSelect: false,
    dbField: 'detail_level',
    options: [
      { value: 'quick_tips', label: 'Quick tips only', emoji: '⚡' },
      { value: 'balanced', label: 'Balanced detail', emoji: '⚖️' },
      { value: 'deep_dive', label: 'Full deep dives', emoji: '📚' },
    ],
  },
];

/**
 * Convert questionnaire answers to database fields
 * @param {Object} answers - Raw answers from questionnaire
 * @returns {Object} - Database-ready fields
 */
export function answersToDbFields(answers) {
  const fields = {};
  
  INSIGHT_QUESTIONS.forEach(q => {
    if (answers[q.id] !== undefined) {
      fields[q.dbField] = answers[q.id];
    }
  });
  
  return fields;
}

/**
 * Calculate total points that can be earned
 */
export const MAX_QUESTIONNAIRE_POINTS = INSIGHT_QUESTIONS.length * POINTS_PER_QUESTION;
