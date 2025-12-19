-- ============================================================================
-- AL (AutoRev AI) Credit System Tables
-- 
-- This migration creates tables for the credit-based "gas tank" system:
--   1. al_user_credits - User credit balances and subscription info
--   2. al_usage_logs - Detailed usage logging for analytics
--   3. al_credit_purchases - Credit purchase history
--
-- Credit System Overview:
--   - Each plan has a monthly credit allocation (like a gas tank refill)
--   - Credits are consumed per AL interaction (message + tool calls)
--   - Users can purchase additional credits at any time
--   - Some plans allow credit carryover month-to-month
-- ============================================================================

-- ============================================================================
-- AL USER CREDITS TABLE
-- Main table tracking each user's credit balance and subscription
-- ============================================================================
CREATE TABLE IF NOT EXISTS al_user_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Subscription tier determines monthly allocation
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (
    subscription_tier IN ('free', 'enthusiast', 'collector', 'tuner')
  ),
  
  -- Credit balances
  current_credits INTEGER NOT NULL DEFAULT 25 CHECK (current_credits >= 0),
  purchased_credits INTEGER NOT NULL DEFAULT 0 CHECK (purchased_credits >= 0),
  
  -- Monthly usage tracking
  credits_used_this_month INTEGER NOT NULL DEFAULT 0 CHECK (credits_used_this_month >= 0),
  messages_this_month INTEGER NOT NULL DEFAULT 0 CHECK (messages_this_month >= 0),
  
  -- Refill tracking
  last_refill_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_refill_date TIMESTAMPTZ GENERATED ALWAYS AS (last_refill_date + INTERVAL '1 month') STORED,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one record per user
  CONSTRAINT unique_user_credits UNIQUE (user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_al_user_credits_user_id ON al_user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_al_user_credits_subscription ON al_user_credits(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_al_user_credits_next_refill ON al_user_credits(next_refill_date);

-- Auto-update timestamp
DROP TRIGGER IF EXISTS update_al_user_credits_updated_at ON al_user_credits;
CREATE TRIGGER update_al_user_credits_updated_at
  BEFORE UPDATE ON al_user_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE al_user_credits IS 'AL credit balances and subscription info - the "gas tank" for each user';
COMMENT ON COLUMN al_user_credits.current_credits IS 'Current available credits (includes allocated + purchased - used)';
COMMENT ON COLUMN al_user_credits.purchased_credits IS 'Total credits purchased (for tracking, not balance)';
COMMENT ON COLUMN al_user_credits.credits_used_this_month IS 'Credits consumed in current billing period';
COMMENT ON COLUMN al_user_credits.last_refill_date IS 'When credits were last refilled (monthly)';

-- ============================================================================
-- AL USAGE LOGS TABLE
-- Detailed logging of each AL interaction for analytics
-- ============================================================================
CREATE TABLE IF NOT EXISTS al_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Usage details
  credits_used INTEGER NOT NULL CHECK (credits_used >= 0),
  tool_calls TEXT[] DEFAULT '{}',
  response_tokens INTEGER DEFAULT 0,
  
  -- Context (what car/page was the user on)
  car_slug TEXT,
  page_context TEXT,
  
  -- Query info (anonymized/truncated for privacy)
  query_type TEXT, -- 'search', 'detail', 'compare', 'mod', 'maintenance', etc.
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_al_usage_logs_user_id ON al_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_al_usage_logs_created_at ON al_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_al_usage_logs_user_month ON al_usage_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_al_usage_logs_car_slug ON al_usage_logs(car_slug);

-- Comments
COMMENT ON TABLE al_usage_logs IS 'Detailed log of each AL interaction for usage analytics';
COMMENT ON COLUMN al_usage_logs.tool_calls IS 'Array of tool names called during this interaction';
COMMENT ON COLUMN al_usage_logs.query_type IS 'Categorized query type for analytics';

-- ============================================================================
-- AL CREDIT PURCHASES TABLE
-- Record of all credit purchases
-- ============================================================================
CREATE TABLE IF NOT EXISTS al_credit_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Purchase details
  package_id TEXT NOT NULL,
  credits_purchased INTEGER NOT NULL CHECK (credits_purchased > 0),
  price_paid DECIMAL(10, 2) NOT NULL CHECK (price_paid >= 0),
  
  -- Payment info (stripe reference, etc.)
  payment_reference TEXT,
  payment_status TEXT DEFAULT 'completed' CHECK (
    payment_status IN ('pending', 'completed', 'failed', 'refunded')
  ),
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_al_credit_purchases_user_id ON al_credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_al_credit_purchases_created_at ON al_credit_purchases(created_at DESC);

-- Comments
COMMENT ON TABLE al_credit_purchases IS 'Record of all credit purchases for billing and audit';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE al_user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE al_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE al_credit_purchases ENABLE ROW LEVEL SECURITY;

-- AL_USER_CREDITS: Users can only see/modify their own credits
DROP POLICY IF EXISTS "al_user_credits_select_own" ON al_user_credits;
CREATE POLICY "al_user_credits_select_own"
  ON al_user_credits FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "al_user_credits_insert_own" ON al_user_credits;
CREATE POLICY "al_user_credits_insert_own"
  ON al_user_credits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "al_user_credits_update_own" ON al_user_credits;
CREATE POLICY "al_user_credits_update_own"
  ON al_user_credits FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- AL_USAGE_LOGS: Users can see their own logs, insert for themselves
DROP POLICY IF EXISTS "al_usage_logs_select_own" ON al_usage_logs;
CREATE POLICY "al_usage_logs_select_own"
  ON al_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "al_usage_logs_insert_own" ON al_usage_logs;
CREATE POLICY "al_usage_logs_insert_own"
  ON al_usage_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- AL_CREDIT_PURCHASES: Users can only see their own purchases
DROP POLICY IF EXISTS "al_credit_purchases_select_own" ON al_credit_purchases;
CREATE POLICY "al_credit_purchases_select_own"
  ON al_credit_purchases FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "al_credit_purchases_insert_own" ON al_credit_purchases;
CREATE POLICY "al_credit_purchases_insert_own"
  ON al_credit_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user has enough credits
CREATE OR REPLACE FUNCTION check_al_credits(p_user_id UUID, p_required_credits INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_credits INTEGER;
BEGIN
  SELECT current_credits INTO v_current_credits
  FROM al_user_credits
  WHERE user_id = p_user_id;
  
  IF v_current_credits IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN v_current_credits >= p_required_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct credits (atomic operation)
CREATE OR REPLACE FUNCTION deduct_al_credits(
  p_user_id UUID, 
  p_credits INTEGER,
  p_tool_calls TEXT[] DEFAULT '{}'
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, error_message TEXT) AS $$
DECLARE
  v_current_credits INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Lock the row for update
  SELECT current_credits INTO v_current_credits
  FROM al_user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF v_current_credits IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 'User not found'::TEXT;
    RETURN;
  END IF;
  
  IF v_current_credits < p_credits THEN
    RETURN QUERY SELECT FALSE, v_current_credits, 'Insufficient credits'::TEXT;
    RETURN;
  END IF;
  
  -- Deduct credits
  v_new_balance := v_current_credits - p_credits;
  
  UPDATE al_user_credits
  SET 
    current_credits = v_new_balance,
    credits_used_this_month = credits_used_this_month + p_credits,
    messages_this_month = messages_this_month + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log the usage
  INSERT INTO al_usage_logs (user_id, credits_used, tool_calls)
  VALUES (p_user_id, p_credits, p_tool_calls);
  
  RETURN QUERY SELECT TRUE, v_new_balance, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add purchased credits
CREATE OR REPLACE FUNCTION add_al_credits(
  p_user_id UUID,
  p_credits INTEGER,
  p_package_id TEXT,
  p_price DECIMAL
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER) AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Add credits
  UPDATE al_user_credits
  SET 
    current_credits = current_credits + p_credits,
    purchased_credits = purchased_credits + p_credits,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING current_credits INTO v_new_balance;
  
  IF v_new_balance IS NULL THEN
    -- User doesn't exist, create record
    INSERT INTO al_user_credits (user_id, current_credits, purchased_credits)
    VALUES (p_user_id, p_credits + 25, p_credits) -- 25 = free tier allocation
    RETURNING current_credits INTO v_new_balance;
  END IF;
  
  -- Log the purchase
  INSERT INTO al_credit_purchases (user_id, package_id, credits_purchased, price_paid)
  VALUES (p_user_id, p_package_id, p_credits, p_price);
  
  RETURN QUERY SELECT TRUE, v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process monthly refill
CREATE OR REPLACE FUNCTION process_al_monthly_refill(p_user_id UUID)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, carryover INTEGER) AS $$
DECLARE
  v_tier TEXT;
  v_current INTEGER;
  v_monthly_allocation INTEGER;
  v_max_carryover INTEGER;
  v_carryover INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get user's current state
  SELECT subscription_tier, current_credits 
  INTO v_tier, v_current
  FROM al_user_credits
  WHERE user_id = p_user_id;
  
  IF v_tier IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 0;
    RETURN;
  END IF;
  
  -- Determine allocations based on tier
  CASE v_tier
    WHEN 'free' THEN 
      v_monthly_allocation := 25;
      v_max_carryover := 0;
    WHEN 'enthusiast' THEN 
      v_monthly_allocation := 50;
      v_max_carryover := 25;
    WHEN 'collector' THEN 
      v_monthly_allocation := 100;
      v_max_carryover := 50;
    WHEN 'tuner' THEN 
      v_monthly_allocation := 200;
      v_max_carryover := 100;
    ELSE
      v_monthly_allocation := 25;
      v_max_carryover := 0;
  END CASE;
  
  -- Calculate carryover
  v_carryover := LEAST(v_current, v_max_carryover);
  v_new_balance := v_monthly_allocation + v_carryover;
  
  -- Update user's credits
  UPDATE al_user_credits
  SET 
    current_credits = v_new_balance,
    credits_used_this_month = 0,
    messages_this_month = 0,
    last_refill_date = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN QUERY SELECT TRUE, v_new_balance, v_carryover;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ADD subscription_tier TO user_profiles IF NOT EXISTS
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN subscription_tier TEXT DEFAULT 'free' CHECK (
      subscription_tier IN ('free', 'enthusiast', 'collector', 'tuner')
    );
    
    COMMENT ON COLUMN user_profiles.subscription_tier IS 'User subscription tier for AL and other premium features';
  END IF;
END $$;














