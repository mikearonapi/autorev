# AutoRev Analytics Tracking Plan

> **Last Updated:** January 2026  
> **Owner:** Product/Engineering  
> **Analytics Stack:** PostHog (primary), GA4 (secondary), Sentry (errors)

## Overview

This document defines the analytics events tracked across AutoRev. All events follow the **"Object + Past-Tense Verb"** naming convention in Title Case.

### Quick Links
- [Event Schema Types](/lib/analytics/types.ts)
- [Event Tracking Code](/lib/analytics/events.js)
- [PostHog Provider](/components/providers/PostHogProvider.jsx)

---

## Event Naming Convention

All events must follow this format:

```
{Object} {Past-Tense Verb}
```

**Examples:**
- ✅ `Signup Completed`
- ✅ `Car Viewed`
- ✅ `Build Saved`
- ❌ `signup_completed` (wrong case)
- ❌ `View Car` (wrong verb tense)
- ❌ `CarViewed` (missing space)

---

## Core Events

### Authentication Events

| Event Name | When Fired | Required Properties | Optional Properties | Owner |
|------------|------------|---------------------|---------------------|-------|
| `Signup Completed` | User creates new account | `method` (google/email) | `referral_code` | Growth |
| `Login Completed` | User logs in | `method` | - | Growth |
| `Logout Completed` | User logs out | - | - | Growth |
| `Password Reset Requested` | Password reset initiated | - | `email` | Growth |

### Onboarding Events

| Event Name | When Fired | Required Properties | Optional Properties | Owner |
|------------|------------|---------------------|---------------------|-------|
| `Onboarding Started` | User begins onboarding | - | `source` | Growth |
| `Onboarding Step Completed` | User completes a step | `step`, `step_name` | `time_spent_seconds` | Growth |
| `Onboarding Completed` | User finishes onboarding | - | `skipped_steps` | Growth |
| `Onboarding Skipped` | User skips onboarding | - | `step` | Growth |

### Car Discovery Events

| Event Name | When Fired | Required Properties | Optional Properties | Owner |
|------------|------------|---------------------|---------------------|-------|
| `Car Viewed` | User views car detail page | `car_id`, `car_slug`, `car_name` | `source` | Product |
| `Car Searched` | User performs search | `query`, `results_count` | `filters_applied` | Product |
| `Cars Filtered` | User applies filters | `filters`, `results_count` | - | Product |
| `Cars Compared` | User compares cars | `car_slugs`, `count` | - | Product |

### Garage Events

| Event Name | When Fired | Required Properties | Optional Properties | Owner |
|------------|------------|---------------------|---------------------|-------|
| `Garage Vehicle Added` | User adds vehicle to garage | `car_slug` | `car_id`, `car_name`, `year`, `make`, `model` | Product |
| `Garage Vehicle Removed` | User removes vehicle | `car_slug` | - | Product |
| `Garage Vehicle Updated` | User updates vehicle details | `vehicle_id` | `fields_updated` | Product |
| `Favorite Added` | User favorites a car | `car_id`, `car_slug` | - | Product |
| `Favorite Removed` | User unfavorites a car | `car_id`, `car_slug` | - | Product |

### Build/Tuning Events

| Event Name | When Fired | Required Properties | Optional Properties | Owner |
|------------|------------|---------------------|---------------------|-------|
| `Build Created` | User creates new build project | `build_id`, `car_id`, `car_slug` | - | Product |
| `Build Saved` | User saves build changes | `build_id`, `car_id`, `car_slug` | `upgrade_count`, `hp_gain`, `total_cost` | Product |
| `Build Upgrade Added` | User adds mod to build | `build_id`, `upgrade_category`, `upgrade_name` | `upgrade_cost`, `hp_gain` | Product |
| `Build Upgrade Removed` | User removes mod from build | `build_id`, `upgrade_category`, `upgrade_name` | - | Product |
| `Build Performance Viewed` | User views performance calc | `build_id`, `car_id` | `hp_gain` | Product |
| `Build Shared` | User shares build | `build_id`, `car_slug` | `share_method` | Product |

### AL (AI Assistant) Events

| Event Name | When Fired | Required Properties | Optional Properties | Owner |
|------------|------------|---------------------|---------------------|-------|
| `AL Conversation Started` | User starts new chat | - | `conversation_id`, `car_context` | AI |
| `AL Message Sent` | User sends message | - | `message_id`, `query_type` | AI |
| `AL Response Received` | AL responds | - | `response_time_ms`, `credits_used` | AI |
| `AL Feedback Given` | User rates response | `feedback` (positive/negative) | `message_id` | AI |
| `AL Credits Used` | Credits consumed | `credits_used` | `conversation_id` | AI |

### Events Calendar

| Event Name | When Fired | Required Properties | Optional Properties | Owner |
|------------|------------|---------------------|---------------------|-------|
| `Event Viewed` | User views event details | `event_id`, `event_name` | `event_type`, `location` | Product |
| `Event Saved` | User saves event | `event_id`, `event_name` | - | Product |
| `Event Registered` | User registers for event | `event_id`, `event_name` | - | Product |
| `Event Shared` | User shares event | `event_id` | `share_method` | Product |

### Community Events

| Event Name | When Fired | Required Properties | Optional Properties | Owner |
|------------|------------|---------------------|---------------------|-------|
| `Community Post Viewed` | User views a build/post | `post_id` | `post_type` | Community |
| `Community Post Created` | User creates post | `post_id` | `post_type` | Community |
| `Community Post Liked` | User likes a post | `post_id` | - | Community |
| `Community Post Commented` | User comments on post | `post_id` | - | Community |

### Subscription Events

