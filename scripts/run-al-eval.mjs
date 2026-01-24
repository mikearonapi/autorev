#!/usr/bin/env node
/**
 * AL Evaluation Runner Script
 * 
 * Usage:
 *   node scripts/run-al-eval.mjs --count=10
 *   node scripts/run-al-eval.mjs --full
 *   node scripts/run-al-eval.mjs --category=reliability
 */

import { ALEvaluationRunner, runSpotCheck, runFullEvaluation } from '../lib/alEvaluationRunner.js';
import { getRandomEvalCases, getEvalCasesByCategory, getAllEvalCases } from '../lib/alEvaluations.js';
import { sendEvalFailureAlert, sendEvalSuccessAlert } from '../lib/discord.js';

const args = process.argv.slice(2);
const options = {};

for (const arg of args) {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    options[key] = value || true;
  }
}

async function main() {
  console.log('Starting AL Evaluation...\n');
  
  let cases;
  let runName;
  
  if (options.full) {
    cases = getAllEvalCases();
    runName = 'Full Evaluation (CI)';
  } else if (options.category && options.category !== 'all') {
    cases = getEvalCasesByCategory(options.category);
    runName = `Category: ${options.category}`;
  } else {
    const count = parseInt(options.count) || 10;
    cases = getRandomEvalCases(count);
    runName = `Spot Check (${count} cases)`;
  }
  
  console.log(`Running: ${runName}`);
  console.log(`Test cases: ${cases.length}\n`);
  
  const runner = new ALEvaluationRunner({
    name: runName,
    triggeredBy: 'ci',
  });
  
  const results = await runner.runEvaluations({
    cases,
    onProgress: ({ current, total, testCase, result }) => {
      const status = result.passed ? '✓' : '✗';
      const score = result.judgeResult?.score || '-';
      console.log(`[${current}/${total}] ${status} ${testCase.id} (score: ${score})`);
    },
  });
  
  // Summary
  const passRate = ((results.stats.passed / cases.length) * 100).toFixed(1);
  
  console.log('\n========== RESULTS ==========');
  console.log(`Pass Rate: ${passRate}%`);
  console.log(`Passed: ${results.stats.passed}/${cases.length}`);
  console.log(`Failed: ${results.stats.failed}`);
  console.log(`Avg Score: ${results.stats.avgScore}/10`);
  console.log(`Run ID: ${results.runId}`);
  console.log('==============================\n');
  
  // Output JSON if requested
  if (options.json) {
    const output = {
      runId: results.runId,
      passRate: parseFloat(passRate),
      passed: results.stats.passed,
      failed: results.stats.failed,
      total: cases.length,
      avgScore: results.stats.avgScore,
    };
    console.log(JSON.stringify(output));
  }
  
  // Send Discord alerts
  const alertThreshold = parseInt(options.alertThreshold) || 80;
  const alertResults = {
    passed: results.stats.passed,
    failed: results.stats.failed,
    total: cases.length,
    avgScore: results.stats.avgScore,
    runId: results.runId,
    failedCases: results.failed?.map(f => ({ id: f.testCase.id, reason: f.error })) || [],
  };
  
  if (parseFloat(passRate) < alertThreshold) {
    await sendEvalFailureAlert(alertResults, alertThreshold);
    console.log(`Discord alert sent (pass rate ${passRate}% < ${alertThreshold}%)`);
  } else if (options.alertOnSuccess) {
    await sendEvalSuccessAlert(alertResults);
    console.log('Discord success alert sent');
  }
  
  // Exit with error if pass rate below threshold
  if (parseFloat(passRate) < 70) {
    console.error('FAILED: Pass rate below 70% threshold');
    process.exit(1);
  }
  
  console.log('Evaluation completed successfully');
}

main().catch(err => {
  console.error('Evaluation failed:', err);
  process.exit(1);
});
