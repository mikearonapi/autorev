-- ============================================================================
-- AL Conversation Sharing Support
-- 
-- Adds share_token and related columns to al_conversations table
-- to enable public sharing of conversations via unique tokens.
--
-- Features:
--   1. share_token - UUID for public URL access
--   2. share_expires_at - Optional expiration timestamp
--   3. share_revoked_at - Revocation timestamp (soft delete sharing)
--   4. Index for fast token lookups
--   5. RLS policy for public read access via token
-- ============================================================================

-- ============================================================================
-- 1. Add sharing columns to al_conversations
-- ============================================================================

ALTER TABLE al_conversations
ADD COLUMN IF NOT EXISTS share_token UUID UNIQUE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS share_expires_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS share_revoked_at TIMESTAMPTZ DEFAULT NULL;

-- Index for fast token lookups (only on non-null tokens)
CREATE INDEX IF NOT EXISTS idx_al_conversations_share_token 
ON al_conversations(share_token) 
WHERE share_token IS NOT NULL;

-- ============================================================================
-- 2. Comments
-- ============================================================================

COMMENT ON COLUMN al_conversations.share_token IS 'Unique UUID token for public sharing (NULL = not shared)';
COMMENT ON COLUMN al_conversations.share_expires_at IS 'When the share link expires (NULL = never expires)';
COMMENT ON COLUMN al_conversations.share_revoked_at IS 'When owner revoked sharing (NULL = active)';

-- ============================================================================
-- 3. RLS Policy for public read access via share_token
-- ============================================================================

-- Allow public read access for shared conversations (via service role in API)
-- The API route uses the service role client, so we need a policy that allows
-- the service role to read conversations by share_token

-- Note: The service role bypasses RLS, but we document the intent here
-- The actual security is enforced in the API route by validating:
--   1. share_token exists and matches
--   2. share_revoked_at is NULL
--   3. share_expires_at is NULL or in the future

-- ============================================================================
-- 4. Function to generate share token for a conversation
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_conversation_share_token(
  p_conversation_id UUID,
  p_user_id UUID,
  p_expires_in_days INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_token UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Verify user owns this conversation
  IF NOT EXISTS (
    SELECT 1 FROM al_conversations 
    WHERE id = p_conversation_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Conversation not found or not owned by user';
  END IF;

  -- Generate unique token
  v_token := gen_random_uuid();
  
  -- Calculate expiration if specified
  IF p_expires_in_days IS NOT NULL THEN
    v_expires_at := NOW() + (p_expires_in_days || ' days')::INTERVAL;
  END IF;
  
  -- Update conversation with share token
  UPDATE al_conversations
  SET 
    share_token = v_token,
    share_expires_at = v_expires_at,
    share_revoked_at = NULL, -- Clear any previous revocation
    updated_at = NOW()
  WHERE id = p_conversation_id;
  
  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. Function to revoke share token
-- ============================================================================

CREATE OR REPLACE FUNCTION revoke_conversation_share_token(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verify user owns this conversation
  IF NOT EXISTS (
    SELECT 1 FROM al_conversations 
    WHERE id = p_conversation_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Conversation not found or not owned by user';
  END IF;
  
  -- Revoke by setting revoked timestamp
  UPDATE al_conversations
  SET 
    share_revoked_at = NOW(),
    updated_at = NOW()
  WHERE id = p_conversation_id
    AND share_token IS NOT NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. Comments on functions
-- ============================================================================

COMMENT ON FUNCTION generate_conversation_share_token IS 'Generate a share token for a conversation (owned by user)';
COMMENT ON FUNCTION revoke_conversation_share_token IS 'Revoke sharing for a conversation (soft delete)';
