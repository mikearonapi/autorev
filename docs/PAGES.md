# AutoRev Pages & Routes

> Complete inventory of all active pages & routes
>
> **Last Updated:** January 21, 2026

---

## Change Summary (January 21, 2026)

**Added:**

- `/parts` - Parts database browser page
- `/community/builds` - Public builds gallery
- `/community/builds/[slug]` - Individual public build page
- `/community/events` - Events browser (primary route)
- `/community/events/[slug]` - Individual event page
- `/events/saved` - User's saved events
- `/events/submit` - Event submission form
- Documented redirect routes: `/my-builds`, `/performance`, `/garage/tuning-shop`, `/events`

**Removed:**

- `/features/*` - All feature marketing pages (deleted from codebase)
- `/landing/*` - All targeted landing pages (deleted from codebase)
- `/maintenance` - Maintenance page (deleted from codebase)

**Updated:**

- Descriptions refined to reflect modification/build focus
- Archived/Legacy section reorganized for clarity
- Route map updated to match actual codebase structure

---

## App Structure Overview

AutoRev uses a **5-tab mobile-first architecture** inspired by native apps (GRAVL design pattern):

```
┌─────────────────────────────────────────────────────────┐
│                    BOTTOM TAB BAR                        │
├───────────┬───────────┬───────────┬───────────┬─────────┤
│  Garage   │   Data    │ Community │    AL     │ Profile │
└───────────┴───────────┴───────────┴───────────┴─────────┘
```

**Route Groups:**

- `(app)/` — Authenticated app pages with bottom tab bar
- `(marketing)/` — Public marketing pages (homepage, legal, public builds)
- `admin/` — Admin dashboard
- `internal/` — Internal tools
- `auth/` — Authentication flows

---

## Core App Pages (5 Tabs)

### My Garage (`/garage`)

| Attribute          | Value                                                           |
| ------------------ | --------------------------------------------------------------- |
| **Purpose**        | Vehicle management, builds, upgrades, and performance tracking  |
| **Tier**           | Free (basic), Collector+ (full features)                        |
| **Key Components** | VehicleCard, VehicleBuildPanel, UpgradeCenter                   |
| **Data Sources**   | `user_vehicles`, `user_projects`, `cars`, `car_tuning_profiles` |

**Features:**

- Add/manage owned vehicles
- Configure builds with upgrade selections
- Track modifications and costs
- View vehicle specs and performance estimates

**Sub-routes:**
| Route | Purpose |
|-------|---------|
| `/garage/my-build` | Individual build configuration |
| `/garage/my-parts` | Parts inventory |
| `/garage/my-photos` | Vehicle photo gallery |
| `/garage/my-specs` | Vehicle specifications |
| `/garage/builds` | All saved builds |
| `/garage/compare` | Side-by-side vehicle comparison |
| `/garage/[publicSlug]` | Public shared garage view |

---

### My Data (`/data`)

| Attribute          | Value                                                     |
| ------------------ | --------------------------------------------------------- |
| **Purpose**        | Performance data hub — dyno, track times, analytics       |
| **Tier**           | Authenticated                                             |
| **Key Components** | VirtualDynoChart, LapTimeEstimator, CalculatedPerformance |
| **Data Sources**   | `user_vehicles`, `user_track_times`, `car_dyno_runs`      |

**Features:**

- **Power Tab:** Virtual dyno, calculated performance, power breakdown
- **Track Tab:** Lap time estimator, track session logging
- **Analysis Tab:** Build progress, known issues, platform insights

---

### Community (`/community`)

| Attribute          | Value                                                                |
| ------------------ | -------------------------------------------------------------------- |
| **Purpose**        | Social feed for build sharing and discovery                          |
| **Tier**           | Free (view), Authenticated (interact)                                |
| **Key Components** | BuildDetailSheet, CommentsSheet                                      |
| **Data Sources**   | `community_posts`, `community_post_likes`, `community_post_comments` |

**Features:**

- TikTok/Instagram-style vertical build feed
- Like, comment, and share builds
- Swipe navigation between builds
- AI-moderated comments

---

### AL (`/al`)

| Attribute          | Value                                                                       |
| ------------------ | --------------------------------------------------------------------------- |
| **Purpose**        | AI assistant for modification advice, parts recommendations, build planning |
| **Tier**           | Free (limited), Paid (more credits)                                         |
| **Key Components** | ALPageClient, ALChatInterface                                               |
| **Data Sources**   | `al_conversations`, `al_messages`, `al_credits`                             |

**Features:**

- Full-page chat interface
- Context-aware responses based on user's vehicles and builds
- Image upload for parts identification
- 17 specialized tools for car data lookup

---

### Profile (`/profile`)

| Attribute          | Value                                           |
| ------------------ | ----------------------------------------------- |
| **Purpose**        | User settings, subscription management, account |
| **Tier**           | Authenticated                                   |
| **Key Components** | ProfilePage                                     |
| **Data Sources**   | `user_profiles`, `al_credits`                   |

**Features:**

