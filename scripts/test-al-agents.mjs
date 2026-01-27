#!/usr/bin/env node
/**
 * AL Multi-Agent Comprehensive Test Suite
 * 
 * Tests routing accuracy, tool usage, response quality, and forbidden phrases.
 * Run with: node scripts/test-al-agents.mjs
 * 
 * Requires:
 * - Dev server running on localhost:3000
 * - INTERNAL_EVAL_KEY in .env.local
 */

const BASE_URL = process.env.AL_TEST_URL || 'http://localhost:3000/api/ai-mechanic';
const INTERNAL_KEY = process.env.INTERNAL_EVAL_KEY || 'b+9ZrsqzicQHnL+BSjYw2Oi0xXFvujNU0usLZ7Jb4DE=';

// ============================================================================
// TEST CASES
// ============================================================================

const TEST_SUITE = [
  // Car Discovery tests
  { 
    category: "Car Discovery",
    prompt: "Tell me about the Porsche 911 GT3 RS",
    expectedAgent: "car_discovery",
    expectedTools: ["get_car_ai_context"],
  },
  { 
    category: "Car Discovery",
    prompt: "Compare the BMW M3 vs Audi RS5",
    expectedAgent: "car_discovery", 
    expectedTools: ["compare_cars"],
  },
  {
    category: "Car Discovery",
    prompt: "What's the latest news about the 2025 Porsche 911 hybrid?",
    expectedAgent: "car_discovery",
    expectedTools: ["search_web"],
  },
  
  // Parts Research
  { 
    category: "Parts Research",
    prompt: "Find me the best exhaust for a Porsche 718 Cayman GT4",
    expectedAgent: "parts_research",
    expectedTools: ["search_parts"],
  },
  
  // Build Planning
  { 
    category: "Build Planning", 
    prompt: "What mods should I do first on my 2020 Porsche Cayman GTS?",
    expectedAgent: "build_planning",
    expectedTools: ["recommend_build"],
  },
  
  // Knowledge - agent should answer from expertise, tools optional
  { 
    category: "Knowledge",
    prompt: "How does a limited slip differential work?",
    expectedAgent: "knowledge",
    expectedTools: [], // Expert knowledge, no tools needed
  },
  { 
    category: "Knowledge",
    prompt: "What is the difference between coilovers and lowering springs?",
    expectedAgent: "knowledge",
    expectedTools: [], // Expert knowledge, no tools needed
  },
  
  // Performance Data
  { 
    category: "Performance Data",
    prompt: "How much HP will I gain with an intake, exhaust and tune on a 911 Turbo?",
    expectedAgent: "performance_data",
    expectedTools: ["calculate_mod_impact"],
  },
  
  // Community/Events
  { 
    category: "Community Events",
    prompt: "Find track days near Los Angeles",
    expectedAgent: "community_events",
    expectedTools: ["search_events"],
  },
  { 
    category: "Community Events",
    prompt: "What do Cayman owners say about IMS bearing issues?",
    expectedAgent: "community_events",
    expectedTools: ["search_community_insights"],
  },
  
  // Generalist
  { 
    category: "Generalist",
    prompt: "Tell me a funny car joke",
    expectedAgent: "generalist",
    expectedTools: [],
  },
  { 
    category: "Generalist",
    prompt: "How do I earn points on AutoRev?",
    expectedAgent: "generalist",
    expectedTools: [],
  },
];

// Forbidden phrases that AL should NEVER say
const FORBIDDEN_PHRASES = [
  "I don't have that in our database",
  "AutoRev doesn't have data",
  "I couldn't find that in our system",
  "our database doesn't contain",
  "I don't have specific data for",
  "Based on general automotive knowledge",
];

// ============================================================================
// TEST RUNNER
// ============================================================================

