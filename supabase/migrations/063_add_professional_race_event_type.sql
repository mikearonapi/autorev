-- Migration: Add Professional Race / Spectator Event type
-- This category is for events like IMSA, WEC, WRC, FIA, IndyCar, F1, Formula E, NASCAR
-- where attendees are spectators rather than participants

-- Insert the new event type
INSERT INTO event_types (slug, name, description, icon, sort_order, is_track_event) 
VALUES (
  'professional-race',
  'Professional Race',
  'Professional motorsport events including IMSA, WEC, F1, IndyCar, NASCAR, and more. Spectator events.',
  '🏆',
  7,
  false  -- Not a track event for participants - it's a spectator event
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  is_track_event = EXCLUDED.is_track_event;

-- Update the existing track-day type description to clarify it's for participants
UPDATE event_types 
SET description = 'High Performance Driver Education, open lapping - participant track events'
WHERE slug = 'track-day';

-- Update any events that are professional races but currently marked as track-day
-- Common professional race keywords
UPDATE events 
SET event_type_id = (SELECT id FROM event_types WHERE slug = 'professional-race')
WHERE event_type_id = (SELECT id FROM event_types WHERE slug = 'track-day')
  AND (
    LOWER(name) LIKE '%rolex%' OR
    LOWER(name) LIKE '%imsa%' OR
    LOWER(name) LIKE '%wec%' OR
    LOWER(name) LIKE '%formula 1%' OR
    LOWER(name) LIKE '%f1 %' OR
    LOWER(name) LIKE '%indycar%' OR
    LOWER(name) LIKE '%indy 500%' OR
    LOWER(name) LIKE '%nascar%' OR
    LOWER(name) LIKE '%formula e%' OR
    LOWER(name) LIKE '%le mans%' OR
    LOWER(name) LIKE '%24 hours%' OR
    LOWER(name) LIKE '%12 hours%' OR
    LOWER(name) LIKE '%grand prix%' OR
    LOWER(name) LIKE '%gt world challenge%' OR
    LOWER(name) LIKE '%sro %' OR
    LOWER(name) LIKE '%pirelli world challenge%' OR
    LOWER(name) LIKE '%rally america%' OR
    LOWER(name) LIKE '%wrc %' OR
    LOWER(name) LIKE '%world rally%'
  );

