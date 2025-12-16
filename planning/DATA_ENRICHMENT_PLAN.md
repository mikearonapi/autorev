# AutoRev Data Enrichment Plan

**Created:** December 15, 2024  
**Goal:** Fill identified gaps in vehicle database using free/existing resources

---

## Current State Summary

| Category | Coverage | Status |
|----------|----------|--------|
| Core Specs | 100% | ✅ Complete |
| Editorial Content | 100% | ✅ Complete |
| Maintenance Specs | 95%+ | ✅ Good |
| **Market Pricing** | **10%** | 🔴 Critical Gap |
| **Recalls** | **30%** | ⚠️ Important Gap |
| **Known Issues** | **51%** | ⚠️ Important Gap |
| **Spark Plugs** | **1%** | 🔴 Critical Gap |
| **Trans Fluid** | **68%** | ⚠️ Gap |

---

## Gap 1: Market Pricing (10% → 100%)

### Current State
- Only 10 of 98 cars have `car_market_pricing` data
- Missing: BaT auction data, Hagerty valuations, Cars.com listings

### Data Sources (Priority Order)

#### 1a. Bring a Trailer (BaT) - Manual + Scraping
**What:** Actual auction results, most accurate for enthusiast cars  
**Method:** 
- BaT has no official API
- Use existing `testBaTBrowserFallback.js` infrastructure
- Scrape completed auctions by model

**Script:** `scripts/enrichBaTAuctionData.js` (to create)

```javascript
// Pseudocode for BaT enrichment
for each car in cars_missing_market_pricing:
  search_url = `https://bringatrailer.com/search/${make}+${model}/`
  results = scrape_completed_auctions(search_url)
  
  // Calculate stats from results
  prices = results.map(r => r.sold_price)
  record = {
    car_slug: car.slug,
    bat_avg_price: average(prices),
    bat_median_price: median(prices),
    bat_min_price: min(prices),
    bat_max_price: max(prices),
    bat_sample_size: prices.length,
    bat_fetched_at: now()
  }
  
  upsert into car_market_pricing
```

**Timeline:** 2-3 hours to build, ~2 hours to run (rate limited)

#### 1b. Cars.com Listings - Existing Script
**What:** Current for-sale listings  
**Method:** You have `scrapeValidatedPricing.js` - just need to run it  
**Timeline:** 1 hour to validate and run

#### 1c. Hagerty - Manual Entry
**What:** Condition-based valuations (Concours, Excellent, Good, Fair)  
**Method:** Manual lookup from hagerty.com/valuation (no API)  
**Priority:** Lower - do for top 20 collectible cars only

### Implementation Plan

```bash
# Step 1: Run existing Cars.com scraper
node scripts/scrapeValidatedPricing.js --all

# Step 2: Create and run BaT enrichment (new script)
node scripts/enrichBaTAuctionData.js --limit=10 --test
node scripts/enrichBaTAuctionData.js --all

# Step 3: Manual Hagerty for high-value cars
# (E46 M3, 997 GT3, NSX, etc.)
```

---

## Gap 2: Recalls (30% → 100%)

### Current State
- 69 cars missing recall data
- Infrastructure exists: `recallService.js`, `nhtsaClient.js`

### Data Source
**NHTSA Recalls API** - FREE, no rate limits  
`https://api.nhtsa.gov/recalls/recallsByVehicle?make={make}&model={model}&modelYear={year}`

### Existing Infrastructure
- `lib/recallService.js` - Already has model name mapping!
- `app/api/cron/refresh-recalls/route.js` - Cron endpoint exists

### Implementation

```bash
# Option 1: Use existing cron (run multiple times)
curl -X POST https://autorev.app/api/cron/refresh-recalls

# Option 2: Create batch script
node scripts/enrichRecallsAll.js
```

**New Script:** `scripts/enrichRecallsAll.js`

