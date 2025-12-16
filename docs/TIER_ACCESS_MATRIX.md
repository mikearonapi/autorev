# AutoRev Tier Access Matrix

> Complete feature-by-tier access reference
>
> **Last Updated:** December 15, 2024

---

## Tier Hierarchy

```
free → collector → tuner → admin
```

| Tier | Price | Target User | Monthly AL Budget |
|------|-------|-------------|-------------------|
| **Free** | $0 forever | Car shoppers, browsers | $0.25 (~25 chats) |
| **Collector** | $4.99/mo | Car owners | $1.00 (~75 chats) |
| **Tuner** | $9.99/mo | Modifiers, track enthusiasts | $2.50 (~150 chats) |
| **Admin** | Internal | Staff | Unlimited |

> **Beta Mode:** Currently `IS_BETA = true` — all features unlocked for authenticated users.

---

## Complete Feature Matrix

### Discovery & Research

| Feature | Free | Collector | Tuner | Description |
|---------|:----:|:---------:|:-----:|-------------|
| Browse Cars | ✅ | ✅ | ✅ | Access 98-car database |
| Car Detail Pages | ✅ | ✅ | ✅ | Full specs and buying guides |
| Car Selector | ✅ | ✅ | ✅ | Personalized car matching |
| Fuel Economy Data | ✅ | ✅ | ✅ | EPA mpg and emissions |
| Safety Ratings | ✅ | ✅ | ✅ | NHTSA and IIHS ratings |
| Price by Year | ✅ | ✅ | ✅ | Best value model years |
| Expert Video Reviews | ✅ | ✅ | ✅ | YouTube reviews with AI summaries |
| Encyclopedia | ✅ | ✅ | ✅ | Automotive education |

### My Garage

| Feature | Free | Collector | Tuner | Description |
|---------|:----:|:---------:|:-----:|-------------|
| Save Favorites | ✅ | ✅ | ✅ | Save cars to garage |
| VIN Decode | ❌ | ✅ | ✅ | Identify exact variant |
| Owner's Reference | ❌ | ✅ | ✅ | Oil/fluid specs for your car |
| Service Log | ❌ | ✅ | ✅ | Track maintenance history |
| Service Reminders | ❌ | ✅ | ✅ | Upcoming service alerts |
| Recall Alerts | ❌ | ✅ | ✅ | VIN-specific recalls |
| Market Value | ❌ | ✅ | ✅ | Current value tracking |
| Price History | ❌ | ✅ | ✅ | Value trends over time |
| Collections | ❌ | ✅ | ✅ | Organize cars into groups |
| Full Compare | ❌ | ✅ | ✅ | Side-by-side comparison |
| Export Data | ❌ | ✅ | ✅ | Export garage data |

### Events

| Feature | Free | Collector | Tuner | Description |
|---------|:----:|:---------:|:-----:|-------------|
| Browse Events | ✅ | ✅ | ✅ | Find car events |
| Map View | ✅ | ✅ | ✅ | Events on map |
| Submit Events | ✅ | ✅ | ✅ | Submit new events |
| Calendar View | ❌ | ✅ | ✅ | Monthly calendar layout |
| Save Events | ❌ | ✅ | ✅ | Bookmark events |
| Calendar Export | ❌ | ✅ | ✅ | Add to Google/Apple calendar |
| Events for My Cars | ❌ | ✅ | ✅ | Filter by garage cars |

### Tuning Shop

| Feature | Free | Collector | Tuner | Description |
|---------|:----:|:---------:|:-----:|-------------|
| Browse Upgrades | ✅ | ✅ | ✅ | Explore upgrade options |
| Parts Preview (3) | ✅ | ✅ | ✅ | See top 3 popular parts |
| Lap Times Preview (2) | ✅ | ✅ | ✅ | See top 2 lap times |
| Dyno Database | ❌ | ❌ | ✅ | Real dyno measurements |
| Full Lap Times | ❌ | ❌ | ✅ | Complete track data |
| Full Parts Catalog | ❌ | ❌ | ✅ | All parts with pricing |
| Build Projects | ❌ | ❌ | ✅ | Save build plans |
| Build Analytics | ❌ | ❌ | ✅ | Cost and HP projections |
| Parts Compatibility | ❌ | ❌ | ✅ | Check what works together |
| Mod Impact Analysis | ❌ | ❌ | ✅ | Before/after data |
| PDF Export | ❌ | ❌ | ✅ | Export builds as PDF |

### AL Assistant

