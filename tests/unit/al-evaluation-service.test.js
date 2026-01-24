/**
 * Unit Tests: AL Evaluation Service
 * 
 * Tests the LLM-as-judge evaluation pipeline.
 * 
 * Run: npm test -- tests/unit/al-evaluation-service.test.js
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  EVALUATION_DIMENSIONS,
  EVALUATION_THRESHOLDS,
  calculateWeightedScore,
  determinePassStatus,
  generateEvaluationReport,
  loadGoldenDataset,
} from '@/lib/alEvaluationService';

describe('AL Evaluation Service', () => {
  describe('EVALUATION_DIMENSIONS', () => {
    test('should have all required dimensions', () => {
      const expectedDimensions = [
        'technicalAccuracy',
        'relevance',
        'helpfulness',
        'safety',
        'citationQuality',
      ];
      
      for (const dim of expectedDimensions) {
        expect(EVALUATION_DIMENSIONS).toHaveProperty(dim);
      }
    });

    test('should have weights that sum to 1.0', () => {
      const totalWeight = Object.values(EVALUATION_DIMENSIONS)
        .reduce((sum, dim) => sum + dim.weight, 0);
      
      expect(totalWeight).toBeCloseTo(1.0, 2);
    });

    test('each dimension should have name, description, and rubric', () => {
      for (const [key, dim] of Object.entries(EVALUATION_DIMENSIONS)) {
        expect(dim).toHaveProperty('name');
        expect(dim).toHaveProperty('description');
        expect(dim).toHaveProperty('rubric');
        expect(dim.rubric).toHaveProperty('1');
        expect(dim.rubric).toHaveProperty('2');
        expect(dim.rubric).toHaveProperty('3');
        expect(dim.rubric).toHaveProperty('4');
        expect(dim.rubric).toHaveProperty('5');
      }
    });

    test('technicalAccuracy should have highest weight', () => {
      expect(EVALUATION_DIMENSIONS.technicalAccuracy.weight).toBe(0.30);
    });

    test('safety should be weighted appropriately', () => {
      expect(EVALUATION_DIMENSIONS.safety.weight).toBe(0.15);
    });
  });

  describe('EVALUATION_THRESHOLDS', () => {
    test('should have required threshold values', () => {
      expect(EVALUATION_THRESHOLDS.pass).toBeDefined();
      expect(EVALUATION_THRESHOLDS.warning).toBeDefined();
      expect(EVALUATION_THRESHOLDS.criticalFail).toBeDefined();
      expect(EVALUATION_THRESHOLDS.safetyMinimum).toBeDefined();
    });

    test('thresholds should be in correct order', () => {
      expect(EVALUATION_THRESHOLDS.pass).toBeGreaterThan(EVALUATION_THRESHOLDS.warning);
      expect(EVALUATION_THRESHOLDS.warning).toBeGreaterThan(EVALUATION_THRESHOLDS.criticalFail);
    });

    test('safety minimum should be high', () => {
      expect(EVALUATION_THRESHOLDS.safetyMinimum).toBeGreaterThanOrEqual(4.0);
    });
  });

  describe('calculateWeightedScore', () => {
    test('should calculate weighted score correctly', () => {
      const scores = {
        technicalAccuracy: 5,
        relevance: 5,
        helpfulness: 5,
        safety: 5,
        citationQuality: 5,
      };
      
      const weighted = calculateWeightedScore(scores);
      expect(weighted).toBe(5);
    });

    test('should handle perfect scores', () => {
      const scores = {
        technicalAccuracy: 5,
        relevance: 5,
        helpfulness: 5,
        safety: 5,
        citationQuality: 5,
      };
      
      const weighted = calculateWeightedScore(scores);
      expect(weighted).toBe(5);
    });

    test('should handle minimum scores', () => {
      const scores = {
        technicalAccuracy: 1,
        relevance: 1,
        helpfulness: 1,
        safety: 1,
        citationQuality: 1,
      };
      
      const weighted = calculateWeightedScore(scores);
      expect(weighted).toBe(1);
    });

    test('should handle mixed scores with correct weighting', () => {
      // technicalAccuracy: 0.30 weight
      // relevance: 0.25 weight  
      // helpfulness: 0.20 weight
      // safety: 0.15 weight
      // citationQuality: 0.10 weight
      const scores = {
        technicalAccuracy: 5, // 5 * 0.30 = 1.5
        relevance: 4,         // 4 * 0.25 = 1.0
        helpfulness: 3,       // 3 * 0.20 = 0.6
        safety: 5,            // 5 * 0.15 = 0.75
        citationQuality: 4,   // 4 * 0.10 = 0.4
      };                      // Total: 4.25
      
      const weighted = calculateWeightedScore(scores);
      expect(weighted).toBe(4.25);
    });

    test('should handle partial scores (missing dimensions)', () => {
      const scores = {
        technicalAccuracy: 4,
        relevance: 4,
      };
      
      const weighted = calculateWeightedScore(scores);
      // Only uses available weights
      expect(weighted).toBeGreaterThan(0);
    });

    test('should handle empty scores', () => {
      const weighted = calculateWeightedScore({});
      expect(weighted).toBe(0);
    });

    test('should round to 2 decimal places', () => {
      const scores = {
        technicalAccuracy: 3,
        relevance: 4,
        helpfulness: 3,
        safety: 5,
        citationQuality: 3,
      };
      
      const weighted = calculateWeightedScore(scores);
      // Check it's properly rounded
      expect(weighted.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    });
  });

  describe('determinePassStatus', () => {
    test('should pass when all scores are high', () => {
      const scores = {
        technicalAccuracy: 5,
        relevance: 5,
        helpfulness: 5,
        safety: 5,
        citationQuality: 5,
      };
      const weightedScore = 5;
      
      const result = determinePassStatus(scores, weightedScore);
      
      expect(result.passed).toBe(true);
      expect(result.status).toBe('passed');
    });

    test('should fail safety check even with high weighted score', () => {
      const scores = {
        technicalAccuracy: 5,
        relevance: 5,
        helpfulness: 5,
        safety: 2, // Below safety minimum
        citationQuality: 5,
      };
      const weightedScore = 4.5;
      
      const result = determinePassStatus(scores, weightedScore);
      
      expect(result.passed).toBe(false);
      expect(result.status).toBe('failed_safety');
      expect(result.reason).toContain('Safety score');
    });

    test('should be in warning zone for borderline scores', () => {
      const scores = {
        technicalAccuracy: 3,
        relevance: 3,
        helpfulness: 3,
        safety: 4, // Meets minimum
        citationQuality: 3,
      };
      const weightedScore = 3.15; // Between warning (3.0) and pass (3.5)
      
      const result = determinePassStatus(scores, weightedScore);
      
      expect(result.passed).toBe(false);
      expect(result.status).toBe('warning');
    });

    test('should fail for low weighted scores', () => {
      const scores = {
        technicalAccuracy: 2,
        relevance: 3,
        helpfulness: 2,
        safety: 4,
        citationQuality: 2,
      };
      const weightedScore = 2.5;
      
      const result = determinePassStatus(scores, weightedScore);
      
      expect(result.passed).toBe(false);
      expect(result.status).toBe('failed');
    });

    test('should critical fail for very low scores', () => {
      const scores = {
        technicalAccuracy: 1,
        relevance: 2,
        helpfulness: 1,
        safety: 4,
        citationQuality: 1,
      };
      const weightedScore = 1.5;
      
      const result = determinePassStatus(scores, weightedScore);
      
      expect(result.passed).toBe(false);
      expect(result.status).toBe('critical_fail');
    });

    test('should include reason in all cases', () => {
      const cases = [
        { scores: { safety: 5 }, weightedScore: 5 },
        { scores: { safety: 2 }, weightedScore: 4 },
        { scores: { safety: 5 }, weightedScore: 3.2 },
        { scores: { safety: 5 }, weightedScore: 2.5 },
        { scores: { safety: 5 }, weightedScore: 1.5 },
      ];
      
      for (const { scores, weightedScore } of cases) {
        const result = determinePassStatus(scores, weightedScore);
        expect(result.reason).toBeDefined();
        expect(result.reason.length).toBeGreaterThan(0);
      }
    });
  });

  describe('generateEvaluationReport', () => {
    const createMockEvaluationRun = (results) => ({
      runId: 'test-run-id',
      promptVersionId: 'test-prompt-v1',
      totalCases: results.length,
      results,
      duration: 1000,
      completedAt: new Date().toISOString(),
    });

    test('should generate report with summary statistics', () => {
      const results = [
        {
          testCaseId: 'test-1',
          category: 'specs',
          difficulty: 'easy',
          query: 'What is the HP?',
          response: '400 HP',
          evaluation: {
            scores: { technicalAccuracy: 5, relevance: 5, helpfulness: 5, safety: 5, citationQuality: 5 },
            weightedScore: 5,
            passed: true,
            status: 'passed',
            keywordMatch: true,
            toolMatch: true,
          },
        },
        {
          testCaseId: 'test-2',
          category: 'specs',
          difficulty: 'medium',
          query: 'What engine?',
          response: 'V8',
          evaluation: {
            scores: { technicalAccuracy: 3, relevance: 4, helpfulness: 3, safety: 5, citationQuality: 3 },
            weightedScore: 3.4,
            passed: false,
            status: 'warning',
            keywordMatch: false,
            toolMatch: true,
          },
        },
      ];
      
      const mockRun = createMockEvaluationRun(results);
      const report = generateEvaluationReport(mockRun);
      
      expect(report.runId).toBe('test-run-id');
      expect(report.summary.totalCases).toBe(2);
      expect(report.summary.evaluated).toBe(2);
      expect(report.summary.passed).toBe(1);
      expect(report.summary.failed).toBe(1);
      expect(report.summary.passRate).toBe(50);
    });

    test('should calculate dimension scores correctly', () => {
      const results = [
        {
          testCaseId: 'test-1',
          category: 'specs',
          difficulty: 'easy',
          query: 'Test 1',
          evaluation: {
            scores: { technicalAccuracy: 5, relevance: 4, helpfulness: 5, safety: 5, citationQuality: 4 },
            weightedScore: 4.7,
            passed: true,
            status: 'passed',
          },
        },
        {
          testCaseId: 'test-2',
          category: 'specs',
          difficulty: 'easy',
          query: 'Test 2',
          evaluation: {
            scores: { technicalAccuracy: 3, relevance: 4, helpfulness: 3, safety: 5, citationQuality: 4 },
            weightedScore: 3.7,
            passed: true,
            status: 'passed',
          },
        },
      ];
      
      const mockRun = createMockEvaluationRun(results);
      const report = generateEvaluationReport(mockRun);
      
      expect(report.dimensionScores.technicalAccuracy).toBe(4); // (5+3)/2
      expect(report.dimensionScores.relevance).toBe(4);
      expect(report.dimensionScores.safety).toBe(5);
    });

    test('should calculate category statistics', () => {
      const results = [
        {
          testCaseId: 'test-1',
          category: 'specs',
          difficulty: 'easy',
          query: 'Specs question',
          evaluation: { scores: {}, weightedScore: 4.5, passed: true, status: 'passed' },
        },
        {
          testCaseId: 'test-2',
          category: 'specs',
          difficulty: 'easy',
          query: 'Another specs',
          evaluation: { scores: {}, weightedScore: 3.0, passed: false, status: 'failed' },
        },
        {
          testCaseId: 'test-3',
          category: 'troubleshooting',
          difficulty: 'medium',
          query: 'Troubleshooting',
          evaluation: { scores: {}, weightedScore: 4.0, passed: true, status: 'passed' },
        },
      ];
      
      const mockRun = createMockEvaluationRun(results);
      const report = generateEvaluationReport(mockRun);
      
      expect(report.categoryStats.specs.total).toBe(2);
      expect(report.categoryStats.specs.passed).toBe(1);
      expect(report.categoryStats.specs.passRate).toBe(50);
      expect(report.categoryStats.troubleshooting.total).toBe(1);
      expect(report.categoryStats.troubleshooting.passed).toBe(1);
      expect(report.categoryStats.troubleshooting.passRate).toBe(100);
    });

    test('should calculate difficulty statistics', () => {
      const results = [
        {
          testCaseId: 'test-1',
          category: 'specs',
          difficulty: 'easy',
          query: 'Easy Q',
          evaluation: { scores: {}, weightedScore: 5, passed: true, status: 'passed' },
        },
        {
          testCaseId: 'test-2',
          category: 'specs',
          difficulty: 'hard',
          query: 'Hard Q',
          evaluation: { scores: {}, weightedScore: 2.5, passed: false, status: 'failed' },
        },
      ];
      
      const mockRun = createMockEvaluationRun(results);
      const report = generateEvaluationReport(mockRun);
      
      expect(report.difficultyStats.easy.total).toBe(1);
      expect(report.difficultyStats.easy.passRate).toBe(100);
      expect(report.difficultyStats.hard.total).toBe(1);
      expect(report.difficultyStats.hard.passRate).toBe(0);
    });

    test('should identify worst performing cases', () => {
      const results = [
        {
          testCaseId: 'test-best',
          category: 'specs',
          difficulty: 'easy',
          query: 'Best question',
          evaluation: { scores: {}, weightedScore: 5, passed: true, status: 'passed' },
        },
        {
          testCaseId: 'test-worst',
          category: 'specs',
          difficulty: 'hard',
          query: 'Worst question',
          evaluation: { scores: {}, weightedScore: 1.5, passed: false, status: 'critical_fail' },
        },
        {
          testCaseId: 'test-middle',
          category: 'specs',
          difficulty: 'medium',
          query: 'Middle question',
          evaluation: { scores: {}, weightedScore: 3, passed: false, status: 'warning' },
        },
      ];
      
      const mockRun = createMockEvaluationRun(results);
      const report = generateEvaluationReport(mockRun);
      
      expect(report.worstCases[0].id).toBe('test-worst');
      expect(report.worstCases[0].weightedScore).toBe(1.5);
    });

    test('should identify safety failures', () => {
      const results = [
        {
          testCaseId: 'test-safe',
          category: 'specs',
          difficulty: 'easy',
          query: 'Safe question',
          evaluation: {
            scores: { safety: 5 },
            reasoning: { safety: 'Good safety' },
            weightedScore: 4.5,
            passed: true,
            status: 'passed',
          },
        },
        {
          testCaseId: 'test-unsafe',
          category: 'safety',
          difficulty: 'hard',
          query: 'Unsafe question',
          evaluation: {
            scores: { safety: 2 },
            reasoning: { safety: 'Dangerous advice' },
            weightedScore: 3.5,
            passed: false,
            status: 'failed_safety',
          },
        },
      ];
      
      const mockRun = createMockEvaluationRun(results);
      const report = generateEvaluationReport(mockRun);
      
      expect(report.safetyFailures).toHaveLength(1);
      expect(report.safetyFailures[0].id).toBe('test-unsafe');
      expect(report.safetyFailures[0].safetyScore).toBe(2);
    });

    test('should generate recommendation based on pass rate', () => {
      // High pass rate
      const highPassResults = Array(10).fill(null).map((_, i) => ({
        testCaseId: `test-${i}`,
        category: 'specs',
        difficulty: 'easy',
        query: `Question ${i}`,
        evaluation: { scores: {}, weightedScore: 4.5, passed: true, status: 'passed' },
      }));
      
      const highPassRun = createMockEvaluationRun(highPassResults);
      const highPassReport = generateEvaluationReport(highPassRun);
      expect(highPassReport.recommendation).toBe('READY_FOR_PRODUCTION');
      
      // Low pass rate
      const lowPassResults = Array(10).fill(null).map((_, i) => ({
        testCaseId: `test-${i}`,
        category: 'specs',
        difficulty: 'easy',
        query: `Question ${i}`,
        evaluation: { scores: {}, weightedScore: 2.5, passed: false, status: 'failed' },
      }));
      
      const lowPassRun = createMockEvaluationRun(lowPassResults);
      const lowPassReport = generateEvaluationReport(lowPassRun);
      expect(lowPassReport.recommendation).toBe('NOT_READY');
    });

    test('should handle error results correctly', () => {
      const results = [
        {
          testCaseId: 'test-1',
          category: 'specs',
          difficulty: 'easy',
          query: 'Good question',
          evaluation: { scores: {}, weightedScore: 4.5, passed: true, status: 'passed' },
        },
        {
          testCaseId: 'test-error',
          category: 'specs',
          difficulty: 'easy',
          query: 'Error question',
          error: 'API timeout',
          evaluation: null,
        },
      ];
      
      const mockRun = createMockEvaluationRun(results);
      const report = generateEvaluationReport(mockRun);
      
      expect(report.summary.evaluated).toBe(1);
      expect(report.summary.errors).toBe(1);
    });

    test('should include thresholds in report', () => {
      const mockRun = createMockEvaluationRun([]);
      const report = generateEvaluationReport(mockRun);
      
      expect(report.thresholds).toEqual(EVALUATION_THRESHOLDS);
    });

    test('should calculate keyword and tool match rates', () => {
      const results = [
        {
          testCaseId: 'test-1',
          category: 'specs',
          difficulty: 'easy',
          query: 'Q1',
          evaluation: {
            scores: {},
            weightedScore: 4,
            passed: true,
            status: 'passed',
            keywordMatch: true,
            toolMatch: true,
          },
        },
        {
          testCaseId: 'test-2',
          category: 'specs',
          difficulty: 'easy',
          query: 'Q2',
          evaluation: {
            scores: {},
            weightedScore: 3.5,
            passed: true,
            status: 'passed',
            keywordMatch: false,
            toolMatch: true,
          },
        },
      ];
      
      const mockRun = createMockEvaluationRun(results);
      const report = generateEvaluationReport(mockRun);
      
      expect(report.summary.keywordMatchRate).toBe(50); // 1 of 2
      expect(report.summary.toolMatchRate).toBe(100); // 2 of 2
    });
  });

  describe('loadGoldenDataset', () => {
    test('should load the default golden dataset', async () => {
      const dataset = await loadGoldenDataset();
      
      expect(dataset).toHaveProperty('version');
      expect(dataset).toHaveProperty('test_cases');
      expect(Array.isArray(dataset.test_cases)).toBe(true);
      expect(dataset.test_cases.length).toBeGreaterThan(0);
    });

    test('golden dataset should have required fields per test case', async () => {
      const dataset = await loadGoldenDataset();
      
      for (const testCase of dataset.test_cases.slice(0, 5)) {
        expect(testCase).toHaveProperty('id');
        expect(testCase).toHaveProperty('category');
        expect(testCase).toHaveProperty('query');
        expect(testCase).toHaveProperty('expected_answer_keywords');
        expect(testCase).toHaveProperty('expected_tools');
        expect(testCase).toHaveProperty('difficulty');
      }
    });

    test('golden dataset should have valid categories', async () => {
      const dataset = await loadGoldenDataset();
      const validCategories = dataset.categories || [
        'specs',
        'troubleshooting',
        'compatibility',
        'maintenance',
        'builds',
        'general',
      ];
      
      for (const testCase of dataset.test_cases) {
        expect(validCategories).toContain(testCase.category);
      }
    });

    test('golden dataset should have valid difficulties', async () => {
      const dataset = await loadGoldenDataset();
      const validDifficulties = ['easy', 'medium', 'hard'];
      
      for (const testCase of dataset.test_cases) {
        expect(validDifficulties).toContain(testCase.difficulty);
      }
    });

    test('should throw error for non-existent file', async () => {
      await expect(
        loadGoldenDataset('/non/existent/path.json')
      ).rejects.toThrow();
    });
  });
});
