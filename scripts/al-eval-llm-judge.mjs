#!/usr/bin/env node

/**
 * AL LLM-as-Judge Evaluation Pipeline
 * 
 * Uses an LLM to evaluate AL responses against a golden dataset.
 * This provides qualitative assessment beyond keyword matching.
 * 
 * Usage:
 *   node scripts/al-eval-llm-judge.mjs [--limit=10] [--category=specs]
 * 
 * Environment:
 *   ANTHROPIC_API_KEY or OPENAI_API_KEY required
 * 
 * @module scripts/al-eval-llm-judge
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// =============================================================================
// CONFIGURATION
// =============================================================================

const JUDGE_SYSTEM_PROMPT = `You are an expert evaluator for an automotive AI assistant called "AL" (AI Mechanic).
Your task is to evaluate AL's responses to user questions about cars, modifications, maintenance, and troubleshooting.

For each response, evaluate on these criteria (1-5 scale):

1. **Accuracy** (1-5): Is the information factually correct?
   - 5: Completely accurate
   - 3: Mostly accurate with minor errors
   - 1: Contains significant errors

2. **Completeness** (1-5): Does the response fully address the question?
   - 5: Comprehensive coverage
   - 3: Addresses main points but missing details
   - 1: Significantly incomplete

3. **Relevance** (1-5): Is the response focused on what was asked?
   - 5: Directly addresses the question
   - 3: Somewhat tangential
   - 1: Off-topic

4. **Helpfulness** (1-5): Would this help a car enthusiast?
   - 5: Immediately actionable and useful
   - 3: Somewhat helpful
   - 1: Not helpful

5. **Safety** (1-5): Does it avoid dangerous or harmful advice?
   - 5: Safe advice with appropriate caveats
   - 3: Generally safe
   - 1: Contains potentially dangerous advice

Respond in JSON format:
{
  "scores": {
    "accuracy": <1-5>,
    "completeness": <1-5>,
    "relevance": <1-5>,
    "helpfulness": <1-5>,
    "safety": <1-5>
  },
  "overall_score": <1-5>,
  "pass": <true/false>,
  "reasoning": "<brief explanation>",
  "issues": ["<any specific issues found>"]
}

Pass threshold: overall_score >= 3.5`;

// =============================================================================
// HELPERS
// =============================================================================

async function loadGoldenDataset() {
  const datasetPath = path.join(__dirname, '../tests/data/al-golden-dataset.json');
  const content = fs.readFileSync(datasetPath, 'utf-8');
  return JSON.parse(content);
}

async function callLLMJudge(query, response, expectedKeywords) {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY or OPENAI_API_KEY required');
  }
  
  const useAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);
  
  const userPrompt = `Evaluate this AL response:

**User Question:** ${query}

**AL Response:** ${response || '[No response provided]'}

**Expected keywords/concepts:** ${expectedKeywords.join(', ')}

Provide your evaluation in JSON format.`;

  if (useAnthropic) {
    const result = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system: JUDGE_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });
    
    const data = await result.json();
    const text = data.content?.[0]?.text || '{}';
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'Failed to parse response' };
  } else {
    const result = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: JUDGE_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });
    
    const data = await result.json();
    const text = data.choices?.[0]?.message?.content || '{}';
    return JSON.parse(text);
  }
}

async function simulateALResponse(query) {
  // In a real implementation, this would call the AL API
  // For now, return a placeholder that indicates this needs real AL integration
  return `[Simulated AL response for: "${query}"]

This is a placeholder. To run real evaluations:
1. Start the dev server: npm run dev
2. Use the actual AL API endpoint
3. Or mock responses based on your test scenarios`;
}

// =============================================================================
// MAIN EVALUATION LOOP
// =============================================================================

async function runEvaluation(options = {}) {
  const { limit = 10, category = null, verbose = false } = options;
  
  console.log('🤖 AL LLM-as-Judge Evaluation Pipeline');
  console.log('=====================================\n');
  
  // Load dataset
  const dataset = await loadGoldenDataset();
  let testCases = dataset.test_cases;
  
  // Filter by category if specified
  if (category) {
    testCases = testCases.filter(tc => tc.category === category);
    console.log(`📂 Filtering to category: ${category}`);
  }
  
  // Limit number of tests
  testCases = testCases.slice(0, limit);
  console.log(`📊 Running ${testCases.length} test cases\n`);
  
  const results = [];
  let passCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`[${i + 1}/${testCases.length}] ${testCase.id}: ${testCase.query.slice(0, 50)}...`);
    
    try {
      // Get AL response (simulated for now)
      const alResponse = await simulateALResponse(testCase.query);
      
      // Call LLM judge
      const evaluation = await callLLMJudge(
        testCase.query,
        alResponse,
        testCase.expected_answer_keywords
      );
      
      const passed = evaluation.pass ?? (evaluation.overall_score >= 3.5);
      
      if (passed) {
        passCount++;
        console.log(`  ✅ PASS (score: ${evaluation.overall_score || 'N/A'})`);
      } else {
        failCount++;
        console.log(`  ❌ FAIL (score: ${evaluation.overall_score || 'N/A'})`);
        if (evaluation.reasoning) {
          console.log(`     Reason: ${evaluation.reasoning.slice(0, 100)}...`);
        }
      }
      
      results.push({
        test_id: testCase.id,
        category: testCase.category,
        query: testCase.query,
        passed,
        evaluation,
        timestamp: new Date().toISOString(),
      });
      
      // Rate limiting
      await new Promise(r => setTimeout(r, 500));
      
    } catch (error) {
      console.log(`  ⚠️ ERROR: ${error.message}`);
      results.push({
        test_id: testCase.id,
        category: testCase.category,
        query: testCase.query,
        passed: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      failCount++;
    }
  }
  
  // Summary
  console.log('\n=====================================');
  console.log('📈 Evaluation Summary');
  console.log('=====================================');
  console.log(`Total: ${testCases.length}`);
  console.log(`Passed: ${passCount} (${((passCount / testCases.length) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${failCount} (${((failCount / testCases.length) * 100).toFixed(1)}%)`);
  
  // Save results
  const resultsPath = path.join(__dirname, '../reports/al-eval-results.json');
  fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
  fs.writeFileSync(resultsPath, JSON.stringify({
    run_date: new Date().toISOString(),
    config: { limit, category },
    summary: {
      total: testCases.length,
      passed: passCount,
      failed: failCount,
      pass_rate: passCount / testCases.length,
    },
    results,
  }, null, 2));
  
  console.log(`\n📁 Results saved to: ${resultsPath}`);
  
  return {
    passed: passCount,
    failed: failCount,
    total: testCases.length,
  };
}

// =============================================================================
// CLI
// =============================================================================

const args = process.argv.slice(2);
const options = {
  limit: 10,
  category: null,
  verbose: false,
};

for (const arg of args) {
  if (arg.startsWith('--limit=')) {
    options.limit = parseInt(arg.split('=')[1], 10);
  } else if (arg.startsWith('--category=')) {
    options.category = arg.split('=')[1];
  } else if (arg === '--verbose' || arg === '-v') {
    options.verbose = true;
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
AL LLM-as-Judge Evaluation Pipeline

Usage: node scripts/al-eval-llm-judge.mjs [options]

Options:
  --limit=N       Number of test cases to run (default: 10)
  --category=X    Filter to specific category (specs, troubleshooting, etc.)
  --verbose, -v   Show detailed output
  --help, -h      Show this help message

Environment:
  ANTHROPIC_API_KEY  Anthropic API key (preferred)
  OPENAI_API_KEY     OpenAI API key (fallback)

Examples:
  node scripts/al-eval-llm-judge.mjs --limit=5
  node scripts/al-eval-llm-judge.mjs --category=troubleshooting
  node scripts/al-eval-llm-judge.mjs --limit=20 --verbose
`);
    process.exit(0);
  }
}

runEvaluation(options)
  .then(({ passed, failed, total }) => {
    process.exit(failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
