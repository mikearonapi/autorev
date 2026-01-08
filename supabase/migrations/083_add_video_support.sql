-- ============================================================================
-- ADD VIDEO SUPPORT TO USER UPLOADS
-- AutoRev - Build Photos & Videos Feature
--
-- Extends user_uploaded_images to support video uploads for builds.
-- Videos are stored in Vercel Blob (supports up to 5TB with multipart).
-- ============================================================================

-- ============================================================================
-- ADD VIDEO COLUMNS TO user_uploaded_images
-- ============================================================================

-- Media type discriminator (image vs video)
ALTER TABLE user_uploaded_images
  ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image'
    CHECK (media_type IN ('image', 'video'));

-- Video-specific metadata
ALTER TABLE user_uploaded_images
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;  -- Video duration

ALTER TABLE user_uploaded_images
  ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT;  -- Auto-generated poster frame

ALTER TABLE user_uploaded_images
  ADD COLUMN IF NOT EXISTS video_codec TEXT;  -- e.g., 'h264', 'hevc', 'vp9'

ALTER TABLE user_uploaded_images
  ADD COLUMN IF NOT EXISTS video_resolution TEXT;  -- e.g., '1080p', '4k'

-- Update content_type check to include video types
-- (existing column, no change needed - it already accepts any text)

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for filtering by media type
CREATE INDEX IF NOT EXISTS idx_user_uploaded_images_media_type 
  ON user_uploaded_images(media_type);

-- Index for video-specific queries (e.g., builds with videos)
CREATE INDEX IF NOT EXISTS idx_user_uploaded_images_videos_by_build 
  ON user_uploaded_images(user_build_id, media_type) 
  WHERE media_type = 'video';

-- ============================================================================
-- UPDATE get_community_posts TO INCLUDE MEDIA TYPE
-- ============================================================================

CREATE OR REPLACE FUNCTION get_community_posts(
  p_post_type TEXT DEFAULT NULL,
  p_car_slug TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  post_type TEXT,
  title TEXT,
  description TEXT,
  car_slug TEXT,
  car_name TEXT,
  view_count INTEGER,
  like_count INTEGER,
  is_featured BOOLEAN,
  published_at TIMESTAMPTZ,
  author JSONB,
  images JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.slug,
    cp.post_type,
    cp.title,
    cp.description,
    cp.car_slug,
    cp.car_name,
    cp.view_count,
    cp.like_count,
    cp.is_featured,
    cp.published_at,
    jsonb_build_object(
      'display_name', up.display_name,
      'public_slug', up.public_slug,
      'avatar_url', up.avatar_url,
      'tier', up.tier
    ) AS author,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', ui.id,
        'blob_url', ui.blob_url,
        'thumbnail_url', COALESCE(ui.video_thumbnail_url, ui.thumbnail_url),
        'caption', ui.caption,
        'is_primary', ui.is_primary,
        'media_type', COALESCE(ui.media_type, 'image'),
        'duration_seconds', ui.duration_seconds
      ) ORDER BY ui.is_primary DESC, ui.display_order ASC)
      FROM user_uploaded_images ui
      WHERE ui.community_post_id = cp.id
        AND ui.is_approved = true
    ), '[]'::jsonb) AS images
  FROM community_posts cp
  JOIN user_profiles up ON up.id = cp.user_id
  WHERE cp.is_published = true
    AND cp.is_approved = true
    AND (p_post_type IS NULL OR cp.post_type = p_post_type)
    AND (p_car_slug IS NULL OR cp.car_slug = p_car_slug)
  ORDER BY cp.is_featured DESC, cp.published_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN user_uploaded_images.media_type IS 'Type of media: image or video';
COMMENT ON COLUMN user_uploaded_images.duration_seconds IS 'Video duration in seconds (NULL for images)';
COMMENT ON COLUMN user_uploaded_images.video_thumbnail_url IS 'Auto-generated poster frame for videos';
COMMENT ON COLUMN user_uploaded_images.video_codec IS 'Video codec used (h264, hevc, vp9, av1)';
COMMENT ON COLUMN user_uploaded_images.video_resolution IS 'Video resolution (720p, 1080p, 4k)';
