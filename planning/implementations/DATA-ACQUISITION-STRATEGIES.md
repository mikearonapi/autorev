# 🎯 Data Acquisition Strategies by Source

> **Goal**: Practical, bot-protection-aware strategies for enriching AutoRev database
> **Generated**: December 23, 2024
> **Status**: Ready for execution

---

## 📊 Source Matrix Overview

| Source | Protection Level | Strategy | Est. Success Rate |
|--------|-----------------|----------|-------------------|
| **BringATrailer** | 🔴 High (Cloudflare) | Browser scraper + Apify fallback | 85% |
| **Hagerty** | 🟡 Medium | Stealth scraper + rate limiting | 90% |
| **Cars.com** | 🟡 Medium | Existing scraper | 90% |
| **FastestLaps** | 🟢 Low | Direct HTTP (existing script) | 95% |
| **Car & Driver** | 🟡 Medium | Browser fallback (existing) | 80% |
| **Motor Trend** | 🟡 Medium | Stealth scraper | 85% |
| **Forums** | 🟢-🟡 Variable | Existing forum adapter | 85% |
| **YouTube** | 🟢 API | Existing YouTube API | 95% |

---

## 🔴 PRIORITY 1: Market Pricing Data

### 1.1 BringATrailer (BaT)

**Bot Protection**: Cloudflare, reCAPTCHA on suspicious requests
**Current Status**: Scraper exists with browser fallback

#### Strategy Options

| Option | Pros | Cons | Cost |
|--------|------|------|------|
| **A: Enhance existing scraper** | Free, in-house control | May hit blocks at scale | $0 |
| **B: Apify BaT Scraper** | Handles protection, reliable | Per-result cost | ~$3/1000 results |
| **C: Manual + AI extraction** | Most reliable | Time-intensive | Labor |

#### Recommended Approach: Hybrid

```javascript
// scripts/enrich-market-pricing-bat.js

// 1. Try existing browser scraper first
const { searchCompletedAuctions, getMarketData } = require('../lib/scrapers/bringATrailerScraper');

// 2. If blocked, fall back to Apify
async function fetchBaTDataWithFallback(carName, options = {}) {
  try {
    // Try our scraper first (free)
    const data = await getMarketData(carName, { limit: 20 });
    if (data.sampleSize > 0) return data;
    throw new Error('No results from scraper');
  } catch (err) {
    console.log(`[BaT] Scraper failed, trying Apify...`);
    
    // Fallback to Apify (paid but reliable)
    if (process.env.APIFY_API_KEY) {
      return await fetchFromApify(carName);
    }
    
    // Last resort: queue for manual research
    await queueForManualResearch(carName, 'bat_pricing');
    return null;
  }
}

// 3. Rate limit: 1 request per 5 seconds
const RATE_LIMIT_MS = 5000;
```

#### BaT Best Practices

1. **Search Strategy**: Use specific queries
   - ✅ "Porsche 911 GT3 996" 
   - ❌ "GT3" (too broad)

2. **Timing**: Run during off-peak hours (2-6 AM EST)

3. **Session Simulation**: 
   - Visit homepage first
   - Browse a few random listings
   - Then execute target search

4. **User Agent Rotation**: Already implemented in `stealthScraper.js`

#### Data to Extract

```sql
-- Target: car_market_pricing table
bat_avg_price     -- Average sold price
bat_median_price  -- Median sold price
bat_min_price     -- Lowest sale
bat_max_price     -- Highest sale
bat_sample_size   -- Number of auctions analyzed
bat_sell_through  -- % that actually sold
bat_avg_mileage   -- Average mileage of sold units
bat_last_updated  -- Timestamp
```

---

### 1.2 Hagerty Valuations

**Bot Protection**: Medium - some rate limiting, occasional captchas
**Current Status**: Scraper exists (`lib/scrapers/hagertyScraper.js`)

#### Strategy: Stealth Scraping with Rate Limiting

