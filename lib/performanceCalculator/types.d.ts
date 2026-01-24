/**
 * TypeScript Type Definitions for Performance Calculator Module
 * 
 * @module lib/performanceCalculator/types
 */

// =============================================================================
// BASE TYPES
// =============================================================================

/**
 * Car object with performance specifications
 */
export interface Car {
  slug: string;
  name: string;
  make?: string;
  model?: string;
  year?: number;
  horsepower?: number;
  hp?: number;
  torque?: number;
  weight?: number;
  zeroToSixty?: number;
  quarterMile?: number;
  trapSpeed?: number;
  drivetrain?: 'RWD' | 'FWD' | 'AWD';
  engine_type?: 'turbo' | 'supercharged' | 'naturally_aspirated' | 'twin-turbo';
  displacement?: number;
  cylinders?: number;
  tuning_profile?: TuningProfile;
}

/**
 * Tuning profile with upgrade gains
 */
export interface TuningProfile {
  upgrades_by_objective?: Record<string, UpgradesByObjective>;
  stage_tunes?: StageTune[];
}

export interface UpgradesByObjective {
  stage1?: UpgradeGains;
  stage2?: UpgradeGains;
  stage3?: UpgradeGains;
  [key: string]: UpgradeGains | undefined;
}

export interface UpgradeGains {
  hp_gain?: number;
  tq_gain?: number;
  cost_range?: [number, number];
}

export interface StageTune {
  stage: number;
  hp_gain: number;
  tq_gain?: number;
  requires?: string[];
}

/**
 * Upgrade/modification object
 */
export interface Upgrade {
  key: string;
  name?: string;
  category?: string;
  subcategory?: string;
  hpGain?: number;
  tqGain?: number;
  cost?: {
    low?: number;
    high?: number;
  };
  estimatedCostLow?: number;
  estimatedCostHigh?: number;
}

// =============================================================================
// HP CALCULATION TYPES
// =============================================================================

/**
 * Result from calculateSmartHpGain
 */
export interface HpGainResult {
  stockHp: number;
  stockTorque: number;
  projectedHp: number;
  projectedTorque: number;
  hpGain: number;
  torqueGain: number;
  percentageGain: number;
  breakdown: HpBreakdownItem[];
  confidence: ConfidenceLevel;
  warnings?: string[];
}

