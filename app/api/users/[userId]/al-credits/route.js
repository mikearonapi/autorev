/**
 * User AL Balance API
 * 
 * GET /api/users/[userId]/al-credits
 * Returns the user's current AL balance and usage info (token-based)
 */

import { NextResponse } from 'next/server';
import { getUserBalance } from '@/lib/alUsageService';
import { formatCentsAsDollars, formatCentsCompact } from '@/lib/alConfig';
import { withErrorLogging } from '@/lib/serverErrorLogger';

async function handleGet(request, { params }) {
  const { userId } = await params;
  
  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }

  const balanceInfo = await getUserBalance(userId);

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
    // Legacy compatibility (for old UI during transition)
    credits: balanceInfo.balanceCents,
    usedThisMonth: Math.round(balanceInfo.spentThisMonthCents || 0),
  });
}

export const GET = withErrorLogging(handleGet, { route: 'users/al-credits', feature: 'al' });








