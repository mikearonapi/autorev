# Analytics_and_Observability.md

# Production-Grade Analytics and Observability for Cross-Platform Apps

**Target Stack:** Next.js 14 App Router + Supabase + Vercel + React Native/Expo  
**Quality Bar:** Data-driven companies (Amplitude, Mixpanel, Spotify, Netflix)  
**Purpose:** Enable AI coding assistants to implement analytics that drive product decisions

---

## Executive Summary

Building production-grade analytics requires **four pillars**: product analytics for user behavior, error tracking for reliability, performance monitoring for experience quality, and experimentation for data-driven decisions. This document provides the complete technical specification for implementing each pillar with **PostHog as the recommended primary platform** for its all-in-one capabilities, excellent Next.js 14 integration, and cost-effectiveness at scale.

The key architectural decision is adopting a **provider abstraction layer** that enables switching analytics backends without code changes, combined with **type-safe event schemas** that ensure consistency across web and mobile platforms. For error tracking, **Sentry** remains the industry standard with native support for both Next.js App Router and React Native/Expo.

---

## 1. Analytics Stack Architecture

### Platform Comparison Matrix

| Platform | Best For | Free Tier | 10M Events/mo | Self-Hosted | Mobile Replay |
|----------|----------|-----------|---------------|-------------|---------------|
| **PostHog** | Technical teams, all-in-one | 1M events | ~$275-400 | ✅ MIT License | ✅ iOS/Android |
| **Mixpanel** | Non-technical stakeholders | 1M events | ~$800 | ❌ | ❌ Coming soon |
| **Amplitude** | Enterprise behavioral | 50K MTUs | Custom | ❌ | Limited |
| **June** | ~~B2B SaaS~~ | **SHUTTING DOWN August 2025** | N/A | ❌ | ❌ |

**PostHog is recommended** for this stack because it offers the best Next.js 14 App Router integration with dedicated documentation, excellent Expo support without incompatible dependencies, mobile session replay (one of few platforms offering this), and an all-in-one platform replacing 3-4 separate tools.

### Session Replay Comparison

| Feature | PostHog | LogRocket | FullStory |
|---------|---------|-----------|-----------|
| Free Tier | 5K web/mo | 1K sessions/mo | 30K sessions/mo |
| Starting Price | $0.005/recording | $99/mo | ~$5,000/year |
| Mobile Support | ✅ Wireframe + Screenshot | ✅ | ✅ |
| Built-in Analytics | ✅ Full suite | Basic | Moderate |
| Feature Flags | ✅ | ❌ | ❌ |
| Self-Hosting | ✅ | Enterprise only | ❌ |

### Self-Hosted vs SaaS Decision Tree

```
┌─────────────────────────────────────────────────────────┐
│ Do you have strict regulatory requirements mandating    │
│ on-premise data storage?                                │
└─────────────────────┬───────────────────────────────────┘
                      │
            ┌─────────▼─────────┐
            │        YES        │────► Self-host PostHog (MIT license)
            └─────────┬─────────┘      Max ~100K events/month recommended
                      │ NO
            ┌─────────▼─────────┐
            │ Do you have DevOps│
            │ capacity for      │────► Consider self-host for cost savings
            │ maintenance?      │      but PostHog recommends Cloud
            └─────────┬─────────┘
                      │ NO
            ┌─────────▼─────────┐
            │ Use SaaS (Cloud)  │────► 90%+ of companies should choose this
            └───────────────────┘
```

### Cost at Scale Analysis

| Stage | Events/mo | PostHog | Mixpanel | Amplitude |
|-------|-----------|---------|----------|-----------|
| Startup | 100K | **FREE** | **FREE** | **FREE** |
| Growth | 1M | **FREE** | **FREE** | $49-150 |
| Scale | 10M | ~$400 | ~$800 | Custom |
| Enterprise | 50M+ | ~$1,500 | ~$3,000 | $5K-70K/year |

---

## 2. Event Taxonomy Design

### Event Naming Convention

Use **Object + Past-Tense Verb** format in Title Case for events and snake_case for properties:

```typescript
// ✅ CORRECT
track("Product Added", { product_id: "SKU-123", price: 29.99 });
track("Checkout Completed", { order_id: "ORD-456", total: 149.99 });
track("Feature Enabled", { feature_name: "dark_mode" });

// ❌ INCORRECT
track("add_product");           // verb + noun, snake_case
track("Purchase (11-01-2019)"); // dynamic value in event name
track("Facebook Share");        // platform-specific (use property instead)
```

### Property Standardization

| Property Type | Scope | Examples | Persistence |
|--------------|-------|----------|-------------|
| **Event Properties** | Single event | `product_id`, `price`, `page_url` | None |
| **User Properties** | All user events | `plan_type`, `signup_date`, `user_role` | Until changed |
| **Super Properties** | Auto-attached | `utm_source`, `app_version`, `device_type` | Session/forever |

### TypeScript Event Schema

```typescript
// types/analytics-events.ts

// Discriminated union for type-safe events
export type AnalyticsEvent =
  | { name: "User Signed Up"; properties: UserSignedUpProps }
  | { name: "Product Added"; properties: ProductAddedProps }
  | { name: "Checkout Completed"; properties: CheckoutCompletedProps }
  | { name: "Feature Used"; properties: FeatureUsedProps };

interface UserSignedUpProps {
  method: "email" | "google" | "apple";
  referral_code?: string;
}

interface ProductAddedProps {
  product_id: string;
  product_name: string;
  price: number;
  currency: "USD" | "EUR" | "GBP";
  quantity: number;
  category?: string;
  from_recommendation?: boolean;
}

interface CheckoutCompletedProps {
  order_id: string;
  total: number;
  currency: string;
  item_count: number;
  payment_method: "card" | "apple_pay" | "google_pay";
  discount_applied?: boolean;
}

interface FeatureUsedProps {
  feature_name: string;
  context?: string;
  duration_seconds?: number;
}

// Type-safe track function
export function trackEvent<T extends AnalyticsEvent>(
  name: T["name"],
  properties: T["properties"]
): void {
  analytics.track(name, properties);
}
```

