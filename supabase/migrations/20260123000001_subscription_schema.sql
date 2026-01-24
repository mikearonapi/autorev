-- ============================================================================
-- Subscription Schema Normalization
-- 
-- Migrates from flat user_profiles columns to a normalized schema that enables:
-- - Better analytics and subscription history tracking
-- - Flexible plan/feature management via database
-- - Trial abuse prevention
-- - Stripe data sync
--
-- Based on: docs/Best Practices/Subscription and Monetization.md
-- 
-- NOTE: ENUMs not used (using TEXT for flexibility with Stripe status values)
-- ============================================================================

-- ============================================================================
-- CUSTOMERS TABLE
-- Links Supabase users to Stripe customers
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for Stripe customer lookup
CREATE INDEX IF NOT EXISTS idx_customers_stripe_id ON public.customers(stripe_customer_id);

COMMENT ON TABLE public.customers IS 'Links Supabase auth users to Stripe customer IDs';

-- ============================================================================
-- PRODUCTS TABLE
-- Synced from Stripe products
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY, -- Stripe product ID (prod_xxx)
  active BOOLEAN DEFAULT true,
  name TEXT NOT NULL,
  description TEXT,
  image TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.products IS 'Stripe products synced via webhooks';

-- ============================================================================
-- PRICES TABLE
-- Synced from Stripe prices
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.prices (
  id TEXT PRIMARY KEY, -- Stripe price ID (price_xxx)
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  unit_amount BIGINT, -- Amount in cents
  currency TEXT CHECK (char_length(currency) = 3),
  type pricing_type,
  interval pricing_interval,
  interval_count INTEGER DEFAULT 1,
  trial_period_days INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for product lookup
CREATE INDEX IF NOT EXISTS idx_prices_product_id ON public.prices(product_id);
CREATE INDEX IF NOT EXISTS idx_prices_active ON public.prices(active) WHERE active = true;

COMMENT ON TABLE public.prices IS 'Stripe prices synced via webhooks';

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- Source of truth for subscription state
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY, -- Stripe subscription ID (sub_xxx)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status subscription_status NOT NULL,
  price_id TEXT REFERENCES public.prices(id),
  quantity INTEGER DEFAULT 1,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON public.subscriptions(user_id) 
  WHERE status IN ('active', 'trialing');
CREATE INDEX IF NOT EXISTS idx_subscriptions_price_id ON public.subscriptions(price_id);

COMMENT ON TABLE public.subscriptions IS 'Stripe subscriptions - source of truth for user subscription state';

-- ============================================================================
-- PLANS TABLE
-- Maps products to internal plan identifiers
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY, -- Internal plan ID: 'free', 'collector', 'tuner'
  name TEXT NOT NULL, -- Display name: 'Free', 'Enthusiast', 'Tuner'
  description TEXT,
  product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one default plan allowed
CREATE UNIQUE INDEX IF NOT EXISTS idx_plans_default ON public.plans(is_default) WHERE is_default = true;

COMMENT ON TABLE public.plans IS 'Internal subscription plans mapped to Stripe products';

-- ============================================================================
-- FEATURES TABLE
-- Defines gatable features
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.features (
  id TEXT PRIMARY KEY, -- Feature key: 'vinDecode', 'dynoDatabase', etc.
  name TEXT NOT NULL, -- Display name
  description TEXT,
  feature_type feature_type DEFAULT 'boolean',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.features IS 'Gatable features for subscription entitlements';

-- ============================================================================
-- PLAN_ENTITLEMENTS TABLE
-- Maps which features each plan has access to
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.plan_entitlements (
  plan_id TEXT REFERENCES public.plans(id) ON DELETE CASCADE,
  feature_id TEXT REFERENCES public.features(id) ON DELETE CASCADE,
  value JSONB NOT NULL DEFAULT 'true', -- true/false for boolean, number for limits
  limit_value INTEGER, -- For metered/numeric features
  PRIMARY KEY (plan_id, feature_id)
);

COMMENT ON TABLE public.plan_entitlements IS 'Feature access by plan';

-- ============================================================================
-- TRIAL_HISTORY TABLE
-- Tracks trial usage for fraud prevention
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.trial_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id TEXT NOT NULL,
  device_fingerprint TEXT,
  email_domain TEXT,
  ip_address INET,
  trial_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_ended_at TIMESTAMPTZ,
  converted_to_paid BOOLEAN DEFAULT false,
  subscription_id TEXT REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Indexes for fraud checks
CREATE INDEX IF NOT EXISTS idx_trial_history_device ON public.trial_history(device_fingerprint) WHERE device_fingerprint IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trial_history_email_domain ON public.trial_history(email_domain);
CREATE INDEX IF NOT EXISTS idx_trial_history_user ON public.trial_history(user_id);

COMMENT ON TABLE public.trial_history IS 'Trial usage history for fraud prevention';

-- ============================================================================
-- SUBSCRIPTION_METRICS TABLE
-- Daily metrics snapshots for analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscription_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  mrr_cents INTEGER NOT NULL DEFAULT 0,
  arr_cents INTEGER NOT NULL DEFAULT 0,
  total_subscribers INTEGER NOT NULL DEFAULT 0,
  new_subscribers INTEGER NOT NULL DEFAULT 0,
  churned_subscribers INTEGER NOT NULL DEFAULT 0,
  trial_starts INTEGER NOT NULL DEFAULT 0,
  trial_conversions INTEGER NOT NULL DEFAULT 0,
  monthly_churn_rate DECIMAL(5,4),
  trial_conversion_rate DECIMAL(5,4),
  by_tier JSONB DEFAULT '{}', -- { "collector": 10, "tuner": 5 }
  by_interval JSONB DEFAULT '{}', -- { "month": 12, "year": 3 }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_metrics_date ON public.subscription_metrics(date DESC);

COMMENT ON TABLE public.subscription_metrics IS 'Daily subscription metrics snapshots';

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_metrics ENABLE ROW LEVEL SECURITY;

-- Customers: Users can only view their own customer record
CREATE POLICY "Users can view own customer" ON public.customers
  FOR SELECT USING (auth.uid() = id);

-- Products: Public read access for active products
CREATE POLICY "Public can view active products" ON public.products
  FOR SELECT USING (active = true);

-- Prices: Public read access for active prices  
CREATE POLICY "Public can view active prices" ON public.prices
  FOR SELECT USING (active = true);

-- Subscriptions: Users can only view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Plans: Public read access
CREATE POLICY "Public can view plans" ON public.plans
  FOR SELECT USING (true);

-- Features: Public read access
CREATE POLICY "Public can view features" ON public.features
  FOR SELECT USING (true);

-- Plan Entitlements: Public read access
CREATE POLICY "Public can view plan entitlements" ON public.plan_entitlements
  FOR SELECT USING (true);

-- Trial History: Users can view their own trial history
CREATE POLICY "Users can view own trial history" ON public.trial_history
  FOR SELECT USING (auth.uid() = user_id);

-- Subscription Metrics: Admin only (no public access)
-- Service role will be used for inserts/updates

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get user's active subscription
CREATE OR REPLACE FUNCTION public.get_user_subscription(p_user_id UUID)
RETURNS TABLE (
  subscription_id TEXT,
  status subscription_status,
  plan_id TEXT,
  price_id TEXT,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN,
  trial_end TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as subscription_id,
    s.status,
    pl.id as plan_id,
    s.price_id,
    s.current_period_end,
    s.cancel_at_period_end,
    s.trial_end
  FROM public.subscriptions s
  LEFT JOIN public.prices pr ON s.price_id = pr.id
  LEFT JOIN public.products prod ON pr.product_id = prod.id
  LEFT JOIN public.plans pl ON pl.product_id = prod.id
  WHERE s.user_id = p_user_id
    AND s.status IN ('active', 'trialing', 'past_due')
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$;

-- Check if user has access to a feature
CREATE OR REPLACE FUNCTION public.check_feature_access(
  p_user_id UUID,
  p_feature_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan_id TEXT;
  v_result JSONB;
BEGIN
  -- Get user's current plan from active subscription
  SELECT pl.id INTO v_plan_id
  FROM public.subscriptions s
  JOIN public.prices pr ON s.price_id = pr.id
  JOIN public.products prod ON pr.product_id = prod.id
  JOIN public.plans pl ON pl.product_id = prod.id
  WHERE s.user_id = p_user_id
    AND s.status IN ('active', 'trialing')
  ORDER BY s.created_at DESC
  LIMIT 1;
  
  -- Fall back to default (free) plan if no subscription
  IF v_plan_id IS NULL THEN
    SELECT id INTO v_plan_id FROM public.plans WHERE is_default = true LIMIT 1;
  END IF;
  
  -- Still null? Use 'free' as fallback
  IF v_plan_id IS NULL THEN
    v_plan_id := 'free';
  END IF;
  
  -- Get entitlement for this plan + feature
  SELECT jsonb_build_object(
    'has_access', COALESCE((pe.value)::boolean, false),
    'limit_value', pe.limit_value,
    'plan_id', v_plan_id
  ) INTO v_result
  FROM public.plan_entitlements pe
  WHERE pe.plan_id = v_plan_id AND pe.feature_id = p_feature_id;
  
  -- If no entitlement found, no access
  IF v_result IS NULL THEN
    v_result := jsonb_build_object(
      'has_access', false,
      'limit_value', NULL,
      'plan_id', v_plan_id
    );
  END IF;
  
  RETURN v_result;
END;
$$;

-- Get user's current plan ID
CREATE OR REPLACE FUNCTION public.get_user_plan_id(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan_id TEXT;
BEGIN
  SELECT pl.id INTO v_plan_id
  FROM public.subscriptions s
  JOIN public.prices pr ON s.price_id = pr.id
  JOIN public.products prod ON pr.product_id = prod.id
  JOIN public.plans pl ON pl.product_id = prod.id
  WHERE s.user_id = p_user_id
    AND s.status IN ('active', 'trialing')
  ORDER BY s.created_at DESC
  LIMIT 1;
  
  -- Return 'free' if no active subscription
  RETURN COALESCE(v_plan_id, 'free');
END;
$$;

-- ============================================================================
-- SEED DATA: Plans and Features
-- ============================================================================

-- Insert default plans
INSERT INTO public.plans (id, name, description, display_order, is_default) VALUES
  ('free', 'Free', 'Research any sports car', 0, true),
  ('collector', 'Enthusiast', 'Own & maintain your car', 1, false),
  ('tuner', 'Tuner', 'Build & modify your car', 2, false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

-- Insert features (based on lib/tierAccess.js FEATURES)
INSERT INTO public.features (id, name, description, feature_type) VALUES
  -- Free tier features
  ('carSelector', 'Car Selector', 'Find and compare sports cars', 'boolean'),
  ('carDetailPages', 'Car Detail Pages', 'Full specs and buying guides', 'boolean'),
  ('basicGarage', 'Basic Garage', 'Save cars to your garage', 'boolean'),
  ('favorites', 'Favorites', 'Save favorite cars', 'boolean'),
  ('partsTeaser', 'Parts Preview', 'See top 3 popular parts', 'boolean'),
  ('lapTimesTeaser', 'Lap Times Preview', 'See top 2 lap times', 'boolean'),
  ('fuelEconomy', 'Fuel Economy', 'EPA fuel economy data', 'boolean'),
  ('safetyRatings', 'Safety Ratings', 'NHTSA and IIHS safety ratings', 'boolean'),
  ('priceByYear', 'Price by Year', 'Best value model years', 'boolean'),
  ('alBasic', 'AL Basic', '25 AI chats per month', 'metered'),
  ('eventsBrowse', 'Browse Events', 'Browse car events and meetups', 'boolean'),
  ('eventsMapView', 'Map View', 'View events on a map', 'boolean'),
  ('eventsSubmit', 'Submit Events', 'Submit new events for review', 'boolean'),
  -- Collector tier features
  ('vinDecode', 'VIN Decode', 'Decode your exact vehicle variant', 'boolean'),
  ('ownerReference', 'Owner Reference', 'Maintenance specs for your car', 'boolean'),
  ('serviceLog', 'Service Log', 'Track your maintenance history', 'boolean'),
  ('serviceReminders', 'Service Reminders', 'Get notified when service is due', 'boolean'),
  ('recallAlerts', 'Recall Alerts', 'Active recalls for YOUR VIN', 'boolean'),
  ('safetyData', 'Your Safety Data', 'Recalls and complaints for your VIN', 'boolean'),
  ('marketValue', 'Market Value', 'Track what your car is worth', 'boolean'),
  ('priceHistory', 'Price History', 'Historical price trends', 'boolean'),
  ('fullCompare', 'Full Compare', 'Side-by-side comparison tool', 'boolean'),
  ('collections', 'Collections', 'Organize cars into collections', 'boolean'),
  ('exportData', 'Export Data', 'Export your garage data', 'boolean'),
  ('alCollector', 'AL Enthusiast', '75 AI chats per month', 'metered'),
  ('eventsCalendarView', 'Calendar View', 'Monthly calendar view of events', 'boolean'),
  ('eventsSave', 'Save Events', 'Bookmark events for later', 'boolean'),
  ('eventsCalendarExport', 'Calendar Export', 'Add events to your calendar', 'boolean'),
  ('eventsForMyCars', 'Events for My Cars', 'Filter events by your garage vehicles', 'boolean'),
  -- Tuner tier features
  ('dynoDatabase', 'Dyno Database', 'Real HP/torque from actual cars', 'boolean'),
  ('fullLapTimes', 'Lap Times Library', 'Complete track benchmark data', 'boolean'),
  ('fullPartsCatalog', 'Parts Catalog', 'Full parts database with pricing', 'boolean'),
  ('buildProjects', 'Build Projects', 'Save and organize build plans', 'boolean'),
  ('buildAnalytics', 'Build Analytics', 'Cost projections and HP gains', 'boolean'),
  ('partsCompatibility', 'Parts Compatibility', 'Check what works together', 'boolean'),
  ('modImpactAnalysis', 'Mod Impact', 'Before/after performance data', 'boolean'),
  ('pdfExport', 'PDF Export', 'Export builds as PDF', 'boolean'),
  ('earlyAccess', 'Early Access', 'First access to new features', 'boolean'),
  ('installTracking', 'Install Tracking', 'Track installation progress', 'boolean'),
  ('alTuner', 'AL Tuner', '150 AI chats per month', 'metered')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  feature_type = EXCLUDED.feature_type;

-- Insert plan entitlements (which features each plan has)
-- Free plan entitlements
INSERT INTO public.plan_entitlements (plan_id, feature_id, value, limit_value) VALUES
  ('free', 'carSelector', 'true', NULL),
  ('free', 'carDetailPages', 'true', NULL),
  ('free', 'basicGarage', 'true', NULL),
  ('free', 'favorites', 'true', NULL),
  ('free', 'partsTeaser', 'true', NULL),
  ('free', 'lapTimesTeaser', 'true', NULL),
  ('free', 'fuelEconomy', 'true', NULL),
  ('free', 'safetyRatings', 'true', NULL),
  ('free', 'priceByYear', 'true', NULL),
  ('free', 'alBasic', 'true', 25),
  ('free', 'eventsBrowse', 'true', NULL),
  ('free', 'eventsMapView', 'true', NULL),
  ('free', 'eventsSubmit', 'true', NULL)
ON CONFLICT (plan_id, feature_id) DO UPDATE SET
  value = EXCLUDED.value,
  limit_value = EXCLUDED.limit_value;

-- Collector plan entitlements (includes all free features + collector features)
INSERT INTO public.plan_entitlements (plan_id, feature_id, value, limit_value) VALUES
  -- Free features
  ('collector', 'carSelector', 'true', NULL),
  ('collector', 'carDetailPages', 'true', NULL),
  ('collector', 'basicGarage', 'true', NULL),
  ('collector', 'favorites', 'true', NULL),
  ('collector', 'partsTeaser', 'true', NULL),
  ('collector', 'lapTimesTeaser', 'true', NULL),
  ('collector', 'fuelEconomy', 'true', NULL),
  ('collector', 'safetyRatings', 'true', NULL),
  ('collector', 'priceByYear', 'true', NULL),
  ('collector', 'eventsBrowse', 'true', NULL),
  ('collector', 'eventsMapView', 'true', NULL),
  ('collector', 'eventsSubmit', 'true', NULL),
  -- Collector features
  ('collector', 'vinDecode', 'true', NULL),
  ('collector', 'ownerReference', 'true', NULL),
  ('collector', 'serviceLog', 'true', NULL),
  ('collector', 'serviceReminders', 'true', NULL),
  ('collector', 'recallAlerts', 'true', NULL),
  ('collector', 'safetyData', 'true', NULL),
  ('collector', 'marketValue', 'true', NULL),
  ('collector', 'priceHistory', 'true', NULL),
  ('collector', 'fullCompare', 'true', NULL),
  ('collector', 'collections', 'true', NULL),
  ('collector', 'exportData', 'true', NULL),
  ('collector', 'alCollector', 'true', 75),
  ('collector', 'eventsCalendarView', 'true', NULL),
  ('collector', 'eventsSave', 'true', NULL),
  ('collector', 'eventsCalendarExport', 'true', NULL),
  ('collector', 'eventsForMyCars', 'true', NULL)
ON CONFLICT (plan_id, feature_id) DO UPDATE SET
  value = EXCLUDED.value,
  limit_value = EXCLUDED.limit_value;

-- Tuner plan entitlements (includes all collector features + tuner features)
INSERT INTO public.plan_entitlements (plan_id, feature_id, value, limit_value) VALUES
  -- Free features
  ('tuner', 'carSelector', 'true', NULL),
  ('tuner', 'carDetailPages', 'true', NULL),
  ('tuner', 'basicGarage', 'true', NULL),
  ('tuner', 'favorites', 'true', NULL),
  ('tuner', 'partsTeaser', 'true', NULL),
  ('tuner', 'lapTimesTeaser', 'true', NULL),
  ('tuner', 'fuelEconomy', 'true', NULL),
  ('tuner', 'safetyRatings', 'true', NULL),
  ('tuner', 'priceByYear', 'true', NULL),
  ('tuner', 'eventsBrowse', 'true', NULL),
  ('tuner', 'eventsMapView', 'true', NULL),
  ('tuner', 'eventsSubmit', 'true', NULL),
  -- Collector features
  ('tuner', 'vinDecode', 'true', NULL),
  ('tuner', 'ownerReference', 'true', NULL),
  ('tuner', 'serviceLog', 'true', NULL),
  ('tuner', 'serviceReminders', 'true', NULL),
  ('tuner', 'recallAlerts', 'true', NULL),
  ('tuner', 'safetyData', 'true', NULL),
  ('tuner', 'marketValue', 'true', NULL),
  ('tuner', 'priceHistory', 'true', NULL),
  ('tuner', 'fullCompare', 'true', NULL),
  ('tuner', 'collections', 'true', NULL),
  ('tuner', 'exportData', 'true', NULL),
  ('tuner', 'eventsCalendarView', 'true', NULL),
  ('tuner', 'eventsSave', 'true', NULL),
  ('tuner', 'eventsCalendarExport', 'true', NULL),
  ('tuner', 'eventsForMyCars', 'true', NULL),
  -- Tuner features
  ('tuner', 'dynoDatabase', 'true', NULL),
  ('tuner', 'fullLapTimes', 'true', NULL),
  ('tuner', 'fullPartsCatalog', 'true', NULL),
  ('tuner', 'buildProjects', 'true', NULL),
  ('tuner', 'buildAnalytics', 'true', NULL),
  ('tuner', 'partsCompatibility', 'true', NULL),
  ('tuner', 'modImpactAnalysis', 'true', NULL),
  ('tuner', 'pdfExport', 'true', NULL),
  ('tuner', 'earlyAccess', 'true', NULL),
  ('tuner', 'installTracking', 'true', NULL),
  ('tuner', 'alTuner', 'true', 150)
ON CONFLICT (plan_id, feature_id) DO UPDATE SET
  value = EXCLUDED.value,
  limit_value = EXCLUDED.limit_value;

-- ============================================================================
-- TRIGGERS FOR updated_at
-- ============================================================================

-- Customers
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION update_customers_updated_at();

-- Products  
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_customers_updated_at();

-- Prices
CREATE TRIGGER prices_updated_at
  BEFORE UPDATE ON public.prices
  FOR EACH ROW EXECUTE FUNCTION update_customers_updated_at();

-- Subscriptions
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_customers_updated_at();

-- Plans
CREATE TRIGGER plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION update_customers_updated_at();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Allow service role full access for webhooks
GRANT ALL ON public.customers TO service_role;
GRANT ALL ON public.products TO service_role;
GRANT ALL ON public.prices TO service_role;
GRANT ALL ON public.subscriptions TO service_role;
GRANT ALL ON public.plans TO service_role;
GRANT ALL ON public.features TO service_role;
GRANT ALL ON public.plan_entitlements TO service_role;
GRANT ALL ON public.trial_history TO service_role;
GRANT ALL ON public.subscription_metrics TO service_role;

-- Allow authenticated users to read
GRANT SELECT ON public.customers TO authenticated;
GRANT SELECT ON public.products TO authenticated;
GRANT SELECT ON public.prices TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT ON public.plans TO authenticated;
GRANT SELECT ON public.features TO authenticated;
GRANT SELECT ON public.plan_entitlements TO authenticated;
GRANT SELECT ON public.trial_history TO authenticated;

-- Allow anon users to read public tables (products, prices, plans, features)
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.prices TO anon;
GRANT SELECT ON public.plans TO anon;
GRANT SELECT ON public.features TO anon;
GRANT SELECT ON public.plan_entitlements TO anon;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.get_user_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_feature_access(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_plan_id(UUID) TO authenticated;
