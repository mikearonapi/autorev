-- Create EventbriteSearch source (public search scraping) if it doesn't exist.
-- This enables city-by-city backfill for top-500 coverage without requiring Eventbrite API org tokens.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM event_sources WHERE name = 'EventbriteSearch'
  ) THEN
    INSERT INTO event_sources (name, source_type, base_url, scrape_config, is_active)
    VALUES (
      'EventbriteSearch',
      'scrape',
      'https://www.eventbrite.com',
      jsonb_build_object(
        'maxPagesPerQuery', 2,
        'maxEventUrlsPerQuery', 20,
        'perEventDelayMs', 600,
        'perPageDelayMs', 600,
        'queries', jsonb_build_array(
          jsonb_build_object('q','cars and coffee','target_event_type_slug','cars-and-coffee'),
          jsonb_build_object('q','car meet','target_event_type_slug','cars-and-coffee'),
          jsonb_build_object('q','car show','target_event_type_slug','car-show'),
          jsonb_build_object('q','autocross','target_event_type_slug','autocross'),
          jsonb_build_object('q','track day','target_event_type_slug','track-day'),
          jsonb_build_object('q','time attack','target_event_type_slug','time-attack')
        )
      ),
      true
    );
  END IF;
END $$;















