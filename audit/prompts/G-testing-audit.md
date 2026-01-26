# AUDIT: Testing - Codebase-Wide

> **Audit ID:** G  
> **Category:** Cross-Cutting (Foundation)  
> **Priority:** 9 of 36  
> **Dependencies:** All previous audits (knows what needs testing)  
> **Downstream Impact:** Page audits will verify page-specific test coverage

---

## CONTEXT

This audit ensures AutoRev has adequate test coverage to prevent regressions, validate critical paths, and maintain confidence during refactoring. Insufficient testing leads to bugs in production, fear of changes, and technical debt.

**Key Focus Areas:**
- Unit test coverage for business logic
- Integration test coverage for API routes
- E2E test coverage for critical user journeys
- Test quality and maintainability
- CI/CD integration

---

## CRITICAL: Read These First

Before making ANY changes, read these documents completely:

1. `docs/SOURCE_OF_TRUTH.md` - Testing section
2. `.cursor/rules/specialists/quality/testing-agent.mdc` - Test patterns
3. `vitest.config.mts` - Test configuration
4. `tests/` - Existing test structure

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before writing ANY tests:

1. ✅ Understand what the code actually does
2. ✅ Check if tests already exist elsewhere
3. ✅ Prioritize high-impact, high-risk code
4. ❌ Do NOT write tests for trivial code
5. ❓ If unsure what to test, focus on business logic

---

## TEST PRIORITY MATRIX

| Priority | Always Test | Usually Test | Rarely Test |
|----------|-------------|--------------|-------------|
| **High** | Performance calculations | Component interactions | Styling |
| **High** | car_id resolution | API responses | Static content |
| **High** | Tier access logic | Form validation | |
| **Medium** | Data transformations | Loading/error states | |
| **Medium** | Auth flows | Navigation | |

---

## TEST TYPES & TOOLS

| Type | Tool | Location | Purpose |
|------|------|----------|---------|
| **Unit** | Vitest | `tests/unit/` | Pure functions, utilities |
| **Integration** | Vitest | `tests/integration/` | API routes, services |
| **E2E** | Playwright | `tests/e2e/` | User journeys |
| **Component** | Testing Library | `tests/` | React components |

---

## CHECKLIST

### A. Unit Test Coverage (CRITICAL)

- [ ] `lib/performanceCalculator/` - All calculation functions
- [ ] `lib/carResolver.js` - Slug resolution logic
- [ ] `lib/scoring.js` - Scoring algorithms
- [ ] `lib/tunabilityCalculator.js` - Tunability logic
- [ ] Data transformations in utilities
- [ ] Edge cases: null, empty, boundary values

### B. Integration Test Coverage

- [ ] All API routes have basic tests
- [ ] Auth-required routes test authentication
- [ ] Validation errors return proper responses
- [ ] Database operations tested with mocks or test DB
- [ ] External service calls mocked

### C. E2E Test Coverage

- [ ] Critical user journeys covered:
  - [ ] Sign up / Login flow
  - [ ] Add vehicle to garage
  - [ ] Configure build
  - [ ] View performance data
  - [ ] AL conversation
- [ ] Mobile viewports tested
- [ ] Error states tested

### D. Test Quality

- [ ] Tests are independent (no order dependency)
- [ ] Tests have descriptive names
- [ ] Tests follow AAA pattern (Arrange, Act, Assert)
- [ ] Tests don't test implementation details
- [ ] Mocks are minimal and focused
- [ ] No flaky tests

### E. Coverage Gaps

- [ ] Identify untested critical paths
- [ ] Identify complex functions without tests
- [ ] Identify recently changed code without tests
- [ ] Map test coverage to risk areas

### F. Test Infrastructure

- [ ] CI runs tests on every PR
- [ ] Test failures block merge
- [ ] Coverage reports generated
- [ ] Test database/fixtures maintained
- [ ] Snapshot tests updated appropriately

### G. AL/AI Testing

- [ ] Golden dataset exists (`tests/data/al-golden-dataset.json`)
- [ ] Evaluation service tested
- [ ] Safety tests for jailbreak prevention
- [ ] Citation parser tests
- [ ] Intent classifier tests

---

## KEY FILES TO EXAMINE

### Test Configuration

| File | Purpose |
|------|---------|
| `vitest.config.mts` | Vitest configuration |
| `playwright.config.ts` | E2E configuration |
| `tests/setup.tsx` | Test setup and mocks |

### Existing Tests

| Location | Type |
|----------|------|
| `tests/unit/` | Unit tests |
| `tests/integration/` | Integration tests |
| `tests/e2e/` | E2E tests |
| `tests/safety/` | AL safety tests |

### Critical Code Needing Tests

| File | Risk Level | Why |
|------|------------|-----|
| `lib/performanceCalculator/` | High | Core business logic |
| `lib/carResolver.js` | High | Data integrity |
| `lib/scoring.js` | High | User-facing scores |
| `lib/stripe.js` | High | Payment logic |
| `app/api/webhooks/stripe/` | High | Payment processing |
| `lib/alConversationService.js` | Medium | AI interactions |

---

## AUTOMATED CHECKS

### Run Test Suite

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/unit/performance-calculator.test.js

# Run E2E tests
npm run test:e2e

# Run E2E tests headed (visible browser)
npm run test:e2e -- --headed
```

### Coverage Analysis

```bash
# Generate coverage report
npm run test:coverage

