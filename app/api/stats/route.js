import { NextResponse } from 'next/server';

import { withErrorLogging } from '@/lib/serverErrorLogger';
import { getPlatformStats } from '@/lib/statsService';

async function handleGet() {
  const stats = await getPlatformStats();
  return NextResponse.json(stats, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}

export const GET = withErrorLogging(handleGet, { route: 'stats', feature: 'analytics' });













