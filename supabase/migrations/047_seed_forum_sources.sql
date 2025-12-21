-- ============================================================================
-- SEED FORUM SOURCES
-- AutoRev - Initial forum configuration data
--
-- Seeds 6 priority automotive forums:
--   1. Rennlist (Porsche) - Priority 10
--   2. Bimmerpost (BMW M) - Priority 9
--   3. Miata.net (Mazda) - Priority 8
--   4. FT86Club (Toyota/Subaru) - Priority 8
--   5. CorvetteForum (Chevrolet) - Priority 7
--   6. VWVortex (VW/Audi) - Priority 7
-- ============================================================================

INSERT INTO forum_sources (slug, name, base_url, car_brands, car_slugs, scrape_config, is_active, priority)
VALUES 
    -- Rennlist (Porsche)
    (
      'rennlist',
      'Rennlist',
      'https://rennlist.com/forums',
      ARRAY['Porsche'],
      ARRAY['718-cayman-gt4','718-cayman-gts-4','987-2-cayman-s','981-cayman-s','981-cayman-gts','996-gt3','997-1-gt3','997-2-gt3','991-1-gt3','997-1-carrera-s','997-2-carrera-s','991-1-carrera-s'],
      '{
        "requiresAuth": false,
        "rateLimitMs": 2500,
        "maxPagesPerRun": 30,
        "subforums": {
          "/forums/987-forum.702/": ["987-2-cayman-s"],
          "/forums/981-forum.908/": ["981-cayman-s", "981-cayman-gts"],
          "/forums/718-forum.1054/": ["718-cayman-gt4", "718-cayman-gts-4"],
          "/forums/996-forum.702/": ["996-gt3"],
          "/forums/997-forum.754/": ["997-1-carrera-s", "997-2-carrera-s", "997-1-gt3", "997-2-gt3"],
          "/forums/991-forum.908/": ["991-1-carrera-s", "991-1-gt3"]
        },
        "threadListSelectors": {
          "threadContainer": ".structItemContainer",
          "thread": ".structItem--thread",
          "title": ".structItem-title a",
          "url": ".structItem-title a@href",
          "replies": ".structItem-cell--meta dd:first-child",
          "views": ".structItem-cell--meta dd:last-child",
          "lastPostDate": ".structItem-latestDate",
          "isSticky": ".structItem-status--sticky"
        },
        "threadContentSelectors": {
          "post": ".message--post",
          "postId": "@data-content",
          "author": ".message-name a",
          "authorJoinDate": ".message-userExtras dt:contains(\"Joined\") + dd",
          "authorPostCount": ".message-userExtras dt:contains(\"Messages\") + dd",
          "date": ".message-date time@datetime",
          "content": ".message-body .bbWrapper",
          "postNumber": ".message-attribution-opposite a"
        },
        "threadFilters": {
          "titleInclude": ["DIY", "how to", "guide", "PPI", "pre-purchase", "100k", "150k", "200k", "long term", "ownership", "track", "HPDE", "DE", "autocross", "failure", "failed", "problem", "issue", "fix", "IMS", "bore score", "RMS", "AOS", "mod", "upgrade", "install", "build", "cost", "price", "paid", "invoice", "maintenance", "service", "interval"],
          "titleExclude": ["WTB", "WTS", "FS:", "FOR SALE", "SOLD", "price check", "PC:", "value", "shipping", "group buy", "GB:", "wanted", "looking for"],
          "minReplies": 5,
          "minViews": 500
        },
        "pagination": {"paramName": "page", "maxPages": 20}
      }'::jsonb,
      true,
      10
    ),
    
    -- Bimmerpost (BMW)
    (
      'bimmerpost',
      'Bimmerpost',
      'https://f87.bimmerpost.com/forums',
      ARRAY['BMW'],
      ARRAY['bmw-m2-f87','bmw-m2-competition','bmw-m240i'],
      '{
        "requiresAuth": false,
        "rateLimitMs": 2000,
        "maxPagesPerRun": 30,
        "subforums": {
          "/forums/f87-m2-general-forum.566/": ["bmw-m2-f87", "bmw-m2-competition"],
          "/forums/f87-m2-technical-mechanical.569/": ["bmw-m2-f87", "bmw-m2-competition"],
          "/forums/f87-m2-track.571/": ["bmw-m2-f87", "bmw-m2-competition"]
        },
        "threadListSelectors": {
          "threadContainer": "#threads",
          "thread": ".threadbit",
          "title": ".title a",
          "url": ".title a@href",
          "replies": ".replies a",
          "views": ".views",
          "lastPostDate": ".lastpostdate",
          "isSticky": ".sticky"
        },
        "threadContentSelectors": {
          "post": ".postcontainer",
          "postId": "@id",
          "author": ".username",
          "date": ".postdate",
          "content": ".postcontent",
          "postNumber": ".postcounter"
        },
        "threadFilters": {
          "titleInclude": ["DIY", "how to", "guide", "install", "long term", "ownership", "10k", "20k", "50k", "track", "HPDE", "problem", "issue", "failure", "fault", "crank hub", "rod bearing", "DCT", "tune", "JB4", "MHD", "BM3", "cost", "paid", "dealer"],
          "titleExclude": ["WTB", "WTS", "FS:", "FOR SALE", "group buy", "GB"],
          "minReplies": 5,
          "minViews": 1000
        },
        "pagination": {"paramName": "page", "maxPages": 15}
      }'::jsonb,
      true,
      9
    ),
    
    -- Miata.net (Mazda)
    (
      'miata-net',
      'Miata.net',
      'https://forum.miata.net',
      ARRAY['Mazda'],
      ARRAY['mazda-mx5-miata-na','mazda-mx5-miata-nb','mazda-mx5-miata-nc','mazda-mx5-miata-nd'],
      '{
        "requiresAuth": false,
        "rateLimitMs": 2000,
        "maxPagesPerRun": 30,
        "subforums": {
          "/forums/na-nb-general-discussion.5/": ["mazda-mx5-miata-na", "mazda-mx5-miata-nb"],
          "/forums/nc-general-discussion.44/": ["mazda-mx5-miata-nc"],
          "/forums/nd-general-discussion.99/": ["mazda-mx5-miata-nd"],
          "/forums/garage-and-diy.10/": ["mazda-mx5-miata-na", "mazda-mx5-miata-nb", "mazda-mx5-miata-nc", "mazda-mx5-miata-nd"],
          "/forums/track-day-and-autocross.12/": ["mazda-mx5-miata-na", "mazda-mx5-miata-nb", "mazda-mx5-miata-nc", "mazda-mx5-miata-nd"]
        },
        "threadListSelectors": {
          "threadContainer": ".structItemContainer",
          "thread": ".structItem--thread",
          "title": ".structItem-title a",
          "url": ".structItem-title a@href",
          "replies": ".pairs--justified dd",
          "lastPostDate": ".structItem-latestDate time@datetime",
          "isSticky": ".structItem-status--sticky"
        },
        "threadContentSelectors": {
          "post": ".message--post",
          "author": ".message-name a",
          "date": ".message-date time@datetime",
          "content": ".message-body .bbWrapper",
          "postNumber": ".message-attribution-opposite a"
        },
        "threadFilters": {
          "titleInclude": ["DIY", "how to", "guide", "long term", "100k", "200k", "300k", "track", "autocross", "spec miata", "failure", "problem", "issue", "turbo", "supercharged", "boost", "suspension", "coilover", "maintenance", "service"],
          "titleExclude": ["WTB", "WTS", "FS:", "FOR SALE", "price check"],
          "minReplies": 3,
          "minViews": 300
        },
        "pagination": {"paramName": "page", "maxPages": 20}
      }'::jsonb,
      true,
      8
    ),
    
    -- FT86Club (Toyota/Subaru/Scion)
    (
      'ft86club',
      'FT86Club',
      'https://www.ft86club.com/forums',
      ARRAY['Toyota','Subaru','Scion'],
      ARRAY['toyota-gr86','subaru-brz-zd8','toyota-86-scion-frs','subaru-brz-zc6'],
      '{
        "requiresAuth": false,
        "rateLimitMs": 2000,
        "maxPagesPerRun": 30,
        "subforums": {
          "/forums/brz-86-gt86-frs-general.33/": ["toyota-gr86", "subaru-brz-zd8", "toyota-86-scion-frs", "subaru-brz-zc6"],
          "/forums/brz-86-gt86-frs-tech.35/": ["toyota-gr86", "subaru-brz-zd8", "toyota-86-scion-frs", "subaru-brz-zc6"],
          "/forums/suspension-handling.41/": ["toyota-gr86", "subaru-brz-zd8", "toyota-86-scion-frs", "subaru-brz-zc6"],
          "/forums/forced-induction.47/": ["toyota-gr86", "subaru-brz-zd8", "toyota-86-scion-frs", "subaru-brz-zc6"]
        },
        "threadListSelectors": {
          "threadContainer": "#threads",
          "thread": ".threadbit",
          "title": ".title a",
          "url": ".title a@href",
          "replies": ".replies",
          "views": ".views",
          "isSticky": ".sticky"
        },
        "threadContentSelectors": {
          "post": ".postcontainer",
          "author": ".username",
          "date": ".postdate",
          "content": ".postcontent",
          "postNumber": ".postcounter"
        },
        "threadFilters": {
          "titleInclude": ["DIY", "how to", "install", "long term", "ownership", "50k", "100k", "track", "autocross", "HPDE", "valve spring", "recall", "issue", "problem", "turbo", "supercharger", "header", "tune", "ecutek", "oft", "suspension", "coilover", "alignment"],
          "titleExclude": ["WTB", "WTS", "FS:", "FOR SALE"],
          "minReplies": 5,
          "minViews": 500
        },
        "pagination": {"paramName": "page", "maxPages": 15}
      }'::jsonb,
      true,
      8
    ),
    
    -- CorvetteForum (Chevrolet)
    (
      'corvetteforum',
      'CorvetteForum',
      'https://www.corvetteforum.com/forums',
      ARRAY['Chevrolet'],
      ARRAY['c8-corvette-stingray','c7-corvette-stingray','c7-corvette-grand-sport','c7-corvette-z06','c6-corvette-z06','c5-corvette-z06'],
      '{
        "requiresAuth": false,
        "rateLimitMs": 2500,
        "maxPagesPerRun": 25,
        "subforums": {
          "/forums/c8-general-discussion.622/": ["c8-corvette-stingray"],
          "/forums/c7-general-discussion.299/": ["c7-corvette-stingray", "c7-corvette-grand-sport", "c7-corvette-z06"],
          "/forums/c6-corvette-general-discussion.8/": ["c6-corvette-z06"],
          "/forums/c5-corvette-general-discussion.3/": ["c5-corvette-z06"]
        },
        "threadListSelectors": {
          "threadContainer": ".structItemContainer",
          "thread": ".structItem--thread",
          "title": ".structItem-title a",
          "url": ".structItem-title a@href",
          "replies": ".pairs--justified dd",
          "lastPostDate": ".structItem-latestDate time@datetime",
          "isSticky": ".structItem-status--sticky"
        },
        "threadContentSelectors": {
          "post": ".message--post",
          "author": ".message-name a",
          "date": ".message-date time@datetime",
          "content": ".message-body .bbWrapper",
          "postNumber": ".message-attribution-opposite a"
        },
        "threadFilters": {
          "titleInclude": ["DIY", "how to", "guide", "long term", "ownership", "50k", "100k", "track", "HPDE", "autocross", "lifter", "AFM", "DOD", "valve spring", "problem", "issue", "failure", "heads", "cam", "tune", "procharger"],
          "titleExclude": ["WTB", "WTS", "FS:", "FOR SALE"],
          "minReplies": 5,
          "minViews": 500
        },
        "pagination": {"paramName": "page", "maxPages": 15}
      }'::jsonb,
      true,
      7
    ),
    
    -- VWVortex (VW/Audi)
    (
      'vwvortex',
      'VWVortex',
      'https://www.vwvortex.com/forums',
      ARRAY['Volkswagen','Audi'],
      ARRAY['volkswagen-gti-mk7','volkswagen-gti-mk8','volkswagen-golf-r-mk7','volkswagen-golf-r-mk8','audi-rs3-8v','audi-rs3-8y','audi-tt-rs-8s'],
      '{
        "requiresAuth": false,
        "rateLimitMs": 2000,
        "maxPagesPerRun": 25,
        "subforums": {
          "/forums/golf-gti-mk7.224/": ["volkswagen-gti-mk7", "volkswagen-golf-r-mk7"],
          "/forums/golf-gti-mk8.260/": ["volkswagen-gti-mk8", "volkswagen-golf-r-mk8"],
          "/forums/audi-a3-s3-rs3.254/": ["audi-rs3-8v", "audi-rs3-8y"]
        },
        "threadListSelectors": {
          "threadContainer": ".structItemContainer",
          "thread": ".structItem--thread",
          "title": ".structItem-title a",
          "url": ".structItem-title a@href",
          "replies": ".pairs--justified dd",
          "lastPostDate": ".structItem-latestDate",
          "isSticky": ".structItem-status--sticky"
        },
        "threadContentSelectors": {
          "post": ".message--post",
          "author": ".message-name a",
          "date": ".message-date time@datetime",
          "content": ".message-body .bbWrapper",
          "postNumber": ".message-attribution-opposite a"
        },
        "threadFilters": {
          "titleInclude": ["DIY", "how to", "guide", "install", "long term", "ownership", "50k", "100k", "track", "HPDE", "autocross", "carbon buildup", "intake valve", "HPFP", "turbo", "stage 1", "stage 2", "is38", "big turbo", "DSG", "tune", "APR", "Unitronic", "IE"],
          "titleExclude": ["WTB", "WTS", "FS:", "FOR SALE", "group buy"],
          "minReplies": 5,
          "minViews": 500
        },
        "pagination": {"paramName": "page", "maxPages": 15}
      }'::jsonb,
      true,
      7
    )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  base_url = EXCLUDED.base_url,
  car_brands = EXCLUDED.car_brands,
  car_slugs = EXCLUDED.car_slugs,
  scrape_config = EXCLUDED.scrape_config,
  priority = EXCLUDED.priority,
  updated_at = now();

-- Verify seeding
DO $$
DECLARE
  forum_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO forum_count FROM forum_sources WHERE is_active = true;
  RAISE NOTICE 'Seeded % active forum sources', forum_count;
END $$;














