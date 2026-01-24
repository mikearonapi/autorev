# Best Practices Remediation Checklist

> Generated from audit against 5 Best Practices documents. Work through phases in order.

---

## Phase 1: Critical Infrastructure (Highest Priority)

### 1.1 Add Sentry Error Tracking
**Gap:** No production error monitoring - can't debug crashes or user issues
**Documents:** Production Grade Standards, Analytics & Observability

**Implementation Steps:**
- [ ] Install dependencies: `npm install @sentry/nextjs`
- [ ] Run setup wizard: `npx @sentry/wizard@latest -i nextjs`
- [ ] Configure `sentry.client.config.ts`:
  ```typescript
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1, // 10% of transactions
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0, // 100% on errors
  });
  ```
- [ ] Configure `sentry.server.config.ts` for server-side errors
- [ ] Add `instrumentation.ts` for App Router
- [ ] Wrap root layout with error boundary
- [ ] Add tunnel route to bypass ad blockers: `/monitoring`
- [ ] Test by throwing intentional error

**Verification:** Deploy, trigger error, verify in Sentry dashboard

---

### 1.2 Create Skeleton Loading Components
**Gap:** Only spinner exists - no content-shaped loading states
**Documents:** Design System & Mobile-First UX

**Implementation Steps:**
- [ ] Create `components/ui/Skeleton.jsx`:
  ```jsx
  export function Skeleton({ className }) {
    return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
  }
  ```
- [ ] Create `components/ui/Skeleton.module.css` with shimmer animation
- [ ] Create variants:
  - [ ] `CardSkeleton` - matches CarCard shape
  - [ ] `ListSkeleton` - for list views
  - [ ] `TableSkeleton` - for data tables
  - [ ] `ProfileSkeleton` - for user profiles
- [ ] Update `components/ui/index.js` exports
- [ ] Replace spinner usage in key pages with content-shaped skeletons

**Verification:** Throttle network in DevTools, verify skeletons match content shape

---

### 1.3 Add Webhook Idempotency
**Gap:** Duplicate webhook events can create duplicate subscriptions
**Documents:** Subscription & Monetization

**Implementation Steps:**
- [ ] Create migration for idempotency table:
  ```sql
  CREATE TABLE public.processed_webhook_events (
    event_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW()
  );
  
  -- Cleanup old events (keep 30 days)
  CREATE INDEX idx_webhook_events_date ON processed_webhook_events(processed_at);
  ```
- [ ] Update `app/api/webhooks/stripe/route.js`:
  ```javascript
  // Before processing, check if already processed
  const { data: existing } = await supabase
    .from('processed_webhook_events')
    .select('event_id')
    .eq('event_id', event.id)
    .single();
  
  if (existing) {
    console.log(`Event ${event.id} already processed`);
    return NextResponse.json({ received: true });
  }
  
  // After successful processing, mark as processed
  await supabase.from('processed_webhook_events').insert({
    event_id: event.id,
    event_type: event.type,
  });
  ```
- [ ] Add cleanup job for old events (optional)

**Verification:** Replay same webhook event twice, verify no duplicate processing

---

### 1.4 Create useSubscription Hook
**Gap:** No client-side subscription state management
**Documents:** Subscription & Monetization

**Implementation Steps:**
- [ ] Create `hooks/useSubscription.js`:
  ```javascript
  export function useSubscription() {
    const [subscription, setSubscription] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClientComponentClient();
    
    // Fetch subscription on mount
    // Subscribe to realtime changes
    // Return: { subscription, isLoading, isActive, isTrialing, isCanceled, daysUntilRenewal }
  }
  ```
- [ ] Add to `hooks/index.js` exports
- [ ] Create `useEntitlements.js` for feature checks
- [ ] Update components to use hook instead of prop drilling

**Verification:** Change subscription in Stripe, verify UI updates via realtime

---

## Phase 2: Product Analytics

### 2.1 Integrate PostHog
**Gap:** Only GA4, no product analytics or funnels
**Documents:** Analytics & Observability

**Implementation Steps:**
- [ ] Sign up at posthog.com (free tier: 1M events)
- [ ] Install: `npm install posthog-js`
- [ ] Create `components/providers/PostHogProvider.jsx`
- [ ] Add to root layout
- [ ] Create `components/PostHogPageView.jsx` for App Router
- [ ] Configure in `posthog.init()`:
  ```javascript
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: 'https://us.i.posthog.com',
    capture_pageview: false, // Manual control
    person_profiles: 'identified_only', // 4x cheaper
  });
  ```

