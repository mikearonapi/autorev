# AutoRev Testing Guide

> Test strategy, test files, and how to run tests
>
> **Last Updated:** December 15, 2024

---

## Overview

AutoRev uses Node.js built-in test runner for unit and integration tests. Test files are located alongside their source files or in the `scripts/` directory.

| Test Type | Count | Location |
|-----------|-------|----------|
| Unit Tests | 6 | `lib/**/*.test.js` |
| Script Tests | 2 | `scripts/**/*.test.js` |
| Regression Tests | 2 | `scripts/` |
| Smoke Tests | 1 | `scripts/` |

---

## Running Tests

### All Tests

```bash
npm test
```

This runs:
```bash
node --test "lib/**/*.test.js" "scripts/**/*.test.js"
```

### Specific Test File

```bash
node --test lib/recallService.test.js
```

### AL Evaluation Tests

```bash
npm run al:eval
```

Runs regression tests for AL assistant quality.

### Smoke Tests

```bash
npm run smoke:parts-search-api
```

Quick API endpoint validation.

---

## Test Files

### Unit Tests (`lib/`)

| File | Tests |
|------|-------|
| `lib/recallService.test.js` | NHTSA recall fetching and parsing |
| `lib/forumScraper/adapters/vbulletinAdapter.test.js` | vBulletin forum scraping |
| `lib/eventSourceFetchers/eventbrite.test.js` | Eventbrite API integration |
| `lib/eventSourceFetchers/facebookEvents.test.js` | Facebook events parsing |
| `lib/eventSourceFetchers/carsandcoffeeevents.test.js` | Cars & Coffee events |

### Script Tests (`scripts/`)

| File | Tests |
|------|-------|
| `scripts/populate-known-issues.test.js` | Known issues data population |
| `scripts/al-eval-regression-tests.mjs` | AL response quality |
| `scripts/algorithm-regression-tests.js` | Scoring algorithm stability |

---

## Test Structure

### Basic Test Pattern

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('RecallService', () => {
  it('should fetch recalls for a valid car', async () => {
    const recalls = await fetchRecalls('Porsche', '911', 2020);
    assert.ok(Array.isArray(recalls));
    assert.ok(recalls.length >= 0);
  });

  it('should handle invalid input gracefully', async () => {
    const recalls = await fetchRecalls('InvalidBrand', 'InvalidModel', 1900);
    assert.deepStrictEqual(recalls, []);
  });
});
```

### Async Test Pattern

```javascript
import { describe, it, beforeEach, afterEach } from 'node:test';

describe('EventSourceFetcher', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  afterEach(() => {
    mockClient.cleanup();
  });

  it('should fetch events from Eventbrite', async () => {
    const events = await fetchEventbriteEvents({ location: 'San Francisco' });
    assert.ok(events.length > 0);
    assert.ok(events[0].name);
    assert.ok(events[0].start_date);
  });
});
```

---

## Regression Tests

### AL Evaluation (`al-eval-regression-tests.mjs`)

Tests AL assistant response quality against known-good responses.

```bash
npm run al:eval
```

**What it tests:**
- Response relevance to query
- Tool usage correctness
- Data accuracy
- Response formatting

**Test cases:**
```javascript
const testCases = [
  {
    query: "What's a good track car under $50k?",
    expectedTools: ['search_cars'],
    expectedMentions: ['Cayman', 'BRZ', 'Miata'],
  },
  {
    query: "Common issues with E46 M3?",
    expectedTools: ['get_known_issues'],
    expectedMentions: ['VANOS', 'subframe'],
  },
];
```

### Algorithm Regression (`algorithm-regression-tests.js`)

Ensures scoring algorithm produces consistent results.

```bash
node scripts/algorithm-regression-tests.js
```

**What it tests:**
- Score calculation consistency
- Ranking stability
- Edge case handling

---

## Smoke Tests

### Parts Search API (`smokePartsSearchApi.mjs`)

Quick validation that the parts API is working:

```bash
npm run smoke:parts-search-api
```

**Tests:**
- API responds with 200
- Returns valid JSON
- Parts have required fields
- Fitment data present

---

## Test Categories

### By Priority

| Priority | Type | Run Frequency |
|----------|------|---------------|
| P0 | Smoke tests | Every deploy |
| P1 | Unit tests | Every PR |
| P2 | Regression tests | Weekly |
| P3 | Full validation suite | Monthly |

### By Component

| Component | Test Coverage |
|-----------|---------------|
| Recall Service | ✅ Unit tests |
| Forum Scrapers | ✅ Unit tests |
| Event Fetchers | ✅ Unit tests |
| AL Assistant | ✅ Regression tests |
| Scoring Algorithm | ✅ Regression tests |
| Parts API | ✅ Smoke tests |
| User Auth | ❌ Manual testing |
| Payment Flow | ❌ Manual testing |

---

## Writing Tests

### Test File Location

Tests should be co-located with source files:

```
lib/
├── recallService.js
├── recallService.test.js    # ← Test file
├── forumScraper/
│   ├── adapters/
│   │   ├── vbulletinAdapter.js
│   │   └── vbulletinAdapter.test.js  # ← Test file
```

### Naming Convention

- Test files: `*.test.js` or `*.test.mjs`
- Test descriptions: Clear, behavior-focused

```javascript
// Good
it('should return empty array when no recalls found')
it('should handle network timeout gracefully')