### Event Schema Documentation Template

```markdown
## Event: Product Added to Cart

**Description:** Fired when a user adds an item to their shopping cart

**Trigger:** User clicks "Add to Cart" button on product page

**Properties:**
| Property | Type | Required | Description |
|----------|------|----------|-------------|
| product_id | string | Yes | Unique product identifier (SKU) |
| product_name | string | Yes | Display name of product |
| price | number | Yes | Unit price in USD |
| quantity | integer | Yes | Number of items added |
| category | string | No | Product category |
| from_recommendation | boolean | No | Was product recommended |

**Owner:** Growth Team
**Platform:** Web, iOS, Android
**Implementation Date:** 2024-01-15
**Status:** Active
**Version:** 1.0
```

### Event Versioning Strategy

When tracking requirements change, use a **schema_version property** rather than modifying event names:

```typescript
// Version 1.0
track("Order Completed", {
  schema_version: "1.0",
  order_id: "123",
  total: 99.99
});

// Version 2.0 (added shipping_method)
track("Order Completed", {
  schema_version: "2.0",
  order_id: "123",
  total: 99.99,
  shipping_method: "express"
});
```

### Group Analytics for B2B

```typescript
// PostHog group analytics
posthog.group("company", "acme_corp_123", {
  name: "Acme Corporation",
  industry: "Technology",
  employee_count: 500,
  plan: "enterprise"
});

// Mixpanel group analytics
mixpanel.set_group("company_id", "acme_corp_123");
mixpanel.get_group("company_id", "acme_corp_123").set({
  company_name: "Acme Corporation",
  plan_type: "enterprise"
});
```

---

## 3. Identity and User Tracking

### Anonymous → Identified User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ ANONYMOUS PHASE                                                  │
│ • User visits site/app                                          │
│ • Analytics assigns device-generated anonymousId                │
│ • Stored in cookies (web) or AsyncStorage (mobile)              │
│ • All events tracked with anonymousId                           │
└─────────────────────────────┬───────────────────────────────────┘
                              │ User signs up / logs in
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ IDENTIFICATION PHASE                                             │
│ • Call identify() with Supabase user.id                         │
│ • Analytics links anonymous events to identified user           │
│ • User properties set (email, name, plan)                       │
│ • Cross-device tracking enabled                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Supabase Auth Integration

```typescript
// hooks/useAnalyticsIdentity.ts
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import posthog from 'posthog-js';

export function useAnalyticsIdentity() {
  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        identifyUser(session.user);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              identifyUser(session.user);
            }
            break;
          case 'SIGNED_OUT':
            posthog.reset(); // Creates new anonymous ID
            break;
          case 'USER_UPDATED':
            if (session?.user) {
              posthog.capture('$set', {
                $set: extractUserProperties(session.user)
              });
            }
            break;
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);
}

function identifyUser(user: User) {
  posthog.identify(user.id, {
    email: user.email,
    name: user.user_metadata?.full_name,
    avatar_url: user.user_metadata?.avatar_url,
    auth_provider: user.app_metadata?.provider,
    created_at: user.created_at
  });
}
```

### Cross-Platform Identity Strategy

| Platform | Anonymous ID | Identified ID | Notes |
|----------|--------------|---------------|-------|
| Web (Next.js) | Cookie UUID | Supabase `user.id` | Persists until cleared |
| iOS (Expo) | IDFV or UUID | Supabase `user.id` | IDFV persists per vendor |
| Android (Expo) | Generated UUID | Supabase `user.id` | GAID requires consent |

**Critical:** Always call `reset()` on logout to prevent cross-user data pollution:

```typescript
// On logout
supabase.auth.signOut();
posthog.reset(true); // true = also reset device_id
amplitude.setUserId(null);
amplitude.regenerateDeviceId();
mixpanel.reset();
```

### GDPR-Compliant User Tracking

```typescript
// Configure analytics for GDPR compliance
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  opt_out_capturing_by_default: true, // Require consent
  respect_dnt: true, // Honor Do Not Track
  cookieless_mode: 'on_reject', // No cookies until consent
  person_profiles: 'identified_only', // Anonymous events 4x cheaper
});
```

---

## 4. Core Metrics Framework

### North Star Metric Selection

The North Star Metric captures the core value delivered to customers and predicts sustainable growth. Selection depends on your business model:

| Business Type | North Star Metric | Input Metrics |
|--------------|-------------------|---------------|
| **Attention** (Social, Content) | Weekly Active Users | DAU, Sessions/user, Time in app |
| **Transaction** (E-commerce, Marketplace) | Weekly Purchases | Cart additions, Checkout starts, Conversion rate |
| **Productivity** (SaaS, Tools) | Weekly Active Teams/Features | Tasks completed, Docs created, Integrations used |

### North Star Framework Structure

```
                    ┌─────────────────┐
                    │  NORTH STAR     │
                    │    METRIC       │
                    │ (e.g., Weekly   │
                    │  Active Users)  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐         ┌─────▼────┐         ┌────▼────┐
   │ BREADTH │         │  DEPTH   │         │FREQUENCY│
   │(New users│        │(Features │         │(Sessions│
   │ activated)│       │  used)   │         │per week)│
   └──────────┘        └──────────┘         └─────────┘
```

