/**
 * Admin AI Insights API
 * 
 * Uses Claude to generate strategic business insights for executives.
 * Costs are tracked separately in al_usage_logs with purpose='admin_insights'.
 * 
 * @route GET /api/admin/insights - Get cached or generate new insights
 * @route POST /api/admin/insights - Force regenerate insights
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAccess';
import Anthropic from '@anthropic-ai/sdk';
import { withErrorLogging } from '@/lib/serverErrorLogger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

// Cache duration: 24 hours (in milliseconds)
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

// Cost tracking: Claude 3.5 Sonnet pricing
const PRICING = {
  inputPerMillion: 3.00,  // $3 per 1M input tokens
  outputPerMillion: 15.00, // $15 per 1M output tokens
};

/**
 * Build the business context prompt from dashboard data
 */
function buildBusinessContext(data) {
  const { users, engagement, financials, content, health, feedback, retention } = data;
  
  return `
You are a strategic business analyst and growth advisor for AutoRev, an automotive enthusiast platform with:
- An AI mechanic assistant called "AL" that helps users diagnose issues and learn about their vehicles
- A comprehensive vehicle database with specs, performance data, and modifications
- Community features including events, forums, and user garages
- A parts marketplace and tuning shop

Your role is to provide actionable executive insights for the CEO/COO/CFO to grow the business.

## Current Business Metrics

### User Metrics
- Total Users: ${users?.total || 0}
- New Users (this period): ${users?.newThisPeriod || 0}
- Growth Rate: ${users?.growthPercent || 0}%
- Weekly Active Users: ${engagement?.weeklyActiveUsers || 0}
- Monthly Active Users: ${engagement?.monthlyActiveUsers || users?.total || 0}
- Users who engaged with AL: ${engagement?.alUsers || 0}

### User Engagement
- AL Conversations: ${engagement?.alConversations || 0}
- Conversations per AL user: ${engagement?.alUsers > 0 ? (engagement.alConversations / engagement.alUsers).toFixed(1) : 0}
- Avg session depth: ${engagement?.avgSessionDepth || 'unknown'}

### Retention (if available)
- D1 Retention: ${retention?.d1 || 'unknown'}%
- D7 Retention: ${retention?.d7 || 'unknown'}%
- D30 Retention: ${retention?.d30 || 'unknown'}%

### Financials (in dollars)
- Monthly Revenue: $${((financials?.pnl?.revenue?.total || 0) / 100).toFixed(2)}
- Monthly Operating Costs: $${((financials?.pnl?.operatingExpenses?.total || 0) / 100).toFixed(2)}
- R&D Investment: $${((financials?.pnl?.productDevelopment || 0) / 100).toFixed(2)}
- Net Income: $${((financials?.pnl?.netIncome || 0) / 100).toFixed(2)}
- Paying Users: ${financials?.executive?.payingUsers || 0}
- Conversion Rate: ${financials?.executive?.conversionRate || 0}%
- Break-Even Users Needed: ${financials?.executive?.breakEvenUsers || 0}

### Content Library (valuable for SEO & engagement)
- Vehicles in database: ${content?.vehicles || 0}
- Events: ${content?.events || 0}
- YouTube Videos: ${content?.videos || 0}
- Parts catalog: ${content?.parts || 0}
- Knowledge base documents: ${content?.kbChunks || 0}
- Community Insights: ${content?.insights || 0}

### User Feedback & Sentiment
${feedback?.recent?.length > 0 
  ? feedback.recent.map(f => `- "${f.message}" (${f.category}, ${f.sentiment || 'neutral'})`).join('\n')
  : '- No recent feedback available'
}
- Total feedback items: ${feedback?.total || 0}
- Feature requests: ${feedback?.featureRequests || 0}
- Bug reports: ${feedback?.bugs || 0}
- Positive sentiment: ${feedback?.positive || 0}
- Negative sentiment: ${feedback?.negative || 0}

### System Health
- Unresolved Errors: ${health?.errors?.unresolved || 0}
- Blocking Issues: ${health?.errors?.blocking || 0}
- API uptime: ${health?.uptime || '99.9'}%

## Analysis Request

Provide 5-7 strategic insights covering ALL of these areas:

### 1. GROWTH & MARKETING STRATEGY
- How to acquire users cost-effectively
- Forum posting strategy (which car forums to target: Bimmerpost, Rennlist, ClubLexus, etc.)
- Social media strategy (Facebook groups, Instagram, TikTok, YouTube)
- SEO opportunities based on our content library
- Referral program ideas
- Partnership opportunities (parts vendors, tuning shops, events)

### 2. PRODUCT-MARKET FIT
- What does user behavior tell us about product value?
- Which features are driving engagement?
- What's working vs. not working?
- Analyze feedback themes and user requests

### 3. MONETIZATION & REVENUE
- Conversion optimization strategies
- Pricing considerations
- New revenue stream opportunities
- When to push monetization vs. grow user base

### 4. USER RETENTION & ENGAGEMENT
- How to improve retention metrics
- Re-engagement strategies for churned users
- Feature suggestions to increase stickiness
- Community building tactics

### 5. OPERATIONAL EFFICIENCY
- Cost optimization opportunities
- Technical debt and system health
- Automation opportunities
- Resource allocation recommendations

### 6. COMPETITIVE POSITIONING
- How to differentiate from competitors
- Unique value proposition messaging
- Market positioning advice

For each insight:
1. Be SPECIFIC and ACTIONABLE - no generic advice
2. Reference the actual data/numbers provided
3. Consider the automotive enthusiast audience
4. Think like a growth hacker and startup advisor

Respond in JSON format:
{
  "insights": [
    {
      "type": "positive|warning|critical|info|growth",
      "category": "Marketing|Growth|Product|Revenue|Retention|Operations|Competitive",
      "title": "Short headline (max 50 chars)",
      "observation": "What the data shows (1-2 sentences)",
      "impact": "Why this matters for the business (1 sentence)",
      "recommendation": "Specific action with details (2-3 sentences)",
      "priority": "critical|high|medium|low",
      "effort": "low|medium|high",
      "timeframe": "immediate|this_week|this_month|this_quarter"
    }
  ],
  "marketingPlan": {
    "forums": ["List of specific car forums to target"],
    "socialMedia": ["Specific platform tactics"],
    "contentStrategy": "Brief content marketing recommendation",
    "partnerships": ["Potential partnership ideas"]
  },
  "summary": "2-3 sentence executive summary of business health and top priority"
}
`;
}

