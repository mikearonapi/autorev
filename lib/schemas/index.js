/**
 * Zod Validation Schemas
 *
 * Centralized validation schemas for API routes.
 * These ensure consistent input validation across the application.
 *
 * @module lib/schemas
 */

import { z } from 'zod';

// =============================================================================
// COMMON FIELD SCHEMAS
// =============================================================================

/**
 * Email validation with reasonable constraints
 */
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email too long')
  .optional()
  .nullable();

/**
 * UUID validation for IDs
 */
export const uuidSchema = z.string().uuid('Invalid ID format');

/**
 * Optional UUID that can be null
 */
export const optionalUuidSchema = uuidSchema.optional().nullable();

/**
 * URL validation
 */
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(2048, 'URL too long')
  .optional()
  .nullable();

/**
 * Safe text input (prevents XSS basics)
 */
export const safeTextSchema = z
  .string()
  .max(10000, 'Text too long')
  .transform((val) => val?.trim());

/**
 * Short text for titles, names
 */
export const shortTextSchema = z
  .string()
  .max(500, 'Text too long')
  .transform((val) => val?.trim());

// =============================================================================
// FEEDBACK SCHEMA
// =============================================================================

export const feedbackTypeEnum = z.enum([
  'like',
  'dislike',
  'feature',
  'bug',
  'question',
  'car_request',
  'other',
  'al-feedback',
]);

export const feedbackCategoryEnum = z.enum([
  'bug',
  'feature',
  'data',
  'general',
  'praise',
  'auto-error',
]);

export const severityEnum = z.enum(['blocking', 'major', 'minor']);

export const feedbackSchema = z.object({
  // Core fields
  feedback_type: feedbackTypeEnum.optional(),
  category: feedbackCategoryEnum.optional().nullable(),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(10000, 'Message too long')
    .transform((val) => val?.trim()),
  email: emailSchema,

  // Context
  page_url: urlSchema,
  pageUrl: urlSchema, // Alias for backwards compat
  page_title: shortTextSchema.optional().nullable(),
  car_slug: z.string().max(100).optional().nullable(),
  build_id: optionalUuidSchema,

  // Metadata
  tags: z.array(z.string().max(50)).max(10).optional(),
  metadata: z.record(z.unknown()).optional().nullable(),
  browserInfo: z.record(z.unknown()).optional().nullable(),
  severity: severityEnum.optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  featureContext: z.string().max(100).optional().nullable(),
  userTier: z.string().max(50).optional().nullable(),

  // Error tracking fields (for auto-errors)
  errorMetadata: z.record(z.unknown()).optional().nullable(),
  errorSource: z.string().max(50).optional().nullable(),
  errorHash: z.string().max(100).optional().nullable(),
  appVersion: z.string().max(50).optional().nullable(),

  // Screenshot fields
  screenshot_url: urlSchema,
  screenshot_metadata: z.record(z.unknown()).optional().nullable(),
});

// =============================================================================
// EVENT SUBMISSION SCHEMA
// =============================================================================

export const eventSubmitSchema = z.object({
  name: z.string().min(3, 'Event name required').max(200, 'Name too long'),
  description: z.string().max(5000, 'Description too long').optional().nullable(),

  // Date/time
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Invalid date format (YYYY-MM-DD)'),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}/, 'Invalid date format')
    .optional()
    .nullable(),
  start_time: z.string().max(20).optional().nullable(),
  end_time: z.string().max(20).optional().nullable(),

  // Location
  venue_name: z.string().max(200).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),

  // Details
  event_type: z.string().max(50).optional().nullable(),
  website_url: urlSchema,
  registration_url: urlSchema,
  is_recurring: z.boolean().optional(),

  // Contact info
  submitter_email: emailSchema,
  submitter_name: z.string().max(100).optional().nullable(),
});

// =============================================================================
// USER PREFERENCES SCHEMA
// =============================================================================

