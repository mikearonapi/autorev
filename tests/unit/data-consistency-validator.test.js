/**
 * Unit Tests: Data Consistency Validator
 *
 * Tests the data consistency validation logic to ensure we never
 * present contradictory information to users.
 *
 * Run: npm run test:unit -- tests/unit/data-consistency-validator.test.js
 */

import { describe, it, expect } from 'vitest';

import {
  validateCarData,
  validateEcuTuneRecommendation,
  checkTuningDifficultyInInsights,
  checkPlatformRestrictions,
  shouldRecommendEcuTune,
  getRecommendationLimitationMessage,
} from '@/lib/dataConsistencyValidator';

// =============================================================================
// TEST DATA - Platforms with various tuning constraints
// =============================================================================

// Ferrari 458 Speciale - the exact example from the user's screenshot
const mockFerrari458Speciale = {
  name: 'Ferrari 458 Speciale',
  brand: 'Ferrari',
  engine: '4.5L V8 Naturally Aspirated',
  hp: 597,
  year: 2014,
};

const mockFerrari458TuningProfile = {
  platform_insights: {
    weaknesses: [
      {
        title: 'ECU Tuning Constraints',
        description: 'Factory ECU is encrypted. Focus on bolt-on modifications.',
      },
      {
        title: 'Limited software gains',
        description: 'ECU tuning is nearly impossible on this platform.',
      },
    ],
    community_tips: [
      'Focus on exhaust and intake modifications since ECU tuning is nearly impossible',
    ],
  },
  tuning_platforms: [{ name: 'Capristo Exhaust', notes: 'Exhaust systems' }],
  data_quality_tier: 'good',
};

// BMW M3 - highly tunable platform
const mockBMWM3 = {
  name: 'BMW M3 G80',
  brand: 'BMW',
  engine: '3.0L I6 Twin-Turbo',
  hp: 473,
  score_aftermarket: 9,
};

const mockBMWM3TuningProfile = {
  platform_insights: {
    weaknesses: [
      { title: 'High service costs', description: 'BMW M division service is expensive' },
    ],
    community_tips: [
      'Stage 1 tune unlocks significant power',
      'Bootmod3 is the popular choice for tuning',
    ],
  },
  tuning_platforms: [
    { name: 'Bootmod3', notes: 'Flash tuning platform' },
    { name: 'MHD', notes: 'Budget-friendly tuning' },
  ],
  data_quality_tier: 'excellent',
};

// McLaren 765LT - exotic with encrypted ECU
const mockMcLaren765LT = {
  name: 'McLaren 765LT',
  brand: 'McLaren',
  engine: '4.0L V8 Twin-Turbo',
  hp: 755,
  year: 2021,
};

const mockMcLarenTuningProfile = {
  platform_insights: {
    weaknesses: [
      {
        title: 'Very Limited Tuning',
        description: 'McLaren ECUs have extremely limited aftermarket tuning support.',
      },
    ],
  },
  tuning_platforms: [],
  data_quality_tier: 'good',
};

// Toyota GR86 - tunable platform
const mockGR86 = {
  name: 'Toyota GR86',
  brand: 'Toyota',
  engine: '2.4L Flat-4 Naturally Aspirated',
  hp: 228,
  score_aftermarket: 8,
};

const mockGR86TuningProfile = {
  platform_insights: {
    weaknesses: [
      {
        title: 'NA Power Limits',
        description:
          'Naturally aspirated engine has limited tuning gains without forced induction.',
      },
    ],
    community_tips: ['Headers and tune are the best bang for buck'],
  },
  tuning_platforms: [
    { name: 'COBB Accessport', notes: 'Flash tuning' },
    { name: 'Ecutek', notes: 'Professional tuning' },
  ],
  data_quality_tier: 'excellent',
};

// =============================================================================
// CHECK TUNING DIFFICULTY IN INSIGHTS TESTS
// =============================================================================

describe('checkTuningDifficultyInInsights', () => {
  it('should detect "nearly impossible" in insights', () => {
    const result = checkTuningDifficultyInInsights(mockFerrari458TuningProfile.platform_insights);

    expect(result.hasDifficulty).toBe(true);
    expect(result.matchedTerms).toContain('nearly impossible');
  });

  it('should detect "extremely limited" in insights', () => {
    const result = checkTuningDifficultyInInsights(mockMcLarenTuningProfile.platform_insights);

    expect(result.hasDifficulty).toBe(true);
    // The exact term detected may vary, but it should detect difficulty
    expect(result.matchedTerms.length).toBeGreaterThan(0);
  });

  it('should NOT flag normal weaknesses as tuning difficulty', () => {
    const result = checkTuningDifficultyInInsights(mockBMWM3TuningProfile.platform_insights);

    expect(result.hasDifficulty).toBe(false);
    expect(result.matchedTerms).toHaveLength(0);
  });

  it('should NOT flag NA power limits as ECU tuning difficulty', () => {
    const insights = {
      weaknesses: [
        {
          title: 'Limited NA gains',
          description: 'Naturally aspirated engine has limited tuning potential',
        },
      ],
    };

    const result = checkTuningDifficultyInInsights(insights);

    // "limited" alone shouldn't trigger - it's too generic
    // Only specific phrases like "limited tuning" or "extremely limited" should
    expect(
      result.matchedTerms.includes('limited tuning') ||
        result.matchedTerms.includes('extremely limited')
    ).toBe(false);
  });

  it('should handle null/undefined insights gracefully', () => {
    expect(checkTuningDifficultyInInsights(null).hasDifficulty).toBe(false);
    expect(checkTuningDifficultyInInsights(undefined).hasDifficulty).toBe(false);
    expect(checkTuningDifficultyInInsights({}).hasDifficulty).toBe(false);
  });
});

