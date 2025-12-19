#!/usr/bin/env node
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '..', '.env') });
import {
  buildEventSlug,
  mapRegion,
  getEventTypeId,
  upsertEvent,
  createClientOrThrow,
} from './lib/event-helpers.js';

const majorEvents2026 = [
  {
    name: 'SEMA Show 2026',
    event_type: 'industry',
    city: 'Las Vegas',
    state: 'NV',
    start_date: '2026-11-03',
    end_date: '2026-11-06',
    venue_name: 'Las Vegas Convention Center',
    address: '3150 Paradise Rd',
    zip: '89109',
    latitude: 36.1318,
    longitude: -115.1517,
    source_url: 'https://www.semashow.com',
    cost_text: 'Trade only',
    is_free: false,
    scope: 'national',
    featured: true,
    description: "World's largest automotive aftermarket trade show. 160,000+ attendees, 2,400+ exhibitors.",
  },
  {
    name: 'Barrett-Jackson Scottsdale 2026',
    event_type: 'auction',
    city: 'Scottsdale',
    state: 'AZ',
    start_date: '2026-01-18',
    end_date: '2026-01-26',
    venue_name: 'WestWorld of Scottsdale',
    address: '16601 N Pima Rd',
    zip: '85260',
    latitude: 33.6251,
    longitude: -111.8989,
    source_url: 'https://www.barrett-jackson.com',
    cost_text: '$50-150',
    is_free: false,
    scope: 'national',
    featured: true,
    description: "World's greatest collector car auction. Kicks off auction season.",
  },
  {
    name: "Pebble Beach Concours d'Elegance 2026",
    event_type: 'car-show',
    city: 'Pebble Beach',
    state: 'CA',
    start_date: '2026-08-16',
    end_date: '2026-08-16',
    venue_name: 'Pebble Beach Golf Links',
    address: '1700 17 Mile Dr',
    zip: '93953',
    latitude: 36.5725,
    longitude: -121.9486,
    source_url: 'https://pebblebeachconcours.net',
    cost_text: '$500-1500',
    is_free: false,
    scope: 'national',
    featured: true,
    description: "World's premier celebration of the automobile. Culmination of Monterey Car Week.",
  },
  {
    name: 'Rolex 24 at Daytona 2026',
    event_type: 'track-day',
    city: 'Daytona Beach',
    state: 'FL',
    start_date: '2026-01-24',
    end_date: '2026-01-25',
    venue_name: 'Daytona International Speedway',
    address: '1801 W International Speedway Blvd',
    zip: '32114',
    latitude: 29.1852,
    longitude: -81.0705,
    source_url: 'https://www.daytonainternationalspeedway.com',
    cost_text: '$50-150',
    is_free: false,
    scope: 'national',
    featured: true,
    description: '24-hour IMSA endurance race. Kicks off the racing season.',
  },
  {
    name: '12 Hours of Sebring 2026',
    event_type: 'track-day',
    city: 'Sebring',
    state: 'FL',
    start_date: '2026-03-14',
    end_date: '2026-03-15',
    venue_name: 'Sebring International Raceway',
    address: '113 Midway Dr',
    zip: '33870',
    latitude: 27.4545,
    longitude: -81.3484,
    source_url: 'https://www.sebringraceway.com',
    cost_text: '$50-200',
    is_free: false,
    scope: 'national',
    featured: true,
    description: "America's oldest sports car race. IMSA WeatherTech Championship.",
  },
  {
    name: "Amelia Island Concours d'Elegance 2026",
    event_type: 'car-show',
    city: 'Amelia Island',
    state: 'FL',
    start_date: '2026-03-06',
    end_date: '2026-03-08',
    venue_name: 'The Ritz-Carlton, Amelia Island',
    address: '4750 Amelia Island Pkwy',
    zip: '32034',
    latitude: 30.5766,
    longitude: -81.4423,
    source_url: 'https://www.ameliaconcours.org',
    cost_text: '$150-350',
    is_free: false,
    scope: 'national',
    featured: true,
    description: "Premier East Coast concours. Includes RM Sotheby's auction.",
  },
  {
    name: 'Mecum Kissimmee 2026',
    event_type: 'auction',
    city: 'Kissimmee',
    state: 'FL',
    start_date: '2026-01-02',
    end_date: '2026-01-12',
    venue_name: 'Osceola Heritage Park',
    address: '1875 Silver Spur Ln',
    zip: '34744',
    latitude: 28.3058,
    longitude: -81.4162,
    source_url: 'https://www.mecum.com',
    cost_text: '$30-100',
    is_free: false,
    scope: 'national',
    featured: true,
    description: "World's largest collector car auction. 4,000+ vehicles.",
  },
  {
    name: 'Petit Le Mans 2026',
    event_type: 'track-day',
    city: 'Braselton',
    state: 'GA',
    start_date: '2026-10-10',
    end_date: '2026-10-10',
    venue_name: 'Road Atlanta',
    address: '5300 Winder Hwy',
    zip: '30517',
    latitude: 34.1468,
    longitude: -83.8113,
    source_url: 'https://www.roadatlanta.com',
    cost_text: '$50-150',
    is_free: false,
    scope: 'national',
    featured: true,
    description: '10-hour IMSA endurance race. Season finale at Road Atlanta.',
  },
  {
    name: 'Goodwood Festival of Speed 2026',
    event_type: 'car-show',
    city: 'Chichester',
    state: 'UK',
    start_date: '2026-07-02',
    end_date: '2026-07-05',
    venue_name: 'Goodwood House',
    address: 'Goodwood, Chichester',
    zip: 'PO18 0PX',
    latitude: 50.8608,
    longitude: -0.7558,
    source_url: 'https://www.goodwood.com/fos',
    cost_text: '$150-400',
    is_free: false,
    scope: 'national',
    featured: true,
    description: "World's largest motoring garden party. Legendary hill climb.",
    country: 'UK',
  },
  {
    name: 'Porsche Parade 2026',
    event_type: 'club-meetup',
    city: 'Birmingham',
    state: 'AL',
    start_date: '2026-06-21',
    end_date: '2026-06-27',
    venue_name: 'Birmingham-Jefferson Convention Complex',
    address: '2100 Richard Arrington Jr Blvd N',
    zip: '35203',
    latitude: 33.5207,
    longitude: -86.8025,
    source_url: 'https://www.pca.org/parade',
    cost_text: '$300-600',
    is_free: false,
    scope: 'national',
    featured: false,
    description: 'Porsche Club of America annual convention. 2,000+ Porsches.',
    brand_affinity: 'Porsche',
  },
  {
    name: 'BMW CCA Oktoberfest 2026',
    event_type: 'club-meetup',
    city: 'Monterey',
    state: 'CA',
    start_date: '2026-09-14',
    end_date: '2026-09-19',
    venue_name: 'WeatherTech Raceway Laguna Seca',
    address: '1021 Monterey Salinas Hwy',
    zip: '93940',
    latitude: 36.5841,
    longitude: -121.7535,
    source_url: 'https://www.bmwcca.org/oktoberfest',
    cost_text: '$200-500',
    is_free: false,
    scope: 'national',
    featured: false,
    description: 'BMW Car Club of America annual gathering. Track days, concours, tours.',
    brand_affinity: 'BMW',
  },
  {
    name: 'Radwood Austin 2026',
    event_type: 'car-show',
    city: 'Austin',
    state: 'TX',
    start_date: '2026-04-18',
    end_date: '2026-04-18',
    venue_name: 'Circuit of the Americas',
    address: '9201 Circuit of the Americas Blvd',
    zip: '78617',
    latitude: 30.1346,
    longitude: -97.6358,
    source_url: 'https://radwood.com',
    cost_text: '$30-50',
    is_free: false,
    scope: 'regional',
    featured: false,
    description: 'Celebration of 80s and 90s car culture.',
  },
];