```javascript
// Uses existing recallService.js
import { fetchRecallRowsForCar, upsertRecallRows } from '../lib/recallService.js';

async function main() {
  // Get cars missing recalls
  const { data: cars } = await supabase
    .from('cars')
    .select('slug, name, brand, years')
    .not('slug', 'in', 
      supabase.from('car_recalls').select('car_slug')
    );
  
  for (const car of cars) {
    const { rows } = await fetchRecallRowsForCar({ car });
    await upsertRecallRows({ client: supabase, rows });
    console.log(`${car.name}: ${rows.length} recalls`);
    await sleep(500); // Rate limit
  }
}
```

**Timeline:** 30 min to create script, 30 min to run

---

## Gap 3: Known Issues (51% → 100%)

### Current State
- `car_issues` table has 395 records covering 50 cars
- 48 cars missing known issues data

### Data Sources

#### 3a. Forum Scraping (Existing Pipeline)
**What:** Community-reported common problems  
**Infrastructure:** `forum_scraped_threads`, `community_insights` tables  
**Method:** Run existing forum insight extraction

```bash
# Check existing forum coverage
node scripts/run-insight-extraction.js --car-slug=bmw-m4-f82
```

#### 3b. NHTSA Complaints API - FREE
**What:** Owner-reported complaints  
**Endpoint:** `https://api.nhtsa.gov/complaints/complaintsByVehicle`

**New Script:** `scripts/enrichKnownIssuesFromComplaints.js`

```javascript
// Extract common issues from NHTSA complaints
async function extractIssuesFromComplaints(carSlug) {
  const complaints = await fetchNhtsaComplaints(car);
  
  // Group by component
  const componentGroups = groupBy(complaints, 'Component');
  
  // For each component with 3+ complaints, create an issue
  for (const [component, items] of Object.entries(componentGroups)) {
    if (items.length >= 3) {
      await supabase.from('car_issues').upsert({
        car_slug: carSlug,
        kind: 'common_issue',
        title: `${component} Issues`,
        description: summarizeComplaints(items),
        severity: calculateSeverity(items),
        source_type: 'nhtsa_complaints',
      });
    }
  }
}
```

#### 3c. AI-Powered Extraction (Existing)
**Method:** Use existing `populate-known-issues.js` with AI
```bash
node scripts/populate-known-issues.js --car=bmw-m3-e46
```

### Implementation Plan

```bash
# Step 1: Run NHTSA complaints extraction
node scripts/enrichKnownIssuesFromComplaints.js --all

# Step 2: Run forum insight extraction for gaps
node scripts/run-insight-extraction.js --missing-only

# Step 3: AI backfill for remaining gaps
node scripts/populate-known-issues.js --missing-only
```

**Timeline:** 2 hours for scripts, 3-4 hours to run

---

## Gap 4: Maintenance Specs (Spark Plugs, Trans Fluid)

### Current State
- Spark Plugs: 1% coverage (only 1 car!)
- Trans Fluid: 68% coverage (~30 cars missing)

### Data Sources

#### 4a. OEM Parts Databases
- RockAuto (has part numbers)
- FCP Euro (Euro car specialists)
- Pelican Parts (Porsche/BMW)

#### 4b. Enthusiast Forums (most reliable)
- BimmerPost (BMW)
- Rennlist (Porsche)
- CorvetteForums
- etc.

### Implementation Approach

**Option A: AI-Assisted Research (Recommended)**

```javascript
// scripts/enrichMaintenanceSpecs.js
async function enrichSparkPlugs(car) {
  // Use Claude to research OEM part numbers
  const prompt = `
    For ${car.name} (${car.years}):
    1. What is the OEM spark plug part number?
    2. What is the recommended gap?
    3. How many plugs are needed?
    4. What are alternative compatible part numbers (NGK, Bosch, etc.)?
    
    Cite sources.
  `;
  
  const response = await callClaude(prompt);
  // Parse and save to vehicle_maintenance_specs
}
```

