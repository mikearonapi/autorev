# Event Sourcing Strategy

> Scalable approach to comprehensive car event coverage across the United States

## Problem Statement

**Leesburg Case Study**: A city ranked ~#450 nationally (population ~49,000) in the affluent DC metro area had only 1 event in our database despite having 4+ regular Cars & Coffee events within 30 miles.

**Scale of the Problem**:
- ~800 US cities with population 20,000+
- ~400 US cities with population 50,000+
- ~19,000 incorporated places in the US
- If we're missing 4 events in Leesburg, we're likely missing **thousands of events nationwide**

## Current Event Sources

| Source | Type | Status | Coverage | Event Types |
|--------|------|--------|----------|-------------|
| MotorsportReg | API | ✅ Active | National | Track days, HPDE, Autocross |
| SCCA | Scrape | ✅ Active | National | Autocross, Time Attack |
| PCA | Scrape | ✅ Active | National | Club events, Track days |
| Eventbrite | API | ✅ Active | National | Mixed (requires filtering) |
| CarsAndCoffeeEvents | Scrape | ✅ Active | Partial | Cars & Coffee |
| Rideology | Scrape | ✅ Active | National | Cars & Coffee, Meets |

## Tiered Sourcing Strategy

### Tier 1: Aggregators (Highest Value)
Sources that aggregate events from multiple organizers. One integration = many events.

| Source | URL | Coverage | Event Types | Priority |
|--------|-----|----------|-------------|----------|
| **Rideology** | rideology.io | National | C&C, Meets | ✅ Added |
| **CarsAndCoffeeEvents** | carsandcoffeeevents.com | National | C&C | ✅ Active |
| Renndvous | renndvous.com | National | Rallies, Drives | HIGH |
| CarsAndCoffeeDirectory | carsandcoffeedirectory.com | National | C&C | HIGH |
| DrivingLine | drivingline.com | National | All types | MEDIUM |

### Tier 2: Major Platforms
High-traffic platforms with car events among other content.

| Source | URL | Coverage | Challenges | Priority |
|--------|-----|----------|------------|----------|
| Facebook Events | facebook.com | National | API restrictions | HIGH (complex) |
| Eventbrite | eventbrite.com | National | Low signal-to-noise | ✅ Active |
| Meetup | meetup.com | National | API changes | MEDIUM |

### Tier 3: Club/Organization Sources
Official clubs and organizations with predictable, quality events.

| Source | Coverage | Event Types | Priority |
|--------|----------|-------------|----------|
| **PCA** | National | Porsche events | ✅ Active |
| **SCCA** | National | Motorsports | ✅ Active |
| BMW CCA | National | BMW events | HIGH |
| Ferrari Club of America | National | Ferrari events | MEDIUM |
| Corvette clubs | Regional | Corvette events | MEDIUM |

### Tier 4: Regional/Local Sources
City-specific or regional sources for targeted coverage.

- Local news event calendars
- Chamber of Commerce event pages
- Downtown/business district websites
- Car dealership hosted events
- Racing venue websites (Summit Point, VIR, etc.)

## MSA-Based Priority List

Target Metropolitan Statistical Areas (MSAs) by car enthusiast density, not just population.

### Priority 1: Top Car Culture MSAs (25 markets)
Markets with strong car culture, high income, good weather:

1. **Los Angeles-Long Beach** - 13M pop, largest car culture in US
2. **San Francisco-Oakland** - 4.7M pop, tech + cars
3. **Miami-Fort Lauderdale** - 6.1M pop, exotic car hub
4. **Dallas-Fort Worth** - 7.6M pop, trucks + performance
5. **Phoenix-Mesa** - 4.9M pop, year-round events
6. **Houston** - 7.2M pop, trucks + exotics
7. **Atlanta** - 6.1M pop, strong scene
8. **San Diego** - 3.3M pop, ideal weather
9. **Denver** - 2.9M pop, active community
10. **Seattle** - 4M pop, JDM culture
11. **Tampa-St Pete** - 3.2M pop, year-round
12. **Charlotte** - 2.7M pop, NASCAR country
13. **Washington DC** - 6.4M pop, affluent suburbs
14. **Las Vegas** - 2.3M pop, SEMA + events
15. **Austin** - 2.3M pop, growing scene
16. **Portland** - 2.5M pop, quirky car culture
17. **Nashville** - 2M pop, emerging scene
18. **San Antonio** - 2.6M pop, growing market
19. **Orlando** - 2.6M pop, tourism + cars
20. **Raleigh-Durham** - 2.1M pop, tech + cars
21. **Detroit** - 4.4M pop, obvious heritage
22. **Minneapolis** - 3.7M pop, summer events
23. **Cleveland** - 2.1M pop, Midwest hub
24. **St. Louis** - 2.8M pop, central location
25. **Pittsburgh** - 2.4M pop, good scene