- Display name and avatar management
- AL Fuel balance and top-up
- Referral code sharing
- Subscription tier management
- Location settings
- Privacy controls (clear data, delete account)
- PWA install prompt

---

## Additional App Pages

### Parts Database (`/parts`)

| Attribute          | Value                                       |
| ------------------ | ------------------------------------------- |
| **Purpose**        | Browse and search aftermarket parts catalog |
| **Tier**           | Authenticated                               |
| **Key Components** | PartsContent, PartDetail, SlideUpPanel      |
| **Data Sources**   | `parts`                                     |

**Features:**

- Full parts database with search
- Filter by category (Intake, Exhaust, Turbo, ECU, etc.)
- Part details with HP/TQ gains
- Compatible vehicles display
- Add-to-build integration

---

## Marketing Pages

### Home (`/`)

| Attribute          | Value                                            |
| ------------------ | ------------------------------------------------ |
| **Purpose**        | Landing page with feature showcase and login CTA |
| **Tier**           | Public                                           |
| **Key Components** | IPhoneFrame, feature sections                    |

**Features:**

- Hero section with 3-phone display
- AL introduction with typing animation
- Feature sections (Garage, Build, Performance, Track, Community, AL)
- PWA download prompt

---

### Community Builds (`/community/builds`)

| Attribute          | Value                                          |
| ------------------ | ---------------------------------------------- |
| **Purpose**        | Public builds gallery — Netflix-style browsing |
| **Tier**           | Public                                         |
| **Key Components** | MyBuildsSection, build galleries               |
| **Data Sources**   | `community_posts`                              |

**Features:**

- Hero carousel with featured builds
- Horizontal scrolling rows by brand
- Filter by make/model
- Mobile-optimized layout

**Sub-routes:**
| Route | Purpose |
|-------|---------|
| `/community/builds/[slug]` | Individual public build detail page with mods, performance comparison, owner actions |

---

### Events (`/community/events`)

| Attribute          | Value                                                |
| ------------------ | ---------------------------------------------------- |
| **Purpose**        | Browse car events and meets                          |
| **Tier**           | Public (browse), Authenticated (save)                |
| **Key Components** | EventCard, EventFilters, EventMap, EventCalendarView |
| **Data Sources**   | `events`, `user_saved_events`                        |

**Features:**

- List and map view of events
- Filter by type, location, date
- Save events (authenticated)
- Calendar view (Collector+)
- Ask AL integration for event recommendations

**Sub-routes:**
| Route | Purpose |
|-------|---------|
| `/community/events/[slug]` | Individual event detail page |

**Related routes:**
| Route | Purpose | Tier |
|-------|---------|------|
| `/events/saved` | User's saved events | Authenticated |
| `/events/submit` | Submit a new event | Authenticated |

---

### Join (`/join`)

| Attribute          | Value                                |
| ------------------ | ------------------------------------ |
| **Purpose**        | Membership tiers showcase and signup |
| **Tier**           | Public                               |
| **Key Components** | FeatureBreakdown, tier cards         |

**Features:**

- Tier comparison (Free, Enthusiast, Tuner)
- Feature breakdown by tier
- Stripe checkout integration
- Beta mode display

---

### Legal & Utility Pages

| Route          | Purpose           | Tier   |
| -------------- | ----------------- | ------ |
| `/terms`       | Terms of service  | Public |
| `/privacy`     | Privacy policy    | Public |
| `/contact`     | Contact form      | Public |
| `/unsubscribe` | Email unsubscribe | Public |

---

## Authentication Pages

| Route                  | Purpose                      |
| ---------------------- | ---------------------------- |
| `/auth/error`          | Authentication error display |
| `/auth/reset-password` | Password reset flow          |
| `/auth/callback`       | OAuth callback handler       |
| `/auth/confirm`        | Email confirmation           |

---

## Admin Pages

All require admin authentication (checked via `isAdminEmail()`).

| Route             | Purpose                        |
| ----------------- | ------------------------------ |
| `/admin`          | Admin dashboard with analytics |
| `/admin/image-qa` | Image quality assurance tool   |

---

## Internal Tools

All require admin authentication.

| Route                           | Purpose                      |
| ------------------------------- | ---------------------------- |
| `/internal`                     | Internal tools dashboard     |
| `/internal/events`              | Event submission moderation  |
| `/internal/feedback`            | User feedback review         |
| `/internal/car-pipeline`        | Car data pipeline management |
| `/internal/car-pipeline/[slug]` | Individual car pipeline      |
| `/internal/dyno`                | Dyno data management         |
| `/internal/lap-times`           | Lap time data management     |
| `/internal/parts-review`        | Parts catalog review         |
| `/internal/variant-maintenance` | Variant maintenance data     |
| `/internal/manual-entry`        | Manual data entry            |
| `/internal/knowledge`           | Knowledge base ingestion     |
| `/internal/qa`                  | Quality assurance reports    |
| `/internal/errors`              | Error tracking dashboard     |

---

## Legacy Redirects

These routes exist only for backwards compatibility. They redirect to current locations.

