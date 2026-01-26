# AutoRev Tier Access Matrix

> Complete feature-by-tier access reference
>
> **Last Updated:** January 26, 2026

---

## Pricing Model (Simplified Jan 2026)

**Core principle:** Full app for everyone. Gate on AL usage & car count.

```
free → collector (Enthusiast) → tuner (Pro)
```

| Tier | Internal ID | Display Name | Price | Annual | Max Cars | AL Budget |
|------|-------------|--------------|-------|--------|----------|-----------|
| **Free** | `free` | Free | $0 | — | 1 | $0.25/mo (~15 chats) |
| **Enthusiast** | `collector` | Enthusiast | $9.99/mo | $79/yr | 3 | $2.00/mo (~130 chats) |
| **Pro** | `tuner` | Pro | $19.99/mo | $149/yr | ∞ | $5.00/mo (~350 chats) |

> **Terminology:** A "chat" = one AL response (your prompt + AL's response = token cost). A "conversation" = a thread containing multiple chats.

> **Beta Mode:** Currently `IS_BETA = true` — all features unlocked for authenticated users.

---

## Complete Feature Matrix (Simplified Jan 2026)

### Garage (All Tiers)

| Feature Key | Name | Free | Enthusiast | Pro | Description |
|-------------|------|:----:|:---------:|:-----:|-------------|
| `basicGarage` | Garage | ✅ (1 car) | ✅ (3 cars) | ✅ (∞) | Add cars to your garage |
| `vinDecode` | VIN Decode | ✅ | ✅ | ✅ | Decode your exact vehicle variant |
| `mySpecs` | My Specs | ✅ | ✅ | ✅ | View all your car specifications |
| `myBuild` | My Build | ✅ | ✅ | ✅ | Plan your upgrades |
| `myPerformance` | My Performance | ✅ | ✅ | ✅ | See HP and metric gains |
| `myParts` | My Parts | ✅ | ✅ | ✅ | Research specific parts |
| `myInstall` | My Install | ✅ | ✅ | ✅ | Track installation progress |
| `myPhotos` | My Photos | ✅ | ✅ | ✅ | Upload vehicle photos |

### Insights & Data (Enthusiast+)

| Feature Key | Name | Free | Enthusiast | Pro | Description |
|-------------|------|:----:|:---------:|:-----:|-------------|
| `insightsTab` | Insights | ❌ | ✅ | ✅ | Health scores and recommendations |
| `dataTab` | Data | ❌ | ✅ | ✅ | Virtual Dyno and Lap Time Estimator |
| `virtualDyno` | Virtual Dyno | ❌ | ✅ | ✅ | HP/TQ curves visualization |
| `dynoLogging` | Dyno Logging | ❌ | ✅ | ✅ | Log your dyno results |
| `lapTimeEstimator` | Lap Time Estimator | ❌ | ✅ | ✅ | Estimate track times |
| `trackTimeLogging` | Track Logging | ❌ | ✅ | ✅ | Log your track times |

### Community & Events (All Tiers)

| Feature Key | Name | Free | Enthusiast | Pro | Description |
|-------------|------|:----:|:---------:|:-----:|-------------|
| `communityBrowse` | Community | ✅ | ✅ | ✅ | Browse community builds |
| `communityShare` | Share Builds | ✅ | ✅ | ✅ | Share your build publicly |
| `leaderboard` | Leaderboard | ✅ | ✅ | ✅ | View rankings and standings |
| `eventsBrowse` | Browse Events | ✅ | ✅ | ✅ | Browse car events and meetups |
| `eventsMapView` | Map View | ✅ | ✅ | ✅ | View events on a map |
| `eventsSave` | Save Events | ✅ | ✅ | ✅ | Bookmark events for later |
| `eventsCalendarExport` | Calendar Export | ✅ | ✅ | ✅ | Add events to your calendar |
| `eventsSubmit` | Submit Events | ✅ | ✅ | ✅ | Submit new events for review |
| `dashboard` | Dashboard | ✅ | ✅ | ✅ | Points, streaks, achievements |

### AL Assistant

| Feature Key | Name | Free | Enthusiast | Pro | Description |
|-------------|------|:----:|:---------:|:-----:|-------------|
| `alBasic` | AL Basic | ✅ | — | — | ~15 chats/month ($0.25 budget) |
| `alEnthusiast` | AL Enthusiast | — | ✅ | — | ~130 chats/month ($2.00 budget) |
| `alPro` | AL Pro | — | — | ✅ | ~350 chats/month ($5.00 budget) |

### Pro Only

| Feature Key | Name | Free | Enthusiast | Pro | Description |
|-------------|------|:----:|:---------:|:-----:|-------------|
| `unlimitedCars` | Unlimited Cars | ❌ | ❌ | ✅ | No limit on garage size |
| `prioritySupport` | Priority Support | ❌ | ❌ | ✅ | Faster response times |

---

## Tier Limits

| Limit Type | Free | Enthusiast | Pro |
|------------|------|------------|-----|
| **Cars in Garage** | 1 | 3 | Unlimited |
| **AL Monthly Budget** | $0.25 | $2.00 | $5.00 |
| **Est. AL Chats** | ~15 | ~130 | ~350 |

**Code Reference:**
```javascript
export const TIER_LIMITS = {
  maxCars: {
    free: 1,
    collector: 3,
    tuner: Infinity,
  },
};

export const AL_ESTIMATES = {
  free: '~15',
  collector: '~130',
  tuner: '~350',
};
```

## AL Top-Up Packs

Users can purchase additional AL budget anytime:

| Pack | AL Budget | Price | Est. Chats |
|------|-----------|-------|------------|
| **AL Boost** | $0.50 | $1.99 | ~35 |
| **AL Power Pack** | $1.50 | $4.99 | ~100 |
| **AL Turbo Pack** | $3.50 | $9.99 | ~230 |

---

## Implementation

### Checking Feature Access

```javascript
import { hasFeatureAccess, hasAccess, FEATURES } from '@/lib/tierAccess';

// Check if user can access feature (ignores beta)
const canAccessDyno = hasFeatureAccess(userTier, 'dynoDatabase');

// During beta (respects IS_BETA flag)
const canAccess = hasAccess(userTier, 'dynoDatabase', isAuthenticated);
```

### Using PremiumGate Component

```jsx
import PremiumGate from '@/components/PremiumGate';

<PremiumGate feature="marketValue">
  <MarketValueSection car={car} />
</PremiumGate>

// With custom fallback
<PremiumGate 
  feature="dynoDatabase" 
  fallback={<TeaserPrompt tier="tuner" />}
>
  <DynoDataSection car={car} />
</PremiumGate>
```

### API Route Protection

```javascript
import { hasTierAccess } from '@/lib/tierAccess';

export async function GET(request) {
  const user = await getUser(request);
  
  if (!hasTierAccess(user?.tier, 'collector')) {
    return NextResponse.json(
      { error: 'Requires Enthusiast tier' },
      { status: 403 }
    );
  }
  
  // ... proceed with request
}
```

---

## Beta Mode

When `IS_BETA = true` in `lib/tierAccess.js`:

- All authenticated users get full access
- No upgrade prompts shown
- Tier-specific features unlocked
- Credits still tracked (for analytics)

### Disabling Beta

```javascript
// lib/tierAccess.js
export const IS_BETA = false; // Change to false to enforce tiers
```

After disabling:
1. Features will gate by tier
2. Upgrade prompts will appear
3. Stripe integration required for paid tiers

---

## Upgrade Flows

### Free → Collector (Enthusiast)

Triggered by:
- Clicking "Upgrade" on gated feature
- Visiting `/profile` (upgrade options shown)
- Reaching AL chat limit

### Free/Collector → Tuner

Triggered by:
- Accessing dyno/lap time data
- Trying to save build projects
- Visiting `/profile` (upgrade options shown)

### CTA Generation

```javascript
import { getUpgradeCTA } from '@/lib/tierAccess';

const cta = getUpgradeCTA('collector');
// → { tier: 'collector', tierName: 'Enthusiast', price: '$9.99/mo', ... }
```

---

## Feature Summary by Tier

| Category | Free | Enthusiast ($9.99/mo) | Pro ($19.99/mo) |
|----------|------|----------------------|-----------------|
| **Garage** | Full features, 1 car | Full features, 3 cars | Full features, unlimited cars |
| **Insights & Data** | ❌ | ✅ Virtual Dyno, Lap Estimator, Logging | ✅ Everything |
| **Community** | ✅ Browse, share, leaderboard | ✅ Everything | ✅ Everything |
| **Events** | ✅ Browse, save, calendar | ✅ Everything | ✅ Everything |
| **AL Budget** | $0.25/mo (~15 chats) | $2.00/mo (~130 chats) | $5.00/mo (~350 chats) |
| **Support** | Community | Community | Priority |

---

## Related Files

| File | Purpose |
|------|---------|
| `lib/tierAccess.js` | Core tier logic and feature definitions |
| `components/PremiumGate.jsx` | Feature gating component |
| `components/TeaserPrompt.jsx` | Upgrade prompt component |
| `app/(app)/profile/page.jsx` | Profile with upgrade options |

---

*See [AL.md](AL.md) for AL assistant documentation.*
