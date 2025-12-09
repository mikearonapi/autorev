-- ============================================================================
-- YouTube & Expert Review Enrichment Schema
-- 
-- Purpose: Enable ingestion of YouTube reviews and external expert content,
-- AI-processed summaries, sentiment extraction, and car matching for 
-- enriching vehicle scores and car detail pages.
--
-- Tables:
--   1. youtube_channels - Whitelist of trusted channels with tiers
--   2. youtube_videos - Video metadata, transcripts, and AI-processed outputs
--   3. youtube_video_car_links - Many-to-many join between videos and cars
--   4. cars (ALTER) - Add external_consensus JSONB and review count fields
--
-- See youtube.plan.md for full architecture documentation.
-- ============================================================================

-- ============================================================================
-- YOUTUBE_CHANNELS TABLE
-- Curated whitelist of trusted YouTube channels for content ingestion.
-- Channels are tiered by credibility and tagged by content focus.
-- ============================================================================
CREATE TABLE IF NOT EXISTS youtube_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- YouTube Identity
  channel_id TEXT UNIQUE NOT NULL,           -- YouTube channel ID (e.g., 'UC8-ooLG-SXs6lISAagFb1Ag')
  channel_name TEXT NOT NULL,                -- Display name (e.g., 'Throttle House')
  channel_url TEXT NOT NULL,                 -- Full URL (e.g., 'https://www.youtube.com/@ThrottleHouse')
  channel_handle TEXT,                       -- YouTube handle without @ (e.g., 'ThrottleHouse')
  
  -- Credibility & Classification
  credibility_tier TEXT NOT NULL CHECK (credibility_tier IN ('tier1', 'tier2', 'tier3')),
  -- tier1: Professional automotive journalism (ThrottleHouse, Carwow, MotorTrend, Top Gear)
  -- tier2: Respected enthusiast channels (Doug DeMuro, Straight Pipes, Savagegeese)
  -- tier3: Niche/specialty channels (track-focused, DIY, model-specific)
  
  content_focus TEXT[] DEFAULT '{}',         -- Array: 'reviews', 'comparisons', 'track_tests', 'drag_races', 'pov_drives', 'buying_guides', 'ownership', 'education'
  primary_brands TEXT[] DEFAULT '{}',        -- Brands they specialize in (empty = generalist)
  
  -- Ingestion Settings
  is_active BOOLEAN DEFAULT true,            -- Whether to include in discovery jobs
  auto_ingest BOOLEAN DEFAULT true,          -- Whether to auto-process new videos
  max_videos_per_car INTEGER DEFAULT 3,      -- Limit videos per car from this channel
  
  -- Stats (updated by ingestion jobs)
  video_count_ingested INTEGER DEFAULT 0,
  last_crawled_at TIMESTAMPTZ,
  avg_quality_score DECIMAL(3, 2),           -- Average quality of processed videos (0-1)
  
  -- Metadata
  notes TEXT,                                -- Internal notes about the channel
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_youtube_channels_channel_id ON youtube_channels(channel_id);
CREATE INDEX IF NOT EXISTS idx_youtube_channels_credibility_tier ON youtube_channels(credibility_tier);
CREATE INDEX IF NOT EXISTS idx_youtube_channels_is_active ON youtube_channels(is_active);

-- Comments
COMMENT ON TABLE youtube_channels IS 'Curated whitelist of trusted YouTube channels for expert review content ingestion';
COMMENT ON COLUMN youtube_channels.credibility_tier IS 'tier1=professional journalism, tier2=respected enthusiasts, tier3=niche/specialty';
COMMENT ON COLUMN youtube_channels.content_focus IS 'Array of content types: reviews, comparisons, track_tests, drag_races, pov_drives, buying_guides, ownership, education';

