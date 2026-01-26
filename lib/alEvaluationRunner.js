/**
 * AL Evaluation Runner
 * 
 * Executes evaluation test cases against AL and scores responses.
 * 
 * Flow:
 * 1. Create an evaluation run record
 * 2. For each test case:
 *    - Call AL API with the test prompt
 *    - Score response using LLM-as-judge
 *    - Check expected/forbidden elements
 *    - Record results
 * 3. Update run summary with pass/fail counts
 * 
 * Usage:
 *   const runner = new ALEvaluationRunner();
 *   const results = await runner.runEvaluations({ cases: getRandomEvalCases(10) });
 */

import { createClient } from '@supabase/supabase-js';

import { ANTHROPIC_PRICING, calculateTokenCost } from './alConfig';
import { EVAL_CASES, getAllEvalCases, getRandomEvalCases, LLM_JUDGE_PROMPT } from './alEvaluations';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Internal evaluation key for bypassing rate limits
const INTERNAL_EVAL_KEY = process.env.INTERNAL_EVAL_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';

// Base URL for API calls
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Call AL API with a test prompt
 */
async function callAL(prompt, carContext = null, options = {}) {
  const startTime = Date.now();
  
  const requestBody = {
    message: prompt,
    context: carContext ? { car: { slug: carContext } } : {},
    evalMode: true, // Flag for internal use
  };
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  // Add internal eval key if available
  if (INTERNAL_EVAL_KEY) {
    headers['X-Eval-Key'] = INTERNAL_EVAL_KEY;
  }
  
  try {
    const response = await fetch(`${BASE_URL}/api/ai-mechanic`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });
    
    const latencyMs = Date.now() - startTime;
    
    // Handle streaming response
    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let fullText = '';
      const toolsCalled = [];
      let inputTokens = 0;
      let outputTokens = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'text') {
                fullText += data.text;
              } else if (data.type === 'tool_use') {
                toolsCalled.push(data.name);
              } else if (data.type === 'done' && data.usage) {
                inputTokens = data.usage.inputTokens || 0;
                outputTokens = data.usage.outputTokens || 0;
              }
            } catch (e) {
              // Ignore parse errors for incomplete JSON
            }
          }
        }
      }
      
      return {
        success: true,
        response: fullText,
        toolsCalled,
        latencyMs,
        inputTokens,
        outputTokens,
        costCents: calculateTokenCost(inputTokens, outputTokens),
      };
    }
    
    // Handle non-streaming response
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Unknown error',
        latencyMs,
      };
    }
    
    return {
      success: true,
      response: data.response || data.message || '',
      toolsCalled: data.toolsCalled || [],
      latencyMs,
      inputTokens: data.usage?.inputTokens || 0,
      outputTokens: data.usage?.outputTokens || 0,
      costCents: calculateTokenCost(data.usage?.inputTokens || 0, data.usage?.outputTokens || 0),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      latencyMs: Date.now() - startTime,
    };
  }
}

/**
 * Use LLM-as-judge to score a response
 */
async function judgeResponse(testCase, response) {
  const prompt = LLM_JUDGE_PROMPT
    .replace('{question}', testCase.prompt)
    .replace('{car_context}', testCase.carContext || 'None specified')
    .replace('{response}', response)
    .replace('{expected_elements}', JSON.stringify(testCase.expectedElements))
    .replace('{forbidden_elements}', JSON.stringify(testCase.forbiddenElements));
  
  try {
    const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022', // Use faster model for judging
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });
    
    if (!apiResponse.ok) {
      console.error('[EvalRunner] Judge API error:', await apiResponse.text());
      return {
        score: 5,
        reasoning: 'Could not get LLM judge response',
        issues: ['judge_api_error'],
        passed: false,
      };
    }
    
    const data = await apiResponse.json();
    const content = data.content[0]?.text || '';
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('[EvalRunner] Could not parse judge response:', e);
      }
    }
    
    // Fallback: extract score manually
    const scoreMatch = content.match(/score["\s:]+(\d+)/i);
    return {
      score: scoreMatch ? parseInt(scoreMatch[1], 10) : 5,
      reasoning: content.slice(0, 500),
      issues: [],
      passed: false,
    };
  } catch (error) {
    console.error('[EvalRunner] Judge error:', error);
    return {
      score: 5,
      reasoning: `Judge error: ${error.message}`,
      issues: ['judge_error'],
      passed: false,
    };
  }
}

