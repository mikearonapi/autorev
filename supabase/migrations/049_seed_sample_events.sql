-- ============================================================================
-- Events Feature - Sample Events Seed Data
-- ============================================================================
-- Seeds 15 sample events for testing and demonstration
-- Includes variety of: event types, regions, cost levels, car affinities
-- ============================================================================

-- Helper function to get event_type_id by slug
DO $$
DECLARE
  type_cars_coffee uuid;
  type_car_show uuid;
  type_club_meetup uuid;
  type_cruise uuid;
  type_autocross uuid;
  type_track_day uuid;
  type_time_attack uuid;
  type_industry uuid;
  type_auction uuid;
  
  event_id_1 uuid;
  event_id_2 uuid;
  event_id_3 uuid;
  event_id_4 uuid;
  event_id_5 uuid;
  event_id_6 uuid;
  event_id_7 uuid;
  event_id_8 uuid;
  event_id_9 uuid;
  event_id_10 uuid;
  event_id_11 uuid;
  event_id_12 uuid;
  event_id_13 uuid;
  event_id_14 uuid;
  event_id_15 uuid;
BEGIN
  -- Get event type IDs
  SELECT id INTO type_cars_coffee FROM event_types WHERE slug = 'cars-and-coffee';
  SELECT id INTO type_car_show FROM event_types WHERE slug = 'car-show';
  SELECT id INTO type_club_meetup FROM event_types WHERE slug = 'club-meetup';
  SELECT id INTO type_cruise FROM event_types WHERE slug = 'cruise';
  SELECT id INTO type_autocross FROM event_types WHERE slug = 'autocross';
  SELECT id INTO type_track_day FROM event_types WHERE slug = 'track-day';
  SELECT id INTO type_time_attack FROM event_types WHERE slug = 'time-attack';
  SELECT id INTO type_industry FROM event_types WHERE slug = 'industry';
  SELECT id INTO type_auction FROM event_types WHERE slug = 'auction';

  -- ============================================================================
  -- CARS & COFFEE EVENTS (3)
  -- ============================================================================
  
  -- 1. Cars & Coffee - Los Angeles
  INSERT INTO events (
    slug, name, description, event_type_id,
    start_date, start_time, end_time, timezone,
    venue_name, address, city, state, zip, country, latitude, longitude,
    region, scope, source_url, source_name, image_url,
    cost_text, is_free, status, featured
  ) VALUES (
    'cars-coffee-malibu-jan-2025',
    'Malibu Cars & Coffee',
    'Monthly morning meetup at PCH. All makes welcome, emphasis on European sports cars. Arrive early for best parking spots. Coffee and pastries available from local vendors.',
    type_cars_coffee,
    '2025-01-18', '07:30:00', '10:00:00', 'America/Los_Angeles',
    'PCH Meetup Spot', '22000 Pacific Coast Hwy', 'Malibu', 'CA', '90265', 'USA', 34.0259, -118.7798,
    'West', 'local',
    'https://example.com/malibu-cc', 'Malibu Cars & Coffee',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
    'Free', true, 'approved', true
  ) RETURNING id INTO event_id_1;

  -- 2. Cars & Coffee - Dallas
  INSERT INTO events (
    slug, name, description, event_type_id,
    start_date, start_time, end_time, timezone,
    venue_name, address, city, state, zip, country, latitude, longitude,
    region, scope, source_url, source_name, image_url,
    cost_text, is_free, status, featured
  ) VALUES (
    'cars-coffee-dallas-jan-2025',
    'Dallas Coffee & Cars',
    'North Texas largest monthly car meetup. All vehicles welcome from classic American muscle to modern exotics. Family friendly event with food trucks.',
    type_cars_coffee,
    '2025-01-25', '08:00:00', '11:00:00', 'America/Chicago',
    'Classic BMW', '6800 Dallas Pkwy', 'Plano', 'TX', '75024', 'USA', 33.0462, -96.8297,
    'Southwest', 'regional',
    'https://example.com/dallas-cc', 'Dallas Coffee & Cars',
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800',
    'Free', true, 'approved', false
  ) RETURNING id INTO event_id_2;

  -- 3. Cars & Coffee - Miami
  INSERT INTO events (
    slug, name, description, event_type_id,
    start_date, start_time, end_time, timezone,
    venue_name, address, city, state, zip, country, latitude, longitude,
    region, scope, source_url, source_name, image_url,
    cost_text, is_free, status, featured
  ) VALUES (
    'cars-coffee-miami-feb-2025',
    'South Beach Cars & Coffee',
    'Premier Cars & Coffee in South Florida. Exotic supercars, classic Porsches, and everything in between. Oceanside location with stunning backdrop.',
    type_cars_coffee,
    '2025-02-01', '08:00:00', '11:00:00', 'America/New_York',
    'Lummus Park Lot', '1100 Ocean Dr', 'Miami Beach', 'FL', '33139', 'USA', 25.7830, -80.1300,
    'Southeast', 'local',
    'https://example.com/miami-cc', 'South Beach Cars & Coffee',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
    'Free', true, 'approved', true
  ) RETURNING id INTO event_id_3;

  -- ============================================================================
  -- TRACK DAY / HPDE EVENTS (3)
  -- ============================================================================

  -- 4. Track Day - Laguna Seca
  INSERT INTO events (
    slug, name, description, event_type_id,
    start_date, end_date, start_time, end_time, timezone,
    venue_name, address, city, state, zip, country, latitude, longitude,
    region, scope, source_url, source_name, registration_url, image_url,
    cost_text, is_free, status, featured
  ) VALUES (
    'laguna-seca-hpde-feb-2025',
    'SpeedVentures HPDE - Laguna Seca',
    'Two-day High Performance Driver Education event at the legendary WeatherTech Raceway Laguna Seca. All experience levels welcome. Instructors available for novice drivers.',
    type_track_day,
    '2025-02-15', '2025-02-16', '07:00:00', '17:00:00', 'America/Los_Angeles',
    'WeatherTech Raceway Laguna Seca', '1021 Monterey-Salinas Hwy', 'Salinas', 'CA', '93908', 'USA', 36.5847, -121.7532,
    'West', 'regional',
    'https://example.com/speedventures-laguna', 'SpeedVentures',
    'https://example.com/register/laguna-feb',
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800',
    '$350-$550', false, 'approved', true
  ) RETURNING id INTO event_id_4;

  -- 5. Track Day - VIR
  INSERT INTO events (
    slug, name, description, event_type_id,
    start_date, start_time, end_time, timezone,
    venue_name, address, city, state, zip, country, latitude, longitude,
    region, scope, source_url, source_name, registration_url, image_url,
    cost_text, is_free, status, featured
  ) VALUES (
    'vir-hpde-march-2025',
    'NASA HPDE - VIR Full Course',
    'NASA High Performance Driving Event on the legendary VIR full course. Multiple run groups from novice to advanced. Tech inspection required.',
    type_track_day,
    '2025-03-08', '07:00:00', '18:00:00', 'America/New_York',
    'Virginia International Raceway', '1245 Pine Tree Rd', 'Alton', 'VA', '24520', 'USA', 36.5667, -79.2061,
    'Southeast', 'regional',
    'https://example.com/nasa-vir', 'NASA Mid-Atlantic',
    'https://example.com/register/vir-march',
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800',
    '$275-$400', false, 'approved', false
  ) RETURNING id INTO event_id_5;

  -- 6. Track Day - Road America
  INSERT INTO events (
    slug, name, description, event_type_id,
    start_date, end_date, start_time, end_time, timezone,
    venue_name, address, city, state, zip, country, latitude, longitude,
    region, scope, source_url, source_name, registration_url, image_url,
    cost_text, is_free, status, featured
  ) VALUES (
    'road-america-hpde-april-2025',
    'SCCA Track Night - Road America',
    'Experience America''s National Park of Speed! Full course access on the legendary 4-mile circuit. Beginner to advanced run groups available.',
    type_track_day,
    '2025-04-12', '2025-04-13', '08:00:00', '17:00:00', 'America/Chicago',
    'Road America', 'N7390 State Road 67', 'Elkhart Lake', 'WI', '53020', 'USA', 43.8028, -87.9892,
    'Midwest', 'regional',
    'https://example.com/scca-ra', 'SCCA Chicago Region',
    'https://example.com/register/road-america',
    'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800',
    '$425-$650', false, 'approved', false
  ) RETURNING id INTO event_id_6;

  -- ============================================================================
  -- AUTOCROSS EVENTS (2)
  -- ============================================================================

  -- 7. Autocross - Phoenix
  INSERT INTO events (
    slug, name, description, event_type_id,
    start_date, start_time, end_time, timezone,
    venue_name, address, city, state, zip, country, latitude, longitude,
    region, scope, source_url, source_name, registration_url, image_url,
    cost_text, is_free, status, featured
  ) VALUES (
    'scca-autocross-phoenix-jan-2025',
    'SCCA Solo - Phoenix Points Event #1',
    'First points event of the season! All classes welcome. Loaner helmets available for first-timers. Tech inspection opens at 7:30 AM.',
    type_autocross,
    '2025-01-26', '08:00:00', '16:00:00', 'America/Phoenix',
    'Wild Horse Pass Motorsports Park', '20000 S Maricopa Rd', 'Chandler', 'AZ', '85226', 'USA', 33.1982, -111.9875,
    'Southwest', 'local',
    'https://example.com/scca-phx', 'SCCA Arizona Region',
    'https://example.com/register/phx-autocross',
    'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800',
    '$45', false, 'approved', false
  ) RETURNING id INTO event_id_7;

  -- 8. Autocross - Atlanta
  INSERT INTO events (
    slug, name, description, event_type_id,
    start_date, start_time, end_time, timezone,
    venue_name, address, city, state, zip, country, latitude, longitude,
    region, scope, source_url, source_name, registration_url, image_url,
    cost_text, is_free, status, featured
  ) VALUES (
    'scca-autocross-atlanta-feb-2025',
    'Atlanta SCCA Solo - Winter Warm Up',
    'Shake off the winter rust! Beginner-friendly autocross event with instruction available. Great entry point for new drivers wanting to learn car control.',
    type_autocross,
    '2025-02-08', '08:30:00', '17:00:00', 'America/New_York',
    'Turner Field Parking Lot', '755 Hank Aaron Dr', 'Atlanta', 'GA', '30315', 'USA', 33.7353, -84.3894,
    'Southeast', 'local',
    'https://example.com/scca-atl', 'SCCA Atlanta Region',
    'https://example.com/register/atl-autocross',
    'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800',
    '$55', false, 'approved', false
  ) RETURNING id INTO event_id_8;

  -- ============================================================================
  -- CAR SHOW EVENTS (2)
  -- ============================================================================

  -- 9. Car Show - Amelia Island
  INSERT INTO events (
    slug, name, description, event_type_id,
    start_date, end_date, start_time, end_time, timezone,
    venue_name, address, city, state, zip, country, latitude, longitude,
    region, scope, source_url, source_name, registration_url, image_url,
    cost_text, is_free, status, featured
  ) VALUES (
    'amelia-island-concours-2025',
    'Amelia Island Concours d''Elegance',
    'One of the world''s premier automotive events. Features rare and significant automobiles from around the globe. Multiple days of events including auctions and seminars.',
    type_car_show,
    '2025-03-06', '2025-03-09', '09:00:00', '17:00:00', 'America/New_York',
    'The Ritz-Carlton, Amelia Island', '4750 Amelia Island Pkwy', 'Amelia Island', 'FL', '32034', 'USA', 30.5386, -81.4392,
    'Southeast', 'national',
    'https://example.com/amelia-concours', 'Amelia Island Concours',
    'https://example.com/tickets/amelia',
    'https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=800',
    '$175-$350', false, 'approved', true
  ) RETURNING id INTO event_id_9;

  -- 10. Car Show - Japanese Classic
  INSERT INTO events (
    slug, name, description, event_type_id,
    start_date, start_time, end_time, timezone,
    venue_name, address, city, state, zip, country, latitude, longitude,
    region, scope, source_url, source_name, registration_url, image_url,
    cost_text, is_free, status, featured
  ) VALUES (
    'japanese-classic-car-show-2025',
    'Japanese Classic Car Show',
    'The largest Japanese classic and vintage car show in North America. Features rare JDM imports, classic Datsuns, Toyotas, and modern JDM legends.',
    type_car_show,
    '2025-04-19', '09:00:00', '15:00:00', 'America/Los_Angeles',
    'Queen Mary', '1126 Queens Hwy', 'Long Beach', 'CA', '90802', 'USA', 33.7525, -118.1903,
    'West', 'national',
    'https://example.com/jccs', 'JCCS',
    'https://example.com/register/jccs',
    'https://images.unsplash.com/photo-1600712242805-5f78671b24da?w=800',
    '$20', false, 'approved', true
  ) RETURNING id INTO event_id_10;

  -- ============================================================================
  -- CLUB MEETUP (1)
  -- ============================================================================

  -- 11. Club Meetup - Porsche
  INSERT INTO events (
    slug, name, description, event_type_id,
    start_date, start_time, end_time, timezone,
    venue_name, address, city, state, zip, country, latitude, longitude,
    region, scope, source_url, source_name, image_url,
    cost_text, is_free, status, featured
  ) VALUES (
    'pca-socal-monthly-jan-2025',
    'Porsche Club SoCal Monthly Meet',
    'Monthly gathering of Southern California Porsche Club of America members. All Porsche models welcome from air-cooled classics to latest GT cars. Member discounts at local shops.',
    type_club_meetup,
    '2025-01-19', '17:00:00', '20:00:00', 'America/Los_Angeles',
    'Porsche Experience Center LA', '19800 S Main St', 'Carson', 'CA', '90745', 'USA', 33.8351, -118.2692,
    'West', 'local',
    'https://example.com/pca-socal', 'PCA Southern California',
    'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800',
    'Free for members, $10 guests', false, 'approved', false
  ) RETURNING id INTO event_id_11;

  -- ============================================================================
  -- CRUISE / DRIVE (1)
  -- ============================================================================

  -- 12. Cruise - Blue Ridge Parkway
  INSERT INTO events (
    slug, name, description, event_type_id,
    start_date, start_time, end_time, timezone,
    venue_name, address, city, state, zip, country, latitude, longitude,
    region, scope, source_url, source_name, registration_url, image_url,
    cost_text, is_free, status, featured
  ) VALUES (
    'blue-ridge-spring-drive-2025',
    'Blue Ridge Parkway Spring Drive',
    'Annual spring drive through some of the most scenic roads in America. Group drive from Asheville to Cherokee along the Blue Ridge Parkway. Lunch stop included.',
    type_cruise,
    '2025-04-05', '08:00:00', '16:00:00', 'America/New_York',
    'Asheville Mall Parking', '3 S Tunnel Rd', 'Asheville', 'NC', '28805', 'USA', 35.5825, -82.5108,
    'Southeast', 'regional',
    'https://example.com/brp-drive', 'Appalachian Sports Car Club',
    'https://example.com/register/brp-spring',
    'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800',
    '$25', false, 'approved', true
  ) RETURNING id INTO event_id_12;

  -- ============================================================================
  -- INDUSTRY EVENT (1)
  -- ============================================================================

  -- 13. Industry - PRI Show
  INSERT INTO events (
    slug, name, description, event_type_id,
    start_date, end_date, start_time, end_time, timezone,
    venue_name, address, city, state, zip, country, latitude, longitude,
    region, scope, source_url, source_name, registration_url, image_url,
    cost_text, is_free, status, featured
  ) VALUES (
    'pri-show-2025',
    'Performance Racing Industry Show 2025',
    'The business trade show for racing and performance professionals. Latest racing technology, parts, and industry networking. Trade-only event.',
    type_industry,
    '2025-12-11', '2025-12-13', '09:00:00', '17:00:00', 'America/New_York',
    'Indiana Convention Center', '100 S Capitol Ave', 'Indianapolis', 'IN', '46225', 'USA', 39.7640, -86.1621,
    'Midwest', 'national',
    'https://example.com/pri-show', 'PRI',
    'https://example.com/register/pri-2025',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
    '$25-$50', false, 'approved', false
  ) RETURNING id INTO event_id_13;

  -- ============================================================================
  -- AUCTION (1)
  -- ============================================================================

  -- 14. Auction - Mecum
  INSERT INTO events (
    slug, name, description, event_type_id,
    start_date, end_date, start_time, end_time, timezone,
    venue_name, address, city, state, zip, country, latitude, longitude,
    region, scope, source_url, source_name, registration_url, image_url,
    cost_text, is_free, status, featured
  ) VALUES (
    'mecum-kissimmee-2025',
    'Mecum Auctions Kissimmee 2025',
    'The world''s largest collector car auction. Over 4,000 vehicles crossing the block over 14 days. Free to attend as spectator.',
    type_auction,
    '2025-01-02', '2025-01-15', '09:00:00', '18:00:00', 'America/New_York',
    'Osceola Heritage Park', '1875 Silver Spur Ln', 'Kissimmee', 'FL', '34744', 'USA', 28.3027, -81.4222,
    'Southeast', 'national',
    'https://example.com/mecum-kissimmee', 'Mecum Auctions',
    'https://example.com/tickets/mecum-kissimmee',
    'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800',
    'Free spectator, $200 bidder registration', false, 'approved', true
  ) RETURNING id INTO event_id_14;

  -- ============================================================================
  -- TIME ATTACK (1)
  -- ============================================================================

  -- 15. Time Attack
  INSERT INTO events (
    slug, name, description, event_type_id,
    start_date, start_time, end_time, timezone,
    venue_name, address, city, state, zip, country, latitude, longitude,
    region, scope, source_url, source_name, registration_url, image_url,
    cost_text, is_free, status, featured
  ) VALUES (
    'global-time-attack-buttonwillow-2025',
    'Global Time Attack - Buttonwillow',
    'Competitive time attack event with multiple classes from street to unlimited. Professional timing and video coverage. Cash prizes for class winners.',
    type_time_attack,
    '2025-03-22', '07:00:00', '18:00:00', 'America/Los_Angeles',
    'Buttonwillow Raceway Park', '24551 Lerdo Hwy', 'Buttonwillow', 'CA', '93206', 'USA', 35.4083, -119.4664,
    'West', 'national',
    'https://example.com/gta-buttonwillow', 'Global Time Attack',
    'https://example.com/register/gta-buttonwillow',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    '$250-$450', false, 'approved', false
  ) RETURNING id INTO event_id_15;

  -- ============================================================================
  -- EVENT CAR AFFINITIES
  -- ============================================================================

  -- Malibu Cars & Coffee - European sports car focus
  INSERT INTO event_car_affinities (event_id, brand, affinity_type) VALUES
    (event_id_1, 'Porsche', 'featured'),
    (event_id_1, 'BMW', 'welcome'),
    (event_id_1, 'Mercedes-AMG', 'welcome');

  -- Japanese Classic Car Show - JDM brands
  INSERT INTO event_car_affinities (event_id, brand, affinity_type) VALUES
    (event_id_10, 'Nissan', 'featured'),
    (event_id_10, 'Toyota', 'featured'),
    (event_id_10, 'Mazda', 'featured'),
    (event_id_10, 'Honda', 'featured'),
    (event_id_10, 'Subaru', 'welcome');

  -- Porsche Club meetup - Porsche exclusive
  INSERT INTO event_car_affinities (event_id, brand, affinity_type) VALUES
    (event_id_11, 'Porsche', 'exclusive');

  -- Global Time Attack - specific cars popular in time attack
  INSERT INTO event_car_affinities (event_id, brand, affinity_type) VALUES
    (event_id_15, 'Honda', 'featured'),
    (event_id_15, 'Subaru', 'featured'),
    (event_id_15, 'Nissan', 'featured'),
    (event_id_15, 'Mitsubishi', 'featured');

END $$;

-- ============================================================================
-- Verify seed data
-- ============================================================================
DO $$
DECLARE
  event_count integer;
  type_count integer;
  affinity_count integer;
BEGIN
  SELECT COUNT(*) INTO event_count FROM events;
  SELECT COUNT(*) INTO type_count FROM event_types;
  SELECT COUNT(*) INTO affinity_count FROM event_car_affinities;
  
  RAISE NOTICE 'Events seeded: % events, % event types, % car affinities', 
    event_count, type_count, affinity_count;
END $$;