// =============================================================================
// CHECK PLATFORM RESTRICTIONS TESTS
// =============================================================================

describe('checkPlatformRestrictions', () => {
  it('should flag Ferrari as restricted platform', () => {
    const result = checkPlatformRestrictions(mockFerrari458Speciale);

    expect(result.isRestricted).toBe(true);
    expect(result.restriction).toBe('severe');
    expect(result.reason).toContain('Ferrari');
  });

  it('should flag McLaren as restricted platform', () => {
    const result = checkPlatformRestrictions(mockMcLaren765LT);

    expect(result.isRestricted).toBe(true);
    expect(result.restriction).toBe('severe');
  });

  it('should NOT flag BMW M3 as restricted', () => {
    const result = checkPlatformRestrictions(mockBMWM3);

    expect(result.isRestricted).toBe(false);
  });

  it('should NOT flag Toyota GR86 as restricted', () => {
    const result = checkPlatformRestrictions(mockGR86);

    expect(result.isRestricted).toBe(false);
  });

  it('should handle missing data gracefully', () => {
    expect(checkPlatformRestrictions(null).isRestricted).toBe(false);
    expect(checkPlatformRestrictions({}).isRestricted).toBe(false);
    expect(checkPlatformRestrictions({ name: '' }).isRestricted).toBe(false);
  });
});

// =============================================================================
// VALIDATE ECU TUNE RECOMMENDATION TESTS
// =============================================================================

describe('validateEcuTuneRecommendation', () => {
  describe('Ferrari 458 Speciale (the exact user example)', () => {
    it('should NOT allow ECU tune recommendation', () => {
      const result = validateEcuTuneRecommendation({
        car: mockFerrari458Speciale,
        tuningProfile: mockFerrari458TuningProfile,
        tunabilityScore: 3, // Low tunability for Ferrari
      });

      expect(result.allowEcuTune).toBe(false);
      expect(result.confidenceLevel).toBeLessThan(50);
      expect(result.suppressionReason).toBeTruthy();
    });

    it('should have low confidence even with high tunability score', () => {
      // Even if tunability score is artificially high, insights should override
      const result = validateEcuTuneRecommendation({
        car: mockFerrari458Speciale,
        tuningProfile: mockFerrari458TuningProfile,
        tunabilityScore: 8,
      });

      // Platform restriction should still block
      expect(result.allowEcuTune).toBe(false);
    });
  });

  describe('BMW M3 (tunable platform)', () => {
    it('should allow ECU tune recommendation', () => {
      const result = validateEcuTuneRecommendation({
        car: mockBMWM3,
        tuningProfile: mockBMWM3TuningProfile,
        tunabilityScore: 9,
      });

      expect(result.allowEcuTune).toBe(true);
      expect(result.confidenceLevel).toBeGreaterThan(80);
    });
  });

  describe('Low tunability score', () => {
    it('should not allow ECU tune for score < 5', () => {
      const result = validateEcuTuneRecommendation({
        car: { name: 'Test Car', brand: 'Test' },
        tuningProfile: null,
        tunabilityScore: 3,
      });

      expect(result.allowEcuTune).toBe(false);
      // Check that there's a warning about low tunability
      expect(
        result.warnings.some(
          (w) => w.toLowerCase().includes('tunability') || w.toLowerCase().includes('limited')
        )
      ).toBe(true);
    });
  });

  describe('Missing tuning platforms', () => {
    it('should reduce confidence when no tuning platforms listed', () => {
      const result = validateEcuTuneRecommendation({
        car: mockBMWM3,
        tuningProfile: { tuning_platforms: [] },
        tunabilityScore: 8,
      });

      expect(result.confidenceLevel).toBeLessThan(80);
      // Check that there's a warning about missing platforms
      expect(
        result.warnings.some(
          (w) => w.toLowerCase().includes('platform') || w.toLowerCase().includes('documented')
        )
      ).toBe(true);
    });
  });

  describe('Data quality impact', () => {
    it('should reduce confidence for skeleton data quality', () => {
      const result = validateEcuTuneRecommendation({
        car: mockBMWM3,
        tuningProfile: { data_quality_tier: 'skeleton', tuning_platforms: [] },
        tunabilityScore: 8,
      });

      expect(result.confidenceLevel).toBeLessThan(60);
    });
  });
});

