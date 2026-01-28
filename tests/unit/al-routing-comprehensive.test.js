/**
 * Comprehensive Routing Tests: AL Multi-Agent Orchestrator
 *
 * Tests 50+ diverse user queries to verify correct routing to specialist agents.
 * Covers all 8 intent types with edge cases and potential confusion points.
 *
 * Run: npm test -- tests/unit/al-routing-comprehensive.test.js
 */

import { describe, test, expect } from 'vitest';
import { INTENT_TYPES } from '@/lib/alAgents/index.js';
import { classifyIntent } from '@/lib/alAgents/orchestrator.js';

/**
 * Helper to test a batch of queries for expected intent
 */
async function testQueries(queries, expectedIntent) {
  const results = [];
  for (const query of queries) {
    const result = await classifyIntent({
      messages: [{ role: 'user', content: query }],
      context: {},
      skipLLM: true,
    });
    results.push({
      query,
      expected: expectedIntent,
      actual: result.intent,
      confidence: result.confidence,
      reasoning: result.reasoning,
      passed: result.intent === expectedIntent,
    });
  }
  return results;
}

describe('AL Routing - Comprehensive 50+ Query Test', () => {
  // =========================================================================
  // PARTS_RESEARCH - Finding, buying, comparing specific products
  // =========================================================================
  describe('PARTS_RESEARCH Routing (15 queries)', () => {
    const partsQueries = [
      // Direct product searches
      'Best cold air intake for my 2020 RS5',
      'Find me an exhaust for my Mustang GT',
      'Top 5 brake fluid options',
      'Stage 1 tune for Audi S4',
      'Stage 2 ECU flash recommendations',
      // Shopping intent
      'Where can I buy coilovers for my M3?',
      'Looking for a downpipe for my GTI',
      'Need new brake pads for track use',
      // Brand comparisons (products)
      'APR vs Unitronic tune comparison',
      'Akrapovic or Borla exhaust?',
      // Price queries for parts
      'How much does a Cobb Accessport cost?',
      'Budget turbo kit options under $3000',
      // Quick action prompts (explicit tool mention)
      'Find brake fluid for my car. USE THE research_parts_live TOOL.',
      // Specific part types
      'Best intercooler for my Focus RS',
      'Recommend clutch and flywheel combo',
    ];

    test.each(partsQueries)('"%s" → PARTS_RESEARCH', async (query) => {
      const result = await classifyIntent({
        messages: [{ role: 'user', content: query }],
        context: {},
        skipLLM: true,
      });
      expect(result.intent).toBe(INTENT_TYPES.PARTS_RESEARCH);
    });
  });

  // =========================================================================
  // BUILD_PLANNING - Strategy, mod order, compatibility (not specific products)
  // =========================================================================
  describe('BUILD_PLANNING Routing (8 queries)', () => {
    const buildQueries = [
      // Build review/strategy
      'Review my build for compatibility',
      'What mods should I do first?',
      'What stage am I at with my current mods?',
      'What stage should I do next?',
      // Compatibility/planning
      'Are these mods compatible together?',
      'What order should I install my mods?',
      'Is my car ready for a bigger turbo?',
      'What supporting mods do I need for Stage 2?',
    ];

    test.each(buildQueries)('"%s" → BUILD_PLANNING', async (query) => {
      const result = await classifyIntent({
        messages: [{ role: 'user', content: query }],
        context: {},
        skipLLM: true,
      });
      expect(result.intent).toBe(INTENT_TYPES.BUILD_PLANNING);
    });
  });

  // =========================================================================
  // CAR_DISCOVERY - Questions about cars, specs, reliability, comparisons
  // =========================================================================
  describe('CAR_DISCOVERY Routing (10 queries)', () => {
    const carQueries = [
      // Car comparisons
      'Compare 911 vs Cayman for daily driving',
      'M3 vs C63 which is better?',
      'Mustang GT versus Camaro SS',
      // Reliability/issues
      'Is the BMW M3 reliable?',
      'What are the common issues with the 997?',
      'Known problems with the B58 engine?',
      // Car info/specs
      'Tell me about the 2024 GT3 RS',
      'What oil does my RS5 need?',
      'Service intervals for Porsche 911',
      // Buying advice
      'Should I buy a used 981 Cayman S?',
    ];

    test.each(carQueries)('"%s" → CAR_DISCOVERY', async (query) => {
      const result = await classifyIntent({
        messages: [{ role: 'user', content: query }],
        context: {},
        skipLLM: true,
      });
      expect(result.intent).toBe(INTENT_TYPES.CAR_DISCOVERY);
    });
  });

  // =========================================================================
  // KNOWLEDGE - Educational, conceptual, how things work
  // =========================================================================
  describe('KNOWLEDGE Routing (8 queries)', () => {
    const knowledgeQueries = [
      // How does X work
      'How does a turbo work?',
      'How does forced induction work?',
      // What is X
      'What is boost creep?',
      'What is an LSD?',
      'What is forced induction?',
      // Explain/teach
      'Explain the difference between turbo and supercharger',
      'Teach me about compression ratios',
      // Technical concepts
      'Why does boost taper at high RPM?',
    ];

    test.each(knowledgeQueries)('"%s" → KNOWLEDGE', async (query) => {
      const result = await classifyIntent({
        messages: [{ role: 'user', content: query }],
        context: {},
        skipLLM: true,
      });
      expect(result.intent).toBe(INTENT_TYPES.KNOWLEDGE);
    });
  });

  // =========================================================================
  // COMMUNITY_EVENTS - Events, meetups, community insights
  // =========================================================================
  describe('COMMUNITY_EVENTS Routing (6 queries)', () => {
    const eventQueries = [
      // Event searches
      'Find track days near Austin',
      'Cars and coffee events this weekend',
      'HPDE events in California',
      'Autocross near me',
      // Community insights
      'What do owners say about the IMS bearing?',
      'Car meets in Los Angeles',
    ];

    test.each(eventQueries)('"%s" → COMMUNITY_EVENTS', async (query) => {
      const result = await classifyIntent({
        messages: [{ role: 'user', content: query }],
        context: {},
        skipLLM: true,
      });
      expect(result.intent).toBe(INTENT_TYPES.COMMUNITY_EVENTS);
    });
  });

  // =========================================================================
  // PERFORMANCE_DATA - HP calculations, dyno, lap times, 0-60
  // =========================================================================
  describe('PERFORMANCE_DATA Routing (7 queries)', () => {
    const perfQueries = [
      // HP calculations
      'How much HP will a tune add?',
      'What power gains can I expect from intake + exhaust?',
      'How much horsepower does a Stage 2 tune add?',
      // Acceleration data
      'What is the 0-60 time for the GT3?',
      'Quarter mile time for stock Mustang GT?',
      // Dyno
      'Show me dyno runs for the B58',
      // Lap times
      'Nurburgring lap times for 911 GT3',
    ];

    test.each(perfQueries)('"%s" → PERFORMANCE_DATA', async (query) => {
      const result = await classifyIntent({
        messages: [{ role: 'user', content: query }],
        context: {},
        skipLLM: true,
      });
      expect(result.intent).toBe(INTENT_TYPES.PERFORMANCE_DATA);
    });
  });

  // =========================================================================
  // GENERALIST - Platform questions, chitchat, follow-ups, jokes
  // =========================================================================
  describe('GENERALIST Routing (8 queries)', () => {
    const generalistQueries = [
      // Short follow-ups
      'yes',
      'ok',
      'thanks',
      // Greetings
      'hi',
      'hello there',
      // Platform questions
      'How do I earn points on AutoRev?',
      'What is my garage score?',
      // Jokes
      'Tell me a car joke',
    ];

    test.each(generalistQueries)('"%s" → GENERALIST', async (query) => {
      const result = await classifyIntent({
        messages: [{ role: 'user', content: query }],
        context: {},
        skipLLM: true,
      });
      expect(result.intent).toBe(INTENT_TYPES.GENERALIST);
    });
  });

  // =========================================================================
  // EDGE CASES - Queries that could be confused between categories
  // =========================================================================
  describe('EDGE CASES - Ambiguous Routing (12 queries)', () => {
    // "Stage 1 tune" = product search, NOT build planning
    test('"Stage 1 tune for my RS5" → PARTS_RESEARCH (not BUILD_PLANNING)', async () => {
      const result = await classifyIntent({
        messages: [{ role: 'user', content: 'Stage 1 tune for my RS5' }],
        context: {},
        skipLLM: true,
      });
      expect(result.intent).toBe(INTENT_TYPES.PARTS_RESEARCH);
    });

    // "What stage should I do" = strategy, NOT product search
    test('"What stage should I do next?" → BUILD_PLANNING (not PARTS_RESEARCH)', async () => {
      const result = await classifyIntent({
        messages: [{ role: 'user', content: 'What stage should I do next?' }],
        context: {},
        skipLLM: true,
      });
      expect(result.intent).toBe(INTENT_TYPES.BUILD_PLANNING);
    });

    // "How much HP will a tune add" = calculation, NOT parts search
    test('"How much HP will a tune add?" → PERFORMANCE_DATA (not PARTS_RESEARCH)', async () => {
      const result = await classifyIntent({
        messages: [{ role: 'user', content: 'How much HP will a tune add?' }],
        context: {},
        skipLLM: true,
      });
      expect(result.intent).toBe(INTENT_TYPES.PERFORMANCE_DATA);
    });

    // "What is the best exhaust" = parts, NOT knowledge
    test('"What is the best exhaust for my car?" → PARTS_RESEARCH (not KNOWLEDGE)', async () => {
      const result = await classifyIntent({
        messages: [{ role: 'user', content: 'What is the best exhaust for my car?' }],
        context: {},
        skipLLM: true,
      });
      expect(result.intent).toBe(INTENT_TYPES.PARTS_RESEARCH);
    });

    // "What is a turbo" = knowledge, NOT parts
    test('"What is a turbo?" → KNOWLEDGE (not PARTS_RESEARCH)', async () => {
      const result = await classifyIntent({
        messages: [{ role: 'user', content: 'What is a turbo?' }],
        context: {},
        skipLLM: true,
      });
      expect(result.intent).toBe(INTENT_TYPES.KNOWLEDGE);
    });

    // "Compare APR vs Unitronic" = products, NOT car discovery
    test('"APR vs Unitronic tune" → PARTS_RESEARCH (not CAR_DISCOVERY)', async () => {
      const result = await classifyIntent({
        messages: [{ role: 'user', content: 'APR vs Unitronic tune' }],
        context: {},
        skipLLM: true,
      });
      expect(result.intent).toBe(INTENT_TYPES.PARTS_RESEARCH);
    });

    // "Compare 911 vs Cayman" = cars, NOT knowledge
    test('"911 vs Cayman" → CAR_DISCOVERY (not KNOWLEDGE)', async () => {
      const result = await classifyIntent({
        messages: [{ role: 'user', content: '911 vs Cayman for daily driving' }],
        context: {},
        skipLLM: true,
      });
      expect(result.intent).toBe(INTENT_TYPES.CAR_DISCOVERY);
    });

    // "Track days" with "near" = events, NOT performance
    test('"Track days near Austin" → COMMUNITY_EVENTS (not PERFORMANCE_DATA)', async () => {
      const result = await classifyIntent({
        messages: [{ role: 'user', content: 'Track days near Austin' }],
        context: {},
        skipLLM: true,
      });
      expect(result.intent).toBe(INTENT_TYPES.COMMUNITY_EVENTS);
    });

    // "Lap time" for a car = performance data
    test('"What is the Nurburgring lap time?" → PERFORMANCE_DATA', async () => {
      const result = await classifyIntent({
        messages: [{ role: 'user', content: 'What is the Nurburgring lap time for the GT3?' }],
        context: {},
        skipLLM: true,
      });
      expect(result.intent).toBe(INTENT_TYPES.PERFORMANCE_DATA);
    });

    // "Best car under 60k" = car discovery, NOT parts
    test('"Best sports car under $60k" → CAR_DISCOVERY (not PARTS_RESEARCH)', async () => {
      const result = await classifyIntent({
        messages: [{ role: 'user', content: 'Best sports car under $60k?' }],
        context: {},
        skipLLM: true,
      });
      expect(result.intent).toBe(INTENT_TYPES.CAR_DISCOVERY);
    });

    // "Coilovers for track" = parts, not events
    test('"Coilovers for track use" → PARTS_RESEARCH (not COMMUNITY_EVENTS)', async () => {
      const result = await classifyIntent({
        messages: [{ role: 'user', content: 'Best coilovers for track use' }],
        context: {},
        skipLLM: true,
      });
      expect(result.intent).toBe(INTENT_TYPES.PARTS_RESEARCH);
    });

    // "What mods" = build planning, not parts
    test('"What mods should I do for more power?" → BUILD_PLANNING', async () => {
      const result = await classifyIntent({
        messages: [{ role: 'user', content: 'What mods should I do for more power?' }],
        context: {},
        skipLLM: true,
      });
      expect(result.intent).toBe(INTENT_TYPES.BUILD_PLANNING);
    });
  });

  // =========================================================================
  // SUMMARY TEST - Run all 50+ queries and report pass rate
  // =========================================================================
  describe('SUMMARY: All 50+ Queries', () => {
    test('should have 95%+ routing accuracy across all query types', async () => {
      const allTestCases = [
        // PARTS_RESEARCH (15)
        { query: 'Best cold air intake for my 2020 RS5', expected: INTENT_TYPES.PARTS_RESEARCH },
        { query: 'Find me an exhaust for my Mustang GT', expected: INTENT_TYPES.PARTS_RESEARCH },
        { query: 'Top 5 brake fluid options', expected: INTENT_TYPES.PARTS_RESEARCH },
        { query: 'Stage 1 tune for Audi S4', expected: INTENT_TYPES.PARTS_RESEARCH },
        { query: 'Stage 2 ECU flash recommendations', expected: INTENT_TYPES.PARTS_RESEARCH },
        { query: 'Where can I buy coilovers for my M3?', expected: INTENT_TYPES.PARTS_RESEARCH },
        { query: 'Looking for a downpipe for my GTI', expected: INTENT_TYPES.PARTS_RESEARCH },
        { query: 'Need new brake pads for track use', expected: INTENT_TYPES.PARTS_RESEARCH },
        { query: 'APR vs Unitronic tune comparison', expected: INTENT_TYPES.PARTS_RESEARCH },
        { query: 'Akrapovic or Borla exhaust?', expected: INTENT_TYPES.PARTS_RESEARCH },
        { query: 'How much does a Cobb Accessport cost?', expected: INTENT_TYPES.PARTS_RESEARCH },
        { query: 'Budget turbo kit options under $3000', expected: INTENT_TYPES.PARTS_RESEARCH },
        { query: 'Find brake fluid for my car. USE THE research_parts_live TOOL.', expected: INTENT_TYPES.PARTS_RESEARCH },
        { query: 'Best intercooler for my Focus RS', expected: INTENT_TYPES.PARTS_RESEARCH },
        { query: 'Recommend clutch and flywheel combo', expected: INTENT_TYPES.PARTS_RESEARCH },

        // BUILD_PLANNING (8)
        { query: 'Review my build for compatibility', expected: INTENT_TYPES.BUILD_PLANNING },
        { query: 'What mods should I do first?', expected: INTENT_TYPES.BUILD_PLANNING },
        { query: 'What stage am I at with my current mods?', expected: INTENT_TYPES.BUILD_PLANNING },
        { query: 'What stage should I do next?', expected: INTENT_TYPES.BUILD_PLANNING },
        { query: 'Are these mods compatible together?', expected: INTENT_TYPES.BUILD_PLANNING },
        { query: 'What order should I install my mods?', expected: INTENT_TYPES.BUILD_PLANNING },
        { query: 'Is my car ready for a bigger turbo?', expected: INTENT_TYPES.BUILD_PLANNING },
        { query: 'What supporting mods do I need for Stage 2?', expected: INTENT_TYPES.BUILD_PLANNING },

        // CAR_DISCOVERY (10)
        { query: 'Compare 911 vs Cayman for daily driving', expected: INTENT_TYPES.CAR_DISCOVERY },
        { query: 'M3 vs C63 which is better?', expected: INTENT_TYPES.CAR_DISCOVERY },
        { query: 'Mustang GT versus Camaro SS', expected: INTENT_TYPES.CAR_DISCOVERY },
        { query: 'Is the BMW M3 reliable?', expected: INTENT_TYPES.CAR_DISCOVERY },
        { query: 'What are the common issues with the 997?', expected: INTENT_TYPES.CAR_DISCOVERY },
        { query: 'Known problems with the B58 engine?', expected: INTENT_TYPES.CAR_DISCOVERY },
        { query: 'Tell me about the 2024 GT3 RS', expected: INTENT_TYPES.CAR_DISCOVERY },
        { query: 'What oil does my RS5 need?', expected: INTENT_TYPES.CAR_DISCOVERY },
        { query: 'Service intervals for Porsche 911', expected: INTENT_TYPES.CAR_DISCOVERY },
        { query: 'Should I buy a used 981 Cayman S?', expected: INTENT_TYPES.CAR_DISCOVERY },

        // KNOWLEDGE (8)
        { query: 'How does a turbo work?', expected: INTENT_TYPES.KNOWLEDGE },
        { query: 'How does forced induction work?', expected: INTENT_TYPES.KNOWLEDGE },
        { query: 'What is boost creep?', expected: INTENT_TYPES.KNOWLEDGE },
        { query: 'What is an LSD?', expected: INTENT_TYPES.KNOWLEDGE },
        { query: 'What is forced induction?', expected: INTENT_TYPES.KNOWLEDGE },
        { query: 'Explain the difference between turbo and supercharger', expected: INTENT_TYPES.KNOWLEDGE },
        { query: 'Teach me about compression ratios', expected: INTENT_TYPES.KNOWLEDGE },
        { query: 'Why does boost taper at high RPM?', expected: INTENT_TYPES.KNOWLEDGE },

        // COMMUNITY_EVENTS (6)
        { query: 'Find track days near Austin', expected: INTENT_TYPES.COMMUNITY_EVENTS },
        { query: 'Cars and coffee events this weekend', expected: INTENT_TYPES.COMMUNITY_EVENTS },
        { query: 'HPDE events in California', expected: INTENT_TYPES.COMMUNITY_EVENTS },
        { query: 'Autocross near me', expected: INTENT_TYPES.COMMUNITY_EVENTS },
        { query: 'What do owners say about the IMS bearing?', expected: INTENT_TYPES.COMMUNITY_EVENTS },
        { query: 'Car meets in Los Angeles', expected: INTENT_TYPES.COMMUNITY_EVENTS },

        // PERFORMANCE_DATA (7)
        { query: 'How much HP will a tune add?', expected: INTENT_TYPES.PERFORMANCE_DATA },
        { query: 'What power gains can I expect from intake + exhaust?', expected: INTENT_TYPES.PERFORMANCE_DATA },
        { query: 'How much horsepower does a Stage 2 tune add?', expected: INTENT_TYPES.PERFORMANCE_DATA },
        { query: 'What is the 0-60 time for the GT3?', expected: INTENT_TYPES.PERFORMANCE_DATA },
        { query: 'Quarter mile time for stock Mustang GT?', expected: INTENT_TYPES.PERFORMANCE_DATA },
        { query: 'Show me dyno runs for the B58', expected: INTENT_TYPES.PERFORMANCE_DATA },
        { query: 'Nurburgring lap times for 911 GT3', expected: INTENT_TYPES.PERFORMANCE_DATA },

        // GENERALIST (8)
        { query: 'yes', expected: INTENT_TYPES.GENERALIST },
        { query: 'ok', expected: INTENT_TYPES.GENERALIST },
        { query: 'thanks', expected: INTENT_TYPES.GENERALIST },
        { query: 'hi', expected: INTENT_TYPES.GENERALIST },
        { query: 'hello there', expected: INTENT_TYPES.GENERALIST },
        { query: 'How do I earn points on AutoRev?', expected: INTENT_TYPES.GENERALIST },
        { query: 'What is my garage score?', expected: INTENT_TYPES.GENERALIST },
        { query: 'Tell me a car joke', expected: INTENT_TYPES.GENERALIST },
      ];

      const results = [];
      let passed = 0;
      let failed = 0;

      for (const testCase of allTestCases) {
        const result = await classifyIntent({
          messages: [{ role: 'user', content: testCase.query }],
          context: {},
          skipLLM: true,
        });

        const isPassed = result.intent === testCase.expected;
        if (isPassed) {
          passed++;
        } else {
          failed++;
          results.push({
            query: testCase.query,
            expected: testCase.expected,
            actual: result.intent,
            reasoning: result.reasoning,
          });
        }
      }

      const totalQueries = allTestCases.length;
      const passRate = (passed / totalQueries) * 100;

      console.log(`\n📊 ROUTING ACCURACY: ${passed}/${totalQueries} (${passRate.toFixed(1)}%)`);
      
      if (failed > 0) {
        console.log(`\n❌ FAILED QUERIES (${failed}):`);
        results.forEach((r) => {
          console.log(`   "${r.query}"`);
          console.log(`      Expected: ${r.expected}, Got: ${r.actual}`);
          console.log(`      Reasoning: ${r.reasoning}`);
        });
      }

      // Assert 95%+ accuracy
      expect(passRate).toBeGreaterThanOrEqual(95);
      expect(passed).toBe(totalQueries); // Ideally 100%
    });
  });
});