export interface HpBreakdownItem {
  key: string;
  name: string;
  category: string;
  hpGain: number;
  tqGain: number;
  diminished?: boolean;
  reason?: string;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'estimated';

/**
 * Result from calculateAllModificationGains
 */
export interface ModificationGainsResult {
  totalHpGain: number;
  totalTqGain: number;
  projectedHp: number;
  projectedTorque: number;
  breakdown: ModGainBreakdown[];
}

export interface ModGainBreakdown {
  modKey: string;
  hpGain: number;
  tqGain: number;
  source: 'tuning_profile' | 'generic' | 'fallback';
}

/**
 * Result from calculateBuildPerformance
 */
export interface BuildPerformanceResult {
  stockHp: number;
  stockTorque: number;
  projectedHp: number;
  projectedTorque: number;
  hpGain: number;
  torqueGain: number;
  totalCostLow: number;
  totalCostHigh: number;
  upgradeCount: number;
  modBreakdown: HpBreakdownItem[];
}

// =============================================================================
// METRICS CALCULATION TYPES
// =============================================================================

/**
 * Result from calculateUpgradedMetrics
 */
export interface UpgradedMetricsResult {
  zeroToSixty: {
    stock: number;
    upgraded: number;
    improvement: number;
  };
  quarterMile: {
    stock: number;
    upgraded: number;
    improvement: number;
  };
  trapSpeed: {
    stock: number;
    upgraded: number;
    improvement: number;
  };
}

// =============================================================================
// SCORE CALCULATION TYPES
// =============================================================================

/**
 * Performance scores object
 */
export interface PerformanceScores {
  acceleration: number;
  handling: number;
  braking: number;
  topSpeed: number;
  overall: number;
}

/**
 * Score comparison result
 */
export interface ScoreComparison {
  category: string;
  stock: number;
  upgraded: number;
  improvement: number;
  percentImprovement: number;
}

/**
 * Performance profile result
 */
export interface PerformanceProfile {
  type: 'balanced' | 'speed-focused' | 'handling-focused' | 'track-ready' | 'street-tuned';
  description: string;
  strengths: string[];
  weaknesses: string[];
}

// =============================================================================
// CONFLICT DETECTION TYPES
// =============================================================================

/**
 * Conflict detection result
 */
export interface ConflictResult {
  hasConflicts: boolean;
  conflicts: Conflict[];
  warnings: Warning[];
}

export interface Conflict {
  type: 'incompatible' | 'redundant' | 'requires_upgrade';
  mods: string[];
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface Warning {
  type: string;
  message: string;
  affectedMods: string[];
}

/**
 * Conflict summary result
 */
export interface ConflictSummary {
  errorCount: number;
  warningCount: number;
  infoCount: number;
  messages: string[];
}

// =============================================================================
// CONSTANTS TYPES
// =============================================================================

export interface CategoryCap {
  cap: number;
  diminishing_factor?: number;
}

export type TuneLevel = 'stock' | 'stage1' | 'stage2' | 'stage3' | 'custom';

export interface ConfidenceTier {
  level: ConfidenceLevel;
  minDataPoints: number;
  description: string;
}

// =============================================================================
// FUNCTION SIGNATURES
// =============================================================================

// HP Calculation
export function calculateSmartHpGain(
  car: Car,
  selectedUpgrades: string[] | Upgrade[],
  options?: { includeConfidence?: boolean }
): HpGainResult;

export function calculateAllModificationGains(
  car: Car,
  mods: string[]
): ModificationGainsResult;

export function calculateBuildPerformance(
  car: Car,
  upgrades: Upgrade[]
): BuildPerformanceResult;

export function calculateMultiplierBased(
  stockHp: number,
  multiplier: number
): number;

export function formatHpDisplay(hp: number): string;

export function isExhaustMod(modKey: string): boolean;
export function isIntakeMod(modKey: string): boolean;
export function isForcedInductionMod(modKey: string): boolean;

// Metrics Calculation
export function calculateUpgradedMetrics(
  car: Car,
  hpGain: number,
  torqueGain?: number
): UpgradedMetricsResult;

export function estimateZeroToSixty(
  hp: number,
  weight: number,
  drivetrain?: string
): number;

export function estimateQuarterMile(
  hp: number,
  weight: number
): number;

export function estimateTrapSpeed(
  hp: number,
  weight: number
): number;

// Score Calculation
export function getStockPerformanceScores(car: Car): PerformanceScores;

export function applyUpgradeDeltas(
  stockScores: PerformanceScores,
  upgrades: Upgrade[],
  hpGain: number
): PerformanceScores;

export function getScoreComparison(
  stockScores: PerformanceScores,
  upgradedScores: PerformanceScores
): ScoreComparison[];

export function getScoreLabel(score: number): string;

export function validatePerformanceScores(scores: PerformanceScores): boolean;

export function getPerformanceProfile(
  scores: PerformanceScores
): PerformanceProfile;

export function calculateAverageScore(scores: PerformanceScores): number;

export function getTopCategories(
  scores: PerformanceScores,
  count?: number
): string[];

export function getImprovementOpportunities(
  scores: PerformanceScores
): string[];

// Conflict Detection
export function detectUpgradeConflicts(
  selectedUpgrades: string[] | Upgrade[],
  car?: Car
): ConflictResult;

export function getConflictSummary(
  conflictResult: ConflictResult
): ConflictSummary;

export function checkUpgradeCompatibility(
  existingUpgrades: string[],
  newUpgrade: string
): { compatible: boolean; reason?: string };

// Constants Helpers
export function getHighestPriorityTune(mods: string[]): TuneLevel;
export function isModExpectedByTune(modKey: string, tuneLevel: TuneLevel): boolean;
export function getEngineCategory(car: Car): string;
export function getModGain(modKey: string, car?: Car): { hp: number; tq: number };

// =============================================================================
// EXPORTED CONSTANTS
// =============================================================================

export const STAGE_TUNE_INCLUDED_MODS: Record<TuneLevel, string[]>;
export const TUNE_HIERARCHY: TuneLevel[];
export const EXHAUST_SUBCATEGORIES: string[];
export const CATEGORY_CAPS: Record<string, CategoryCap>;
export const CATEGORY_CAPS_SIMPLE: Record<string, number>;
export const CATEGORY_CAPS_PERCENT: Record<string, number>;
export const DIMINISHING_RETURNS_FACTOR: number;
export const EXHAUST_CROSS_CATEGORY_FACTOR: number;
export const DIMINISHING_RETURNS: Record<string, number>;
export const TUNE_OVERLAP_MODIFIER: number;
export const CONFIDENCE_TIERS: ConfidenceTier[];
export const PHYSICS_CONSTANTS: {
  GRAVITY: number;
  AIR_DENSITY: number;
  DRAG_COEFFICIENT: number;
};
export const MOD_HP_GAINS: Record<string, { hp: number; tq: number }>;

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

declare const performanceCalculator: {
  calculateSmartHpGain: typeof calculateSmartHpGain;
  calculateAllModificationGains: typeof calculateAllModificationGains;
  calculateBuildPerformance: typeof calculateBuildPerformance;
  formatHpDisplay: typeof formatHpDisplay;
  calculateUpgradedMetrics: typeof calculateUpgradedMetrics;
  getStockPerformanceScores: typeof getStockPerformanceScores;
  applyUpgradeDeltas: typeof applyUpgradeDeltas;
  getPerformanceProfile: typeof getPerformanceProfile;
  detectUpgradeConflicts: typeof detectUpgradeConflicts;
  getConflictSummary: typeof getConflictSummary;
  STAGE_TUNE_INCLUDED_MODS: typeof STAGE_TUNE_INCLUDED_MODS;
  TUNE_HIERARCHY: typeof TUNE_HIERARCHY;
  CATEGORY_CAPS: typeof CATEGORY_CAPS;
};

export default performanceCalculator;