// =============================================================================
// SHOULD RECOMMEND ECU TUNE (QUICK CHECK) TESTS
// =============================================================================

describe('shouldRecommendEcuTune', () => {
  it('should return false for Ferrari 458 Speciale', () => {
    const result = shouldRecommendEcuTune({
      car: mockFerrari458Speciale,
      tuningProfile: mockFerrari458TuningProfile,
    });

    expect(result).toBe(false);
  });

  it('should return true for BMW M3', () => {
    const result = shouldRecommendEcuTune({
      car: mockBMWM3,
      tuningProfile: mockBMWM3TuningProfile,
      tunabilityScore: 9,
    });

    expect(result).toBe(true);
  });

  it('should return false for McLaren 765LT', () => {
    const result = shouldRecommendEcuTune({
      car: mockMcLaren765LT,
      tuningProfile: mockMcLarenTuningProfile,
    });

    expect(result).toBe(false);
  });

  it('should return true for Toyota GR86', () => {
    const result = shouldRecommendEcuTune({
      car: mockGR86,
      tuningProfile: mockGR86TuningProfile,
      tunabilityScore: 7,
    });

    expect(result).toBe(true);
  });
});

// =============================================================================
// VALIDATE CAR DATA (FULL VALIDATION) TESTS
// =============================================================================

describe('validateCarData', () => {
  it('should return invalid for Ferrari 458 Speciale with contradictions', () => {
    const result = validateCarData({
      car: mockFerrari458Speciale,
      tuningProfile: mockFerrari458TuningProfile,
      knownIssues: [],
    });

    expect(result.recommendations.allowEcuTune).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.tunability.score).toBeLessThan(5);
  });

  it('should return valid for BMW M3', () => {
    const result = validateCarData({
      car: mockBMWM3,
      tuningProfile: mockBMWM3TuningProfile,
      knownIssues: [],
    });

    expect(result.isValid).toBe(true);
    expect(result.recommendations.allowEcuTune).toBe(true);
  });
});

// =============================================================================
// GET RECOMMENDATION LIMITATION MESSAGE TESTS
// =============================================================================

describe('getRecommendationLimitationMessage', () => {
  it('should return suppression reason when present', () => {
    const validation = {
      suppressionReason: 'Ferrari ECUs are encrypted',
      confidenceLevel: 20,
      warnings: [],
    };

    const message = getRecommendationLimitationMessage(validation);

    expect(message).toBe('Ferrari ECUs are encrypted');
  });

  it('should return warning when confidence is low', () => {
    const validation = {
      suppressionReason: null,
      confidenceLevel: 40,
      warnings: ['Low tunability score: 3/10'],
    };

    const message = getRecommendationLimitationMessage(validation);

    expect(message).toContain('Low tunability');
  });

  it('should return null when no issues', () => {
    const validation = {
      suppressionReason: null,
      confidenceLevel: 100,
      warnings: [],
    };

    const message = getRecommendationLimitationMessage(validation);

    expect(message).toBeNull();
  });
});

// =============================================================================
// REGRESSION TESTS - Specific scenarios that MUST pass
// =============================================================================

describe('Regression Tests', () => {
  it('REGRESSION: Ferrari 458 Speciale must NOT get ECU tune recommendation', () => {
    // This is the exact scenario from the user's screenshot
    const result = shouldRecommendEcuTune({
      car: mockFerrari458Speciale,
      tuningProfile: mockFerrari458TuningProfile,
    });

    expect(result).toBe(false);
  });

  it('REGRESSION: Platform insights saying "impossible" must block ECU tune', () => {
    const insights = {
      weaknesses: [
        { title: 'ECU Locked', description: 'ECU tuning is impossible on this platform' },
      ],
    };

    const check = checkTuningDifficultyInInsights(insights);
    expect(check.hasDifficulty).toBe(true);

    const result = shouldRecommendEcuTune({
      car: { name: 'Test Car', brand: 'Test' },
      tuningProfile: { platform_insights: insights },
      tunabilityScore: 8,
    });

    expect(result).toBe(false);
  });

  it('REGRESSION: Tunable car with positive insights must still get ECU tune', () => {
    const result = shouldRecommendEcuTune({
      car: mockBMWM3,
      tuningProfile: mockBMWM3TuningProfile,
      tunabilityScore: 9,
    });

    expect(result).toBe(true);
  });

  it('REGRESSION: Low tunability (< 5) must block ECU tune even without insights', () => {
    const result = validateEcuTuneRecommendation({
      car: { name: 'Generic Exotic', brand: 'Exotic' },
      tuningProfile: null,
      tunabilityScore: 3,
    });

    expect(result.allowEcuTune).toBe(false);
  });
});