// Bad
it('test1')
it('works')
```

### Test Isolation

Each test should be independent:

```javascript
describe('ForumScraper', () => {
  // ✅ Good - each test is isolated
  it('should scrape thread titles', async () => {
    const scraper = new ForumScraper();
    const result = await scraper.scrapeThreads(testUrl);
    assert.ok(result.threads.length > 0);
  });

  it('should extract post content', async () => {
    const scraper = new ForumScraper();
    const result = await scraper.scrapePosts(testThreadUrl);
    assert.ok(result.posts[0].content);
  });
});
```

---

## Mocking

### External API Mocking

For tests that would hit external APIs:

```javascript
import { mock } from 'node:test';

describe('NHTSAClient', () => {
  it('should parse recall response', async () => {
    // Mock the fetch call
    const mockFetch = mock.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ Results: [/* mock data */] }),
    }));
    
    global.fetch = mockFetch;
    
    const result = await fetchRecalls('Porsche', '911', 2020);
    assert.ok(mockFetch.mock.calls.length === 1);
  });
});
```

### Database Mocking

For tests that need database:

```javascript
// Use test database or mock Supabase client
const mockSupabase = {
  from: () => ({
    select: () => ({
      eq: () => Promise.resolve({ data: mockData, error: null }),
    }),
  }),
};
```

---

## Validation Suite

For comprehensive data validation:

```bash
node scripts/run-all-validations.js
```

**Runs:**
- Car data validation
- YouTube mapping validation
- Event URL validation
- Score audits
- Content linting

See [SCRIPTS.md](SCRIPTS.md) for full audit script documentation.

---

## CI/CD Testing

### Pre-Deploy Checks

Before each deployment:
1. `npm run lint` — ESLint
2. `npm test` — All tests
3. `npm run build` — Build check

### Recommended GitHub Actions

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run al:eval
```

---

## Test Coverage Goals

| Component | Current | Target |
|-----------|---------|--------|
| API Routes | 10% | 50% |
| Lib Services | 30% | 70% |
| Components | 0% | 30% |
| Scripts | 5% | 20% |

---

## Known Test Gaps

Areas that need test coverage:

1. **API Routes** — Need request/response testing
2. **React Components** — Need component testing (React Testing Library)
3. **Auth Flow** — Need end-to-end testing
4. **Database Operations** — Need integration tests
5. **Cron Jobs** — Need scheduled job testing

---

## Troubleshooting

### Test Timeout

```bash
# Increase timeout
node --test --test-timeout=30000 lib/recallService.test.js
```

### Network Tests Failing

```bash
# Skip network-dependent tests
SKIP_NETWORK_TESTS=true npm test
```

### Database Tests

```bash
# Use test database
DATABASE_URL=postgres://...test... npm test
```

---

*See [SCRIPTS.md](SCRIPTS.md) for test script details and [API.md](API.md) for API endpoint documentation.*













