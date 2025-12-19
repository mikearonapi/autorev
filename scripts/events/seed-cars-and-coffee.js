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
  generateRecurringDates,
  createClientOrThrow,
} from './lib/event-helpers.js';

const YEAR = 2026;
const EVENT_TYPE_SLUG = 'cars-and-coffee';

const carsAndCoffeeEvents = [
  {
    name: 'Caffeine and Octane',
    city: 'Atlanta',
    state: 'GA',
    recurrence: '3rd Sunday monthly',
    venue_name: 'Town Center at Cobb',
    address: '400 Ernest W Barrett Pkwy NW',
    zip: '30144',
    latitude: 33.9937,
    longitude: -84.5497,
    source_url: 'https://caffeineandoctane.com',
    cost_text: 'Free',
    is_free: true,
    description: "One of America's largest car gatherings. 3,000-4,000 cars monthly.",
  },
  {
    name: 'Cars and Coffee Irvine',
    city: 'Irvine',
    state: 'CA',
    recurrence: 'Every Saturday',
    venue_name: 'Irvine Lanes',
    address: '3415 Michelson Dr',
    zip: '92612',
    latitude: 33.677,
    longitude: -117.8416,
    source_url: 'https://www.instagram.com/caborange/',
    cost_text: 'Free',
    is_free: true,
    description: "SoCal's premier weekly car meet. Supercars, classics, tuners.",
  },
  {
    name: 'Cars & Coffee Dallas',
    city: 'Dallas',
    state: 'TX',
    recurrence: '1st Saturday monthly',
    venue_name: 'Classic BMW',
    address: '6800 Dallas Pkwy',
    zip: '75024',
    latitude: 33.0745,
    longitude: -96.8286,
    source_url: 'https://www.carsandcoffeedallas.com',
    cost_text: 'Free',
    is_free: true,
    description: "DFW's largest Cars & Coffee. 500+ cars.",
  },
  {
    name: 'Cars and Coffee Houston',
    city: 'Houston',
    state: 'TX',
    recurrence: '1st Saturday monthly',
    venue_name: 'Memorial City Mall',
    address: '303 Memorial City Way',
    zip: '77024',
    latitude: 29.7786,
    longitude: -95.5558,
    source_url: 'https://www.facebook.com/CarsandCoffeeHouston',
    cost_text: 'Free',
    is_free: true,
    description: "Houston's premier morning car meet.",
  },
  {
    name: "Katie's Cars & Coffee",
    city: 'Great Falls',
    state: 'VA',
    recurrence: 'Every Saturday',
    venue_name: "Katie's Coffee House",
    address: '760 Walker Rd',
    zip: '22066',
    latitude: 38.9976,
    longitude: -77.2886,
    source_url: 'https://www.katiescoffee.com',
    cost_text: 'Free',
    is_free: true,
    description: "DC area's original Cars & Coffee. Exotics and classics weekly.",
  },
  {
    name: 'Scottsdale Cars & Coffee',
    city: 'Scottsdale',
    state: 'AZ',
    recurrence: 'Every Saturday',
    venue_name: 'Mayo Blvd & Scottsdale Rd',
    address: '15255 N Scottsdale Rd',
    zip: '85254',
    latitude: 33.6251,
    longitude: -111.8989,
    source_url: 'https://www.arizonacarsandcoffee.com',
    cost_text: 'Free',
    is_free: true,
    description: "Arizona's largest weekly car show. 500+ cars.",
  },
  {
    name: 'Cars & Coffee San Francisco',
    city: 'San Francisco',
    state: 'CA',
    recurrence: '1st Sunday monthly',
    venue_name: 'Fort Mason Center',
    address: '2 Marina Blvd',
    zip: '94123',
    latitude: 37.8064,
    longitude: -122.4319,
    source_url: 'https://www.sffog.com',
    cost_text: 'Free',
    is_free: true,
    description: "Bay Area's waterfront car gathering.",
  },
  {
    name: 'Cars & Coffee Chicago',
    city: 'Barrington',
    state: 'IL',
    recurrence: '1st Saturday monthly (Apr-Oct)',
    venue_name: 'Barrington Square',
    address: '201 S Hough St',
    zip: '60010',
    latitude: 42.153,
    longitude: -88.1367,
    source_url: 'https://www.chicagocarsandcoffee.com',
    cost_text: 'Free',
    is_free: true,
    description: "Chicagoland's premier Cars & Coffee.",
  },
  {
    name: 'Cars and Coffee NYC',
    city: 'New Rochelle',
    state: 'NY',
    recurrence: '1st Sunday monthly',
    venue_name: 'New Rochelle Municipal Marina',
    address: '160 Pelham Rd',
    zip: '10805',
    latitude: 40.8937,
    longitude: -73.7826,
    source_url: 'https://www.facebook.com/caborange',
    cost_text: 'Free',
    is_free: true,
    description: "NYC metro's waterfront car meet.",
  },
  {
    name: 'Cars & Coffee Miami',
    city: 'Miami',
    state: 'FL',
    recurrence: '2nd Saturday monthly',
    venue_name: 'Shops at Sunset Place',
    address: '5701 Sunset Dr',
    zip: '33143',
    latitude: 25.707,
    longitude: -80.2898,
    source_url: 'https://www.facebook.com/CarsAndCoffeeMiami',
    cost_text: 'Free',
    is_free: true,
    description: "South Florida's exotic car gathering.",
  },
  {
    name: 'Cars and Coffee Seattle',
    city: 'Redmond',
    state: 'WA',
    recurrence: 'Every Saturday (May-Oct)',
    venue_name: 'Redmond Town Center',
    address: '7525 166th Ave NE',
    zip: '98052',
    latitude: 47.6716,
    longitude: -122.1185,
    source_url: 'https://www.exoticsatrtc.com',
    cost_text: 'Free',
    is_free: true,
    description: "Exotics @ RTC. Pacific Northwest's premier car meet.",
  },
  {
    name: 'Cars & Coffee Boston',
    city: 'Larz Anderson',
    state: 'MA',
    recurrence: '1st Sunday monthly (May-Oct)',
    venue_name: 'Larz Anderson Auto Museum',
    address: '15 Newton St',
    zip: '02445',
    latitude: 42.3086,
    longitude: -71.1424,
    source_url: 'https://www.larzanderson.org',
    cost_text: 'Free',
    is_free: true,
    description: "New England's car museum hosts monthly gathering.",
  },
  {
    name: 'Cars and Coffee Detroit',
    city: 'Birmingham',
    state: 'MI',
    recurrence: 'Every Saturday (May-Oct)',
    venue_name: 'Birmingham Shopping District',
    address: '151 S Old Woodward Ave',
    zip: '48009',
    latitude: 42.5467,
    longitude: -83.2113,
    source_url: 'https://www.facebook.com/detroitcarsandcoffee',
    cost_text: 'Free',
    is_free: true,
    description: "Motor City's Saturday morning tradition.",
  },
  {
    name: 'Cars & Coffee Philadelphia',
    city: 'Conshohocken',
    state: 'PA',
    recurrence: '1st Sunday monthly',
    venue_name: 'SugarHouse Casino',
    address: '1001 N Delaware Ave',
    zip: '19125',
    latitude: 39.9737,
    longitude: -75.1342,
    source_url: 'https://www.facebook.com/phillycarsandcoffee',
    cost_text: 'Free',
    is_free: true,
    description: "Philadelphia area's morning car meetup.",
  },
  {
    name: 'Cars and Coffee Denver',
    city: 'Lone Tree',
    state: 'CO',
    recurrence: '1st Saturday monthly',
    venue_name: 'Park Meadows Mall',
    address: '8401 Park Meadows Center Dr',
    zip: '80124',
    latitude: 39.5634,
    longitude: -104.8775,
    source_url: 'https://www.carsandcoffeecolorado.com',
    cost_text: 'Free',
    is_free: true,
    description: "Colorado's front range car community.",
  },
];