-- ============================================================================
-- YOUTUBE_VIDEOS TABLE
-- Stores video metadata, transcripts, and AI-processed outputs.
-- One row per ingested video; linked to cars via youtube_video_car_links.
-- ============================================================================
CREATE TABLE IF NOT EXISTS youtube_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- YouTube Identity
  video_id TEXT UNIQUE NOT NULL,             -- YouTube video ID (e.g., 'dQw4w9WgXcQ')
  url TEXT NOT NULL,                         -- Full video URL
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,                        -- Default/high quality thumbnail
  
  -- Channel Reference
  channel_id TEXT NOT NULL REFERENCES youtube_channels(channel_id) ON DELETE CASCADE,
  channel_name TEXT NOT NULL,                -- Denormalized for display convenience
  
  -- Video Metadata
  published_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  view_count INTEGER,
  like_count INTEGER,
  comment_count INTEGER,
  
  -- Content Classification
  content_type TEXT CHECK (content_type IN (
    'review',              -- Single car review
    'comparison',          -- Head-to-head or multi-car comparison
    'track_test',          -- Track/performance testing focus
    'drag_race',           -- Drag strip/acceleration focus
    'pov_drive',           -- POV driving experience
    'buying_guide',        -- Purchasing advice
    'ownership_update',    -- Long-term ownership content
    'education',           -- General automotive education
    'other'
  )),
  
  -- Transcript Data
  transcript_text TEXT,                      -- Full plain text transcript
  transcript_language TEXT DEFAULT 'en',     -- Language code
  transcript_source TEXT CHECK (transcript_source IN (
    'youtube_api',         -- Official YouTube captions API
    'youtube_library',     -- Via youtube-transcript library
    'manual',              -- Manually added
    'stt'                  -- Speech-to-text service
  )),
  is_auto_generated BOOLEAN DEFAULT true,    -- YouTube auto-generated vs manual captions
  transcript_segments JSONB,                 -- Optional: timestamped segments [{start, duration, text}]
  
  -- AI-Processed Outputs
  summary TEXT,                              -- 2-4 paragraph human-readable summary
  one_line_take TEXT,                        -- Single sentence verdict
  
  key_points JSONB DEFAULT '[]'::jsonb,      
  -- Array of: {category?, theme, text, sentiment: -1 to 1, importance: 1-5}
  -- category maps to our advisory categories when applicable
  
  pros_mentioned JSONB DEFAULT '[]'::jsonb,  
  -- Array of: {text, timestamp?, strength: 1-5}
  
  cons_mentioned JSONB DEFAULT '[]'::jsonb,  
  -- Array of: {text, timestamp?, strength: 1-5}
  
  notable_quotes JSONB DEFAULT '[]'::jsonb,  
  -- Array of: {quote, speaker?, timestamp?, theme, sentiment}
  
  comparisons JSONB DEFAULT '[]'::jsonb,     
  -- Array of: {other_car_slug?, other_car_name, verdict, context, timestamp?, confidence}
  
  usage_context TEXT[] DEFAULT '{}',         -- track, canyon, commute, roadtrip, highway, city
  driver_profile TEXT,                       -- Who this car is for according to reviewer
  
  -- Stock Weakness/Strength Tags (for Performance Hub integration)
  stock_strengths JSONB DEFAULT '[]'::jsonb, 
  -- Array of: {tag, mentions: count, example_quote?}
  -- Tags: steering, brakes, chassis, cooling, power, sound, interior, tech, value, reliability
  
  stock_weaknesses JSONB DEFAULT '[]'::jsonb,
  -- Same structure as stock_strengths
  
  -- Processing Status & Quality
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN (
    'pending',             -- Discovered, not yet processed
    'transcript_fetched',  -- Transcript obtained, awaiting AI processing
    'processing',          -- Currently being processed by AI
    'processed',           -- Successfully processed
    'failed',              -- Processing failed
    'rejected',            -- Manually rejected (wrong car, low quality, etc.)
    'no_transcript'        -- No transcript available
  )),
  processing_error TEXT,                     -- Error message if failed
  processed_at TIMESTAMPTZ,
  processing_model TEXT,                     -- AI model used (e.g., 'claude-sonnet-4-20250514')
  
  quality_score DECIMAL(3, 2) CHECK (quality_score >= 0 AND quality_score <= 1),
  -- Composite quality: transcript quality, content relevance, AI confidence
  
  is_hidden BOOLEAN DEFAULT false,           -- Soft delete / manual hide
  is_editors_pick BOOLEAN DEFAULT false,     -- Featured content flag
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_youtube_videos_video_id ON youtube_videos(video_id);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_channel_id ON youtube_videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_content_type ON youtube_videos(content_type);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_processing_status ON youtube_videos(processing_status);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_published_at ON youtube_videos(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_quality_score ON youtube_videos(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_is_hidden ON youtube_videos(is_hidden);

-- Comments
COMMENT ON TABLE youtube_videos IS 'YouTube video metadata, transcripts, and AI-processed content for expert review integration';
COMMENT ON COLUMN youtube_videos.quality_score IS 'Composite quality score (0-1) based on transcript quality, content relevance, and AI confidence';
COMMENT ON COLUMN youtube_videos.stock_strengths IS 'Structured tags for stock car strengths mentioned, used for Performance Hub integration';
COMMENT ON COLUMN youtube_videos.stock_weaknesses IS 'Structured tags for stock car weaknesses mentioned, used for upgrade recommendations';

-- ============================================================================
-- YOUTUBE_VIDEO_CAR_LINKS TABLE
-- Many-to-many join table linking videos to cars with per-link metadata.
-- Supports primary subject, comparisons, and incidental mentions.
-- ============================================================================
CREATE TABLE IF NOT EXISTS youtube_video_car_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References
  video_id TEXT NOT NULL REFERENCES youtube_videos(video_id) ON DELETE CASCADE,
  car_slug TEXT NOT NULL REFERENCES cars(slug) ON DELETE CASCADE,
  
  -- Link Classification
  role TEXT NOT NULL CHECK (role IN (
    'primary',             -- Main subject of the video
    'comparison',          -- Featured in direct comparison
    'mention'              -- Referenced but not the focus
  )),
  
  -- Per-Category Sentiment (aligned with advisory scores)
  -- Scale: -1.0 (very negative) to +1.0 (very positive), null if not mentioned
  sentiment_sound DECIMAL(3, 2) CHECK (sentiment_sound >= -1 AND sentiment_sound <= 1),
  sentiment_interior DECIMAL(3, 2) CHECK (sentiment_interior >= -1 AND sentiment_interior <= 1),
  sentiment_track DECIMAL(3, 2) CHECK (sentiment_track >= -1 AND sentiment_track <= 1),
  sentiment_reliability DECIMAL(3, 2) CHECK (sentiment_reliability >= -1 AND sentiment_reliability <= 1),
  sentiment_value DECIMAL(3, 2) CHECK (sentiment_value >= -1 AND sentiment_value <= 1),
  sentiment_driver_fun DECIMAL(3, 2) CHECK (sentiment_driver_fun >= -1 AND sentiment_driver_fun <= 1),
  sentiment_aftermarket DECIMAL(3, 2) CHECK (sentiment_aftermarket >= -1 AND sentiment_aftermarket <= 1),
  
  -- Overall Sentiment
  overall_sentiment DECIMAL(3, 2) CHECK (overall_sentiment >= -1 AND overall_sentiment <= 1),
  
  -- Tags specific to this car in this video
  stock_strength_tags TEXT[] DEFAULT '{}',   -- e.g., ['steering', 'brakes', 'sound']
  stock_weakness_tags TEXT[] DEFAULT '{}',   -- e.g., ['cooling', 'infotainment']
  usage_context_tags TEXT[] DEFAULT '{}',    -- e.g., ['track', 'canyon']
  ownership_tags TEXT[] DEFAULT '{}',        -- e.g., ['maintenance_cost', 'diy_friendly']
  
  -- Comparison Details (when role = 'comparison')
  compared_to_slugs TEXT[] DEFAULT '{}',     -- Other cars compared in same video
  comparison_verdict TEXT,                   -- Who won / key takeaway
  comparison_context TEXT,                   -- Context: track, value, daily, etc.
  
  -- Matching Confidence
  match_confidence DECIMAL(3, 2) NOT NULL DEFAULT 1.0 CHECK (match_confidence >= 0 AND match_confidence <= 1),
  match_method TEXT CHECK (match_method IN (
    'exact_title',         -- Car name found exactly in title
    'fuzzy_title',         -- Fuzzy match on title
    'transcript_extract',  -- AI extracted from transcript
    'description_match',   -- Found in video description
    'manual'               -- Manually assigned
  )),
  manual_override BOOLEAN DEFAULT false,     -- Human verified/corrected this link
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one link per video-car pair
  CONSTRAINT unique_video_car_link UNIQUE (video_id, car_slug)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_youtube_video_car_links_video_id ON youtube_video_car_links(video_id);
CREATE INDEX IF NOT EXISTS idx_youtube_video_car_links_car_slug ON youtube_video_car_links(car_slug);
CREATE INDEX IF NOT EXISTS idx_youtube_video_car_links_role ON youtube_video_car_links(role);
CREATE INDEX IF NOT EXISTS idx_youtube_video_car_links_match_confidence ON youtube_video_car_links(match_confidence DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_youtube_video_car_links_car_role ON youtube_video_car_links(car_slug, role);

-- Comments
COMMENT ON TABLE youtube_video_car_links IS 'Many-to-many join linking YouTube videos to cars with role, sentiment, and matching metadata';
COMMENT ON COLUMN youtube_video_car_links.role IS 'primary=main subject, comparison=featured in comparison, mention=referenced';
COMMENT ON COLUMN youtube_video_car_links.match_confidence IS 'Confidence that this video is about this car (0-1)';
COMMENT ON COLUMN youtube_video_car_links.sentiment_sound IS 'Extracted sentiment for sound category (-1 to +1), aligned with score_sound';

-- ============================================================================
-- ALTER CARS TABLE
-- Add external consensus fields for enriched scoring and review indicators.
-- ============================================================================

-- Add external consensus JSONB field
ALTER TABLE cars ADD COLUMN IF NOT EXISTS external_consensus JSONB DEFAULT '{}'::jsonb;

-- Add review count and summary fields for quick access
ALTER TABLE cars ADD COLUMN IF NOT EXISTS expert_review_count INTEGER DEFAULT 0;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS expert_consensus_summary TEXT;

-- Add score adjustment layer (bounded adjustments from external consensus)
ALTER TABLE cars ADD COLUMN IF NOT EXISTS score_adj_sound DECIMAL(3, 2) DEFAULT 0 CHECK (score_adj_sound >= -0.5 AND score_adj_sound <= 0.5);
ALTER TABLE cars ADD COLUMN IF NOT EXISTS score_adj_interior DECIMAL(3, 2) DEFAULT 0 CHECK (score_adj_interior >= -0.5 AND score_adj_interior <= 0.5);
ALTER TABLE cars ADD COLUMN IF NOT EXISTS score_adj_track DECIMAL(3, 2) DEFAULT 0 CHECK (score_adj_track >= -0.5 AND score_adj_track <= 0.5);
ALTER TABLE cars ADD COLUMN IF NOT EXISTS score_adj_reliability DECIMAL(3, 2) DEFAULT 0 CHECK (score_adj_reliability >= -0.5 AND score_adj_reliability <= 0.5);
ALTER TABLE cars ADD COLUMN IF NOT EXISTS score_adj_value DECIMAL(3, 2) DEFAULT 0 CHECK (score_adj_value >= -0.5 AND score_adj_value <= 0.5);
ALTER TABLE cars ADD COLUMN IF NOT EXISTS score_adj_driver_fun DECIMAL(3, 2) DEFAULT 0 CHECK (score_adj_driver_fun >= -0.5 AND score_adj_driver_fun <= 0.5);
ALTER TABLE cars ADD COLUMN IF NOT EXISTS score_adj_aftermarket DECIMAL(3, 2) DEFAULT 0 CHECK (score_adj_aftermarket >= -0.5 AND score_adj_aftermarket <= 0.5);

-- Comments on new cars columns
COMMENT ON COLUMN cars.external_consensus IS 'JSONB with aggregated external sentiment: {category: {mean, count, variance}, strengths: [...], weaknesses: [...], comparisons: [...]}';
COMMENT ON COLUMN cars.expert_review_count IS 'Count of trusted expert video reviews linked to this car';
COMMENT ON COLUMN cars.expert_consensus_summary IS 'AI-generated 1-2 sentence summary of expert consensus';
COMMENT ON COLUMN cars.score_adj_sound IS 'Score adjustment from external consensus, bounded ±0.5, applied to score_sound for final ranking';

-- ============================================================================
-- INGESTION QUEUE TABLE (Optional)
-- Tracks video discovery and processing workflow status.
-- ============================================================================
CREATE TABLE IF NOT EXISTS youtube_ingestion_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  video_id TEXT UNIQUE NOT NULL,             -- YouTube video ID
  video_url TEXT NOT NULL,
  channel_id TEXT NOT NULL REFERENCES youtube_channels(channel_id) ON DELETE CASCADE,
  
  -- Discovery Metadata
  discovered_via TEXT NOT NULL CHECK (discovered_via IN (
    'channel_scan',        -- Found via channel uploads scan
    'search_api',          -- Found via YouTube search
    'manual_add',          -- Manually added
    'related_video'        -- Found as related to another video
  )),
  search_query TEXT,                         -- Search query that found this video (if applicable)
  target_car_slug TEXT,                      -- Car we were searching for (if applicable)
  
  -- Queue Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',             -- Awaiting processing
    'in_progress',         -- Currently being processed
    'completed',           -- Successfully added to youtube_videos
    'skipped',             -- Skipped (duplicate, wrong content, etc.)
    'failed'               -- Processing failed
  )),
  priority INTEGER DEFAULT 0,                -- Higher = process sooner
  attempts INTEGER DEFAULT 0,                -- Number of processing attempts
  last_error TEXT,
  
  -- Timestamps
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_youtube_ingestion_queue_status ON youtube_ingestion_queue(status);
CREATE INDEX IF NOT EXISTS idx_youtube_ingestion_queue_priority ON youtube_ingestion_queue(priority DESC);
CREATE INDEX IF NOT EXISTS idx_youtube_ingestion_queue_channel_id ON youtube_ingestion_queue(channel_id);

-- Comments
COMMENT ON TABLE youtube_ingestion_queue IS 'Tracks video discovery and processing workflow for the YouTube enrichment pipeline';

-- ============================================================================
-- TRIGGERS
-- Auto-update timestamps on all new tables
-- ============================================================================

DROP TRIGGER IF EXISTS update_youtube_channels_updated_at ON youtube_channels;
CREATE TRIGGER update_youtube_channels_updated_at
  BEFORE UPDATE ON youtube_channels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_youtube_videos_updated_at ON youtube_videos;
CREATE TRIGGER update_youtube_videos_updated_at
  BEFORE UPDATE ON youtube_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_youtube_video_car_links_updated_at ON youtube_video_car_links;
CREATE TRIGGER update_youtube_video_car_links_updated_at
  BEFORE UPDATE ON youtube_video_car_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_youtube_ingestion_queue_updated_at ON youtube_ingestion_queue;
CREATE TRIGGER update_youtube_ingestion_queue_updated_at
  BEFORE UPDATE ON youtube_ingestion_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- YouTube tables are public read-only; writes require service role.
-- ============================================================================

ALTER TABLE youtube_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_video_car_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_ingestion_queue ENABLE ROW LEVEL SECURITY;

-- YOUTUBE_CHANNELS: Public read access
DROP POLICY IF EXISTS "youtube_channels_select_policy" ON youtube_channels;
CREATE POLICY "youtube_channels_select_policy"
  ON youtube_channels FOR SELECT
  TO public
  USING (true);

-- YOUTUBE_VIDEOS: Public read access (exclude hidden)
DROP POLICY IF EXISTS "youtube_videos_select_policy" ON youtube_videos;
CREATE POLICY "youtube_videos_select_policy"
  ON youtube_videos FOR SELECT
  TO public
  USING (is_hidden = false);

-- YOUTUBE_VIDEO_CAR_LINKS: Public read access
DROP POLICY IF EXISTS "youtube_video_car_links_select_policy" ON youtube_video_car_links;
CREATE POLICY "youtube_video_car_links_select_policy"
  ON youtube_video_car_links FOR SELECT
  TO public
  USING (true);

-- YOUTUBE_INGESTION_QUEUE: No public access (admin only)
-- (No policies = no public access)

-- ============================================================================
-- SEED DATA: Initial Channel Whitelist
-- ============================================================================
INSERT INTO youtube_channels (channel_id, channel_name, channel_url, channel_handle, credibility_tier, content_focus, notes)
VALUES
  -- Tier 1: Professional Automotive Journalism
  ('UCsAegdhiYLEoaFGuJFVrqFQ', 'Throttle House', 'https://www.youtube.com/@ThrottleHouse', 'ThrottleHouse', 'tier1', 
   ARRAY['reviews', 'comparisons', 'track_tests'], 'Canadian duo, excellent production quality, thorough reviews'),
  
  ('UCbW18JZRgko_KbSITbHWlpQ', 'carwow', 'https://www.youtube.com/@carwow', 'carwow', 'tier1',
   ARRAY['reviews', 'comparisons', 'drag_races'], 'Mat Watson, UK-based, famous for drag races'),
  
  ('UCl9GTo7kuzAQ4OqRpIL7h5g', 'Top Gear', 'https://www.youtube.com/@TopGear', 'TopGear', 'tier1',
   ARRAY['reviews', 'track_tests', 'education'], 'BBC Top Gear, iconic automotive journalism'),
  
  ('UC6S0jAFlFimZyBWg0E1ZX8A', 'Cars with Miles', 'https://www.youtube.com/@CarswithMiles', 'CarswithMiles', 'tier1',
   ARRAY['reviews', 'ownership', 'buying_guides'], 'Long-term ownership perspective, practical reviews'),
  
  ('UCgUvk6jVaf-1uKOqG8XNcaQ', 'MotorTrend Channel', 'https://www.youtube.com/@MotorTrendWatch', 'MotorTrendWatch', 'tier1',
   ARRAY['reviews', 'track_tests', 'comparisons'], 'Professional testing, Head 2 Head series'),
  
  -- Tier 2: Respected Enthusiast Channels
  ('UCsqjHFMB_JYTaEnf_vmTNqg', 'Doug DeMuro', 'https://www.youtube.com/@DougDeMuro', 'DougDeMuro', 'tier2',
   ARRAY['reviews', 'buying_guides'], 'Quirks and features focused, Doug Score'),
  
  ('UCXKYVoLxDDh5p9RSD9I-HYg', 'Savagegeese', 'https://www.youtube.com/@savagegeese', 'savagegeese', 'tier1',
   ARRAY['reviews', 'ownership', 'education'], 'Deep-dive technical reviews, excellent journalism'),
  
  ('UCPqHXW7jvv5mL4wZBgDjG0Q', 'The Straight Pipes', 'https://www.youtube.com/@TheStraightPipes', 'TheStraightPipes', 'tier2',
   ARRAY['reviews', 'comparisons'], 'Canadian duo, enthusiast perspective'),
  
  ('UCXJ1ipfHW3b5sAoZtwUuTGw', 'Donut Media', 'https://www.youtube.com/@Donut', 'Donut', 'tier2',
   ARRAY['education', 'reviews'], 'Educational content, enthusiast entertainment'),
  
  ('UCgamiJTZ3kDa8PGYXpR7dxg', 'Engineering Explained', 'https://www.youtube.com/@EngineeringExplained', 'EngineeringExplained', 'tier2',
   ARRAY['education', 'reviews'], 'Technical engineering focus, whiteboard explanations'),
  
  ('UCuRVQ4mUZx_99MFkZqHpsMw', 'Randy Pobst', 'https://www.youtube.com/@Randy_Pobst', 'Randy_Pobst', 'tier1',
   ARRAY['track_tests'], 'Professional racing driver, lap times'),
  
  ('UCBJycsmduvYEL83R_U4JriQ', 'Hagerty', 'https://www.youtube.com/@Hagerty', 'Hagerty', 'tier2',
   ARRAY['reviews', 'buying_guides', 'ownership'], 'Classic and enthusiast car focus')

ON CONFLICT (channel_id) DO NOTHING;