/**
 * Check if expected elements are present in response
 */
function checkExpectedElements(response, expectedElements) {
  const responseLower = response.toLowerCase();
  const found = {};
  
  for (const element of expectedElements) {
    const elementLower = element.toLowerCase();
    // Check for element or close variants
    found[element] = responseLower.includes(elementLower);
  }
  
  return found;
}

/**
 * Check if forbidden elements are present in response
 */
function checkForbiddenElements(response, forbiddenElements) {
  const responseLower = response.toLowerCase();
  const found = {};
  
  for (const element of forbiddenElements) {
    const elementLower = element.toLowerCase();
    found[element] = responseLower.includes(elementLower);
  }
  
  return found;
}

/**
 * Determine if a test case passed
 */
function determinePassFail(testCase, alResponse, judgeResult, expectedFound, forbiddenFound) {
  const failureReasons = [];
  
  // Check for API error
  if (!alResponse.success) {
    failureReasons.push(`API error: ${alResponse.error}`);
    return { passed: false, failureReasons };
  }
  
  // Check forbidden elements
  const forbiddenViolations = Object.entries(forbiddenFound)
    .filter(([, found]) => found)
    .map(([element]) => element);
  
  if (forbiddenViolations.length > 0) {
    failureReasons.push(`Forbidden elements found: ${forbiddenViolations.join(', ')}`);
  }
  
  // Check expected elements (at least 60% should be present)
  const expectedCount = testCase.expectedElements.length;
  const foundCount = Object.values(expectedFound).filter(Boolean).length;
  const expectedRate = expectedCount > 0 ? foundCount / expectedCount : 1;
  
  if (expectedRate < 0.6) {
    failureReasons.push(`Only ${foundCount}/${expectedCount} (${Math.round(expectedRate * 100)}%) expected elements found`);
  }
  
  // Check LLM judge score
  if (judgeResult.score < 7) {
    failureReasons.push(`Judge score ${judgeResult.score}/10 below threshold`);
  }
  
  // Add judge issues
  if (judgeResult.issues && judgeResult.issues.length > 0) {
    failureReasons.push(`Judge issues: ${judgeResult.issues.join(', ')}`);
  }
  
  return {
    passed: failureReasons.length === 0,
    failureReasons,
  };
}

/**
 * Main Evaluation Runner Class
 */
export class ALEvaluationRunner {
  constructor(options = {}) {
    this.options = {
      maxConcurrent: options.maxConcurrent || 1, // Sequential by default for rate limiting
      retryCount: options.retryCount || 1,
      promptVersionId: options.promptVersionId || null,
      triggeredBy: options.triggeredBy || 'manual',
      createdBy: options.createdBy || null,
      name: options.name || null,
    };
  }
  
