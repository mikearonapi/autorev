/**
 * Unit Tests: Tunability Calculator
 * 
 * Tests the tunability score calculation for different car platforms.
 * 
 * Run: npm run test:unit -- tests/unit/tunability-calculator.test.js
 */

import { describe, it, expect } from 'vitest';
import {
  calculateTunability,
  getTunabilityLabel,
  getTunabilityDescription,
  getTunabilityColor,
} from '@/lib/tunabilityCalculator';

// =============================================================================
// TEST DATA
// =============================================================================

const mockGTR = {
  name: 'Nissan GT-R R35',
  engine: '3.8L V6 Twin-Turbo',
};

const mockMiata = {
  name: 'Mazda MX-5 Miata ND',
  engine: '2.0L I4 Naturally Aspirated',
};

const mockFerrari = {
  name: 'Ferrari 488 GTB',
  engine: '3.9L V8 Twin-Turbo',
};

const mockSupra = {
  name: 'Toyota GR Supra MK5',
  engine: '3.0L I6 Twin-Turbo',
};

const mockMustang = {
  name: 'Ford Mustang GT',
  engine: '5.0L V8',
};

const mockEV = {
  name: 'Tesla Model S',
  engine: 'Electric',
};

// =============================================================================
// CALCULATE TUNABILITY TESTS
// =============================================================================

describe('calculateTunability', () => {
  describe('Legendary tuner platforms', () => {
    it('should give high score to GT-R', () => {
      const result = calculateTunability(mockGTR);
      
      expect(result.score).toBeGreaterThanOrEqual(8);
      expect(result.label).toBe('Legendary');
      expect(result.factors.length).toBeGreaterThan(0);
    });

    it('should give high score to Supra', () => {
      const result = calculateTunability(mockSupra);
      
      expect(result.score).toBeGreaterThanOrEqual(8);
      expect(result.label).toBe('Legendary');
    });

    it('should identify platform as turbo', () => {
      const result = calculateTunability(mockGTR);
      
      expect(result.aspirationType).toBe('twin-turbo');
    });
  });

  describe('NA platforms', () => {
    it('should give good score to Miata (legendary NA platform)', () => {
      const result = calculateTunability(mockMiata);
      
      // Miata has legendary aftermarket despite being NA
      expect(result.score).toBeGreaterThanOrEqual(6);
      expect(result.aspirationType).toBe('naturally-aspirated');
    });

    it('should score Mustang well (great aftermarket)', () => {
      const result = calculateTunability(mockMustang);
      
      expect(result.score).toBeGreaterThanOrEqual(6);
      expect(result.platformKey).toBe('ford-mustang');
    });
  });

  describe('Limited aftermarket platforms', () => {
    it('should give lower score to exotic cars', () => {
      const result = calculateTunability(mockFerrari);
      
      // Ferrari has turbo bonus but limited aftermarket
      expect(result.score).toBeLessThan(8);
      expect(result.platformKey).toBe('ferrari');
    });
  });

  describe('Electric vehicles', () => {
    it('should give lower score to EVs', () => {
      const result = calculateTunability(mockEV);
      
      expect(result.score).toBeLessThanOrEqual(5);
      expect(result.aspirationType).toBe('ev');
    });
  });

  describe('Explicit tunability override', () => {
    it('should use explicit tunability if provided', () => {
      const carWithExplicitTunability = {
        name: 'Test Car',
        tunability: 8.5,
      };
      
      const result = calculateTunability(carWithExplicitTunability);
      
      expect(result.score).toBe(8.5);
      expect(result.factors).toEqual([]);
    });
  });

  describe('Price tier impact', () => {
    it('should penalize premium tier slightly', () => {
      const premiumCar = {
        name: 'Porsche 911 GT3',
        engine: 'Naturally Aspirated',
        tier: 'premium',
      };
      
      const result = calculateTunability(premiumCar);
      
      expect(result.factors.some(f => f.factor === 'Premium platform')).toBe(true);
    });

    it('should boost budget tier slightly', () => {
      const budgetCar = {
        name: 'Toyota 86',
        engine: 'Naturally Aspirated',
        tier: 'budget',
      };
      
      const result = calculateTunability(budgetCar);
      
      expect(result.factors.some(f => f.factor === 'Budget-friendly platform')).toBe(true);
    });
  });

  describe('Aftermarket support factor', () => {
    it('should use aftermarketSupport if provided', () => {
      const carWithAftermarket = {
        name: 'Unknown Car',
        engine: 'V8',
        aftermarketSupport: 9,
      };
      
      const result = calculateTunability(carWithAftermarket);
      
      expect(result.factors.some(f => f.factor.includes('aftermarket'))).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle null/undefined car gracefully', () => {
      const result = calculateTunability({});
      
      expect(result.score).toBeGreaterThanOrEqual(1);
      expect(result.score).toBeLessThanOrEqual(10);
      expect(result).toHaveProperty('label');
      expect(result).toHaveProperty('description');
    });

    it('should handle missing engine info', () => {
      const car = { name: 'Unknown Car' };
      const result = calculateTunability(car);
      
      // Returns 'unknown' when engine info is missing
      expect(result.aspirationType).toBe('unknown');
    });

    it('should clamp scores to 1-10 range', () => {
      // Even with extreme values, score should be clamped
      const result = calculateTunability(mockGTR);
      
      expect(result.score).toBeGreaterThanOrEqual(1);
      expect(result.score).toBeLessThanOrEqual(10);
    });
  });
});