| Feature | Free | Collector | Tuner | Description |
|---------|:----:|:---------:|:-----:|-------------|
| Basic AI Chat | ✅ | ✅ | ✅ | ~25 chats/month |
| Collector AI Chat | ❌ | ✅ | ✅ | ~75 chats/month |
| Tuner AI Chat | ❌ | ❌ | ✅ | ~150 chats/month |
| Early Access | ❌ | ❌ | ✅ | New features first |

---

## AL Tool Access by Tier

| Tool | Free | Collector | Tuner | Description |
|------|:----:|:---------:|:-----:|-------------|
| `search_cars` | ✅ | ✅ | ✅ | Find cars by criteria |
| `get_car_details` | ✅ | ✅ | ✅ | Get car specifications |
| `get_car_ai_context` | ✅ | ✅ | ✅ | Comprehensive car context |
| `search_events` | ✅ | ✅ | ✅ | Find car events |
| `get_expert_reviews` | ❌ | ✅ | ✅ | YouTube reviews |
| `get_known_issues` | ❌ | ✅ | ✅ | Common problems |
| `compare_cars` | ❌ | ✅ | ✅ | Side-by-side comparison |
| `search_encyclopedia` | ❌ | ✅ | ✅ | Automotive education |
| `get_upgrade_info` | ❌ | ✅ | ✅ | Modification details |
| `search_forums` | ❌ | ✅ | ✅ | Forum search *(stub)* |
| `search_parts` | ❌ | ✅ | ✅ | Parts catalog |
| `get_maintenance_schedule` | ❌ | ✅ | ✅ | Service schedules |
| `search_knowledge` | ❌ | ✅ | ✅ | Vector knowledge base |
| `get_track_lap_times` | ❌ | ✅ | ✅ | Track benchmarks |
| `get_dyno_runs` | ❌ | ✅ | ✅ | Dyno measurements |
| `search_community_insights` | ❌ | ✅ | ✅ | Forum-extracted insights |
| `recommend_build` | ❌ | ❌ | ✅ | Build recommendations |

---

## Teaser Limits

For free users, certain content shows a preview before prompting upgrade:

| Content Type | Free Preview | Upgrade Prompt |
|--------------|--------------|----------------|
| Popular Parts | 3 parts | "See all 642 parts" |
| Lap Times | 2 times | "See all lap times" |
| Dyno Runs | 0 (none) | "Unlock dyno data" |
| Compare Cars | 2 cars | "Compare up to 4 cars" |
| Saved Projects | 0 (none) | "Save build projects" |

---

## Implementation

### Checking Feature Access

```javascript
import { hasFeatureAccess, hasAccess, FEATURES } from '@/lib/tierAccess';

// Check if user can access feature
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
// In API route
import { hasTierAccess } from '@/lib/tierAccess';

export async function GET(request) {
  const user = await getUser(request);
  
  if (!hasTierAccess(user?.tier, 'collector')) {
    return NextResponse.json(
      { error: 'Requires Collector tier' },
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

### Free → Collector

Triggered by:
- Clicking "Upgrade" on gated feature
- Visiting `/join?upgrade=collector`
- Reaching AL chat limit

### Free/Collector → Tuner

Triggered by:
- Accessing dyno/lap time data
- Trying to save build projects
- Visiting `/join?upgrade=tuner`

### CTA Generation

```javascript
import { getUpgradeCTA } from '@/lib/tierAccess';

const cta = getUpgradeCTA('collector');
// → { tier: 'collector', tierName: 'Collector', price: '$4.99/mo', ... }
```

---

## Feature Categories Summary

| Category | Free Features | Collector Adds | Tuner Adds |
|----------|---------------|----------------|------------|
| **Discovery** | Full car database, selector, reviews | — | — |
| **Ownership** | Save favorites | VIN decode, service log, market value | — |
| **Events** | Browse, map, submit | Save, calendar, filter by cars | — |
| **Tuning** | Preview parts/times | — | Full data, builds, analytics |
| **AI** | 25 chats/mo | 75 chats/mo | 150 chats/mo |

---

## Related Files

| File | Purpose |
|------|---------|
| `lib/tierAccess.js` | Core tier logic and feature definitions |
| `components/PremiumGate.jsx` | Feature gating component |
| `components/TeaserPrompt.jsx` | Upgrade prompt component |
| `app/(pages)/join/page.jsx` | Pricing/upgrade page |

---

*See [FEATURES.md](FEATURES.md) for feature descriptions and [AL.md](AL.md) for AL tool documentation.*