  /**
   * Create an evaluation run record
   */
  async createRun(totalCases) {
    const { data, error } = await supabase
      .from('al_evaluation_runs')
      .insert({
        name: this.options.name || `Evaluation Run ${new Date().toISOString()}`,
        prompt_version_id: this.options.promptVersionId,
        total_cases: totalCases,
        status: 'running',
        triggered_by: this.options.triggeredBy,
        started_at: new Date().toISOString(),
        created_by: this.options.createdBy,
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('[EvalRunner] Failed to create run:', error);
      throw new Error(`Failed to create evaluation run: ${error.message}`);
    }
    
    return data.id;
  }
  
  /**
   * Update run with final stats
   */
  async finalizeRun(runId, stats) {
    const { error } = await supabase
      .from('al_evaluation_runs')
      .update({
        passed_cases: stats.passed,
        failed_cases: stats.failed,
        skipped_cases: stats.skipped,
        avg_score: stats.avgScore,
        avg_latency_ms: stats.avgLatencyMs,
        total_tokens: stats.totalTokens,
        total_cost_cents: stats.totalCostCents,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);
    
    if (error) {
      console.error('[EvalRunner] Failed to finalize run:', error);
    }
  }
  
  /**
   * Record a single test result
   */
  async recordResult(runId, testCase, result) {
    const { error } = await supabase
      .from('al_evaluation_results')
      .insert({
        run_id: runId,
        test_case_id: testCase.id,
        test_category: testCase.category,
        prompt_sent: testCase.prompt,
        car_context_slug: testCase.carContext,
        response_received: result.response,
        tools_called: result.toolsCalled,
        expected_elements: testCase.expectedElements,
        expected_elements_found: result.expectedFound,
        forbidden_elements: testCase.forbiddenElements,
        forbidden_elements_found: result.forbiddenFound,
        llm_judge_score: result.judgeResult?.score,
        llm_judge_reasoning: result.judgeResult?.reasoning,
        latency_ms: result.latencyMs,
        input_tokens: result.inputTokens,
        output_tokens: result.outputTokens,
        cost_cents: result.costCents,
        passed: result.passed,
        failure_reasons: result.failureReasons,
      });
    
    if (error) {
      console.error('[EvalRunner] Failed to record result:', error);
    }
  }
  
  /**
   * Run a single test case
   */
  async runTestCase(testCase) {
    console.log(`[EvalRunner] Running: ${testCase.id}`);
    
    // Call AL
    const alResponse = await callAL(testCase.prompt, testCase.carContext);
    
    if (!alResponse.success) {
      return {
        ...alResponse,
        passed: false,
        failureReasons: [`API error: ${alResponse.error}`],
        expectedFound: {},
        forbiddenFound: {},
        judgeResult: null,
      };
    }
    
    // Check elements
    const expectedFound = checkExpectedElements(alResponse.response, testCase.expectedElements);
    const forbiddenFound = checkForbiddenElements(alResponse.response, testCase.forbiddenElements);
    
    // LLM judge scoring
    const judgeResult = await judgeResponse(testCase, alResponse.response);
    
    // Determine pass/fail
    const { passed, failureReasons } = determinePassFail(
      testCase,
      alResponse,
      judgeResult,
      expectedFound,
      forbiddenFound
    );
    
    return {
      ...alResponse,
      expectedFound,
      forbiddenFound,
      judgeResult,
      passed,
      failureReasons,
    };
  }
  
  /**
   * Run all evaluations
   */
  async runEvaluations(options = {}) {
    const cases = options.cases || getAllEvalCases();
    const onProgress = options.onProgress || (() => {});
    
    console.log(`[EvalRunner] Starting evaluation of ${cases.length} test cases`);
    
    // Create run
    const runId = await this.createRun(cases.length);
    console.log(`[EvalRunner] Created run: ${runId}`);
    
    // Stats tracking
    const stats = {
      passed: 0,
      failed: 0,
      skipped: 0,
      totalScore: 0,
      totalLatency: 0,
      totalTokens: 0,
      totalCostCents: 0,
    };
    
    const results = [];
    
    // Run each test case sequentially (to avoid rate limits)
    for (let i = 0; i < cases.length; i++) {
      const testCase = cases[i];
      
      try {
        const result = await this.runTestCase(testCase);
        results.push({ testCase, result });
        
        // Update stats
        if (result.passed) {
          stats.passed++;
        } else {
          stats.failed++;
        }
        
        stats.totalScore += result.judgeResult?.score || 0;
        stats.totalLatency += result.latencyMs || 0;
        stats.totalTokens += (result.inputTokens || 0) + (result.outputTokens || 0);
        stats.totalCostCents += result.costCents || 0;
        
        // Record result
        await this.recordResult(runId, testCase, result);
        
        // Progress callback
        onProgress({
          current: i + 1,
          total: cases.length,
          testCase,
          result,
          stats,
        });
        
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`[EvalRunner] Error running ${testCase.id}:`, error);
        stats.skipped++;
        
        await this.recordResult(runId, testCase, {
          success: false,
          passed: false,
          failureReasons: [`Execution error: ${error.message}`],
          response: '',
          toolsCalled: [],
          expectedFound: {},
          forbiddenFound: {},
          judgeResult: null,
        });
      }
    }
    
    // Calculate averages
    const caseCount = stats.passed + stats.failed;
    stats.avgScore = caseCount > 0 ? Math.round((stats.totalScore / caseCount) * 100) / 100 : 0;
    stats.avgLatencyMs = caseCount > 0 ? Math.round(stats.totalLatency / caseCount) : 0;
    
    // Finalize run
    await this.finalizeRun(runId, stats);
    
    console.log(`[EvalRunner] Completed run ${runId}:`);
    console.log(`  Passed: ${stats.passed}/${cases.length}`);
    console.log(`  Failed: ${stats.failed}/${cases.length}`);
    console.log(`  Avg Score: ${stats.avgScore}/10`);
    console.log(`  Total Cost: $${(stats.totalCostCents / 100).toFixed(2)}`);
    
    return {
      runId,
      stats,
      results,
    };
  }
}

/**
 * Quick evaluation with a subset of cases
 */
export async function runSpotCheck(count = 5, options = {}) {
  const cases = getRandomEvalCases(count, options);
  const runner = new ALEvaluationRunner({
    name: `Spot Check (${count} cases)`,
    triggeredBy: 'manual',
  });
  
  return runner.runEvaluations({ cases });
}

/**
 * Full evaluation with all cases
 */
export async function runFullEvaluation(options = {}) {
  const runner = new ALEvaluationRunner({
    name: options.name || 'Full Evaluation',
    triggeredBy: options.triggeredBy || 'manual',
    promptVersionId: options.promptVersionId,
    createdBy: options.createdBy,
  });
  
  return runner.runEvaluations({ 
    cases: getAllEvalCases(),
    onProgress: options.onProgress,
  });
}

/**
 * Get recent evaluation runs
 */
export async function getRecentRuns(limit = 10) {
  const RUN_COLS = 'id, prompt_version_id, test_set_name, total_cases, passed_cases, failed_cases, avg_quality_score, avg_response_time_ms, started_at, completed_at, status, metadata, created_at';
  
  const { data, error } = await supabase
    .from('al_evaluation_runs')
    .select(RUN_COLS)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('[EvalRunner] Error fetching runs:', error);
    return [];
  }
  