export const userPreferencesSchema = z.object({
  // Display preferences
  theme: z.enum(['light', 'dark', 'system']).optional(),
  units: z.enum(['imperial', 'metric']).optional(),

  // Notification preferences
  email_notifications: z.boolean().optional(),
  push_notifications: z.boolean().optional(),
  marketing_emails: z.boolean().optional(),

  // AL preferences (for AI assistant)
  al_preferences: z
    .object({
      web_search_enabled: z.boolean().optional(),
      forum_insights_enabled: z.boolean().optional(),
      youtube_reviews_enabled: z.boolean().optional(),
      event_search_enabled: z.boolean().optional(),
      response_style: z.enum(['concise', 'detailed', 'technical']).optional(),
    })
    .optional(),

  // Personalization (from questionnaire)
  driving_focus: z.string().max(50).optional().nullable(),
  work_preference: z.string().max(50).optional().nullable(),
  budget_comfort: z.string().max(50).optional().nullable(),
  mod_experience: z.string().max(50).optional().nullable(),
  primary_goals: z.array(z.string().max(50)).max(10).optional(),
  track_frequency: z.string().max(50).optional().nullable(),
  detail_level: z.string().max(50).optional().nullable(),
});

// =============================================================================
// CONTACT FORM SCHEMA
// =============================================================================

export const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email').max(255),
  subject: z.string().max(200).optional().nullable(),
  message: z.string().min(10, 'Message too short').max(5000, 'Message too long'),

  // Honeypot field (should be empty)
  website: z.string().max(0, 'Invalid submission').optional(),
});

// =============================================================================
// VEHICLE SCHEMA
// =============================================================================

export const vehicleSchema = z.object({
  // Required fields
  year: z.number().int().min(1900).max(2030),
  make: z.string().min(1).max(100),
  model: z.string().min(1).max(100),

  // Optional details
  trim: z.string().max(100).optional().nullable(),
  vin: z.string().length(17).optional().nullable(),
  nickname: z.string().max(100).optional().nullable(),

  // Ownership info
  purchase_date: z.string().optional().nullable(),
  purchase_price: z.number().positive().optional().nullable(),
  current_mileage: z.number().int().min(0).optional().nullable(),

  // State
  is_active: z.boolean().optional(),
  is_primary: z.boolean().optional(),
});

// =============================================================================
// AL FEEDBACK SCHEMA
// =============================================================================

export const alFeedbackSchema = z.object({
  messageId: z.string().min(1, 'Message ID is required').max(100),
  conversationId: z.string().max(100).optional().nullable(),
  feedbackType: z.enum(['thumbs_up', 'thumbs_down']),
  feedbackCategory: z.string().max(50).optional().nullable(),
  feedbackReason: z.string().max(1000).optional().nullable(),
  queryText: z.string().max(5000).optional().nullable(),
  responseText: z.string().max(50000).optional().nullable(),
  toolsUsed: z.array(z.string().max(100)).max(20).optional(),
  promptVersionId: z.string().max(100).optional().nullable(),
});

// =============================================================================
// DASHBOARD ACTION SCHEMA
// =============================================================================

export const dashboardActionSchema = z.object({
  action: z.enum(['update-title', 'refresh']),
  title: z.string().max(100).optional().nullable(),
});

// =============================================================================
// PREFERENCES QUESTIONNAIRE SCHEMA
// =============================================================================

export const preferencesQuestionnaireSchema = z.object({
  responses: z.record(z.union([z.string(), z.array(z.string()), z.number()])),
  pointsEarned: z.number().int().min(0).max(100).optional(),
});

// =============================================================================
// COMMUNITY POST SCHEMA
// =============================================================================

export const communityPostSchema = z.object({
  postType: z.enum(['garage', 'build', 'vehicle'], {
    errorMap: () => ({ message: 'postType must be: garage, build, or vehicle' }),
  }),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title too long')
    .transform((val) => val?.trim()),
  description: z
    .string()
    .max(5000, 'Description too long')
    .optional()
    .nullable()
    .transform((val) => val?.trim()),
  vehicleId: optionalUuidSchema,
  buildId: optionalUuidSchema,
  carSlug: z.string().max(100).optional().nullable(),
  carName: z.string().max(200).optional().nullable(),
  imageIds: z.array(uuidSchema).max(20).optional(),
});

export const communityPostUpdateSchema = z.object({
  postId: uuidSchema,
  isPublished: z.boolean().optional(),
  title: z
    .string()
    .max(200)
    .optional()
    .transform((val) => val?.trim()),
  description: z
    .string()
    .max(5000)
    .optional()
    .nullable()
    .transform((val) => val?.trim()),
});

// =============================================================================
// DYNO RESULTS SCHEMA
// =============================================================================

