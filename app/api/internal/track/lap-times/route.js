import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const INTERNAL_ADMIN_KEY = process.env.INTERNAL_ADMIN_KEY;

const supabase = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

function requireAdmin(request) {
  if (!INTERNAL_ADMIN_KEY) return { ok: false, error: 'INTERNAL_ADMIN_KEY not configured' };
  const provided = request.headers.get('x-internal-admin-key');
  if (!provided || provided !== INTERNAL_ADMIN_KEY) return { ok: false, error: 'Unauthorized' };
  return { ok: true };
}

function slugify(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function parseLapTimeToMs(input) {
  if (input === null || input === undefined) return null;
  const s = String(input).trim();
  if (!s) return null;

  // Accept:
  // - "1:58.321" (m:ss.mmm)
  // - "58.321" (ss.mmm)
  // - "118321" (ms)
  if (/^\d+$/.test(s)) {
    const ms = Number(s);
    if (ms > 0) return ms;
  }

  const parts = s.split(':');
  if (parts.length === 1) {
    const seconds = Number(parts[0]);
    if (!Number.isFinite(seconds) || seconds <= 0) return null;
    return Math.round(seconds * 1000);
  }
  if (parts.length === 2) {
    const minutes = Number(parts[0]);
    const seconds = Number(parts[1]);
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return null;
    if (minutes < 0 || seconds < 0 || seconds >= 60) return null;
    return Math.round((minutes * 60 + seconds) * 1000);
  }
  return null;
}

/**
 * GET /api/internal/track/lap-times?carSlug=&limit=
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
      .from('car_track_lap_times')
      .select('id,car_slug,lap_time_ms,lap_time_text,session_date,is_stock,tires,conditions,modifications,notes,source_url,confidence,verified,track_venues(slug,name),track_layouts(layout_key,name)')
      .order('lap_time_ms', { ascending: true })
      .limit(limit);

    if (carSlug) q = q.eq('car_slug', carSlug);
    const { data, error } = await q;
    if (error) throw error;

    return NextResponse.json({ count: (data || []).length, rows: data || [] });
  } catch (err) {
    console.error('[internal/track/lap-times] GET error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/internal/track/lap-times
 * Body:
 * - carSlug (required)
 * - trackName (required) OR trackSlug
 * - layoutKey (optional)
 * - layoutName (optional)
 * - lapTime (required) string or ms number
 * - sessionDate (optional) "YYYY-MM-DD"
 * - isStock (optional) boolean
 * - tires (optional) string
 * - conditions (optional) object
 * - modifications (optional) object
 * - notes (optional) string
 * - sourceUrl (optional but strongly recommended)
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
      trackName,
      trackSlug,
      layoutKey,
      layoutName,
      lapTime,
      sessionDate,
      isStock,
      tires,
      conditions,
      modifications,
      notes,
      sourceUrl,
      confidence,
    } = body || {};

    if (!carSlug) return NextResponse.json({ error: 'carSlug is required' }, { status: 400 });

    const resolvedTrackSlug = trackSlug ? slugify(trackSlug) : slugify(trackName);
    const resolvedTrackName = trackName || trackSlug;
    if (!resolvedTrackSlug || !resolvedTrackName) {
      return NextResponse.json({ error: 'trackName or trackSlug is required' }, { status: 400 });
    }

    const lap_time_ms = parseLapTimeToMs(lapTime);
    if (!lap_time_ms) return NextResponse.json({ error: 'lapTime is required (e.g. "1:58.321")' }, { status: 400 });

    const { data: carRow, error: carErr } = await supabase
      .from('cars')
      .select('id,slug')
      .eq('slug', carSlug)
      .single();
    if (carErr) throw carErr;

    // Upsert track venue
    const { data: trackRow, error: trackErr } = await supabase
      .from('track_venues')
      .upsert({ slug: resolvedTrackSlug, name: resolvedTrackName }, { onConflict: 'slug' })
      .select('id,slug,name')
      .single();
    if (trackErr) throw trackErr;

    // Upsert layout (optional)
    let track_layout_id = null;
    if (layoutKey) {
      const lk = slugify(layoutKey);
      const { data: layoutRow, error: layoutErr } = await supabase
        .from('track_layouts')
        .upsert({ track_id: trackRow.id, layout_key: lk, name: layoutName || lk }, { onConflict: 'track_id,layout_key' })
        .select('id')
        .single();
      if (layoutErr) throw layoutErr;
      track_layout_id = layoutRow?.id || null;
    }

    let c = null;
    if (confidence !== undefined && confidence !== null && confidence !== '') {
      c = Number(confidence);
      if (Number.isNaN(c) || c < 0 || c > 1) {
        return NextResponse.json({ error: 'confidence must be between 0 and 1' }, { status: 400 });
      }
    }

    const lap_time_text = typeof lapTime === 'string' ? lapTime : null;

    const { data: inserted, error: insErr } = await supabase
      .from('car_track_lap_times')
      .insert({
        car_id: carRow.id,
        car_slug: carSlug,
        track_id: trackRow.id,
        track_layout_id,
        lap_time_ms,
        lap_time_text,
        session_date: sessionDate || null,
        is_stock: typeof isStock === 'boolean' ? isStock : true,
        tires: tires || null,
        conditions: conditions || {},
        modifications: modifications || {},
        notes: notes || null,
        source_url: sourceUrl || null,
        confidence: c,
        verified: false,
      })
      .select('id,car_slug,lap_time_ms,lap_time_text,session_date,is_stock,tires,source_url,confidence,verified,created_at')
      .single();

    if (insErr) throw insErr;

    return NextResponse.json({ success: true, lapTime: inserted, track: trackRow });
  } catch (err) {
    console.error('[internal/track/lap-times] POST error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

