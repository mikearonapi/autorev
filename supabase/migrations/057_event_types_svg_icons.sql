-- ============================================================================
-- Migration: 057_event_types_svg_icons.sql
-- Purpose: Update event_types.icon column to use slug-based identifiers
--          instead of emojis. The frontend now renders SVG icons based on slug.
-- ============================================================================

-- Update event_types to use slug-based identifiers instead of emoji icons
-- This ensures consistency across the system - icons are now rendered
-- by the frontend based on the event type slug via EventTypeIcon component
UPDATE event_types SET icon = slug WHERE slug IS NOT NULL;

-- ============================================================================
-- Done! The frontend now uses SVG icons rendered via components/icons/EventIcons.js
-- based on the event_type.slug value. The icon column is retained for potential
-- future use or direct database queries.
-- ============================================================================