```javascript
// scripts/enrich-hagerty-valuations.js

const { getValuation, matchCarToHagertyValuation } = require('../lib/scrapers/hagertyScraper');

async function enrichCar(car) {
  // Hagerty uses condition-based pricing (Concours/Excellent/Good/Fair)
  const valuation = await matchCarToHagertyValuation(car);
  
  if (!valuation?.values) return null;
  
  return {
    hagerty_concours: valuation.values.concours,
    hagerty_excellent: valuation.values.excellent,
    hagerty_good: valuation.values.good,
    hagerty_fair: valuation.values.fair,
    hagerty_trend: valuation.trend, // 'up', 'down', 'stable'
    hagerty_trend_pct: valuation.trendPercent,
    hagerty_url: valuation.url,
    hagerty_last_updated: new Date().toISOString(),
  };
}

// Rate limit: 1 request per 3 seconds (conservative)
const RATE_LIMIT_MS = 3000;
```

#### Hagerty Coverage Notes

- **Best for**: Classic/collector cars (pre-2010)
- **Limited for**: Very new cars, economy cars
- **Alternative**: Use BaT for cars Hagerty doesn't cover

---

### 1.3 Cars.com Market Averages

**Bot Protection**: Medium
**Current Status**: Scraper exists (`lib/scrapers/carsComScraper.js`)

#### Strategy: Direct API + Listing Aggregation

```javascript
// Cars.com provides listing data, not historical sales
// Good for: current asking prices, market availability

async function getCarsComPricing(carName, options = {}) {
  const listings = await searchListings(carName, {
    radius: 'all', // National search
    sortBy: 'price',
    limit: 50,
  });
  
  const prices = listings.map(l => l.price).filter(p => p > 0);
  
  return {
    carscom_avg_asking: average(prices),
    carscom_median_asking: median(prices),
    carscom_min_asking: Math.min(...prices),
    carscom_max_asking: Math.max(...prices),
    carscom_listing_count: prices.length,
    carscom_last_updated: new Date().toISOString(),
  };
}
```

---

## 🟡 PRIORITY 2: Track Performance Data

### 2.1 FastestLaps.com

**Bot Protection**: 🟢 Low - basic rate limiting only
**Current Status**: Seed script exists (`scripts/seedLapTimesFastestLaps.mjs`)

#### Strategy: Direct HTTP Scraping (Existing Pattern)

The existing script works well. Expand it to cover all 188 cars:

```javascript
// Expand SEEDS array in seedLapTimesFastestLaps.mjs

// Method: Search FastestLaps for each car, extract all test URLs
async function discoverFastestLapsTests(carName) {
  const searchUrl = `https://fastestlaps.com/search?q=${encodeURIComponent(carName)}`;
  const html = await fetch(searchUrl).then(r => r.text());
  
  // Extract test page URLs
  const testUrls = extractTestUrls(html);
  return testUrls;
}

// Run for all cars without lap times
async function enrichAllCars() {
  const carsWithoutLapTimes = await getCarsWithoutLapTimes();
  
  for (const car of carsWithoutLapTimes) {
    const testUrls = await discoverFastestLapsTests(car.name);
    
    for (const url of testUrls) {
      await seedLapTimeFromUrl(car.slug, url);
      await sleep(2000); // Respectful rate limit
    }
  }
}
```

#### Key Tracks to Prioritize

| Track | Importance | Coverage Goal |
|-------|------------|---------------|
| Nürburgring Nordschleife | Critical | 80% of cars |
| Laguna Seca | High | 60% of cars |
| Road Atlanta | High | 40% of cars |
| VIR Full Course | Medium | 30% of cars |
| Willow Springs | Medium | 30% of cars |

---

### 2.2 Car & Driver Instrumented Tests

**Bot Protection**: 🟡 Medium - 403 blocks common
**Current Status**: Scraper with browser fallback exists

#### Strategy: Browser Fallback + Manual Supplement

```javascript
// scripts/enrich-cd-test-data.js

