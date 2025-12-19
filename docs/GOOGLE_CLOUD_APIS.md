# Google Cloud APIs Reference

> APIs enabled for AutoRev. Integration status tracked here.
>
> **Last Updated:** December 15, 2024

---

## Quick Reference

| API | Status | Primary Use Case | Free Tier |
|-----|--------|------------------|-----------|
| YouTube Data API v3 | ✅ Integrated | Expert Reviews tab | 10,000 units/day |
| Places API | 🔲 Enabled | Track venue enrichment | $200/mo credit |
| Maps JavaScript API | 🔲 Enabled | Interactive track maps | $200/mo credit |
| Geocoding API | 🔲 Enabled | Address → coordinates | $200/mo credit |
| Custom Search API | 🔲 Enabled | AL forum search tool | 100 queries/day |
| Cloud Vision API | 🔲 Enabled | VIN-from-photo OCR | 1,000 units/mo |
| Cloud Natural Language | 🔲 Enabled | Content intelligence | 5,000 units/mo |
| Cloud Speech-to-Text | 🔲 Enabled | Transcript generation | 60 min/mo |
| Sheets API | 🔲 Enabled | Bulk data import/export | Unlimited |

**Status Legend:**
- ✅ Integrated — Code deployed and working
- 🔲 Enabled — API active in GCP, awaiting implementation
- ⬜ Not Enabled — Not turned on

---

## Environment Variables