**Verification:** Visit pages, verify events in PostHog dashboard

---

### 2.2 Create Typed Event Schema
**Gap:** No standardized event naming or properties
**Documents:** Analytics & Observability

**Implementation Steps:**
- [ ] Create `lib/analytics/events.js`:
  ```javascript
  /**
   * @typedef {'User Signed Up' | 'Car Added' | 'Upgrade Purchased'} EventName
   * 
   * @typedef {Object} UserSignedUpProps
   * @property {'email' | 'google' | 'apple'} method
   * @property {string} [referral_code]
   */
  export const ANALYTICS_EVENTS = {
    USER_SIGNED_UP: 'User Signed Up',
    CAR_ADDED: 'Car Added',
    // ... all events
  };
  
  export function trackEvent(name, properties) {
    // PostHog + GA4 + any other providers
  }
  ```
- [ ] Document all events with properties in schema
- [ ] Update existing tracking calls to use schema
- [ ] Add JSDoc validation

**Verification:** TypeScript/editor autocomplete works, events consistent in PostHog

---

### 2.3 Add Session Replay
**Gap:** Can't see what users did before errors
**Documents:** Analytics & Observability

**Implementation Steps:**
- [ ] Enable in PostHog init:
  ```javascript
  posthog.init(key, {
    session_recording: {
      maskAllInputs: true, // Privacy
      maskTextSelector: '.sensitive', // Custom masking
    },
  });
  ```
- [ ] Configure sampling: 10% sessions, 100% on error
- [ ] Test with Sentry integration (link errors to replays)

**Verification:** Record session, view replay in PostHog

---

### 2.4 User Identification Flow
**Gap:** Anonymous tracking only
**Documents:** Analytics & Observability

**Implementation Steps:**
- [ ] Update `AuthProvider.jsx`:
  ```javascript
  // On sign in
  posthog.identify(user.id, {
    email: user.email,
    name: user.user_metadata?.full_name,
    created_at: user.created_at,
  });
  
  // On sign out
  posthog.reset();
  ```
- [ ] Call `identify()` in existing `useAnalytics` hook
- [ ] Ensure cross-device user linking works

**Verification:** Sign in, verify user properties in PostHog

---

### 2.5 Cookie Consent Banner
**Gap:** GDPR compliance risk
**Documents:** Analytics & Observability

**Implementation Steps:**
- [ ] Create `components/CookieConsent.jsx`
- [ ] Store consent in localStorage
- [ ] Conditionally init analytics based on consent:
  ```javascript
  if (hasConsent) {
    posthog.opt_in_capturing();
  } else {
    posthog.opt_out_capturing();
  }
  ```
- [ ] Add to root layout
- [ ] Style to match brand

**Verification:** Decline cookies, verify no tracking events sent

---

## Phase 3: AI/RAG Improvements

### 3.1 Implement Hybrid Search
**Gap:** Vector-only search misses exact matches
**Documents:** AI Feature Development

**Implementation Steps:**
- [ ] Add full-text search column to knowledge table:
  ```sql
  ALTER TABLE knowledge_documents 
  ADD COLUMN fts tsvector 
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
  
  CREATE INDEX idx_knowledge_fts ON knowledge_documents USING gin(fts);
  ```
- [ ] Create hybrid search function with RRF:
  ```sql
  CREATE FUNCTION hybrid_search_automotive(
    query_text TEXT,
    query_embedding vector(1536),
    match_count INTEGER DEFAULT 10,
    rrf_k INTEGER DEFAULT 50
  ) RETURNS TABLE(id BIGINT, content TEXT, score FLOAT)
  -- BM25 + vector with Reciprocal Rank Fusion
  ```
- [ ] Update `knowledgeIndexService.js` to use hybrid search

**Verification:** Query exact term, verify it ranks higher than semantic-only

---

### 3.2 Add Reranking Pipeline
**Gap:** Missing 20-35% accuracy improvement
**Documents:** AI Feature Development

**Implementation Steps:**
- [ ] Sign up for Cohere (free tier available)
- [ ] Install: `npm install cohere-ai`
- [ ] Create `lib/reranker.js`:
  ```javascript
  import Cohere from 'cohere-ai';
  
  export async function rerankResults(query, documents, topN = 5) {
    const cohere = new Cohere.Client(process.env.COHERE_API_KEY);
    const reranked = await cohere.rerank({
      model: 'rerank-english-v3.0',
      query,
      documents: documents.map(d => d.content),
      topN,
    });
    return reranked.results.map(r => ({
      ...documents[r.index],
      score: r.relevanceScore,
    }));
  }
  ```
