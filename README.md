# AutoRev

**Find What Drives You** — Sports car intelligence platform for enthusiasts.

## Quick Start

```bash
git clone https://github.com/mikearonapi/autorev.git
cd autorev
npm install
cp .env.example .env.local  # Add your keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Required Environment Variables

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key

# Payments
STRIPE_SECRET_KEY=your-stripe-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret

# Optional but Recommended
YOUTUBE_API_KEY=your-youtube-key
RESEND_API_KEY=your-resend-key
DISCORD_WEBHOOK_*=your-discord-webhooks
CRON_SECRET=your-cron-secret
```

## Documentation

All documentation is in the `docs/` folder:

| Document | Purpose |
|----------|---------|
| [docs/index.md](docs/index.md) | Documentation hub |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture |
| [docs/DATABASE.md](docs/DATABASE.md) | All 75 database tables |
| [docs/API.md](docs/API.md) | All 99 API routes |
| [docs/PAGES.md](docs/PAGES.md) | All 37 pages & user journeys |
| [docs/AL.md](docs/AL.md) | AI assistant (17 tools) |
| [docs/COMPONENTS.md](docs/COMPONENTS.md) | All 70+ components |
| [docs/STRIPE_INTEGRATION.md](docs/STRIPE_INTEGRATION.md) | Stripe payment integration |
| [planning/reference/FEATURES.md](planning/reference/FEATURES.md) | Feature descriptions |
| [planning/reference/OWNER_GUIDE.md](planning/reference/OWNER_GUIDE.md) | Non-technical overview |

## Tech Stack

**Frontend:** Next.js 14 (App Router) • React • CSS Modules  
**Database:** Supabase (PostgreSQL + pgvector)  
**AI:** Anthropic Claude Sonnet 4 • OpenAI Embeddings  
**Payments:** Stripe  
**Hosting:** Vercel  
**Auth:** Supabase Auth  
**Images:** Vercel Blob

## System Stats

| Metric | Count |
|--------|-------|
| **Cars in Database** | 98 |
| **Database Tables** | 75 |
| **API Routes** | 99 |
| **React Components** | 70+ |
| **Service/Lib Files** | 114 |
| **Operational Scripts** | 170+ |
| **AL Tools** | 17 |
| **Encyclopedia Topics** | 136 |
| **Events** | 940+ |
| **Parts in Catalog** | 642 |

## Membership Tiers

| Tier | Price | Key Features |
|------|-------|--------------|
| **Free** | $0 | 1 car, full garage features, community & events, ~15 AL chats |
| **Enthusiast** | $9.99/mo | 3 cars, Insights dashboard, Data (Dyno & Track), ~130 AL chats |
| **Pro** | $19.99/mo | Unlimited cars, everything in Enthusiast, ~350 AL chats, priority support |

## Development

```bash
# Start dev server
npm run dev

# Run tests
npm test

# Run AL evaluation tests
npm run al:eval

# Run YouTube pipeline
npm run youtube:pipeline

# Audit events data
npm run audit:events
```

## Project Structure

```
/app/                  # Next.js pages & API routes
/components/           # React components (70+ files)
/lib/                  # Business logic & services (114 files)
/scripts/              # Data processing scripts (170+ files)
/docs/                 # Core reference documentation (21 files)
/planning/             # Strategies, roadmaps, audits, reference
/supabase/             # Database migrations & schema
/data/                 # Static data files
```

## External Integrations

- **Stripe** - Subscription billing & payments
- **Anthropic Claude** - AL AI assistant
- **OpenAI** - Text embeddings
- **YouTube Data API** - Video reviews
- **NHTSA** - Safety ratings & recalls
- **EPA** - Fuel economy data
- **Resend** - Transactional email
- **Discord** - Operations notifications
- **Vercel** - Hosting & cron jobs

## Contributing

AutoRev is currently in private development. Documentation contributions and bug reports are welcome.

## License

© 2024 AutoRev. All rights reserved.