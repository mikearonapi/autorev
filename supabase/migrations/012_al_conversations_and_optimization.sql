-- ============================================================================
-- AL Conversations & Database Optimization Migration
-- 
-- This migration adds:
--   1. al_conversations - Store conversation threads
--   2. al_messages - Individual messages within conversations
--   3. Indexes for optimized AL queries across all tables
--   4. Full-text search capabilities for cars and content
--
-- Purpose: Enable conversation history and optimize AL's database access
-- ============================================================================

-- ============================================================================
-- AL CONVERSATIONS TABLE
-- Stores conversation threads for each user
-- ============================================================================
CREATE TABLE IF NOT EXISTS al_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User reference (required - no anonymous AL usage)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Conversation metadata
  title TEXT,                                  -- Auto-generated or user-set title
  summary TEXT,                                -- AI-generated summary of conversation
  
  -- Context when conversation started
  initial_car_slug TEXT REFERENCES cars(slug) ON DELETE SET NULL,
  initial_page TEXT,                           -- Where the conversation started
  
  -- Conversation state
  message_count INTEGER DEFAULT 0,
  total_credits_used INTEGER DEFAULT 0,
  
  -- Status
  is_archived BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  
  -- Last activity tracking
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for conversations
CREATE INDEX IF NOT EXISTS idx_al_conversations_user_id ON al_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_al_conversations_user_recent ON al_conversations(user_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_al_conversations_user_active ON al_conversations(user_id, is_archived, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_al_conversations_car_slug ON al_conversations(initial_car_slug);

-- Auto-update timestamp
DROP TRIGGER IF EXISTS update_al_conversations_updated_at ON al_conversations;
CREATE TRIGGER update_al_conversations_updated_at
  BEFORE UPDATE ON al_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE al_conversations IS 'AL conversation threads - each represents a distinct chat session';
COMMENT ON COLUMN al_conversations.title IS 'Conversation title, auto-generated from first message or user-set';
COMMENT ON COLUMN al_conversations.summary IS 'AI-generated summary for quick reference in history';

-- ============================================================================
-- AL MESSAGES TABLE
-- Individual messages within conversations
-- ============================================================================
CREATE TABLE IF NOT EXISTS al_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Conversation reference
  conversation_id UUID NOT NULL REFERENCES al_conversations(id) ON DELETE CASCADE,
  
  -- Message content
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  
  -- Metadata
  tool_calls TEXT[] DEFAULT '{}',              -- Tools AL used for this response
  credits_used INTEGER DEFAULT 0,
  response_tokens INTEGER DEFAULT 0,
  
  -- Context at time of message
  car_context_slug TEXT,                       -- Car being discussed (if any)
  car_context_name TEXT,                       -- Denormalized for display
  
  -- For assistant messages - what data was referenced
  data_sources JSONB DEFAULT '[]'::jsonb,      -- [{type: 'car', slug: '...'}, {type: 'review', id: '...'}]
  
  -- Message ordering
  sequence_number INTEGER NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_al_messages_conversation ON al_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_al_messages_conversation_seq ON al_messages(conversation_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_al_messages_created ON al_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_al_messages_car_context ON al_messages(car_context_slug);

-- Comments
COMMENT ON TABLE al_messages IS 'Individual messages in AL conversations';
COMMENT ON COLUMN al_messages.data_sources IS 'JSON array of data sources AL referenced in this response';

-- ============================================================================
-- ROW LEVEL SECURITY FOR CONVERSATIONS
-- ============================================================================
ALTER TABLE al_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE al_messages ENABLE ROW LEVEL SECURITY;

-- Users can only see their own conversations
DROP POLICY IF EXISTS "al_conversations_select_own" ON al_conversations;
CREATE POLICY "al_conversations_select_own"
  ON al_conversations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "al_conversations_insert_own" ON al_conversations;
CREATE POLICY "al_conversations_insert_own"
  ON al_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "al_conversations_update_own" ON al_conversations;
CREATE POLICY "al_conversations_update_own"
  ON al_conversations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "al_conversations_delete_own" ON al_conversations;
CREATE POLICY "al_conversations_delete_own"
  ON al_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Messages inherit access from conversation ownership
DROP POLICY IF EXISTS "al_messages_select_own" ON al_messages;
CREATE POLICY "al_messages_select_own"
  ON al_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM al_conversations 
      WHERE id = al_messages.conversation_id 
      AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "al_messages_insert_own" ON al_messages;
CREATE POLICY "al_messages_insert_own"
  ON al_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM al_conversations 
      WHERE id = al_messages.conversation_id 
      AND user_id = auth.uid()
    )
  );

-- ============================================================================
-- FULL-TEXT SEARCH SETUP FOR CARS
-- Enables fast natural language search across car data
-- ============================================================================

-- Add search vector column to cars if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cars' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE cars ADD COLUMN search_vector tsvector;
  END IF;
END $$;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION cars_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.brand, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.engine, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.notes, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.highlight, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.tagline, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.hero_blurb, '')), 'D') ||
    setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.tier, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create trigger for search vector
