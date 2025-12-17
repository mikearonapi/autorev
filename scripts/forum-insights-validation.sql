-- ============================================================================
-- Forum Intelligence System - Validation Queries
-- ============================================================================
-- Run these queries against Supabase to validate data quality after scraping
-- and insight extraction runs.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1: Forum Sources Status
-- ─────────────────────────────────────────────────────────────────────────────

-- Check forum sources are seeded correctly
SELECT 
  slug,
  name,
  platform,
  is_active,
  priority,
  total_threads_scraped,
  total_insights_extracted,
  last_scraped_at
FROM forum_sources
ORDER BY priority DESC;

-- Forum sources health check
SELECT 
  COUNT(*) as total_forums,
  COUNT(*) FILTER (WHERE is_active) as active_forums,
  SUM(total_threads_scraped) as total_threads_all_forums,
  SUM(total_insights_extracted) as total_insights_all_forums,
  COUNT(*) FILTER (WHERE last_scraped_at IS NOT NULL) as forums_with_scrapes,
  MIN(last_scraped_at) as oldest_scrape,
  MAX(last_scraped_at) as newest_scrape
FROM forum_sources;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2: Scrape Run Analysis
-- ─────────────────────────────────────────────────────────────────────────────

-- Recent scrape runs with details
SELECT 
  fsr.id,
  fs.name as forum_name,
  fsr.run_type,
  fsr.status,
  fsr.threads_found,
  fsr.threads_scraped,
  fsr.posts_scraped,
  fsr.started_at,
  fsr.completed_at,
  EXTRACT(EPOCH FROM (fsr.completed_at - fsr.started_at))::int as duration_seconds,
  fsr.error_message
FROM forum_scrape_runs fsr
JOIN forum_sources fs ON fsr.forum_source_id = fs.id
ORDER BY fsr.started_at DESC
LIMIT 20;

-- Scrape run success rate by forum
SELECT 
  fs.name,
  COUNT(*) as total_runs,
  COUNT(*) FILTER (WHERE fsr.status = 'completed') as successful_runs,
  COUNT(*) FILTER (WHERE fsr.status = 'failed') as failed_runs,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE fsr.status = 'completed') / NULLIF(COUNT(*), 0),
    1
  ) as success_rate_pct,
  SUM(fsr.threads_scraped) as total_threads,
  SUM(fsr.posts_scraped) as total_posts
FROM forum_scrape_runs fsr
JOIN forum_sources fs ON fsr.forum_source_id = fs.id
GROUP BY fs.name
ORDER BY total_threads DESC;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3: Scraped Threads Analysis
-- ─────────────────────────────────────────────────────────────────────────────

-- Recent scraped threads
SELECT 
  fst.id,
  fs.name as forum_name,
  fst.thread_title,
  fst.thread_url,
  fst.subforum,
  fst.reply_count,
  fst.view_count,
  fst.relevance_score,
  fst.car_slugs_detected,
  fst.processing_status,
  fst.insights_extracted,
  fst.created_at
FROM forum_scraped_threads fst
JOIN forum_sources fs ON fst.forum_source_id = fs.id
ORDER BY fst.created_at DESC
LIMIT 20;

-- Thread quality distribution
SELECT 
  CASE 
    WHEN relevance_score >= 0.8 THEN 'Excellent (0.8+)'
    WHEN relevance_score >= 0.5 THEN 'Good (0.5-0.8)'
    WHEN relevance_score >= 0.3 THEN 'Fair (0.3-0.5)'
    ELSE 'Low (<0.3)'
  END as quality_tier,
  COUNT(*) as thread_count,
  ROUND(AVG(reply_count), 0) as avg_replies,
  ROUND(AVG(view_count), 0) as avg_views,
  ROUND(AVG(insights_extracted), 1) as avg_insights
FROM forum_scraped_threads
GROUP BY 
  CASE 
    WHEN relevance_score >= 0.8 THEN 'Excellent (0.8+)'
    WHEN relevance_score >= 0.5 THEN 'Good (0.5-0.8)'
    WHEN relevance_score >= 0.3 THEN 'Fair (0.3-0.5)'
    ELSE 'Low (<0.3)'
  END
ORDER BY quality_tier;

