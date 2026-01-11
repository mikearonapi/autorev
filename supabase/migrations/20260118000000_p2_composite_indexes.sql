-- Migration: P2 Composite Indexes for Common Query Patterns
-- Date: January 18, 2026
-- Purpose: Add composite indexes to improve multi-column query performance

-- ============================================================================
-- CAR BROWSING INDEXES
-- ============================================================================

-- Index for browsing by brand and vehicle type (common filter combination)
CREATE INDEX IF NOT EXISTS idx_cars_brand_vehicle_type 
  ON cars(brand, vehicle_type);

-- Index for browsing by category and brand
CREATE INDEX IF NOT EXISTS idx_cars_category_brand
  ON cars(category, brand);

-- Index for price-based browsing
CREATE INDEX IF NOT EXISTS idx_cars_price_range
  ON cars(price_avg) WHERE price_avg IS NOT NULL;

-- Index for year-based queries
CREATE INDEX IF NOT EXISTS idx_cars_brand_years
  ON cars(brand, years);

-- ============================================================================
-- USER DATA INDEXES
-- ============================================================================

-- Index for user garage queries (user + car)
CREATE INDEX IF NOT EXISTS idx_user_vehicles_user_car
  ON user_vehicles(user_id, matched_car_id);

-- Index for user favorites lookup
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_car
  ON user_favorites(user_id, car_id);

-- Index for user projects by user and car
CREATE INDEX IF NOT EXISTS idx_user_projects_user_car
  ON user_projects(user_id, car_id);

-- ============================================================================
-- PARTS INDEXES
-- ============================================================================

-- Index for parts search with brand (partial - active only)
CREATE INDEX IF NOT EXISTS idx_parts_category_brand_active
  ON parts(category, brand_name)
  WHERE is_active = true;

-- Index for fitments by car (for "parts for my car" queries)
CREATE INDEX IF NOT EXISTS idx_part_fitments_car_part
  ON part_fitments(car_id, part_id);

-- ============================================================================
-- YOUTUBE VIDEO INDEXES
-- ============================================================================

-- Index for videos by car (for expert reviews tab)
CREATE INDEX IF NOT EXISTS idx_youtube_links_car_video
  ON youtube_video_car_links(car_id, video_id);

-- Index for videos by channel
CREATE INDEX IF NOT EXISTS idx_youtube_videos_channel
  ON youtube_videos(channel_id);

-- ============================================================================
-- ANALYTICS INDEXES
-- ============================================================================

-- Index for user session analysis
CREATE INDEX IF NOT EXISTS idx_page_views_user_session
  ON page_views(user_id, session_id, created_at DESC);

-- Index for page engagement analysis
CREATE INDEX IF NOT EXISTS idx_page_engagement_time
  ON page_engagement(created_at DESC);

-- Index for click event analysis by tag
CREATE INDEX IF NOT EXISTS idx_click_events_tag_time
  ON click_events(element_tag, created_at DESC);

-- ============================================================================
-- EVENT INDEXES
-- ============================================================================

-- Index for events by location (city search)
CREATE INDEX IF NOT EXISTS idx_events_city_state_date
  ON events(city, state, start_date)
  WHERE status = 'approved';

-- Index for events by type and date
CREATE INDEX IF NOT EXISTS idx_events_type_date
  ON events(event_type_id, start_date)
  WHERE status = 'approved';

-- ============================================================================
-- COMMUNITY INSIGHTS INDEXES
-- ============================================================================

-- Index for insights by car and type
CREATE INDEX IF NOT EXISTS idx_community_insights_car_type
  ON community_insights(car_id, insight_type);

-- Index for insights by confidence (for quality filtering)
CREATE INDEX IF NOT EXISTS idx_community_insights_confidence
  ON community_insights(confidence DESC)
  WHERE car_id IS NOT NULL;

-- ============================================================================
-- AL/AI INDEXES
-- ============================================================================

-- Index for conversation history
CREATE INDEX IF NOT EXISTS idx_al_messages_conversation_seq
  ON al_messages(conversation_id, sequence_number);

-- Index for user usage tracking
CREATE INDEX IF NOT EXISTS idx_al_usage_user_time
  ON al_usage_logs(user_id, created_at DESC);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON INDEX idx_cars_brand_vehicle_type IS 'Composite index for car browsing by brand and type';
COMMENT ON INDEX idx_user_vehicles_user_car IS 'Composite index for user garage queries';
COMMENT ON INDEX idx_parts_category_brand_active IS 'Partial composite index for active parts search';
COMMENT ON INDEX idx_events_city_state_date IS 'Composite index for local event search';
COMMENT ON INDEX idx_community_insights_car_type IS 'Composite index for car-specific insight queries';