### AARRR (Pirate Metrics) Framework

| Stage | Definition | Key Metrics | Benchmark |
|-------|------------|-------------|-----------|
| **Acquisition** | How users find you | Visitors by channel, CPA, Traffic quality | 100% baseline |
| **Activation** | First great experience | Signup rate, Onboarding completion, Time to value | 30-50% |
| **Retention** | Users return | D1/D7/D30 retention, WAU/MAU ratio | 20-40% |
| **Referral** | Users recommend | NPS, K-factor, Referral conversion | 10-20% |
| **Revenue** | Users pay | Conversion to paid, ARPU, LTV, MRR | 2-10% |

### Google HEART Framework

| Metric | Definition | Signal | Example KPI |
|--------|------------|--------|-------------|
| **Happiness** | User satisfaction | Surveys, ratings | NPS ≥ 50, CSAT ≥ 4.0 |
| **Engagement** | Depth of involvement | Sessions, actions | 3+ sessions/week |
| **Adoption** | New user/feature uptake | First-use events | 60% feature adoption in 7 days |
| **Retention** | Continued usage | Return rate | D7 ≥ 35%, D30 ≥ 15% |
| **Task Success** | Efficiency | Completion rate | 85%+ checkout completion |

### Leading vs Lagging Indicators

```
LEADING                                                    LAGGING
(Easy to impact)                                    (Hard to impact)
    │                                                      │
    ▼                                                      ▼
Feature usage → Activation → Retention → Revenue → Market share
  (days)         (weeks)      (months)   (quarters)   (years)
```

**Leading indicators** predict future outcomes and are directly actionable (feature engagement, onboarding completion). **Lagging indicators** measure past results (revenue, churn rate). Your North Star Metric should sit between these extremes.

---

## 5. Funnel Analysis

### Defining Conversion Funnels

```
Step 1: Landing Page View ─────────────────► 10,000 users (100%)
                    │
                    ▼ Drop-off: 30%
Step 2: Signup Started ────────────────────► 7,000 users (70%)
                    │
                    ▼ Drop-off: 43%
Step 3: Signup Completed ──────────────────► 4,000 users (40%)
                    │
                    ▼ Drop-off: 50%
Step 4: First Action Completed ────────────► 2,000 users (20%)
                    │
                    ▼ Drop-off: 50%
Step 5: Converted to Paid ─────────────────► 1,000 users (10%)
```

### Key Funnel Metrics

| Metric | Formula | Purpose |
|--------|---------|---------|
| Step Conversion | Users completing step / Users entering step | Identify friction |
| Overall Conversion | Users completing funnel / Users entering | Funnel efficiency |
| Drop-off Rate | 1 - Step Conversion Rate | Find biggest leaks |
| Time to Convert | Median time from entry to completion | Measure friction |

### Time-to-Convert Analysis Template

| Time Bucket | % of Conversions | Cumulative % | Action |
|-------------|------------------|--------------|--------|
| < 1 minute | 15% | 15% | Immediate converters |
| 1-5 minutes | 35% | 50% | Engaged users |
| 5-30 minutes | 25% | 75% | Considering users |
| 30 min - 1 hour | 10% | 85% | Need nurturing |
| 1-24 hours | 10% | 95% | Requires follow-up |
| > 24 hours | 5% | 100% | At-risk, re-engage |

### Funnel Tracking Code Pattern

```typescript
// Track each funnel step with consistent properties
const trackFunnelStep = (
  step: number,
  stepName: string,
  funnelName: string,
  additionalProps?: Record<string, unknown>
) => {
  posthog.capture("Funnel Step Completed", {
    funnel_name: funnelName,
    step_number: step,
    step_name: stepName,
    timestamp: new Date().toISOString(),
    ...additionalProps
  });
};

// Usage
trackFunnelStep(1, "Landing Page Viewed", "signup_funnel");
trackFunnelStep(2, "Signup Started", "signup_funnel");
trackFunnelStep(3, "Email Verified", "signup_funnel");
trackFunnelStep(4, "Profile Completed", "signup_funnel");
```

---

## 6. Retention Analysis

### Retention Curve Types

```
100%│
    │╲
    │ ╲    Declining (no product-market fit)
    │  ╲____
    │       ╲___________  Flattening (healthy)
    │                  
    │         ___╱ Smiling (network effects)
    │        ╱
  0%└────────────────────────►
     Day 1    Day 7    Day 30    Day 90
```

- **Declining curve:** Users continuously leave → Focus on core value and activation
- **Flattening curve:** Retention stabilizes → Scale acquisition
- **Smiling curve:** Retention improves over time → Accelerate to inflection point

### Cohort Retention Table

| Cohort | Week 0 | Week 1 | Week 2 | Week 3 | Week 4 |
|--------|--------|--------|--------|--------|--------|
| Jan 1 (n=1000) | 100% | 40% | 32% | 28% | 26% |
| Jan 8 (n=1200) | 100% | 45% | 35% | 30% | - |
| Jan 15 (n=900) | 100% | 42% | 33% | - | - |
| Jan 22 (n=1100) | 100% | 48% | - | - | - |

**Reading patterns:**
- **Horizontal patterns:** Cohort-specific issues (e.g., bad acquisition campaign)
- **Vertical patterns:** Time-based events affecting all users (e.g., outage)
- **Diagonal patterns:** Product changes affecting usage (e.g., feature release)

### N-Day vs Unbounded Retention

