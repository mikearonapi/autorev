# Apify Data Strategy

> Strategic alignment between Apify scrapers and AutoRev data needs.

## Current Data Gaps

| Table | Records | Cars Covered | Coverage |
|-------|---------|--------------|----------|
| `community_insights` | 1,593 | 12 | **4%** |
| `car_market_pricing` | 10 | 10 | **3%** |

**Total cars in database: 310**

---

## 1. BaT → Market Pricing (P1 Priority)

### Current Problem
- **0% BaT coverage** - all `bat_*` fields are NULL
- `car_market_pricing` only has Cars.com listing data
- Missing real transaction data from enthusiast auctions

### Apify BaT Data Available

```javascript
// From parseforge/bringatrailer-auctions-scraper
{
  title: "1987 Lamborghini Countach 5000 QV",
  year: 1968,
  currentBid: 290000,
  auctionStatus: "live",  // or "sold"
  auctionUrl: "https://...",
  reserveMet: false,
  noReserve: false,
  location: "United States",
  description: "Full auction description...",
  images: ["https://..."],
}
```

### Database Mapping

| Apify Field | DB Column | Transformation |
|-------------|-----------|----------------|
| `currentBid` (from sold auctions) | `bat_avg_price` | Average of all sold prices |
| `currentBid` (from sold auctions) | `bat_median_price` | Median of all sold prices |
| `currentBid` (min) | `bat_min_price` | Minimum sold price |
| `currentBid` (max) | `bat_max_price` | Maximum sold price |
| count of sold auctions | `bat_sample_size` | Number of sales |
| sold / (sold + reserve not met) | `bat_sell_through_rate` | Sell-through ratio |
| - | `bat_fetched_at` | `new Date().toISOString()` |

### App Usage

1. **MarketValueSection.jsx** - Displays BaT pricing to users:
   ```jsx
   {marketData.bat_avg_price && (
     <div className={styles.sourceCard}>
       <span className={styles.sourceName}>Bring a Trailer</span>
       <span>Average: {formatPrice(marketData.bat_avg_price)}</span>
       <span>Range: {formatPrice(bat_min_price)} - {formatPrice(bat_max_price)}</span>
       <span>Sales: {marketData.bat_sample_size}</span>
     </div>
   )}
   ```

2. **AL (AI Assistant)** - Can reference actual sale prices when discussing value

### Recommended Scrape Strategy

```javascript
// For each car in our database:
const query = `${car.name} ${car.years}`; // e.g., "BMW M3 E92 2008-2013"

// Apify returns auctions → filter by:
// 1. auctionStatus === "sold" (completed sales only)
// 2. year within car's year range
// 3. Title contains model name (fuzzy match)

// Aggregate results:
const soldPrices = auctions.filter(a => a.sold).map(a => a.currentBid);
{
  bat_avg_price: average(soldPrices),
  bat_median_price: median(soldPrices),
  bat_min_price: Math.min(...soldPrices),
  bat_max_price: Math.max(...soldPrices),
  bat_sample_size: soldPrices.length,
  bat_fetched_at: new Date().toISOString(),
}
```

---

## 2. Reddit → Community Insights (P1 Priority)

### Current Problem
- Only 12 cars have community insights (4% coverage)
- Currently sourced only from enthusiast forums (bimmerpost, rennlist)
- Missing broader community knowledge from Reddit

### Apify Reddit Data Available

```javascript
// From crawlerbros/reddit-scraper
{
  subreddit: "cars",
  post_id: "1qh4x9i",
  title: "2026 Subaru WRX base model returns...",
  author: "rockycrab",
  content: "Full post text with owner experiences...",
  score: 697,           // Upvotes
  num_comments: 199,
  url: "https://reddit.com/r/cars/comments/...",
}
```

### Database Mapping

| Apify Field | DB Column | Transformation |
|-------------|-----------|----------------|
| `title` | `title` | Direct |
| `content` (first 500 chars) | `summary` | Truncated + cleaned |
| `content` (full) | `details.content` | Full text in JSONB |
| `score` + `num_comments` | `confidence` | `Math.min(0.95, (score + comments) / 500)` |
| `score` / 10 | `consensus_strength` | 'strong' if >100, 'moderate' if >20, 'single_source' |
| `subreddit` | `source_forum` | `reddit:${subreddit}` |
| `[url]` | `source_urls` | Array with post URL |
| Classified by content | `insight_type` | See classification below |

### Insight Type Classification

```javascript
const INSIGHT_KEYWORDS = {
  known_issue: ['problem', 'issue', 'fail', 'broke', 'recall', 'defect', 'warning'],
  reliability_report: ['reliable', 'reliability', 'long-term', 'miles', 'ownership'],
  maintenance_tip: ['maintenance', 'oil change', 'service', 'interval', 'DIY'],
  cost_insight: ['cost', 'price', 'expensive', 'cheap', 'worth', 'value', '$'],
  buying_guide: ['buying', 'purchase', 'should I buy', 'looking for', 'PPI'],
  modification_guide: ['mod', 'upgrade', 'tune', 'install', 'build'],
  comparison: ['vs', 'versus', 'compared to', 'better than', 'or'],
};

function classifyInsight(post) {
  const text = (post.title + ' ' + post.content).toLowerCase();
  for (const [type, keywords] of Object.entries(INSIGHT_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) return type;
  }
  return 'reliability_report'; // Default for general discussion
}
```

