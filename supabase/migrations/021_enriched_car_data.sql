-- ============================================================================
-- Migration: Enriched Car Data Tables
-- 
-- Stores data collected from external sources:
-- - EPA fuel economy
-- - NHTSA/IIHS safety data
-- - Market pricing (BaT, Hagerty, Cars.com)
-- - Expert reviews (Car and Driver, MotorTrend)
-- 
-- This allows us to:
-- 1. Cache scraped data to avoid repeated requests
-- 2. Track historical trends
-- 3. Serve data instantly without external calls
-- ============================================================================

-- ============================================================================
-- FUEL ECONOMY DATA
-- ============================================================================
CREATE TABLE IF NOT EXISTS car_fuel_economy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    car_slug VARCHAR(255) NOT NULL REFERENCES cars(slug) ON DELETE CASCADE,
    
    -- EPA Official Data
    epa_vehicle_id INTEGER,
    city_mpg DECIMAL(4,1),
    highway_mpg DECIMAL(4,1),
    combined_mpg DECIMAL(4,1),
    fuel_type VARCHAR(100),
    annual_fuel_cost INTEGER,
    co2_emissions INTEGER,  -- grams/mile
    ghg_score INTEGER,      -- 1-10
    
    -- User Reported (Real World)
    user_avg_mpg DECIMAL(4,1),
    user_city_mpg DECIMAL(4,1),
    user_highway_mpg DECIMAL(4,1),
    user_sample_size INTEGER,
    
    -- EV Specific
    is_electric BOOLEAN DEFAULT FALSE,
    is_hybrid BOOLEAN DEFAULT FALSE,
    ev_range INTEGER,  -- miles
    
    -- Metadata
    source VARCHAR(50) DEFAULT 'EPA',
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(car_slug)
);

CREATE INDEX idx_fuel_economy_car_slug ON car_fuel_economy(car_slug);

-- ============================================================================
-- SAFETY DATA
-- ============================================================================
CREATE TABLE IF NOT EXISTS car_safety_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    car_slug VARCHAR(255) NOT NULL REFERENCES cars(slug) ON DELETE CASCADE,
    
    -- NHTSA Crash Test Ratings
    nhtsa_overall_rating INTEGER,
    nhtsa_front_crash_rating INTEGER,
    nhtsa_side_crash_rating INTEGER,
    nhtsa_rollover_rating INTEGER,
    
    -- NHTSA Counts
    recall_count INTEGER DEFAULT 0,
    complaint_count INTEGER DEFAULT 0,
    investigation_count INTEGER DEFAULT 0,
    tsb_count INTEGER DEFAULT 0,
    has_open_recalls BOOLEAN DEFAULT FALSE,
    has_open_investigations BOOLEAN DEFAULT FALSE,
    
    -- IIHS Ratings
    iihs_overall VARCHAR(50),
    iihs_small_overlap_front VARCHAR(50),
    iihs_moderate_overlap_front VARCHAR(50),
    iihs_side VARCHAR(50),
    iihs_roof_strength VARCHAR(50),
    iihs_head_restraints VARCHAR(50),
    iihs_front_crash_prevention VARCHAR(50),
    iihs_headlight_rating VARCHAR(50),
    
    -- Awards
    iihs_top_safety_pick BOOLEAN DEFAULT FALSE,
    iihs_top_safety_pick_plus BOOLEAN DEFAULT FALSE,
    
    -- Computed Safety Score (0-100)
    safety_score INTEGER,
    safety_grade CHAR(2),
    
    -- Metadata
    nhtsa_fetched_at TIMESTAMP WITH TIME ZONE,
    iihs_fetched_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(car_slug)
);

CREATE INDEX idx_safety_data_car_slug ON car_safety_data(car_slug);
CREATE INDEX idx_safety_data_score ON car_safety_data(safety_score);

-- ============================================================================
-- RECALLS (Individual Records)
-- ============================================================================
CREATE TABLE IF NOT EXISTS car_recalls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    car_slug VARCHAR(255) NOT NULL REFERENCES cars(slug) ON DELETE CASCADE,
    
    campaign_number VARCHAR(50) NOT NULL,
    component VARCHAR(255),
    summary TEXT,
    consequence TEXT,
    remedy TEXT,
    report_received_date DATE,
    is_incomplete BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(car_slug, campaign_number)
);

