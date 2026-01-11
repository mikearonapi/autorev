-- ============================================================================
-- YouTube DIY Insights Column
-- 
-- Adds a JSONB column to youtube_videos for storing structured DIY content
-- extracted from build/tutorial/restoration/maintenance videos.
-- 
-- This supports the YouTube Channel Enrichment Pipeline that processes
-- content from DIY-focused channels like ChrisFix, Vice Grip Garage, etc.
-- ============================================================================

-- Add diy_insights column for structured DIY content
ALTER TABLE youtube_videos 
ADD COLUMN IF NOT EXISTS diy_insights JSONB;

-- Add content_category for distinguishing review content from DIY content
ALTER TABLE youtube_videos
ADD COLUMN IF NOT EXISTS content_category TEXT 
CHECK (content_category IN ('review', 'diy', 'build', 'tutorial', 'restoration', 'diagnostics', 'education', 'comparison', 'motorsport'));

-- Add index for content_category filtering
CREATE INDEX IF NOT EXISTS idx_youtube_videos_content_category 
ON youtube_videos(content_category) 
WHERE content_category IS NOT NULL;

-- Add index for diy_insights JSON queries
CREATE INDEX IF NOT EXISTS idx_youtube_videos_diy_insights 
ON youtube_videos USING GIN (diy_insights) 
WHERE diy_insights IS NOT NULL;

-- Comments
COMMENT ON COLUMN youtube_videos.diy_insights IS 'Structured DIY content: known_issues, maintenance_tips, parts_mentioned, troubleshooting_insights, modification_details';
COMMENT ON COLUMN youtube_videos.content_category IS 'Category of content: review (car review), diy (how-to), build (project car), tutorial, restoration, diagnostics, education';

-- ============================================================================
-- Update youtube_channels for DIY channel support
-- ============================================================================

-- Ensure content_focus array can hold DIY-specific values
-- (The column already exists and supports arbitrary text arrays)

-- ============================================================================
-- Update youtube_ingestion_queue for DIY pipeline support  
-- ============================================================================

-- Add metadata column if it doesn't exist (for storing discovery context)
ALTER TABLE youtube_ingestion_queue
ADD COLUMN IF NOT EXISTS metadata JSONB;

COMMENT ON COLUMN youtube_ingestion_queue.metadata IS 'Additional metadata from discovery: matched_vehicle, matched_rank, discovery source, etc.';
