/**
 * Garage Enrichment API
 * 
 * POST /api/garage/enrich
 * 
 * Enriches a daily driver vehicle with AI-researched maintenance data,
 * service intervals, known issues, and generates a garage image.
 * 
 * This endpoint:
 * 1. Verifies the user owns the vehicle
 * 2. Checks if enrichment already exists (shared across users)
 * 3. If not, runs AI enrichment and deducts AL credits
 * 4. Links the enrichment to the user's vehicle
 * 
 * Request body:
 *   { vehicleId: string }
 * 
 * Response:
 *   { success: true, enrichment: {...}, source: 'cache'|'new' }
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { 
  enrichDailyDriver, 
  getExistingEnrichment, 
  linkEnrichmentToVehicle 
} from '@/lib/dailyDriverEnrichmentService';
import { deductUsage, getUserBalance } from '@/lib/alUsageService';
import { calculateTokenCost } from '@/lib/alConfig';
import { withErrorLogging } from '@/lib/serverErrorLogger';

// Service role client for database operations
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  return createClient(url, key);
}

// Auth client for user verification
async function getAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );
}

async function handlePost(request) {
  const body = await request.json();
    const { vehicleId } = body;

    if (!vehicleId) {
      return NextResponse.json(
        { success: false, error: 'vehicleId is required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const authClient = await getAuthClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const serviceClient = getServiceClient();

    // Fetch the vehicle and verify ownership
    const { data: vehicle, error: vehicleError } = await serviceClient
      .from('user_vehicles')
      .select('*')
      .eq('id', vehicleId)
      .eq('user_id', userId)
      .single();

    if (vehicleError || !vehicle) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found or not owned by user' },
        { status: 404 }
      );
    }

    // Check if vehicle already has enrichment
    if (vehicle.enrichment_status === 'enriched' && vehicle.enrichment_id) {
      // Fetch the existing enrichment
      const { data: existingEnrichment } = await serviceClient
        .from('daily_driver_enrichments')
        .select('*')
        .eq('id', vehicle.enrichment_id)
        .single();

      if (existingEnrichment) {
        return NextResponse.json({
          success: true,
          enrichment: existingEnrichment,
          source: 'already_linked',
          message: 'Vehicle already has enrichment data',
        });
      }
    }

    // Check if enrichment exists for this year/make/model (shared data)
    const existingShared = await getExistingEnrichment(
      vehicle.year,
      vehicle.make,
      vehicle.model
    );

    if (existingShared) {
      // Link the shared enrichment to this vehicle (free for subsequent users)
      await linkEnrichmentToVehicle(vehicleId, existingShared.id);

      return NextResponse.json({
        success: true,
        enrichment: existingShared,
        source: 'shared',
        message: 'Found existing enrichment data',
      });
    }

    // No existing enrichment - need to run AI enrichment
    // This will cost AL credits

    // Check user has enough balance (estimate ~3500 tokens = ~$0.02)
    const userBalance = await getUserBalance(userId);
    const estimatedCost = calculateTokenCost(2000, 1500); // Rough estimate

    if (!userBalance.isUnlimited && userBalance.balanceCents < estimatedCost) {
      return NextResponse.json({
        success: false,
        error: 'insufficient_balance',
        message: 'Not enough AL credits for enrichment',
        balanceCents: userBalance.balanceCents,
      }, { status: 402 });
    }

    // Update vehicle status to pending
    await serviceClient
      .from('user_vehicles')
      .update({ enrichment_status: 'pending' })
      .eq('id', vehicleId);

    // Run enrichment
    const result = await enrichDailyDriver(
      {
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        trim: vehicle.trim,
      },
      userId
    );

    if (!result.success) {
      // Mark as failed
      await serviceClient
        .from('user_vehicles')
        .update({ enrichment_status: 'failed' })
        .eq('id', vehicleId);

      return NextResponse.json({
        success: false,
        error: 'Enrichment failed',
      }, { status: 500 });
    }

    // Link enrichment to vehicle
    await linkEnrichmentToVehicle(vehicleId, result.enrichment.id);

    // Deduct AL credits if tokens were used (new enrichment)
    if (result.source === 'new' && result.tokenBreakdown) {
      await deductUsage(userId, {
        inputTokens: result.tokenBreakdown.input,
        outputTokens: result.tokenBreakdown.output,
        pageContext: 'garage_enrichment',
        toolCalls: ['daily_driver_enrichment'],
      });
    }

    return NextResponse.json({
      success: true,
      enrichment: result.enrichment,
      source: result.source,
      message: 'Vehicle enrichment completed',
    });
}

/**
 * GET /api/garage/enrich?vehicleId=xxx
 * 
 * Check enrichment status for a vehicle
 */
async function handleGet(request) {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');

    if (!vehicleId) {
      return NextResponse.json(
        { success: false, error: 'vehicleId is required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const authClient = await getAuthClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const serviceClient = getServiceClient();

    // Fetch vehicle with enrichment data
    const { data: vehicle, error } = await serviceClient
      .from('user_vehicles')
      .select(`
        id,
        year,
        make,
        model,
        trim,
        enrichment_id,
        enrichment_status,
        daily_driver_enrichments (
          id,
          maintenance_specs,
          service_intervals,
          known_issues,
          image_url,
          status,
          created_at
        )
      `)
      .eq('id', vehicleId)
      .eq('user_id', user.id)
      .single();

    if (error || !vehicle) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    // Check if shared enrichment exists (even if not linked yet)
    let sharedEnrichment = null;
    if (!vehicle.enrichment_id) {
      sharedEnrichment = await getExistingEnrichment(
        vehicle.year,
        vehicle.make,
        vehicle.model
      );
    }

    return NextResponse.json({
      success: true,
      vehicleId: vehicle.id,
      enrichmentStatus: vehicle.enrichment_status,
      enrichment: vehicle.daily_driver_enrichments || null,
      sharedEnrichmentAvailable: !!sharedEnrichment,
      hasMatchedCar: false, // Daily drivers don't have matched cars
    });
}

// Export wrapped handlers with error logging
export const POST = withErrorLogging(handlePost, { route: 'garage/enrich', feature: 'garage' });
export const GET = withErrorLogging(handleGet, { route: 'garage/enrich', feature: 'garage' });