CREATE INDEX idx_recalls_car_slug ON car_recalls(car_slug);
CREATE INDEX idx_recalls_incomplete ON car_recalls(is_incomplete) WHERE is_incomplete = TRUE;

-- ============================================================================
-- MARKET PRICING DATA
-- ============================================================================
CREATE TABLE IF NOT EXISTS car_market_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    car_slug VARCHAR(255) NOT NULL REFERENCES cars(slug) ON DELETE CASCADE,
    
    -- Bring a Trailer (Auction Data)
    bat_avg_price INTEGER,
    bat_median_price INTEGER,
    bat_min_price INTEGER,
    bat_max_price INTEGER,
    bat_sample_size INTEGER,
    bat_sell_through_rate INTEGER,  -- percentage
    bat_avg_mileage INTEGER,
    bat_fetched_at TIMESTAMP WITH TIME ZONE,
    
    -- Hagerty (Collector Valuations)
    hagerty_concours INTEGER,    -- Condition #1
    hagerty_excellent INTEGER,   -- Condition #2
    hagerty_good INTEGER,        -- Condition #3
    hagerty_fair INTEGER,        -- Condition #4
    hagerty_trend VARCHAR(20),   -- up, down, stable
    hagerty_trend_percent DECIMAL(5,2),
    hagerty_fetched_at TIMESTAMP WITH TIME ZONE,
    
    -- Cars.com (Current Listings)
    carscom_avg_price INTEGER,
    carscom_median_price INTEGER,
    carscom_min_price INTEGER,
    carscom_max_price INTEGER,
    carscom_listing_count INTEGER,
    carscom_avg_mileage INTEGER,
    carscom_fetched_at TIMESTAMP WITH TIME ZONE,
    
    -- Computed Consensus
    consensus_price INTEGER,
    price_confidence VARCHAR(20),  -- high, medium, low
    market_trend VARCHAR(20),      -- appreciating, depreciating, stable
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(car_slug)
);

CREATE INDEX idx_market_pricing_car_slug ON car_market_pricing(car_slug);
CREATE INDEX idx_market_pricing_consensus ON car_market_pricing(consensus_price);

-- ============================================================================
-- PRICE HISTORY (For Trend Tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS car_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    car_slug VARCHAR(255) NOT NULL REFERENCES cars(slug) ON DELETE CASCADE,
    
    source VARCHAR(50) NOT NULL,  -- bat, hagerty, carscom
    price INTEGER NOT NULL,
    recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(car_slug, source, recorded_at)
);

CREATE INDEX idx_price_history_car_slug ON car_price_history(car_slug);
CREATE INDEX idx_price_history_recorded_at ON car_price_history(recorded_at);

-- ============================================================================
-- EXPERT REVIEWS
-- ============================================================================
CREATE TABLE IF NOT EXISTS car_expert_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    car_slug VARCHAR(255) NOT NULL REFERENCES cars(slug) ON DELETE CASCADE,
    
    source VARCHAR(50) NOT NULL,  -- caranddriver, motortrend, etc.
    source_url TEXT,
    title VARCHAR(500),
    
    -- Ratings
    overall_rating DECIMAL(3,1),  -- Out of 10
    performance_rating DECIMAL(3,1),
    handling_rating DECIMAL(3,1),
    comfort_rating DECIMAL(3,1),
    interior_rating DECIMAL(3,1),
    value_rating DECIMAL(3,1),
    
    -- Content
    pros TEXT[],
    cons TEXT[],
    verdict TEXT,
    
    -- Test Data (if available)
    zero_to_sixty DECIMAL(4,2),
    zero_to_hundred DECIMAL(4,2),
    quarter_mile DECIMAL(4,2),
    quarter_mile_speed INTEGER,
    braking_70_to_0 INTEGER,
    skidpad_g DECIMAL(3,2),
    
    -- Metadata
    review_date DATE,
    review_type VARCHAR(50),  -- review, first_drive, comparison, long_term
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(car_slug, source, source_url)
);

