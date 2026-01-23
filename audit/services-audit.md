# Services/Lib Audit Report

**Generated:** 2026-01-22
**Scope:** All files in `/lib/` directory

---

## CRITICAL FINDING: Performance Calculator Duplication

### P0: 5 Files Implementing HP/Performance Calculations

The codebase has **5 separate files** implementing overlapping performance/HP calculation logic:

| File | Primary Functions | Lines | Status |
|------|-------------------|-------|--------|
| `lib/performance.js` | `calculateUpgradedMetrics()`, `getStockPerformanceScores()` | 526 | Active |
| `lib/performanceCalculatorV2.js` | `calculateBuildPerformance()`, `calculateSmartHpGainV2()` | 768 | "NEW" - Feature flagged |
| `lib/buildPerformanceCalculator.js` | `calculateBuildPerformance()`, `calculateMultiplierBased()` | 431 | Active |
| `lib/upgradeCalculator.js` | `calculateSmartHpGain()`, `detectUpgradeConflicts()` | 519 | Active |
| `lib/upgrades.js` | `calculateAllModificationGains()`, `calculateHpGainsForCar()` | 734 | Active |

### Duplicated Constant: `STAGE_TUNE_INCLUDED_MODS`

This constant is **duplicated in 5 files**:

```
lib/upgrades.js:616
lib/performance.js:121
lib/buildPerformanceCalculator.js:294
lib/performanceCalculatorV2.js:109
lib/upgradeCalculator.js:53
```

**Risk:** If stage tune definitions change, 5 files need updating. Inconsistencies will cause incorrect HP calculations.

### Recommended Consolidation

**Target:** Single source of truth for performance calculations

```
lib/performanceCalculator/
├── index.js                 # Public API exports
├── constants.js             # STAGE_TUNE_INCLUDED_MODS, CATEGORY_CAPS, etc.
├── hpCalculator.js          # HP gain calculations
├── conflictDetector.js      # Detect upgrade conflicts
├── metricCalculator.js      # Calculate all metrics (0-60, braking, etc.)
└── types.js                 # TypeScript interfaces (optional)
```

---

## P1: Car ID Resolution Duplication

### `resolveCarId()` function exists in 3 files:

| File | Line | Exported | Notes |
|------|------|----------|-------|
| `lib/carResolver.js` | 21 | ✅ Yes | **Canonical** - Has caching, batch support |
| `lib/userDataService.js` | 29 | ❌ No | Local duplicate, no caching |
| `lib/knowledgeIndexService.js` | 37 | ❌ No | Local duplicate, different signature |

**Recommendation:** Remove duplicates, import from `lib/carResolver.js` everywhere.

---

## Service File Inventory

### A. Core Data Services

| File | Purpose | DB Tables | Exports |
|------|---------|-----------|---------|
| `carsClient.js` | Fetch car data | `cars` | `fetchCars`, `fetchCarBySlug`, `searchCars` |
| `carResolver.js` | Slug→ID resolution | `cars` | `resolveCarId`, `resolveCarIds` |
| `carsCache.js` | Server-side caching | - | Next.js unstable_cache wrappers |
| `userDataService.js` | User CRUD operations | `user_favorites`, `user_vehicles`, `user_projects` | 50+ functions |

### B. Performance & Tuning Services

| File | Purpose | Notes |
|------|---------|-------|
| `performance.js` | Performance HUB helpers | **Duplicated logic** |
| `performanceCalculatorV2.js` | V2 unified calculator | Feature flagged |
| `buildPerformanceCalculator.js` | Build calculations | **Duplicated logic** |
| `upgradeCalculator.js` | Smart HP calculations | **Duplicated logic** |
| `upgrades.js` | Unified upgrade API | **Duplicated logic** |
| `tuningProfiles.js` | Tuning profile data | |
| `tuningValidation.js` | Validate tuning data | |
| `tunabilityCalculator.js` | Calculate tunability score | |

### C. AI/AL Services

| File | Purpose | Notes |
|------|---------|-------|
| `alTools.js` | AL tool definitions | 2,000+ lines |
| `alConfig.js` | AL configuration | |
| `alConversationService.js` | Conversation management | |
| `alPromptService.js` | Prompt generation | |
| `alUsageService.js` | Usage tracking | |
| `alEvaluations.js` | AL evaluation | |
| `alEvaluationRunner.js` | Run evaluations | |
| `alContentGapResolver.js` | Content gap analysis | |
| `alCitationParser.js` | Parse citations | |
| `alToolCache.js` | Tool result caching | |
| `alIntelligence.js` | Intelligence layer | |
| `aiMechanicService.js` | AI mechanic responses | |

### D. Content Services

| File | Purpose | Notes |
|------|---------|-------|
| `articlesService.js` | Article CRUD | |
| `articleGenerationService.js` | Generate articles | |
| `articleResearchService.js` | Research for articles | |
| `articleQAService.js` | QA articles | |
| `articleImageService.js` | Article images | |
| `articleImageStrategyV2.js` | V2 image strategy | |
| `articleDataSync.js` | Sync article data | |
| `youtubeClient.js` | YouTube API | |