-- Processing status breakdown
SELECT 
  processing_status,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 1) as percentage
FROM forum_scraped_threads
GROUP BY processing_status
ORDER BY count DESC;

-- Check for duplicate threads (should return 0 rows)
SELECT 
  thread_url,
  COUNT(*) as occurrences
FROM forum_scraped_threads
GROUP BY thread_url
HAVING COUNT(*) > 1;

-- Car slug detection coverage
SELECT 
  CASE 
    WHEN cardinality(car_slugs_detected) = 0 THEN 'No cars detected'
    WHEN cardinality(car_slugs_detected) = 1 THEN '1 car detected'
    WHEN cardinality(car_slugs_detected) <= 3 THEN '2-3 cars detected'
    ELSE '4+ cars detected'
  END as car_detection,
  COUNT(*) as thread_count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 1) as percentage
FROM forum_scraped_threads
GROUP BY 
  CASE 
    WHEN cardinality(car_slugs_detected) = 0 THEN 'No cars detected'
    WHEN cardinality(car_slugs_detected) = 1 THEN '1 car detected'
    WHEN cardinality(car_slugs_detected) <= 3 THEN '2-3 cars detected'
    ELSE '4+ cars detected'
  END
ORDER BY thread_count DESC;

-- Threads by forum
SELECT 
  fs.name,
  COUNT(*) as thread_count,
  COUNT(*) FILTER (WHERE fst.relevance_score > 0.5) as high_quality_threads,
  ROUND(AVG(fst.relevance_score), 2) as avg_relevance,
  SUM(fst.insights_extracted) as total_insights
FROM forum_scraped_threads fst
JOIN forum_sources fs ON fst.forum_source_id = fs.id
GROUP BY fs.name
ORDER BY thread_count DESC;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 4: Community Insights Analysis
-- ─────────────────────────────────────────────────────────────────────────────

-- Recent insights
SELECT 
  ci.id,
  ci.insight_type,
  ci.title,
  ci.summary,
  ci.confidence,
  ci.consensus_strength,
  ci.source_count,
  ci.source_forum,
  ci.car_slug,
  ci.created_at
FROM community_insights ci
WHERE ci.is_active = true
ORDER BY ci.created_at DESC
LIMIT 20;

-- Insight type distribution
SELECT 
  insight_type,
  COUNT(*) as count,
  ROUND(AVG(confidence), 2) as avg_confidence,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 1) as percentage
FROM community_insights
WHERE is_active = true
GROUP BY insight_type
ORDER BY count DESC;

-- Confidence score distribution (should NOT be uniformly high)
SELECT 
  CASE 
    WHEN confidence >= 0.9 THEN 'High (0.9+)'
    WHEN confidence >= 0.7 THEN 'Medium-High (0.7-0.9)'
    WHEN confidence >= 0.5 THEN 'Medium (0.5-0.7)'
    ELSE 'Low (<0.5)'
  END as confidence_tier,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 1) as percentage
FROM community_insights
WHERE is_active = true
GROUP BY 
  CASE 
    WHEN confidence >= 0.9 THEN 'High (0.9+)'
    WHEN confidence >= 0.7 THEN 'Medium-High (0.7-0.9)'
    WHEN confidence >= 0.5 THEN 'Medium (0.5-0.7)'
    ELSE 'Low (<0.5)'
  END
ORDER BY confidence_tier;

-- Insights by car slug (which cars have the most community knowledge?)
SELECT 
  car_slug,
  COUNT(*) as insight_count,
  array_agg(DISTINCT insight_type) as insight_types,
  ROUND(AVG(confidence), 2) as avg_confidence
FROM community_insights
WHERE is_active = true AND car_slug != 'generic'
GROUP BY car_slug
ORDER BY insight_count DESC
LIMIT 20;

-- Insights by source forum
SELECT 
  source_forum,
  COUNT(*) as insight_count,
  ROUND(AVG(confidence), 2) as avg_confidence,
  array_agg(DISTINCT insight_type) as insight_types
FROM community_insights
WHERE is_active = true
GROUP BY source_forum
ORDER BY insight_count DESC;

