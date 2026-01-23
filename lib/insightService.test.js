/**
 * Unit Tests: Insight Service
 * 
 * Tests the insight service calculation logic for:
 * - active_build_id selection for build progress
 * - HP gain summation from active builds
 * - selected_upgrades shape normalization
 * 
 * Run: npm test -- lib/insightService.test.js
 */

import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { _testExports } from './insightService.js';

const {
  normalizeUpgradeKeys,
  calculateBuildProgress,
  calculatePerformanceSummary,
  generateVehicleHealth,
} = _testExports;

describe('Insight Service', () => {
  describe('normalizeUpgradeKeys', () => {
    it('returns empty array for null/undefined', () => {
      assert.deepStrictEqual(normalizeUpgradeKeys(null), []);
      assert.deepStrictEqual(normalizeUpgradeKeys(undefined), []);
    });

    it('returns array as-is when already an array', () => {
      const input = ['stage1-tune', 'cat-back-exhaust'];
      assert.deepStrictEqual(normalizeUpgradeKeys(input), input);
    });

    it('extracts upgrades from object format { upgrades: [...] }', () => {
      const input = {
        upgrades: ['stage1-tune', 'cat-back-exhaust'],
        wheelFitment: { diameter: 19 },
      };
      assert.deepStrictEqual(normalizeUpgradeKeys(input), ['stage1-tune', 'cat-back-exhaust']);
    });

    it('returns empty array for object without upgrades property', () => {
      const input = { wheelFitment: { diameter: 19 } };
      assert.deepStrictEqual(normalizeUpgradeKeys(input), []);
    });
  });

  describe('calculateBuildProgress', () => {
    const mockVehicles = [
      {
        id: 'vehicle-1',
        year: 2020,
        make: 'Audi',
        model: 'RS5',
        nickname: 'My RS5',
        matched_car_slug: 'audi-rs5-2020',
        matched_car_id: 'car-uuid-1',
        active_build_id: 'build-1',
        installed_modifications: ['stage1-tune'],
        total_hp_gain: 50, // This should be ignored in favor of build HP
      },
      {
        id: 'vehicle-2',
        year: 2019,
        make: 'BMW',
        model: 'M3',
        nickname: 'Track Beast',
        matched_car_slug: 'bmw-m3-2019',
        matched_car_id: 'car-uuid-2',
        active_build_id: 'build-2',
        installed_modifications: [],
        total_hp_gain: 0,
      },
    ];

    const mockProjects = [
      {
        id: 'build-1',
        car_slug: 'audi-rs5-2020',
        project_name: 'Stage 2 Build',
        selected_upgrades: { upgrades: ['stage1-tune', 'downpipe', 'cat-back-exhaust'] },
        total_hp_gain: 100, // This should be used
      },
      {
        id: 'build-2',
        car_slug: 'bmw-m3-2019',
        project_name: 'Track Setup',
        selected_upgrades: ['intake', 'exhaust'], // Array format
        total_hp_gain: 40,
      },
      {
        id: 'build-3', // Another build for RS5, but NOT active
        car_slug: 'audi-rs5-2020',
        project_name: 'Street Build',
        selected_upgrades: { upgrades: ['stage1-tune'] },
        total_hp_gain: 30,
      },
    ];

    it('selects project by active_build_id, not car_slug', () => {
      const progress = calculateBuildProgress(mockVehicles, mockProjects);
      
      // Vehicle 1 should use build-1 (active_build_id), not build-3 (same slug)
      const vehicle1Progress = progress.find(p => p.vehicleId === 'vehicle-1');
      assert.strictEqual(vehicle1Progress.projectId, 'build-1');
      assert.strictEqual(vehicle1Progress.projectName, 'Stage 2 Build');
    });

    it('uses project total_hp_gain as currentHpGain (source of truth)', () => {
      const progress = calculateBuildProgress(mockVehicles, mockProjects);
      
      const vehicle1Progress = progress.find(p => p.vehicleId === 'vehicle-1');
      // Should use build's HP gain (100), not vehicle's cached value (50)
      assert.strictEqual(vehicle1Progress.currentHpGain, 100);
      assert.strictEqual(vehicle1Progress.targetHpGain, 100);
    });

    it('handles selected_upgrades in object format', () => {
      const progress = calculateBuildProgress(mockVehicles, mockProjects);
      
      const vehicle1Progress = progress.find(p => p.vehicleId === 'vehicle-1');
      assert.strictEqual(vehicle1Progress.totalPlanned, 3); // 3 upgrades in object format
    });

    it('handles selected_upgrades in array format', () => {
      const progress = calculateBuildProgress(mockVehicles, mockProjects);
      
      const vehicle2Progress = progress.find(p => p.vehicleId === 'vehicle-2');
      assert.strictEqual(vehicle2Progress.totalPlanned, 2); // 2 upgrades in array format
    });

    it('falls back to slug match if no active_build_id', () => {
      const vehiclesNoActiveBuild = [
        {
          id: 'vehicle-3',
          year: 2021,
          make: 'Audi',
          model: 'RS5',
          matched_car_slug: 'audi-rs5-2020',
          active_build_id: null, // No active build
          installed_modifications: [],
          total_hp_gain: 0,
        },
      ];

      const progress = calculateBuildProgress(vehiclesNoActiveBuild, mockProjects);
      
      // Should fall back to first project matching slug (build-1 is first in order)
      const vehicle3Progress = progress.find(p => p.vehicleId === 'vehicle-3');
      assert.strictEqual(vehicle3Progress.projectId, 'build-1');
    });

    it('warns when active_build_id points to missing project', () => {
      const originalWarn = console.warn;
      const warnings = [];
      console.warn = (...args) => warnings.push(args.join(' '));
      
      const vehiclesWithMissingBuild = [
        {
          id: 'vehicle-4',
          year: 2020,
          make: 'Test',
          model: 'Car',
          matched_car_slug: 'test-car',
          active_build_id: 'nonexistent-build-id',
          installed_modifications: [],
          total_hp_gain: 0,
        },
      ];

      calculateBuildProgress(vehiclesWithMissingBuild, mockProjects);
      
      console.warn = originalWarn;
      
      const relevantWarning = warnings.find(w => w.includes('nonexistent-build-id'));
      assert.ok(relevantWarning, 'Should have logged a warning about missing build');
      assert.ok(relevantWarning.includes('but project not found'), 'Warning should mention project not found');
    });
  });

  describe('calculatePerformanceSummary', () => {
    it('sums HP gain from active builds, not vehicles', () => {
      const vehicles = [
        {
          id: 'v1',
          matched_car_slug: 'car-a',
          active_build_id: 'build-a',
          total_hp_gain: 50, // Should be IGNORED
          installed_modifications: ['tune'],
          garage_score: 80,
        },
        {
          id: 'v2',
          matched_car_slug: 'car-b',
          active_build_id: 'build-b',
          total_hp_gain: 30, // Should be IGNORED
          installed_modifications: ['exhaust'],
          garage_score: 70,
        },
      ];

      const projects = [
        { id: 'build-a', car_slug: 'car-a', total_hp_gain: 100, total_cost_low: 1000, total_cost_high: 1500 },
        { id: 'build-b', car_slug: 'car-b', total_hp_gain: 80, total_cost_low: 500, total_cost_high: 800 },
      ];

      const summary = calculatePerformanceSummary(vehicles, projects);

      // Should use active builds' HP (100 + 80 = 180), not vehicles' (50 + 30 = 80)
      assert.strictEqual(summary.totalHpGain, 180);
    });

    it('does not count same project twice for different vehicles', () => {
      const vehicles = [
        { id: 'v1', matched_car_slug: 'car-a', active_build_id: 'build-a', total_hp_gain: 0, installed_modifications: [] },
        { id: 'v2', matched_car_slug: 'car-a', active_build_id: 'build-a', total_hp_gain: 0, installed_modifications: [] }, // Same build
      ];

      const projects = [
        { id: 'build-a', car_slug: 'car-a', total_hp_gain: 100 },
      ];

      const summary = calculatePerformanceSummary(vehicles, projects);

      // Should count the build only once (100), not twice (200)
      assert.strictEqual(summary.totalHpGain, 100);
    });

    it('calculates correct vehicle counts', () => {
      const vehicles = [
        { id: 'v1', installed_modifications: ['tune', 'exhaust'], matched_car_slug: 'car-a', active_build_id: null },
        { id: 'v2', installed_modifications: [], matched_car_slug: 'car-b', active_build_id: null },
        { id: 'v3', installed_modifications: ['intake'], matched_car_slug: 'car-c', active_build_id: null },
      ];

      const summary = calculatePerformanceSummary(vehicles, []);

      assert.strictEqual(summary.totalVehicles, 3);
      assert.strictEqual(summary.modifiedVehicles, 2); // v1 and v3 have mods
      assert.strictEqual(summary.totalMods, 3); // tune, exhaust, intake
    });
  });

  describe('generateVehicleHealth', () => {
    it('uses buildProgress HP gain instead of vehicle.total_hp_gain', () => {
      const vehicles = [
        {
          id: 'v1',
          year: 2020,
          make: 'Test',
          model: 'Car',
          installed_modifications: ['tune'],
          total_hp_gain: 50, // This should be IGNORED
          garage_score: 80,
        },
      ];

      const buildProgress = [
        {
          vehicleId: 'v1',
          currentHpGain: 100, // This should be USED
        },
      ];

      const health = generateVehicleHealth(vehicles, buildProgress);

      assert.strictEqual(health[0].hpGain, 100); // From buildProgress, not vehicle
      
      // Check indicator also uses correct value
      const powerIndicator = health[0].indicators.find(i => i.type === 'power');
      assert.strictEqual(powerIndicator.value, '+100 HP');
    });

    it('works without buildProgress (fallback)', () => {
      const vehicles = [
        {
          id: 'v1',
          year: 2020,
          make: 'Test',
          model: 'Car',
          installed_modifications: ['tune'],
          total_hp_gain: 50,
          garage_score: null,
        },
      ];

      const health = generateVehicleHealth(vehicles, []); // No buildProgress

      // Should fall back to 0 since no matching buildProgress entry
      assert.strictEqual(health[0].hpGain, 0);
    });
  });
});