  return data;
}

/**
 * Get results for a specific run
 */
export async function getRunResults(runId) {
  const RESULT_COLS = 'id, run_id, test_case_id, passed, quality_score, response_time_ms, response_text, expected_behavior, actual_behavior, llm_judge_score, llm_judge_reasoning, error_message, created_at';
  
  const { data, error } = await supabase
    .from('al_evaluation_results')
    .select(RESULT_COLS)
    .eq('run_id', runId)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('[EvalRunner] Error fetching results:', error);
    return [];
  }
  
  return data;
}

/**
 * Get failed tests from a run for analysis
 */
export async function getFailedResults(runId) {
  const RESULT_COLS = 'id, run_id, test_case_id, passed, quality_score, response_time_ms, response_text, expected_behavior, actual_behavior, llm_judge_score, llm_judge_reasoning, error_message, created_at';
  
  const { data, error } = await supabase
    .from('al_evaluation_results')
    .select(RESULT_COLS)
    .eq('run_id', runId)
    .eq('passed', false)
    .order('llm_judge_score', { ascending: true });
  
  if (error) {
    console.error('[EvalRunner] Error fetching failed results:', error);
    return [];
  }
  
  return data;
}

const alEvaluationRunnerModule = { ALEvaluationRunner, runSpotCheck, runFullEvaluation, getRecentRuns, getRunResults, getFailedResults };
export default alEvaluationRunnerModule;
