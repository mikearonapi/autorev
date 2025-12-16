import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getPublicDbClient() {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function clampInt(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

/**
 * GET /api/parts/popular?carSlug=&limit=
 *
 * Returns "popular" parts for a car platform driven by fitments + pricing snapshots:
 * - prioritizes verified fitments
 * - highest confidence first
 * - includes latest pricing per part when available
 */
export async function GET(request) {
  try {
    const client = getPublicDbClient();
    if (!client) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const { searchParams } = new URL(request.url);
    const carSlug = (searchParams.get('carSlug') || '').trim();
    const limit = clampInt(searchParams.get('limit'), 1, 20, 8);

    if (!carSlug) return NextResponse.json({ error: 'carSlug is required' }, { status: 400 });

    const { data: carRow, error: cErr } = await client
      .from('cars')
      .select('id,slug')
      .eq('slug', carSlug)
      .maybeSingle();
    if (cErr) throw cErr;
    if (!carRow?.id) {
      return NextResponse.json({ carSlug, count: 0, results: [] });
    }

    const bestFitmentByPartId = new Map();
    const orderedPartIds = [];

    async function addFitments(whereVerified) {
      let fq = client
        .from('part_fitments')
        .select('part_id,car_id,car_variant_id,fitment_notes,requires_tune,install_difficulty,estimated_labor_hours,verified,confidence,source_url,updated_at')
        .eq('car_id', carRow.id)
        .order('verified', { ascending: false })
        .order('confidence', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(600);

      if (whereVerified === true) fq = fq.eq('verified', true);
      if (whereVerified === false) fq = fq.eq('verified', false);

      const { data: fitments, error: fErr } = await fq;
      if (fErr) throw fErr;

      for (const r of fitments || []) {
        const pid = r.part_id;
        if (!pid) continue;
        if (!bestFitmentByPartId.has(pid)) {
          bestFitmentByPartId.set(pid, { ...r, car_slug: carSlug });
          orderedPartIds.push(pid);
          if (orderedPartIds.length >= limit) return;
        }
      }
    }

    // Prefer verified fitments; if we don't have enough, fill with unverified.
    await addFitments(true);
    if (orderedPartIds.length < limit) await addFitments(false);

    if (orderedPartIds.length === 0) {
      return NextResponse.json({ carSlug, count: 0, results: [] });
    }

    const { data: parts, error: pErr } = await client
      .from('parts')
      .select('id,name,brand_name,part_number,category,description,quality_tier,street_legal,source_urls,confidence')
      .in('id', orderedPartIds)
      .eq('is_active', true)
      .limit(500);
    if (pErr) throw pErr;

    const partById = new Map((parts || []).map((p) => [p.id, p]));

    const { data: prices, error: prErr } = await client
      .from('part_pricing_snapshots')
      .select('part_id,vendor_name,product_url,price_cents,currency,recorded_at')
      .in('part_id', orderedPartIds)
      .order('recorded_at', { ascending: false })
      .limit(1500);
    if (prErr) throw prErr;

    const priceByPartId = new Map();
    for (const row of prices || []) {
      if (!priceByPartId.has(row.part_id)) priceByPartId.set(row.part_id, row);
    }

    const results = orderedPartIds
      .map((id) => {
        const part = partById.get(id);
        if (!part) return null;
        return {
          ...part,
          fitment: bestFitmentByPartId.get(id) || null,
          latest_price: priceByPartId.get(id) || null,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ carSlug, count: results.length, results });
  } catch (err) {
    console.error('[api/parts/popular] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}