| Route                 | Redirects To        | Notes                      |
| --------------------- | ------------------- | -------------------------- |
| `/tuning-shop`        | `/garage/my-build`  | Legacy tuning shop URL     |
| `/mod-planner`        | `/garage/my-build`  | Legacy mod planner URL     |
| `/garage/tuning-shop` | `/garage/my-build`  | Intermediate legacy URL    |
| `/my-builds`          | `/garage`           | Legacy builds list URL     |
| `/performance`        | `/data`             | Legacy performance URL     |
| `/events`             | `/community/events` | Events now under community |

---

## Archived/De-emphasized Pages

These pages exist in the codebase but are **NOT in main navigation**. They remain accessible for backwards compatibility and potential future reactivation.

See [FEATURE_ARCHIVE.md](FEATURE_ARCHIVE.md) for full documentation.

| Route                 | Status   | Notes                                         |
| --------------------- | -------- | --------------------------------------------- |
| `/browse-cars`        | Archived | Car database browser — not in nav             |
| `/browse-cars/[slug]` | Archived | Car detail pages — accessible via direct link |
| `/car-selector`       | Archived | Car matching quiz — not in nav                |
| `/encyclopedia`       | Archived | Educational content — not in nav              |
| `/compare`            | Archived | Marketing comparison tool                     |
| `/compare/[slug]`     | Archived | Individual comparison page                    |
| `/articles/*`         | Archived | Article/blog system                           |

---

## Removed Pages

These pages have been **deleted from the codebase** and no longer exist.

| Route          | Removed Date | Reason                                           |
| -------------- | ------------ | ------------------------------------------------ |
| `/features/*`  | January 2026 | Feature marketing pages consolidated to homepage |
| `/landing/*`   | January 2026 | Targeted landing pages no longer needed          |
| `/maintenance` | January 2026 | Maintenance features integrated into garage      |

---

## Route Map

```
/                           # Homepage (marketing)
├── garage/                 # My Garage (app)
│   ├── my-build/
│   ├── my-parts/
│   ├── my-photos/
│   ├── my-specs/
│   ├── builds/
│   ├── compare/
│   └── [publicSlug]/
├── data/                   # My Data (app)
├── community/              # Community feed (app)
├── parts/                  # Parts database (app)
├── al/                     # AL Assistant (app)
├── profile/                # User profile (app)
├── community/
│   ├── builds/             # Public builds gallery
│   │   └── [slug]/
│   └── events/             # Events browser
│       └── [slug]/
├── events/
│   ├── saved/              # Saved events
│   └── submit/             # Submit event
├── join/                   # Membership signup
├── terms/                  # Legal
├── privacy/                # Legal
├── contact/                # Support
├── unsubscribe/            # Email management
├── auth/
│   ├── callback/
│   ├── confirm/
│   ├── error/
│   └── reset-password/
├── admin/
│   └── image-qa/
└── internal/
    ├── events/
    ├── feedback/
    ├── car-pipeline/
    │   └── [slug]/
    ├── dyno/
    ├── lap-times/
    ├── parts-review/
    ├── variant-maintenance/
    ├── manual-entry/
    ├── knowledge/
    ├── qa/
    └── errors/
```

---

## User Journeys

### Journey 1: New User

```
Home (/) → Login/Signup (auth modal)
         ↓
   Garage (/garage) → Add Vehicle
         ↓
   Configure Build → View Performance Data
         ↓
   Ask AL questions → Browse Community
```

### Journey 2: Returning User (Build Focus)

```
Garage → Select Vehicle
       ↓
Configure Upgrades → View HP/Torque Estimates
       ↓
Data Tab → Virtual Dyno → Lap Time Estimator
       ↓
Log Actual Results → Track Progress
```

### Journey 3: Community Engagement

```
Community → Browse Builds
          ↓
Like/Comment → View Build Details
          ↓
Share Build → Inspire Own Build
```

### Journey 4: Parts Research

```
Parts (/parts) → Search/Filter by Category
              ↓
View Part Details → Check Compatibility
              ↓
Add to Build → Configure in Garage
```

---

## Navigation Components

### Header (`components/Header.jsx`)

Desktop and mobile navigation with:

- Logo with animated suffix (Revival/Revelation/Revolution)
- Nav links: Garage, Data, Community, AL
- Profile dropdown (authenticated)
- Login/Join buttons (unauthenticated)

### Bottom Tab Bar (`components/BottomTabBar.jsx`)

Mobile-first navigation (shows on app routes):

- Garage, Data, Community, AL, Profile tabs
- Active state with teal accent
- AL tab with special mascot icon

### Footer (`components/Footer.jsx`)

Minimal footer with:

- Social links (Instagram, Facebook)
- Legal links (Terms, Privacy, Contact)
- Hidden on app routes (tab bar replaces it)

---

_See [API.md](API.md) for API routes._
_See [FEATURE_ARCHIVE.md](FEATURE_ARCHIVE.md) for archived features._
_See [TIER_ACCESS_MATRIX.md](TIER_ACCESS_MATRIX.md) for feature gating by tier._
