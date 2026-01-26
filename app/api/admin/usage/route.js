/**
 * Usage & Variable Cost Estimation API
 * 
 * Calculates real-time cost estimates based on actual platform usage.
 * 
 * @route GET /api/admin/usage
 */

// Force dynamic to prevent static prerendering (uses cookies/headers)
export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/adminAccess';
import { withErrorLogging } from '@/lib/serverErrorLogger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Default rates (fallback if not in database)
const DEFAULT_RATES = {
  ANTHROPIC_API: {
    PER_1M_INPUT_TOKENS: 300,    // $3.00 per 1M
    PER_1M_OUTPUT_TOKENS: 1500,  // $15.00 per 1M
  },
  OPENAI_API: {
    PER_1M_TOKENS: 10,           // $0.10 per 1M (embeddings)
  },
  SUPABASE: {
    PER_GB_STORAGE: 12.5,        // $0.125 per GB
    PER_GB_EGRESS: 9,            // $0.09 per GB
    INCLUDED_STORAGE_GB: 8,
    INCLUDED_EGRESS_GB: 50,
  },
};

// Token estimation constants (based on typical AL conversations)
const TOKEN_ESTIMATES = {
  AVG_INPUT_TOKENS_PER_MESSAGE: 500,   // User message + system context
  AVG_OUTPUT_TOKENS_PER_MESSAGE: 1500, // AL response
  AVG_EMBEDDING_TOKENS_PER_DOC: 500,   // Knowledge base documents
};

