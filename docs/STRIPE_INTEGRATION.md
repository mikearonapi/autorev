# Stripe Integration Reference

> **Last Updated:** December 28, 2024
>
> Complete reference for Stripe payment processing in AutoRev

---

## Overview

AutoRev uses Stripe for:
- **Subscription billing** (Enthusiast & Tuner tiers)
- **AL credit pack purchases** (one-time payments)
- **Donations** (Support AutoRev)

| Integration Type | Status | Mode |
|------------------|--------|------|
| Subscriptions | ✅ Live | Recurring billing |
| AL Credit Packs | ✅ Live | One-time payments |
| Donations | ✅ Live | One-time payments |
| Customer Portal | ✅ Live | Self-service billing management |

---

## Environment Variables

### Required (Production)

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App Configuration
NEXT_PUBLIC_APP_URL=https://autorev.app
```

### Optional

```bash
# For testing
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## Products & Pricing

### Subscription Tiers

| Tier | Name | Price | Stripe Price ID | Product ID |
|------|------|-------|----------------|------------|
| Free | Free | $0 | N/A | N/A |
| Collector | Enthusiast | $4.99/mo | `price_1Sj5QuPAhBIL8qL1G5vd4Etd` | `prod_TgSLD2pSfYbAxn` |
| Tuner | Tuner | $9.99/mo | `price_1Sj5QvPAhBIL8qL1EWLZKRFL` | `prod_TgSL5Mwritjx3a` |

### AL Credit Packs

| Pack | Credits | Price | Stripe Price ID | Product ID |
|------|---------|-------|----------------|------------|
| Small | 25 | $2.99 | `price_1Sj5QwPAhBIL8qL1Yy2WePeo` | `prod_TgSLBnNu7vZKFf` |
| Medium | 75 | $4.99 | `price_1Sj5QwPAhBIL8qL1HrLcIGno` | `prod_TgSLNEp9npYwhJ` |
| Large | 200 | $9.99 | `price_1Sj5QxPAhBIL8qL1XUyXgK7N` | `prod_TgSLScSMXxy5nm` |

### Donation Presets

| Amount | Stripe Price ID |
|--------|----------------|
| $5 | `price_1Sj5QyPAhBIL8qL1VpykxChM` |
| $10 | `price_1Sj5QyPAhBIL8qL1lzZj6BwC` |
| $25 | `price_1Sj5QzPAhBIL8qL14CC4axrj` |
| $50 | `price_1Sj5QzPAhBIL8qL1hddvLFSq` |

**Custom Amount Product:** `prod_TgSLv0JmV9iTZB`

---

## API Endpoints

### `/api/checkout` (POST)

Creates Stripe Checkout sessions for subscriptions, credit packs, or donations.

**Request Body:**

```json
{
  "type": "subscription", // or "credits" or "donation"
  "tier": "collector",    // for subscriptions
  "pack": "medium",       // for credit packs
  "amount": 10,           // for preset donations (5, 10, 25, 50)
  "donationAmount": 1500  // for custom donations (cents)
}
```

**Response:**

```json
{
  "url": "https://checkout.stripe.com/...",
  "sessionId": "cs_test_..."
}
```

**Authentication:** Required (user must be signed in)

---

### `/api/billing/portal` (POST)

Creates a Stripe Customer Portal session for managing subscriptions.

**Request Body:** None

**Response:**

```json
{
  "url": "https://billing.stripe.com/p/session/..."
}
```

**Authentication:** Required  
**Prerequisites:** User must have `stripe_customer_id` (subscribed at least once)

---

### `/api/webhooks/stripe` (POST)

Handles Stripe webhook events for payment processing.

**Events Handled:**

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Link customer, add AL credits, log donation |
| `customer.subscription.created` | Upgrade user tier |
| `customer.subscription.updated` | Update subscription status |
| `customer.subscription.deleted` | Downgrade to free tier |
| `invoice.paid` | Log renewal, send Discord notification |
| `invoice.payment_failed` | Log warning |

**Authentication:** Verified via `STRIPE_WEBHOOK_SECRET`

---

## Database Schema

### `user_profiles` Table Extensions

Stripe-related fields added to user profiles:

| Column | Type | Purpose |
|--------|------|---------|
| `stripe_customer_id` | TEXT | Stripe customer ID (`cus_...`) |
| `stripe_subscription_id` | TEXT | Current subscription ID |
| `stripe_subscription_status` | TEXT | `active`, `trialing`, `past_due`, `canceled`, `none` |
| `subscription_started_at` | TIMESTAMPTZ | When subscription began |
| `subscription_ends_at` | TIMESTAMPTZ | Current period end (or cancellation date) |
| `al_credits_purchased` | INTEGER | Total AL credits purchased (separate from monthly allotment) |

---

## User Flow

### Subscription Purchase

```
User clicks "Upgrade" → /api/checkout (subscription) → Stripe Checkout
  ↓
User completes payment
  ↓
Stripe fires: checkout.session.completed → /api/webhooks/stripe
  ↓
Webhook updates user_profiles:
  - subscription_tier = 'collector' or 'tuner'
  - stripe_customer_id = cus_...
  - stripe_subscription_id = sub_...
  - stripe_subscription_status = 'active'
  ↓
User redirected to /profile?checkout=success
```

### AL Credit Pack Purchase

```
User clicks "Buy Credits" → /api/checkout (credits) → Stripe Checkout
  ↓
User completes payment
  ↓
Stripe fires: checkout.session.completed → /api/webhooks/stripe
  ↓
Webhook updates:
  - user_profiles.al_credits_purchased += credits
  - al_credits.credits_remaining += credits
  - al_credits.credits_purchased += credits
  ↓
Discord notification sent
  ↓
User redirected to /profile?checkout=success
```

