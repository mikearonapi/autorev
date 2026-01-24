/**
 * User AL Balance API
 * 
 * GET /api/users/[userId]/al-credits
 * Returns the user's current AL balance and usage info (token-based)
 * 
 * Auth: User must be authenticated and can only access their own credits
 */

import { NextResponse } from 'next/server';
import { createAuthenticatedClient, createServerSupabaseClient, getBearerToken } from '@/lib/supabaseServer';
import { errors } from '@/lib/apiErrors';
import { getUserBalance, getDailyUsage } from '@/lib/alUsageService';
import { formatCentsAsDollars, formatCentsCompact } from '@/lib/alConfig';
import { withErrorLogging } from '@/lib/serverErrorLogger';

async function handleGet(request, { params }) {
  const { userId } = await params;
  
  if (!userId) {
    return errors.missingField('userId');
  }

  // Get authenticated user
  const bearerToken = getBearerToken(request);
  const supabase = bearerToken 
    ? createAuthenticatedClient(bearerToken) 
    : await createServerSupabaseClient();

  if (!supabase) {
    return errors.serviceUnavailable('Authentication service');
  }

  const { data: { user }, error: authError } = bearerToken
    ? await supabase.auth.getUser(bearerToken)
    : await supabase.auth.getUser();
  
  if (authError || !user) {
    return errors.unauthorized();
  }
  
  // Verify the authenticated user matches the userId param
  if (user.id !== userId) {
    return errors.forbidden('Not authorized to view this user\'s AL credits');
  }

  // Fetch both balance and daily usage in parallel
  const [balanceInfo, dailyUsageInfo] = await Promise.all([
    getUserBalance(userId),
    getDailyUsage(userId),
  ]);

  return NextResponse.json({
    // New token-based fields
    balanceCents: balanceInfo.balanceCents,
    balanceFormatted: formatCentsAsDollars(balanceInfo.balanceCents),
    balanceCompact: formatCentsCompact(balanceInfo.balanceCents),
    plan: balanceInfo.plan,
    planName: balanceInfo.planName,
    monthlyAllocationCents: balanceInfo.monthlyAllocationCents,
    monthlyAllocationFormatted: balanceInfo.isUnlimited ? '∞' : formatCentsAsDollars(balanceInfo.monthlyAllocationCents),
    spentThisMonthCents: balanceInfo.spentThisMonthCents || 0,
    spentThisMonthFormatted: formatCentsAsDollars(balanceInfo.spentThisMonthCents || 0),
    purchasedCents: balanceInfo.purchasedCents || 0,
    inputTokensThisMonth: balanceInfo.inputTokensThisMonth || 0,
    outputTokensThisMonth: balanceInfo.outputTokensThisMonth || 0,
    messagesThisMonth: balanceInfo.messagesThisMonth || 0,
    tank: balanceInfo.tank,
    lastRefillDate: balanceInfo.lastRefillDate,
    // Unlimited/Founder status
    isUnlimited: balanceInfo.isUnlimited || false,
    // Daily usage for counter UI
    dailyUsage: {
      queriesToday: dailyUsageInfo.queriesToday || 0,
      isBeta: dailyUsageInfo.isBeta ?? true,
      isUnlimited: dailyUsageInfo.isUnlimited || balanceInfo.isUnlimited || false,
    },
    // Legacy compatibility (for old UI during transition)
    credits: balanceInfo.balanceCents,
    usedThisMonth: Math.round(balanceInfo.spentThisMonthCents || 0),
  });
}

export const GET = withErrorLogging(handleGet, { route: 'users/al-credits', feature: 'al' });