**Option B: Manual Entry with Spreadsheet**

Create spreadsheet, research manually, import:
```sql
UPDATE vehicle_maintenance_specs SET
  spark_plug_oem_part = 'NGK 94201',
  spark_plug_gap_mm = 0.7,
  spark_plug_quantity = 6
WHERE car_slug = 'bmw-m3-e46';
```

### Implementation Plan

```bash
# Step 1: Export cars missing specs to spreadsheet
node scripts/exportMissingMaintenanceSpecs.js > missing_specs.csv

# Step 2: Research and fill spreadsheet
# (manual or AI-assisted)

# Step 3: Import completed data
node scripts/importMaintenanceSpecs.js --file=completed_specs.csv
```

**Timeline:** 4-6 hours (mostly research time)

---

## Priority Execution Order

### Week 1: Quick Wins (Free APIs)

| Day | Task | Time | Impact |
|-----|------|------|--------|
| Mon | Run `enrichFreeApisDirect.js` for full NHTSA refresh | 1h | Recalls: 30%→80% |
| Mon | Create & run `enrichRecallsAll.js` for stragglers | 1h | Recalls: 80%→95% |
| Tue | Run `scrapeValidatedPricing.js` for Cars.com | 2h | Pricing: 10%→40% |
| Wed | Create `enrichKnownIssuesFromComplaints.js` | 2h | Issues: 51%→70% |
| Thu | Run forum insight extraction | 2h | Issues: 70%→85% |
| Fri | AI backfill for remaining issues | 2h | Issues: 85%→95% |

### Week 2: Market Pricing & Maintenance

| Day | Task | Time | Impact |
|-----|------|------|--------|
| Mon | Create BaT scraper script | 3h | - |
| Tue | Run BaT enrichment | 2h | Pricing: 40%→80% |
| Wed | Research spark plug specs (AI-assisted) | 4h | Spark: 1%→50% |
| Thu | Continue spark plug research | 4h | Spark: 50%→90% |
| Fri | Trans fluid specs + cleanup | 3h | Trans: 68%→95% |

---

## Scripts to Create

### New Scripts Needed

1. **`scripts/enrichRecallsAll.js`** - Batch NHTSA recalls
2. **`scripts/enrichKnownIssuesFromComplaints.js`** - NHTSA complaints → car_issues
3. **`scripts/enrichBaTAuctionData.js`** - BaT scraping
4. **`scripts/enrichMaintenanceSpecs.js`** - AI-assisted spec research
5. **`scripts/exportMissingMaintenanceSpecs.js`** - CSV export for manual research

### Existing Scripts to Run

1. `scripts/enrichFreeApisDirect.js` - EPA + NHTSA batch
2. `scripts/scrapeValidatedPricing.js` - Cars.com pricing
3. `scripts/populate-known-issues.js` - AI issue generation
4. `scripts/run-insight-extraction.js` - Forum insights

---

## Success Metrics

| Metric | Current | Target | Method |
|--------|---------|--------|--------|
| Market Pricing | 10% | 90% | BaT + Cars.com |
| Recalls | 30% | 95% | NHTSA API |
| Known Issues | 51% | 95% | NHTSA + Forums + AI |
| Spark Plugs | 1% | 90% | Research + AI |
| Trans Fluid | 68% | 95% | Research + AI |

---

## Cost Estimate

| Resource | Cost |
|----------|------|
| NHTSA API | FREE |
| EPA API | FREE |
| BaT Scraping | FREE (self-hosted) |
| Cars.com Scraping | FREE (existing) |
| AI Research (Claude) | ~$5-10 in tokens |
| **Total** | **~$10** |

---

## Next Steps

1. ✅ Audit complete
2. ⏳ Run existing free API enrichment
3. ⏳ Create missing scripts
4. ⏳ Execute week 1 tasks
5. ⏳ Execute week 2 tasks
6. ⏳ Final audit and cleanup