| Type | Definition | Best For | Formula |
|------|------------|----------|---------|
| **N-Day** | % returning on exactly day N | Regular-use products (SaaS, social) | Users active on Day N / Cohort size |
| **Unbounded** | % returning on or after day N | Irregular-use (e-commerce) | Users active Day N+ / Cohort size |

### Industry Benchmarks

| Metric | Average | Good | Great |
|--------|---------|------|-------|
| D1 Retention | 25-30% | 35-45% | 45%+ |
| D7 Retention | 10-15% | 20-25% | 25%+ |
| D30 Retention | 5-8% | 10-15% | 15%+ |
| DAU/MAU Ratio | 10-20% | 20-30% | 30%+ |

### Feature Retention Analysis

Track which features correlate with long-term retention:

```sql
-- Feature retention query for Supabase
WITH feature_users AS (
  SELECT DISTINCT user_id, MIN(timestamp) as first_use
  FROM analytics_events
  WHERE event_name = 'Feature Used'
    AND properties->>'feature_name' = 'dark_mode'
  GROUP BY user_id
),
retained_users AS (
  SELECT fu.user_id
  FROM feature_users fu
  JOIN analytics_events ae ON fu.user_id = ae.user_id
  WHERE ae.timestamp > fu.first_use + INTERVAL '7 days'
)
SELECT 
  COUNT(DISTINCT fu.user_id) as feature_users,
  COUNT(DISTINCT ru.user_id) as retained_users,
  ROUND(100.0 * COUNT(DISTINCT ru.user_id) / COUNT(DISTINCT fu.user_id), 2) as retention_rate
FROM feature_users fu
LEFT JOIN retained_users ru ON fu.user_id = ru.user_id;
```

### Resurrection Tracking

Track users who return after being dormant (30+ days inactive):

```typescript
// Track resurrection event
if (daysSinceLastActive > 30) {
  posthog.capture("User Resurrected", {
    days_dormant: daysSinceLastActive,
    resurrection_trigger: trigger, // e.g., "email_campaign", "push_notification"
    previous_activity_level: previousActivityLevel
  });
}
```

---

## 7. A/B Testing and Experimentation

### Feature Flag Provider Comparison

| Provider | Feature Flags | A/B Testing | Statistical Engine | Free Tier | Next.js 14 |
|----------|--------------|-------------|-------------------|-----------|------------|
| **Statsig** | ✅ Unlimited free | ✅ Best-in-class | CUPED + Bayesian | 2M events | ✅ Native |
| **PostHog** | ✅ 1M requests | ✅ Good | Bayesian | 1M requests | ✅ Native |
| **LaunchDarkly** | ✅ Full | ✅ Enterprise | Bayesian | 1K MAU | ✅ Via Vercel |
| **Vercel Flags** | ✅ Basic | ❌ Needs provider | N/A | Included | ✅ Native |

**Statsig is recommended** for A/B testing due to superior statistical rigor (CUPED reduces required sample size by ~40%) and unlimited free feature flags.

### Sample Size Calculation

```
n = 2 × (Zα/2 + Zβ)² × p(1-p) / MDE²

For 95% confidence, 80% power, 10% baseline, 5% MDE:
n = 2 × (1.96 + 0.84)² × 0.10 × 0.90 / 0.005²
n ≈ 25,400 per variant
```

**With CUPED (Statsig):** ~15,000 per variant (40% reduction)

### Statistical Significance Thresholds

| Confidence Level | P-Value | Use Case |
|-----------------|---------|----------|
| 90% | p < 0.10 | Early-stage experiments, low-stakes |
| 95% | p < 0.05 | Standard threshold for most tests |
| 99% | p < 0.01 | High-stakes decisions, critical features |

### Guardrail Metrics

Secondary metrics monitored to ensure improvements don't harm other KPIs:

```typescript
const experiment = {
  key: 'checkout-redesign',
  variants: ['control', 'variant'],
  primaryMetric: 'purchase_completed',
  guardrailMetrics: [
    'page_load_time',       // Should not increase
    'checkout_abandonment', // Should not increase  
    'support_tickets',      // Should not increase
    'error_rate'            // Should not increase
  ]
};
```

### Server-Side vs Client-Side Experiments

| Aspect | Server-Side | Client-Side |
|--------|-------------|-------------|
| Flickering | None | Possible |
| SEO Impact | None | Potential |
| Complexity | Higher | Lower |
| Use Cases | Critical UX, personalization | UI tweaks, copy tests |

**Recommendation:** Use server-side experiments for important features, client-side for low-stakes UI tests.

### Feature Flag Hook Implementation

```typescript
// hooks/useFeatureFlag.ts
import { usePostHog } from 'posthog-js/react';
import { useState, useEffect } from 'react';

export function useFeatureFlag(
  flagKey: string, 
  defaultValue: boolean = false
): { enabled: boolean; loading: boolean } {
  const posthog = usePostHog();
  const [enabled, setEnabled] = useState(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (posthog) {
      posthog.onFeatureFlags(() => {
        setEnabled(posthog.isFeatureEnabled(flagKey) ?? defaultValue);
        setLoading(false);
      });
    }
  }, [posthog, flagKey, defaultValue]);

  return { enabled, loading };
}

// Usage
function MyComponent() {
  const { enabled: showNewUI, loading } = useFeatureFlag('new_checkout_ui');
  
  if (loading) return <Skeleton />;
  return showNewUI ? <NewCheckout /> : <OldCheckout />;
}
```

---

## 8. Error Tracking and Monitoring

### Sentry Setup for Next.js 14 App Router

**Installation:**
```bash
npm install @sentry/nextjs
```

**Configuration files required:**

