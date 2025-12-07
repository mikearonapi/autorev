/**
 * Scoring Library for SuperNatural Motorsports Performance Vehicle Advisory
 * 
 * This module provides pure functions for calculating weighted scores
 * for the recommendation engine. It can be used both in the main advisory
 * component and on individual car hero pages.
 */

import { categories } from '../data/cars.js';

/**
 * Default weights (all categories equal at 1)
 */
export const DEFAULT_WEIGHTS = Object.fromEntries(
  categories.map(cat => [cat.key, 1])
);

/**
 * Calculate the weighted total score for a single car
 * @param {Object} car - Car object with score properties
 * @param {Object} weights - Object with category keys and weight values
 * @returns {number} - The weighted total score
 */
export function calculateWeightedScore(car, weights = DEFAULT_WEIGHTS) {
  return categories.reduce((sum, cat) => {
    const carScore = car[cat.key] ?? 0;
    const weight = weights[cat.key] ?? 1;
    return sum + (carScore * weight);
  }, 0);
}

/**
 * Calculate the maximum possible score based on current weights
 * (All categories at 10)
 * @param {Object} weights - Object with category keys and weight values
 * @returns {number} - The maximum possible score
 */
export function calculateMaxScore(weights = DEFAULT_WEIGHTS) {
  return categories.reduce((sum, cat) => {
    const weight = weights[cat.key] ?? 1;
    return sum + (10 * weight);
  }, 0);
}

/**
 * Calculate score breakdown for a car showing individual category contributions
 * @param {Object} car - Car object with score properties
 * @param {Object} weights - Object with category keys and weight values
 * @returns {Object[]} - Array of score breakdown objects
 */
export function calculateScoreBreakdown(car, weights = DEFAULT_WEIGHTS) {
  return categories.map(cat => {
    const rawScore = car[cat.key] ?? 0;
    const weight = weights[cat.key] ?? 1;
    const weightedScore = rawScore * weight;
    const maxWeighted = 10 * weight;
    
    return {
      key: cat.key,
      label: cat.label,
      description: cat.desc,
      rawScore,
      weight,
      weightedScore,
      maxWeighted,
      percentage: maxWeighted > 0 ? (weightedScore / maxWeighted) * 100 : 0,
    };
  });
}

/**
 * Get a rating label based on score
 * @param {number} score - Score from 1-10
 * @returns {{label: string, tier: string}}
 */
export function getScoreLabel(score) {
  if (score >= 9) return { label: 'Excellent', tier: 'excellent' };
  if (score >= 7) return { label: 'Good', tier: 'good' };
  if (score >= 5) return { label: 'Average', tier: 'average' };
  if (score >= 3) return { label: 'Below Average', tier: 'below-average' };
  return { label: 'Poor', tier: 'poor' };
}

/**
 * Get a rating label for overall score percentage
 * @param {number} score - Current score
 * @param {number} maxScore - Maximum possible score
 * @returns {{label: string, tier: string}}
 */
export function getOverallRating(score, maxScore) {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 80) return { label: 'Exceptional Match', tier: 'exceptional' };
  if (percentage >= 65) return { label: 'Strong Match', tier: 'strong' };
  if (percentage >= 50) return { label: 'Good Match', tier: 'good' };
  return { label: 'Moderate Match', tier: 'moderate' };
}

/**
 * Sort cars by weighted total score (descending)
 * @param {Object[]} cars - Array of car objects
 * @param {Object} weights - Object with category keys and weight values
 * @returns {Object[]} - Sorted array with 'total' property added
 */
export function sortCarsByScore(cars, weights = DEFAULT_WEIGHTS) {
  return [...cars]
    .map(car => ({
      ...car,
      total: calculateWeightedScore(car, weights),
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Get personalized recommendations based on weights and filtered cars
 * @param {Object[]} filteredCars - Array of car objects (already filtered)
 * @param {Object} weights - Object with category keys and weight values
 * @returns {Object} - Object with recommendation keys and car objects
 */
export function getRecommendations(filteredCars, weights = DEFAULT_WEIGHTS) {
  if (!filteredCars || filteredCars.length === 0) {
    return {
      top: null,
      sound: null,
      track: null,
      value: null,
      reliable: null,
      modder: null,
    };
  }

  // Add total scores to all cars
  const carsWithScores = filteredCars.map(car => ({
    ...car,
    total: calculateWeightedScore(car, weights),
  }));

  // Sort by total score for top match
  const sortedByTotal = [...carsWithScores].sort((a, b) => b.total - a.total);

  return {
    // Top overall match based on user's weights
    top: sortedByTotal[0],
    
    // Best sound & feel (sound + driverFun)
    sound: [...carsWithScores].sort((a, b) => 
      (b.sound + b.driverFun) - (a.sound + a.driverFun)
    )[0],
    
    // Best for track (track + driverFun)
    track: [...carsWithScores].sort((a, b) => 
      (b.track + b.driverFun) - (a.track + a.driverFun)
    )[0],
    
    // Best value
    value: [...carsWithScores].sort((a, b) => b.value - a.value)[0],
    
    // Most reliable
    reliable: [...carsWithScores].sort((a, b) => b.reliability - a.reliability)[0],
    
    // Best aftermarket support
    modder: [...carsWithScores].sort((a, b) => b.aftermarket - a.aftermarket)[0],
  };
}

/**
 * Get top N cars by weighted score
 * @param {Object[]} cars - Array of car objects
 * @param {Object} weights - Object with category keys and weight values
 * @param {number} n - Number of top cars to return
 * @returns {Object[]} - Top N cars with total scores
 */
export function getTopNCars(cars, weights = DEFAULT_WEIGHTS, n = 5) {
  return sortCarsByScore(cars, weights).slice(0, n);
}

/**
 * Find the best car for a specific category
 * @param {Object[]} cars - Array of car objects
 * @param {string} categoryKey - The category key to find the best car for
 * @returns {Object|null} - The car with the highest score in that category
 */
export function getBestCarForCategory(cars, categoryKey) {
  if (!cars || cars.length === 0) return null;
  
  return [...cars].sort((a, b) => 
    (b[categoryKey] ?? 0) - (a[categoryKey] ?? 0)
  )[0];
}

/**
 * Compare two cars and return the differences
 * @param {Object} carA - First car
 * @param {Object} carB - Second car
 * @param {Object} weights - Object with category keys and weight values
 * @returns {Object} - Comparison object with differences
 */
export function compareCars(carA, carB, weights = DEFAULT_WEIGHTS) {
  const totalA = calculateWeightedScore(carA, weights);
  const totalB = calculateWeightedScore(carB, weights);
  
  return {
    carA: { ...carA, total: totalA },
    carB: { ...carB, total: totalB },
    totalDifference: totalA - totalB,
    winner: totalA >= totalB ? carA : carB,
    categoryComparisons: categories.map(cat => ({
      key: cat.key,
      label: cat.label,
      scoreA: carA[cat.key] ?? 0,
      scoreB: carB[cat.key] ?? 0,
      difference: (carA[cat.key] ?? 0) - (carB[cat.key] ?? 0),
      winner: (carA[cat.key] ?? 0) >= (carB[cat.key] ?? 0) ? 'A' : 'B',
    })),
  };
}

export default {
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
};