### Subscription Management

```
User clicks "Manage Billing" → /api/billing/portal → Stripe Customer Portal
  ↓
User can:
  - Cancel subscription
  - Update payment method
  - View billing history
  ↓
Changes trigger webhook events → /api/webhooks/stripe
```

---

## Helper Functions

### `lib/stripe.js` Exports

| Function | Purpose |
|----------|---------|
| `getSubscriptionConfig(tierId)` | Get tier config by ID |
| `getTierFromPriceId(priceId)` | Map Stripe price → tier |
| `getTierFromProductId(productId)` | Map Stripe product → tier |
| `getCreditPackConfig(packId)` | Get credit pack config |
| `getCreditPackFromPriceId(priceId)` | Map price → credit pack |
| `isAlCreditProduct(productId)` | Check if product is AL credits |
| `isDonationProduct(productId)` | Check if product is donation |
| `formatPrice(cents)` | Format cents as dollars |
| `mapSubscriptionStatus(stripeStatus)` | Map Stripe status to internal status |

---

## Payment Links

Direct Stripe Checkout URLs (hosted payment pages):

| Product | Link |
|---------|------|
| Enthusiast | `https://buy.stripe.com/eVqfZj8ST2k82s45JDcs800` |
| Tuner | `https://buy.stripe.com/14A5kF9WXaQE4Acdc5cs801` |
| AL Credits (Small) | `https://buy.stripe.com/3cI3cx5GH5wk9Uw0pjcs802` |
| AL Credits (Medium) | `https://buy.stripe.com/8x24gB4CD7Es4Acfkdcs803` |
| AL Credits (Large) | `https://buy.stripe.com/bJeeVf3yz2k86Ik0pjcs804` |
| Donate $5 | `https://buy.stripe.com/3cI14p0mn1g42s49ZTcs805` |
| Donate $10 | `https://buy.stripe.com/9B63cx4CD7EsfeQ8VPcs806` |
| Donate $25 | `https://buy.stripe.com/5kQbJ3fhh0c0c2Eb3Xcs807` |
| Donate $50 | `https://buy.stripe.com/7sY3cx0mn2k8c2Edc5cs808` |

**Usage:** Can be shared directly or used as fallback if custom checkout fails.

---

## Testing

### Test Mode

Use Stripe test keys for development:

```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Test Cards

| Card Number | Outcome |
|-------------|---------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 9995` | Decline (insufficient funds) |
| `4000 0025 0000 3155` | Requires authentication (3D Secure) |

**All test cards:**
- Any future expiration date
- Any 3-digit CVC
- Any 5-digit ZIP

### Test Webhooks

Use Stripe CLI to forward webhooks to localhost:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## Discord Notifications

Stripe events trigger Discord notifications via `lib/discord.js`:

| Event | Channel | Message |
|-------|---------|---------|
| AL credits purchased | `DISCORD_WEBHOOK_FINANCIALS` | "💳 AL Credits Purchased: {credits} credits" |
| Donation received | `DISCORD_WEBHOOK_FINANCIALS` | "💝 Donation: ${amount}" |
| Subscription renewal | `DISCORD_WEBHOOK_FINANCIALS` | "🔄 Subscription Renewed: ${amount}" |

---

## Security

### Webhook Verification

All webhook requests are verified using `STRIPE_WEBHOOK_SECRET`:

```javascript
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  endpointSecret
);
```

**Failed verification → 400 error (event ignored)**

### Customer Linking

- Stripe `customer_id` linked to AutoRev `user_id` via `metadata`
- Customers matched by `stripe_customer_id` or email fallback
- Prevents unauthorized access to user data

---

## Admin Dashboard

### `/app/admin/components/StripeDashboard.jsx`

Admin panel for monitoring Stripe activity:
- Recent payments
- Active subscriptions
- Failed payments
- Revenue metrics

### `/api/admin/stripe` (GET)

Returns Stripe metrics for admin dashboard.

**Authentication:** Admin only

---

## Troubleshooting

### "No billing account found"

**Cause:** User hasn't subscribed yet (no `stripe_customer_id`)

**Solution:** User must complete at least one checkout session

### Webhook not firing

**Cause:** Webhook endpoint not configured in Stripe dashboard

**Solution:** 
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://autorev.app/api/webhooks/stripe`
3. Select events: `checkout.session.completed`, `customer.subscription.*`, `invoice.paid`
4. Copy webhook secret → `STRIPE_WEBHOOK_SECRET`

### Credits not added after purchase

**Cause:** Webhook failed or user not found

**Solution:** Check webhook logs in Stripe Dashboard and Vercel logs

---

## Related Files

| File | Purpose |
|------|---------|
| `lib/stripe.js` | Stripe configuration & helper functions |
| `app/api/checkout/route.js` | Create checkout sessions |
| `app/api/billing/portal/route.js` | Customer portal access |
| `app/api/webhooks/stripe/route.js` | Process Stripe events |
| `app/api/admin/stripe/route.js` | Admin metrics |
| `app/admin/components/StripeDashboard.jsx` | Admin UI |
| `hooks/useCheckout.js` | Client-side checkout hook |
| `tests/stripe-integration.test.js` | Integration tests |
| `scripts/verify-stripe-setup.mjs` | Setup verification script |

---

*See [ARCHITECTURE.md](ARCHITECTURE.md) for system overview and [TIER_ACCESS_MATRIX.md](TIER_ACCESS_MATRIX.md) for feature gating.*





