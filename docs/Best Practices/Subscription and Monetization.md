# Subscription_and_Monetization.md

# Production-Grade Subscription & Monetization Standards
## Next.js 14 App Router + Supabase + React Native/Expo

**Target Quality Bar**: Whoop ($30/month), Strava, Calm, Duolingo, Headspace

---

# Table of Contents
1. [Payment Infrastructure Architecture](#1-payment-infrastructure-architecture)
2. [Database Schema Design](#2-database-schema-design-for-supabase)
3. [Subscription Lifecycle Management](#3-subscription-lifecycle-management)
4. [Paywall Strategy & Implementation](#4-paywall-strategy-and-implementation)
5. [Pricing & Localization](#5-pricing-and-localization)
6. [Platform-Specific Requirements](#6-platform-specific-requirements)
7. [Revenue Protection](#7-revenue-protection)
8. [Analytics & Metrics](#8-analytics-and-metrics)
9. [Complete Code Examples](#9-complete-code-examples)
10. [Anti-Patterns & Common Mistakes](#10-anti-patterns-and-common-mistakes)

---

# 1. Payment Infrastructure Architecture

## Quick Reference: Platform Selection Decision Tree

```
START → Is your app on mobile (iOS/Android)?
│
├─ NO (Web only)
│   └─ Use STRIPE only (Checkout, Portal, Webhooks)
│
└─ YES (Mobile + Web)
    │
    ├─ Does app sell digital content consumed IN the app?
    │   │
    │   ├─ YES → IAP REQUIRED (Apple/Google take 15-30%)
    │   │   └─ Use RevenueCat OR Adapty + Stripe for web
    │   │
    │   └─ NO (Physical goods, reader app, 1:1 services)
    │       └─ Can use Stripe directly on mobile
    │
    └─ Is your US storefront only?
        ├─ YES → Can offer external payment links alongside IAP (Epic ruling)
        └─ NO → Must follow regional IAP requirements
```

## Platform Comparison Table

| Feature | Stripe | RevenueCat | Adapty | Superwall |
|---------|--------|-----------|--------|-----------|
| **Web Payments** | ✅ Native | ✅ Via Stripe | ❌ Mobile only | ❌ |
| **iOS IAP** | ❌ | ✅ | ✅ | ✅ (via RC/Adapty) |
| **Android Billing** | ❌ | ✅ | ✅ | ✅ (via RC/Adapty) |
| **React Native/Expo** | Via web | ✅ | ✅ | ✅ |
| **Receipt Validation** | N/A | ✅ | ✅ | Via RC/Adapty |
| **A/B Testing** | ❌ | ✅ Basic | ✅ Advanced | ✅ Best-in-class |
| **Paywall Builder** | ❌ | ✅ v2 | ✅ Mature | ✅ Best-in-class |
| **Free Tier Limit** | N/A | $2.5K MTR | $10K MTR | $10K MAR |
| **Pricing** | 2.9% + $0.30/txn | 1% MTR (>$2.5K) | 1% MTR ($99 min) | 1% MAR + $49-199/mo |

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        WEB (Next.js 14)                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Stripe Checkout Sessions + Customer Portal          │   │
│  │ Webhooks → Next.js API Routes                       │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     SUPABASE (Backend)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ • Auth (user_id = source of truth)                  │   │
│  │ • subscriptions table (synced from all sources)     │   │
│  │ • Edge Functions OR Next.js API for webhooks        │   │
│  │ • Row Level Security for subscription gating        │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  MOBILE (React Native/Expo)                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ RevenueCat SDK (recommended) OR Adapty SDK          │   │
│  │ Connect to Stripe for cross-platform sync           │   │
│  │ + Superwall (optional, for paywall optimization)    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Cross-Platform Subscription Sync Strategy

**Critical**: Use your Supabase `auth.users.id` as the common identifier everywhere.

```typescript
// Mobile: Set RevenueCat app user ID to Supabase user ID
import Purchases from 'react-native-purchases';

const setupRevenueCat = async (supabaseUserId: string) => {
  await Purchases.configure({ 
    apiKey: Platform.OS === 'ios' ? APPLE_API_KEY : GOOGLE_API_KEY 
  });
  await Purchases.logIn(supabaseUserId);
};

// Web: Associate Stripe customer with Supabase user ID
const stripeCustomer = await stripe.customers.create({
  email: user.email,
  metadata: { supabase_user_id: user.id }
});
```

---

# 2. Database Schema Design for Supabase

## Core Schema

```sql
-- Enums
CREATE TYPE pricing_type AS ENUM ('one_time', 'recurring');
CREATE TYPE pricing_plan_interval AS ENUM ('day', 'week', 'month', 'year');
CREATE TYPE subscription_status AS ENUM (
  'trialing', 'active', 'canceled', 'incomplete', 
  'incomplete_expired', 'past_due', 'unpaid', 'paused'
);

-- Customers (links Supabase users to Stripe)
CREATE TABLE public.customers (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products (synced from Stripe)
CREATE TABLE public.products (
  id TEXT PRIMARY KEY, -- Stripe product ID (prod_xxx)
  active BOOLEAN DEFAULT true,
  name TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Prices (synced from Stripe)
CREATE TABLE public.prices (
  id TEXT PRIMARY KEY, -- Stripe price ID (price_xxx)
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  unit_amount BIGINT, -- cents
  currency TEXT CHECK (char_length(currency) = 3),
  type pricing_type,
  interval pricing_plan_interval,
  interval_count INTEGER,
  trial_period_days INTEGER,
  metadata JSONB DEFAULT '{}'
);

-- Subscriptions (source of truth)
CREATE TABLE public.subscriptions (
  id TEXT PRIMARY KEY, -- Stripe subscription ID (sub_xxx)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status subscription_status NOT NULL,
  price_id TEXT REFERENCES public.prices(id),
  quantity INTEGER DEFAULT 1,
  cancel_at_period_end BOOLEAN DEFAULT false,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- Webhook idempotency tracking
CREATE TABLE public.processed_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_active ON public.subscriptions(user_id) 
  WHERE status IN ('active', 'trialing');
```

## Entitlements System

```sql
-- Plans (free, basic, premium, enterprise)
CREATE TABLE public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  product_id TEXT REFERENCES public.products(id)
);

-- Features
CREATE TABLE public.features (
  id TEXT PRIMARY KEY, -- e.g., 'api_access', 'team_members'
  name TEXT NOT NULL,
  feature_type TEXT DEFAULT 'boolean' -- boolean, numeric, metered
);

-- Plan-Feature mapping
CREATE TABLE public.plan_entitlements (
  plan_id TEXT REFERENCES public.plans(id) ON DELETE CASCADE,
  feature_id TEXT REFERENCES public.features(id) ON DELETE CASCADE,
  value JSONB NOT NULL, -- true/false or numeric limit
  limit_value INTEGER, -- for metered features
  PRIMARY KEY (plan_id, feature_id)
);

-- Entitlement check function
CREATE OR REPLACE FUNCTION public.check_entitlement(
  p_user_id UUID,
  p_feature_id TEXT
) RETURNS JSONB AS $$
DECLARE
  v_plan_id TEXT;
BEGIN
  -- Get user's current plan
  SELECT p.id INTO v_plan_id
  FROM public.subscriptions s
  JOIN public.prices pr ON s.price_id = pr.id
  JOIN public.plans p ON p.product_id = pr.product_id
  WHERE s.user_id = p_user_id
    AND s.status IN ('active', 'trialing')
  ORDER BY s.created DESC LIMIT 1;
  
  -- Fall back to free plan
  IF v_plan_id IS NULL THEN
    SELECT id INTO v_plan_id FROM public.plans WHERE is_default = true;
  END IF;
  
  -- Return entitlement
  RETURN (
    SELECT jsonb_build_object(
      'has_access', COALESCE((pe.value)::boolean, false),
      'limit', pe.limit_value
    )
    FROM public.plan_entitlements pe
    WHERE pe.plan_id = v_plan_id AND pe.feature_id = p_feature_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Row Level Security Policies

```sql
-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;

-- Users can only view their own data
CREATE POLICY "Users view own customer" ON public.customers
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Products and prices are public
CREATE POLICY "Public products" ON public.products
  FOR SELECT USING (active = true);

CREATE POLICY "Public prices" ON public.prices
  FOR SELECT USING (active = true);

-- Webhooks use service role (bypasses RLS)
```

---

# 3. Subscription Lifecycle Management

## Lifecycle State Machine

```
┌──────────────┐
│   SIGNUP     │
└──────┬───────┘
       │ Start Trial
       ▼
┌──────────────┐   Trial Ends (no payment method)   ┌──────────────┐
│   TRIALING   │ ─────────────────────────────────► │    PAUSED    │
└──────┬───────┘                                    └──────────────┘
       │ Trial Converts (payment succeeds)
       ▼
┌──────────────┐   Payment Fails    ┌──────────────┐
│    ACTIVE    │ ─────────────────► │   PAST_DUE   │
└──────┬───────┘                    └──────┬───────┘
       │                                   │ Retries Exhausted
       │ User Cancels                      ▼
       │                            ┌──────────────┐
       │                            │    UNPAID    │
       ▼                            └──────────────┘
┌──────────────┐
│   CANCELED   │ ◄── Immediate cancel OR end of period
└──────────────┘
```

## Webhook Events Handling Reference

| Event | When | Action Required |
|-------|------|-----------------|
| `checkout.session.completed` | Checkout completes | Create customer link, provision access |
| `customer.subscription.created` | Subscription created | Store in DB (status may be `incomplete`) |
| `customer.subscription.updated` | Any change | Update DB, check for upgrade/downgrade |
| `customer.subscription.deleted` | Subscription ends | Revoke access |
| `customer.subscription.trial_will_end` | 3 days before trial ends | Send notification, verify payment method |
| `invoice.paid` | Payment succeeds | Extend access period |
| `invoice.payment_failed` | Payment fails | Notify user, start dunning flow |
| `invoice.payment_action_required` | 3DS/SCA needed | Prompt user to authenticate |

## Trial Management

```typescript
// Stripe Checkout with trial
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [{ price: priceId, quantity: 1 }],
  subscription_data: {
    trial_period_days: 14,
    trial_settings: {
      end_behavior: {
        missing_payment_method: 'pause', // or 'cancel' or 'create_invoice'
      },
    },
  },
  // ... other config
});
```

## Proration Handling

```typescript
// Upgrade/downgrade subscription
await stripe.subscriptions.update(subscriptionId, {
  items: [{ id: itemId, price: newPriceId }],
  proration_behavior: 'create_prorations', // or 'always_invoice' or 'none'
});
```

| Behavior | Effect |
|----------|--------|
| `create_prorations` | Credits/debits on next invoice |
| `always_invoice` | Immediate invoice for difference |
| `none` | New price starts next period, no proration |

## Cancellation Flows

```typescript
// Cancel at end of period (graceful)
await stripe.subscriptions.update(subscriptionId, {
  cancel_at_period_end: true,
});

// Immediate cancellation
await stripe.subscriptions.cancel(subscriptionId);

// Cancel at specific date
await stripe.subscriptions.update(subscriptionId, {
  cancel_at: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
});
```

---

# 4. Paywall Strategy and Implementation

## Paywall Type Decision Framework

```
START → Is your content/service unique & irreplaceable?
│
├─ YES → Do you have an established brand?
│   ├─ YES → HARD PAYWALL (12% median conversion)
│   └─ NO → METERED (build audience first)
│
└─ NO → Is your app feature-rich with clear premium tiers?
    ├─ YES → FREEMIUM (2.2% median, high volume)
    └─ NO → METERED or DYNAMIC
```

## Paywall Types Comparison

| Type | Conversion Rate | Best For |
|------|----------------|----------|
| **Hard Paywall** | 12.11% median | Established brands, unique content |
| **Freemium** | 2.18% median | Apps needing growth, network effects |
| **Metered** | 5-10% of engaged | Content-driven apps, news |
| **Reverse Trial** | Higher than freemium | Feature-rich apps (Duolingo model) |

## When to Show Paywalls

| Timing | Effectiveness | Notes |
|--------|--------------|-------|
| **Before onboarding** | ⭐⭐⭐⭐⭐ | Can 5x revenue (Rootd case study) |
| **After onboarding** | ⭐⭐⭐⭐⭐ | User understands value |
| **After achievement** | ⭐⭐⭐⭐ | Users receptive post-reward |
| **Premium feature access** | ⭐⭐⭐⭐ | Natural friction point |
| **Returning users** | ⭐⭐⭐ | Builds familiarity |

**When NOT to show**: During critical tasks, after frustration, too frequently, before ANY value demonstrated.

## Case Studies: Premium App Strategies

### Whoop ($30/month)
- Hardware-as-a-service model
- Hard paywall (device required)
- 1-month free trial
- Three tiers: One ($25), Peak ($30), Life ($40)

### Calm
- Annual-first pricing ($69.99/year vs $14.99/month)
- Soft paywall after onboarding
- Lifetime option at $399.99
- Daily reminders = 3x retention

### Strava
- Strong freemium (network effects)
- Core tracking free, analytics premium
- $79.99/year, 30-day trial
- Regional pricing varies 3x globally

### Duolingo
- 7+ paywall touchpoints per session
- Reverse trials (full access → downgrade)
- "Try for $0" > "Try free for 7 days"
- 300+ A/B tests per quarter

### Headspace
- Most aggressive discounts (85% off students)
- Soft paywall, contextual timing
- 49% more conversions with optimized messaging

## Paywall A/B Testing Guide

### What to Test (Priority Order)

| Element | Impact | Notes |
|---------|--------|-------|
| **Price points** | Very High | Test large jumps ($30 vs $90) |
| **Trial length** | High | 5-9 days optimal for many apps |
| **Copy** | High | Outcomes > features |
| **Visuals/video** | High | Videos can 2x conversion |
| **Products shown** | High | 1 vs 3 options |
| **Price display** | High | "$5/mo billed annually" wins |

### Statistical Requirements
- **95% confidence interval** minimum
- At 2% baseline, expecting 25% lift, 1000 users/day = **127 days** for significance
- Track **ARPU** not just conversion (accounts for rebills/churn)

---

# 5. Pricing and Localization

## Pricing Psychology Tactics

### Price Anchoring
- Show highest price first (annual becomes the anchor)
- Display monthly cost for annual billing: "$5/mo billed annually"
- **60% ARPU increase** observed with this framing

### Decoy Pricing (3-Tier Strategy)
```
❌ Without decoy: 68% choose cheaper option
✅ With decoy:    84% choose premium option

Example:
• Basic:   $99  (16% choose)
• Standard: $149 ← DECOY (0% choose)
• Premium: $155 (84% choose)
```

### Charm Pricing
- **$9.99 > $10** increases sales by **24%**
- Left-digit effect: brain anchors to "9"
- Use for value positioning, NOT luxury

## Premium App Pricing Reference

| App | Monthly | Annual | Savings | Trial |
|-----|---------|--------|---------|-------|
| Whoop | $25-40 | $240-480 | 20% | 1 month |
| Calm | $14.99 | $69.99 | 61% | 7 days |
| Strava | $11.99 | $79.99 | 44% | 30 days |
| Duolingo | $12.99 | $59.99 | 62% | 14 days |
| Headspace | $12.99 | $69.99 | 55% | 7-14 days |

## Regional Pricing (PPP)

**Impact**: Companies with localized pricing see **30% higher growth rates**.

```typescript
// Example: Implement PPP with Stripe
const getPPPPrice = (basePrice: number, countryCode: string): number => {
  const pppFactors: Record<string, number> = {
    'US': 1.0,
    'IN': 0.25,  // India
    'BR': 0.35,  // Brazil
    'PL': 0.45,  // Poland
    'GB': 0.95,  // UK
    // Add more countries
  };
  
  const factor = pppFactors[countryCode] || 1.0;
  const adjusted = Math.round(basePrice * factor * 100) / 100;
  
  // Enforce floor (20% of base) and ceiling (300% of base)
  return Math.max(basePrice * 0.2, Math.min(adjusted, basePrice * 3.0));
};
```

---

# 6. Platform-Specific Requirements

## Apple App Store IAP Requirements

### When IAP is REQUIRED (Section 3.1.1)
- ❌ Unlocking features/functionality within apps
- ❌ Digital goods (virtual items, content)
- ❌ Subscription services for in-app content
- ❌ "Loot boxes" (must disclose odds)

### When IAP is NOT Required
- ✅ Physical goods/services consumed outside app
- ✅ Person-to-person services (1:1 only - tutoring, consultations)
- ✅ Enterprise services sold to organizations
- ✅ Reader apps (Netflix, Spotify, Kindle)
- ✅ **US Storefront**: Can offer external payment links (Epic ruling, April 2025)

### Fee Structure

| Category | Commission |
|----------|------------|
| Standard | 30% |
| Small Business (<$1M/year) | 15% |
| Subscriptions after year 1 | 15% |

### Subscription Disclosure Requirements
Must include in app:
```
A [price and period] purchase will be applied to your iTunes account 
[at the end of the trial | on confirmation]. Subscriptions will 
automatically renew unless canceled within 24-hours before the end 
of the current period. You can cancel anytime with your iTunes 
account settings. Any unused portion of a free trial will be 
forfeited if you purchase a subscription.
```

## Google Play Billing Requirements

### When Required
- ❌ Digital items (currencies, in-game items, avatars)
- ❌ Subscription services (fitness, education, content)
- ❌ App functionality/premium features
- ❌ Cloud software and services

### When NOT Required
- ✅ Physical goods
- ✅ Physical services
- ✅ Peer-to-peer payments

### Fee Structure

| Category | Fee |
|----------|-----|
| Standard | 30% |
| First $1M/year | 15% |
| Subscriptions after year 1 | 15% |
| Alternative billing (4% discount) | 26% |

### Grace Period & Account Hold
- **Grace period**: User retains access, payment retrying
- **Account hold**: User loses access after grace period
- Configure in Play Console for optimal recovery

## Decision Tree: IAP Required?

```
Is this a US App Store release?
│
├─ YES
│   └─ Can offer external links + IAP together (Epic ruling)
│
└─ NO
    │
    └─ Is this a READER APP? (magazines, books, audio, video)
        │
        ├─ YES → Apply for External Link Account Entitlement
        │
        └─ NO → Is it 1:1 person-to-person services?
            │
            ├─ YES → External payment allowed
            │
            └─ NO → IAP REQUIRED
```

---

# 7. Revenue Protection

## Server-Side Receipt Validation

**Never trust client-side purchase validation**. Use RevenueCat or implement server-side:

```typescript
// RevenueCat handles this automatically
// For custom implementation:
const validateAppleReceipt = async (receiptData: string): Promise<boolean> => {
  const response = await fetch(
    process.env.NODE_ENV === 'production'
      ? 'https://buy.itunes.apple.com/verifyReceipt'
      : 'https://sandbox.itunes.apple.com/verifyReceipt',
    {
      method: 'POST',
      body: JSON.stringify({
        'receipt-data': receiptData,
        'password': process.env.APPLE_SHARED_SECRET,
        'exclude-old-transactions': true,
      }),
    }
  );
  
  const data = await response.json();
  return data.status === 0;
};
```

## Fraud Prevention Techniques

1. **Server-side subscription checks** - Never rely on client state
2. **Device fingerprinting** - Detect multi-account abuse
3. **Velocity checks** - Flag unusual purchase patterns
4. **Trial abuse prevention** - Track trial history per device/email

```sql
-- Trial eligibility check
CREATE TABLE public.trial_history (
  user_id UUID REFERENCES auth.users(id),
  product_id TEXT,
  device_fingerprint TEXT,
  trial_started_at TIMESTAMPTZ,
  converted_to_paid BOOLEAN DEFAULT false,
  UNIQUE(user_id, product_id)
);
```

## Dunning Management

Configure in Stripe Dashboard (`Settings > Billing > Automatic`):

| Setting | Recommendation |
|---------|---------------|
| **Smart Retries** | Enable (ML-optimized timing) |
| **Retry schedule** | Up to 4 weeks |
| **Failed payment emails** | Enable all |
| **After retries exhausted** | Mark as `canceled` |

## Churn Prevention Signals

Monitor these early warning indicators:
- **30+ days since last session**
- **Feature usage decline** (week-over-week)
- **Support tickets increasing**
- **Payment method expiring soon**
- **Multiple failed payment attempts**

---

# 8. Analytics and Metrics

## Core Subscription Metrics

### MRR (Monthly Recurring Revenue)
```
MRR = (Monthly subscribers × Monthly price) + 
      (Annual subscribers × Annual price / 12)
```

### ARR (Annual Recurring Revenue)
```
ARR = MRR × 12
```

### LTV (Customer Lifetime Value)
```
LTV = ARPU × Average Customer Lifespan

Where:
- Average Customer Lifespan = 1 / Monthly Churn Rate
- If 5% monthly churn → Lifespan = 1/0.05 = 20 months
```

### Churn Rate
```
Monthly Churn = (Churned customers this month) / (Total customers at start of month)

Annual Churn ≠ Monthly Churn × 12
Annual Churn = 1 - (1 - Monthly Churn)^12
```

### CAC (Customer Acquisition Cost)
```
CAC = Total Marketing Spend / New Customers Acquired

Target: LTV/CAC > 3:1
```

## Benchmark Metrics (2025)

| Metric | Average | Good | Great |
|--------|---------|------|-------|
| Install-to-Trial | 3.7% | 8% | 15%+ |
| Trial-to-Paid | 30-45% | 50% | 60%+ |
| Monthly Churn | 5.3% | 4% | <3% |
| Annual Churn | 28% | 20% | <15% |
| LTV/CAC Ratio | 3:1 | 4:1 | 5:1+ |

## Health & Fitness Benchmarks (Whoop, Calm category)

| Metric | Median | Top 10% |
|--------|--------|---------|
| Trial-to-Paid | 39.9% | 68.3% |
| Year 1 LTV | $16.44 | $40+ |
| Annual Plan % | 67% | 80%+ |

---

# 9. Complete Code Examples

## Stripe Webhook Handler (Next.js 14 App Router)

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20',
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  // 1. Get raw body (CRITICAL for signature verification)
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  // 2. Verify webhook signature
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // 3. Idempotency check
  const { data: existingEvent } = await supabaseAdmin
    .from('processed_webhook_events')
    .select('event_id')
    .eq('event_id', event.id)
    .single();

  if (existingEvent) {
    console.log(`Event ${event.id} already processed`);
    return NextResponse.json({ received: true });
  }

  try {
    // 4. Handle events
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialEnding(event.data.object as Stripe.Subscription);
        break;
    }

    // 5. Mark as processed
    await supabaseAdmin.from('processed_webhook_events').insert({
      event_id: event.id,
      event_type: event.type,
    });

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error(`Webhook processing error: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== 'subscription') return;

  const userId = session.metadata?.userId;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  // Link customer
  await supabaseAdmin.from('customers').upsert({
    id: userId,
    stripe_customer_id: customerId,
  });

  // Fetch and store subscription
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await upsertSubscription(subscription);
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  await upsertSubscription(subscription);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'canceled', ended_at: new Date().toISOString() })
    .eq('id', subscription.id);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;
  
  const periodEnd = invoice.lines.data[0]?.period.end;
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_end: new Date(periodEnd * 1000).toISOString(),
    })
    .eq('id', invoice.subscription);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // TODO: Send notification email
  // TODO: Track failed payment count for dunning
  console.log(`Payment failed for invoice ${invoice.id}`);
}

async function handleTrialEnding(subscription: Stripe.Subscription) {
  // TODO: Send trial ending notification
  console.log(`Trial ending for subscription ${subscription.id}`);
}

async function upsertSubscription(subscription: Stripe.Subscription) {
  const { data: customer } = await supabaseAdmin
    .from('customers')
    .select('id')
    .eq('stripe_customer_id', subscription.customer as string)
    .single();

  await supabaseAdmin.from('subscriptions').upsert({
    id: subscription.id,
    user_id: customer?.id,
    status: subscription.status,
    price_id: subscription.items.data[0]?.price.id,
    quantity: subscription.items.data[0]?.quantity ?? 1,
    cancel_at_period_end: subscription.cancel_at_period_end,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    trial_start: subscription.trial_start
      ? new Date(subscription.trial_start * 1000).toISOString()
      : null,
    trial_end: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
  });
}
```

## React Hooks for Subscription State

```typescript
// hooks/useSubscription.ts
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

interface Subscription {
  id: string;
  status: string;
  price_id: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  trial_end: string | null;
}

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  isLoading: boolean;
  isActive: boolean;
  isTrialing: boolean;
  isCanceled: boolean;
  daysUntilRenewal: number | null;
  refetch: () => Promise<void>;
}

export function useSubscription(user: User | null): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing', 'past_due'])
      .order('created', { ascending: false })
      .limit(1)
      .single();

    setSubscription(error ? null : data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSubscription();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user?.id}`,
        },
        () => fetchSubscription()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const isActive = subscription?.status === 'active';
  const isTrialing = subscription?.status === 'trialing';
  const isCanceled = subscription?.cancel_at_period_end ?? false;

  const daysUntilRenewal = subscription?.current_period_end
    ? Math.ceil(
        (new Date(subscription.current_period_end).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return {
    subscription,
    isLoading,
    isActive,
    isTrialing,
    isCanceled,
    daysUntilRenewal,
    refetch: fetchSubscription,
  };
}

// hooks/useEntitlements.ts
export function useEntitlements(user: User | null) {
  const [entitlements, setEntitlements] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchEntitlements = async () => {
      if (!user) {
        setEntitlements({});
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('get_user_entitlements', {
        p_user_id: user.id,
      });

      setEntitlements(error ? {} : data);
      setIsLoading(false);
    };

    fetchEntitlements();
  }, [user?.id]);

  const hasFeature = (featureId: string): boolean => {
    return entitlements[featureId] ?? false;
  };

  return { entitlements, isLoading, hasFeature };
}
```

## Paywall Component

```typescript
// components/Paywall.tsx
'use client';

import { useState } from 'react';
import { createCheckoutSession } from '@/app/actions/stripe';

interface Plan {
  id: string;
  name: string;
  priceId: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
}

interface PaywallProps {
  plans: Plan[];
  onClose?: () => void;
  placement?: string;
}

export function Paywall({ plans, onClose, placement = 'default' }: PaywallProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>(
    plans.find((p) => p.popular)?.id || plans[0]?.id
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    const plan = plans.find((p) => p.id === selectedPlan);
    if (!plan) return;

    setIsLoading(true);
    setError(null);

    try {
      // Track analytics
      trackEvent('paywall_cta_tapped', {
        placement,
        plan_id: plan.id,
        price: plan.price,
      });

      await createCheckoutSession(plan.priceId);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Unlock Premium</h2>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          )}
        </div>

        {/* Social Proof */}
        <div className="flex items-center gap-2 mb-6 text-sm text-gray-600">
          <span className="flex">{'⭐'.repeat(5)}</span>
          <span>4.8 from 50,000+ reviews</span>
        </div>

        {/* Plans */}
        <div className="space-y-3 mb-6">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                selectedPlan === plan.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{plan.name}</span>
                    {plan.popular && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                        Most Popular
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {plan.interval === 'year' && (
                      <span className="text-green-600 font-medium">
                        Save {Math.round((1 - plan.price / 12 / (plans.find(p => p.interval === 'month')?.price || plan.price)) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-xl">
                    ${(plan.price / (plan.interval === 'year' ? 12 : 1)).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">per month</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleSubscribe}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 rounded-xl transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing...
            </span>
          ) : (
            'Start Free Trial'
          )}
        </button>

        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm text-center mt-3">{error}</p>
        )}

        {/* Terms */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Cancel anytime. By subscribing, you agree to our{' '}
          <a href="/terms" className="underline">Terms</a> and{' '}
          <a href="/privacy" className="underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}

// Analytics helper
function trackEvent(event: string, properties: Record<string, any>) {
  // Implement with your analytics provider
  console.log('Track:', event, properties);
}
```

## Server Actions for Stripe

```typescript
// app/actions/stripe.ts
'use server';

import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20',
});

export async function createCheckoutSession(priceId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get or create Stripe customer
  let { data: customer } = await supabase
    .from('customers')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  let customerId = customer?.stripe_customer_id;

  if (!customerId) {
    const stripeCustomer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = stripeCustomer.id;

    await supabase.from('customers').insert({
      id: user.id,
      stripe_customer_id: customerId,
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
    metadata: { userId: user.id },
    subscription_data: {
      trial_period_days: 7,
      metadata: { userId: user.id },
    },
    allow_promotion_codes: true,
  });

  redirect(session.url!);
}

export async function createCustomerPortalSession() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: customer } = await supabase
    .from('customers')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!customer?.stripe_customer_id) {
    throw new Error('No subscription found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customer.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
  });

  redirect(session.url);
}
```

## Server-Side Entitlement Middleware

```typescript
// middleware/withSubscription.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function withSubscription(
  request: NextRequest,
  requiredFeature?: string
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check subscription status
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing'])
    .single();

  if (!subscription) {
    return NextResponse.redirect(new URL('/pricing', request.url));
  }

  // Check specific feature if required
  if (requiredFeature) {
    const { data: entitlement } = await supabase.rpc('check_entitlement', {
      p_user_id: user.id,
      p_feature_id: requiredFeature,
    });

    if (!entitlement?.has_access) {
      return NextResponse.redirect(new URL('/upgrade', request.url));
    }
  }

  return NextResponse.next();
}
```

## RevenueCat Integration (React Native/Expo)

```typescript
// lib/revenuecat.ts
import Purchases, {
  LOG_LEVEL,
  CustomerInfo,
  PurchasesPackage,
} from 'react-native-purchases';
import { Platform } from 'react-native';

const APPLE_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY!;
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY!;

export async function initializeRevenueCat(userId?: string) {
  Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

  await Purchases.configure({
    apiKey: Platform.OS === 'ios' ? APPLE_API_KEY : GOOGLE_API_KEY,
  });

  if (userId) {
    await Purchases.logIn(userId);
  }
}

export async function getOfferings() {
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  return await Purchases.restorePurchases();
}

export async function getCustomerInfo(): Promise<CustomerInfo> {
  return await Purchases.getCustomerInfo();
}

export function isEntitlementActive(
  customerInfo: CustomerInfo,
  entitlementId: string
): boolean {
  return customerInfo.entitlements.active[entitlementId] !== undefined;
}

// React hook
import { useEffect, useState } from 'react';

export function useRevenueCat(userId?: string) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const setup = async () => {
      await initializeRevenueCat(userId);
      const info = await getCustomerInfo();
      setCustomerInfo(info);
      setIsLoading(false);

      // Listen for changes
      Purchases.addCustomerInfoUpdateListener((info) => {
        setCustomerInfo(info);
      });
    };

    setup();
  }, [userId]);

  const isPremium = customerInfo
    ? isEntitlementActive(customerInfo, 'premium')
    : false;

  return { customerInfo, isLoading, isPremium };
}
```

---

# 10. Anti-Patterns and Common Mistakes

## 🚫 Webhook Handling Mistakes

| Anti-Pattern | Consequence | Correct Approach |
|--------------|-------------|------------------|
| Parsing JSON before signature verification | Signature fails, webhooks rejected | Use `req.text()`, verify, then parse |
| No idempotency checking | Duplicate subscriptions, double charges | Store processed event IDs |
| Ignoring event order | Data inconsistency | Always upsert, handle missing records |
| Slow webhook processing | Timeouts, Stripe retries | Return 2xx immediately, process async |
| Not handling all statuses | Users with invalid access | Handle all subscription statuses |

## 🚫 Security Vulnerabilities

| Anti-Pattern | Risk | Correct Approach |
|--------------|------|------------------|
| Client-side subscription checks | Users bypass paywall | Server-side verification only |
| Exposing Stripe secret key | Full account compromise | Server-side only, environment variables |
| No RLS on subscription tables | Data leaks | Enable RLS, use service role for webhooks |
| Trusting client purchase receipts | Fake purchases | Server-side receipt validation |

## 🚫 UX Patterns That Increase Churn

| Anti-Pattern | Impact | Better Approach |
|--------------|--------|-----------------|
| Hidden cancellation | Trust loss, negative reviews | Easy, transparent cancellation |
| No trial ending reminder | Surprise charges, refunds | Send reminders 3 days and 1 day before |
| Immediate cancellation only | Unnecessary churn | Offer end-of-period cancellation |
| No win-back flow | Lost revenue | Re-engagement campaigns at 30/60 days |
| Aggressive paywall frequency | User fatigue | Limit to key moments, track fatigue |

## 🚫 Compliance Issues

| Anti-Pattern | Risk | Correct Approach |
|--------------|------|------------------|
| No IAP when required | App rejection/removal | Follow App Store Guidelines 3.1.1 |
| Missing subscription disclosure | App rejection | Include required disclosure text |
| Steering users away from IAP (non-US) | Account termination | Only use external links with entitlement |
| No restore purchases | App rejection | Always implement restore functionality |
| Unclear pricing | Regulatory issues | Show clear, transparent pricing |

## 🚫 Revenue-Losing Mistakes

| Anti-Pattern | Revenue Impact | Better Approach |
|--------------|----------------|-----------------|
| Only monthly pricing | -50% LTV | Promote annual plans (61%+ savings message) |
| No trial | -30% conversions | Offer 7-14 day trial |
| Single paywall touchpoint | -40% visibility | Multiple touchpoints (7+ per Duolingo) |
| No price localization | -30% growth | Implement PPP pricing |
| No A/B testing | Unknown loss | Test pricing, copy, design continuously |
| Ignoring failed payments | -10% revenue | Implement dunning, smart retries |

## Quick Reference: Webhook Event Checklist

```
✅ checkout.session.completed → Link customer, provision access
✅ customer.subscription.created → Store subscription
✅ customer.subscription.updated → Update status, check upgrade/downgrade
✅ customer.subscription.deleted → Revoke access
✅ customer.subscription.trial_will_end → Send notification
✅ invoice.paid → Extend access period
✅ invoice.payment_failed → Notify user, start dunning
✅ invoice.payment_action_required → Prompt authentication
```

## Quick Reference: Subscription Status Actions

```
trialing → Full access, show trial ending reminder
active → Full access
past_due → Full access, show payment failed banner
incomplete → Limited access, prompt payment completion
incomplete_expired → No access
unpaid → No access
canceled → No access (or until period end if cancel_at_period_end)
paused → No access, show resubscribe option
```

---

# Deployment Checklist

## Environment Variables

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... # Server-side only!

# RevenueCat (mobile)
EXPO_PUBLIC_REVENUECAT_APPLE_KEY=appl_xxx
EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY=goog_xxx

# App
NEXT_PUBLIC_SITE_URL=https://yourapp.com
```

## Pre-Launch Checklist

- [ ] Stripe webhook endpoint configured and tested
- [ ] All webhook events selected in Stripe Dashboard
- [ ] Customer Portal configured in Stripe Dashboard
- [ ] Smart Retries and dunning enabled
- [ ] Supabase RLS policies in place
- [ ] RevenueCat connected to Stripe (for mobile)
- [ ] Test purchases completed on all platforms
- [ ] Restore purchases working
- [ ] Subscription disclosure text in app
- [ ] Privacy policy and terms updated
- [ ] Analytics tracking implemented

## Monitoring

- [ ] Webhook failure alerts configured
- [ ] Subscription metrics dashboard set up
- [ ] Churn alerts for unusual patterns
- [ ] Failed payment notifications working
- [ ] Trial conversion tracking active

---

*Document Version: 1.0 | Last Updated: January 2026 | Target Stack: Next.js 14 + Supabase + React Native/Expo*