### E. Data Enrichment Services

| File | Purpose | Notes |
|------|---------|-------|
| `enrichedDataService.js` | Enriched car data | |
| `maintenanceService.js` | Maintenance data | |
| `recallService.js` | Recall data | |
| `complaintService.js` | Complaint data | |
| `nhtsaSafetyService.js` | NHTSA safety data | |
| `nhtsaClient.js` | NHTSA API client | |
| `epaFuelEconomyService.js` | EPA fuel data | |
| `lapTimeService.js` | Lap time data | |
| `lapTimesScraper.js` | Scrape lap times | |

### F. Parts & Fitment Services

| File | Purpose | Notes |
|------|---------|-------|
| `fitmentService.js` | Fitment data | |
| `fitmentResolver.js` | Resolve fitments | |
| `fitmentNormalizer.js` | Normalize fitment data | |
| `partsCatalog.js` | Parts catalog | |
| `partsQualityService.js` | Parts quality scores | |
| `partsVendors.js` | Vendor configuration | |
| `partsVendorIngestionService.js` | Ingest vendor data | |
| `semaDataClient.js` | SEMA API client | |
| `semaDataService.js` | SEMA data service | |
| `semaFitmentMapper.js` | Map SEMA fitments | |

### G. Events Services

| File | Purpose | Notes |
|------|---------|-------|
| `eventsService.js` | Event CRUD | |
| `eventsIngestion/buildEventRows.js` | Build event rows | |
| `eventDeduplication.js` | Deduplicate events | |
| `eventSourceFetchers/` | 14 source fetchers | SCCA, PCA, Eventbrite, etc. |

### H. Community Services

| File | Purpose | Notes |
|------|---------|-------|
| `communityService.js` | Community features | |
| `feedAlgorithm.js` | Feed ranking | |
| `commentModerationService.js` | Comment moderation | |
| `redditInsightService.js` | Reddit insights | |
| `forumScraper/` | Forum scraping | |
| `forumConfigs.js` | Forum configurations | |

### I. Infrastructure Services

| File | Purpose | Notes |
|------|---------|-------|
| `supabase.js` | Supabase client (browser) | |
| `supabaseClient.js` | Supabase client alias | Duplicate? |
| `supabaseServer.js` | Server-side Supabase | |
| `stripe.js` | Stripe integration | |
| `discord.js` | Discord webhooks | |
| `discordAlerts.js` | Discord alerts | Duplicate of discord.js? |
| `email.js` | Email sending | |
| `storage.js` | Storage utilities | |
| `sessionCache.js` | Session caching | |

### J. Analytics & Logging

| File | Purpose | Notes |
|------|---------|-------|
| `ga4.ts` | Google Analytics 4 | Only .ts file |
| `activityTracker.js` | Activity tracking | |
| `errorLogger.js` | Error logging | |
| `serverErrorLogger.js` | Server error logging | Duplicate? |
| `errorAggregator.js` | Aggregate errors | |
| `errorAnalysis.js` | Analyze errors | |
| `backendAiLogger.js` | Backend AI logging | |
| `pipelineLogger.js` | Pipeline logging | |
| `observability.js` | Observability | |
| `metaConversionsApi.js` | Meta CAPI | |

---

## Potential Duplications to Investigate

### 1. Discord Integration
- `lib/discord.js` - Discord webhooks
- `lib/discordAlerts.js` - Discord alerts

**Question:** Are these redundant or serving different purposes?

### 2. Error Logging
- `lib/errorLogger.js`
- `lib/serverErrorLogger.js`
- `lib/errorAggregator.js`
- `lib/errorAnalysis.js`

**Question:** Should these be consolidated?

### 3. Supabase Clients
- `lib/supabase.js`
- `lib/supabaseClient.js`
- `lib/supabaseServer.js`

**Question:** Is `supabaseClient.js` a duplicate of `supabase.js`?

---

## Recommendations

### Immediate (P0)
1. **Consolidate performance calculators** into single module
2. **Remove duplicate `resolveCarId`** implementations
3. **Extract `STAGE_TUNE_INCLUDED_MODS`** to single constants file

### Short-term (P1)
1. Audit Discord integrations
2. Audit error logging services
3. Document which Supabase client to use where

### Long-term (P2)
1. Consider splitting `alTools.js` (2,000+ lines)
2. Consider splitting `userDataService.js` (1,000+ lines)
3. Add TypeScript interfaces for major services

---

## File Count Summary

| Category | Files | Lines (est.) |
|----------|-------|--------------|
| Core Data | 4 | ~2,000 |
| Performance/Tuning | 8 | ~4,000 |
| AI/AL | 11 | ~8,000 |
| Content | 8 | ~3,000 |
| Data Enrichment | 8 | ~2,500 |
| Parts/Fitment | 9 | ~3,000 |
| Events | 15+ | ~2,500 |
| Community | 6 | ~2,000 |
| Infrastructure | 9 | ~1,500 |
| Analytics | 10 | ~2,000 |
| **Total** | **~90 service files** | **~30,000 lines** |