async function runTest(test, index, verbose = true) {
  const startTime = Date.now();
  const results = {
    passed: true,
    issues: [],
    classified: null,
    agent: null,
    tools: [],
    responsePreview: "",
    duration: 0,
    usedMultiAgent: false,
  };
  
  if (verbose) {
    console.log(`\n${"═".repeat(70)}`);
    console.log(`TEST ${index + 1}: ${test.category}`);
    console.log(`PROMPT: "${test.prompt}"`);
    console.log(`EXPECTED: ${test.expectedAgent} + [${test.expectedTools.join(", ") || "none"}]`);
    console.log("═".repeat(70));
  }
  
  try {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-eval-key": INTERNAL_KEY,
      },
      body: JSON.stringify({ message: test.prompt, stream: true }),
    });
    
    if (!response.ok) {
      results.passed = false;
      results.issues.push(`HTTP ${response.status}`);
      return results;
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullResponse = "";
    let currentEvent = null;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      
      for (const line of lines) {
        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith("data: ") && currentEvent) {
          try {
            const data = JSON.parse(line.slice(6));
            
            switch (currentEvent) {
              case "connected":
                results.usedMultiAgent = data.multiAgent;
                break;
              case "classified":
                results.classified = data;
                if (verbose) {
                  const match = data.intent === test.expectedAgent;
                  console.log(`   🎯 CLASSIFIED: ${data.intent} (${Math.round(data.confidence * 100)}%) ${match ? "✓" : "✗"}`);
                }
                break;
              case "agent_start":
                results.agent = data;
                if (verbose) console.log(`   🤖 AGENT: ${data.agentName}`);
                break;
              case "tool_start":
                results.tools.push(data.tool);
                if (verbose) console.log(`   🔧 TOOL: ${data.tool}`);
                break;
              case "text":
                fullResponse += data.content || "";
                break;
              case "done":
                if (verbose) console.log(`   🏁 DONE (${data.totalDurationMs}ms, cost: ${data.usage?.costFormatted})`);
                break;
            }
          } catch (e) {}
          currentEvent = null;
        }
      }
    }
    
    results.duration = Date.now() - startTime;
    results.responsePreview = fullResponse.substring(0, 400);
    
    // Check routing
    if (results.classified?.intent !== test.expectedAgent) {
      results.issues.push(`Routing: expected ${test.expectedAgent}, got ${results.classified?.intent}`);
    }
    
    // Check tools (at least one expected tool should be used, or none if none expected)
    if (test.expectedTools.length > 0) {
      const hasExpectedTool = test.expectedTools.some(t => results.tools.includes(t));
      if (!hasExpectedTool && results.tools.length === 0) {
        results.issues.push(`No tools used, expected one of: ${test.expectedTools.join(", ")}`);
      }
    }
    
    // Check for forbidden phrases
    for (const phrase of FORBIDDEN_PHRASES) {
      if (fullResponse.toLowerCase().includes(phrase.toLowerCase())) {
        results.issues.push(`FORBIDDEN: "${phrase}"`);
      }
    }
    
    if (results.issues.length > 0) {
      results.passed = false;
    }
    
    if (verbose) {
      console.log(`\n📝 RESPONSE: ${results.responsePreview}${fullResponse.length > 400 ? "..." : ""}`);
      console.log(`\n${results.passed ? "✅ PASSED" : "⚠️ ISSUES: " + results.issues.join(", ")}`);
    }
    
  } catch (err) {
    results.passed = false;
    results.issues.push(err.message);
    if (verbose) console.log(`❌ ERROR: ${err.message}`);
  }
  
  return results;
}

async function runSuite(verbose = true) {
  console.log("╔══════════════════════════════════════════════════════════════════════╗");
  console.log("║           AL MULTI-AGENT COMPREHENSIVE TEST SUITE                    ║");
  console.log("╚══════════════════════════════════════════════════════════════════════╝");
  console.log(`\nRunning ${TEST_SUITE.length} tests against ${BASE_URL}\n`);
  
  const allResults = [];
  
  for (let i = 0; i < TEST_SUITE.length; i++) {
    const result = await runTest(TEST_SUITE[i], i, verbose);
    allResults.push({ ...result, test: TEST_SUITE[i] });
  }
  
  // Summary
  console.log("\n" + "═".repeat(70));
  console.log("FINAL SUMMARY");
  console.log("═".repeat(70));
  
  const passed = allResults.filter(r => r.passed).length;
  const failed = allResults.filter(r => !r.passed).length;
  
  console.log(`\n✅ PASSED: ${passed}/${allResults.length} (${Math.round((passed/allResults.length)*100)}%)`);
  console.log(`⚠️ ISSUES: ${failed}/${allResults.length}`);
  
  // By category
  console.log("\nBY CATEGORY:");
  const byCategory = {};
  for (const r of allResults) {
    const cat = r.test.category;
    if (!byCategory[cat]) byCategory[cat] = { passed: 0, total: 0 };
    byCategory[cat].total++;
    if (r.passed) byCategory[cat].passed++;
  }
  for (const [cat, stats] of Object.entries(byCategory)) {
    const status = stats.passed === stats.total ? "✅" : "⚠️";
    console.log(`  ${status} ${cat}: ${stats.passed}/${stats.total}`);
  }
  
  // Issues to address
  if (failed > 0) {
    console.log("\nISSUES TO ADDRESS:");
    for (const r of allResults.filter(r => !r.passed)) {
      console.log(`  - ${r.test.category} ("${r.test.prompt.substring(0, 40)}...")`);
      for (const issue of r.issues) {
        console.log(`    → ${issue}`);
      }
    }
  }
  
  // Tool usage
  console.log("\nTOOL USAGE:");
  const toolCounts = {};
  for (const r of allResults) {
    for (const tool of r.tools) {
      toolCounts[tool] = (toolCounts[tool] || 0) + 1;
    }
  }
  for (const [tool, count] of Object.entries(toolCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${tool}: ${count} calls`);
  }
  
  // Timing
  const avgDuration = allResults.reduce((sum, r) => sum + r.duration, 0) / allResults.length;
  console.log(`\nAVERAGE RESPONSE TIME: ${(avgDuration / 1000).toFixed(1)}s`);
  
  // Multi-agent check
  const multiAgentCount = allResults.filter(r => r.usedMultiAgent).length;
  console.log(`MULTI-AGENT MODE: ${multiAgentCount}/${allResults.length} requests`);
  
  return { passed, failed, total: allResults.length, results: allResults };
}

// Run if called directly
runSuite().catch(console.error);
