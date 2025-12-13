/**
 * User AL Balance API
 * 
 * GET /api/users/[userId]/al-credits
 * Returns the user's current AL balance and usage info (token-based)
 */

import { NextResponse } from 'next/server';
import { getUserBalance } from '@/lib/alUsageService';
import { formatCentsAsDollars, formatCentsCompact } from '@/lib/alConfig';

export async function GET(request, { params }) {
  try {
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
      monthlyAllocationFormatted: formatCentsAsDollars(balanceInfo.monthlyAllocationCents),
      spentThisMonthCents: balanceInfo.spentThisMonthCents || 0,
      spentThisMonthFormatted: formatCentsAsDollars(balanceInfo.spentThisMonthCents || 0),
      purchasedCents: balanceInfo.purchasedCents || 0,
      inputTokensThisMonth: balanceInfo.inputTokensThisMonth || 0,
      outputTokensThisMonth: balanceInfo.outputTokensThisMonth || 0,
      messagesThisMonth: balanceInfo.messagesThisMonth || 0,
      tank: balanceInfo.tank,
      lastRefillDate: balanceInfo.lastRefillDate,
      // Legacy compatibility (for old UI during transition)
      credits: balanceInfo.balanceCents,
      usedThisMonth: Math.round(balanceInfo.spentThisMonthCents || 0),
    });
  } catch (err) {
    console.error('[AL Balance API] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}








