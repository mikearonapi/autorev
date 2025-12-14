/**
 * AutoRev - AL Evaluation Regression Tests
 *
 * Runs a small golden set of prompts through /api/ai-mechanic in INTERNAL EVAL mode
 * and asserts key invariants:
 * - internal eval path works (no auth / no billing)
 * - evidence-sensitive prompts trigger search_knowledge and yield citations or explicit limitations
 * - correlation IDs + tool timings are returned for debugging
 *
 * Run:
 *   INTERNAL_EVAL_KEY=... node scripts/al-eval-regression-tests.mjs
 *
 * Optional:
 *   AL_EVAL_BASE_URL=http://localhost:3000
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.AL_EVAL_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const INTERNAL_EVAL_KEY = process.env.INTERNAL_EVAL_KEY;

const results = {
  passed: 0,
  failed: 0,
  startedAt: new Date().toISOString(),
  baseUrl: BASE_URL,
  tests: [],
};

function assert(condition, testName, expected, actual, meta = undefined) {
  if (condition) {
    results.passed++;
    results.tests.push({ name: testName, status: 'PASS' });
    console.log(`  ✅ ${testName}`);
    return true;
  }
  results.failed++;
  results.tests.push({ name: testName, status: 'FAIL', expected, actual, meta });
  console.log(`  ❌ ${testName}`);
  console.log(`     Expected: ${JSON.stringify(expected)}`);
  console.log(`     Actual: ${JSON.stringify(actual)}`);
  return false;
}

function hasCitationUrl(text) {
  return /\(Source:\s*https?:\/\/[^)]+\)/i.test(text || '');
}

function hasAnyUrl(text) {
  return /https?:\/\/\S+/i.test(text || '');
}

function hasEvidenceDisclaimer(text) {
  return /(no excerpts found|insufficient evidence|don't have enough evidence|i don't have enough evidence|can(?:not|'t) verify|can(?:not|'t) cite|no sources available)/i.test(text || '');
}

function hasAnyEvidenceToolUsed(toolsUsed) {
  const set = new Set(toolsUsed || []);
  return set.has('search_knowledge') || set.has('get_dyno_runs') || set.has('get_track_lap_times');
}

async function callAiMechanic({ message, carSlug, extraBody }) {
  const res = await fetch(`${BASE_URL.replace(/\/$/, '')}/api/ai-mechanic`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-eval-key': INTERNAL_EVAL_KEY,
    },
    body: JSON.stringify({
      message,
      carSlug: carSlug || null,
      planId: 'tuner',
      history: [],
      currentPage: 'internal-eval',
      ...(extraBody && typeof extraBody === 'object' ? extraBody : {}),
    }),
  });

  const json = await res.json().catch(() => ({}));
  return { status: res.status, headers: res.headers, json };
}

async function run() {
  console.log('\n🧪 AL EVALUATION REGRESSION TESTS');
  console.log('='.repeat(70));

  if (!INTERNAL_EVAL_KEY) {
    console.error('\nMissing env var: INTERNAL_EVAL_KEY');
    process.exit(2);
  }

  const goldenPath = path.resolve(__dirname, '../audit/al-eval-golden.json');
  const golden = JSON.parse(fs.readFileSync(goldenPath, 'utf8'));
  const cases = golden?.cases || [];

  assert(Array.isArray(cases) && cases.length > 0, 'Golden set loads', 'non-empty cases', cases?.length || 0);

  for (const tc of cases) {
    console.log(`\n▶ ${tc.id} — ${tc.name}`);
    const { status, headers, json } = await callAiMechanic({
      message: tc.message,
      carSlug: tc.carSlug,
      extraBody: tc.extraBody,
    });

    const corr = headers.get('x-correlation-id') || json?.context?.correlationId || null;
    assert(status === 200, `${tc.id}: status 200`, 200, status, { body: json });
    assert(Boolean(json?.context?.internalEval), `${tc.id}: internalEval true`, true, json?.context?.internalEval);
    assert(Boolean(corr), `${tc.id}: correlationId present`, true, Boolean(corr));
    assert(typeof json?.response === 'string' && json.response.length > 40, `${tc.id}: response present`, 'non-empty', (json?.response || '').slice(0, 80));
    assert(Number(json?.usage?.claudeCalls || 0) >= 1, `${tc.id}: claudeCalls >= 1`, '>=1', json?.usage?.claudeCalls);

    const toolsUsed = json?.context?.toolsUsed || [];
    const toolTimings = json?.context?.toolTimings || [];

    if (Array.isArray(tc.expectedToolsUsed) && tc.expectedToolsUsed.length > 0) {
      for (const t of tc.expectedToolsUsed) {
        assert(new Set(toolsUsed).has(t), `${tc.id}: used tool ${t}`, true, toolsUsed);
      }
    }

    if (tc.expectedToolInputKeys && typeof tc.expectedToolInputKeys === 'object') {
      for (const [toolName, requiredKeys] of Object.entries(tc.expectedToolInputKeys)) {
        const timing = Array.isArray(toolTimings) ? toolTimings.find(t => t?.tool === toolName) : null;
        assert(Boolean(timing), `${tc.id}: toolTimings has ${toolName}`, true, Boolean(timing), { toolTimings });
        if (timing && Array.isArray(requiredKeys) && requiredKeys.length > 0) {
          for (const k of requiredKeys) {
            assert(
              Array.isArray(timing.inputKeys) && timing.inputKeys.includes(k),
              `${tc.id}: ${toolName} input includes ${k}`,
              true,
              timing.inputKeys,
              { timing }
            );
          }
        }
      }
    }

    if (tc.requiresEvidence) {
      assert(hasAnyEvidenceToolUsed(toolsUsed), `${tc.id}: used an evidence tool`, 'one of search_knowledge/get_dyno_runs/get_track_lap_times', toolsUsed);
      const timingHasEvidence = Array.isArray(toolTimings) && toolTimings.some(t => ['search_knowledge','get_dyno_runs','get_track_lap_times'].includes(t?.tool));
      assert(timingHasEvidence, `${tc.id}: toolTimings contains an evidence tool`, true, timingHasEvidence, { toolTimings });

      const responseText = json?.response || '';
      const okEvidenceBehavior = hasCitationUrl(responseText) || hasEvidenceDisclaimer(responseText);
      assert(
        okEvidenceBehavior,
        `${tc.id}: citations or explicit limitations`,
        'citation URL "(Source: ...)" OR explicit limitation text',
        responseText.slice(0, 350),
        {
          hasCitationUrl: hasCitationUrl(responseText),
          hasAnyUrl: hasAnyUrl(responseText),
          hasEvidenceDisclaimer: hasEvidenceDisclaimer(responseText),
        }
      );
    }
  }

  results.finishedAt = new Date().toISOString();

  const outPath = path.resolve(__dirname, '../audit/al-eval-results.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

  console.log('\n' + '='.repeat(70));
  console.log(`Done. Passed: ${results.passed}, Failed: ${results.failed}`);
  console.log(`Wrote: ${outPath}`);

  process.exit(results.failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Fatal error running AL eval:', err);
  process.exit(2);
});

