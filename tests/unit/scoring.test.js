/**
 * Unit Tests: Scoring Library
 * 
 * Tests the weighted scoring system for car recommendations.
 * 
 * Run: npm run test:unit -- tests/unit/scoring.test.js
 */

import { describe, it, expect } from 'vitest';
import {
  calculateWeightedScore,
  calculateMaxScore,
  calculateScoreBreakdown,
  getScoreLabel,
  getOverallRating,
  sortCarsByScore,
  getRecommendations,
  getTopNCars,
  getBestCarForCategory,
  compareCars,
  DEFAULT_WEIGHTS,
  ENTHUSIAST_WEIGHTS,
} from '@/lib/scoring';

// =============================================================================
// TEST DATA
// =============================================================================

const mockCars = [
  {
    id: '1',
    name: 'Porsche 911 GT3',
    sound: 10,
    interior: 8,
    track: 10,
    reliability: 7,
    value: 4,
    driverFun: 10,
    aftermarket: 5,
  },
  {
    id: '2',
    name: 'Toyota GR Supra',
    sound: 7,
    interior: 7,
    track: 8,
    reliability: 8,
    value: 8,
    driverFun: 9,
    aftermarket: 9,
  },
  {
    id: '3',
    name: 'Mazda MX-5 Miata',
    sound: 6,
    interior: 6,
    track: 7,
    reliability: 9,
    value: 10,
    driverFun: 10,
    aftermarket: 10,
  },
  {
    id: '4',
    name: 'BMW M3',
    sound: 8,
    interior: 9,
    track: 9,
    reliability: 6,
    value: 6,
    driverFun: 9,
    aftermarket: 8,
  },
];

// =============================================================================
// DEFAULT WEIGHTS TESTS
// =============================================================================

describe('DEFAULT_WEIGHTS', () => {
  it('should have all category keys', () => {
    expect(DEFAULT_WEIGHTS).toHaveProperty('sound');
    expect(DEFAULT_WEIGHTS).toHaveProperty('interior');
    expect(DEFAULT_WEIGHTS).toHaveProperty('track');
    expect(DEFAULT_WEIGHTS).toHaveProperty('reliability');
    expect(DEFAULT_WEIGHTS).toHaveProperty('value');
    expect(DEFAULT_WEIGHTS).toHaveProperty('driverFun');
    expect(DEFAULT_WEIGHTS).toHaveProperty('aftermarket');
  });

  it('should have weight of 1 for all default categories', () => {
    Object.values(DEFAULT_WEIGHTS).forEach(weight => {
      expect(weight).toBe(1);
    });
  });
});

describe('ENTHUSIAST_WEIGHTS', () => {
  it('should prioritize sound and driver fun', () => {
    expect(ENTHUSIAST_WEIGHTS.sound).toBeGreaterThan(1);
    expect(ENTHUSIAST_WEIGHTS.driverFun).toBeGreaterThan(1);
  });

  it('should deprioritize value and aftermarket', () => {
    expect(ENTHUSIAST_WEIGHTS.value).toBeLessThan(1);
    expect(ENTHUSIAST_WEIGHTS.aftermarket).toBeLessThan(1);
  });
});

// =============================================================================
// CALCULATE WEIGHTED SCORE TESTS
// =============================================================================

describe('calculateWeightedScore', () => {
  it('should calculate score correctly with default weights', () => {
    const car = mockCars[0]; // Porsche 911 GT3
    const score = calculateWeightedScore(car);
    
    // Sum of all categories with weight 1
    const expectedSum = car.sound + car.interior + car.track + 
      car.reliability + car.value + car.driverFun + car.aftermarket;
    
    expect(score).toBe(expectedSum);
  });

  it('should calculate score correctly with custom weights', () => {
    const car = mockCars[0];
    const customWeights = {
      sound: 2,
      interior: 1,
      track: 2,
      reliability: 1,
      value: 0.5,
      driverFun: 2,
      aftermarket: 0.5,
    };
    
    const score = calculateWeightedScore(car, customWeights);
    
    const expected = 
      car.sound * 2 +
      car.interior * 1 +
      car.track * 2 +
      car.reliability * 1 +
      car.value * 0.5 +
      car.driverFun * 2 +
      car.aftermarket * 0.5;
    
    expect(score).toBe(expected);
  });

  it('should handle missing category values gracefully', () => {
    const incompleteCar = { id: '5', sound: 8 };
    const score = calculateWeightedScore(incompleteCar);
    
    expect(score).toBe(8);
  });

  it('should handle zero weights', () => {
    const car = mockCars[0];
    const zeroWeights = { ...DEFAULT_WEIGHTS, sound: 0 };
    
    const scoreWithSound = calculateWeightedScore(car);
    const scoreWithoutSound = calculateWeightedScore(car, zeroWeights);
    
    expect(scoreWithoutSound).toBeLessThan(scoreWithSound);
    expect(scoreWithoutSound).toBe(scoreWithSound - car.sound);
  });
});

