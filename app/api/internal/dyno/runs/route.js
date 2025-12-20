import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin, getAuthErrorStatus } from '@/lib/adminAuth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * GET /api/internal/dyno/runs?carSlug=&limit=
 * Admin-only listing for QA.
 */
export async function GET(request) {
  try {
    const auth = requireAdmin(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === 'Unauthorized' ? 401 : 500 });
    }
    if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const { searchParams } = new URL(request.url);
    const carSlug = searchParams.get('carSlug') || null;
    const limit = Math.max(1, Math.min(Number(searchParams.get('limit') || 80), 300));

    let q = supabase
      .from('car_dyno_runs')
      .select('id,car_slug,run_kind,recorded_at,dyno_type,correction,fuel,is_wheel,peak_hp,peak_tq,peak_whp,peak_wtq,boost_psi_max,conditions,modifications,notes,curve,source_url,confidence,verified,created_at')
      .order('recorded_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (carSlug) q = q.eq('car_slug', carSlug);
    const { data, error } = await q;
    if (error) throw error;

    return NextResponse.json({ count: (data || []).length, rows: data || [] });
  } catch (err) {
    console.error('[internal/dyno/runs] GET error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/internal/dyno/runs
 * Body:
 * - carSlug (required)
 * - runKind (baseline|modded|comparison|unknown)
 * - recordedAt (optional) "YYYY-MM-DD"
 * - dynoType/correction/fuel/transmission/gear (optional)
 * - isWheel (optional) boolean
 * - peakWhp/peakWtq/peakHp/peakTq/boostPsiMax (optional)
 * - curve (optional) object (arrays etc)
 * - conditions (optional) object
 * - modifications (optional) object
 * - notes (optional) string
 * - sourceUrl (optional but recommended)
 * - confidence (optional 0..1)
 */
export async function POST(request) {
  try {
    const auth = requireAdmin(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === 'Unauthorized' ? 401 : 500 });
    }
    if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const body = await request.json();
    const {
      carSlug,
      runKind,
      recordedAt,
      dynoType,
      correction,
      drivetrain,
      transmission,
      gear,
      fuel,
      isWheel,
      peakWhp,
      peakWtq,
      peakHp,
      peakTq,
      boostPsiMax,
      curve,
      conditions,
      modifications,
      notes,
      sourceUrl,
      confidence,
    } = body || {};

    if (!carSlug) return NextResponse.json({ error: 'carSlug is required' }, { status: 400 });

    const { data: carRow, error: carErr } = await supabase
      .from('cars')
      .select('id,slug')
      .eq('slug', carSlug)
      .single();
    if (carErr) throw carErr;

    const allowedKinds = new Set(['baseline', 'modded', 'comparison', 'unknown']);
    const rk = allowedKinds.has(String(runKind || 'unknown')) ? String(runKind || 'unknown') : 'unknown';

    let c = null;
    if (confidence !== undefined && confidence !== null && confidence !== '') {
      c = Number(confidence);
      if (Number.isNaN(c) || c < 0 || c > 1) {
        return NextResponse.json({ error: 'confidence must be between 0 and 1' }, { status: 400 });
      }
    }

    const safeNum = (v) => (v === null || v === undefined || v === '' ? null : Number(v));

    const payload = {
      car_id: carRow.id,
      car_slug: carSlug,
      run_kind: rk,
      recorded_at: recordedAt || null,
      dyno_type: dynoType || null,
      correction: correction || null,
      drivetrain: drivetrain || null,
      transmission: transmission || null,
      gear: gear || null,
      fuel: fuel || null,
      is_wheel: typeof isWheel === 'boolean' ? isWheel : true,
      peak_whp: safeNum(peakWhp),
      peak_wtq: safeNum(peakWtq),
      peak_hp: safeNum(peakHp),
      peak_tq: safeNum(peakTq),
      boost_psi_max: safeNum(boostPsiMax),
      curve: curve && typeof curve === 'object' ? curve : {},
      conditions: conditions && typeof conditions === 'object' ? conditions : {},
      modifications: modifications && typeof modifications === 'object' ? modifications : {},
      notes: notes || null,
      source_url: sourceUrl || null,
      confidence: c,
      verified: false,
    };

    const { data: inserted, error: insErr } = await supabase
      .from('car_dyno_runs')
      .insert(payload)
      .select('id,car_slug,run_kind,recorded_at,dyno_type,correction,fuel,is_wheel,peak_whp,peak_wtq,peak_hp,peak_tq,boost_psi_max,source_url,confidence,verified,created_at')
      .single();

    if (insErr) throw insErr;

    return NextResponse.json({ success: true, dynoRun: inserted });
  } catch (err) {
    console.error('[internal/dyno/runs] POST error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}













