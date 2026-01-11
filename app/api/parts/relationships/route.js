import { NextResponse } from 'next/server';
import { getPublicClient } from '@/lib/supabaseServer';
import { withErrorLogging } from '@/lib/serverErrorLogger';

export const dynamic = 'force-dynamic';

function uniq(arr) {
  return [...new Set(arr)];
}

/**
 * POST /api/parts/relationships
 * Body: { partIds: string[] }
 *
 * Public endpoint (RLS-safe) to retrieve relationship edges for a set of parts.
 */
async function handlePost(request) {
  const client = getPublicClient();
    if (!client) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const body = await request.json().catch(() => ({}));
    const partIds = Array.isArray(body?.partIds) ? body.partIds.filter(Boolean).map(String) : [];
    const unique = uniq(partIds);

    if (unique.length === 0) {
      return NextResponse.json({ edges: [] });
    }
    if (unique.length > 60) {
      return NextResponse.json({ error: 'Too many partIds (max 60)' }, { status: 400 });
    }

    // Fetch edges that touch the selected set (either direction).
    // Note: We intentionally over-fetch a bit so we can compute requirements/suggestions.
    const inList = `(${unique.join(',')})`;
    const { data: edges, error: eErr } = await client
      .from('part_relationships')
      .select('id,part_id,related_part_id,relation_type,reason,metadata')
      .or(`part_id.in.${inList},related_part_id.in.${inList}`)
      .limit(2000);
    if (eErr) throw eErr;

    const allIds = uniq(
      (edges || [])
        .flatMap((e) => [e.part_id, e.related_part_id])
        .filter(Boolean)
        .map(String)
    );

    const { data: parts, error: pErr } = await client
      .from('parts')
      .select('id,name,brand_name,part_number,category')
      .in('id', allIds)
      .limit(5000);
    if (pErr) throw pErr;

    const partById = new Map((parts || []).map((p) => [p.id, p]));

    const hydrated = (edges || []).map((e) => ({
      id: e.id,
      relation_type: e.relation_type,
      reason: e.reason || null,
      metadata: e.metadata || {},
      part: partById.get(e.part_id) ? {
        id: e.part_id,
        name: partById.get(e.part_id).name,
        brand_name: partById.get(e.part_id).brand_name,
        part_number: partById.get(e.part_id).part_number,
        category: partById.get(e.part_id).category,
      } : { id: e.part_id },
      related_part: partById.get(e.related_part_id) ? {
        id: e.related_part_id,
        name: partById.get(e.related_part_id).name,
        brand_name: partById.get(e.related_part_id).brand_name,
        part_number: partById.get(e.related_part_id).part_number,
        category: partById.get(e.related_part_id).category,
      } : { id: e.related_part_id },
    }));

    return NextResponse.json({ edges: hydrated });
}

export const POST = withErrorLogging(handlePost, { route: 'parts/relationships', feature: 'tuning-shop' });















