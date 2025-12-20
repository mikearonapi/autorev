import { NextResponse } from 'next/server';
import { getPlatformStats } from '@/lib/statsService';

export async function GET() {
  try {
    const stats = await getPlatformStats();
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('[API/stats] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}










