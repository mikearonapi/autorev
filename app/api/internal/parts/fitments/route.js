import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin, getAuthErrorStatus } from '@/lib/adminAuth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

function computeFitmentQualityScore(row) {
  const verified = Boolean(row?.verified);
  const confidence = Math.max(0, Math.min(1, Number(row?.confidence || 0)));
  const hasSource = Boolean(row?.source_url) || (Array.isArray(row?.parts?.source_urls) && row.parts.source_urls.length > 0);
  const hasNotes = Boolean(String(row?.fitment_notes || '').trim());

  // Heuristic: verified matters most; confidence matters next; provenance/notes add marginal signal.
  const score = (verified ? 0.60 : 0.0) + (confidence * 0.30) + (hasSource ? 0.07 : 0.0) + (hasNotes ? 0.03 : 0.0);
  return Math.max(0, Math.min(1, Math.round(score * 100) / 100));
}

/**
 * GET /api/internal/parts/fitments?carSlug=&verified=&limit=
 * Admin-only. Service role reads, returns fitments with parts.
 */
export async function GET(request) {
  try {
    const auth = requireAdmin(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === 'Unauthorized' ? 401 : 500 });
    }
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const carSlug = searchParams.get('carSlug') || null;
    const verifiedParam = searchParams.get('verified');
    const limit = Math.max(1, Math.min(Number(searchParams.get('limit') || 80), 300));

    const verifiedFilter =
      verifiedParam === null ? null :
      verifiedParam === 'true' ? true :
      verifiedParam === 'false' ? false :
      null;

    let carId = null;
    if (carSlug) {
      const { data: carRow, error: carErr } = await supabase
        .from('cars')
        .select('id,name,slug')
        .eq('slug', carSlug)
        .maybeSingle();
      if (carErr) throw carErr;
      carId = carRow?.id || null;
    }

    let q = supabase
      .from('part_fitments')
      .select('id,car_id,car_variant_id,fitment_notes,requires_tune,install_difficulty,estimated_labor_hours,verified,verified_by,verified_at,confidence,source_url,created_at,updated_at, parts(id,name,brand_name,part_number,category,quality_tier,street_legal,source_urls)')
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (carId) q = q.eq('car_id', carId);
    if (verifiedFilter !== null) q = q.eq('verified', verifiedFilter);

    const { data, error } = await q;
    if (error) throw error;

    const rows = (data || []).map((r) => ({
      ...r,
      qualityScore: computeFitmentQualityScore(r),
      provenance: {
        source_url: r.source_url || (Array.isArray(r?.parts?.source_urls) ? r.parts.source_urls[0] : null),
        source_urls: Array.isArray(r?.parts?.source_urls) ? r.parts.source_urls : [],
      },
    }));

    // Higher quality first when reviewing all; otherwise preserve updated_at order.
    if (verifiedFilter === null) {
      rows.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
    }

    return NextResponse.json({
      count: rows.length,
      fitments: rows,
    });
  } catch (err) {
    console.error('[internal/parts/fitments] GET error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/internal/parts/fitments
 * Body:
 * - id: string (fitment id)
 * - verified?: boolean
 * - confidence?: number (0..1)
 * - fitment_notes?: string
 * - source_url?: string|null
 * - requires_tune?: boolean
 * - install_difficulty?: 'easy'|'moderate'|'hard'|'pro_only'|null
 * - estimated_labor_hours?: number|null
 *
 * Bulk mode:
 * - ids: string[] (fitment ids)
 */
export async function PATCH(request) {
  try {
    const auth = requireAdmin(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === 'Unauthorized' ? 401 : 500 });
    }
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const body = await request.json();
    const {
      id,
      ids,
      verified,
      confidence,
      fitment_notes,
      source_url,
      requires_tune,
      install_difficulty,
      estimated_labor_hours,
    } = body || {};

    const targetIds = Array.isArray(ids) ? ids.filter(Boolean) : (id ? [id] : []);
    if (targetIds.length === 0) {
      return NextResponse.json({ error: 'id or ids is required' }, { status: 400 });
    }
    if (targetIds.length > 250) {
      return NextResponse.json({ error: 'Too many ids (max 250)' }, { status: 400 });
    }

    const updates = {};
    if (typeof verified === 'boolean') {
      updates.verified = verified;
      updates.verified_by = 'internal-ui';
      updates.verified_at = verified ? new Date().toISOString() : null;
    }
    if (confidence !== undefined) {
      const c = Number(confidence);
      if (Number.isNaN(c) || c < 0 || c > 1) {
        return NextResponse.json({ error: 'confidence must be between 0 and 1' }, { status: 400 });
      }
      updates.confidence = c;
    }
    if (fitment_notes !== undefined) updates.fitment_notes = fitment_notes === null ? null : String(fitment_notes);
    if (source_url !== undefined) updates.source_url = source_url === null ? null : String(source_url);
    if (requires_tune !== undefined) updates.requires_tune = Boolean(requires_tune);
    if (install_difficulty !== undefined) updates.install_difficulty = install_difficulty || null;
    if (estimated_labor_hours !== undefined) updates.estimated_labor_hours = estimated_labor_hours === null ? null : Number(estimated_labor_hours);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('part_fitments')
      .update(updates)
      .in('id', targetIds)
      .select('id,verified,confidence,fitment_notes,source_url,requires_tune,install_difficulty,estimated_labor_hours,verified_by,verified_at,updated_at');

    if (error) throw error;

    if (targetIds.length === 1) {
      return NextResponse.json({ success: true, fitment: (data || [])[0] || null });
    }

    return NextResponse.json({ success: true, count: (data || []).length, fitments: data || [] });
  } catch (err) {
    console.error('[internal/parts/fitments] PATCH error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}







