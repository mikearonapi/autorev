# Technical Debt Inventory

**Generated:** January 27, 2026  
**Codebase:** 375,926 lines of JS/JSX across 1,057 files

---

## 1. Large Files (Refactoring Candidates)

Files over 1,500 lines that should be split into smaller, focused modules:

| File                                    | Lines | Priority  | Recommendation                                     |
| --------------------------------------- | ----- | --------- | -------------------------------------------------- |
| `components/UpgradeCenter.module.css`   | 7,128 | 🔴 High   | Split by section (hero, config, results, etc.)     |
| `app/(app)/garage/page.module.css`      | 7,051 | 🔴 High   | Split by component (vehicle card, list, modals)    |
| `data/cars.js`                          | 6,410 | 🟡 Medium | Consider database migration                        |
| `lib/alTools.js`                        | 5,986 | 🔴 High   | Split by tool category                             |
| `app/(app)/garage/page.jsx`             | 4,547 | 🔴 High   | Extract components (VehicleCard, BuildPanel, etc.) |
| `data/upgradeEducation.js`              | 4,069 | 🟡 Medium | Move to database or CMS                            |
| `components/PerformanceHub.module.css`  | 4,052 | 🟡 Medium | Split by section                                   |
| `lib/alConfig.js`                       | 2,949 | 🟡 Medium | Split into separate config modules                 |
| `lib/emailService.js`                   | 2,869 | 🟡 Medium | Extract template rendering                         |
| `app/api/ai-mechanic/route.js`          | 1,954 | 🔴 High   | Extract into service layer                         |
| `app/(app)/al/ALPageClient.jsx`         | 1,929 | 🟡 Medium | Extract ChatMessage, ConversationList              |
| `components/providers/AuthProvider.jsx` | 1,915 | 🟡 Medium | Extract session management                         |
| `components/UpgradeCenter.jsx`          | 1,777 | 🟡 Medium | Extract sub-components                             |

---

## 2. CSS Technical Debt

### Duplicate Selectors (conflicting styles)

| File                                             | Duplicates | Status                               |
| ------------------------------------------------ | ---------- | ------------------------------------ |
| `components/UpgradeCenter.module.css`            | 27+        | ⚠️ Suppressed with stylelint-disable |
| `app/(app)/garage/page.module.css`               | 7          | Needs fixing                         |
| `app/(app)/browse-cars/[slug]/page.module.css`   | 4          | Needs fixing                         |
| `app/admin/components/EmailDashboard.module.css` | 3          | Needs fixing                         |
| Other files (10+)                                | 1-2 each   | Low priority                         |

### Action Items:

1. Consolidate duplicate selectors with different styles
2. Consider CSS-in-JS or Tailwind for better maintainability
3. Create shared component library for common patterns

---

## 3. Code Quality Markers

### ESLint/Stylelint Disables (80 instances)

High-concentration files:
| File | Disables | Reason |
|------|----------|--------|
| `app/auth/callback/route.js` | 27 | Console statements for auth debugging |
| `app/(app)/garage/page.jsx` | 7 | Various suppressions |
| `app/auth/confirm/route.js` | 5 | Console statements |

### TODO/FIXME Comments (27 instances)

Files with known incomplete work:

- `components/PerformanceGoals.jsx` (4 TODOs)
- `tests/session-cache.manual.test.js` (2 TODOs)
- Various lib files (1 each)

### TypeScript Ignores (4 instances)

- `lib/alToolCache.js` (2)
- `tests/e2e/tuning-shop.screenshot-framing.spec.js` (2)

---

## 4. Outdated Dependencies

### Critical Updates (breaking changes likely)

| Package                | Current | Latest | Risk                        |
| ---------------------- | ------- | ------ | --------------------------- |
| `@anthropic-ai/sdk`    | 0.39.0  | 0.71.2 | 🔴 Major version jump       |
| `next`                 | 14.2.35 | 16.1.6 | 🔴 Major version (React 19) |
| `react`                | 18.3.1  | 19.2.4 | 🔴 Major version            |
| `stripe`               | 14.11.0 | 20.2.0 | 🔴 Major version            |
| `eslint`               | 8.57.1  | 9.39.2 | 🟡 Major version            |
| `@typescript-eslint/*` | 7.18.0  | 8.54.0 | 🟡 Major version            |

