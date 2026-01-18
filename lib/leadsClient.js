/**
 * Leads API Client
 * 
 * Provides functions to manage lead capture for AutoRev.
 * Handles form submissions from Contact page, newsletter signups, and hero page CTAs.
 */

import { supabase, isSupabaseConfigured } from './supabase.js';

/**
 * Valid lead sources for categorization
 * Must match the CHECK constraint in supabase/schema.sql
 */
export const LEAD_SOURCES = {
  CONTACT: 'contact',
  NEWSLETTER: 'newsletter',
  HERO_PAGE: 'hero-page',
  ADVISORY_FUTURE: 'advisory-future', // Reserved for future email-gated advisory
  UPGRADE_INQUIRY: 'upgrade-inquiry',
  SERVICE_BOOKING: 'service-booking',
  PERFORMANCE_HUB: 'performance-hub',
};

/**
 * User-friendly error messages for common scenarios
 */
const ERROR_MESSAGES = {
  EMAIL_REQUIRED: 'Please enter your email address.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  SOURCE_REQUIRED: 'Unable to process request. Please try again.',
  NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
  DUPLICATE_EMAIL: 'You\'re already subscribed! We\'ll keep you updated.',
  GENERIC_ERROR: 'Something went wrong. Please try again later.',
};

/**
 * Submit a new lead to the database
 * @param {Object} leadData - The lead data to submit
 * @param {string} leadData.email - Required email address
 * @param {string} [leadData.name] - Optional name
 * @param {string} leadData.source - Source of the lead (use LEAD_SOURCES constants)
 * @param {string} [leadData.carSlug] - Optional car slug if related to a specific car
 * @param {string} [leadData.message] - Optional message (for contact form)
 * @param {string} [leadData.interest] - Optional interest area
 * @param {Object} [leadData.metadata] - Optional additional metadata
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function submitLead({ email, name, source, carSlug, message, interest, metadata = {} }) {
  // Validate required fields
  if (!email || !email.trim()) {
    return { success: false, error: 'Email is required' };
  }

  if (!source) {
    return { success: false, error: 'Lead source is required' };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: 'Invalid email format' };
  }

  // If Supabase is not configured, log and return success (for development)
  if (!isSupabaseConfigured || !supabase) {
    console.log('[leadsClient] Supabase not configured. Lead would be submitted:', {
      email,
      name,
      source,
      carSlug,
      message,
      interest,
      metadata,
    });
    return { 
      success: true, 
      data: { 
        id: 'local-dev-' + Date.now(),
        email,
        name,
        source,
        message: 'Lead captured locally (Supabase not configured)',
      },
    };
  }

  try {
    // Prepare the lead record
    const leadRecord = {
      email: email.trim().toLowerCase(),
      name: name?.trim() || null,
      source,
      car_interest_slug: carSlug || null,
      metadata: {
        ...metadata,
        message: message || null,
        interest: interest || null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        submitted_at: new Date().toISOString(),
      },
    };

    // Use upsert pattern - on duplicate email, update the metadata
    const { data, error } = await supabase
      .from('leads')
      .upsert(
        [leadRecord],
        { 
          onConflict: 'email',
          ignoreDuplicates: false 
        }
      )
      .select()
      .single();

    if (error) {
      console.error('[leadsClient] Error submitting lead:', error);
      
      // RLS errors indicate permission issues
      if (error.code === '42501') {
        console.error('[leadsClient] RLS policy violation - check leads table policies');
      }
      
      return { success: false, error: 'Failed to submit. Please try again.' };
    }

    console.log('[leadsClient] Lead submitted successfully:', data.id);
    return { success: true, data };
  } catch (err) {
    console.error('[leadsClient] Unexpected error submitting lead:', err);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}

// Note: Using upsert pattern in submitLead eliminates the need for manual
// updateExistingLead logic. The database handles duplicate emails via ON CONFLICT.

/**
 * Check if an email already exists in the leads database
 * @param {string} email - Email to check
 * @returns {Promise<boolean>}
 */
export async function checkEmailExists(email) {
  if (!isSupabaseConfigured || !supabase) {
    return false;
  }

  try {
    const { count, error } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('email', email.trim().toLowerCase());

    if (error) {
      console.error('[leadsClient] Error checking email:', error);
      return false;
    }

    return count > 0;
  } catch (err) {
    console.error('[leadsClient] Unexpected error checking email:', err);
    return false;
  }
}

const leadsClient = {
  submitLead,
  checkEmailExists,
  LEAD_SOURCES,
};

export default leadsClient;

