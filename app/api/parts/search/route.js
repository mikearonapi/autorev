import { NextResponse } from 'next/server';
import { getPublicClient, isConfigured } from '@/lib/supabaseServer';
import { withErrorLogging } from '@/lib/serverErrorLogger';

export const dynamic = 'force-dynamic';

function clampInt(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function parseBool(v) {
  if (v === null || v === undefined) return null;
  if (v === 'true' || v === true) return true;
  if (v === 'false' || v === false) return false;
  return null;
}

/**
 * GET /api/parts/search?q=&carSlug=&carVariantKey=&category=&verified=&limit=
 *
 * Public endpoint (RLS-safe) to search the parts catalog and optionally filter by fitment.
 * - q is optional if carSlug/carVariantKey provided (for "browse parts for my car" views).
 * - verified=true filters to verified fitments only.
 */
async function handleGet(request) {
  const client = getPublicClient();
  if (!client) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const carSlug = (searchParams.get('carSlug') || '').trim() || null;
    const carVariantKey = (searchParams.get('carVariantKey') || '').trim() || null;
    const category = (searchParams.get('category') || '').trim() || null;
    const verified = parseBool(searchParams.get('verified'));
    const limit = clampInt(searchParams.get('limit'), 1, 30, 12);

    if (!q && !carSlug && !carVariantKey) {
      return NextResponse.json({ error: 'Provide q or carSlug/carVariantKey' }, { status: 400 });
    }

    // Resolve car_variant_id if needed.
    let carVariantId = null;
    let carId = null;
    let resolvedCarSlug = carSlug;
    if (carVariantKey) {
      const { data: vRow, error: vErr } = await client
        .from('car_variants')
        .select('id,car_id,variant_key,display_name,cars(slug)')
        .eq('variant_key', carVariantKey)
        .maybeSingle();
      if (vErr) throw vErr;
      carVariantId = vRow?.id || null;
      carId = vRow?.car_id || null;
      if (!resolvedCarSlug) resolvedCarSlug = vRow?.cars?.slug || null;
    }

    if (!carId && resolvedCarSlug) {
      const { data: cRow, error: cErr } = await client
        .from('cars')
        .select('id,slug')
        .eq('slug', resolvedCarSlug)
        .maybeSingle();
      if (cErr) throw cErr;
      carId = cRow?.id || null;
    }

    // Optional fitment filter first (keeps search fast and enforces fitment).
    /** @type {Map<string, any>} */
    const bestFitmentByPartId = new Map();
    let fitmentPartIds = null;

    if (carId || carVariantId) {
      let fq = client
        .from('part_fitments')
        .select('part_id,car_id,car_variant_id,fitment_notes,requires_tune,install_difficulty,estimated_labor_hours,verified,confidence,source_url,updated_at')
        .limit(600);

      if (carId) fq = fq.eq('car_id', carId);
      if (carVariantId) fq = fq.eq('car_variant_id', carVariantId);
      if (verified === true) fq = fq.eq('verified', true);

      const { data: fitments, error: fErr } = await fq;
      if (fErr) throw fErr;

      for (const r of fitments || []) {
        const pid = r.part_id;
        if (!pid) continue;
        const prev = bestFitmentByPartId.get(pid);
        // Prefer verified, then higher confidence, then most recently updated.
        const prevScore = (prev?.verified ? 1000 : 0) + Math.round((Number(prev?.confidence || 0) * 100)) + (prev?.updated_at ? 1 : 0);
        const nextScore = (r?.verified ? 1000 : 0) + Math.round((Number(r?.confidence || 0) * 100)) + (r?.updated_at ? 1 : 0);
        if (!prev || nextScore > prevScore) bestFitmentByPartId.set(pid, { ...r, car_slug: resolvedCarSlug });
      }

      fitmentPartIds = [...bestFitmentByPartId.keys()];
      if (fitmentPartIds.length === 0) {
        return NextResponse.json({
          query: q || null,
          carSlug: resolvedCarSlug,
          carVariantKey,
          count: 0,
          results: [],
        });
      }
    }

    // Search parts
    let pq = client
      .from('parts')
      .select('id,name,brand_name,part_number,category,description,quality_tier,street_legal,source_urls,confidence')
      .eq('is_active', true)
      .limit(limit);

    if (category) pq = pq.eq('category', category);
    if (q) {
      const safe = q.replace(/,/g, ' '); // avoid breaking .or() clause parsing
      pq = pq.or(`name.ilike.%${safe}%,part_number.ilike.%${safe}%,brand_name.ilike.%${safe}%`);
    }
    if (fitmentPartIds) pq = pq.in('id', fitmentPartIds);

    const { data: parts, error: pErr } = await pq;
    if (pErr) throw pErr;

    const partIds = (parts || []).map((p) => p.id).filter(Boolean);

    // Latest pricing per part
    const priceByPartId = new Map();
    if (partIds.length > 0) {
      const { data: prices, error: prErr } = await client
        .from('part_pricing_snapshots')
        .select('part_id,vendor_name,product_url,price_cents,currency,recorded_at')
        .in('part_id', partIds)
        .order('recorded_at', { ascending: false })
        .limit(800);
      if (prErr) throw prErr;

      for (const row of prices || []) {
        if (!priceByPartId.has(row.part_id)) priceByPartId.set(row.part_id, row);
      }
    }

    return NextResponse.json({
      query: q || null,
      carSlug: resolvedCarSlug,
      carVariantKey,
      count: (parts || []).length,
      results: (parts || []).map((p) => ({
        ...p,
        fitment: bestFitmentByPartId.get(p.id) || null,
        latest_price: priceByPartId.get(p.id) || null,
      })),
    });
}

export const GET = withErrorLogging(handleGet, { route: 'parts/search', feature: 'tuning-shop' });