| Event Name | When Fired | Required Properties | Optional Properties | Owner |
|------------|------------|---------------------|---------------------|-------|
| `Pricing Viewed` | User views pricing page | - | `page` | Revenue |
| `Checkout Started` | User initiates checkout | `tier` | `is_trial` | Revenue |
| `Checkout Completed` | User completes payment | `tier`, `amount_cents` | `payment_method` | Revenue |
| `Subscription Created` | Subscription activated | `tier` | `is_trial` | Revenue |
| `Subscription Upgraded` | User upgrades tier | `tier`, `previous_tier` | `amount_cents` | Revenue |
| `Subscription Downgraded` | User downgrades tier | `tier`, `previous_tier` | - | Revenue |
| `Subscription Canceled` | User cancels subscription | `tier` | - | Revenue |
| `AL Credits Purchased` | User buys credit pack | `pack`, `credits`, `amount_cents` | - | Revenue |

### Engagement Events

| Event Name | When Fired | Required Properties | Optional Properties | Owner |
|------------|------------|---------------------|---------------------|-------|
| `CTA Clicked` | User clicks CTA button | `cta_name`, `cta_location` | `cta_text`, `destination` | Growth |
| `Content Shared` | User shares any content | `content_type`, `method` | `content_id` | Growth |
| `Feedback Submitted` | User submits feedback | `category` | `page_url`, `severity` | Support |
| `Contact Form Submitted` | User submits contact form | - | `subject`, `category` | Support |

### Feature Discovery

| Event Name | When Fired | Required Properties | Optional Properties | Owner |
|------------|------------|---------------------|---------------------|-------|
| `Feature Discovered` | User first uses feature | `feature_name` | `discovery_method` | Product |
| `Feature Gate Hit` | User hits paywall | `feature_name`, `required_tier`, `user_tier` | `location` | Revenue |
| `Feature Gate Converted` | User upgrades after gate | `feature_name`, `required_tier`, `user_tier` | - | Revenue |

---

## Funnel Tracking

Use `trackFunnelStep()` for consistent funnel tracking:

```javascript
import { trackFunnelStep, FUNNELS } from '@/lib/analytics';

// Track signup funnel
trackFunnelStep(1, 'Email Entered', FUNNELS.SIGNUP);
trackFunnelStep(2, 'Password Created', FUNNELS.SIGNUP);
trackFunnelStep(3, 'Profile Completed', FUNNELS.SIGNUP);
```

### Pre-defined Funnels

| Funnel Name | Key | Steps |
|-------------|-----|-------|
| Signup | `signup` | Email → Password → Profile |
| Onboarding | `onboarding` | Welcome → Car Selection → Interests |
| Checkout | `checkout` | Pricing → Cart → Payment → Confirmation |
| Build Creation | `build_creation` | Car Select → First Mod → Save |
| Garage Addition | `garage_addition` | Search/VIN → Details → Save |
| AL Conversation | `al_conversation` | First Message → Follow-up → Action |

---

## User Properties

Properties set on user identification:

| Property | Type | Description |
|----------|------|-------------|
| `email` | string | User email |
| `name` | string | Display name |
| `subscription_tier` | enum | free, collector, tuner |
| `created_at` | datetime | Account creation date |
| `stripe_customer_id` | string | Stripe customer ID |
| `onboarding_completed` | boolean | Completed onboarding |

---

## Implementation Guidelines

### 1. Use Type-Safe Imports

```typescript
import { EVENTS, trackEvent, trackCarViewed } from '@/lib/analytics';

// Option 1: Use pre-built tracker
trackCarViewed({
  car_id: '123',
  car_slug: 'bmw-m3',
  car_name: '2024 BMW M3',
  source: 'search',
});

// Option 2: Use generic trackEvent
trackEvent(EVENTS.CAR_VIEWED, {
  car_id: '123',
  car_slug: 'bmw-m3',
  car_name: '2024 BMW M3',
});
```

### 2. Required vs Optional Properties

- **Required**: Must always be included
- **Optional**: Include when available for richer analysis

### 3. Don't Track

- PII beyond email (no addresses, phone numbers)
- Sensitive data (passwords, tokens)
- High-cardinality IDs in event names
- Duplicate events (debounce user actions)

### 4. Testing

Before merging, verify:
1. Event fires correctly in PostHog debug
2. All required properties are included
3. Property values are correct types
4. No duplicate events on rapid clicks

---

## A/B Testing

Use the `<ABTest>` component for experiments:

```jsx
import ABTest from '@/components/ABTest';

<ABTest
  experimentKey="new-checkout-flow"
  variants={{
    control: <OldCheckout />,
    variant_a: <NewCheckout />,
  }}
  fallback={<OldCheckout />}
/>
```

Or use the hook:

```javascript
import { useExperiment } from '@/components/ABTest';

const { variant, isLoading } = useExperiment('new-checkout-flow');
```

---

## Dashboard Access

- **PostHog**: https://app.posthog.com/project/autorev
- **GA4**: Google Analytics Dashboard
- **Admin Dashboards**:
  - Site Analytics: `/admin/analytics`
  - Retention: `/admin/retention`
  - Web Vitals: `/admin/performance`

---

## Adding New Events

1. Add event name to `EVENTS` constant in `/lib/analytics/events.js`
2. Add TypeScript types to `/lib/analytics/types.ts`
3. Create pre-built tracker if event will be used frequently
4. Update this tracking plan document
5. Test in PostHog debug mode
6. Get PR review from analytics owner

---

## Version History

| Date | Changes | Author |
|------|---------|--------|
| Jan 2026 | Initial tracking plan | Engineering |
| Jan 2026 | Added funnel tracking | Engineering |
| Jan 2026 | Added A/B testing docs | Engineering |
