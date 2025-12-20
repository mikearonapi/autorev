#!/usr/bin/env node
/**
 * MotorsportReg API Client
 * 
 * Fetches track day, autocross, and club events from MotorsportReg.com
 * 
 * Key insight from docs: Per-organization calendars are UNAUTHENTICATED
 * GET /rest/calendars/organization/{organization_id}.json works without auth!
 * 
 * Also supports:
 * - Geospatial filtering by postal code + radius
 * - Date range filtering with start/end params
 * - Event type filtering
 * 
 * @see https://api.motorsportreg.com/
 */

import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '..', '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '..', '..', '.env') });

const BASE_URL = 'https://api.motorsportreg.com/rest';

// Known organization IDs for major clubs/regions
// These can be discovered by looking at MSR event URLs or contacting the organizations
const KNOWN_ORGANIZATIONS = {
  // NASA Regions
  'nasa-northeast': '4F85F730-E015-5DA4-983D7B46E5E2A4D0',
  'nasa-norcal': 'EAB5ED38-D39D-4FEB-8ED0B8F5A06F6C26',
  'nasa-socal': '7DEE2C76-A4A2-4C7C-AAF8D2C4D4B4D7A8',
  'nasa-texas': '8A3B5C2D-E4F5-6789-ABCD-1234567890AB',
  'nasa-southeast': '9B4C6D3E-F5A6-7890-BCDE-2345678901BC',
  'nasa-great-lakes': 'AA5D7E4F-A6B7-8901-CDEF-3456789012CD',
  'nasa-mid-atlantic': 'BB6E8F5A-B7C8-9012-DEFA-4567890123DE',
  'nasa-rocky-mountain': 'CC7F9A6B-C8D9-0123-EFAB-5678901234EF',
  'nasa-utah': 'DD8AAB7C-D9EA-1234-FABC-6789012345FA',
  'nasa-arizona': 'EE9BBC8D-EAFB-2345-ABCD-7890123456AB',
  
  // PCA Regions (Porsche Club of America)
  'pca-national': '12345678-ABCD-EFGH-IJKL-MNOPQRSTUVWX',
  
  // BMW CCA Regions
  'bmwcca-national': '23456789-BCDE-FGHI-JKLM-NOPQRSTUVWXY',
  
  // SCCA Regions
  'scca-national': '34567890-CDEF-GHIJ-KLMN-OPQRSTUVWXYZ',
  'wdcr-scca': '45678901-DEFG-HIJK-LMNO-PQRSTUVWXYZA',
  
  // Track Day Organizations
  'chin-track-days': '56789012-EFGH-IJKL-MNOP-QRSTUVWXYZAB',
  'hooked-on-driving': '67890123-FGHI-JKLM-NOPQ-RSTUVWXYZABC',
  'trackdaze': '78901234-GHIJ-KLMN-OPQR-STUVWXYZABCD',
  
  // Note: These are placeholder IDs - real IDs need to be discovered
};

// Event type mappings from MSR to our database
const EVENT_TYPE_MAP = {
  'HPDE': 'track-day',
  'High Performance Driving': 'track-day',
  'Track Day': 'track-day',
  'Open Track': 'track-day',
  'Lapping': 'track-day',
  'Autocross': 'autocross',
  'Solo': 'autocross',
  'Time Trial': 'time-attack',
  'Time Attack': 'time-attack',
  'Rally': 'cruise',
  'Tour': 'cruise',
  'Drive': 'cruise',
  'Meeting': 'club-meetup',
  'Social': 'club-meetup',
  'Concours': 'car-show',
  'Car Show': 'car-show',
};

/**
 * Fetch events from a specific organization calendar
 * This endpoint is UNAUTHENTICATED
 */