### Safe Updates (patch/minor)

| Package                 | Current | Latest  |
| ----------------------- | ------- | ------- |
| `@supabase/supabase-js` | 2.86.2  | 2.93.2  |
| `@tanstack/react-query` | 5.90.12 | 5.90.20 |
| `openai`                | 6.10.0  | 6.16.0  |
| `puppeteer`             | 24.32.1 | 24.36.1 |
| Various others          | -       | -       |

---

## 5. Large API Routes

Routes that should be refactored into service layers:

| Route                          | Lines | Recommendation                        |
| ------------------------------ | ----- | ------------------------------------- |
| `/api/ai-mechanic`             | 1,954 | Extract to `lib/aiMechanicService.js` |
| `/api/user/location`           | 902   | Extract geocoding logic               |
| `/api/webhooks/stripe`         | 870   | Extract event handlers                |
| `/api/admin/emails/preview`    | 832   | Extract template logic                |
| `/api/cron/youtube-enrichment` | 722   | Extract to service                    |

---

## 6. Icon Consolidation

Multiple icon files that could be unified:

```
./components/ui/Icons.jsx           <- Primary (should be canonical)
./app/admin/components/Icons.jsx    <- Admin-specific
./app/(app)/dashboard/DashboardIcons.jsx
./components/ArticleIcons.jsx
./components/icons/EventIcons.js
```

**Recommendation:** Consolidate into single `components/ui/Icons.jsx` with namespaced exports.

---

## 7. Test Coverage

| Metric             | Value             |
| ------------------ | ----------------- |
| Total test files   | 84                |
| JS/JSX files       | 1,057             |
| Estimated coverage | ~8% by file count |

### Untested Critical Areas:

- Most React components lack tests
- API routes have minimal test coverage
- E2E tests exist but limited

---

## 8. Console Statements

Files with excessive console usage (should use proper logging):

| File                           | Count | Type       |
| ------------------------------ | ----- | ---------- |
| `lib/userDataService.js`       | 30    | Debug logs |
| `lib/alConversationService.js` | 20    | Debug logs |
| `lib/serviceCenterService.js`  | 20    | Debug logs |
| `lib/alEvaluationRunner.js`    | 18    | Debug logs |
| `components/UpgradeCenter.jsx` | 17    | Debug logs |

**Recommendation:** Implement structured logging (e.g., Pino, Winston) and remove debug console statements.

---

## Priority Matrix

### 🔴 High Priority (Do First)

1. Split `UpgradeCenter.module.css` (7,128 lines)
2. Split `garage/page.module.css` (7,051 lines)
3. Refactor `ai-mechanic/route.js` into service
4. Fix CSS duplicate selectors
5. Split `lib/alTools.js` (5,986 lines)

### 🟡 Medium Priority

1. Update safe dependencies (minor versions)
2. Consolidate icon files
3. Add structured logging
4. Extract large components into smaller pieces
5. Improve test coverage for critical paths

### 🟢 Low Priority

1. Major dependency updates (Next.js 16, React 19)
2. Clean up TODO comments
3. Remove eslint-disable where possible
4. Move static data to database/CMS

---

## Estimated Effort

| Task                       | Effort   | Impact                            |
| -------------------------- | -------- | --------------------------------- |
| Split large CSS files      | 2-3 days | High - prevents styling conflicts |
| Refactor ai-mechanic route | 1-2 days | High - maintainability            |
| Fix CSS duplicates         | 1 day    | Medium - prevents bugs            |
| Consolidate icons          | 0.5 days | Low - code organization           |
| Update minor deps          | 0.5 days | Medium - security                 |
| Add structured logging     | 1-2 days | Medium - debugging                |

---

_This document should be reviewed monthly and updated as debt is paid down._