const { matchCarToCaDReviews } = require('../lib/scrapers/carAndDriverScraper');

async function enrichCar(car) {
  const reviews = await matchCarToCaDReviews(car);
  
  if (!reviews?.primaryReview?.testData) return null;
  
  const testData = reviews.primaryReview.testData;
  
  return {
    // Performance data
    zero_to_sixty: testData.zeroToSixty,
    quarter_mile: testData.quarterMile,
    quarter_mile_speed: testData.quarterMileSpeed,
    
    // Handling data
    lateral_g: testData.skidpad,
    braking_60_0: testData.braking70to0 ? Math.round(testData.braking70to0 * 0.857) : null,
    braking_70_0: testData.braking70to0,
    
    // Source tracking
    cd_review_url: reviews.primaryReview.url,
    cd_review_date: reviews.primaryReview.reviewDate,
  };
}
```

#### Manual Supplement Process

For cars where scraping fails:
1. Google "[Car Name] Car and Driver test results"
2. Extract data to spreadsheet
3. Bulk import via script

---

### 2.3 Motor Trend Test Data

**Bot Protection**: 🟡 Medium
**Current Status**: Scraper exists (`lib/scrapers/motorTrendScraper.js`)

Similar approach to Car & Driver. Motor Trend has good braking and skidpad data.

---

## 🟢 PRIORITY 3: Community Insights (Forums)

### 3.1 Forum Scraping Strategy

**Current Status**: Forum adapter exists (`lib/forumScraper/baseAdapter.js`)

#### Activation Plan by Brand

| Forum | Cars Covered | Priority | Est. Insights |
|-------|--------------|----------|---------------|
| 6SpeedOnline | Porsches (12) | ✅ Active | 500+ |
| Rennlist | Porsches (12) | ✅ Active | 500+ |
| CorvetteForum | Corvettes (6) | 🟡 Activate | 300+ |
| My350Z.com | Nissan Z (4) | 🟡 Activate | 200+ |
| S2Ki | Honda S2000 (4) | 🟡 Activate | 200+ |
| MBWorld | Mercedes (5) | 🟡 Activate | 250+ |
| FerrariChat | Ferraris (10) | 🔴 Add | 400+ |
| McLarenLife | McLarens (7) | 🔴 Add | 300+ |
| Mustang6G | Mustangs (3) | 🔴 Add | 150+ |

#### Forum Scraping Best Practices

```javascript
// lib/forumScraper/forumConfig.js

const FORUM_CONFIGS = {
  'corvetteforum.com': {
    rateLimit: 10000, // 10 seconds between requests
    maxPages: 50,
    targetSections: ['C7 General', 'C8 Discussion', 'Maintenance'],
    insightTypes: ['common_issues', 'maintenance_tips', 'reliability'],
  },
  'ferrarichat.com': {
    rateLimit: 15000, // More conservative
    requiresLogin: true, // May need account
    maxPages: 30,
    targetSections: ['Technical', 'Buying Advice', 'Maintenance'],
  },
};
```

#### Insight Extraction Pipeline

```
Forum Thread → AI Processing → Structured Insight → Vector Embedding → database
```

---

## 🔵 PRIORITY 4: Service & Ownership Costs

### 4.1 RepairPal API

**Protection**: API key required
**Data**: Labor hours, parts costs by service type

```javascript
// scripts/enrich-service-costs.js

// RepairPal has a partner API (requires application)
// Alternative: scrape their estimator tool