CREATE INDEX idx_expert_reviews_car_slug ON car_expert_reviews(car_slug);
CREATE INDEX idx_expert_reviews_source ON car_expert_reviews(source);
CREATE INDEX idx_expert_reviews_rating ON car_expert_reviews(overall_rating);

-- ============================================================================
-- AUCTION RESULTS (Detailed BaT Data)
-- ============================================================================
CREATE TABLE IF NOT EXISTS car_auction_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    car_slug VARCHAR(255) REFERENCES cars(slug) ON DELETE SET NULL,
    
    -- Auction Details
    auction_id VARCHAR(255) NOT NULL,
    source VARCHAR(50) DEFAULT 'bringatrailer',
    auction_url TEXT,
    title TEXT,
    
    -- Vehicle Details
    year INTEGER,
    make VARCHAR(100),
    model VARCHAR(200),
    mileage INTEGER,
    transmission VARCHAR(50),
    
    -- Results
    sold_price INTEGER,
    high_bid INTEGER,
    sold BOOLEAN DEFAULT FALSE,
    reserve_not_met BOOLEAN DEFAULT FALSE,
    bid_count INTEGER,
    
    -- Metadata
    auction_end_date DATE,
    location VARCHAR(200),
    thumbnail_url TEXT,
    highlights TEXT[],
    
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(auction_id, source)
);

CREATE INDEX idx_auction_results_car_slug ON car_auction_results(car_slug);
CREATE INDEX idx_auction_results_sold ON car_auction_results(sold) WHERE sold = TRUE;
CREATE INDEX idx_auction_results_date ON car_auction_results(auction_end_date);

-- ============================================================================
-- SCRAPE JOB TRACKING
-- ============================================================================
CREATE TABLE IF NOT EXISTS scrape_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    job_type VARCHAR(50) NOT NULL,  -- full_enrich, pricing_only, safety_only, etc.
    car_slug VARCHAR(255) REFERENCES cars(slug) ON DELETE CASCADE,
    
    status VARCHAR(20) DEFAULT 'pending',  -- pending, running, completed, failed
    priority INTEGER DEFAULT 5,  -- 1 = highest, 10 = lowest
    
    -- Results
    sources_attempted TEXT[],
    sources_succeeded TEXT[],
    sources_failed TEXT[],
    error_message TEXT,
    
    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Retry Logic
    attempt_count INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scrape_jobs_status ON scrape_jobs(status);
