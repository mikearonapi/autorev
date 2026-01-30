#!/usr/bin/env node

/**
 * AL Quality Monitoring Script
 *
 * Comprehensive monitoring for AL conversations including:
 * 1. Request tracing metrics (latency, errors, tool usage)
 * 2. Empty tool_calls when tools should have been used
 * 3. High percentage of fallback responses
 * 4. Negative feedback patterns
 * 5. Agent performance breakdown
 * 6. Cost tracking
 *
 * Usage:
 *   node scripts/monitor-al-quality.mjs
 *   node scripts/monitor-al-quality.mjs --days 7
 *   node scripts/monitor-al-quality.mjs --alert-threshold 20
 *   node scripts/monitor-al-quality.mjs --traces  # Show recent traces
 *   node scripts/monitor-al-quality.mjs --errors  # Show only errors
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const DAYS_TO_ANALYZE = parseInt(process.argv.find((arg) => arg.startsWith('--days='))?.split('=')[1] || '7', 10);
const ALERT_THRESHOLD = parseInt(
  process.argv.find((arg) => arg.startsWith('--alert-threshold='))?.split('=')[1] || '15',
  10
);
const SHOW_TRACES = process.argv.includes('--traces');
const SHOW_ERRORS = process.argv.includes('--errors');

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// =============================================================================
// TRACE QUERIES
// =============================================================================

async function getRequestTraceMetrics() {
  const cutoff = new Date(Date.now() - DAYS_TO_ANALYZE * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('al_request_traces')
    .select('*')
    .gte('created_at', cutoff);

  if (error || !data || data.length === 0) {
    return null;
  }

  const total = data.length;
  const errors = data.filter((t) => t.had_error).length;
  const fallbacks = data.filter((t) => t.used_fallback).length;
  const avgLatency = data.reduce((sum, t) => sum + (t.total_latency_ms || 0), 0) / total;
  const totalCost = data.reduce((sum, t) => sum + (parseFloat(t.cost_cents) || 0), 0);

  // Agent breakdown
  const byAgent = {};
  for (const trace of data) {
    const agent = trace.agent_type || 'unknown';
    byAgent[agent] = byAgent[agent] || { count: 0, errors: 0, avgLatency: 0, latencies: [] };
    byAgent[agent].count++;
    if (trace.had_error) byAgent[agent].errors++;
    byAgent[agent].latencies.push(trace.total_latency_ms || 0);
  }

  // Calculate avg latency per agent
  for (const agent of Object.keys(byAgent)) {
    const latencies = byAgent[agent].latencies;
    byAgent[agent].avgLatency = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(0);
    delete byAgent[agent].latencies;
  }

  // Intent breakdown
  const byIntent = {};
  for (const trace of data) {
    const intent = trace.intent || 'unknown';
    byIntent[intent] = (byIntent[intent] || 0) + 1;
  }

  // Tool usage
  const toolCounts = {};
  for (const trace of data) {
    for (const tool of trace.tools_called || []) {
      toolCounts[tool] = (toolCounts[tool] || 0) + 1;
    }
  }

  return {
    total,
    errors,
    errorRate: ((errors / total) * 100).toFixed(1),
    fallbacks,
    fallbackRate: ((fallbacks / total) * 100).toFixed(1),
    avgLatencyMs: avgLatency.toFixed(0),
    totalCostCents: totalCost.toFixed(2),
    byAgent,
    byIntent,
    topTools: Object.entries(toolCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10),
  };
}

async function getRecentTraces(limit = 10, errorsOnly = false) {
  let query = supabase
    .from('al_request_traces')
    .select('correlation_id, intent, agent_type, tools_called, had_error, used_fallback, total_latency_ms, error_message, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (errorsOnly) {
    query = query.eq('had_error', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// =============================================================================
// LEGACY QUERIES (from al_messages)
// =============================================================================

async function getEmptyToolCallsRate() {
  const { data, error } = await supabase.rpc('get_al_empty_toolcalls_rate', {
    p_days: DAYS_TO_ANALYZE,
  });

  if (error) {
    // If RPC doesn't exist, run manual query
    const { data: messages, error: msgError } = await supabase
      .from('al_messages')
      .select('tool_calls, content')
      .eq('role', 'assistant')
      .gte('created_at', new Date(Date.now() - DAYS_TO_ANALYZE * 24 * 60 * 60 * 1000).toISOString());

    if (msgError) throw msgError;

    const total = messages.length;
    const emptyToolCalls = messages.filter(
      (m) => !m.tool_calls || m.tool_calls.length === 0
    ).length;

    return {
      total,
      emptyToolCalls,
      rate: total > 0 ? ((emptyToolCalls / total) * 100).toFixed(1) : 0,
    };
  }

  return data;
}

async function getCarSpecificQuestionsWithoutTools() {
  const { data, error } = await supabase
    .from('al_messages')
    .select(`
      content,
      tool_calls,
      conversation_id,
      created_at,
      al_conversations!inner (title, user_id)
    `)
    .eq('role', 'user')
    .gte('created_at', new Date(Date.now() - DAYS_TO_ANALYZE * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw error;

  // Find user messages that mention specific cars but assistant response had no tools
  const carPatterns = [
    /my\s+(\d{4})\s+/i,
    /(\d{4})\s+(ford|chevy|bmw|porsche|audi|mustang|camaro|corvette)/i,
    /maintenance|take care|oil change|service/i,
  ];

  const suspicious = [];
  for (const msg of data || []) {
    const matchesCar = carPatterns.some((p) => p.test(msg.content));
    if (matchesCar) {
      // Check if the assistant response for this conversation had tools
      const { data: assistantMsg } = await supabase
        .from('al_messages')
        .select('tool_calls, content')
        .eq('conversation_id', msg.conversation_id)
        .eq('role', 'assistant')
        .gt('created_at', msg.created_at)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (assistantMsg && (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0)) {
        suspicious.push({
          query: msg.content.substring(0, 100),
          conversationTitle: msg.al_conversations?.title,
          createdAt: msg.created_at,
        });
      }
    }
  }

  return suspicious;
}

async function getFeedbackSummary() {
  const { data, error } = await supabase
    .from('al_response_feedback')
    .select('feedback_type, feedback_category')
    .gte('created_at', new Date(Date.now() - DAYS_TO_ANALYZE * 24 * 60 * 60 * 1000).toISOString());

  if (error) throw error;

  const total = data.length;
  const thumbsUp = data.filter((f) => f.feedback_type === 'thumbs_up').length;
  const thumbsDown = data.filter((f) => f.feedback_type === 'thumbs_down').length;
  const inaccurate = data.filter((f) => f.feedback_category === 'inaccurate').length;

  return {
    total,
    thumbsUp,
    thumbsDown,
    inaccurate,
    approvalRate: total > 0 ? ((thumbsUp / total) * 100).toFixed(1) : 'N/A',
  };
}

async function getToolUsageDistribution() {
  const { data, error } = await supabase
    .from('al_messages')
    .select('tool_calls')
    .eq('role', 'assistant')
    .gte('created_at', new Date(Date.now() - DAYS_TO_ANALYZE * 24 * 60 * 60 * 1000).toISOString());

  if (error) throw error;

  const distribution = {};
  for (const msg of data) {
    const tools = msg.tool_calls || [];
    const key = tools.length === 0 ? 'none' : tools.sort().join(', ');
    distribution[key] = (distribution[key] || 0) + 1;
  }

  // Sort by count
  return Object.entries(distribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tools, count]) => ({ tools, count }));
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log(`\n🔍 AL Quality Monitor - Last ${DAYS_TO_ANALYZE} days\n`);
  console.log('='.repeat(60));

  // 0. Request Trace Metrics (from al_request_traces)
  console.log('\n🔬 Request Trace Metrics');
  console.log('-'.repeat(40));

  try {
    const traceMetrics = await getRequestTraceMetrics();
    if (traceMetrics) {
      console.log(`Total traced requests: ${traceMetrics.total}`);
      console.log(`Errors: ${traceMetrics.errors} (${traceMetrics.errorRate}%)`);
      console.log(`Fallbacks: ${traceMetrics.fallbacks} (${traceMetrics.fallbackRate}%)`);
      console.log(`Avg latency: ${traceMetrics.avgLatencyMs}ms`);
      console.log(`Total cost: ${traceMetrics.totalCostCents}¢`);

      if (Object.keys(traceMetrics.byAgent).length > 0) {
        console.log('\n  By Agent:');
        for (const [agent, stats] of Object.entries(traceMetrics.byAgent)) {
          console.log(`    ${agent}: ${stats.count} requests, ${stats.avgLatency}ms avg, ${stats.errors} errors`);
        }
      }

      if (Object.keys(traceMetrics.byIntent).length > 0) {
        console.log('\n  By Intent:');
        for (const [intent, count] of Object.entries(traceMetrics.byIntent).sort((a, b) => b[1] - a[1])) {
          console.log(`    ${intent}: ${count}`);
        }
      }

      if (traceMetrics.topTools.length > 0) {
        console.log('\n  Top Tools:');
        for (const [tool, count] of traceMetrics.topTools) {
          console.log(`    ${tool}: ${count}`);
        }
      }
    } else {
      console.log('No trace data available yet. Traces will appear after the next AL conversations.');
    }
  } catch (err) {
    console.log(`Error getting trace metrics: ${err.message}`);
  }

  // Show recent traces if requested
  if (SHOW_TRACES || SHOW_ERRORS) {
    console.log(`\n📋 Recent ${SHOW_ERRORS ? 'Error ' : ''}Traces`);
    console.log('-'.repeat(40));

    try {
      const traces = await getRecentTraces(10, SHOW_ERRORS);
      if (traces.length === 0) {
        console.log('No traces found');
      } else {
        for (const trace of traces) {
          const status = trace.had_error ? '❌' : trace.used_fallback ? '⚠️' : '✅';
          const tools = trace.tools_called?.length || 0;
          console.log(`  ${status} ${trace.correlation_id?.substring(0, 8)}... | ${trace.intent || 'unknown'} | ${trace.agent_type || 'unknown'} | ${tools} tools | ${trace.total_latency_ms}ms`);
          if (trace.had_error && trace.error_message) {
            console.log(`     Error: ${trace.error_message.substring(0, 80)}...`);
          }
        }
      }
    } catch (err) {
      console.log(`Error getting traces: ${err.message}`);
    }
  }

  // 1. Empty tool calls rate
  console.log('\n📊 Tool Usage Analysis (from al_messages)');
  console.log('-'.repeat(40));

  try {
    const toolCallsData = await getEmptyToolCallsRate();
    console.log(`Total assistant responses: ${toolCallsData.total}`);
    console.log(`Empty tool_calls responses: ${toolCallsData.emptyToolCalls}`);
    console.log(`Empty tool_calls rate: ${toolCallsData.rate}%`);

    if (parseFloat(toolCallsData.rate) > ALERT_THRESHOLD) {
      console.log(`\n⚠️  ALERT: Empty tool_calls rate (${toolCallsData.rate}%) exceeds threshold (${ALERT_THRESHOLD}%)`);
    }
  } catch (err) {
    console.log(`Error getting tool calls data: ${err.message}`);
  }

  // 2. Tool usage distribution
  console.log('\n📈 Tool Usage Distribution (Top 10)');
  console.log('-'.repeat(40));

  try {
    const distribution = await getToolUsageDistribution();
    for (const { tools, count } of distribution) {
      const display = tools === 'none' ? '(no tools)' : tools;
      console.log(`  ${count.toString().padStart(4)} - ${display}`);
    }
  } catch (err) {
    console.log(`Error getting distribution: ${err.message}`);
  }

  // 3. Car-specific questions without tools
  console.log('\n🚗 Car-Specific Questions Without Tool Calls');
  console.log('-'.repeat(40));

  try {
    const suspicious = await getCarSpecificQuestionsWithoutTools();
    if (suspicious.length === 0) {
      console.log('✅ No suspicious patterns found');
    } else {
      console.log(`⚠️  Found ${suspicious.length} potential issues:\n`);
      for (const s of suspicious.slice(0, 5)) {
        console.log(`  • "${s.query}..."`);
        console.log(`    Conversation: ${s.conversationTitle}`);
        console.log(`    Time: ${new Date(s.createdAt).toLocaleString()}\n`);
      }
      if (suspicious.length > 5) {
        console.log(`  ... and ${suspicious.length - 5} more`);
      }
    }
  } catch (err) {
    console.log(`Error checking car-specific questions: ${err.message}`);
  }

  // 4. Feedback summary
  console.log('\n👍 Feedback Summary');
  console.log('-'.repeat(40));

  try {
    const feedback = await getFeedbackSummary();
    console.log(`Total feedback: ${feedback.total}`);
    console.log(`Thumbs up: ${feedback.thumbsUp}`);
    console.log(`Thumbs down: ${feedback.thumbsDown}`);
    console.log(`Marked inaccurate: ${feedback.inaccurate}`);
    console.log(`Approval rate: ${feedback.approvalRate}%`);

    if (feedback.total === 0) {
      console.log('\n💡 Note: No feedback collected yet. Consider promoting the feedback buttons.');
    }
  } catch (err) {
    console.log(`Error getting feedback: ${err.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Monitoring complete.\n');
}

main().catch(console.error);
