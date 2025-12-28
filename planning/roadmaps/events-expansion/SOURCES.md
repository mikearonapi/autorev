# Verified Event Data Sources

> **Last Updated:** 2025-01-XX  
> **Purpose:** Track verified, real-data-only sources for car events

---

## Source Verification Criteria

✅ **Verified Sources Must Have:**
- Publicly accessible event listings
- Verifiable URLs (can be clicked and confirmed)
- Real events (not synthetic/AI-generated)
- Consistent data structure
- Reasonable rate limits

❌ **Rejected Sources:**
- AI-generated event lists
- Placeholder data
- Unverifiable URLs
- Rate-limited beyond feasibility

---

## Active Sources by Category

### Cars & Coffee

| Source | URL | Coverage | Status | Notes |
|--------|-----|----------|--------|-------|
| CarsAndCoffeeEvents | https://carsandcoffeeevents.com | National | ✅ Active | State-by-state scraping |
| Rideology | https://rideology.io | National | ✅ Active | User-submitted directory |
| EventbriteSearch | https://eventbrite.com | National | ✅ Active | Public search scraping |

### Track Events (HPDE, Time Attack, Autocross)

| Source | URL | Coverage | Status | Notes |
|--------|-----|----------|--------|-------|
| MotorsportReg | https://motorsportreg.com | National | ✅ Active | Primary track event source |
| SCCA | https://scca.com | National | ✅ Active | Autocross focus |
| PCA | https://pca.org | National | ✅ Active | Porsche Club events |

### Car Shows & Auctions

| Source | URL | Coverage | Status | Notes |
|--------|-----|----------|--------|-------|
| EventbriteSearch | https://eventbrite.com | National | ✅ Active | Requires filtering |
| Barrett-Jackson | https://barrett-jackson.com | National | ⬜ Planned | Auction events |

### Club Meetups

| Source | URL | Coverage | Status | Notes |
|--------|-----|----------|--------|-------|
| PCA | https://pca.org | National | ✅ Active | Porsche events |
| BMW CCA | https://bmwcca.org | National | ⬜ Planned | BMW events |
| Corvette Clubs | Various | Regional | ⬜ Planned | Regional clubs |

### Cruises & Drives

| Source | URL | Coverage | Status | Notes |
|--------|-----|----------|--------|-------|
| Renndvous | https://renndvous.com | National | ⬜ Planned | Rallies and drives |
| EventbriteSearch | https://eventbrite.com | National | ✅ Active | Requires filtering |

---

## Source Performance Tracking

### EventbriteSearch
- **Type:** Public search scraping
- **Rate Limit:** 600ms delay per page/event
- **Success Rate:** TBD
- **Events Added:** TBD
- **Last Run:** TBD
- **Issues:** Requires filtering (low signal-to-noise)

### CarsAndCoffeeEvents
- **Type:** Scraping
- **Rate Limit:** Respectful delays
- **Success Rate:** TBD
- **Events Added:** TBD
- **Last Run:** TBD
- **Issues:** Some events only on main calendar

### Rideology
- **Type:** Scraping
- **Rate Limit:** Respectful delays
- **Success Rate:** TBD
- **Events Added:** TBD
- **Last Run:** TBD
- **Issues:** User-submitted, quality varies

### MotorsportReg
- **Type:** Scraping/API
- **Rate Limit:** TBD
- **Success Rate:** TBD
- **Events Added:** TBD
- **Last Run:** TBD
- **Issues:** None known

---

## Rejected Sources

| Source | Reason | Date |
|--------|--------|------|
| — | — | — |

*No sources rejected yet*

---

## Planned Sources (Research Phase)

| Source | Category | Priority | Status | Notes |
|--------|----------|----------|--------|-------|
| Facebook Events | All | HIGH | ⚠️ Blocked | API restrictions |
| Meetup | All | MEDIUM | ⬜ Research | API changes |
| Renndvous | Cruises | MEDIUM | ⬜ Research | Rally focus |
| CarsAndCoffeeDirectory | C&C | MEDIUM | ⬜ Research | Alternative aggregator |
| DrivingLine | All | LOW | ⬜ Research | Mixed content |

---

## Source Addition Process

1. **Research** - Verify source has real, verifiable events
2. **Test** - Build fetcher and test on small sample
3. **Validate** - Confirm all events have source_url
4. **Document** - Add to this file with status
5. **Integrate** - Add to event_sources table
6. **Monitor** - Track performance and issues

---

## Notes

- All sources must provide verifiable `source_url` for every event
- Rate limits must be respected (minimum 500ms delays)
- Failed sources should be logged in `/validation/FAILED_SOURCES.md`
- Source performance tracked in MASTER_TRACKER.md