| Variable | Purpose | Where to Get | Used By |
|----------|---------|--------------|---------|
| `GOOGLE_API_KEY` | Server-side API access | GCP Console → Credentials | YouTube, Places, Geocoding, Vision, NL, Speech, Sheets |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Client-side map rendering | GCP Console → Credentials (separate key) | Maps JavaScript API |
| `GOOGLE_CUSTOM_SEARCH_ENGINE_ID` | Programmable Search Engine ID | [programmablesearchengine.google.com](https://programmablesearchengine.google.com) | Custom Search API |

### Key Security Best Practices

**Server-side key (`GOOGLE_API_KEY`):**
- Restrict by IP address (Vercel deployment IPs)
- Never expose in client-side code
- Use for all backend API calls

**Client-side key (`NEXT_PUBLIC_GOOGLE_MAPS_KEY`):**
- Restrict by HTTP referrer (`*.autorev.app/*`, `localhost:*`)
- Only used for Maps JavaScript API in browser
- OK to expose (restricted to your domains)

---

## API Details

### 1. YouTube Data API v3

**Status:** ✅ Integrated

**Used By:**
- `/api/cron/youtube-enrichment`
- `lib/youtubeClient.js`
- Expert Reviews tab on car detail pages

**Current Implementation:**
- Fetches video metadata for 288 videos in `youtube_videos` table
- Discovers new videos from 12 trusted channels (`youtube_channels` table)
- Enrichment runs weekly (Monday 4am UTC)

**Tables Affected:**
- `youtube_videos` (288 rows)
- `youtube_video_car_links` (291 rows)
- `youtube_channels` (12 rows)
- `youtube_ingestion_queue` (processing queue)

**Cost Estimate:** Well within free tier (10,000 quota units/day)

**Google Docs:** [YouTube Data API](https://developers.google.com/youtube/v3)

---

### 2. Places API

**Status:** 🔲 Enabled (not yet implemented)

**Potential Use Cases:**
1. **Track Venue Enrichment** — Add accurate addresses, coordinates, photos, ratings to `track_venues` table (21 rows)
2. **Find a Specialist** — Future feature to locate performance shops near user
3. **Service Log Enhancement** — Verify and enrich shop details when users log service
4. **Nearby Tracks** — "Tracks near me" feature for Tuning Shop

**Tables Would Affect:**
- `track_venues` — Add `place_id`, `google_rating`, `photo_reference`, `formatted_address`
- Future: `shops` table for mechanic/tuner finder

**User Value:**
- Tuner tier users planning track days get richer venue data
- Verified shop information for service records

**Cost Estimate:**
- Place Details: $17/1,000 requests
- Nearby Search: $32/1,000 requests
- Expected: <$10/month with caching

**Google Docs:** [Places API](https://developers.google.com/maps/documentation/places/web-service)

---

### 3. Maps JavaScript API

**Status:** 🔲 Enabled (not yet implemented)

**Potential Use Cases:**
1. **Track Location Maps** — Embed interactive maps in lap times section
2. **Dealer/Mechanic Locator** — Show service locations for Enthusiast tier
3. **Road Trip Planning** — Future enthusiast driving route feature
4. **Test Location Context** — "Where this car was tested" on dyno/lap time entries

**Would Enhance:**
- Tuning Shop UI (track maps)
- Future location-based features

**User Value:**
- Visual context for track data
- "Tracks near me" discovery with real maps

**Cost Estimate:**
- Dynamic Maps: $7/1,000 loads
- Expected: <$20/month for typical usage

**Note:** Requires separate client-side API key with referrer restrictions.

**Google Docs:** [Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)

---

### 4. Geocoding API

**Status:** 🔲 Enabled (not yet implemented)

**Potential Use Cases:**
1. **Track Venue Coordinates** — Convert addresses to lat/long for map display
2. **Location Normalization** — Standardize user-entered locations in service logs
3. **Distance Queries** — Enable "tracks within X miles" search
4. **Event Geocoding** — Add coordinates to events missing lat/long

**Would Enhance:**
- `track_venues` table (add `latitude`, `longitude`)
- `events` table (backfill missing coordinates)

**User Value:**
- Enables all map-based features
- Powers radius-based event search

**Cost Estimate:**
- $5/1,000 requests
- Expected: <$5/month (batch geocode with caching)

**Google Docs:** [Geocoding API](https://developers.google.com/maps/documentation/geocoding)

---

### 5. Custom Search API

**Status:** 🔲 Enabled (not yet implemented)

**Potential Use Cases:**
1. **AL Forum Search** — Make `search_forums` tool functional (currently placeholder)
2. **Real Owner Experiences** — Find actual forum posts about issues, mods, ownership
3. **Market Research** — Research prices when `car_market_pricing` is sparse
4. **Expert Insights** — Surface enthusiast knowledge not in our database

**Would Enhance:**
- AL `search_forums` tool in `lib/alTools.js`
- `community_insights` table (potential source)

**Setup Required:**
1. Create Programmable Search Engine at [programmablesearchengine.google.com](https://programmablesearchengine.google.com)
2. Scope to automotive forums only:
   - `rennlist.com/*`
   - `bimmerpost.com/*`
   - `6speedonline.com/*`
   - `golfmk7.com/*`
   - `ft86club.com/*`
   - `corvetteforum.com/*`
   - `vwvortex.com/*`
   - `miata.net/*`

**User Value:**
- AL can answer "what do owners say about..." with real forum data
- Fills gaps in structured data

**Cost Estimate:**
- Free tier: 100 queries/day
- $5/1,000 queries after
- Expected: Free tier sufficient initially

**Google Docs:** [Custom Search API](https://developers.google.com/custom-search/v1/overview)

---

### 6. Cloud Vision API

**Status:** 🔲 Enabled (not yet implemented)

**Potential Use Cases:**
1. **VIN-from-Photo** — User photographs VIN plate instead of typing 17 characters
2. **Car Identification** — "What car is this?" from user-uploaded photo
3. **Window Sticker OCR** — Extract specs from photographed window stickers
4. **Inspection Photo Analysis** — Future pre-purchase inspection assistance

**Would Enhance:**
- `/api/vin/decode` flow — Add image upload option
- My Garage vehicle addition workflow

**User Value:**
- Frictionless VIN entry (major UX improvement)
- Instant car identification from photos

**Cost Estimate:**
- Text Detection: $1.50/1,000 images
- Label Detection: $1.50/1,000 images
- Free tier: 1,000 units/month
- Expected: Free tier sufficient initially

**Google Docs:** [Cloud Vision API](https://cloud.google.com/vision/docs)

---

### 7. Cloud Natural Language API

**Status:** 🔲 Enabled (not yet implemented)

**Potential Use Cases:**
1. **YouTube Transcript Analysis** — Better extraction of `pros_mentioned`/`cons_mentioned`
2. **Entity Recognition** — Auto-identify car names, parts, issues in text
3. **Sentiment Analysis** — Gauge owner sentiment in reviews for reliability insights
4. **Topic Classification** — Improve `document_chunks` categorization

**Would Enhance:**
- YouTube enrichment pipeline (`youtube_videos.pros_mentioned`, `youtube_videos.cons_mentioned`)
- Knowledge base ingestion quality
- `community_insights` extraction

**User Value:**
- More accurate AI-extracted insights
- Better AL answers with improved knowledge base

**Cost Estimate:**
- Entity Analysis: $1/1,000 records
- Sentiment Analysis: $1/1,000 records
- Free tier: 5,000 units/month
- Expected: Free tier sufficient for batch processing

**Google Docs:** [Cloud Natural Language API](https://cloud.google.com/natural-language/docs)

---

### 8. Cloud Speech-to-Text API

**Status:** 🔲 Enabled (not yet implemented)

**Potential Use Cases:**
1. **Transcript Generation** — Create transcripts when YouTube captions unavailable
2. **Voice Input for AL** — Future "Hey AL, what's a good track car?"
3. **Podcast Processing** — Ingest automotive podcast content to knowledge base

**Would Enhance:**
- YouTube enrichment pipeline (fallback for missing captions)
- Future voice interface for AL

**User Value:**
- More complete video coverage in Expert Reviews
- Accessibility improvements

**Cost Estimate:**
- Standard model: $0.006/15 seconds
- Free tier: 60 minutes/month
- Expected: <$10/month for occasional transcript generation

**Google Docs:** [Cloud Speech-to-Text](https://cloud.google.com/speech-to-text/docs)

---

### 9. Sheets API

**Status:** 🔲 Enabled (not yet implemented)

**Potential Use Cases:**
1. **Bulk Data Import** — Import car data, parts catalogs from spreadsheets
2. **Stakeholder Reports** — Export data for non-technical review
3. **User Export** — Export build projects or service logs to Sheets
4. **Collaborative Curation** — Share data with external contributors

**Would Enhance:**
- Internal admin tools
- Future export features in My Garage

**User Value:**
- Data portability for users
- Easier sharing of build projects

**Cost Estimate:** Free (usage-based quotas, not charged)

**Google Docs:** [Sheets API](https://developers.google.com/sheets/api)

---

## APIs NOT Enabled

| API | Reason |
|-----|--------|
| Google Drive API | Using Supabase + Vercel Blob for file storage |
| Cloud Storage API | Using Vercel Blob for images |
| Google Analytics | Using Vercel Analytics |

---

## Cost Summary

### Monthly Free Tier Coverage

| API | Free Tier | Expected Usage | Covered? |
|-----|-----------|----------------|----------|
| YouTube Data | 10,000 units/day | ~500 units/week | ✅ Yes |
| Custom Search | 100 queries/day | ~20 queries/day | ✅ Yes |
| Cloud Vision | 1,000 units/mo | ~100 VINs/mo | ✅ Yes |
| Cloud NL | 5,000 units/mo | ~1,000 docs/mo | ✅ Yes |
| Speech-to-Text | 60 min/mo | ~30 min/mo | ✅ Yes |
| Sheets | Unlimited | As needed | ✅ Yes |

### Paid Usage (Maps Platform)

Google Maps Platform provides **$200/month free credit** which covers:

| API | Price per 1,000 | $200 Credit Covers |
|-----|-----------------|-------------------|
| Places Details | $17 | ~11,700 requests |
| Maps JavaScript | $7 | ~28,500 loads |
| Geocoding | $5 | ~40,000 requests |

**Expected monthly spend:** $0-20 (well within $200 credit)

---

## Integration Priority Suggestions

Based on user value and implementation complexity:

### High Priority (Quick Wins)
1. **Geocoding API** — Low complexity, enables maps features
2. **Custom Search API** — Makes AL `search_forums` functional
3. **Cloud Vision API** — Major UX improvement for VIN entry

### Medium Priority (Feature Enablers)
4. **Places API** — Enriches track venue data
5. **Maps JavaScript API** — Visual context for location data
6. **Cloud Natural Language** — Improves content extraction quality

### Lower Priority (Future Features)
7. **Speech-to-Text** — Fallback for missing transcripts
8. **Sheets API** — Admin/export convenience

---

## Implementation Notes

### API Key Sharing

Most APIs share `GOOGLE_API_KEY`:
```
YouTube + Places + Geocoding + Vision + NL + Speech + Sheets
                    ↓
              GOOGLE_API_KEY (server-side, IP-restricted)
```

Maps JavaScript API requires separate client-side key:
```
Maps JavaScript API
        ↓
NEXT_PUBLIC_GOOGLE_MAPS_KEY (client-side, referrer-restricted)
```

### Credential Setup Checklist

- [ ] Verify `GOOGLE_API_KEY` exists in Vercel env vars
- [ ] Create `NEXT_PUBLIC_GOOGLE_MAPS_KEY` with referrer restrictions
- [ ] Create Programmable Search Engine for Custom Search
- [ ] Add `GOOGLE_CUSTOM_SEARCH_ENGINE_ID` to env vars

---

*See [ARCHITECTURE.md](ARCHITECTURE.md) for system overview and [API.md](API.md) for internal API routes.*