export const dynoResultSchema = z.object({
  userVehicleId: uuidSchema,
  whp: z.number().positive('WHP must be positive').max(5000, 'WHP seems too high'),
  wtq: z.number().positive().max(5000).optional().nullable(),
  boostPsi: z.number().min(-20).max(100).optional().nullable(),
  fuelType: z.string().max(50).optional().nullable(),
  // Dyno types matching DynoLogModal.jsx DYNO_TYPES
  dynoType: z
    .enum(['dynojet', 'mustang', 'awd_dynopack', 'mainline', 'dyno_dynamics', 'other'])
    .optional()
    .nullable(),
  dynoDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
    .optional()
    .nullable(),
  dynoShop: z.string().max(200).optional().nullable(),
  dynoSheetUrl: urlSchema,
  ambientTempF: z.number().min(-50).max(150).optional().nullable(),
  humidityPercent: z.number().min(0).max(100).optional().nullable(),
  altitudeFt: z.number().min(-1000).max(20000).optional().nullable(),
  correctionFactor: z.string().max(50).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

// =============================================================================
// TRACK TIME SCHEMA
// =============================================================================

export const trackTimeSchema = z.object({
  trackName: z.string().min(1, 'Track name is required').max(200),
  trackConfig: z.string().max(100).optional().nullable(),
  trackLengthMiles: z.number().positive().max(50).optional().nullable(),
  lapTimeSeconds: z
    .number()
    .min(20, 'Lap time must be at least 20 seconds')
    .max(1200, 'Lap time cannot exceed 20 minutes'),
  sessionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
    .optional()
    .nullable(),
  // Session types matching TrackTimeLogModal.jsx SESSION_TYPES
  // MUST match database enum: session_type in 101_user_track_times.sql
  sessionType: z
    .enum(['track_day', 'time_attack', 'practice', 'competition', 'autocross', 'driving_school'])
    .optional()
    .nullable(),
  // Conditions matching TrackTimeLogModal.jsx CONDITIONS
  // MUST match database enum: track_condition in 101_user_track_times.sql
  conditions: z.enum(['dry', 'damp', 'wet', 'cold', 'hot', 'optimal']).optional().nullable(),
  ambientTempF: z.number().min(-50).max(150).optional().nullable(),
  trackTempF: z.number().min(-50).max(200).optional().nullable(),
  tireCompound: z.string().max(100).optional().nullable(),
  tirePressureFront: z.number().min(10).max(60).optional().nullable(),
  tirePressureRear: z.number().min(10).max(60).optional().nullable(),
  modsSummary: z.record(z.unknown()).optional().nullable(),
  estimatedHp: z.number().positive().max(3000).optional().nullable(),
  estimatedTimeSeconds: z.number().positive().max(1200).optional().nullable(),
  driverSkillLevel: z
    .enum(['beginner', 'novice', 'intermediate', 'advanced', 'professional'])
    .optional()
    .nullable(),
  notes: z.string().max(2000).optional().nullable(),
  highlights: z.string().max(2000).optional().nullable(),
  areasToImprove: z.string().max(2000).optional().nullable(),
  carSlug: z.string().max(100).optional().nullable(),
  userVehicleId: optionalUuidSchema,
  timingSystem: z.string().max(100).optional().nullable(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Validate data against a schema and return result
 *
 * @param {z.ZodSchema} schema - The Zod schema to validate against
 * @param {unknown} data - The data to validate
 * @returns {{ success: boolean, data?: any, errors?: object }}
 */
export function validateWithSchema(schema, data) {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Format errors for API response
  const errors = {};
  for (const error of result.error.errors) {
    const path = error.path.join('.') || 'root';
    errors[path] = error.message;
  }

  return { success: false, errors };
}

/**
 * Create a validation error response
 *
 * @param {object} errors - Validation errors object
 * @returns {Response}
 */
export function validationErrorResponse(errors) {
  return Response.json(
    {
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors,
    },
    { status: 400 }
  );
}

const schemas = {
  feedbackSchema,
  eventSubmitSchema,
  userPreferencesSchema,
  contactSchema,
  vehicleSchema,
  alFeedbackSchema,
  dashboardActionSchema,
  preferencesQuestionnaireSchema,
  communityPostSchema,
  communityPostUpdateSchema,
  dynoResultSchema,
  trackTimeSchema,
  validateWithSchema,
  validationErrorResponse,
};

export default schemas;
