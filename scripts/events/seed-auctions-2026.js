#!/usr/bin/env node
/**
 * Seed Collector Car Auctions for 2025-2026
 * 
 * Populates major auction house events:
 * - Barrett-Jackson
 * - Mecum Auctions
 * - RM Sotheby's
 * - Gooding & Company
 * - Bonhams
 * 
 * Usage:
 *   node scripts/events/seed-auctions-2026.js
 * 
 * @module scripts/events/seed-auctions-2026
 */

import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local for Next.js projects
dotenv.config({ path: join(__dirname, '..', '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '..', '.env') });
import {
  buildEventSlug,
  mapRegion,
  getEventTypeId,
  upsertEvent,
  createClientOrThrow,
} from './lib/event-helpers.js';

const EVENT_TYPE_SLUG = 'auction';

const auctions2026 = [
  // ============================================================================
  // BARRETT-JACKSON (4 major events per year)
  // ============================================================================
  {
    name: 'Barrett-Jackson Scottsdale 2026',
    city: 'Scottsdale',
    state: 'AZ',
    start_date: '2026-01-18',
    end_date: '2026-01-26',
    venue_name: 'WestWorld of Scottsdale',
    address: '16601 N Pima Rd',
    zip: '85260',
    latitude: 33.6251,
    longitude: -111.8989,
    source_url: 'https://www.barrett-jackson.com/2026-scottsdale',
    cost_text: '$50-150',
    is_free: false,
    scope: 'national',
    featured: true,
    description: "World's greatest collector car auction. Kicks off auction season with 1,800+ vehicles.",
  },
  {
    name: 'Barrett-Jackson Palm Beach 2026',
    city: 'West Palm Beach',
    state: 'FL',
    start_date: '2026-04-16',
    end_date: '2026-04-18',
    venue_name: 'South Florida Fairgrounds',
    address: '9067 Southern Blvd',
    zip: '33411',
    latitude: 26.6815,
    longitude: -80.1854,
    source_url: 'https://www.barrett-jackson.com/2026-palm-beach',
    cost_text: '$40-100',
    is_free: false,
    scope: 'national',
    featured: true,
    description: "Barrett-Jackson's spring auction in South Florida. 600+ vehicles.",
  },
  {
    name: 'Barrett-Jackson Las Vegas 2026',
    city: 'Las Vegas',
    state: 'NV',
    start_date: '2026-06-18',
    end_date: '2026-06-20',
    venue_name: 'Las Vegas Convention Center',
    address: '3150 Paradise Rd',
    zip: '89109',
    latitude: 36.1318,
    longitude: -115.1517,
    source_url: 'https://www.barrett-jackson.com/2026-las-vegas',
    cost_text: '$40-100',
    is_free: false,
    scope: 'national',
    featured: false,
    description: "Barrett-Jackson's summer auction in Las Vegas. 500+ vehicles.",
  },
  {
    name: 'Barrett-Jackson Houston 2026',
    city: 'Houston',
    state: 'TX',
    start_date: '2026-09-17',
    end_date: '2026-09-19',
    venue_name: 'NRG Center',
    address: '1 NRG Park',
    zip: '77054',
    latitude: 29.6847,
    longitude: -95.4107,
    source_url: 'https://www.barrett-jackson.com/2026-houston',
    cost_text: '$40-100',
    is_free: false,
    scope: 'national',
    featured: false,
    description: "Barrett-Jackson's fall auction in Houston. 600+ vehicles.",
  },

  // ============================================================================
  // MECUM AUCTIONS (12-15 events per year)
  // ============================================================================
  {
    name: 'Mecum Kissimmee 2026',
    city: 'Kissimmee',
    state: 'FL',
    start_date: '2026-01-06',
    end_date: '2026-01-18',
    venue_name: 'Osceola Heritage Park',
    address: '1875 Silver Spur Ln',
    zip: '34744',
    latitude: 28.3058,
    longitude: -81.4162,
    source_url: 'https://www.mecum.com/auctions/kissimmee-2026/',
    cost_text: '$30-100',
    is_free: false,
    scope: 'national',
    featured: true,
    description: "World's largest collector car auction. 4,000+ vehicles over 13 days.",
  },
  {
    name: 'Mecum Glendale 2026',
    city: 'Glendale',
    state: 'AZ',
    start_date: '2026-03-18',
    end_date: '2026-03-22',
    venue_name: 'State Farm Stadium',
    address: '1 Cardinals Dr',
    zip: '85305',
    latitude: 33.5276,
    longitude: -112.2626,
    source_url: 'https://www.mecum.com/auctions/glendale-2026/',
    cost_text: '$30-100',
    is_free: false,
    scope: 'national',
    featured: false,
    description: "Mecum's Arizona auction. 1,500+ vehicles.",
  },
  {
    name: 'Mecum Houston 2026',
    city: 'Houston',
    state: 'TX',
    start_date: '2026-04-02',
    end_date: '2026-04-04',
    venue_name: 'NRG Center',
    address: '1 NRG Park',
    zip: '77054',
    latitude: 29.6847,
    longitude: -95.4107,
    source_url: 'https://www.mecum.com/auctions/houston-2026/',
    cost_text: '$30-75',
    is_free: false,
    scope: 'regional',
    featured: false,
    description: "Mecum's spring Texas auction. 1,000+ vehicles.",
  },
  {
    name: 'Mecum Indianapolis 2026',
    city: 'Indianapolis',
    state: 'IN',
    start_date: '2026-05-12',
    end_date: '2026-05-16',
    venue_name: 'Indiana State Fairgrounds',
    address: '1202 E 38th St',
    zip: '46205',
    latitude: 39.8263,
    longitude: -86.1270,
    source_url: 'https://www.mecum.com/auctions/indy-2026/',
    cost_text: '$30-100',
    is_free: false,
    scope: 'national',
    featured: true,
    description: "Mecum's flagship May auction in Indy. 2,500+ vehicles.",
  },
  {
    name: 'Mecum Portland 2026',
    city: 'Portland',
    state: 'OR',
    start_date: '2026-06-19',
    end_date: '2026-06-21',
    venue_name: 'Portland Expo Center',
    address: '2060 N Marine Dr',
    zip: '97217',
    latitude: 45.6048,
    longitude: -122.6815,
    source_url: 'https://www.mecum.com/auctions/portland-2026/',
    cost_text: '$30-75',
    is_free: false,
    scope: 'regional',
    featured: false,
    description: "Mecum's Pacific Northwest auction. 600+ vehicles.",
  },
  {
    name: 'Mecum Harrisburg 2026',
    city: 'Harrisburg',
    state: 'PA',
    start_date: '2026-07-30',
    end_date: '2026-08-01',
    venue_name: 'Pennsylvania Farm Show Complex',
    address: '2300 N Cameron St',
    zip: '17110',
    latitude: 40.2845,
    longitude: -76.8745,
    source_url: 'https://www.mecum.com/auctions/harrisburg-2026/',
    cost_text: '$30-75',
    is_free: false,
    scope: 'regional',
    featured: false,
    description: "Mecum's Northeast auction. 1,000+ vehicles.",
  },
  {
    name: 'Mecum Monterey 2026',
    city: 'Monterey',
    state: 'CA',
    start_date: '2026-08-14',
    end_date: '2026-08-16',
    venue_name: 'Hyatt Regency Monterey',
    address: '1 Old Golf Course Rd',
    zip: '93940',
    latitude: 36.5970,
    longitude: -121.8530,
    source_url: 'https://www.mecum.com/auctions/monterey-2026/',
    cost_text: '$50-150',
    is_free: false,
    scope: 'national',
    featured: true,
    description: "Mecum's Monterey Car Week auction. Premium consignments.",
  },
  {
    name: 'Mecum Dallas 2026',
    city: 'Dallas',
    state: 'TX',
    start_date: '2026-09-03',
    end_date: '2026-09-05',
    venue_name: 'Kay Bailey Hutchison Convention Center',
    address: '650 S Griffin St',
    zip: '75202',
    latitude: 32.7707,
    longitude: -96.8010,
    source_url: 'https://www.mecum.com/auctions/dallas-2026/',
    cost_text: '$30-75',
    is_free: false,
    scope: 'regional',
    featured: false,
    description: "Mecum's fall Texas auction. 1,000+ vehicles.",
  },
  {
    name: 'Mecum Chicago 2026',
    city: 'Schaumburg',
    state: 'IL',
    start_date: '2026-10-08',
    end_date: '2026-10-10',
    venue_name: 'Schaumburg Convention Center',
    address: '1551 N Thoreau Dr',
    zip: '60173',
    latitude: 42.0345,
    longitude: -88.0834,
    source_url: 'https://www.mecum.com/auctions/chicago-2026/',
    cost_text: '$30-75',
    is_free: false,
    scope: 'regional',
    featured: false,
    description: "Mecum's Midwest fall auction. 1,000+ vehicles.",
  },
  {
    name: 'Mecum Las Vegas 2026',
    city: 'Las Vegas',
    state: 'NV',
    start_date: '2026-11-12',
    end_date: '2026-11-14',
    venue_name: 'Las Vegas Convention Center',
    address: '3150 Paradise Rd',
    zip: '89109',
    latitude: 36.1318,
    longitude: -115.1517,
    source_url: 'https://www.mecum.com/auctions/las-vegas-2026/',
    cost_text: '$30-75',
    is_free: false,
    scope: 'regional',
    featured: false,
    description: "Mecum's November Vegas auction. 1,000+ vehicles.",
  },
  {
    name: 'Mecum Kansas City 2026',
    city: 'Kansas City',
    state: 'MO',
    start_date: '2026-12-03',
    end_date: '2026-12-05',
    venue_name: 'Kansas City Convention Center',
    address: '301 W 13th St',
    zip: '64105',
    latitude: 39.0997,
    longitude: -94.5886,
    source_url: 'https://www.mecum.com/auctions/kansas-city-2026/',
    cost_text: '$30-75',
    is_free: false,
    scope: 'regional',
    featured: false,
    description: "Mecum's year-end auction. Season finale.",
  },

  // ============================================================================
  // RM SOTHEBY'S (8-10 events per year, premium segment)
  // ============================================================================
  {
    name: "RM Sotheby's Arizona 2026",
    city: 'Phoenix',
    state: 'AZ',
    start_date: '2026-01-22',
    end_date: '2026-01-23',
    venue_name: 'Arizona Biltmore Resort',
    address: '2400 E Missouri Ave',
    zip: '85016',
    latitude: 33.5221,
    longitude: -112.0215,
    source_url: 'https://rmsothebys.com/auctions/az26',
    cost_text: '$100-300',
    is_free: false,
    scope: 'national',
    featured: true,
    description: "RM Sotheby's flagship Arizona auction. Premier consignments.",
  },
  {
    name: "RM Sotheby's Amelia Island 2026",
    city: 'Amelia Island',
    state: 'FL',
    start_date: '2026-03-07',
    end_date: '2026-03-07',
    venue_name: 'The Ritz-Carlton, Amelia Island',
    address: '4750 Amelia Island Pkwy',
    zip: '32034',
    latitude: 30.5766,
    longitude: -81.4423,
    source_url: 'https://rmsothebys.com/auctions/am26',
    cost_text: '$100-250',
    is_free: false,
    scope: 'national',
    featured: true,
    description: "RM Sotheby's Amelia Island Concours auction. Blue-chip classics.",
  },
  {
    name: "RM Sotheby's Monterey 2026",
    city: 'Monterey',
    state: 'CA',
    start_date: '2026-08-14',
    end_date: '2026-08-15',
    venue_name: 'Monterey Conference Center',
    address: '1 Portola Plaza',
    zip: '93940',
    latitude: 36.6002,
    longitude: -121.8947,
    source_url: 'https://rmsothebys.com/auctions/mo26',
    cost_text: '$150-500',
    is_free: false,
    scope: 'national',
    featured: true,
    description: "RM Sotheby's Monterey Car Week auction. Record-breaking sales.",
  },
  {
    name: "RM Sotheby's Hershey 2026",
    city: 'Hershey',
    state: 'PA',
    start_date: '2026-10-08',
    end_date: '2026-10-09',
    venue_name: 'The Hershey Lodge',
    address: '325 University Dr',
    zip: '17033',
    latitude: 40.2932,
    longitude: -76.6419,
    source_url: 'https://rmsothebys.com/auctions/he26',
    cost_text: '$75-200',
    is_free: false,
    scope: 'national',
    featured: false,
    description: "RM Sotheby's Hershey auction during AACA meet. American classics.",
  },

  // ============================================================================
  // GOODING & COMPANY (3-4 events per year, ultra-premium)
  // ============================================================================
  {
    name: 'Gooding & Company Scottsdale 2026',
    city: 'Scottsdale',
    state: 'AZ',
    start_date: '2026-01-16',
    end_date: '2026-01-17',
    venue_name: 'Scottsdale Fashion Square',
    address: '7014 E Camelback Rd',
    zip: '85251',
    latitude: 33.5023,
    longitude: -111.9260,
    source_url: 'https://www.goodingco.com/auction/scottsdale-2026',
    cost_text: '$100-300',
    is_free: false,
    scope: 'national',
    featured: true,
    description: "Gooding's Scottsdale auction. Ultra-premium collector cars.",
  },
  {
    name: 'Gooding & Company Amelia Island 2026',
    city: 'Amelia Island',
    state: 'FL',
    start_date: '2026-03-06',
    end_date: '2026-03-06',
    venue_name: 'The Ritz-Carlton, Amelia Island',
    address: '4750 Amelia Island Pkwy',
    zip: '32034',
    latitude: 30.5766,
    longitude: -81.4423,
    source_url: 'https://www.goodingco.com/auction/amelia-island-2026',
    cost_text: '$100-250',
    is_free: false,
    scope: 'national',
    featured: false,
    description: "Gooding's Amelia Island auction. Curated selection.",
  },
  {
    name: 'Gooding & Company Pebble Beach 2026',
    city: 'Pebble Beach',
    state: 'CA',
    start_date: '2026-08-14',
    end_date: '2026-08-15',
    venue_name: 'Pebble Beach Equestrian Center',
    address: '3300 Portola Rd',
    zip: '93953',
    latitude: 36.5660,
    longitude: -121.9350,
    source_url: 'https://www.goodingco.com/auction/pebble-beach-2026',
    cost_text: '$200-500',
    is_free: false,
    scope: 'national',
    featured: true,
    description: "Gooding's Pebble Beach auction. The pinnacle of collector car auctions.",
  },

  // ============================================================================
  // BONHAMS (4-5 events per year)
  // ============================================================================
  {
    name: 'Bonhams Scottsdale 2026',
    city: 'Scottsdale',
    state: 'AZ',
    start_date: '2026-01-23',
    end_date: '2026-01-23',
    venue_name: 'Westin Kierland Resort',
    address: '6902 E Greenway Pkwy',
    zip: '85254',
    latitude: 33.6235,
    longitude: -111.9236,
    source_url: 'https://www.bonhams.com/auctions/scottsdale-2026/',
    cost_text: '$75-200',
    is_free: false,
    scope: 'national',
    featured: false,
    description: "Bonhams' Scottsdale auction. European and American classics.",
  },
  {
    name: 'Bonhams Amelia Island 2026',
    city: 'Amelia Island',
    state: 'FL',
    start_date: '2026-03-05',
    end_date: '2026-03-05',
    venue_name: 'Fernandina Beach Golf Club',
    address: '2800 Bill Melton Rd',
    zip: '32034',
    latitude: 30.6129,
    longitude: -81.4490,
    source_url: 'https://www.bonhams.com/auctions/amelia-island-2026/',
    cost_text: '$75-200',
    is_free: false,
    scope: 'national',
    featured: false,
    description: "Bonhams' Amelia Island auction.",
  },
  {
    name: 'Bonhams Greenwich Concours 2026',
    city: 'Greenwich',
    state: 'CT',
    start_date: '2026-06-06',
    end_date: '2026-06-06',
    venue_name: 'Roger Sherman Baldwin Park',
    address: '100 Arch St',
    zip: '06830',
    latitude: 41.0219,
    longitude: -73.6253,
    source_url: 'https://www.bonhams.com/auctions/greenwich-2026/',
    cost_text: '$75-150',
    is_free: false,
    scope: 'regional',
    featured: false,
    description: "Bonhams' Greenwich Concours auction. East Coast highlight.",
  },
  {
    name: 'Bonhams Quail Lodge 2026',
    city: 'Carmel',
    state: 'CA',
    start_date: '2026-08-14',
    end_date: '2026-08-14',
    venue_name: 'Quail Lodge & Golf Club',
    address: '8205 Valley Greens Dr',
    zip: '93923',
    latitude: 36.5006,
    longitude: -121.8460,
    source_url: 'https://www.bonhams.com/auctions/quail-2026/',
    cost_text: '$100-300',
    is_free: false,
    scope: 'national',
    featured: false,
    description: "Bonhams' Quail Lodge auction during Monterey Car Week.",
  },

  // ============================================================================
  // BRING A TRAILER (Online - weekly highlights)
  // Note: BaT is primarily online, but they do special in-person events
  // ============================================================================
  {
    name: 'Bring a Trailer Monterey 2026',
    city: 'Monterey',
    state: 'CA',
    start_date: '2026-08-13',
    end_date: '2026-08-15',
    venue_name: 'Downtown Monterey',
    address: 'Alvarado Street',
    zip: '93940',
    latitude: 36.6002,
    longitude: -121.8947,
    source_url: 'https://bringatrailer.com/monterey-2026/',
    cost_text: 'Free',
    is_free: true,
    scope: 'national',
    featured: false,
    description: "Bring a Trailer's Monterey Car Week presence. Meet the community.",
  },
];

async function main() {
  const client = createClientOrThrow();
  console.log('🔨 Seeding Collector Car Auctions 2026...\n');

  const event_type_id = await getEventTypeId(client, EVENT_TYPE_SLUG);
  let created = 0;
  let updated = 0;

  for (const event of auctions2026) {
    const slug = buildEventSlug(event.name, event.city, event.start_date);
    const region = mapRegion(event.state);

    const { data: existing } = await client
      .from('events')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    const payload = {
      ...event,
      slug,
      event_type_id,
      region,
      country: 'USA',
    };

    await upsertEvent(client, payload);

    if (existing?.id) {
      updated++;
      console.log(`🔄 Updated ${event.name}`);
    } else {
      created++;
      console.log(`✅ Inserted ${event.name}`);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`  Created: ${created}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Total auctions: ${auctions2026.length}`);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