async function getServiceCosts(car) {
  const services = [
    { type: '15k_service', description: '15,000 mile service' },
    { type: '30k_service', description: '30,000 mile service' },
    { type: '60k_service', description: '60,000 mile major service' },
    { type: 'brake_job', description: 'Brake pads and rotors all corners' },
    { type: 'clutch', description: 'Clutch replacement (manual only)' },
  ];
  
  // Use browser scraper to access RepairPal estimator
  // Or supplement with forum-extracted costs
}
```

### 4.2 Alternative: Forum-Extracted Costs

Forums often have "what did you pay for X service" threads:

```javascript
// Extract cost mentions from forum posts
const costPattern = /(?:paid|cost|quoted|charged)\s*(?:me\s*)?\$?([\d,]+)/i;

// AI prompt for cost extraction
const prompt = `
Extract service costs mentioned in this forum post:
- Service type (oil change, brake job, clutch, etc.)
- Cost amount
- Dealer vs independent shop
- Year of service (if mentioned)
`;
```

---

## 🛠️ Infrastructure Recommendations

### Browser Pool Management

```javascript
// lib/scrapers/browserPool.js

const puppeteer = require('puppeteer');

class BrowserPool {
  constructor(maxBrowsers = 3) {
    this.pool = [];
    this.maxBrowsers = maxBrowsers;
  }
  
  async acquire() {
    if (this.pool.length < this.maxBrowsers) {
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      this.pool.push(browser);
      return browser;
    }
    // Wait for available browser
    return this.pool[Math.floor(Math.random() * this.pool.length)];
  }
  
  async releaseAll() {
    for (const browser of this.pool) {
      await browser.close();
    }
    this.pool = [];
  }
}
```

### Proxy Rotation (Optional)

For high-volume scraping:

```javascript
// lib/scrapers/proxyConfig.js

const PROXY_PROVIDERS = [
  // Residential proxies (best for BaT, Hagerty)
  {
    provider: 'brightdata',
    url: process.env.BRIGHTDATA_PROXY_URL,
    rotationType: 'residential',
  },
  // Datacenter proxies (cheaper, ok for FastestLaps)
  {
    provider: 'smartproxy',
    url: process.env.SMARTPROXY_URL,
    rotationType: 'rotating',
  },
];
```

### Captcha Solving (Last Resort)

```javascript
// If absolutely necessary:
const CAPTCHA_SERVICES = [
  { name: '2captcha', cost: '$2.99/1000', reliability: 'high' },
  { name: 'anticaptcha', cost: '$2.00/1000', reliability: 'medium' },
];
```

---

## 📋 Execution Checklist

### Week 1: Market Pricing
- [ ] Test BaT scraper on 10 cars
- [ ] Set up Apify fallback (get API key)
- [ ] Run Hagerty valuations for all classics
- [ ] Run Cars.com for current listings

### Week 2: Track Data
- [ ] Expand FastestLaps seed script to all cars
- [ ] Run Car & Driver test data extraction
- [ ] Manual research for top 20 cars without data

### Week 3: Forums
- [ ] Activate CorvetteForum adapter
- [ ] Activate S2Ki adapter
- [ ] Test FerrariChat (may need login)

### Week 4: Service Costs
- [ ] Extract costs from forum threads
- [ ] Research RepairPal API access
- [ ] Manual research for expensive exotics

---

## 🔑 Environment Variables Needed

```bash
# .env.local additions

# Apify (BaT fallback)
APIFY_API_KEY=your_key_here

# Proxy (optional, for high-volume)
BRIGHTDATA_PROXY_URL=http://user:pass@proxy.brightdata.com:22225
SMARTPROXY_URL=http://user:pass@gate.smartproxy.com:7000

# Captcha solving (last resort)
TWOCAPTCHA_API_KEY=your_key_here
```

---

## 💰 Cost Estimates

| Service | Usage | Monthly Cost |
|---------|-------|--------------|
| Apify BaT | 1000 results | ~$3 |
| Residential Proxies | 5GB | ~$50 |
| Captcha Solving | 500 solves | ~$1.50 |
| **Total (conservative)** | | **~$55/month** |

*Note: Many sources work with existing free scraping infrastructure*

---

*Last updated: December 23, 2024*

