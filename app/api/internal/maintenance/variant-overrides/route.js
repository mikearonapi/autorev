import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin, getAuthErrorStatus } from '@/lib/adminAuth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

async function resolveVariantId(variantKey) {
  const { data, error } = await supabase
    .from('car_variants')
    .select('id,variant_key,display_name,car_id,cars(slug,name)')
    .eq('variant_key', variantKey)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

/**
 * GET /api/internal/maintenance/variant-overrides?variantKey=
 * Admin-only.
 * Returns:
 * - variant
 * - override (raw row)
 * - merged maintenance summary (RPC)
 */
export async function GET(request) {
  try {
    const auth = requireAdmin(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === 'Unauthorized' ? 401 : 500 });
    }
    if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const { searchParams } = new URL(request.url);
    const variantKey = searchParams.get('variantKey') || '';
    if (!variantKey.trim()) return NextResponse.json({ error: 'variantKey is required' }, { status: 400 });

    const variant = await resolveVariantId(variantKey.trim());
    if (!variant?.id) return NextResponse.json({ error: 'Variant not found' }, { status: 404 });

    const { data: overrideRow, error: oErr } = await supabase
      .from('car_variant_maintenance_overrides')
      .select('id,car_variant_id,overrides,source_url,confidence,verified,verified_by,verified_at,created_at,updated_at')
      .eq('car_variant_id', variant.id)
      .maybeSingle();
    if (oErr) throw oErr;

    const { data: merged, error: mErr } = await supabase.rpc('get_car_maintenance_summary_variant', { p_variant_key: variantKey.trim() });
    if (mErr) {
      // Non-fatal; still return override row for editing
      console.warn('[internal/maintenance/variant-overrides] RPC error:', mErr);
    }

    return NextResponse.json({
      variant,
      override: overrideRow || null,
      merged: merged || null,
    });
  } catch (err) {
    console.error('[internal/maintenance/variant-overrides] GET error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/internal/maintenance/variant-overrides
 * Body:
 * - variantKey (required)
 * - overrides (required object)
 * - sourceUrl? string
 * - confidence? number 0..1
 * - verified? boolean
 */
export async function POST(request) {
  try {
    const auth = requireAdmin(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === 'Unauthorized' ? 401 : 500 });
    }
    if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const body = await request.json();
    const { variantKey, overrides, sourceUrl, confidence, verified } = body || {};

    if (!variantKey || typeof variantKey !== 'string' || !variantKey.trim()) {
      return NextResponse.json({ error: 'variantKey is required' }, { status: 400 });
    }
    if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
      return NextResponse.json({ error: 'overrides must be an object' }, { status: 400 });
    }

    const variant = await resolveVariantId(variantKey.trim());
    if (!variant?.id) return NextResponse.json({ error: 'Variant not found' }, { status: 404 });

    let c = null;
    if (confidence !== undefined && confidence !== null && confidence !== '') {
      c = Number(confidence);
      if (Number.isNaN(c) || c < 0 || c > 1) {
        return NextResponse.json({ error: 'confidence must be between 0 and 1' }, { status: 400 });
      }
    }

    const nowIso = new Date().toISOString();
    const isVerified = Boolean(verified);

    const payload = {
      car_variant_id: variant.id,
      overrides,
      source_url: sourceUrl || null,
      confidence: c,
      verified: isVerified,
      verified_by: isVerified ? 'internal-ui' : null,
      verified_at: isVerified ? nowIso : null,
    };

    const { data, error } = await supabase
      .from('car_variant_maintenance_overrides')
      .upsert(payload, { onConflict: 'car_variant_id' })
      .select('id,car_variant_id,overrides,source_url,confidence,verified,verified_by,verified_at,updated_at')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, override: data, variant });
  } catch (err) {
    console.error('[internal/maintenance/variant-overrides] POST error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}













