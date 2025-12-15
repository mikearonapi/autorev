# AutoRev Data Coverage Tracker

Last Updated: December 15, 2024

## Current Status Overview

| Category | Coverage | Target | Status | Script |
|----------|----------|--------|--------|--------|
| Basic Car Data | 98/98 (100%) | 100% | ✅ Complete | - |
| Fuel Economy | 98/98 (100%) | 100% | ✅ Complete | - |
| Safety Ratings | 98/98 (100%) | 100% | ✅ Complete | - |
| Service Intervals | 98/98 (100%) | 100% | ✅ Complete | - |
| Oil/Coolant/Brake | 97-98/98 (99%) | 95% | ✅ Complete | - |
| Known Issues | 78/98 (80%) | 95% | 🟡 Good | `enrichIssuesFromComplaints.js` |
| Diff Fluid | 82/98 (84%) | 95% | 🟡 Good | Some N/A for FWD |
| Trans Fluid | 67-69/98 (70%) | 95% | 🟠 Needs Work | `enrichTransFluidAI.js` |
| Recalls | 60/98 (61%) | 75%* | 🟠 Acceptable | `enrichRecallsAll.js` |
| Spark Plugs | 1/98 (1%) | 95% | 🔴 Critical | `enrichSparkPlugsAI.js` |
| Market Pricing | 10/98 (10%) | - | 🚫 BLOCKED | See blockers |

*Recall target lowered to 75% - many exotic cars genuinely have few/no recalls

---

## Action Plan

### Phase 1: AI Enrichment (In Progress)

#### 1. Spark Plugs (1% → 95%)
```bash
# Test single car first
node scripts/enrichSparkPlugsAI.js --car=bmw-m3-e46 --verbose

# Run for all (takes ~3-4 min with 2s delay)
node scripts/enrichSparkPlugsAI.js
```
- **Cost estimate**: ~$0.10 for 98 cars (gpt-4o-mini)
- **Time estimate**: ~4 minutes

#### 2. Transmission Fluid (70% → 95%)
```bash
# Test single car first
node scripts/enrichTransFluidAI.js --car=bmw-m3-e46 --verbose

# Run for all missing (~30 cars)
node scripts/enrichTransFluidAI.js
```
- **Cost estimate**: ~$0.03 for 30 cars
- **Time estimate**: ~1.5 minutes

### Phase 2: Recall Improvements

#### 3. Fix Mercedes/Mazda Normalization
The recall service isn't matching:
- Mercedes-AMG → should query as "Mercedes-Benz"
- Mazda MX-5 Miata → should query as "Mazda" + "MX-5 Miata"

Script: `lib/recallService.js` - update `MODEL_NAME_MAP`

### Phase 3: Known Issues (if needed)

Current: 80% coverage
If we need more:
- Lower threshold from 3 → 2 complaints
- Add more forum sources

---

## Blockers (Parked)

### Market Pricing (10%)
**Issue**: Cars.com has aggressive rate limiting
**Impact**: Low priority for now - users can see market data elsewhere
**Options for future**:
1. Slow scraping over multiple days
2. Use Bring a Trailer API (if available)
3. Partner with a pricing data provider

---

## Scripts Reference

| Script | Purpose | Status |
|--------|---------|--------|
| `enrichSparkPlugsAI.js` | AI spark plug research | ✅ Ready |
| `enrichTransFluidAI.js` | AI trans fluid research | ✅ Ready |
| `enrichRecallsAll.js` | NHTSA recalls batch | ✅ Working |
| `enrichIssuesFromComplaints.js` | NHTSA complaints → issues | ✅ Working |
| `scrapeValidatedPricing.js` | Cars.com pricing | 🚫 Rate limited |
| `enrichFreeApisDirect.js` | EPA + NHTSA safety | ✅ Working |
| `runDataEnrichment.js` | Master orchestrator | ✅ Working |

---

## Run Order

```bash
# 1. Spark plugs (critical gap)
node scripts/enrichSparkPlugsAI.js

# 2. Trans fluid (smaller gap)
node scripts/enrichTransFluidAI.js

# 3. Verify coverage
node scripts/runDataEnrichment.js --status
```

---

## Completion Criteria

Database is "complete" when:
- [x] All 98 cars have basic data
- [x] Fuel economy: 100%
- [x] Safety ratings: 100%
- [x] Known issues: 80%+ ✅
- [ ] Recalls: 75%+ (currently 61%)
- [ ] Spark plugs: 95%+ (currently 1%)
- [ ] Trans fluid: 95%+ (currently 70%)
- [ ] Market pricing: PARKED (10%)

