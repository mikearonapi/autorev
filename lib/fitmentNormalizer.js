/**
 * Fitment Normalizer
 *
 * Converts vendor fitment tags (platform codes) into canonical `car_id` and
 * `car_variant_id` using the `fitment_tag_mappings` table.
 *
 * This keeps ingestion scalable as we add vendors and tags.
 */

/**
 * @typedef {Object} NormalizedFitment
 * @property {string|null} carId
 * @property {string|null} carVariantId
 * @property {string|null} carSlug
 * @property {string|null} variantKey
 * @property {string[]} matchedTags
 * @property {Object[]} mappings
 */

/**
 * Resolve vendor tags into car/car_variant IDs.
 * @param {Object} params
 * @param {import('@supabase/supabase-js').SupabaseClient} params.client
 * @param {string} params.vendorKey
 * @param {string[]} params.tags
 * @returns {Promise<NormalizedFitment>}
 */
export async function resolveFitmentFromTags({ client, vendorKey, tags }) {
  const normalizedTags = (tags || [])
    .map(t => String(t || '').trim())
    .filter(Boolean);

  if (!client || !vendorKey || normalizedTags.length === 0) {
    return { carId: null, carVariantId: null, carSlug: null, variantKey: null, matchedTags: [], mappings: [] };
  }

  const { data: mappings, error } = await client
    .from('fitment_tag_mappings')
    .select('vendor_key,tag,car_id,car_variant_id,notes,confidence,source_url,metadata')
    .eq('vendor_key', vendorKey)
    .in('tag', normalizedTags);

  if (error || !mappings || mappings.length === 0) {
    return { carId: null, carVariantId: null, carSlug: null, variantKey: null, matchedTags: [], mappings: [] };
  }

  // Pick best mapping (prefer variant_id; highest confidence; most recent implied by data order)
  const sorted = [...mappings].sort((a, b) => {
    const av = a.car_variant_id ? 1 : 0;
    const bv = b.car_variant_id ? 1 : 0;
    if (av !== bv) return bv - av;
    const ac = Number(a.confidence || 0);
    const bc = Number(b.confidence || 0);
    return bc - ac;
  });

  const best = sorted[0];
  let variantKey = null;
  let carSlug = null;

  if (best.car_variant_id) {
    const { data: v } = await client
      .from('car_variants')
      .select('variant_key, car_id, cars(slug)')
      .eq('id', best.car_variant_id)
      .single();
    variantKey = v?.variant_key || null;
    carSlug = v?.cars?.slug || null;
  } else if (best.car_id) {
    const { data: c } = await client.from('cars').select('slug').eq('id', best.car_id).single();
    carSlug = c?.slug || null;
  }

  return {
    carId: best.car_id || null,
    carVariantId: best.car_variant_id || null,
    carSlug,
    variantKey,
    matchedTags: mappings.map(m => m.tag),
    mappings,
  };
}