```typescript
// next.config.ts
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Your Next.js config
};

export default withSentryConfig(nextConfig, {
  org: "your-org",
  project: "your-project",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring", // Bypass ad blockers
  hideSourceMaps: true,
  disableLogger: true,
  autoInstrumentAppDirectory: true,
});
```

```typescript
// instrumentation-client.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration({ maskAllText: true, maskAllInputs: true }),
    Sentry.browserTracingIntegration({ enableInp: true }),
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
```

```typescript
// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  profilesSampleRate: 1.0,
});
```

```typescript
// instrumentation.ts
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
```

### Sentry Setup for React Native/Expo

```bash
npx expo install @sentry/react-native
```

```json
// app.json
{
  "expo": {
    "plugins": [
      [
        "@sentry/react-native/expo",
        {
          "project": "your-project",
          "organization": "your-org"
        }
      ]
    ]
  }
}
```

```typescript
// app/_layout.tsx
import * as Sentry from "@sentry/react-native";
import { useNavigationContainerRef } from "expo-router";

const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: true,
});

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: __DEV__ ? "development" : "production",
  tracesSampleRate: __DEV__ ? 1.0 : 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [navigationIntegration, Sentry.mobileReplayIntegration()],
});

function RootLayout() {
  const ref = useNavigationContainerRef();
  
  useEffect(() => {
    if (ref) navigationIntegration.registerNavigationContainer(ref);
  }, [ref]);

  return <Stack />;
}

export default Sentry.wrap(RootLayout);
```

### Error Grouping with Fingerprints

```typescript
Sentry.init({
  beforeSend(event, hint) {
    const error = hint.originalException as Error;
    
    // Group database errors together
    if (error?.message?.includes('database')) {
      event.fingerprint = ['database-error', '{{ transaction }}'];
    }
    
    // Group API errors by endpoint
    if (error?.name === 'APIError') {
      event.fingerprint = ['api-error', error.endpoint, String(error.status)];
    }
    
    return event;
  },
});
```

### Alert Fatigue Prevention

| Alert Type | Threshold | Channel | Response Time |
|------------|-----------|---------|---------------|
| Critical | >100 errors/5min | PagerDuty | Immediate |
| Warning | >10 errors/5min | Slack #alerts | 1 hour |
| Info | Any new issue | Email digest | 24 hours |