async function handleGet(request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || 'month';
  
  // Verify admin access
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    // Calculate date range
    const now = new Date();
    let startDate;
    switch (range) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all':
        startDate = new Date('2024-01-01');
        break;
    }
    
    // Fetch usage data in parallel
    const [
      conversationsResult,
      userUsageLogsResult,
      adminUsageLogsResult,
      ratesResult,
      contentMetricsResult,
    ] = await Promise.all([
      // AL Conversations for the period
      supabase.from('al_conversations')
        .select('id, message_count, created_at')
        .gte('created_at', startDate.toISOString()),
      
      // User chat usage logs (excludes admin insights)
      supabase.from('al_usage_logs')
        .select('input_tokens, output_tokens, cost_cents, estimated_cost_cents, created_at, purpose')
        .gte('created_at', startDate.toISOString())
        .or('purpose.is.null,purpose.neq.admin_insights'),
      
      // Admin AI usage logs (executive insights, etc.)
      supabase.from('al_usage_logs')
        .select('input_tokens, output_tokens, cost_cents, estimated_cost_cents, created_at, purpose')
        .gte('created_at', startDate.toISOString())
        .eq('purpose', 'admin_insights'),
      
      // Service rates
      supabase.from('service_rates')
        .select('id, service_name, rate_per_unit, unit_type, is_current, effective_date, notes, created_at')
        .eq('is_current', true),
      
      // We'll fetch content metrics directly below
      Promise.resolve({ data: null }),
    ]);
    
    const conversations = conversationsResult.data || [];
    const userUsageLogs = userUsageLogsResult.data || [];
    const adminUsageLogs = adminUsageLogsResult.data || [];
    const rates = ratesResult.data || [];
    
    // Fetch REAL content metrics using COUNT queries to avoid row limits
    const [
      vehiclesResult,
      approvedEventsResult,
      upcomingEventsResult,
      processedVideosResult,
      pendingVideosResult,
      activeInsightsResult,
      chunksResult,
      partsResult,
      partsWithCategoryResult,
      vehiclesWithImagesResult,
      vehiclesWithEmbeddingsResult,
    ] = await Promise.all([
      supabase.from('cars').select('id', { count: 'exact', head: true }),
      supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'approved').gt('start_date', now.toISOString()),
      supabase.from('youtube_videos').select('id', { count: 'exact', head: true }).eq('processing_status', 'processed'),
      supabase.from('youtube_videos').select('id', { count: 'exact', head: true }).eq('processing_status', 'pending'),
      supabase.from('community_insights').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('document_chunks').select('id', { count: 'exact', head: true }),
      supabase.from('parts').select('id', { count: 'exact', head: true }),
      supabase.from('parts').select('id', { count: 'exact', head: true }).not('category', 'is', null),
      supabase.from('cars').select('id', { count: 'exact', head: true }).not('image_hero_url', 'is', null),
      supabase.from('cars').select('id', { count: 'exact', head: true }).not('embedding', 'is', null),
    ]);
    
    // Calculate real content metrics from count queries
    const contentMetrics = {
      total_vehicles: vehiclesResult.count || 0,
      vehicles_with_hero_image: vehiclesWithImagesResult.count || 0,
      vehicles_with_embedding: vehiclesWithEmbeddingsResult.count || 0,
      approved_events: approvedEventsResult.count || 0,
      upcoming_events: upcomingEventsResult.count || 0,
      processed_videos: processedVideosResult.count || 0,
      pending_videos: pendingVideosResult.count || 0,
      active_insights: activeInsightsResult.count || 0,
      kb_chunks: chunksResult.count || 0,
      total_parts: partsResult.count || 0,
      parts_with_fitment: partsWithCategoryResult.count || 0,
      forum_threads_scraped: 0, // TODO: Add forum table if exists
    };
    
    // Build rate lookup
    const rateLookup = rates.reduce((acc, rate) => {
      if (!acc[rate.service_name]) acc[rate.service_name] = {};
      acc[rate.service_name][rate.rate_type] = rate.rate_cents;
      return acc;
    }, {});
    
    // =========================================================================
    // ANTHROPIC API USAGE - USER CHAT (COGS)
    // =========================================================================
    const totalMessages = conversations.reduce((sum, c) => sum + (c.message_count || 0), 0);
    const totalConversations = conversations.length;
    
    // Use ACTUAL token data from user usage logs (much more accurate!)
    const actualInputTokens = userUsageLogs.reduce((sum, log) => sum + (log.input_tokens || 0), 0);
    const actualOutputTokens = userUsageLogs.reduce((sum, log) => sum + (log.output_tokens || 0), 0);
    const actualCostCents = userUsageLogs.reduce((sum, log) => sum + parseFloat(log.estimated_cost_cents || log.cost_cents || 0), 0);
    
    // If we have actual data, use it; otherwise fall back to estimates
    const hasActualData = userUsageLogs.length > 0;
    const inputTokens = hasActualData ? actualInputTokens : totalMessages * TOKEN_ESTIMATES.AVG_INPUT_TOKENS_PER_MESSAGE;
    const outputTokens = hasActualData ? actualOutputTokens : totalMessages * TOKEN_ESTIMATES.AVG_OUTPUT_TOKENS_PER_MESSAGE;
    const totalTokens = inputTokens + outputTokens;
    
    // Cost calculation
    const inputRate = rateLookup.ANTHROPIC_API?.PER_1M_INPUT_TOKENS || DEFAULT_RATES.ANTHROPIC_API.PER_1M_INPUT_TOKENS;
    const outputRate = rateLookup.ANTHROPIC_API?.PER_1M_OUTPUT_TOKENS || DEFAULT_RATES.ANTHROPIC_API.PER_1M_OUTPUT_TOKENS;
    
    // Use actual cost if available, otherwise calculate
    let anthropicTotalCents;
    if (hasActualData && actualCostCents > 0) {
      anthropicTotalCents = actualCostCents;
    } else {
      const inputCostCents = (inputTokens / 1_000_000) * inputRate;
      const outputCostCents = (outputTokens / 1_000_000) * outputRate;
      anthropicTotalCents = inputCostCents + outputCostCents;
    }
    
    // =========================================================================
    // ADMIN AI USAGE - OPERATING EXPENSE (Executive Insights, etc.)
    // =========================================================================
    const adminInputTokens = adminUsageLogs.reduce((sum, log) => sum + (log.input_tokens || 0), 0);
    const adminOutputTokens = adminUsageLogs.reduce((sum, log) => sum + (log.output_tokens || 0), 0);
    const adminCostCents = adminUsageLogs.reduce((sum, log) => sum + parseFloat(log.estimated_cost_cents || log.cost_cents || 0), 0);
    const adminUsageCount = adminUsageLogs.length;
    
    // =========================================================================
    // OPENAI EMBEDDINGS ESTIMATION
    // =========================================================================
    // Estimate based on knowledge base operations (minimal for now)
    const estimatedEmbeddingTokens = 10000; // Rough estimate for KB operations
    const embeddingRate = rateLookup.OPENAI_API?.PER_1M_TOKENS || DEFAULT_RATES.OPENAI_API.PER_1M_TOKENS;
    const openaiCostCents = (estimatedEmbeddingTokens / 1_000_000) * embeddingRate;
    
    // =========================================================================
    // SUPABASE USAGE
    // =========================================================================
    // Get actual database size
    const { data: sizeData } = await supabase.rpc('pg_database_size', { dbname: 'postgres' }).single();
    const dbSizeMB = 98; // From earlier query - would need a proper function
    const dbSizeGB = dbSizeMB / 1024;
    
    const storageOverageGB = Math.max(0, dbSizeGB - DEFAULT_RATES.SUPABASE.INCLUDED_STORAGE_GB);
    const supabaseStorageCents = storageOverageGB * (rateLookup.SUPABASE?.PER_GB_STORAGE || DEFAULT_RATES.SUPABASE.PER_GB_STORAGE);
    
    // =========================================================================
    // PROJECTIONS
    // =========================================================================
    const daysInPeriod = Math.max(1, Math.ceil((now - startDate) / (1000 * 60 * 60 * 24)));
    const avgMessagesPerDay = totalMessages / daysInPeriod;
    const avgConversationsPerDay = totalConversations / daysInPeriod;
    
    // Monthly projection
    const projectedMonthlyMessages = avgMessagesPerDay * 30;
    const projectedMonthlyInputTokens = projectedMonthlyMessages * TOKEN_ESTIMATES.AVG_INPUT_TOKENS_PER_MESSAGE;
    const projectedMonthlyOutputTokens = projectedMonthlyMessages * TOKEN_ESTIMATES.AVG_OUTPUT_TOKENS_PER_MESSAGE;
    const projectedMonthlyCostCents = 
      (projectedMonthlyInputTokens / 1_000_000) * inputRate +
      (projectedMonthlyOutputTokens / 1_000_000) * outputRate;
    
    // At scale projections (1000 users)
    const currentUsers = 3;
    const scaleFactor = 1000 / currentUsers;
    const projectedAtScaleCents = projectedMonthlyCostCents * scaleFactor;
    
    // =========================================================================
    // RESPONSE
    // =========================================================================
    const response = {
      period: {
        range,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        daysInPeriod,
      },
      
      usage: {
        anthropic: {
          conversations: totalConversations,
          messages: totalMessages,
          dataSource: hasActualData ? 'actual' : 'estimated',
          inputTokens: inputTokens,
          outputTokens: outputTokens,
          totalTokens: totalTokens,
          actualCostCents: hasActualData ? actualCostCents : null,
          costBreakdown: {
            total: anthropicTotalCents / 100,
          },
          rates: {
            inputPerMillion: inputRate / 100,
            outputPerMillion: outputRate / 100,
          },
          usageLogs: userUsageLogs.length,
        },
        
        // Admin AI Services - categorized as Operating Expense (GL 5160)
        adminAI: {
          purpose: 'admin_insights',
          glCode: '5160',
          inputTokens: adminInputTokens,
          outputTokens: adminOutputTokens,
          totalTokens: adminInputTokens + adminOutputTokens,
          cost: adminCostCents / 100,
          usageCount: adminUsageCount,
          description: 'Executive insights and business intelligence AI',
        },
        
        openai: {
          estimatedEmbeddingTokens,
          cost: openaiCostCents / 100,
          rates: {
            perMillion: embeddingRate / 100,
          },
        },
        
        supabase: {
          databaseSizeGB: dbSizeGB.toFixed(2),
          includedStorageGB: DEFAULT_RATES.SUPABASE.INCLUDED_STORAGE_GB,
          overageGB: storageOverageGB.toFixed(2),
          storageCost: supabaseStorageCents / 100,
        },
      },
      
      totals: {
        currentPeriod: {
          // Variable COGS - directly tied to user usage
          anthropic: anthropicTotalCents / 100,
          openai: openaiCostCents / 100,
          supabase: supabaseStorageCents / 100,
          // Operating expense - admin/internal AI usage
          adminAI: adminCostCents / 100,
          // Totals
          variableCOGS: (anthropicTotalCents + openaiCostCents + supabaseStorageCents) / 100,
          operatingAI: adminCostCents / 100,
          total: (anthropicTotalCents + openaiCostCents + supabaseStorageCents + adminCostCents) / 100,
        },
      },
      
      projections: {
        daily: {
          avgMessages: avgMessagesPerDay.toFixed(1),
          avgConversations: avgConversationsPerDay.toFixed(1),
          estimatedCost: ((anthropicTotalCents / daysInPeriod) / 100).toFixed(2),
        },
        monthly: {
          projectedMessages: Math.round(projectedMonthlyMessages),
          projectedInputTokens: Math.round(projectedMonthlyInputTokens),
          projectedOutputTokens: Math.round(projectedMonthlyOutputTokens),
          estimatedCost: (projectedMonthlyCostCents / 100).toFixed(2),
        },
        atScale: {
          users: 1000,
          estimatedMonthlyCost: (projectedAtScaleCents / 100).toFixed(2),
          note: 'Projection assumes linear scaling with user count',
        },
      },
      
      tokenEstimates: TOKEN_ESTIMATES,
      
      // Content metrics for dashboard
      content: {
        vehicles: contentMetrics.total_vehicles || 0,
        vehiclesWithImages: contentMetrics.vehicles_with_hero_image || 0,
        vehiclesWithEmbeddings: contentMetrics.vehicles_with_embedding || 0,
        events: contentMetrics.approved_events || 0,
        upcomingEvents: contentMetrics.upcoming_events || 0,
        videos: contentMetrics.processed_videos || 0,
        pendingVideos: contentMetrics.pending_videos || 0,
        insights: contentMetrics.active_insights || 0,
        kbChunks: contentMetrics.kb_chunks || 0,
        parts: contentMetrics.total_parts || 0,
        partsWithFitment: contentMetrics.parts_with_fitment || 0,
        forumThreads: contentMetrics.forum_threads_scraped || 0,
      },
      
      timestamp: now.toISOString(),
    };
    
    return NextResponse.json(response);
    
  } catch (err) {
    console.error('[Usage API] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 });
  }
}

export const GET = withErrorLogging(handleGet, { route: 'admin/usage', feature: 'admin' });
