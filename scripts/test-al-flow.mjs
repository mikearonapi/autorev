#!/usr/bin/env node
/**
 * AL Flow Integration Test
 *
 * Tests the complete AL system flow by sending real queries to the API
 * and validating the streaming responses.
 *
 * Prerequisites:
 * - Dev server running (npm run dev)
 * - TEST_AUTH_TOKEN env var set with valid auth token
 *
 * Usage:
 *   TEST_AUTH_TOKEN=<token> node scripts/test-al-flow.mjs
 *
 * Or for quick testing (will use beta mode):
 *   node scripts/test-al-flow.mjs
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN;

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(`  ${title}`, 'bright');
  console.log('='.repeat(70));
}

/**
 * Test scenarios covering different agent types and flows
 */
const TEST_SCENARIOS = [
  {
    name: 'Parts Research - Best intake',
    query: 'What are the best cold air intakes for a 2020 Audi RS5?',
    expectedAgent: 'parts_research',
    expectedTools: ['research_parts_live', 'get_user_context'],
    validateResponse: (content) => {
      const checks = [];
      // Should have structured content
      if (content.includes('##') || content.includes('**')) {
        checks.push({ pass: true, note: 'Has markdown formatting' });
      } else {
        checks.push({ pass: false, note: 'Missing markdown formatting' });
      }
      // Should mention products
      if (content.includes('$') || content.includes('price') || content.includes('Price')) {
        checks.push({ pass: true, note: 'Contains price information' });
      } else {
        checks.push({ pass: false, note: 'Missing price information' });
      }
      // Should NOT contain internal blocks
      if (content.includes('<parts_to_save>')) {
        checks.push({ pass: false, note: 'CRITICAL: Internal block leaked to output!' });
      } else {
        checks.push({ pass: true, note: 'Internal blocks properly stripped' });
      }
      // Should have meaningful length
      if (content.length > 200) {
        checks.push({ pass: true, note: `Good response length (${content.length} chars)` });
      } else {
        checks.push({ pass: false, note: `Response too short (${content.length} chars)` });
      }
      return checks;
    },
  },
  {
    name: 'Build Planning - Mod sequence',
    query: 'What mods should I do first on my Mustang GT to make 500hp?',
    expectedAgent: 'build_planning',
    expectedTools: ['get_user_context', 'recommend_build'],
    validateResponse: (content) => {
      const checks = [];
      if (content.includes('stage') || content.includes('Stage') || content.includes('first')) {
        checks.push({ pass: true, note: 'Contains build stages/sequence' });
      } else {
        checks.push({ pass: false, note: 'Missing build progression advice' });
      }
      if (content.length > 200) {
        checks.push({ pass: true, note: `Good response length (${content.length} chars)` });
      } else {
        checks.push({ pass: false, note: `Response too short (${content.length} chars)` });
      }
      return checks;
    },
  },
  {
    name: 'Car Discovery - Best sports car',
    query: 'What is the best sports car under $60k for daily driving?',
    expectedAgent: 'car_discovery',
    expectedTools: ['search_cars'],
    validateResponse: (content) => {
      const checks = [];
      // Should mention specific cars
      if (
        content.toLowerCase().includes('porsche') ||
        content.toLowerCase().includes('corvette') ||
        content.toLowerCase().includes('supra') ||
        content.toLowerCase().includes('mustang') ||
        content.toLowerCase().includes('m3') ||
        content.toLowerCase().includes('camaro')
      ) {
        checks.push({ pass: true, note: 'Mentions specific car models' });
      } else {
        checks.push({ pass: false, note: 'Should mention specific cars' });
      }
      return checks;
    },
  },
  {
    name: 'Knowledge - How does a turbo work',
    query: 'How does a turbocharger work?',
    expectedAgent: 'knowledge',
    expectedTools: [],
    validateResponse: (content) => {
      const checks = [];
      if (
        content.toLowerCase().includes('exhaust') ||
        content.toLowerCase().includes('compressor') ||
        content.toLowerCase().includes('boost')
      ) {
        checks.push({ pass: true, note: 'Contains technical explanation' });
      } else {
        checks.push({ pass: false, note: 'Missing technical details' });
      }
      return checks;
    },
  },
  {
    name: 'Performance Data - HP gains',
    query: 'How much HP does a cold air intake add to a BMW M3?',
    expectedAgent: 'performance_data',
    expectedTools: ['calculate_mod_impact', 'get_dyno_runs'],
    validateResponse: (content) => {
      const checks = [];
      if (content.includes('hp') || content.includes('HP') || content.includes('horsepower')) {
        checks.push({ pass: true, note: 'Contains HP information' });
      } else {
        checks.push({ pass: false, note: 'Should mention HP gains' });
      }
      return checks;
    },
  },
  {
    name: 'Generalist - Simple greeting',
    query: 'Hi!',
    expectedAgent: 'generalist',
    expectedTools: [],
    validateResponse: (content) => {
      const checks = [];
      if (content.length > 10 && content.length < 500) {
        checks.push({ pass: true, note: 'Appropriate response length for greeting' });
      } else {
        checks.push({ pass: false, note: 'Response length unusual for greeting' });
      }
      return checks;
    },
  },
];

/**
 * Send a streaming request to the AL API
 */
