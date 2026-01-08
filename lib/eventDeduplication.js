/**
 * Event Deduplication Service
 * 
 * Provides utilities for detecting duplicate events during automated ingestion.
 * Uses both exact matching (source URL) and fuzzy matching (name + date + location).
 * 
 * @module lib/eventDeduplication
 */

/**
 * Normalize event name for comparison
 * - Lowercase
 * - Remove common prefixes/suffixes
 * - Remove special characters
 * - Trim whitespace
 * 
 * @param {string} name - Event name
 * @returns {string} - Normalized name
 */
export function normalizeEventName(name) {
  if (!name) return '';
  
  let normalized = name.toLowerCase().trim();
  
  // Remove common prefixes
  const prefixes = [
    'the ',
    'official ',
    'annual ',
    '\\d+(st|nd|rd|th) annual ',
    '\\d{4} ',
  ];
  
  for (const prefix of prefixes) {
    normalized = normalized.replace(new RegExp(`^${prefix}`, 'i'), '');
  }
  
  // Remove common suffixes
  const suffixes = [
    ' presented by .+$',
    ' - .+$',
    ' @ .+$',
    ' at .+$',
    ' \\d{4}$',
  ];
  
  for (const suffix of suffixes) {
    normalized = normalized.replace(new RegExp(suffix, 'i'), '');
  }
  
  // Remove special characters but keep spaces
  normalized = normalized.replace(/[^a-z0-9\s]/g, '');
  
  // Collapse multiple spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

/**
 * Normalize city name for comparison
 * @param {string} city
 * @returns {string}
 */
export function normalizeCity(city) {
  if (!city) return '';
  return city.toLowerCase().trim().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ');
}

/**
 * Calculate similarity between two strings (0-1)
 * Uses Levenshtein distance
 * 
 * @param {string} str1
 * @param {string} str2
 * @returns {number} - Similarity score 0-1
 */
export function stringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1
 * @param {string} str2
 * @returns {number}
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Check if dates are the same or within a range
 * @param {string} date1 - ISO date string
 * @param {string} date2 - ISO date string
 * @param {number} [toleranceDays=0] - Number of days tolerance
 * @returns {boolean}
 */
export function datesMatch(date1, date2, toleranceDays = 0) {
  if (!date1 || !date2) return false;
  
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
  
  const diffMs = Math.abs(d1.getTime() - d2.getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  return diffDays <= toleranceDays;
}

/**
 * Extract domain from URL for comparison
 * @param {string} url
 * @returns {string}
 */
export function extractDomain(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * Check if a new event is a duplicate of any existing events
 * 
 * @param {Object} newEvent - New event to check
 * @param {Object[]} existingEvents - Array of existing events
 * @param {Object} [options] - Options for matching
 * @param {number} [options.nameSimilarityThreshold=0.85] - Min similarity for name match
 * @param {number} [options.dateTolerance=1] - Days tolerance for date matching
 * @returns {Object} - { isDuplicate: boolean, matchedEvent?: Object, matchType?: string, confidence?: number }
 */
export function isDuplicateEvent(newEvent, existingEvents, options = {}) {
  const {
    nameSimilarityThreshold = 0.85,
    dateTolerance = 1,
  } = options;
  
  if (!newEvent || !existingEvents || existingEvents.length === 0) {
    return { isDuplicate: false };
  }
  
  // 1. Exact URL match (highest confidence)
  if (newEvent.source_url) {
    const normalizedNewUrl = newEvent.source_url.toLowerCase().replace(/\/$/, '');
    
    for (const existing of existingEvents) {
      if (existing.source_url) {
        const normalizedExistingUrl = existing.source_url.toLowerCase().replace(/\/$/, '');
        if (normalizedNewUrl === normalizedExistingUrl) {
          return {
            isDuplicate: true,
            matchedEvent: existing,
            matchType: 'exact_url',
            confidence: 1.0,
          };
        }
      }
    }
  }
  
  // 2. Same domain + similar name + same date (high confidence)
  const newDomain = extractDomain(newEvent.source_url);
  const newNormalizedName = normalizeEventName(newEvent.name);
  const newNormalizedCity = normalizeCity(newEvent.city);
  
  for (const existing of existingEvents) {
    // Check domain match
    const existingDomain = extractDomain(existing.source_url);
    const sameDomain = newDomain && existingDomain && newDomain === existingDomain;
    
    // Check name similarity
    const existingNormalizedName = normalizeEventName(existing.name);
    const nameSimilarity = stringSimilarity(newNormalizedName, existingNormalizedName);
    
    // Check date match
    const sameDate = datesMatch(newEvent.start_date, existing.start_date, dateTolerance);
    
    // Check city match
    const existingNormalizedCity = normalizeCity(existing.city);
    const sameCity = newNormalizedCity && existingNormalizedCity && 
                     newNormalizedCity === existingNormalizedCity;
    
    // High confidence: same domain + very similar name
    if (sameDomain && nameSimilarity >= 0.9) {
      return {
        isDuplicate: true,
        matchedEvent: existing,
        matchType: 'same_domain_name',
        confidence: 0.95,
      };
    }
    
    // High confidence: same name + same date + same city
    if (nameSimilarity >= nameSimilarityThreshold && sameDate && sameCity) {
      return {
        isDuplicate: true,
        matchedEvent: existing,
        matchType: 'name_date_city',
        confidence: 0.9,
      };
    }
    
    // Medium confidence: very similar name + same date
    if (nameSimilarity >= 0.95 && sameDate) {
      return {
        isDuplicate: true,
        matchedEvent: existing,
        matchType: 'name_date',
        confidence: 0.8,
      };
    }
  }
  
  return { isDuplicate: false };
}

/**
 * Find all potential duplicates for a new event
 * Returns all matches above threshold, sorted by confidence
 * 
 * @param {Object} newEvent
 * @param {Object[]} existingEvents
 * @param {Object} [options]
 * @returns {Object[]} - Array of { event, matchType, confidence }
 */
export function findPotentialDuplicates(newEvent, existingEvents, options = {}) {
  const {
    nameSimilarityThreshold = 0.7,
    dateTolerance = 3,
  } = options;
  
  const matches = [];
  
  const newNormalizedName = normalizeEventName(newEvent.name);
  const newNormalizedCity = normalizeCity(newEvent.city);
  const newDomain = extractDomain(newEvent.source_url);
  
  for (const existing of existingEvents) {
    const scores = [];
    
    // URL similarity
    if (newEvent.source_url && existing.source_url) {
      const normalizedNew = newEvent.source_url.toLowerCase().replace(/\/$/, '');
      const normalizedExisting = existing.source_url.toLowerCase().replace(/\/$/, '');
      if (normalizedNew === normalizedExisting) {
        scores.push({ type: 'exact_url', score: 1.0 });
      }
    }
    
    // Domain match
    const existingDomain = extractDomain(existing.source_url);
    if (newDomain && existingDomain && newDomain === existingDomain) {
      scores.push({ type: 'same_domain', score: 0.2 });
    }
    
    // Name similarity
    const existingNormalizedName = normalizeEventName(existing.name);
    const nameSimilarity = stringSimilarity(newNormalizedName, existingNormalizedName);
    if (nameSimilarity >= nameSimilarityThreshold) {
      scores.push({ type: 'name_similar', score: nameSimilarity * 0.4 });
    }
    
    // Date match
    if (datesMatch(newEvent.start_date, existing.start_date, dateTolerance)) {
      const exactDate = datesMatch(newEvent.start_date, existing.start_date, 0);
      scores.push({ type: 'date_match', score: exactDate ? 0.25 : 0.15 });
    }
    
    // City match
    const existingNormalizedCity = normalizeCity(existing.city);
    if (newNormalizedCity && existingNormalizedCity && 
        newNormalizedCity === existingNormalizedCity) {
      scores.push({ type: 'city_match', score: 0.15 });
    }
    
    // State match (weaker signal)
    if (newEvent.state && existing.state && 
        newEvent.state.toUpperCase() === existing.state.toUpperCase()) {
      scores.push({ type: 'state_match', score: 0.05 });
    }
    
    // Calculate total confidence
    if (scores.length > 0) {
      const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
      const matchTypes = scores.map(s => s.type);
      
      if (totalScore >= 0.5) {
        matches.push({
          event: existing,
          matchTypes,
          confidence: Math.min(totalScore, 1.0),
        });
      }
    }
  }
  
  // Sort by confidence descending
  return matches.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Deduplicate a batch of new events against existing events
 * 
 * @param {Object[]} newEvents - Array of new events
 * @param {Object[]} existingEvents - Array of existing events
 * @param {Object} [options]
 * @returns {Object} - { unique: Event[], duplicates: Array<{event, matchedEvent, matchType}> }
 */
export function deduplicateBatch(newEvents, existingEvents, options = {}) {
  const unique = [];
  const duplicates = [];
  
  // Track events we've already added to unique to avoid duplicates within the batch
  const addedToUnique = [];
  
  for (const newEvent of newEvents) {
    // Check against existing events
    const existingMatch = isDuplicateEvent(newEvent, existingEvents, options);
    
    if (existingMatch.isDuplicate) {
      duplicates.push({
        event: newEvent,
        matchedEvent: existingMatch.matchedEvent,
        matchType: existingMatch.matchType,
        confidence: existingMatch.confidence,
      });
      continue;
    }
    
    // Check against events already added in this batch
    const batchMatch = isDuplicateEvent(newEvent, addedToUnique, options);
    
    if (batchMatch.isDuplicate) {
      duplicates.push({
        event: newEvent,
        matchedEvent: batchMatch.matchedEvent,
        matchType: `batch_${batchMatch.matchType}`,
        confidence: batchMatch.confidence,
      });
      continue;
    }
    
    // Not a duplicate
    unique.push(newEvent);
    addedToUnique.push(newEvent);
  }
  
  return { unique, duplicates };
}

const eventDeduplication = {
  normalizeEventName,
  normalizeCity,
  stringSimilarity,
  datesMatch,
  extractDomain,
  isDuplicateEvent,
  findPotentialDuplicates,
  deduplicateBatch,
};

export default eventDeduplication;

