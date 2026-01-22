# AutoRev Scoring Algorithm

> How the Car Selector recommendation engine works
>
> **Last Updated:** January 21, 2026

---

## Overview

The Car Selector uses a weighted scoring algorithm to match users with their ideal sports car. Users set priority weights across 7 categories, and cars are ranked by their weighted total score.

**Key Files:**
- `lib/scoring.js` — Core scoring functions
- `data/cars.js` — Category definitions
- `data/selectorDescriptors.js` — UI text for sliders

---

## The 7 Scoring Categories

Each car has scores (1-10) in these subjective categories:

| Category | Key | What It Measures |
|----------|-----|------------------|
| **Sound** | `sound` | Exhaust note, engine character, auditory experience |
| **Interior** | `interior` | Material quality, comfort, technology |
| **Track** | `track` | Lap times, handling, cooling, brake performance |
| **Reliability** | `reliability` | Dependability, known issues, maintenance costs |
| **Value** | `value` | Price-to-performance ratio, depreciation |
| **Driver Fun** | `driverFun` | Steering feel, engagement, analog experience |
| **Aftermarket** | `aftermarket` | Parts availability, tuning support, community |

---

## Scoring Formula

### Weighted Total Score

```
Total Score = Σ (Category Score × Category Weight)
```

For each car:

```javascript
function calculateWeightedScore(car, weights) {
  return categories.reduce((sum, cat) => {
    const carScore = car[cat.key] ?? 0;  // Car's score (1-10)
    const weight = weights[cat.key] ?? 1; // User's weight (0-3)
    return sum + (carScore * weight);
  }, 0);
}
```

### Example

**User Weights:**
- Sound: 2.5 (very important)
- Track: 2.0 (important)  
- Value: 0.5 (not a priority)
- Others: 1.0 (default)

**Car A (Porsche 911 GT3):**
- Sound: 9, Track: 10, Value: 4, ...

**Calculation:**
```
Sound:       9 × 2.5 = 22.5
Track:      10 × 2.0 = 20.0
Value:       4 × 0.5 =  2.0
Interior:    7 × 1.0 =  7.0
Reliability: 7 × 1.0 =  7.0
DriverFun:   9 × 1.0 =  9.0
Aftermarket: 6 × 1.0 =  6.0
─────────────────────────────
Total:              = 73.5
```

---

## Weight System

### Weight Range

Users can set weights from 0 to 3:

| Weight | Label | Meaning |
|--------|-------|---------|
| 0 | Off | Don't consider this category |
| 0.5 | Low | Minor factor |
| 1.0 | Medium | Normal consideration |
| 1.5 | High | Important factor |
| 2.0 | Very High | Major priority |
| 2.5 | Critical | Top priority |
| 3.0 | Maximum | Absolute must-have |

### Default Weights

When no preferences are set:

```javascript
const DEFAULT_WEIGHTS = {
  sound: 1,
  interior: 1,
  track: 1,
  reliability: 1,
  value: 1,
  driverFun: 1,
  aftermarket: 1,
};
```

### Enthusiast Weights

Pre-set for sports car enthusiasts:

```javascript
const ENTHUSIAST_WEIGHTS = {
  sound: 1.3,       // Exhaust note matters
  interior: 1.0,    // Nice to have
  track: 1.2,       // Performance focus
  reliability: 1.0, // Important
  value: 0.8,       // Not the priority
  driverFun: 1.3,   // Core reason to buy
  aftermarket: 0.8, // Nice for modders
};
```

---

## Recommendation Types

The selector shows multiple recommendation types, each highlighting different priorities:

### Primary Recommendation

**Top Match** — Highest weighted total score considering all user weights.

### Category Picks

For each category, the car with the highest raw score in that category (from the top-ranked pool):

| Recommendation | Logic |
|----------------|-------|
| Your Sound Pick | Best `sound` score in top 15 |
| Your Track Pick | Best `track` score in top 15 |
| Your Value Pick | Best `value` score in top 15 |
| Your Reliability Pick | Best `reliability` score in top 15 |
| Your Fun Pick | Best `driverFun` score in top 15 |

### Uniqueness Constraint

**Each recommendation must be a unique car.** If the best car for a category is already used, the next best is selected.

```javascript
function getRecommendations(filteredCars, weights, topN = 15) {
  const usedCarIds = new Set();
  
  // Top match is always #1
  recommendations.top = sortedByTotal[0];
  usedCarIds.add(recommendations.top.id);
  
  // For each category, find unique best
  for (const category of priorityCategories) {
    const sorted = sortByCategory(candidates, category);
    const uniqueCar = sorted.find(car => !usedCarIds.has(car.id));
    recommendations[category] = uniqueCar;
    usedCarIds.add(uniqueCar.id);
  }
}
```

---

## Score Labels

### Individual Score Rating

| Score | Label | Tier |
|-------|-------|------|
| 9-10 | Excellent | `excellent` |
| 7-8 | Good | `good` |
| 5-6 | Average | `average` |
| 3-4 | Below Average | `below-average` |
| 1-2 | Poor | `poor` |

### Overall Match Rating

Based on percentage of maximum possible score:

| Percentage | Label | Tier |
|------------|-------|------|
| 80%+ | Exceptional Match | `exceptional` |
| 65-79% | Strong Match | `strong` |
| 50-64% | Good Match | `good` |
| <50% | Moderate Match | `moderate` |

---