### App Usage

1. **AL `search_community_insights` tool** - Semantic search over insights:
   ```javascript
   // AL can search for owner experiences
   const results = await searchCommunityInsights({
     query: "BMW M3 rod bearing issues",
     car_slug: "bmw-m3-e92",
     insight_types: ["known_issue", "reliability_report"]
   });
   ```

2. **Content enrichment** - Provides real owner voices in AI responses

### Recommended Scrape Strategy

```javascript
// Brand-specific subreddits to scrape:
const BRAND_SUBREDDITS = {
  BMW: ['BMW', 'BMWM'],
  Porsche: ['Porsche', 'Porsche911'],
  Toyota: ['Toyota', 'ToyotaTacoma', 'ft86club'],
  Subaru: ['subaru', 'WRX'],
  Mazda: ['Mazda', 'Miata'],
  Ford: ['Ford', 'Mustang'],
  Chevrolet: ['Corvette', 'Camaro'],
  Honda: ['Honda', 'civic'],
  Nissan: ['Nissan', '350z', 'GT-R'],
  // General
  general: ['cars', 'Autos', 'whatcarshouldIbuy', 'MechanicAdvice', 'projectcar'],
};

// For each car:
// 1. Get brand-specific subreddits
// 2. Scrape top posts from those subreddits
// 3. Filter posts that mention the car model
// 4. Classify insight type
// 5. Save to community_insights
```

---

## 3. What NOT to Scrape

### Data We Already Have Good Sources For

| Data Type | Current Source | Coverage | Don't Use Apify For |
|-----------|---------------|----------|---------------------|
| Car specs | NHTSA + manual entry | 100% | Basic specs |
| Known issues | NHTSA recalls + forums | 85% | Recall data |
| Maintenance specs | Manual + AI | 90% | Service intervals |
| Dyno data | Direct entry | 15% | Performance numbers |
| YouTube videos | YouTube API | 95% | Video content |

### Reddit Data to Filter OUT

```javascript
// Skip posts that are:
const SKIP_CRITERIA = [
  post.score < 5,              // Low engagement
  post.content.length < 100,   // Too short
  post.is_ad,                  // Promotions
  post.title.includes('[WTS]'), // For sale posts
  post.title.includes('[WTB]'), // Want to buy posts
  post.author === 'AutoModerator', // Bot posts
];
```

---

## 4. Quality Thresholds

### For community_insights

| Field | Minimum | Ideal |
|-------|---------|-------|
| `confidence` | 0.5 | > 0.7 |
| `content.length` | 100 chars | > 500 chars |
| `score` | 5 upvotes | > 50 upvotes |
| `num_comments` | 2 | > 10 |

### For car_market_pricing

| Field | Minimum | Ideal |
|-------|---------|-------|
| `bat_sample_size` | 3 sales | > 10 sales |
| Year match | ±2 years | Exact year range |
| Status | Sold only | Reserve met |

---

## 5. Implementation Checklist

### Phase 1: BaT Market Pricing (Week 1)
- [x] Apify BaT scraper integration (`lib/apifyClient.js`)
- [ ] Create `scripts/apify/backfill-bat-pricing.mjs`
- [ ] Run for 50 highest-traffic cars first
- [ ] Verify data appears in MarketValueSection

### Phase 2: Reddit Insights (Week 2)
- [x] Apify Reddit scraper integration
- [x] Create `lib/redditInsightService.js` with classification
- [ ] Create `scripts/apify/backfill-reddit-insights.mjs`
- [ ] Run for cars with 0 insights first
- [ ] Verify AL can search new insights

### Phase 3: Automation (Week 3)
- [ ] Add cron job for weekly BaT refresh
- [ ] Add cron job for monthly Reddit sweep
- [ ] Monitor Apify costs via dashboard
- [ ] Add coverage metrics to admin dashboard

---

## 6. Cost Estimates

| Task | Items | Rate | Estimated Cost |
|------|-------|------|----------------|
| BaT initial backfill | 310 cars × 30 results | ~$0.01/result | ~$93 |
| BaT monthly refresh | 50 popular cars | ~$0.01/result | ~$15/month |
| Reddit initial backfill | 310 cars × 20 posts | $2.50/1K | ~$16 |
| Reddit monthly refresh | 310 cars × 5 posts | $2.50/1K | ~$4/month |
| **Total Initial** | | | **~$109** |
| **Monthly Ongoing** | | | **~$19/month** |

---

## 7. Success Metrics

After implementation, we should see:

| Metric | Before | Target |
|--------|--------|--------|
| `car_market_pricing` BaT coverage | 0% | 80%+ |
| `community_insights` car coverage | 4% | 50%+ |
| AL can answer pricing questions | No | Yes |
| MarketValueSection shows BaT data | No | Yes |

---

## Files Created/Modified

| File | Purpose |
|------|---------|
| `lib/apifyClient.js` | Core Apify API client |
| `lib/redditInsightService.js` | Reddit → insights transformation |
| `scripts/run-apify-scrape.mjs` | CLI for manual runs |
| `scripts/test-apify.mjs` | Integration tests |
| `lib/scrapers/bringATrailerScraper.js` | Added Apify fallback |