DROP TRIGGER IF EXISTS cars_search_vector_trigger ON cars;
CREATE TRIGGER cars_search_vector_trigger
  BEFORE INSERT OR UPDATE ON cars
  FOR EACH ROW
  EXECUTE FUNCTION cars_search_vector_update();

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_cars_search_vector ON cars USING GIN(search_vector);

-- Update existing rows
UPDATE cars SET search_vector = 
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(brand, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(engine, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(notes, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(highlight, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(tagline, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(hero_blurb, '')), 'D') ||
  setweight(to_tsvector('english', COALESCE(category, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(tier, '')), 'B')
WHERE search_vector IS NULL;

-- ============================================================================
-- OPTIMIZED INDEXES FOR AL QUERIES
-- ============================================================================

-- Cars: Common filter combinations
CREATE INDEX IF NOT EXISTS idx_cars_price_hp ON cars(price_avg, hp);
CREATE INDEX IF NOT EXISTS idx_cars_tier_price ON cars(tier, price_avg);
CREATE INDEX IF NOT EXISTS idx_cars_category_tier ON cars(category, tier);
CREATE INDEX IF NOT EXISTS idx_cars_brand ON cars(brand);
CREATE INDEX IF NOT EXISTS idx_cars_drivetrain ON cars(drivetrain);
CREATE INDEX IF NOT EXISTS idx_cars_manual ON cars(manual_available) WHERE manual_available = true;

-- Cars: Score-based queries (for recommendations)
CREATE INDEX IF NOT EXISTS idx_cars_score_value ON cars(score_value DESC) WHERE score_value IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cars_score_track ON cars(score_track DESC) WHERE score_track IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cars_score_reliability ON cars(score_reliability DESC) WHERE score_reliability IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cars_score_sound ON cars(score_sound DESC) WHERE score_sound IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cars_score_driver_fun ON cars(score_driver_fun DESC) WHERE score_driver_fun IS NOT NULL;

-- YouTube videos: For expert review queries
CREATE INDEX IF NOT EXISTS idx_youtube_videos_processed ON youtube_videos(processing_status, quality_score DESC) 
  WHERE processing_status = 'processed' AND is_hidden = false;
CREATE INDEX IF NOT EXISTS idx_youtube_video_car_links_role ON youtube_video_car_links(car_slug, role, match_confidence DESC);

-- Known issues: For reliability queries
CREATE INDEX IF NOT EXISTS idx_car_known_issues_severity ON car_known_issues(car_slug, severity);

-- User vehicles: For personalized queries
CREATE INDEX IF NOT EXISTS idx_user_vehicles_user ON user_vehicles(user_id, is_primary DESC);
CREATE INDEX IF NOT EXISTS idx_user_vehicles_car ON user_vehicles(car_slug);

-- User favorites: For recommendation context
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id, created_at DESC);

-- User saved builds: For mod recommendations
CREATE INDEX IF NOT EXISTS idx_user_saved_builds_user_car ON user_saved_builds(user_id, car_slug);

-- ============================================================================
-- HELPER FUNCTIONS FOR AL
-- ============================================================================

-- Function to search cars with natural language
CREATE OR REPLACE FUNCTION search_cars_fts(
  search_query TEXT,
  max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  slug TEXT,
  name TEXT,
  years TEXT,
  hp INTEGER,
  price_range TEXT,
  engine TEXT,
  category TEXT,
  highlight TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.slug,
    c.name,
    c.years,
    c.hp,
    c.price_range,
    c.engine,
    c.category,
    c.highlight,
    ts_rank(c.search_vector, plainto_tsquery('english', search_query)) as rank
  FROM cars c
  WHERE c.search_vector @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Function to get car with all AL-relevant data
CREATE OR REPLACE FUNCTION get_car_for_al(car_slug_param TEXT)
RETURNS TABLE (
  -- Basic info
  slug TEXT,
  name TEXT,
  years TEXT,
  brand TEXT,
  category TEXT,
  tier TEXT,
  -- Specs
  engine TEXT,
  hp INTEGER,
  torque INTEGER,
  trans TEXT,
  drivetrain TEXT,
  curb_weight INTEGER,
  zero_to_sixty DECIMAL,
  -- Scores
  score_sound DECIMAL,
  score_interior DECIMAL,
  score_track DECIMAL,
  score_reliability DECIMAL,
  score_value DECIMAL,
  score_driver_fun DECIMAL,
  score_aftermarket DECIMAL,
  -- Content
  notes TEXT,
  highlight TEXT,
  pros JSONB,
  cons JSONB,
  best_for JSONB,
  -- Pricing
  price_range TEXT,
  price_avg INTEGER,
  -- Counts
  known_issues_count BIGINT,
  expert_reviews_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.slug,
    c.name,
    c.years,
    c.brand,
    c.category,
    c.tier,
    c.engine,
    c.hp,
    c.torque,
    c.trans,
    c.drivetrain,
    c.curb_weight,
    c.zero_to_sixty,
    c.score_sound,
    c.score_interior,
    c.score_track,
    c.score_reliability,
    c.score_value,
    c.score_driver_fun,
    c.score_aftermarket,
    c.notes,
    c.highlight,
    c.pros,
    c.cons,
    c.best_for,
    c.price_range,
    c.price_avg,
    (SELECT COUNT(*) FROM car_known_issues ki WHERE ki.car_slug = c.slug),
    (SELECT COUNT(*) FROM youtube_video_car_links vl WHERE vl.car_slug = c.slug)
  FROM cars c
  WHERE c.slug = car_slug_param;
END;
$$ LANGUAGE plpgsql;

-- Function to get user context for AL
CREATE OR REPLACE FUNCTION get_user_context_for_al(user_id_param UUID)
RETURNS TABLE (
  -- Favorites
  favorite_car_slugs TEXT[],
  favorite_count INTEGER,
  -- Builds
  build_car_slugs TEXT[],
  build_count INTEGER,
  -- Owned vehicles
  owned_makes TEXT[],
  owned_models TEXT[],
  primary_vehicle_slug TEXT,
  -- Activity
  cars_viewed_count INTEGER,
  member_since TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Favorites
    ARRAY(
      SELECT f.car_slug FROM user_favorites f 
      WHERE f.user_id = user_id_param 
      ORDER BY f.created_at DESC LIMIT 10
    ),
    (SELECT COUNT(*)::INTEGER FROM user_favorites WHERE user_id = user_id_param),
    -- Builds
    ARRAY(
      SELECT DISTINCT b.car_slug FROM user_saved_builds b 
      WHERE b.user_id = user_id_param
    ),
    (SELECT COUNT(*)::INTEGER FROM user_saved_builds WHERE user_id = user_id_param),
    -- Owned vehicles
    ARRAY(
      SELECT DISTINCT v.make FROM user_vehicles v 
      WHERE v.user_id = user_id_param
    ),
    ARRAY(
      SELECT v.model FROM user_vehicles v 
      WHERE v.user_id = user_id_param
    ),
    (SELECT v.car_slug FROM user_vehicles v 
     WHERE v.user_id = user_id_param AND v.is_primary = true LIMIT 1),
    -- Activity from profile
    COALESCE((SELECT p.cars_viewed_count FROM user_profiles p WHERE p.id = user_id_param), 0),
    (SELECT u.created_at FROM auth.users u WHERE u.id = user_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create or continue a conversation
CREATE OR REPLACE FUNCTION create_al_conversation(
  p_user_id UUID,
  p_car_slug TEXT DEFAULT NULL,
  p_page TEXT DEFAULT NULL,
  p_title TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  INSERT INTO al_conversations (
    user_id, 
    initial_car_slug, 
    initial_page, 
    title
  )
  VALUES (
    p_user_id, 
    p_car_slug, 
    p_page, 
    COALESCE(p_title, 'New Conversation')
  )
  RETURNING id INTO v_conversation_id;
  
  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a message to a conversation
CREATE OR REPLACE FUNCTION add_al_message(
  p_conversation_id UUID,
  p_role TEXT,
  p_content TEXT,
  p_tool_calls TEXT[] DEFAULT '{}',
  p_credits_used INTEGER DEFAULT 0,
  p_car_context_slug TEXT DEFAULT NULL,
  p_car_context_name TEXT DEFAULT NULL,
  p_data_sources JSONB DEFAULT '[]'
)
RETURNS UUID AS $$
DECLARE
  v_message_id UUID;
  v_seq_num INTEGER;
BEGIN
  -- Get next sequence number
  SELECT COALESCE(MAX(sequence_number), 0) + 1 INTO v_seq_num
  FROM al_messages WHERE conversation_id = p_conversation_id;
  
  -- Insert message
  INSERT INTO al_messages (
    conversation_id,
    role,
    content,
    tool_calls,
    credits_used,
    car_context_slug,
    car_context_name,
    data_sources,
    sequence_number
  )
  VALUES (
    p_conversation_id,
    p_role,
    p_content,
    p_tool_calls,
    p_credits_used,
    p_car_context_slug,
    p_car_context_name,
    p_data_sources,
    v_seq_num
  )
  RETURNING id INTO v_message_id;
  
  -- Update conversation stats
  UPDATE al_conversations
  SET 
    message_count = message_count + 1,
    total_credits_used = total_credits_used + p_credits_used,
    last_message_at = NOW(),
    updated_at = NOW(),
    -- Auto-generate title from first user message if not set
    title = CASE 
      WHEN title = 'New Conversation' AND p_role = 'user' 
      THEN LEFT(p_content, 50) || CASE WHEN LENGTH(p_content) > 50 THEN '...' ELSE '' END
      ELSE title
    END
  WHERE id = p_conversation_id;
  
  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON FUNCTION search_cars_fts IS 'Full-text search across cars table with relevance ranking';
COMMENT ON FUNCTION get_car_for_al IS 'Get complete car data optimized for AL context building';
COMMENT ON FUNCTION get_user_context_for_al IS 'Get user preferences and history for personalized AL responses';
COMMENT ON FUNCTION create_al_conversation IS 'Create a new AL conversation thread';
COMMENT ON FUNCTION add_al_message IS 'Add a message to an AL conversation with automatic stats update';






















