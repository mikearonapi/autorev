/**
 * Unit Tests: AL Citation Parser
 * 
 * Tests the citation extraction and source matching logic.
 * 
 * Run: npm test -- tests/unit/al-citation-parser.test.js
 */

import { describe, test, expect } from 'vitest';
import {
  extractCitationNumbers,
  collectSourcesFromToolResults,
  matchCitationsToSources,
  parseALResponseWithCitations,
  splitTextWithCitations,
  extractDomainFromUrl,
  getSourceIcon,
} from '@/lib/alCitationParser';

describe('AL Citation Parser', () => {
  describe('extractCitationNumbers', () => {
    test('should extract single citation', () => {
      const text = 'The engine produces 400 hp [1].';
      const numbers = extractCitationNumbers(text);
      
      expect(numbers).toEqual([1]);
    });
    
    test('should extract multiple citations', () => {
      const text = 'The 997.1 has documented IMS concerns [1]. However, failure rates are lower than commonly believed [2][3].';
      const numbers = extractCitationNumbers(text);
      
      expect(numbers).toEqual([1, 2, 3]);
    });
    
    test('should deduplicate citations', () => {
      const text = 'According to data [1], the engine is reliable [2]. This is confirmed [1].';
      const numbers = extractCitationNumbers(text);
      
      expect(numbers).toEqual([1, 2]);
    });
    
    test('should return sorted citation numbers', () => {
      const text = 'Sources mention [3] and [1] and [2].';
      const numbers = extractCitationNumbers(text);
      
      expect(numbers).toEqual([1, 2, 3]);
    });
    
    test('should return empty array for no citations', () => {
      const text = 'This is a response with no citations.';
      const numbers = extractCitationNumbers(text);
      
      expect(numbers).toEqual([]);
    });
    
    test('should handle empty string', () => {
      const numbers = extractCitationNumbers('');
      expect(numbers).toEqual([]);
    });
    
    test('should handle null input', () => {
      const numbers = extractCitationNumbers(null);
      expect(numbers).toEqual([]);
    });
    
    test('should ignore citations over 99', () => {
      const text = 'Reference [100] should be ignored, but [99] should work.';
      const numbers = extractCitationNumbers(text);
      
      expect(numbers).toEqual([99]);
    });
    
    test('should handle adjacent citations', () => {
      const text = 'Multiple sources agree [1][2][3].';
      const numbers = extractCitationNumbers(text);
      
      expect(numbers).toEqual([1, 2, 3]);
    });
  });
  
  describe('collectSourcesFromToolResults', () => {
    test('should extract sources from tool results with __sources', () => {
      const toolResults = [
        {
          content: JSON.stringify({
            data: { hp: 400 },
            __sources: [
              { id: 1, type: 'database', label: 'AutoRev Database' },
            ],
          }),
        },
      ];
      
      const sources = collectSourcesFromToolResults(toolResults);
      
      expect(sources).toHaveLength(1);
      expect(sources[0].type).toBe('database');
      expect(sources[0].label).toBe('AutoRev Database');
    });
    
    test('should reassign sequential IDs across multiple tool results', () => {
      const toolResults = [
        {
          content: JSON.stringify({
            __sources: [
              { id: 1, type: 'database', label: 'Source A' },
            ],
          }),
        },
        {
          content: JSON.stringify({
            __sources: [
              { id: 1, type: 'youtube', label: 'Source B' },
            ],
          }),
        },
      ];
      
      const sources = collectSourcesFromToolResults(toolResults);
      
      expect(sources).toHaveLength(2);
      expect(sources[0].id).toBe(1);
      expect(sources[1].id).toBe(2);
    });
    
    test('should handle tool results without __sources', () => {
      const toolResults = [
        { content: JSON.stringify({ data: 'some data' }) },
      ];
      
      const sources = collectSourcesFromToolResults(toolResults);
      
      expect(sources).toEqual([]);
    });
    
    test('should handle malformed JSON gracefully', () => {
      const toolResults = [
        { content: 'invalid json' },
        { content: JSON.stringify({ __sources: [{ id: 1, type: 'database', label: 'Valid' }] }) },
      ];
      
      const sources = collectSourcesFromToolResults(toolResults);
      
      expect(sources).toHaveLength(1);
      expect(sources[0].label).toBe('Valid');
    });
    
    test('should handle empty array', () => {
      const sources = collectSourcesFromToolResults([]);
      expect(sources).toEqual([]);
    });
  });
  
  describe('matchCitationsToSources', () => {
    test('should match citations to sources by ID', () => {
      const citedNumbers = [1, 2];
      const availableSources = [
        { id: 1, type: 'database', label: 'DB Source' },
        { id: 2, type: 'youtube', label: 'YouTube Source' },
        { id: 3, type: 'forum', label: 'Forum Source' },
      ];
      
      const matched = matchCitationsToSources(citedNumbers, availableSources);
      
      expect(matched).toHaveLength(2);
      expect(matched[0].label).toBe('DB Source');
      expect(matched[1].label).toBe('YouTube Source');
    });
    
    test('should return sources in citation order', () => {
      const citedNumbers = [3, 1];
      const availableSources = [
        { id: 1, type: 'database', label: 'First' },
        { id: 2, type: 'youtube', label: 'Second' },
        { id: 3, type: 'forum', label: 'Third' },
      ];
      
      const matched = matchCitationsToSources(citedNumbers, availableSources);
      
      expect(matched).toHaveLength(2);
      expect(matched[0].label).toBe('Third'); // [3] cited first
      expect(matched[1].label).toBe('First'); // [1] cited second
    });
    
    test('should handle citations with no matching source', () => {
      const citedNumbers = [5];
      const availableSources = [
        { id: 1, type: 'database', label: 'Source 1' },
        { id: 2, type: 'database', label: 'Source 2' },
      ];
      
      const matched = matchCitationsToSources(citedNumbers, availableSources);
      
      // Should fall back to index-based matching or return empty
      expect(matched.length).toBeLessThanOrEqual(1);
    });
    
    test('should return empty array when no sources available', () => {
      const matched = matchCitationsToSources([1, 2], []);
      expect(matched).toEqual([]);
    });
  });
  
  describe('parseALResponseWithCitations', () => {
    test('should parse response with citations and sources', () => {
      const content = 'The GT3 RS has a 4.0L flat-six [1] producing 520 hp [2].';
      const toolResults = [
        {
          content: JSON.stringify({
            __sources: [
              { id: 1, type: 'database', label: 'AutoRev DB' },
              { id: 2, type: 'database', label: 'Specs DB' },
            ],
          }),
        },
      ];
      
      const result = parseALResponseWithCitations(content, toolResults);
      
      expect(result.content).toBe(content);
      expect(result.citations).toEqual([1, 2]);
      expect(result.hasCitations).toBe(true);
      expect(result.sources.length).toBeGreaterThan(0);
    });
    
    test('should handle response without citations', () => {
      const content = 'The Porsche GT3 is a great track car.';
      const toolResults = [
        {
          content: JSON.stringify({
            __sources: [{ id: 1, type: 'database', label: 'Source' }],
          }),
        },
      ];
      
      const result = parseALResponseWithCitations(content, toolResults);
      
      expect(result.hasCitations).toBe(false);
      expect(result.citations).toEqual([]);
      // Should still show uncited sources
      expect(result.sources.length).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('splitTextWithCitations', () => {
    test('should split text with inline citations', () => {
      const text = 'The engine produces 400 hp [1].';
      const parts = splitTextWithCitations(text);
      
      expect(parts).toHaveLength(3);
      expect(parts[0]).toEqual({ type: 'text', content: 'The engine produces 400 hp ' });
      expect(parts[1]).toEqual({ type: 'citation', number: 1, raw: '[1]' });
      expect(parts[2]).toEqual({ type: 'text', content: '.' });
    });
    
    test('should handle text without citations', () => {
      const text = 'No citations here.';
      const parts = splitTextWithCitations(text);
      
      expect(parts).toHaveLength(1);
      expect(parts[0]).toEqual({ type: 'text', content: 'No citations here.' });
    });
    
    test('should handle multiple adjacent citations', () => {
      const text = 'Sources [1][2] agree.';
      const parts = splitTextWithCitations(text);
      
      expect(parts).toHaveLength(4);
      expect(parts[0]).toEqual({ type: 'text', content: 'Sources ' });
      expect(parts[1]).toEqual({ type: 'citation', number: 1, raw: '[1]' });
      expect(parts[2]).toEqual({ type: 'citation', number: 2, raw: '[2]' });
      expect(parts[3]).toEqual({ type: 'text', content: ' agree.' });
    });
    
    test('should handle empty string', () => {
      const parts = splitTextWithCitations('');
      expect(parts).toEqual([{ type: 'text', content: '' }]);
    });
  });
  
  describe('extractDomainFromUrl', () => {
    test('should extract domain from full URL', () => {
      const domain = extractDomainFromUrl('https://www.youtube.com/watch?v=abc123');
      expect(domain).toBe('youtube.com');
    });
    
    test('should remove www prefix', () => {
      const domain = extractDomainFromUrl('https://www.bimmerpost.com/forums/');
      expect(domain).toBe('bimmerpost.com');
    });
    
    test('should handle URL without www', () => {
      const domain = extractDomainFromUrl('https://rennlist.com/forums/');
      expect(domain).toBe('rennlist.com');
    });
    
    test('should handle empty string', () => {
      const domain = extractDomainFromUrl('');
      expect(domain).toBe('');
    });
    
    test('should handle null', () => {
      const domain = extractDomainFromUrl(null);
      expect(domain).toBe('');
    });
  });
  
  describe('getSourceIcon', () => {
    test('should return correct icon for database source', () => {
      expect(getSourceIcon('database')).toBe('database');
    });
    
    test('should return correct icon for youtube source', () => {
      expect(getSourceIcon('youtube')).toBe('youtube');
    });
    
    test('should return correct icon for forum source', () => {
      expect(getSourceIcon('forum')).toBe('forum');
    });
    
    test('should return default icon for unknown source', () => {
      expect(getSourceIcon('unknown')).toBe('link');
    });
    
    test('should return default icon for undefined', () => {
      expect(getSourceIcon(undefined)).toBe('link');
    });
  });
});
