-- ============================================================================
-- Allow Public Read of Basic Profile Display Info
-- ============================================================================
-- Updates RLS policy on user_profiles to allow anyone to read basic display
-- info (display_name, avatar_url) for any user. This is needed for:
--   - Event attendees list (Who's Going section)
--   - Community features (comments, posts)
--   - Any public-facing user display
--
-- Note: RLS policies can't restrict columns, so we allow full row read.
-- Sensitive data should NOT be stored in user_profiles - use a separate
-- table with stricter RLS for private user data.
-- ============================================================================

-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "user_profiles_select_own" ON user_profiles;
DROP POLICY IF EXISTS "Public can view public profiles" ON user_profiles;

-- Create a new policy that allows:
-- 1. Anyone to read basic profile info (for community features)
-- 2. Users to still only UPDATE/DELETE their own profile
CREATE POLICY "Anyone can read user profiles" ON user_profiles
  FOR SELECT USING (true);

-- Keep the existing insert/update/delete policies (unchanged)
-- Users can only modify their own profile - these already exist from migration 009

COMMENT ON POLICY "Anyone can read user profiles" ON user_profiles IS 
  'Allows reading display_name, avatar_url for community features like event attendees, comments, etc.';

-- ============================================================================
-- Done! Apply with: npx supabase db push
-- ============================================================================
