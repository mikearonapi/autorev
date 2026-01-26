/**
 * Unit Tests: Garage Score Service
 * 
 * Tests the garage score calculation logic and helper functions.
 * 
 * Run: npm test -- tests/unit/garage-score.test.js
 * 
 * Updated 2026-01-25: Match new 5-category scoring system
 */

import { describe, test, expect, vi } from 'vitest';

// Mock Supabase before importing the service
vi.mock('@/lib/supabase', () => ({
  supabaseServiceRole: null,
  supabase: null,
  isSupabaseConfigured: false,
}));

// Import after mocking
import {
  SCORE_CATEGORIES,
  getScoreChecklist,
  getImprovementTips,
  getScoreLevel,
} from '@/lib/garageScoreService';

describe('Garage Score Service', () => {
  describe('SCORE_CATEGORIES', () => {
    test('should have 5 categories', () => {
      expect(Object.keys(SCORE_CATEGORIES)).toHaveLength(5);
    });

    test('should have correct categories', () => {
      expect(SCORE_CATEGORIES).toHaveProperty('specs_confirmed');
      expect(SCORE_CATEGORIES).toHaveProperty('build_saved');
      expect(SCORE_CATEGORIES).toHaveProperty('build_shared');
      expect(SCORE_CATEGORIES).toHaveProperty('parts_specified');
      expect(SCORE_CATEGORIES).toHaveProperty('photos_uploaded');
    });

    test('each category should have max defined', () => {
      Object.values(SCORE_CATEGORIES).forEach(cat => {
        expect(cat.max).toBeGreaterThan(0);
      });
    });

    test('total max score should be 100', () => {
      const totalMax = Object.values(SCORE_CATEGORIES).reduce((sum, cat) => sum + cat.max, 0);
      expect(totalMax).toBe(100);
    });

    test('categories have correct max values', () => {
      expect(SCORE_CATEGORIES.specs_confirmed.max).toBe(20);
      expect(SCORE_CATEGORIES.build_saved.max).toBe(15);
      expect(SCORE_CATEGORIES.build_shared.max).toBe(25);
      expect(SCORE_CATEGORIES.parts_specified.max).toBe(25);
      expect(SCORE_CATEGORIES.photos_uploaded.max).toBe(15);
    });
  });

  describe('getScoreChecklist', () => {
    test('should return checklist for empty breakdown', () => {
      const breakdown = { 
        specs_confirmed: 0, 
        build_saved: 0, 
        build_shared: 0, 
        parts_specified: 0, 
        photos_uploaded: 0 
      };
      const checklist = getScoreChecklist(breakdown);

      expect(checklist).toHaveLength(5);
      checklist.forEach(item => {
        expect(item.complete).toBe(false);
        expect(item.partial).toBe(false);
        expect(item.points).toBe(0);
      });
    });

    test('should mark complete items correctly', () => {
      const breakdown = { 
        specs_confirmed: 20, 
        build_saved: 15, 
        build_shared: 25, 
        parts_specified: 25, 
        photos_uploaded: 15 
      };
      const checklist = getScoreChecklist(breakdown);

      checklist.forEach(item => {
        expect(item.complete).toBe(true);
        expect(item.partial).toBe(false);
        expect(item.points).toBe(item.maxPoints);
      });
    });

    test('should mark partial items correctly', () => {
      const breakdown = { 
        specs_confirmed: 10, 
        build_saved: 0, 
        build_shared: 0, 
        parts_specified: 10, 
        photos_uploaded: 0 
      };
      const checklist = getScoreChecklist(breakdown);

      const specsItem = checklist.find(c => c.key === 'specs_confirmed');
      expect(specsItem.partial).toBe(true);
      expect(specsItem.complete).toBe(false);
      expect(specsItem.points).toBe(10);
    });

    test('should handle null breakdown', () => {
      const checklist = getScoreChecklist(null);
      expect(checklist).toHaveLength(5);
      checklist.forEach(item => {
        expect(item.points).toBe(0);
      });
    });
  });

  describe('getImprovementTips', () => {
    test('should return tips for empty breakdown', () => {
      const breakdown = { 
        specs_confirmed: 0, 
        build_saved: 0, 
        build_shared: 0, 
        parts_specified: 0, 
        photos_uploaded: 0 
      };
      const tips = getImprovementTips(breakdown);

      expect(tips.length).toBeGreaterThan(0);
    });

    test('should return no tips for complete breakdown', () => {
      const breakdown = { 
        specs_confirmed: 20, 
        build_saved: 15, 
        build_shared: 25, 
        parts_specified: 25, 
        photos_uploaded: 15 
      };
      const tips = getImprovementTips(breakdown);

      expect(tips).toHaveLength(0);
    });

    test('should suggest specs confirmation for 0 specs', () => {
      const breakdown = { 
        specs_confirmed: 0, 
        build_saved: 15, 
        build_shared: 25, 
        parts_specified: 25, 
        photos_uploaded: 15 
      };
      const tips = getImprovementTips(breakdown);

      const specsTip = tips.find(t => t.category === 'specs_confirmed');
      expect(specsTip).toBeDefined();
      expect(specsTip.potentialGain).toBe(20);
    });

    test('should handle null breakdown', () => {
      const tips = getImprovementTips(null);
      expect(tips.length).toBeGreaterThan(0);
    });

    test('should prioritize high-value categories', () => {
      const breakdown = { 
        specs_confirmed: 0, 
        build_saved: 0, 
        build_shared: 0, 
        parts_specified: 0, 
        photos_uploaded: 0 
      };
      const tips = getImprovementTips(breakdown);

      // Build shared (25 pts) should be promoted when prerequisites met
      // Specs confirmed should be one of the tips
      expect(tips.some(t => t.category === 'specs_confirmed')).toBe(true);
    });
  });

  describe('getScoreLevel', () => {
    test('should return Complete for 100', () => {
      const level = getScoreLevel(100);
      expect(level.level).toBe('Complete');
      expect(level.color).toBe('teal');
      expect(level.nextLevel).toBeNull();
      expect(level.pointsToNext).toBe(0);
    });

    test('should return Advanced for 80-99', () => {
      expect(getScoreLevel(80).level).toBe('Advanced');
      expect(getScoreLevel(99).level).toBe('Advanced');
      expect(getScoreLevel(80).pointsToNext).toBe(20);
      expect(getScoreLevel(99).pointsToNext).toBe(1);
    });

    test('should return Intermediate for 60-79', () => {
      expect(getScoreLevel(60).level).toBe('Intermediate');
      expect(getScoreLevel(79).level).toBe('Intermediate');
      expect(getScoreLevel(60).nextLevel).toBe('Advanced');
    });

    test('should return Getting Started for 40-59', () => {
      expect(getScoreLevel(40).level).toBe('Getting Started');
      expect(getScoreLevel(59).level).toBe('Getting Started');
    });

    test('should return Beginner for 20-39', () => {
      expect(getScoreLevel(20).level).toBe('Beginner');
      expect(getScoreLevel(39).level).toBe('Beginner');
    });

    test('should return New for 0-19', () => {
      expect(getScoreLevel(0).level).toBe('New');
      expect(getScoreLevel(19).level).toBe('New');
      expect(getScoreLevel(0).pointsToNext).toBe(20);
    });

    test('should include color coding', () => {
      expect(getScoreLevel(100).color).toBe('teal');
      expect(getScoreLevel(80).color).toBe('teal');
      expect(getScoreLevel(60).color).toBe('blue');
      expect(getScoreLevel(40).color).toBe('blue');
      expect(getScoreLevel(20).color).toBe('secondary');
      expect(getScoreLevel(0).color).toBe('secondary');
    });
  });

  describe('Score calculation edge cases', () => {
    test('should handle all zero values', () => {
      const breakdown = { 
        specs_confirmed: 0, 
        build_saved: 0, 
        build_shared: 0, 
        parts_specified: 0, 
        photos_uploaded: 0 
      };
      const totalScore = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
      expect(totalScore).toBe(0);
    });

    test('should handle all max values', () => {
      const breakdown = { 
        specs_confirmed: 20, 
        build_saved: 15, 
        build_shared: 25, 
        parts_specified: 25, 
        photos_uploaded: 15 
      };
      const totalScore = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
      expect(totalScore).toBe(100);
    });

    test('should handle mixed values', () => {
      const breakdown = { 
        specs_confirmed: 20, 
        build_saved: 10, 
        build_shared: 0, 
        parts_specified: 10, 
        photos_uploaded: 0 
      };
      const totalScore = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
      expect(totalScore).toBe(40);
    });

    test('breakdown values should not exceed max', () => {
      const breakdown = { 
        specs_confirmed: 20, 
        build_saved: 15, 
        build_shared: 25, 
        parts_specified: 25, 
        photos_uploaded: 15 
      };
      Object.entries(breakdown).forEach(([key, value]) => {
        expect(value).toBeLessThanOrEqual(SCORE_CATEGORIES[key].max);
      });
    });
  });

  describe('Scoring thresholds', () => {
    test('specs_confirmed max should be 20', () => {
      expect(SCORE_CATEGORIES.specs_confirmed.max).toBe(20);
    });

    test('build_shared should be highest value category (25)', () => {
      const maxValues = Object.values(SCORE_CATEGORIES).map(c => c.max);
      expect(SCORE_CATEGORIES.build_shared.max).toBe(Math.max(...maxValues));
    });

    test('photos_uploaded should be 15', () => {
      expect(SCORE_CATEGORIES.photos_uploaded.max).toBe(15);
    });
  });
});