CREATE INDEX idx_scrape_jobs_scheduled ON scrape_jobs(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_scrape_jobs_car_slug ON scrape_jobs(car_slug);

-- ============================================================================
-- MANUAL DATA ENTRIES (For Data We Can't Scrape)
-- ============================================================================
CREATE TABLE IF NOT EXISTS car_manual_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    car_slug VARCHAR(255) NOT NULL REFERENCES cars(slug) ON DELETE CASCADE,
    
    data_type VARCHAR(50) NOT NULL,  -- pricing, review, safety, specs
    source VARCHAR(100),
    source_url TEXT,
    
    -- Flexible JSON data storage
    data JSONB NOT NULL,
    
    -- Verification
    verified BOOLEAN DEFAULT FALSE,
    verified_by VARCHAR(255),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    notes TEXT,
    entered_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_manual_data_car_slug ON car_manual_data(car_slug);
CREATE INDEX idx_manual_data_type ON car_manual_data(data_type);
CREATE INDEX idx_manual_data_data ON car_manual_data USING GIN(data);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to compute consensus price
CREATE OR REPLACE FUNCTION compute_consensus_price(p_car_slug VARCHAR)
RETURNS INTEGER AS $$
DECLARE
    v_bat_price INTEGER;
    v_hagerty_price INTEGER;
    v_carscom_price INTEGER;
    v_total INTEGER := 0;
    v_weight DECIMAL := 0;
BEGIN
    SELECT bat_avg_price, hagerty_good, carscom_avg_price
    INTO v_bat_price, v_hagerty_price, v_carscom_price
    FROM car_market_pricing
    WHERE car_slug = p_car_slug;
    
    -- BaT has highest weight (auction results are real transactions)
    IF v_bat_price IS NOT NULL THEN
        v_total := v_total + (v_bat_price * 1.2);
        v_weight := v_weight + 1.2;
    END IF;
    
    -- Hagerty is authoritative for collector cars
    IF v_hagerty_price IS NOT NULL THEN
        v_total := v_total + (v_hagerty_price * 1.0);
        v_weight := v_weight + 1.0;
    END IF;
    
    -- Cars.com is asking price (usually higher)
    IF v_carscom_price IS NOT NULL THEN
        v_total := v_total + (v_carscom_price * 0.8);
        v_weight := v_weight + 0.8;
    END IF;
    
    IF v_weight > 0 THEN
        RETURN ROUND(v_total / v_weight);
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get data freshness
CREATE OR REPLACE FUNCTION get_data_freshness(p_car_slug VARCHAR)
RETURNS TABLE(
    source VARCHAR,
    fetched_at TIMESTAMP WITH TIME ZONE,
    age_hours INTEGER,
    is_stale BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'fuel_economy'::VARCHAR, f.fetched_at, 
           EXTRACT(EPOCH FROM (NOW() - f.fetched_at))/3600,
           f.fetched_at < NOW() - INTERVAL '7 days'
    FROM car_fuel_economy f WHERE f.car_slug = p_car_slug
    UNION ALL
    SELECT 'nhtsa_safety', s.nhtsa_fetched_at,
           EXTRACT(EPOCH FROM (NOW() - s.nhtsa_fetched_at))/3600,
           s.nhtsa_fetched_at < NOW() - INTERVAL '7 days'
    FROM car_safety_data s WHERE s.car_slug = p_car_slug
    UNION ALL
    SELECT 'iihs_safety', s.iihs_fetched_at,
           EXTRACT(EPOCH FROM (NOW() - s.iihs_fetched_at))/3600,
           s.iihs_fetched_at < NOW() - INTERVAL '30 days'
    FROM car_safety_data s WHERE s.car_slug = p_car_slug
    UNION ALL
    SELECT 'bat_pricing', p.bat_fetched_at,
           EXTRACT(EPOCH FROM (NOW() - p.bat_fetched_at))/3600,
           p.bat_fetched_at < NOW() - INTERVAL '7 days'
    FROM car_market_pricing p WHERE p.car_slug = p_car_slug
    UNION ALL
    SELECT 'hagerty_pricing', p.hagerty_fetched_at,
           EXTRACT(EPOCH FROM (NOW() - p.hagerty_fetched_at))/3600,
           p.hagerty_fetched_at < NOW() - INTERVAL '30 days'
    FROM car_market_pricing p WHERE p.car_slug = p_car_slug
    UNION ALL
    SELECT 'carscom_pricing', p.carscom_fetched_at,
           EXTRACT(EPOCH FROM (NOW() - p.carscom_fetched_at))/3600,
           p.carscom_fetched_at < NOW() - INTERVAL '3 days'
    FROM car_market_pricing p WHERE p.car_slug = p_car_slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER FOR updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN 
        SELECT unnest(ARRAY[
            'car_fuel_economy',
            'car_safety_data', 
            'car_market_pricing',
            'scrape_jobs',
            'car_manual_data'
        ])
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%s_timestamp ON %s;
            CREATE TRIGGER update_%s_timestamp
            BEFORE UPDATE ON %s
            FOR EACH ROW EXECUTE FUNCTION update_timestamp();
        ', t, t, t, t);
    END LOOP;
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE car_fuel_economy IS 'EPA fuel economy data for vehicles';
COMMENT ON TABLE car_safety_data IS 'Combined NHTSA and IIHS safety ratings';
COMMENT ON TABLE car_recalls IS 'Individual recall records from NHTSA';
COMMENT ON TABLE car_market_pricing IS 'Market pricing from BaT, Hagerty, Cars.com';
COMMENT ON TABLE car_price_history IS 'Historical price tracking for trend analysis';
COMMENT ON TABLE car_expert_reviews IS 'Reviews from automotive publications';
COMMENT ON TABLE car_auction_results IS 'Detailed auction results from BaT';
COMMENT ON TABLE scrape_jobs IS 'Job queue for data scraping operations';
COMMENT ON TABLE car_manual_data IS 'Manually entered data for sources we cannot scrape';