/**
 * Track AI usage for cost accounting
 */
async function trackUsage(supabase, userId, inputTokens, outputTokens, model) {
  const inputCost = (inputTokens / 1000000) * PRICING.inputPerMillion;
  const outputCost = (outputTokens / 1000000) * PRICING.outputPerMillion;
  const totalCost = inputCost + outputCost;
  
  try {
    await supabase.from('al_usage_logs').insert({
      user_id: userId,
      model: model || 'claude-3-5-sonnet-20241022',
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens,
      estimated_cost_cents: Math.round(totalCost * 100),
      purpose: 'admin_insights', // Special category for admin AI usage
      metadata: {
        feature: 'executive_insights',
        timestamp: new Date().toISOString(),
      },
    });
    
    console.log(`[Admin Insights] Tracked usage: ${inputTokens} in, ${outputTokens} out, $${totalCost.toFixed(4)}`);
  } catch (err) {
    console.error('[Admin Insights] Failed to track usage:', err);
  }
  
  return totalCost;
}

/**
 * Get cached insights if still valid
 */
async function getCachedInsights(supabase) {
  const CACHE_COLS = 'id, insights_json, generated_at, expires_at, created_at';
  
  try {
    const { data, error } = await supabase
      .from('admin_insights_cache')
      .select(CACHE_COLS)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) return null;
    
    // Check if cache is still valid
    const cacheAge = Date.now() - new Date(data.generated_at).getTime();
    if (cacheAge > CACHE_DURATION_MS) return null;
    
    return data;
  } catch {
    return null;
  }
}

/**
 * Save insights to cache
 */
async function cacheInsights(supabase, insights, cost) {
  try {
    await supabase.from('admin_insights_cache').insert({
      insights: insights,
      generated_at: new Date().toISOString(),
      cost_cents: Math.round(cost * 100),
    });
  } catch (err) {
    console.error('[Admin Insights] Failed to cache:', err);
  }
}

/**
 * Generate AI insights using Claude
 */
async function generateInsights(businessData, supabase, userId) {
  if (!anthropicApiKey) {
    throw new Error('Anthropic API key not configured');
  }
  
  const anthropic = new Anthropic({ apiKey: anthropicApiKey });
  const prompt = buildBusinessContext(businessData);
  
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });
  
  // Extract usage
  const inputTokens = response.usage?.input_tokens || 0;
  const outputTokens = response.usage?.output_tokens || 0;
  
  // Track cost
  const cost = await trackUsage(supabase, userId, inputTokens, outputTokens, response.model);
  
  // Parse response
  const content = response.content[0]?.text || '';
  let insights;
  
  try {
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      insights = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('No JSON found in response');
    }
  } catch (parseErr) {
    console.error('[Admin Insights] Parse error:', parseErr);
    // Fallback to basic structure
    insights = {
      insights: [{
        type: 'info',
        category: 'Status',
        title: 'Analysis Complete',
        observation: content.substring(0, 200),
        impact: 'Review the detailed analysis.',
        recommendation: 'Check the full response.',
        priority: 'medium',
      }],
      summary: 'Analysis generated but parsing failed.',
    };
  }
  
  // Cache results
  await cacheInsights(supabase, insights, cost);
  
  return {
    ...insights,
    meta: {
      generated_at: new Date().toISOString(),
      tokens_used: inputTokens + outputTokens,
      cost_usd: cost.toFixed(4),
      cached: false,
    },
  };
}