// =============================================================================
// CALCULATE MAX SCORE TESTS
// =============================================================================

describe('calculateMaxScore', () => {
  it('should calculate max score correctly with default weights', () => {
    const maxScore = calculateMaxScore();
    
    // 7 categories * 10 (max score per category) * 1 (default weight)
    expect(maxScore).toBe(70);
  });

  it('should calculate max score correctly with custom weights', () => {
    const customWeights = {
      sound: 2,
      interior: 1,
      track: 2,
      reliability: 1,
      value: 1,
      driverFun: 2,
      aftermarket: 1,
    };
    
    const maxScore = calculateMaxScore(customWeights);
    
    // (2+1+2+1+1+2+1) * 10 = 100
    expect(maxScore).toBe(100);
  });
});

// =============================================================================
// CALCULATE SCORE BREAKDOWN TESTS
// =============================================================================

describe('calculateScoreBreakdown', () => {
  it('should return breakdown for all categories', () => {
    const car = mockCars[0];
    const breakdown = calculateScoreBreakdown(car);
    
    expect(breakdown).toHaveLength(7);
    expect(breakdown[0]).toHaveProperty('key');
    expect(breakdown[0]).toHaveProperty('rawScore');
    expect(breakdown[0]).toHaveProperty('weight');
    expect(breakdown[0]).toHaveProperty('weightedScore');
    expect(breakdown[0]).toHaveProperty('percentage');
  });

  it('should calculate percentages correctly', () => {
    const car = { id: '1', sound: 10, interior: 5 };
    const breakdown = calculateScoreBreakdown(car);
    
    const soundBreakdown = breakdown.find(b => b.key === 'sound');
    const interiorBreakdown = breakdown.find(b => b.key === 'interior');
    
    expect(soundBreakdown.percentage).toBe(100); // 10/10 = 100%
    expect(interiorBreakdown.percentage).toBe(50); // 5/10 = 50%
  });
});

// =============================================================================
// GET SCORE LABEL TESTS
// =============================================================================

describe('getScoreLabel', () => {
  it('should return Excellent for 9+', () => {
    const result = getScoreLabel(9);
    expect(result.label).toBe('Excellent');
    expect(result.tier).toBe('excellent');
  });

  it('should return Good for 7-8', () => {
    const result = getScoreLabel(7);
    expect(result.label).toBe('Good');
    expect(result.tier).toBe('good');
  });

  it('should return Average for 5-6', () => {
    const result = getScoreLabel(5);
    expect(result.label).toBe('Average');
    expect(result.tier).toBe('average');
  });

  it('should return Below Average for 3-4', () => {
    const result = getScoreLabel(3);
    expect(result.label).toBe('Below Average');
    expect(result.tier).toBe('below-average');
  });

  it('should return Poor for <3', () => {
    const result = getScoreLabel(2);
    expect(result.label).toBe('Poor');
    expect(result.tier).toBe('poor');
  });
});

// =============================================================================
// GET OVERALL RATING TESTS
// =============================================================================

describe('getOverallRating', () => {
  it('should return Exceptional Match for 80%+', () => {
    const result = getOverallRating(56, 70); // 80%
    expect(result.label).toBe('Exceptional Match');
    expect(result.tier).toBe('exceptional');
  });

  it('should return Strong Match for 65-79%', () => {
    const result = getOverallRating(49, 70); // 70%
    expect(result.label).toBe('Strong Match');
    expect(result.tier).toBe('strong');
  });

  it('should return Good Match for 50-64%', () => {
    const result = getOverallRating(35, 70); // 50%
    expect(result.label).toBe('Good Match');
    expect(result.tier).toBe('good');
  });

  it('should return Moderate Match for <50%', () => {
    const result = getOverallRating(28, 70); // 40%
    expect(result.label).toBe('Moderate Match');
    expect(result.tier).toBe('moderate');
  });
});

// =============================================================================
// SORT CARS BY SCORE TESTS
// =============================================================================

describe('sortCarsByScore', () => {
  it('should sort cars by total score descending', () => {
    const sorted = sortCarsByScore(mockCars);
    
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].total).toBeGreaterThanOrEqual(sorted[i].total);
    }
  });

  it('should add total property to each car', () => {
    const sorted = sortCarsByScore(mockCars);
    
    sorted.forEach(car => {
      expect(car).toHaveProperty('total');
      expect(typeof car.total).toBe('number');
    });
  });

  it('should not mutate original array', () => {
    const originalFirst = mockCars[0].id;
    sortCarsByScore(mockCars);
    
    expect(mockCars[0].id).toBe(originalFirst);
  });
});