async function main() {
  const client = createClientOrThrow();
  console.log(`🚀 Seeding Cars & Coffee events for ${YEAR}...\n`);

  const event_type_id = await getEventTypeId(client, EVENT_TYPE_SLUG);
  let created = 0;
  let updated = 0;

  for (const baseEvent of carsAndCoffeeEvents) {
    const dates = generateRecurringDates(baseEvent.recurrence, YEAR);
    if (dates.length === 0) {
      console.warn(`⚠️  No dates parsed for ${baseEvent.name} (${baseEvent.recurrence})`);
      continue;
    }

    for (const start_date of dates) {
      const slug = buildEventSlug(baseEvent.name, baseEvent.city, start_date);
      const region = mapRegion(baseEvent.state);
      
      // Destructure out fields that aren't database columns
      const { recurrence, ...eventData } = baseEvent;
      
      const eventPayload = {
        ...eventData,
        slug,
        start_date,
        end_date: start_date,
        event_type_id,
        region,
        scope: 'local',
        featured: false,
      };

      const { data: existing } = await client
        .from('events')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      await upsertEvent(client, eventPayload);
      if (existing?.id) {
        updated += 1;
        console.log(`🔄 Updated ${baseEvent.name} - ${start_date}`);
      } else {
        created += 1;
        console.log(`✅ Inserted ${baseEvent.name} - ${start_date}`);
      }
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