- [ ] Integrate into AL RAG pipeline: retrieve 20 → rerank to 5

**Verification:** Compare AL responses with/without reranking

---

### 3.3 Create AL Golden Dataset
**Gap:** No systematic evaluation
**Documents:** AI Feature Development

**Implementation Steps:**
- [ ] Create `tests/al-evaluation/golden-dataset.json`:
  ```json
  {
    "test_cases": [
      {
        "id": "spec-001",
        "category": "specifications",
        "query": "What is the horsepower of a 2020 BMW M3?",
        "expected_facts": ["473 hp", "S58 engine"],
        "prohibited_content": ["guessing", "I don't know"]
      }
    ]
  }
  ```
- [ ] Create 100+ test cases across categories:
  - [ ] 25 specification queries
  - [ ] 25 compatibility checks
  - [ ] 25 troubleshooting scenarios
  - [ ] 25 edge cases / safety-critical
- [ ] Create evaluation script: `scripts/run-al-eval.mjs`

**Verification:** Run eval, track accuracy over time

---

### 3.4 Query Intent Classification
**Gap:** All queries treated the same
**Documents:** AI Feature Development

**Implementation Steps:**
- [ ] Create intent classifier in `lib/alIntentClassifier.js`:
  ```javascript
  const INTENTS = {
    SPECIFICATION: ['horsepower', 'torque', 'mpg', 'weight'],
    TROUBLESHOOTING: ['problem', 'issue', 'error', 'code'],
    COMPATIBILITY: ['fit', 'compatible', 'work with'],
    MAINTENANCE: ['service', 'interval', 'oil change'],
  };
  
  export function classifyIntent(query) {
    // Keyword matching + optional LLM fallback
  }
  ```
- [ ] Route to appropriate tools based on intent
- [ ] Track intent distribution in analytics

**Verification:** Test queries classified correctly

---

## Phase 4: Design System

### 4.1 Create DESIGN_SYSTEM.md
**Gap:** No single design reference
**Documents:** Design System & Mobile-First UX

**Implementation Steps:**
- [ ] Create `docs/DESIGN_SYSTEM.md` with:
  - [ ] Color tokens (from SOURCE_OF_TRUTH)
  - [ ] Typography scale
  - [ ] Spacing scale
  - [ ] Component patterns
  - [ ] Animation tokens
- [ ] Add Quick Reference card section
- [ ] Include code examples for each pattern

**Verification:** New component built using only doc reference

---

### 4.2 Add Dark Mode Support
**Gap:** No theme switching
**Documents:** Design System & Mobile-First UX

**Implementation Steps:**
- [ ] Install: `npm install next-themes`
- [ ] Create `components/ThemeProvider.jsx`
- [ ] Add to root layout with `suppressHydrationWarning`
- [ ] Create `components/ThemeToggle.jsx`
- [ ] Add `.dark` class CSS variables to `globals.css`
- [ ] Test all pages in dark mode

**Verification:** Toggle theme, all components readable

---

### 4.3 Audit Focus States
**Gap:** Only 20 focus-visible vs 93 touch targets
**Documents:** Design System & Mobile-First UX

**Implementation Steps:**
- [ ] Audit all button/link components
- [ ] Add to `globals.css`:
  ```css
  :focus-visible {
    outline: 2px solid var(--color-accent-lime, #d4ff00);
    outline-offset: 2px;
  }
  ```
- [ ] Test keyboard navigation through all pages
- [ ] Add visible focus to custom components

**Verification:** Tab through pages, all interactive elements have visible focus

---

### 4.4 Create EmptyState Component
**Gap:** No standardized empty states
**Documents:** Design System & Mobile-First UX

**Implementation Steps:**
- [ ] Create `components/ui/EmptyState.jsx`:
  ```jsx
  export function EmptyState({ icon, title, description, action }) {
    return (
      <div className={styles.emptyState}>
        {icon && <div className={styles.icon}>{icon}</div>}
        <h3>{title}</h3>
        <p>{description}</p>
        {action && <Button>{action.label}</Button>}
      </div>
    );
  }
  ```
- [ ] Add variants: default, error, search-no-results
- [ ] Replace ad-hoc empty states in app

**Verification:** Consistent empty states across app

---

## Phase 5: Testing & Quality

### 5.1 Expand E2E Test Coverage
**Gap:** Incomplete Playwright tests
**Documents:** Production Grade Standards