# Check coverage thresholds
# Look for:
# - Overall coverage %
# - Uncovered lines in critical files
# - Functions with 0% coverage
```

### Find Untested Code

```bash
# 1. Find exported functions in lib/ without tests
for f in lib/*.js; do
  name=$(basename "$f" .js)
  if ! grep -r "$name" tests/ > /dev/null 2>&1; then
    echo "No tests found for: $f"
  fi
done

# 2. Find API routes without tests
for route in $(find app/api -name "route.js"); do
  endpoint=$(echo "$route" | sed 's|app/api||' | sed 's|/route.js||')
  if ! grep -r "$endpoint" tests/ > /dev/null 2>&1; then
    echo "No tests for API: $endpoint"
  fi
done

# 3. Find complex functions (>50 lines) without tests
# Manual review recommended

# 4. List test files by last modified
ls -lt tests/**/*.test.js | head -20
```

### Test Quality Checks

```bash
# Find tests with only one assertion (potentially weak)
grep -rn "expect(" tests/ | cut -d: -f1 | sort | uniq -c | sort -n | head -20

# Find tests using .skip
grep -rn "\.skip\|\.only" tests/

# Find potential test pollution (shared state)
grep -rn "beforeAll\|afterAll" tests/ | grep -v "beforeEach\|afterEach"
```

---

## SOURCE OF TRUTH PATTERNS

From Testing Agent:

### Unit Test Pattern

```typescript
import { describe, it, expect } from 'vitest';
import { calculateHpGain } from '@/lib/performanceCalculator';

describe('calculateHpGain', () => {
  it('calculates positive gain correctly', () => {
    // Arrange
    const stock = 444;
    const modified = 543;
    
    // Act
    const result = calculateHpGain(stock, modified);
    
    // Assert
    expect(result).toBe(99);
  });

  it('handles null stock value', () => {
    expect(calculateHpGain(null, 543)).toBeNull();
  });

  it('handles zero values', () => {
    expect(calculateHpGain(0, 100)).toBe(100);
  });

  it('handles negative result (loss)', () => {
    expect(calculateHpGain(500, 450)).toBe(-50);
  });
});
```

### Integration Test Pattern

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/cars/[slug]/route';

describe('GET /api/cars/[slug]', () => {
  it('returns car data for valid slug', async () => {
    const request = new Request('http://localhost/api/cars/bmw-m3-2024');
    const response = await GET(request, { params: { slug: 'bmw-m3-2024' } });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data).toHaveProperty('make', 'BMW');
  });

  it('returns 404 for invalid slug', async () => {
    const request = new Request('http://localhost/api/cars/invalid-car');
    const response = await GET(request, { params: { slug: 'invalid-car' } });
    
    expect(response.status).toBe(404);
  });
});
```

### E2E Test Pattern

```typescript
import { test, expect } from '@playwright/test';

test.describe('Garage Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/garage');
  });

  test('user can add vehicle to garage', async ({ page }) => {
    await page.click('[data-testid="add-vehicle"]');
    await page.fill('[data-testid="car-search"]', 'BMW M3');
    await page.click('[data-testid="car-result-bmw-m3-2024"]');
    await page.click('[data-testid="add-to-garage"]');
    
    await expect(page.locator('[data-testid="garage-vehicle"]')).toContainText('BMW M3');
  });
});
```

---

## TEST COVERAGE TARGETS

| Category | Target | Current | Gap |
|----------|--------|---------|-----|
| **Overall** | > 70% | | |
| **lib/performanceCalculator/** | > 90% | | |
| **lib/carResolver.js** | > 90% | | |
| **API Routes** | > 80% | | |
| **Critical Hooks** | > 80% | | |

---

## DELIVERABLES

### 1. Coverage Report

| Area | Files | Lines | Functions | Branches |
|------|-------|-------|-----------|----------|
| lib/ | | | | |
| app/api/ | | | | |
| hooks/ | | | | |
| **Total** | | | | |

### 2. Gap Analysis

| Priority | File/Area | Current Coverage | Risk | Recommendation |
|----------|-----------|------------------|------|----------------|
| High | | | | |
| Medium | | | | |
| Low | | | | |

### 3. Test Health

| Metric | Value | Status |
|--------|-------|--------|
| Total tests | | |
| Passing | | |
| Failing | | |
| Skipped | | |
| Flaky | | |
| Avg duration | | |

---

## VERIFICATION

- [ ] `npm test` passes with no failures
- [ ] Coverage meets targets (>70% overall)
- [ ] All critical business logic has tests
- [ ] No skipped tests without justification
- [ ] E2E tests cover main user journeys
- [ ] CI runs tests on every PR

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | All tests pass (`npm test` green) |
| 2 | Coverage > 70% overall |
| 3 | performanceCalculator coverage > 90% |
| 4 | All API routes have integration tests |
| 5 | Critical E2E journeys covered |
| 6 | No flaky tests |
| 7 | Test gaps documented with priorities |

---

## OUTPUT FORMAT

```
🧪 TESTING AUDIT RESULTS

**Test Suite Health:**
- Total: X tests
- Passing: X ✅
- Failing: X ❌
- Skipped: X ⏭️

**Coverage:**
| Area | Coverage | Target | Status |
|------|----------|--------|--------|
| Overall | X% | 70% | ✅/❌ |
| lib/ | X% | 80% | ✅/❌ |
| API routes | X% | 80% | ✅/❌ |

**Critical Gaps:**
1. [file] - No tests, high risk
2. [file] - Low coverage (X%), handles [critical function]
...

**Flaky Tests:**
1. [test file] - [description of flakiness]
...

**Recommendations:**
1. [Priority] Add tests for [file/function]
2. [Priority] Fix flaky test in [file]
...

**Patterns for Page Audits:**
- Verify page has E2E coverage
- Check component tests exist
...
```

---

## AUDIT EXECUTION LOG

| Date | Auditor | Tests Passing | Coverage | Gaps Found | Notes |
|------|---------|---------------|----------|------------|-------|
| | | | | | |

---

*Audit prompt generated: January 25, 2026*  
*Part of AutoRev Systematic Audit Suite (36 total audits)*