async function main() {
  const client = createClientOrThrow();
  console.log('🚀 Seeding major 2026 events...\n');

  const typeCache = new Map();
  let created = 0;
  let updated = 0;

  for (const event of majorEvents2026) {
    const slug = buildEventSlug(event.name, event.city, event.start_date);
    const region = mapRegion(event.state);
    const eventTypeSlug = event.event_type;
    if (!typeCache.has(eventTypeSlug)) {
      typeCache.set(eventTypeSlug, await getEventTypeId(client, eventTypeSlug));
    }
    const event_type_id = typeCache.get(eventTypeSlug);

    const { data: existing } = await client
      .from('events')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    // Destructure out fields that aren't database columns
    const { event_type, brand_affinity, ...eventData } = event;
    
    const base = {
      ...eventData,
      slug,
      event_type_id,
      region,
      country: eventData.country || 'USA',
    };

    const carAffinities = brand_affinity
      ? [{ brand: brand_affinity, affinity_type: 'featured' }]
      : [];

    const result = await upsertEvent(client, base, { carAffinities });
    if (existing?.id) {
      updated += 1;
      console.log(`🔄 Updated ${event.name} (${result.slug})`);
    } else {
      created += 1;
      console.log(`✅ Inserted ${event.name} (${result.slug})`);
    }
  }

  console.log('\nSummary:');
  console.log(`  Created: ${created}`);
  console.log(`  Updated: ${updated}`);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