// GET: Retrieve insights (cached or generate)
async function handleGet(request) {
  // Verify admin access
  const denied = await requireAdmin(request);
  if (denied) return denied;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Check for cached insights first
    const cached = await getCachedInsights(supabase);
    if (cached) {
      return NextResponse.json({
        ...cached.insights,
        meta: {
          generated_at: cached.generated_at,
          cost_usd: (cached.cost_cents / 100).toFixed(4),
          cached: true,
          cache_age_hours: ((Date.now() - new Date(cached.generated_at).getTime()) / (1000 * 60 * 60)).toFixed(1),
        },
      });
    }
    
    // No cache - return message to use POST to generate
    return NextResponse.json({
      insights: [],
      summary: 'No cached insights available.',
      meta: {
        cached: false,
        message: 'Use POST to generate new AI insights.',
      },
    });
    
  } catch (err) {
    console.error('[Admin Insights API] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 });
  }
}

// POST: Force generate new insights
async function handlePost(request) {
  // Verify admin access
  const denied = await requireAdmin(request);
  if (denied) return denied;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Get user for tracking
    const authHeader = request.headers.get('authorization');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    // Get business data from request body
    const businessData = await request.json();
    
    if (!businessData || Object.keys(businessData).length === 0) {
      return NextResponse.json({ 
        error: 'Business data required. Include users, engagement, financials, content, health.' 
      }, { status: 400 });
    }
    
    // Enrich with additional data from database
    const enrichedData = await enrichBusinessData(businessData, supabase);
    
    // Generate new insights
    const insights = await generateInsights(enrichedData, supabase, user.id);
    
    return NextResponse.json(insights);
    
  } catch (err) {
    console.error('[Admin Insights API] Error:', err);
    return NextResponse.json({ 
      error: 'Failed to generate insights' 
    }, { status: 500 });
  }
}

/**
 * Enrich business data with feedback, retention, and other metrics from database
 */
async function enrichBusinessData(baseData, supabase) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Fetch user feedback
  const [feedbackResult, feedbackCountsResult, retentionResult] = await Promise.all([
    // Recent feedback (last 30 days, non-error)
    supabase.from('user_feedback')
      .select('message, category, created_at, page_url')
      .neq('category', 'auto-error')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10),
    
    // Feedback counts by category
    supabase.from('user_feedback')
      .select('category')
      .neq('category', 'auto-error')
      .gte('created_at', thirtyDaysAgo.toISOString()),
    
    // User retention - users who returned after signup
    supabase.from('user_profiles')
      .select('created_at, last_active_at')
      .not('last_active_at', 'is', null),
  ]);
  
  // Process feedback data
  const feedbackItems = feedbackResult.data || [];
  const allFeedback = feedbackCountsResult.data || [];
  
  const feedbackCounts = allFeedback.reduce((acc, f) => {
    acc[f.category] = (acc[f.category] || 0) + 1;
    return acc;
  }, {});
  
  // Calculate basic retention (simplified)
  const retentionUsers = retentionResult.data || [];
  let d1Count = 0, d7Count = 0, d30Count = 0;
  
  retentionUsers.forEach(u => {
    if (!u.created_at || !u.last_active_at) return;
    const created = new Date(u.created_at);
    const lastActive = new Date(u.last_active_at);
    const daysSinceCreation = Math.floor((lastActive - created) / (1000 * 60 * 60 * 24));
    
    if (daysSinceCreation >= 1) d1Count++;
    if (daysSinceCreation >= 7) d7Count++;
    if (daysSinceCreation >= 30) d30Count++;
  });
  
  const totalUsers = retentionUsers.length || 1;
  
    return {
    ...baseData,
    feedback: {
      recent: feedbackItems.map(f => ({
        message: f.message?.substring(0, 150) || '',
        category: f.category,
        page: f.page_url,
      })),
      total: allFeedback.length,
      featureRequests: feedbackCounts['feature-request'] || 0,
      bugs: feedbackCounts['bug'] || 0,
      positive: feedbackCounts['praise'] || feedbackCounts['positive'] || 0,
      negative: feedbackCounts['complaint'] || feedbackCounts['negative'] || 0,
      suggestions: feedbackCounts['suggestion'] || 0,
    },
    retention: {
      d1: ((d1Count / totalUsers) * 100).toFixed(1),
      d7: ((d7Count / totalUsers) * 100).toFixed(1),
      d30: ((d30Count / totalUsers) * 100).toFixed(1),
    },
  };
}

export const GET = withErrorLogging(handleGet, { route: 'admin/insights', feature: 'admin' });
export const POST = withErrorLogging(handlePost, { route: 'admin/insights', feature: 'admin' });