## Filtering

Before scoring, cars are filtered by hard requirements:

### Must-Have Filters

| Filter | Options |
|--------|---------|
| Price Range | $0 - $200k+ |
| Manual Transmission | Available / Any |
| Drivetrain | RWD / AWD / Any |
| Seating | 2 / 4 / Any |

### Filter Application

```javascript
function applyFilters(cars, filters) {
  return cars.filter(car => {
    if (filters.priceMax && car.price_avg > filters.priceMax) return false;
    if (filters.priceMin && car.price_avg < filters.priceMin) return false;
    if (filters.manual && !car.manual_available) return false;
    if (filters.drivetrain && car.drivetrain !== filters.drivetrain) return false;
    if (filters.seats && car.seats < filters.seats) return false;
    return true;
  });
}
```

---

## Score Breakdown

For detailed analysis, the algorithm can show how each category contributes:

```javascript
function calculateScoreBreakdown(car, weights) {
  return categories.map(cat => ({
    key: cat.key,
    label: cat.label,
    rawScore: car[cat.key],          // Car's score (1-10)
    weight: weights[cat.key],         // User's weight
    weightedScore: rawScore * weight, // Contribution
    maxWeighted: 10 * weight,         // Max possible
    percentage: (weightedScore / maxWeighted) * 100,
  }));
}
```

---

## Car Comparison

Two cars can be compared category by category:

```javascript
function compareCars(carA, carB, weights) {
  const totalA = calculateWeightedScore(carA, weights);
  const totalB = calculateWeightedScore(carB, weights);
  
  return {
    carA: { ...carA, total: totalA },
    carB: { ...carB, total: totalB },
    winner: totalA >= totalB ? carA : carB,
    totalDifference: totalA - totalB,
    categoryComparisons: categories.map(cat => ({
      key: cat.key,
      scoreA: carA[cat.key],
      scoreB: carB[cat.key],
      winner: carA[cat.key] >= carB[cat.key] ? 'A' : 'B',
    })),
  };
}
```

---

## Dynamic Recommendations

Recommendations adapt to user's top priorities:

```javascript
function getDynamicRecommendationTypes(weights) {
  const topPriorities = getTopPriorities(weights, 3);
  
  // Always include top match
  const recommendations = [
    { key: 'top', label: 'Your Top Match', isPrimary: true },
  ];
  
  // Add user's top weighted categories
  topPriorities.forEach(priority => {
    recommendations.push({
      key: priority.key,
      label: `Your ${categoryLabels[priority.key]} Pick`,
    });
  });
  
  return recommendations;
}
```

---

## API Functions

### Main Functions

| Function | Purpose |
|----------|---------|
| `calculateWeightedScore(car, weights)` | Single car's total score |
| `calculateMaxScore(weights)` | Maximum possible score |
| `sortCarsByScore(cars, weights)` | Sort array by score |
| `getRecommendations(cars, weights)` | Get all recommendation types |
| `getTopNCars(cars, weights, n)` | Get top N cars |
| `getBestCarForCategory(cars, category)` | Best car for one category |
| `compareCars(carA, carB, weights)` | Detailed comparison |

### Helper Functions

| Function | Purpose |
|----------|---------|
| `calculateScoreBreakdown(car, weights)` | Per-category contribution |
| `getScoreLabel(score)` | Score → "Excellent"/"Good"/etc |
| `getOverallRating(score, max)` | Match quality label |
| `getTopPriorities(weights, n)` | User's top N priorities |
| `getDynamicRecommendationTypes(weights)` | Adaptive recommendation labels |

---

## Usage Example

```javascript
import { 
  sortCarsByScore, 
  getRecommendations,
  calculateScoreBreakdown 
} from '@/lib/scoring';

// User's priority weights
const weights = {
  sound: 2.5,
  track: 2.0,
  driverFun: 2.0,
  reliability: 1.5,
  interior: 1.0,
  value: 0.5,
  aftermarket: 0.5,
};

// Apply filters and get filtered cars
const filteredCars = applyFilters(allCars, { priceMax: 80000, manual: true });

// Get ranked list
const rankedCars = sortCarsByScore(filteredCars, weights);

// Get recommendations
const recs = getRecommendations(filteredCars, weights);
// → { top: {...}, sound: {...}, track: {...}, ... }

// Get breakdown for top car
const breakdown = calculateScoreBreakdown(recs.top, weights);
// → [{ key: 'sound', rawScore: 9, weight: 2.5, weightedScore: 22.5, ... }, ...]
```

---

## Score Data Source

Car scores are stored in the `cars` table:

| Column | Type | Description |
|--------|------|-------------|
| `score_sound` | DECIMAL | Sound/exhaust score (1-10) |
| `score_interior` | DECIMAL | Interior quality score |
| `score_track` | DECIMAL | Track capability score |
| `score_reliability` | DECIMAL | Reliability score |
| `score_value` | DECIMAL | Value score |
| `score_driver_fun` | DECIMAL | Driver engagement score |
| `score_aftermarket` | DECIMAL | Aftermarket support score |

### Score Calibration

Scores are calibrated through:
1. Expert evaluation
2. Community feedback
3. Objective data (reliability reports, track times)
4. Periodic audits (`scripts/score-audit.js`)

---

*See [FEATURES.md](FEATURES.md) for Car Selector feature documentation and [DATA_FILES.md](DATA_FILES.md) for selector descriptor details.*