### Priority 2: Secondary Markets (50 markets)
Cities 500K-2M with active car communities.

### Priority 3: Tertiary Markets (200 markets)
Cities 100K-500K - includes places like Leesburg's metro area.

## Event Discovery Methods

### Method 1: Aggregator Scraping (Most Efficient)
**ROI: Highest** - One integration yields hundreds of events

1. Identify aggregator sites
2. Analyze their URL structure and HTML patterns
3. Build scraper with proper rate limiting
4. Run weekly to catch new events

### Method 2: Search Engine Mining
**ROI: Medium** - Good for discovering new sources

```
Search queries to run per MSA:
- "{city} cars and coffee 2026"
- "{city} car show 2026"
- "{city} car meet"
- "{city} automotive events"
- "cars and coffee near {city}"
```

Analyze results to find:
- New aggregator sites
- Local event organizers
- Venue-hosted events

### Method 3: Social Media Mining
**ROI: Low-Medium** - Labor intensive but catches grassroots events

- Facebook Groups (manual, no API)
- Instagram hashtags
- Local Reddit communities (r/{city}cars)

### Method 4: Reverse Engineering from Known Events
**ROI: Medium** - Expands from existing high-quality sources

1. Take a known good event
2. Find its organizer
3. Check if organizer has other events
4. Add organizer's calendar to sources

## Implementation Plan

### Phase 1: Quick Wins (Week 1-2)
- [x] Add Rideology.io fetcher
- [x] Fix CarsAndCoffeeEvents scraper
- [ ] Add Renndvous.com fetcher
- [ ] Run enrichment for all 50 states

### Phase 2: Platform Integrations (Week 3-4)
- [ ] Research Facebook Events workarounds
- [ ] Add Meetup.com integration
- [ ] Improve Eventbrite filtering

### Phase 3: Club Sources (Week 5-6)
- [ ] Add BMW CCA events
- [ ] Add major Corvette clubs
- [ ] Add regional Porsche clubs

### Phase 4: MSA Targeting (Ongoing)
- [ ] Build MSA priority scoring model
- [ ] Create per-MSA coverage reports
- [ ] Identify gaps via search mining
- [ ] Targeted outreach to fill gaps

## Coverage Metrics

Track these metrics to measure progress:

```sql
-- Events per state
SELECT state, COUNT(*) as events 
FROM events 
WHERE start_date >= CURRENT_DATE
GROUP BY state 
ORDER BY events DESC;

-- Events per MSA (requires city-to-MSA mapping)
-- Coverage gaps (states with <10 future events)
-- Source diversity per state
```

### Target Metrics
- **Minimum**: 20 events/state for 2026
- **Good**: 50 events/state for 2026  
- **Excellent**: 100+ events/state for 2026

## Avoiding Common Pitfalls

### 1. Don't Rely on Facebook
Facebook has restricted API access for events. Don't build critical infrastructure on it.

### 2. Respect Rate Limits
All scrapers must:
- Include proper User-Agent
- Wait 500ms+ between requests
- Handle 429 responses gracefully

### 3. Handle Recurring Events
Many C&C events are weekly/monthly. Store recurring pattern, not just single dates.

### 4. Deduplicate Aggressively
Same event from multiple sources = duplicates. Use venue + date + name fuzzy matching.

### 5. Geocode Everything
Events without lat/lng are useless for radius search. Geocode on ingest.

## Source-Specific Notes

### CarsAndCoffeeEvents.com
- Uses `/events/category/{state}/` URL pattern
- Events listed in Tribe Events format
- Some events only on main calendar, not state pages

### Rideology.io
- User-submitted directory
- `/Car-Meets/Car-Meet-Details/{id}` pattern
- Good structured data (hours, location)

### Renndvous.com (TODO)
- Focus on rallies and scenic drives
- Good for cruise events

## Conclusion

The Leesburg case study proves that even in affluent, car-enthusiast-heavy suburbs of major metros, we're missing events. The solution is a systematic, tiered approach:

1. **Prioritize aggregators** - one integration = many events
2. **Target by MSA** - focus on car culture density, not just population
3. **Multiple discovery methods** - don't rely on any single source
4. **Measure coverage** - track events/state and events/MSA
5. **Iterate** - run discovery quarterly, add new sources continuously

With this strategy, we can scale from ~940 events to 5,000+ events nationwide.