async function fetchOrganizationEvents(orgId, options = {}) {
  const params = new URLSearchParams();
  
  // Date range filtering
  if (options.startDate) {
    params.append('start', options.startDate);
  }
  if (options.endDate) {
    params.append('end', options.endDate);
  }
  
  // Geospatial filtering
  if (options.postalCode) {
    params.append('postalcode', options.postalCode);
    params.append('radius', options.radius || 300);
    if (options.country) {
      params.append('country', options.country);
    }
  }
  
  // Exclude cancelled events
  params.append('exclude_cancelled', 'true');
  
  const url = `${BASE_URL}/calendars/organization/${orgId}.json?${params.toString()}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.pukkasoft+json',
        'User-Agent': 'AutoRev Events Aggregator/1.0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.response?.events || [];
  } catch (error) {
    console.error(`Failed to fetch org ${orgId}: ${error.message}`);
    return [];
  }
}

/**
 * Fetch events by venue ID
 * Requires authentication but useful if we have credentials
 */
async function fetchVenueEvents(venueId, options = {}) {
  const params = new URLSearchParams();
  
  if (options.startDate) params.append('start', options.startDate);
  if (options.endDate) params.append('end', options.endDate);
  params.append('exclude_cancelled', 'true');
  
  const url = `${BASE_URL}/calendars/venue/${venueId}.json?${params.toString()}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.pukkasoft+json',
        'User-Agent': 'AutoRev Events Aggregator/1.0',
        // Add auth headers if we have credentials
        ...(options.auth ? {
          'Authorization': `Basic ${Buffer.from(`${options.auth.username}:${options.auth.password}`).toString('base64')}`,
          'X-Organization-Id': options.auth.orgId,
        } : {}),
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.response?.events || [];
  } catch (error) {
    console.error(`Failed to fetch venue ${venueId}: ${error.message}`);
    return [];
  }
}

/**
 * Fetch events by type (HPDE, Autocross, etc.)
 * Requires authentication
 */
