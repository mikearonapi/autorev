-- Migration: P1 Add Missing Timestamp Triggers
-- Date: January 12, 2026
-- Purpose: Add auto-update triggers for updated_at columns on tables missing them

-- Ensure the trigger function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ADD TRIGGERS TO TABLES MISSING updated_at AUTO-UPDATE
-- ============================================================================

-- Analytics & Tracking
DROP TRIGGER IF EXISTS set_updated_at ON analytics_goals;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON analytics_goals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON application_errors;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON application_errors
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Content Pipeline
DROP TRIGGER IF EXISTS set_updated_at ON article_pipeline;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON article_pipeline
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Financial System
DROP TRIGGER IF EXISTS set_updated_at ON balance_sheet_snapshots;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON balance_sheet_snapshots
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON bank_reconciliations;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON bank_reconciliations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON cash_flow_summary;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON cash_flow_summary
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON cost_entries;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON cost_entries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON fiscal_periods;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON fiscal_periods
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON gl_accounts;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON gl_accounts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON journal_entries;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON journal_entries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON monthly_financial_reports;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON monthly_financial_reports
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON monthly_financials;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON monthly_financials
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON service_rates;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON service_rates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Image Library
DROP TRIGGER IF EXISTS set_updated_at ON brand_logos;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON brand_logos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON car_images;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON car_images
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Community & Insights
DROP TRIGGER IF EXISTS set_updated_at ON community_insights;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON community_insights
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Email System
DROP TRIGGER IF EXISTS set_updated_at ON email_templates;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON email_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Events
DROP TRIGGER IF EXISTS set_updated_at ON event_series;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON event_series
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Experiments
DROP TRIGGER IF EXISTS set_updated_at ON experiments;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON experiments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Featured Content
DROP TRIGGER IF EXISTS set_updated_at ON featured_content_channels;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON featured_content_channels
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Forum
DROP TRIGGER IF EXISTS set_updated_at ON forum_sources;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON forum_sources
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Geocoding
DROP TRIGGER IF EXISTS set_updated_at ON geocode_cache;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON geocode_cache
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Engagement
DROP TRIGGER IF EXISTS set_updated_at ON page_engagement;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON page_engagement
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Event Coverage
DROP TRIGGER IF EXISTS set_updated_at ON target_cities;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON target_cities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User Data
DROP TRIGGER IF EXISTS set_updated_at ON user_attribution;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON user_attribution
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON user_lifecycle;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON user_lifecycle
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON user_service_logs;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON user_service_logs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Maintenance
DROP TRIGGER IF EXISTS set_updated_at ON vehicle_known_issues;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON vehicle_known_issues
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON vehicle_maintenance_specs;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON vehicle_maintenance_specs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
