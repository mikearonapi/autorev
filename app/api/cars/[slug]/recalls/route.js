import { NextResponse } from 'next/server';

import { resolveCarId } from '@/lib/carResolver';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * GET /api/cars/[slug]/recalls
 *
 * Returns cached recall campaigns for a car from `car_recalls`.
 * This is distinct from VIN-specific open recalls (which require VIN lookup).
 *
 * Query params:
 * - limit (default 50, max 200)
 * - includeIncomplete (default true) -> when false, filters out is_incomplete=true rows
 */
async function handleGet(request, { params }) {
  const slug = params?.slug;

  if (!slug) {
    return NextResponse.json({ error: 'Car slug is required', code: 'BAD_REQUEST' }, { status: 400 });
  }

  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ recalls: [], count: 0 }, { status: 200 });
  }

  try {
    // Resolve car_id from slug (car_slug column no longer exists on car_recalls)
    const carId = await resolveCarId(slug);
    if (!carId) {
      return NextResponse.json({ recalls: [], count: 0 }, { status: 200 });
    }
    
    const { searchParams } = new URL(request.url);
    const limitRaw = Number(searchParams.get('limit') || 50);
    const limit = Math.max(1, Math.min(Number.isFinite(limitRaw) ? limitRaw : 50, 200));
    const includeIncomplete = searchParams.get('includeIncomplete') !== 'false';

    let q = supabase
      .from('car_recalls')
      .select(
        `
          recall_campaign_number,
          recall_date,
          campaign_number,
          report_received_date,
          component,
          summary,
          consequence,
          remedy,
          manufacturer,
          notes,
          source_url,
          is_incomplete
        `
      )
      .eq('car_id', carId)
      .order('recall_date', { ascending: false, nullsFirst: false })
      .order('report_received_date', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (!includeIncomplete) q = q.eq('is_incomplete', false);

    const { data, error } = await q;
    if (error) {
      console.error('[API/recalls] Error:', error);
      throw error;
    }

    const recalls = (data || []).map((r) => ({
      car_slug: slug,
      recall_campaign_number: r.recall_campaign_number || r.campaign_number,
      recall_date: r.recall_date || r.report_received_date,
      component: r.component,
      summary: r.summary,
      consequence: r.consequence,
      remedy: r.remedy,
      manufacturer: r.manufacturer || null,
      notes: r.notes || null,
      source_url: r.source_url || null,
      // Compatibility / debug
      is_incomplete: Boolean(r.is_incomplete),
    }));

    return NextResponse.json({ recalls, count: recalls.length });
  } catch (err) {
    console.error('[API/recalls] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch recalls', code: 'SERVER_ERROR' }, { status: 500 });
  }
}

export const GET = withErrorLogging(handleGet, { route: 'cars/[slug]/recalls', feature: 'browse-cars' });