// =============================================================================
// GET TUNABILITY LABEL TESTS
// =============================================================================

describe('getTunabilityLabel', () => {
  it('should return Legendary for 9+', () => {
    expect(getTunabilityLabel(9)).toBe('Legendary');
    expect(getTunabilityLabel(10)).toBe('Legendary');
  });

  it('should return Excellent for 7.5-8.9', () => {
    expect(getTunabilityLabel(7.5)).toBe('Excellent');
    expect(getTunabilityLabel(8.9)).toBe('Excellent');
  });

  it('should return Good for 6-7.4', () => {
    expect(getTunabilityLabel(6)).toBe('Good');
    expect(getTunabilityLabel(7.4)).toBe('Good');
  });

  it('should return Moderate for 4-5.9', () => {
    expect(getTunabilityLabel(4)).toBe('Moderate');
    expect(getTunabilityLabel(5.9)).toBe('Moderate');
  });

  it('should return Limited for 2-3.9', () => {
    expect(getTunabilityLabel(2)).toBe('Limited');
    expect(getTunabilityLabel(3.9)).toBe('Limited');
  });

  it('should return Not Recommended for <2', () => {
    expect(getTunabilityLabel(1)).toBe('Not Recommended');
    expect(getTunabilityLabel(1.9)).toBe('Not Recommended');
  });
});

// =============================================================================
// GET TUNABILITY DESCRIPTION TESTS
// =============================================================================

describe('getTunabilityDescription', () => {
  it('should return appropriate description for each tier', () => {
    const legendary = getTunabilityDescription(10);
    expect(legendary).toContain('most tunable');
    
    const excellent = getTunabilityDescription(8);
    expect(excellent).toContain('Excellent');
    
    const good = getTunabilityDescription(6.5);
    expect(good).toContain('Good');
    
    const moderate = getTunabilityDescription(4.5);
    expect(moderate).toContain('limited');
    
    const limited = getTunabilityDescription(2.5);
    expect(limited).toContain('Limited');
    
    const notRecommended = getTunabilityDescription(1);
    expect(notRecommended).toContain('Not recommended');
  });
});

// =============================================================================
// GET TUNABILITY COLOR TESTS
// =============================================================================

describe('getTunabilityColor', () => {
  it('should return purple for legendary scores (9+)', () => {
    const color = getTunabilityColor(9);
    expect(color).toBe('#9b59b6');
  });

  it('should return green for excellent scores (7.5-8.9)', () => {
    const color = getTunabilityColor(8);
    expect(color).toBe('#27ae60');
  });

  it('should return blue for good scores (6-7.4)', () => {
    const color = getTunabilityColor(6.5);
    expect(color).toBe('#3498db');
  });

  it('should return orange for moderate scores (4-5.9)', () => {
    const color = getTunabilityColor(5);
    expect(color).toBe('#f39c12');
  });

  it('should return red for limited scores (<4)', () => {
    const color = getTunabilityColor(2);
    expect(color).toBe('#e74c3c');
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Tunability Calculator Integration', () => {
  it('should produce consistent results for same car', () => {
    const result1 = calculateTunability(mockGTR);
    const result2 = calculateTunability(mockGTR);
    
    expect(result1.score).toBe(result2.score);
    expect(result1.label).toBe(result2.label);
  });

  it('should have color consistent with label', () => {
    const result = calculateTunability(mockGTR);
    const color = getTunabilityColor(result.score);
    
    // Legendary should have purple
    if (result.label === 'Legendary') {
      expect(color).toBe('#9b59b6');
    }
  });

  it('should order platforms by tunability correctly', () => {
    const gtrResult = calculateTunability(mockGTR);
    const ferrariResult = calculateTunability(mockFerrari);
    
    // GT-R should be more tunable than Ferrari due to aftermarket
    expect(gtrResult.score).toBeGreaterThan(ferrariResult.score);
  });
});