// =============================================================================
// GET RECOMMENDATIONS TESTS
// =============================================================================

describe('getRecommendations', () => {
  it('should return top match as highest scoring car', () => {
    const recommendations = getRecommendations(mockCars);
    
    expect(recommendations.top).toBeDefined();
    expect(recommendations.top.id).toBeDefined();
  });

  it('should prefer unique cars for each recommendation when possible', () => {
    const recommendations = getRecommendations(mockCars);
    
    // Count how many unique cars are used
    const usedIds = new Set();
    Object.values(recommendations).forEach(car => {
      if (car) {
        usedIds.add(car.id);
      }
    });
    
    // With 4 test cars, we should use at least 3-4 unique cars
    // (may have duplicates if all candidates are exhausted)
    expect(usedIds.size).toBeGreaterThanOrEqual(3);
  });

  it('should return null values for empty cars array', () => {
    const recommendations = getRecommendations([]);
    
    expect(recommendations.top).toBeNull();
    expect(recommendations.sound).toBeNull();
  });

  it('should respect zeroed weights', () => {
    const weightsWithZeros = { ...DEFAULT_WEIGHTS, sound: 0, aftermarket: 0 };
    const recommendations = getRecommendations(mockCars, weightsWithZeros);
    
    expect(recommendations.sound).toBeNull();
    expect(recommendations.aftermarket).toBeNull();
  });
});

// =============================================================================
// GET TOP N CARS TESTS
// =============================================================================

describe('getTopNCars', () => {
  it('should return correct number of cars', () => {
    const topCars = getTopNCars(mockCars, DEFAULT_WEIGHTS, 3);
    
    expect(topCars).toHaveLength(3);
  });

  it('should return cars sorted by score', () => {
    const topCars = getTopNCars(mockCars, DEFAULT_WEIGHTS, 3);
    
    for (let i = 1; i < topCars.length; i++) {
      expect(topCars[i - 1].total).toBeGreaterThanOrEqual(topCars[i].total);
    }
  });

  it('should return all cars if n is greater than array length', () => {
    const topCars = getTopNCars(mockCars, DEFAULT_WEIGHTS, 100);
    
    expect(topCars.length).toBe(mockCars.length);
  });
});

// =============================================================================
// GET BEST CAR FOR CATEGORY TESTS
// =============================================================================

describe('getBestCarForCategory', () => {
  it('should return car with highest score in category', () => {
    const bestForValue = getBestCarForCategory(mockCars, 'value');
    
    expect(bestForValue.name).toBe('Mazda MX-5 Miata'); // Has value: 10
  });

  it('should return car with highest track score', () => {
    const bestForTrack = getBestCarForCategory(mockCars, 'track');
    
    expect(bestForTrack.name).toBe('Porsche 911 GT3'); // Has track: 10
  });

  it('should return null for empty array', () => {
    const result = getBestCarForCategory([], 'sound');
    
    expect(result).toBeNull();
  });
});

// =============================================================================
// COMPARE CARS TESTS
// =============================================================================

describe('compareCars', () => {
  it('should compare two cars and determine winner', () => {
    const comparison = compareCars(mockCars[0], mockCars[1]); // GT3 vs Supra
    
    expect(comparison).toHaveProperty('carA');
    expect(comparison).toHaveProperty('carB');
    expect(comparison).toHaveProperty('winner');
    expect(comparison).toHaveProperty('totalDifference');
    expect(comparison).toHaveProperty('categoryComparisons');
  });

  it('should have correct category comparisons', () => {
    const comparison = compareCars(mockCars[0], mockCars[1]);
    
    expect(comparison.categoryComparisons).toHaveLength(7);
    comparison.categoryComparisons.forEach(cat => {
      expect(cat).toHaveProperty('key');
      expect(cat).toHaveProperty('scoreA');
      expect(cat).toHaveProperty('scoreB');
      expect(cat).toHaveProperty('difference');
      expect(cat).toHaveProperty('winner');
    });
  });

  it('should correctly identify category winners', () => {
    const comparison = compareCars(mockCars[0], mockCars[2]); // GT3 vs Miata
    
    const valueComparison = comparison.categoryComparisons.find(c => c.key === 'value');
    expect(valueComparison.winner).toBe('B'); // Miata has better value
    
    const trackComparison = comparison.categoryComparisons.find(c => c.key === 'track');
    expect(trackComparison.winner).toBe('A'); // GT3 is better on track
  });

  it('should calculate total difference correctly', () => {
    const comparison = compareCars(mockCars[0], mockCars[1]);
    
    const expectedDiff = comparison.carA.total - comparison.carB.total;
    expect(comparison.totalDifference).toBe(expectedDiff);
  });
});
