/**
 * Parts Catalog: canonical shape guidance for `parts.attributes`.
 *
 * This is intentionally a lightweight schema guide (runtime validation belongs
 * in ingestion code). Keep it stable so parts data stays consistent across vendors.
 */

export const PART_ATTRIBUTE_SHAPE = {
  // Core product classification
  system: null, // e.g. "intake", "exhaust", "turbo", "suspension", "brakes"
  subSystem: null, // e.g. "catback", "downpipe", "intercooler", "coilovers"
  vehicleTags: [], // vendor platform tags (e.g. "8Y-RS3", "MK7-GTI")

  // Fitment + constraints
  fitment: {
    notes: null,
    modelYears: null, // e.g. "2017-2020"
    engineCodes: [], // e.g. ["DAZA"]
    drivetrain: null, // "AWD"/"RWD"/"FWD" when meaningful
    transmission: null, // "Manual"/"DCT"/etc when meaningful
  },

  // Performance evidence (keep provenance elsewhere; this is just the claim payload)
  gains: {
    hp: null,
    tq: null,
    notes: null,
  },

  // Legal/safety constraints (important for accuracy)
  compliance: {
    emissions: null, // "CARB", "EPA", "Race Only", etc
    emissionsNotes: null,
    noiseNotes: null,
  },

  // Installation/ownership
  install: {
    difficulty: null, // easy/moderate/hard/pro_only (mirrors part_fitments.install_difficulty)
    laborHours: null,
    requiresTune: null,
    requiresSupportingMods: [],
  },

  // Vendor/source-specific raw payload
  source: {
    vendor: null, // e.g. "performancebyie"
    externalId: null,
    handle: null,
    productType: null,
    tagsRaw: [],
    variants: [],
    raw: null, // keep small; large blobs should go to source_documents
  },
};