**Implementation Steps:**
- [ ] Add auth flow tests: signup, login, logout, password reset
- [ ] Add subscription flow tests: upgrade, downgrade, cancel
- [ ] Add AL interaction tests: ask question, follow-up
- [ ] Add mobile viewport tests
- [ ] Configure CI to run on PR

**Verification:** `npm run test:e2e` passes

---

### 5.2 Add T3-Env
**Gap:** No type-safe env validation
**Documents:** Production Grade Standards

**Implementation Steps:**
- [ ] Install: `npm install @t3-oss/env-nextjs zod`
- [ ] Create `lib/env.js`:
  ```javascript
  import { createEnv } from "@t3-oss/env-nextjs";
  import { z } from "zod";
  
  export const env = createEnv({
    server: {
      STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
      SUPABASE_SERVICE_ROLE_KEY: z.string(),
    },
    client: {
      NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    },
  });
  ```
- [ ] Replace `process.env` usage with `env`

**Verification:** App fails fast with missing/invalid env vars

---

### 5.3 LLM-as-Judge Evaluation
**Gap:** Manual testing only
**Documents:** AI Feature Development

**Implementation Steps:**
- [ ] Create `scripts/evaluate-al-responses.mjs`:
  ```javascript
  async function evaluateResponse(testCase, response) {
    const prompt = `Evaluate this automotive AI response:
    Query: ${testCase.query}
    Response: ${response}
    
    Score 1-5 on: accuracy, relevance, helpfulness, safety`;
    
    // Call Claude to evaluate
  }
  ```
- [ ] Integrate with golden dataset
- [ ] Track scores over time

**Verification:** Automated quality scores for AL

---

### 5.4 Add Commitlint
**Gap:** Inconsistent commit messages
**Documents:** Production Grade Standards

**Implementation Steps:**
- [ ] Install: `npm install @commitlint/cli @commitlint/config-conventional`
- [ ] Create `commitlint.config.js`:
  ```javascript
  module.exports = { extends: ['@commitlint/config-conventional'] };
  ```
- [ ] Add to Husky: `npx husky add .husky/commit-msg 'npx commitlint --edit $1'`

**Verification:** Bad commit message rejected

---

## Phase 6: Subscription Polish

### 6.1 Trial Ending Notification
**Gap:** Users surprised by charges
**Documents:** Subscription & Monetization

**Implementation Steps:**
- [ ] Handle `customer.subscription.trial_will_end` webhook
- [ ] Create email template for trial ending
- [ ] Send 3 days and 1 day before trial ends
- [ ] Include upgrade CTA and payment method check

**Verification:** Trial user receives reminder email

---

### 6.2 Failed Payment Handling UI
**Gap:** No user notification for failed payments
**Documents:** Subscription & Monetization

**Implementation Steps:**
- [ ] Create `components/PaymentFailedBanner.jsx`
- [ ] Show when subscription status is `past_due`
- [ ] Link to update payment method
- [ ] Handle `invoice.payment_failed` webhook to trigger email

**Verification:** Failed payment shows banner in app

---

### 6.3 Stripe Customer Portal
**Gap:** Users can't self-manage subscriptions
**Documents:** Subscription & Monetization

**Implementation Steps:**
- [ ] Configure Customer Portal in Stripe Dashboard
- [ ] Create `/api/create-portal-session` route
- [ ] Add "Manage Subscription" button in settings
- [ ] Allow: update payment, cancel, view invoices

**Verification:** User can cancel subscription via portal

---

### 6.4 Paywall A/B Testing
**Gap:** Static paywall, no optimization
**Documents:** Subscription & Monetization

**Implementation Steps:**
- [ ] Use PostHog feature flags for variants
- [ ] Create paywall variants to test:
  - [ ] Price points
  - [ ] Copy variations
  - [ ] Trial length
- [ ] Track conversion by variant
- [ ] Statistical significance before decision

**Verification:** A/B test running with tracked conversions

---

## Completion Checklist

| Phase | Tasks | Est. Effort |
|-------|-------|-------------|
| Phase 1 | 4 tasks | 1-2 days |
| Phase 2 | 5 tasks | 2-3 days |
| Phase 3 | 4 tasks | 3-4 days |
| Phase 4 | 4 tasks | 1-2 days |
| Phase 5 | 4 tasks | 2-3 days |
| Phase 6 | 4 tasks | 1-2 days |
| **Total** | **25 tasks** | **10-16 days** |

---

*Last Updated: January 2026*
*Source: Best Practices Audit across 5 documents*