async function fetchEventsByType(typeId, options = {}) {
  const params = new URLSearchParams();
  
  if (options.startDate) params.append('start', options.startDate);
  if (options.endDate) params.append('end', options.endDate);
  if (options.postalCode) {
    params.append('postalcode', options.postalCode);
    params.append('radius', options.radius || 300);
  }
  params.append('exclude_cancelled', 'true');
  
  const url = `${BASE_URL}/calendars/type/${typeId}.json?${params.toString()}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.pukkasoft+json',
        'User-Agent': 'AutoRev Events Aggregator/1.0',
        ...(options.auth ? {
          'Authorization': `Basic ${Buffer.from(`${options.auth.username}:${options.auth.password}`).toString('base64')}`,
          'X-Organization-Id': options.auth.orgId,
        } : {}),
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.response?.events || [];
  } catch (error) {
    console.error(`Failed to fetch type ${typeId}: ${error.message}`);
    return [];
  }
}

/**
 * Transform MSR event to our database format
 */
function transformEvent(msrEvent) {
  const eventType = mapEventType(msrEvent.type);
  
  return {
    name: msrEvent.name,
    city: msrEvent.venue?.city || null,
    state: msrEvent.venue?.region || null,
    venue_name: msrEvent.venue?.name || null,
    address: msrEvent.venue?.address || null,
    zip: msrEvent.venue?.postalcode || null,
    latitude: msrEvent.venue?.latitude ? parseFloat(msrEvent.venue.latitude) : null,
    longitude: msrEvent.venue?.longitude ? parseFloat(msrEvent.venue.longitude) : null,
    start_date: msrEvent.start?.split('T')[0] || null,
    end_date: msrEvent.end?.split('T')[0] || msrEvent.start?.split('T')[0] || null,
    source_url: msrEvent.detailuri || null,
    description: msrEvent.description || `${msrEvent.type} event at ${msrEvent.venue?.name || 'TBD'}`,
    cost_text: msrEvent.registration?.cost || null,
    is_free: false,
    event_type_slug: eventType,
    msr_event_id: msrEvent.id || null,
    msr_organization: msrEvent.organization?.name || null,
  };
}

/**
 * Map MSR event type to our event type slug
 */
function mapEventType(msrType) {
  if (!msrType) return 'track-day';
  
  const normalized = msrType.toLowerCase();
  
  for (const [pattern, slug] of Object.entries(EVENT_TYPE_MAP)) {
    if (normalized.includes(pattern.toLowerCase())) {
      return slug;
    }
  }
  
  // Default to track-day for unknown motorsport events
  return 'track-day';
}

/**
 * Discover organization IDs by fetching the RSS feed
 * This is a workaround since we don't have a list of all org IDs
 */
async function discoverOrganizationId(searchTerm) {
  // The MSR website URLs often contain the org ID
  // Example: https://www.motorsportreg.com/orgs/nasa-northeast
  // We can try to extract it from their calendar embed
  console.log(`Note: To discover org ID for "${searchTerm}", visit their MSR page and look for the organization ID in calendar embed code.`);
  return null;
}

/**
 * Fetch RSS feed (unauthenticated) and parse for basic event info
 * Useful for discovery without full API access
 */
async function fetchOrganizationRSS(orgId) {
  const url = `${BASE_URL}/calendars/organization/${orgId}.rss`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AutoRev Events Aggregator/1.0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error(`Failed to fetch RSS for org ${orgId}: ${error.message}`);
    return null;
  }
}

/**
 * Fetch iCal feed (unauthenticated) for calendar integration
 */
async function fetchOrganizationICal(orgId) {
  const url = `${BASE_URL}/calendars/organization/${orgId}.ics`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AutoRev Events Aggregator/1.0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error(`Failed to fetch iCal for org ${orgId}: ${error.message}`);
    return null;
  }
}

// Export functions for use in other scripts
export {
  fetchOrganizationEvents,
  fetchVenueEvents,
  fetchEventsByType,
  fetchOrganizationRSS,
  fetchOrganizationICal,
  transformEvent,
  mapEventType,
  discoverOrganizationId,
  KNOWN_ORGANIZATIONS,
  EVENT_TYPE_MAP,
  BASE_URL,
};

// CLI mode
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  async function main() {
    const args = process.argv.slice(2);
    const orgId = args[0];
    
    if (!orgId) {
      console.log('MotorsportReg API Client\n');
      console.log('Usage:');
      console.log('  node motorsportreg-client.js <organization-id> [--start=YYYY-MM-DD] [--end=YYYY-MM-DD]');
      console.log('  node motorsportreg-client.js --discover <search-term>');
      console.log('  node motorsportreg-client.js --list-orgs');
      console.log('\nKnown organizations:');
      for (const [name, id] of Object.entries(KNOWN_ORGANIZATIONS)) {
        console.log(`  ${name}: ${id}`);
      }
      console.log('\nNote: Organization IDs are placeholders. Real IDs need to be discovered.');
      console.log('To find a real org ID, visit their MSR calendar page and check the embed code.');
      return;
    }
    
    if (orgId === '--list-orgs') {
      console.log('Known organizations:');
      for (const [name, id] of Object.entries(KNOWN_ORGANIZATIONS)) {
        console.log(`  ${name}: ${id}`);
      }
      return;
    }
    
    if (orgId === '--discover') {
      const searchTerm = args[1];
      await discoverOrganizationId(searchTerm);
      return;
    }
    
    // Parse options
    const options = {};
    for (const arg of args.slice(1)) {
      if (arg.startsWith('--start=')) {
        options.startDate = arg.split('=')[1];
      } else if (arg.startsWith('--end=')) {
        options.endDate = arg.split('=')[1];
      } else if (arg.startsWith('--zip=')) {
        options.postalCode = arg.split('=')[1];
      } else if (arg.startsWith('--radius=')) {
        options.radius = parseInt(arg.split('=')[1], 10);
      }
    }
    
    // Set default date range to 2026
    if (!options.startDate) {
      options.startDate = '2026-01-01';
    }
    if (!options.endDate) {
      options.endDate = '2026-12-31';
    }
    
    console.log(`Fetching events for organization: ${orgId}`);
    console.log(`Date range: ${options.startDate} to ${options.endDate}`);
    if (options.postalCode) {
      console.log(`Location: ${options.postalCode} within ${options.radius || 300} miles`);
    }
    console.log('');
    
    const events = await fetchOrganizationEvents(orgId, options);
    
    if (events.length === 0) {
      console.log('No events found. The organization ID may be invalid or there are no upcoming events.');
      console.log('\nTry fetching the RSS feed to verify the org ID is correct:');
      const rss = await fetchOrganizationRSS(orgId);
      if (rss) {
        console.log('RSS feed retrieved successfully. First 500 chars:');
        console.log(rss.substring(0, 500));
      }
      return;
    }
    
    console.log(`Found ${events.length} events:\n`);
    
    for (const event of events.slice(0, 20)) {
      const transformed = transformEvent(event);
      console.log(`📅 ${transformed.name}`);
      console.log(`   Date: ${transformed.start_date} to ${transformed.end_date}`);
      console.log(`   Venue: ${transformed.venue_name || 'TBD'}`);
      console.log(`   Location: ${transformed.city}, ${transformed.state}`);
      console.log(`   Type: ${event.type} → ${transformed.event_type_slug}`);
      console.log(`   URL: ${transformed.source_url}`);
      console.log('');
    }
    
    if (events.length > 20) {
      console.log(`... and ${events.length - 20} more events`);
    }
  }
  
  main().catch(console.error);
}








