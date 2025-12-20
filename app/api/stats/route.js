import { NextResponse } from 'next/server';
import { getPlatformStats } from '@/lib/statsService';
import { withErrorLogging } from '@/lib/serverErrorLogger';

async function handleGet() {
  const stats = await getPlatformStats();
  return NextResponse.json(stats, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}

export const GET = withErrorLogging(handleGet, { route: 'stats', feature: 'analytics' });











