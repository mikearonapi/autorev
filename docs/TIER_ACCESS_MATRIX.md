# AutoRev Tier Access Matrix

> Complete feature-by-tier access reference
>
> **Last Updated:** January 20, 2026

---

## Tier Hierarchy

```
free → collector → tuner
```

| Tier | Internal ID | Display Name | Price | Monthly AL Budget |
|------|-------------|--------------|-------|-------------------|
| **Free** | `free` | Free | $0 forever | 25 chats |
| **Collector** | `collector` | Enthusiast | $4.99/mo | 75 chats |
| **Tuner** | `tuner` | Tuner | $9.99/mo | 150 chats |

> **Beta Mode:** Currently `IS_BETA = true` — all features unlocked for authenticated users.

---

## Complete Feature Matrix

### Discovery & Research (Free Tier)

| Feature Key | Name | Free | Collector | Tuner | Description |
|-------------|------|:----:|:---------:|:-----:|-------------|
| `carSelector` | Car Selector | ✅ | ✅ | ✅ | Find and compare sports cars |
| `carDetailPages` | Car Detail Pages | ✅ | ✅ | ✅ | Full specs and buying guides |
| `fuelEconomy` | Fuel Economy | ✅ | ✅ | ✅ | EPA fuel economy data |
| `safetyRatings` | Safety Ratings | ✅ | ✅ | ✅ | NHTSA and IIHS safety ratings |
| `priceByYear` | Price by Year | ✅ | ✅ | ✅ | Best value model years |
| `partsTeaser` | Parts Preview | ✅ | ✅ | ✅ | See top 3 popular parts |
| `lapTimesTeaser` | Lap Times Preview | ✅ | ✅ | ✅ | See top 2 lap times |

### My Garage

| Feature Key | Name | Free | Collector | Tuner | Description |
|-------------|------|:----:|:---------:|:-----:|-------------|
| `basicGarage` | Basic Garage | ✅ | ✅ | ✅ | Save cars to your garage |
| `favorites` | Favorites | ✅ | ✅ | ✅ | Save favorite cars |
| `vinDecode` | VIN Decode | ❌ | ✅ | ✅ | Decode your exact vehicle variant |
| `ownerReference` | Owner's Reference | ❌ | ✅ | ✅ | Maintenance specs for your car |
| `serviceLog` | Service Log | ❌ | ✅ | ✅ | Track your maintenance history |
| `serviceReminders` | Service Reminders | ❌ | ✅ | ✅ | Get notified when service is due |
| `recallAlerts` | Recall Alerts | ❌ | ✅ | ✅ | Active recalls for YOUR VIN |
| `safetyData` | Your Safety Data | ❌ | ✅ | ✅ | Recalls and complaints for your VIN |
| `marketValue` | Market Value | ❌ | ✅ | ✅ | Track what your car is worth |
| `priceHistory` | Price History | ❌ | ✅ | ✅ | Historical price trends |
| `fullCompare` | Full Compare | ❌ | ✅ | ✅ | Side-by-side comparison tool |
| `collections` | Collections | ❌ | ✅ | ✅ | Organize cars into collections |
| `exportData` | Export Data | ❌ | ✅ | ✅ | Export your garage data |

### Events

| Feature Key | Name | Free | Collector | Tuner | Description |
|-------------|------|:----:|:---------:|:-----:|-------------|
| `eventsBrowse` | Browse Events | ✅ | ✅ | ✅ | Browse car events and meetups |
| `eventsMapView` | Map View | ✅ | ✅ | ✅ | View events on a map |
| `eventsSubmit` | Submit Events | ✅ | ✅ | ✅ | Submit new events for review |
| `eventsCalendarView` | Calendar View | ❌ | ✅ | ✅ | Monthly calendar view of events |
| `eventsSave` | Save Events | ❌ | ✅ | ✅ | Bookmark events for later |
| `eventsCalendarExport` | Calendar Export | ❌ | ✅ | ✅ | Add events to your calendar |
| `eventsForMyCars` | Events for My Cars | ❌ | ✅ | ✅ | Filter events by your garage vehicles |

### Tuning Shop (Tuner Tier)

| Feature Key | Name | Free | Collector | Tuner | Description |
|-------------|------|:----:|:---------:|:-----:|-------------|
| `dynoDatabase` | Dyno Database | ❌ | ❌ | ✅ | Real HP/torque from actual cars |
| `fullLapTimes` | Lap Times Library | ❌ | ❌ | ✅ | Complete track benchmark data |
| `fullPartsCatalog` | Parts Catalog | ❌ | ❌ | ✅ | Full parts database with pricing |
| `buildProjects` | Build Projects | ❌ | ❌ | ✅ | Save and organize build plans |
| `buildAnalytics` | Build Analytics | ❌ | ❌ | ✅ | Cost projections and HP gains |
| `partsCompatibility` | Parts Compatibility | ❌ | ❌ | ✅ | Check what works together |
| `modImpactAnalysis` | Mod Impact | ❌ | ❌ | ✅ | Before/after performance data |
| `pdfExport` | PDF Export | ❌ | ❌ | ✅ | Export builds as PDF |
| `earlyAccess` | Early Access | ❌ | ❌ | ✅ | First access to new features |

### AL Assistant

| Feature Key | Name | Free | Collector | Tuner | Description |
|-------------|------|:----:|:---------:|:-----:|-------------|
| `alBasic` | AL Basic | ✅ | ✅ | ✅ | 25 AI chats per month |
| `alCollector` | AL Enthusiast | ❌ | ✅ | ✅ | 75 AI chats per month |
| `alTuner` | AL Tuner | ❌ | ❌ | ✅ | 150 AI chats per month |

---

## Teaser Limits

For free users, certain content shows a preview before prompting upgrade:

| Content Type | Free Preview | Upgrade Prompt |
|--------------|--------------|----------------|
| Popular Parts | 3 parts | "See all parts" |
| Lap Times | 2 times | "See all lap times" |
| Dyno Runs | 0 (none) | "Unlock dyno data" |
| Compare Cars | 2 cars | "Compare more cars" |
| Saved Projects | 0 (none) | "Save build projects" |

**Code Reference:**
```javascript
export const TEASER_LIMITS = {
  popularParts: 3,
  lapTimes: 2,
  dynoRuns: 0,
  compareCars: 2,
  savedProjects: 0,
  aiChatsPerMonth: {
    free: 25,
    collector: 75,
    tuner: 150,
  },
};
```

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
// → { tier: 'collector', tierName: 'Enthusiast', price: '$4.99/mo', ... }
```

---

## Feature Categories Summary

| Category | Free Features | Collector Adds | Tuner Adds |
|----------|---------------|----------------|------------|
| **Discovery** | Car database, selector, specs, teasers | — | — |
| **Ownership** | Basic garage, favorites | VIN decode, service log, market value, recalls | — |
| **Events** | Browse, map, submit | Save, calendar, filter by cars | — |
| **Tuning** | Preview parts/times | — | Full dyno, lap times, builds, analytics |
| **AI** | 25 chats/mo | 75 chats/mo | 150 chats/mo |

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