-- Insight quality check (title/summary length)
SELECT 
  insight_type,
  ROUND(AVG(LENGTH(title)), 0) as avg_title_length,
  ROUND(AVG(LENGTH(summary)), 0) as avg_summary_length,
  COUNT(*) FILTER (WHERE LENGTH(title) < 20) as short_titles,
  COUNT(*) FILTER (WHERE LENGTH(summary) < 50) as short_summaries
FROM community_insights
WHERE is_active = true
GROUP BY insight_type
ORDER BY insight_type;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 5: Source Citation Verification
-- ─────────────────────────────────────────────────────────────────────────────

-- Verify insights are properly linked to source threads
SELECT 
  ci.title as insight_title,
  ci.insight_type,
  cis.thread_url,
  cis.forum_slug,
  cis.relevance_score,
  fst.thread_title
FROM community_insights ci
JOIN community_insight_sources cis ON ci.id = cis.insight_id
JOIN forum_scraped_threads fst ON cis.thread_id = fst.id
ORDER BY ci.created_at DESC
LIMIT 20;

-- Insights without source citations (should be 0)
SELECT ci.*
FROM community_insights ci
LEFT JOIN community_insight_sources cis ON ci.id = cis.insight_id
WHERE cis.id IS NULL;

-- Source citation coverage
SELECT 
  ci.id,
  ci.title,
  ci.source_count,
  COUNT(cis.id) as actual_sources,
  CASE 
    WHEN ci.source_count = COUNT(cis.id) THEN 'OK'
    ELSE 'MISMATCH'
  END as status
FROM community_insights ci
LEFT JOIN community_insight_sources cis ON ci.id = cis.insight_id
GROUP BY ci.id, ci.title, ci.source_count
HAVING ci.source_count != COUNT(cis.id)
ORDER BY ci.created_at DESC;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 6: Overall Statistics Dashboard
-- ─────────────────────────────────────────────────────────────────────────────

-- Complete stats summary
WITH stats AS (
  SELECT
    (SELECT COUNT(*) FROM forum_sources WHERE is_active) as active_forums,
    (SELECT COUNT(*) FROM forum_scrape_runs) as total_scrape_runs,
    (SELECT COUNT(*) FROM forum_scrape_runs WHERE status = 'completed') as successful_runs,
    (SELECT COUNT(*) FROM forum_scraped_threads) as total_threads,
    (SELECT COUNT(*) FROM forum_scraped_threads WHERE relevance_score > 0.5) as quality_threads,
    (SELECT ROUND(AVG(relevance_score), 2) FROM forum_scraped_threads) as avg_thread_relevance,
    (SELECT COUNT(*) FROM forum_scraped_threads WHERE cardinality(car_slugs_detected) > 0) as threads_with_cars,
    (SELECT COUNT(*) FROM community_insights WHERE is_active) as total_insights,
    (SELECT ROUND(AVG(confidence), 2) FROM community_insights WHERE is_active) as avg_insight_confidence,
    (SELECT COUNT(DISTINCT car_slug) FROM community_insights WHERE is_active AND car_slug != 'generic') as cars_with_insights
)
SELECT 
  active_forums,
  total_scrape_runs,
  successful_runs,
  ROUND(100.0 * successful_runs / NULLIF(total_scrape_runs, 0), 1) as scrape_success_rate,
  total_threads,
  quality_threads,
  avg_thread_relevance,
  ROUND(100.0 * threads_with_cars / NULLIF(total_threads, 0), 1) as car_detection_rate,
  total_insights,
  avg_insight_confidence,
  cars_with_insights,
  ROUND(total_insights::numeric / NULLIF(total_threads, 0), 2) as insights_per_thread
FROM stats;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 7: Acceptance Criteria Validation
-- ─────────────────────────────────────────────────────────────────────────────

-- Check: forum_scraped_threads has 100+ rows with quality_score > 0.5
SELECT 
  CASE 
    WHEN COUNT(*) >= 100 THEN '✓ PASS'
    ELSE '✗ FAIL: ' || COUNT(*) || '/100'
  END as "100+ quality threads (relevance > 0.5)"
FROM forum_scraped_threads
WHERE relevance_score > 0.5;