async function testQuery(scenario) {
  logSection(`TEST: ${scenario.name}`);
  log(`Query: "${scenario.query}"`, 'cyan');
  log(`Expected Agent: ${scenario.expectedAgent}`, 'dim');

  const results = {
    scenario: scenario.name,
    query: scenario.query,
    events: [],
    phases: [],
    tools: [],
    response: '',
    agentUsed: null,
    errors: [],
    validations: [],
    duration: 0,
  };

  const startTime = Date.now();

  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (AUTH_TOKEN) {
      headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
    }

    const response = await fetch(`${BASE_URL}/api/ai-mechanic?stream=true`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: scenario.query,
        history: [],
      }),
    });

    if (!response.ok) {
      results.errors.push(`HTTP ${response.status}: ${response.statusText}`);
      log(`ERROR: HTTP ${response.status}`, 'red');
      return results;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let currentEventType = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEventType = line.slice(7).trim();
          continue;
        }

        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            results.events.push({ type: currentEventType, data });

            // Process events
            if (currentEventType === 'phase') {
              results.phases.push(data.label);
              log(`  📍 Phase: ${data.label}`, 'yellow');
            } else if (currentEventType === 'tool_start') {
              results.tools.push(data.tool);
              log(`  🔧 Tool: ${data.label || data.tool}`, 'blue');
            } else if (currentEventType === 'tool_result') {
              const status = data.success ? '✓' : '✗';
              const duration = data.durationMs ? ` (${data.durationMs}ms)` : '';
              log(`     ${status} ${data.tool}${duration}`, data.success ? 'green' : 'red');
            } else if (currentEventType === 'text') {
              results.response += data.content || '';
            } else if (currentEventType === 'agent_start') {
              results.agentUsed = data.agentId;
              log(`  🤖 Agent: ${data.agentName} (${data.agentId})`, 'magenta');
            } else if (currentEventType === 'classified') {
              log(`  🎯 Intent: ${data.intent} (${Math.round(data.confidence * 100)}%)`, 'cyan');
            } else if (currentEventType === 'done') {
              results.duration = Date.now() - startTime;
              log(`  ⏱️  Duration: ${results.duration}ms`, 'dim');
              if (data.responseQuality?.issue) {
                log(`  ⚠️  Quality Issue: ${data.responseQuality.issue}`, 'yellow');
              }
            } else if (currentEventType === 'error') {
              results.errors.push(data.message);
              log(`  ❌ Error: ${data.message}`, 'red');
            }
          } catch (e) {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    }

    // Validate response
    log('\n📋 Response Preview:', 'bright');
    const preview = results.response.slice(0, 300);
    console.log(`${colors.dim}${preview}${results.response.length > 300 ? '...' : ''}${colors.reset}`);

    // Run validations
    log('\n✅ Validations:', 'bright');
    const validations = scenario.validateResponse(results.response);
    results.validations = validations;

    for (const v of validations) {
      const icon = v.pass ? '✓' : '✗';
      const color = v.pass ? 'green' : 'red';
      log(`  ${icon} ${v.note}`, color);
    }

    // Check agent routing
    if (results.agentUsed === scenario.expectedAgent) {
      log(`  ✓ Correct agent used: ${results.agentUsed}`, 'green');
    } else if (results.agentUsed) {
      log(`  ⚠ Different agent used: ${results.agentUsed} (expected: ${scenario.expectedAgent})`, 'yellow');
    }

    // Check tools used
    const expectedToolsUsed = scenario.expectedTools.filter((t) => results.tools.includes(t));
    if (expectedToolsUsed.length > 0) {
      log(`  ✓ Expected tools used: ${expectedToolsUsed.join(', ')}`, 'green');
    }
  } catch (err) {
    results.errors.push(err.message);
    log(`ERROR: ${err.message}`, 'red');
  }

  return results;
}

/**
 * Main test runner
 */
async function runTests() {
  log('\n╔══════════════════════════════════════════════════════════════════════╗', 'bright');
  log('║              AL FLOW INTEGRATION TEST SUITE                          ║', 'bright');
  log('╚══════════════════════════════════════════════════════════════════════╝', 'bright');

  log(`\nBase URL: ${BASE_URL}`, 'dim');
  log(`Auth: ${AUTH_TOKEN ? 'Provided' : 'None (using beta mode)'}`, 'dim');

  // Check if server is running
  try {
    const health = await fetch(`${BASE_URL}/api/health`);
    if (!health.ok) {
      log('\n❌ Server health check failed. Is the dev server running?', 'red');
      process.exit(1);
    }
    log('✓ Server is healthy\n', 'green');
  } catch (err) {
    log('\n❌ Cannot connect to server. Make sure dev server is running:', 'red');
    log('   npm run dev', 'dim');
    process.exit(1);
  }

  const allResults = [];
  let passed = 0;
  let failed = 0;

  for (const scenario of TEST_SCENARIOS) {
    const result = await testQuery(scenario);
    allResults.push(result);

    // Count passes/fails
    const allValidationsPassed =
      result.validations.length > 0 && result.validations.every((v) => v.pass);
    const noErrors = result.errors.length === 0;
    const hasResponse = result.response.length > 50;

    if (allValidationsPassed && noErrors && hasResponse) {
      passed++;
    } else {
      failed++;
    }

    // Small delay between tests
    await new Promise((r) => setTimeout(r, 1000));
  }

  // Summary
  logSection('TEST SUMMARY');

  for (const result of allResults) {
    const validationsPassed = result.validations.filter((v) => v.pass).length;
    const validationsTotal = result.validations.length;
    const status =
      validationsPassed === validationsTotal && result.errors.length === 0
        ? `${colors.green}PASS${colors.reset}`
        : `${colors.red}FAIL${colors.reset}`;

    log(
      `${status} ${result.scenario} (${validationsPassed}/${validationsTotal} checks, ${result.duration}ms)`,
      'reset'
    );
  }

  console.log('\n' + '-'.repeat(70));
  log(`Total: ${passed} passed, ${failed} failed out of ${TEST_SCENARIOS.length} tests`, passed === TEST_SCENARIOS.length ? 'green' : 'yellow');

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests();
