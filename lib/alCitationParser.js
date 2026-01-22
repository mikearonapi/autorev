/**
 * AL Citation Parser
 * 
 * Parses AL responses for inline citations like [1], [2], [3] and matches them
 * to source data from tool results. Enables Perplexity-style source attribution.
 * 
 * @module lib/alCitationParser
 */

/**
 * Extract unique citation numbers from text
 * @param {string} text - The text to parse
 * @returns {number[]} - Array of unique citation numbers found (e.g., [1, 2, 3])
 */
export function extractCitationNumbers(text) {
  if (!text) return [];
  
  // Match [N] patterns where N is 1-99
  const matches = text.match(/\[(\d{1,2})\]/g);
  if (!matches) return [];
  
  // Extract numbers and dedupe
  const numbers = matches
    .map(match => parseInt(match.slice(1, -1), 10))
    .filter(n => n > 0 && n < 100);
  
  return [...new Set(numbers)].sort((a, b) => a - b);
}

/**
 * Collect sources from tool results
 * Tool results contain __sources arrays added by executeToolCall
 * 
 * @param {Array} toolResults - Array of tool result objects from Claude
 * @returns {Object[]} - Flat array of all sources from all tools
 */
export function collectSourcesFromToolResults(toolResults) {
  const allSources = [];
  let sourceIdCounter = 1;
  
  if (!Array.isArray(toolResults)) return allSources;
  
  for (const result of toolResults) {
    try {
      // Tool results are JSON strings in Claude's format
      let parsed = result;
      if (typeof result === 'string') {
        parsed = JSON.parse(result);
      } else if (result?.content) {
        parsed = typeof result.content === 'string' 
          ? JSON.parse(result.content) 
          : result.content;
      }
      
      // Look for __sources array added by executeToolCall
      if (parsed?.__sources && Array.isArray(parsed.__sources)) {
        for (const source of parsed.__sources) {
          allSources.push({
            ...source,
            // Reassign IDs to be sequential across all tool results
            originalId: source.id,
            id: sourceIdCounter++,
          });
        }
      }
    } catch (e) {
      // Skip malformed results
      continue;
    }
  }
  
  return allSources;
}

/**
 * Match cited numbers in text to actual sources
 * 
 * @param {number[]} citedNumbers - Citation numbers found in text (e.g., [1, 2])
 * @param {Object[]} availableSources - All available sources from tools
 * @returns {Object[]} - Sources that were actually cited, in order
 */
export function matchCitationsToSources(citedNumbers, availableSources) {
  if (!citedNumbers.length || !availableSources.length) {
    return [];
  }
  
  // Create a map of ID -> source
  const sourceById = new Map(availableSources.map(s => [s.id, s]));
  
  // Return only the sources that were cited, in cited order
  const matchedSources = [];
  const usedIds = new Set();
  
  for (const num of citedNumbers) {
    // First try exact match by ID
    if (sourceById.has(num) && !usedIds.has(num)) {
      matchedSources.push(sourceById.get(num));
      usedIds.add(num);
    }
    // If no match, try to find by index (0-based)
    else if (availableSources[num - 1] && !usedIds.has(num)) {
      matchedSources.push({
        ...availableSources[num - 1],
        id: num, // Use the cited number as the display ID
      });
      usedIds.add(num);
    }
  }
  
  return matchedSources;
}

/**
 * Parse AL response content with citations
 * Main entry point for citation parsing
 * 
 * @param {string} content - The AI response text
 * @param {Array} toolResults - Array of tool result objects (from streaming or non-streaming)
 * @returns {Object} - { content, citations, sources }
 */
export function parseALResponseWithCitations(content, toolResults = []) {
  // Extract citation numbers from the response text
  const citedNumbers = extractCitationNumbers(content);
  
  // Collect all sources from tool results
  const allSources = collectSourcesFromToolResults(toolResults);
  
  // Match citations to sources
  const matchedSources = matchCitationsToSources(citedNumbers, allSources);
  
  // If we have sources but AL didn't cite them, include them anyway for display
  // This ensures we always show sources even if AL forgot to cite
  const sourcesToShow = matchedSources.length > 0 
    ? matchedSources 
    : allSources.slice(0, 5); // Show up to 5 uncited sources
  
  return {
    content,
    citations: citedNumbers,
    sources: sourcesToShow,
    allSources: allSources,
    hasCitations: citedNumbers.length > 0,
  };
}

/**
 * Format citation reference for display (e.g., turn [1] into a superscript component)
 * This is a utility for the UI layer
 * 
 * @param {string} text - Text with [N] citations
 * @returns {Array} - Array of text and citation objects for rendering
 */
export function splitTextWithCitations(text) {
  if (!text) return [{ type: 'text', content: '' }];
  
  const parts = [];
  let lastIndex = 0;
  
  // Match [N] patterns
  const regex = /\[(\d{1,2})\]/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    // Add text before the citation
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      });
    }
    
    // Add the citation
    parts.push({
      type: 'citation',
      number: parseInt(match[1], 10),
      raw: match[0],
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }
  
  return parts.length > 0 ? parts : [{ type: 'text', content: text }];
}

/**
 * Get domain name from URL for display
 * @param {string} url - Full URL
 * @returns {string} - Domain name (e.g., "youtube.com", "bimmerpost.com")
 */
export function extractDomainFromUrl(url) {
  if (!url) return '';
  try {
    const domain = new URL(url).hostname;
    return domain.replace(/^www\./, '');
  } catch {
    return url.split('/')[2] || url;
  }
}

/**
 * Get icon type for source based on its type
 * @param {string} sourceType - Source type (database, youtube, forum, web, etc.)
 * @returns {string} - Icon identifier for UI
 */
export function getSourceIcon(sourceType) {
  const iconMap = {
    database: 'database',
    youtube: 'youtube',
    forum: 'forum',
    web: 'link',
    reference: 'document',
    encyclopedia: 'book',
    nhtsa: 'shield',
  };
  return iconMap[sourceType] || 'link';
}

const alCitationParser = {
  extractCitationNumbers,
  collectSourcesFromToolResults,
  matchCitationsToSources,
  parseALResponseWithCitations,
  splitTextWithCitations,
  extractDomainFromUrl,
  getSourceIcon,
};

export default alCitationParser;