-- Check: community_insights has 30+ rows with varied insight_types
SELECT 
  CASE 
    WHEN COUNT(*) >= 30 THEN '✓ PASS'
    ELSE '✗ FAIL: ' || COUNT(*) || '/30'
  END as "30+ insights",
  CASE 
    WHEN COUNT(DISTINCT insight_type) >= 3 THEN '✓ PASS'
    ELSE '✗ FAIL: only ' || COUNT(DISTINCT insight_type) || ' types'
  END as "Varied insight types (3+)"
FROM community_insights
WHERE is_active;

-- Check: car_slugs_detected populated for >80% of threads
SELECT 
  CASE 
    WHEN ROUND(100.0 * COUNT(*) FILTER (WHERE cardinality(car_slugs_detected) > 0) / NULLIF(COUNT(*), 0), 1) >= 80 
    THEN '✓ PASS'
    ELSE '✗ FAIL: ' || ROUND(100.0 * COUNT(*) FILTER (WHERE cardinality(car_slugs_detected) > 0) / NULLIF(COUNT(*), 0), 1) || '%'
  END as "Car slugs detected (>80%)"
FROM forum_scraped_threads;

-- Check: No duplicate threads
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS'
    ELSE '✗ FAIL: ' || COUNT(*) || ' duplicate URLs'
  END as "No duplicate threads"
FROM (
  SELECT thread_url
  FROM forum_scraped_threads
  GROUP BY thread_url
  HAVING COUNT(*) > 1
) dups;

-- Check: At least 3 forums successfully scraped
SELECT 
  CASE 
    WHEN COUNT(DISTINCT fs.slug) >= 3 THEN '✓ PASS'
    ELSE '✗ FAIL: only ' || COUNT(DISTINCT fs.slug) || ' forums scraped'
  END as "3+ forums scraped"
FROM forum_scraped_threads fst
JOIN forum_sources fs ON fst.forum_source_id = fs.id;

-- Final acceptance criteria summary
SELECT * FROM (
  SELECT 1 as seq, 'Quality threads (100+, relevance>0.5)' as criterion,
    CASE WHEN (SELECT COUNT(*) FROM forum_scraped_threads WHERE relevance_score > 0.5) >= 100 THEN '✓ PASS' ELSE '✗ FAIL' END as status,
    (SELECT COUNT(*) FROM forum_scraped_threads WHERE relevance_score > 0.5)::text as value
  UNION ALL
  SELECT 2, 'Community insights (30+)',
    CASE WHEN (SELECT COUNT(*) FROM community_insights WHERE is_active) >= 30 THEN '✓ PASS' ELSE '✗ FAIL' END,
    (SELECT COUNT(*) FROM community_insights WHERE is_active)::text
  UNION ALL
  SELECT 3, 'Varied insight types (3+)',
    CASE WHEN (SELECT COUNT(DISTINCT insight_type) FROM community_insights WHERE is_active) >= 3 THEN '✓ PASS' ELSE '✗ FAIL' END,
    (SELECT COUNT(DISTINCT insight_type) FROM community_insights WHERE is_active)::text
  UNION ALL
  SELECT 4, 'Car slug detection (>80%)',
    CASE WHEN (SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE cardinality(car_slugs_detected) > 0) / NULLIF(COUNT(*), 0)) FROM forum_scraped_threads) >= 80 THEN '✓ PASS' ELSE '✗ FAIL' END,
    (SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE cardinality(car_slugs_detected) > 0) / NULLIF(COUNT(*), 0)) FROM forum_scraped_threads)::text || '%'
  UNION ALL
  SELECT 5, 'No duplicate threads',
    CASE WHEN NOT EXISTS (SELECT 1 FROM forum_scraped_threads GROUP BY thread_url HAVING COUNT(*) > 1) THEN '✓ PASS' ELSE '✗ FAIL' END,
    (SELECT COUNT(*) FROM (SELECT thread_url FROM forum_scraped_threads GROUP BY thread_url HAVING COUNT(*) > 1) d)::text || ' duplicates'
  UNION ALL
  SELECT 6, 'Forums scraped (3+)',
    CASE WHEN (SELECT COUNT(DISTINCT forum_source_id) FROM forum_scraped_threads) >= 3 THEN '✓ PASS' ELSE '✗ FAIL' END,
    (SELECT COUNT(DISTINCT forum_source_id) FROM forum_scraped_threads)::text || ' forums'
) results
ORDER BY seq;



