/**
 * Environment Variable Validation
 * 
 * Type-safe environment variable validation using Zod.
 * Validates all required environment variables at build time.
 * 
 * Usage:
 *   import { env } from '@/lib/env';
 *   
 *   // Access validated env vars
 *   const apiKey = env.OPENAI_API_KEY;
 * 
 * @module lib/env
 */

import { z } from 'zod';

// =============================================================================
// SCHEMA DEFINITIONS
// =============================================================================

/**
 * Server-side environment variables schema
 * These are only available on the server and should never be exposed to the client
 */
const serverSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Supabase (Server)
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  
  // OpenAI
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
  
  // Anthropic
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  
  // Cohere (for reranking)
  COHERE_API_KEY: z.string().min(1).optional(),
  
  // Sentry
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  
  // Resend (Email)
  RESEND_API_KEY: z.string().min(1).optional(),
  
  // Discord
  DISCORD_WEBHOOK_URL: z.string().url().optional(),
  
  // Database URL (for direct connections)
  DATABASE_URL: z.string().optional(),
});

/**
 * Client-side environment variables schema
 * These are exposed to the browser via NEXT_PUBLIC_ prefix
 */
const clientSchema = z.object({
  // Supabase (Client)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  
  // App URL
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  
  // Analytics
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
  
  // Sentry (Client)
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  
  // Stripe
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  
  // Feature flags
  NEXT_PUBLIC_ENABLE_DARK_MODE: z.string().transform(v => v === 'true').optional(),
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.string().transform(v => v !== 'false').optional(),
});

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate server environment variables
 * @returns {z.infer<typeof serverSchema>}
 */
function validateServerEnv() {
  // Only run on server
  if (typeof window !== 'undefined') {
    throw new Error('Server env accessed on client');
  }
  
  const parsed = serverSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error('❌ Invalid server environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    
    // In production, throw error. In dev, warn but continue
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid server environment variables');
    }
    
    // Return empty object for dev graceful degradation
    return serverSchema.parse({});
  }
  
  return parsed.data;
}

/**
 * Validate client environment variables
 * @returns {z.infer<typeof clientSchema>}
 */
function validateClientEnv() {
  const clientEnv = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_ENABLE_DARK_MODE: process.env.NEXT_PUBLIC_ENABLE_DARK_MODE,
    NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
  };
  
  const parsed = clientSchema.safeParse(clientEnv);
  
  if (!parsed.success) {
    console.error('❌ Invalid client environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    
    // Return partial for graceful degradation
    return clientSchema.parse({});
  }
  
  return parsed.data;
}

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Validated server environment variables
 * Only use in server components, API routes, or server actions
 */
export const serverEnv = typeof window === 'undefined' ? validateServerEnv() : {};

/**
 * Validated client environment variables
 * Safe to use in client components
 */
export const clientEnv = validateClientEnv();

/**
 * Combined environment (for convenience in server contexts)
 * @deprecated Prefer using serverEnv or clientEnv directly for clarity
 */
export const env = {
  ...serverEnv,
  ...clientEnv,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if a required environment variable is set
 * @param {string} key - Environment variable name
 * @returns {boolean}
 */
export function isEnvSet(key) {
  return Boolean(process.env[key]);
}

/**
 * Get environment variable with fallback
 * @param {string} key - Environment variable name
 * @param {string} fallback - Fallback value
 * @returns {string}
 */
export function getEnvOrFallback(key, fallback) {
  return process.env[key] || fallback;
}

/**
 * Check if we're in production
 * @returns {boolean}
 */
export function isProduction() {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if we're in development
 * @returns {boolean}
 */
export function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if Supabase is configured
 * @returns {boolean}
 */
export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Check if Stripe is configured
 * @returns {boolean}
 */
export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Check if OpenAI is configured
 * @returns {boolean}
 */
export function isOpenAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

/**
 * Check if analytics is configured
 * @returns {boolean}
 */
export function isAnalyticsConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
    process.env.NEXT_PUBLIC_POSTHOG_KEY
  );
}

const envModule = {
  env,
  serverEnv,
  clientEnv,
  isEnvSet,
  getEnvOrFallback,
  isProduction,
  isDevelopment,
  isSupabaseConfigured,
  isStripeConfigured,
  isOpenAIConfigured,
  isAnalyticsConfigured,
};

export default envModule;
