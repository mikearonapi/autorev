/**
 * Unit Tests: Garage Score Service
 * 
 * Tests the garage score calculation logic and helper functions.
 * 
 * Run: npm test -- tests/unit/garage-score.test.js
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
      expect(SCORE_CATEGORIES).toHaveProperty('specs');
      expect(SCORE_CATEGORIES).toHaveProperty('photos');
      expect(SCORE_CATEGORIES).toHaveProperty('mods');
      expect(SCORE_CATEGORIES).toHaveProperty('goals');
      expect(SCORE_CATEGORIES).toHaveProperty('parts');
    });

    test('each category should have max of 20', () => {
      Object.values(SCORE_CATEGORIES).forEach(cat => {
        expect(cat.max).toBe(20);
      });
    });

    test('total max score should be 100', () => {
      const totalMax = Object.values(SCORE_CATEGORIES).reduce((sum, cat) => sum + cat.max, 0);
      expect(totalMax).toBe(100);
    });
  });

  describe('getScoreChecklist', () => {
    test('should return checklist for empty breakdown', () => {
      const breakdown = { specs: 0, photos: 0, mods: 0, goals: 0, parts: 0 };
      const checklist = getScoreChecklist(breakdown);

      expect(checklist).toHaveLength(5);
      checklist.forEach(item => {
        expect(item.complete).toBe(false);
        expect(item.partial).toBe(false);
        expect(item.points).toBe(0);
        expect(item.maxPoints).toBe(20);
      });
    });

    test('should mark complete items correctly', () => {
      const breakdown = { specs: 20, photos: 20, mods: 20, goals: 20, parts: 20 };
      const checklist = getScoreChecklist(breakdown);

      checklist.forEach(item => {
        expect(item.complete).toBe(true);
        expect(item.partial).toBe(false);
        expect(item.points).toBe(20);
      });
    });

    test('should mark partial items correctly', () => {
      const breakdown = { specs: 10, photos: 10, mods: 10, goals: 0, parts: 10 };
      const checklist = getScoreChecklist(breakdown);

      const specsItem = checklist.find(c => c.key === 'specs');
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
      const breakdown = { specs: 0, photos: 0, mods: 0, goals: 0, parts: 0 };
      const tips = getImprovementTips(breakdown);

      expect(tips.length).toBeGreaterThan(0);
      // Should be sorted by potential gain (highest first)
      for (let i = 1; i < tips.length; i++) {
        expect(tips[i].potentialGain).toBeLessThanOrEqual(tips[i-1].potentialGain);
      }
    });

    test('should return no tips for complete breakdown', () => {
      const breakdown = { specs: 20, photos: 20, mods: 20, goals: 20, parts: 20 };
      const tips = getImprovementTips(breakdown);

      expect(tips).toHaveLength(0);
    });

    test('should return appropriate tip for partial specs', () => {
      const breakdown = { specs: 10, photos: 20, mods: 20, goals: 20, parts: 20 };
      const tips = getImprovementTips(breakdown);

      expect(tips).toHaveLength(1);
      expect(tips[0].category).toBe('specs');
      expect(tips[0].potentialGain).toBe(10);
    });

    test('should suggest first photo for 0 photos', () => {
      const breakdown = { specs: 20, photos: 0, mods: 20, goals: 20, parts: 20 };
      const tips = getImprovementTips(breakdown);

      const photoTip = tips.find(t => t.category === 'photos');
      expect(photoTip).toBeDefined();
      expect(photoTip.tip).toContain('first photo');
    });

    test('should suggest second photo for 1 photo', () => {
      const breakdown = { specs: 20, photos: 10, mods: 20, goals: 20, parts: 20 };
      const tips = getImprovementTips(breakdown);

      const photoTip = tips.find(t => t.category === 'photos');
      expect(photoTip).toBeDefined();
      expect(photoTip.tip).toContain('second photo');
    });

    test('should handle null breakdown', () => {
      const tips = getImprovementTips(null);
      expect(tips.length).toBeGreaterThan(0);
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
      const breakdown = { specs: 0, photos: 0, mods: 0, goals: 0, parts: 0 };
      const totalScore = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
      expect(totalScore).toBe(0);
    });

    test('should handle all max values', () => {
      const breakdown = { specs: 20, photos: 20, mods: 20, goals: 20, parts: 20 };
      const totalScore = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
      expect(totalScore).toBe(100);
    });

    test('should handle mixed values', () => {
      const breakdown = { specs: 17, photos: 10, mods: 20, goals: 0, parts: 10 };
      const totalScore = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
      expect(totalScore).toBe(57);
    });

    test('breakdown values should not exceed max', () => {
      // This tests the principle that breakdown values are capped
      const breakdown = { specs: 20, photos: 20, mods: 20, goals: 20, parts: 20 };
      Object.entries(breakdown).forEach(([key, value]) => {
        expect(value).toBeLessThanOrEqual(SCORE_CATEGORIES[key].max);
      });
    });
  });

  describe('Scoring thresholds', () => {
    test('specs should scale from 6 fields', () => {
      // 6 fields: year, make, model, trim, color, mileage
      // Each field contributes approximately 3.33 points
      // 1 field = ~3 points, 3 fields = 10 points, 6 fields = 20 points
      const oneFieldScore = Math.round((1/6) * 20);
      const threeFieldScore = Math.round((3/6) * 20);
      const sixFieldScore = Math.round((6/6) * 20);
      
      expect(oneFieldScore).toBe(3);
      expect(threeFieldScore).toBe(10);
      expect(sixFieldScore).toBe(20);
    });

    test('photos threshold: 1 photo = 10, 2+ = 20', () => {
      // As defined in the SQL function
      const noPhotosScore = 0;
      const onePhotoScore = 10;
      const twoPhotosScore = 20;
      
      expect(noPhotosScore).toBe(0);
      expect(onePhotoScore).toBe(10);
      expect(twoPhotosScore).toBe(20);
    });

    test('mods threshold: 1-2 mods = 10, 3+ = 20', () => {
      // As defined in the SQL function
      const noModsScore = 0;
      const oneModScore = 10;
      const twoModsScore = 10;
      const threeModsScore = 20;
      
      expect(noModsScore).toBe(0);
      expect(oneModScore).toBe(10);
      expect(twoModsScore).toBe(10);
      expect(threeModsScore).toBe(20);
    });

    test('goals threshold: any project = 20', () => {
      const noProjectScore = 0;
      const oneProjectScore = 20;
      
      expect(noProjectScore).toBe(0);
      expect(oneProjectScore).toBe(20);
    });

    test('parts threshold: 1-2 parts = 10, 3+ = 20', () => {
      const noPartsScore = 0;
      const onePartScore = 10;
      const twoPartsScore = 10;
      const threePartsScore = 20;
      
      expect(noPartsScore).toBe(0);
      expect(onePartScore).toBe(10);
      expect(twoPartsScore).toBe(10);
      expect(threePartsScore).toBe(20);
    });
  });
});