**Best practices:**
- Set minimum **30-minute intervals** between repeat alerts
- Use **percentage thresholds** (>1% error rate) instead of absolute numbers
- Create **action-specific channels** (#alerts-critical, #alerts-warning)
- **Monthly audit** of alert rules to remove noise

### Error Budgets and SLOs

```
Error Budget = 1 - SLO

Example: 99.9% availability SLO
Error Budget = 0.1% = ~43 minutes/month downtime
```

| SLO | Error Budget | Monthly Downtime |
|-----|--------------|------------------|
| 99.0% | 1.0% | ~7.3 hours |
| 99.5% | 0.5% | ~3.6 hours |
| 99.9% | 0.1% | ~43 minutes |
| 99.99% | 0.01% | ~4.3 minutes |

---

## 9. Performance Monitoring

### Core Web Vitals Thresholds

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | ≤2.5s | 2.5s - 4.0s | >4.0s |
| **INP** (Interaction to Next Paint) | ≤200ms | 200ms - 500ms | >500ms |
| **CLS** (Cumulative Layout Shift) | ≤0.1 | 0.1 - 0.25 | >0.25 |
| **TTFB** (Time to First Byte) | ≤800ms | 800ms - 1.8s | >1.8s |
| **FCP** (First Contentful Paint) | ≤1.8s | 1.8s - 3.0s | >3.0s |

### Vercel Analytics Setup

```bash
npm install @vercel/analytics @vercel/speed-insights
```

```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights sampleRate={0.5} /> {/* 50% sampling to reduce costs */}
      </body>
    </html>
  );
}
```

### React Native Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| UI Thread FPS | 60 FPS | Performance Monitor |
| JS Thread FPS | 60 FPS | Performance Monitor |
| App Startup | <5 seconds | Custom timing |
| Memory Usage | Monitor for leaks | Performance Monitor |

**Critical:** Always use `useNativeDriver: true` for animations:

```typescript
Animated.timing(value, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // Required for 60fps
}).start();
```

### Supabase Query Performance

```sql
-- Enable query monitoring
-- Dashboard → Database → Extensions → pg_stat_statements

-- Find slow queries
SELECT 
  query,
  calls,
  mean_exec_time,
  total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check cache hit rate (target: 99%+)
SELECT 
  'cache hit rate' as metric,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
FROM pg_statio_user_tables;
```

### Performance Budgets

| Resource | Budget | Enforcement |
|----------|--------|-------------|
| JavaScript (critical) | <170KB gzipped | Webpack config |
| Total Page Weight | <1MB | Lighthouse CI |
| LCP | <2.5s | Vercel Speed Insights |
| TTI | <5s on 3G | Synthetic monitoring |

```javascript
// webpack.config.js
module.exports = {
  performance: {
    maxAssetSize: 250000,
    maxEntrypointSize: 250000,
    hints: 'error' // Fail build on violation
  }
};
```

---

## 10. Custom Dashboards

### Dashboard Design Principles

1. **BLUF (Bottom Line Up Front):** Most important metrics at top
2. **Progressive disclosure:** High-level → drill-down capability
3. **Consistent time ranges:** Align all charts to same period
4. **Clear data freshness:** Show last updated timestamp
5. **Actionable insights:** Each metric should suggest an action

### Essential Dashboards

**Executive Dashboard (Weekly review):**
- North Star Metric trend
- Revenue metrics (MRR, NRR, churn)
- User growth (signups, activations, WAU)
- Key conversion rates

**Growth Dashboard (Daily operations):**
- Acquisition by channel
- Activation funnel
- Trial-to-paid conversion
- Feature adoption rates

**Engagement Dashboard (Daily operations):**
- DAU/MAU ratio
- Session frequency
- Feature usage heatmap
- Retention cohorts

**Health Dashboard (Real-time monitoring):**
- Error rates
- API latency p50/p95/p99
- Core Web Vitals
- Uptime/availability

### Metabase + Supabase Setup

1. **Deploy Metabase:**
```bash
docker run -d -p 3000:3000 --name metabase metabase/metabase
```

2. **Connect Supabase (use Session Pooler):**
```
Host: aws-0-us-west-1.pooler.supabase.com
Port: 5432
Database: postgres
Username: postgres.xxxxx
Password: [your-db-password]
```

3. **Create materialized view for aggregates:**
```sql
CREATE MATERIALIZED VIEW daily_metrics AS
SELECT 
  date_trunc('day', timestamp) as day,
  event_name,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users
FROM analytics_events
GROUP BY date_trunc('day', timestamp), event_name;

-- Refresh daily
CREATE INDEX idx_daily_metrics_day ON daily_metrics(day);
```

### Dashboard Mockup: Growth Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    NORTH STAR METRIC                        │
│                 Weekly Active Users: 125,000                │
│                    ▲ 8% vs. last week                       │
├─────────────────────────────────────────────────────────────┤
│ INPUT METRICS                                               │
├──────────────┬──────────────┬──────────────┬───────────────┤
│   BREADTH    │    DEPTH     │  FREQUENCY   │  EFFICIENCY   │
│  New Users   │ Actions/User │ Sessions/Week│ Time to Value │
│   5,200/wk   │    12.3      │     3.2      │    2.1 days   │
│   ▲ 5%       │    ▼ 2%      │    ─ 0%      │    ▼ 15%      │
├──────────────┴──────────────┴──────────────┴───────────────┤
│ AARRR FUNNEL                                                │
├──────────────┬──────────────┬──────────────┬───────────────┤
│ Acquisition  │  Activation  │  Retention   │   Revenue     │
│   20,000     │    8,000     │   D7: 35%    │  MRR: $450K   │
│   visitors   │   activated  │   D30: 18%   │   NRR: 105%   │
└──────────────┴──────────────┴──────────────┴───────────────┘
```

---

## 11. Data Privacy and Compliance

### GDPR Requirements Checklist

- [ ] Obtain explicit consent before tracking (opt-in, not opt-out)
- [ ] Provide clear privacy policy explaining data collection
- [ ] Implement "Right to be Forgotten" (data deletion)
- [ ] Enable "Right to Access" (data export)
- [ ] Anonymize IP addresses
- [ ] Respect Do Not Track headers
- [ ] Set maximum data retention (26 months recommended)
- [ ] Sign DPA with all analytics providers

### Cookie Consent Implementation

```typescript
// components/CookieConsent.tsx
'use client';
import { useState, useEffect } from 'react';
import posthog from 'posthog-js';

export function CookieConsentBanner() {
  const [status, setStatus] = useState<'pending' | 'granted' | 'denied'>('pending');

  useEffect(() => {
    const stored = localStorage.getItem('cookie_consent');
    if (stored) setStatus(stored as any);
  }, []);

  const handleAccept = () => {
    posthog.opt_in_capturing();
    localStorage.setItem('cookie_consent', 'granted');
    setStatus('granted');
  };

  const handleDecline = () => {
    posthog.opt_out_capturing();
    localStorage.setItem('cookie_consent', 'denied');
    setStatus('denied');
  };

  if (status !== 'pending') return null;

  return (
    <div className="fixed bottom-0 inset-x-0 bg-white border-t p-4 z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <p className="text-sm">
          We use cookies to improve your experience.{' '}
          <a href="/privacy" className="underline">Learn more</a>
        </p>
        <div className="flex gap-2">
          <button onClick={handleDecline} className="px-4 py-2 border rounded">
            Decline
          </button>
          <button onClick={handleAccept} className="px-4 py-2 bg-blue-600 text-white rounded">
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
```

### User Data Deletion API

```typescript
// app/api/user/delete-data/route.ts
import { PostHog } from 'posthog-node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const { userId } = await request.json();

  // 1. Delete from PostHog
  await fetch(`https://app.posthog.com/api/person/${userId}/`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${process.env.POSTHOG_PERSONAL_API_KEY}` }
  });

  // 2. Delete from Supabase
  await supabase.auth.admin.deleteUser(userId);

  // 3. Delete from any other data stores
  await supabase.from('analytics_events').delete().eq('user_id', userId);

  return Response.json({ success: true });
}
```

### Privacy-Friendly Alternatives

For marketing sites where you want analytics without consent banners:

| Tool | Cookies | GDPR Consent | Cost (1M views) |
|------|---------|--------------|-----------------|
| Plausible | ❌ | Not required | ~$71/mo |
| Fathom | ❌ | Not required | ~$54/mo |
| Simple Analytics | ❌ | Not required | ~$49/mo |
| Umami (self-hosted) | ❌ | Not required | Free |

---

## 12. Implementation Patterns

### Analytics Provider Abstraction Layer

```typescript
// lib/analytics/index.ts
import type { AnalyticsProvider, UserTraits } from './types';

class AnalyticsManager {
  private providers: Map<string, AnalyticsProvider> = new Map();
  private initialized = false;

  registerProvider(provider: AnalyticsProvider): void {
    this.providers.set(provider.name, provider);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await Promise.all(
      Array.from(this.providers.values()).map(p => p.initialize())
    );
    this.initialized = true;
  }

  track(event: string, properties?: Record<string, unknown>): void {
    this.providers.forEach(provider => {
      try {
        provider.track(event, properties);
      } catch (error) {
        console.error(`[Analytics] ${provider.name} error:`, error);
      }
    });
  }

  page(name?: string, properties?: Record<string, unknown>): void {
    this.providers.forEach(p => p.page(name, properties));
  }

  identify(userId: string, traits?: UserTraits): void {
    this.providers.forEach(p => p.identify(userId, traits));
  }

  reset(): void {
    this.providers.forEach(p => p.reset());
  }
}

export const analytics = new AnalyticsManager();
```

### Offline Event Queue (React Native)

```typescript
// lib/analytics/offlineQueue.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const QUEUE_KEY = '@analytics_queue';
const MAX_QUEUE_SIZE = 10000;
const BATCH_SIZE = 20;

class OfflineQueue {
  private queue: QueuedEvent[] = [];
  private isOnline = true;

  async enqueue(name: string, properties: Record<string, unknown>): Promise<void> {
    this.queue.push({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      properties,
      timestamp: new Date(),
      retryCount: 0,
    });

    if (this.queue.length > MAX_QUEUE_SIZE) {
      this.queue = this.queue.slice(-MAX_QUEUE_SIZE);
    }

    await this.persist();
    if (this.isOnline && this.queue.length >= BATCH_SIZE) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (!this.isOnline || this.queue.length === 0) return;
    
    const batch = this.queue.slice(0, BATCH_SIZE);
    try {
      await sendBatch(batch);
      this.queue = this.queue.slice(BATCH_SIZE);
      await this.persist();
    } catch (error) {
      // Retry logic
    }
  }

  private async persist(): Promise<void> {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
  }
}
```

### Server-Side Tracking (Next.js)

```typescript
// lib/analytics/server.ts
import { PostHog } from 'posthog-node';
import { cookies } from 'next/headers';

export function getServerAnalytics() {
  return new PostHog(process.env.POSTHOG_API_KEY!, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  });
}

export async function trackServerEvent(
  event: string,
  properties?: Record<string, unknown>
) {
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value;
  
  const posthog = getServerAnalytics();
  posthog.capture({
    distinctId: userId || 'anonymous',
    event,
    properties: { ...properties, source: 'server' },
  });
  await posthog.shutdown();
}
```

---

## 13. Code Examples

### Analytics Provider Setup (Next.js)

```typescript
// app/providers.tsx
'use client';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect } from 'react';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      capture_pageview: false,
      person_profiles: 'identified_only',
    });
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
```

### Analytics Provider Setup (Expo)

```typescript
// app/_layout.tsx
import { PostHogProvider } from 'posthog-react-native';

export default function RootLayout() {
  return (
    <PostHogProvider
      apiKey={process.env.EXPO_PUBLIC_POSTHOG_KEY}
      options={{ host: 'https://us.i.posthog.com' }}
    >
      <Stack />
    </PostHogProvider>
  );
}
```

### useAnalytics Hook

```typescript
// hooks/useAnalytics.ts
'use client';
import { usePostHog } from 'posthog-js/react';
import { useCallback } from 'react';

export function useAnalytics() {
  const posthog = usePostHog();

  const track = useCallback(
    (event: string, properties?: Record<string, unknown>) => {
      posthog?.capture(event, properties);
    },
    [posthog]
  );

  const identify = useCallback(
    (userId: string, traits?: Record<string, unknown>) => {
      posthog?.identify(userId, traits);
    },
    [posthog]
  );

  const reset = useCallback(() => {
    posthog?.reset();
  }, [posthog]);

  return { track, identify, reset };
}
```

### Page View Tracking (App Router)

```typescript
// components/PageViewTracker.tsx
'use client';
import { usePathname, useSearchParams } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';
import { useEffect, Suspense } from 'react';

function PageViewTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
      posthog.capture('$pageview', { $current_url: url });
    }
  }, [pathname, searchParams, posthog]);

  return null;
}

export function PageViewTracker() {
  return (
    <Suspense fallback={null}>
      <PageViewTrackerInner />
    </Suspense>
  );
}
```

### Sentry Error Boundary Component

```typescript
// components/ErrorBoundary.tsx
'use client';
import * as Sentry from '@sentry/nextjs';
import { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    Sentry.captureException(error, {
      extra: { componentStack: errorInfo.componentStack },
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 rounded">
          <h2 className="font-bold">Something went wrong</h2>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 text-blue-600 underline"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### A/B Test Implementation

```typescript
// components/ABTest.tsx
'use client';
import { useFeatureFlagVariantKey } from 'posthog-js/react';

interface ABTestProps {
  experimentKey: string;
  variants: Record<string, React.ReactNode>;
  fallback?: React.ReactNode;
}

export function ABTest({ experimentKey, variants, fallback }: ABTestProps) {
  const variant = useFeatureFlagVariantKey(experimentKey);

  if (!variant) return fallback || null;
  return variants[variant] || fallback || null;
}

// Usage
<ABTest
  experimentKey="checkout-redesign"
  variants={{
    control: <OldCheckout />,
    variant_a: <NewCheckoutA />,
    variant_b: <NewCheckoutB />,
  }}
  fallback={<OldCheckout />}
/>
```

---

## 14. Anti-Patterns to Avoid

### ❌ Tracking Everything

**Problem:** Data overload makes analysis impossible and increases costs.

**Solution:** Define a tracking plan before implementation. Ask: "What decision will this data inform?"

### ❌ Inconsistent Event Naming

**Problem:** `button_clicked`, `Button Clicked`, `buttonClicked` create separate events.

**Solution:** Enforce naming convention in code review. Use TypeScript event schemas.

### ❌ Missing User Identification

**Problem:** Anonymous events can't be tied to user journey.

**Solution:** Always call `identify()` on auth events. Reset on logout.

### ❌ No Event Documentation

**Problem:** Team members track same events differently.

**Solution:** Maintain a tracking plan document. Require documentation before implementation.

### ❌ Vanity Metrics Focus

**Problem:** Tracking page views without conversion context.

**Solution:** Tie every metric to a business outcome. Focus on actionable metrics.

### ❌ Alert Fatigue

**Problem:** Too many alerts → all alerts ignored.

**Solution:** 
- Set meaningful thresholds (percentage-based, not absolute)
- Categorize alerts (critical, warning, info)
- Monthly audit to remove noise

### ❌ Not Testing Analytics

**Problem:** Broken tracking discovered months later.

**Solution:**
```typescript
// Unit test analytics calls
describe('Analytics', () => {
  it('tracks signup event with required properties', () => {
    const mockTrack = jest.fn();
    // ... test implementation
    expect(mockTrack).toHaveBeenCalledWith('User Signed Up', {
      method: 'email',
    });
  });
});
```

---

## Decision Tree: What to Track

```
┌─────────────────────────────────────────────────────────────┐
│ Does this event inform a product/business decision?         │
└─────────────────────────────┬───────────────────────────────┘
                              │
                  ┌───────────▼───────────┐
                  │          NO           │────► Don't track
                  └───────────┬───────────┘
                              │ YES
                  ┌───────────▼───────────┐
                  │ Is this a key         │
                  │ conversion event?     │────► Track (high priority)
                  └───────────┬───────────┘
                              │ NO
                  ┌───────────▼───────────┐
                  │ Does this help        │
                  │ diagnose drop-offs?   │────► Track (medium priority)
                  └───────────┬───────────┘
                              │ NO
                  ┌───────────▼───────────┐
                  │ Is this feature usage │
                  │ for retention analysis│────► Track (medium priority)
                  └───────────┬───────────┘
                              │ NO
                  ┌───────────▼───────────┐
                  │ Consider not tracking │
                  │ or use sampling       │
                  └───────────────────────┘
```

---

## Metric Calculation Formulas

### Retention Metrics

```
N-Day Retention = (Users active on Day N / Total cohort users) × 100

Unbounded Retention = (Users active on Day N or later / Total cohort users) × 100

Gross Revenue Retention (GRR) = (Beginning MRR - Churn - Contraction) / Beginning MRR × 100
[Cannot exceed 100%]

Net Revenue Retention (NRR) = (Beginning MRR - Churn - Contraction + Expansion) / Beginning MRR × 100
[Can exceed 100% - target: >100%]
```

### Growth Metrics

```
Quick Ratio = (New MRR + Expansion MRR) / (Churned MRR + Contraction MRR)
[Target: >4 for hypergrowth, >1 for sustainable]

Viral Coefficient (K-factor) = Invites per user × Conversion rate
[>1 = viral growth]

LTV = ARPU / Monthly Churn Rate
or
LTV = ARPU × Average Customer Lifetime

LTV:CAC Ratio = Customer Lifetime Value / Customer Acquisition Cost
[Target: >3:1]
```

### Engagement Metrics

```
DAU/MAU Ratio = Daily Active Users / Monthly Active Users
[Good: 20-30%, Great: 30%+]

Stickiness = DAU / WAU or WAU / MAU

Session Frequency = Total Sessions / Unique Users (per time period)
```

---

## Implementation Checklist

### Phase 1: Foundation (Week 1-2)
- [ ] Set up PostHog account and project
- [ ] Install SDKs (Next.js + React Native)
- [ ] Configure basic page view tracking
- [ ] Implement user identification with Supabase auth
- [ ] Set up Sentry for error tracking

### Phase 2: Core Events (Week 3-4)
- [ ] Define event taxonomy document
- [ ] Implement core conversion events
- [ ] Set up funnel tracking
- [ ] Configure feature flag infrastructure
- [ ] Create TypeScript event schemas

### Phase 3: Analysis (Week 5-6)
- [ ] Build retention cohort analysis
- [ ] Create growth dashboard
- [ ] Set up alerting (Sentry + Slack)
- [ ] Configure performance monitoring (Vercel Analytics)
- [ ] Implement first A/B test

### Phase 4: Compliance (Week 7-8)
- [ ] Implement cookie consent banner
- [ ] Add data deletion endpoint
- [ ] Add data export endpoint
- [ ] Review GDPR compliance
- [ ] Document data retention policies

### Phase 5: Optimization (Ongoing)
- [ ] Monthly metric review meetings
- [ ] Quarterly tracking plan audits
- [ ] Alert fatigue review
- [ ] Performance budget enforcement
- [ ] Error budget monitoring

---

## Summary

This document provides the complete technical foundation for implementing production-grade analytics and observability. The key recommendations are:

1. **Use PostHog** as your primary analytics platform for its all-in-one capabilities and excellent Next.js/Expo integration
2. **Use Sentry** for error tracking with proper App Router and React Native configuration
3. **Implement type-safe event schemas** with TypeScript for consistency across platforms
4. **Build an abstraction layer** that allows switching providers without code changes
5. **Focus on actionable metrics** tied to business decisions, not vanity metrics
6. **Prioritize user privacy** with proper consent management and GDPR compliance
7. **Test your analytics** like you test your code

The goal is analytics that drive product decisions, not just data collection. Every event tracked should answer a specific question that informs product development, growth strategy, or business operations.