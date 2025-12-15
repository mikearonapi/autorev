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
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=your-anthropic-key
```

## Documentation

All documentation is in the `docs/` folder:

| Document | Purpose |
|----------|---------|
| [docs/index.md](docs/index.md) | Documentation hub |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture |
| [docs/PAGES.md](docs/PAGES.md) | All 24 pages & user journeys |
| [docs/DATABASE.md](docs/DATABASE.md) | All 51 database tables |
| [docs/API.md](docs/API.md) | All 37 API routes |
| [docs/AL.md](docs/AL.md) | AI assistant (15 tools) |
| [docs/COMPONENTS.md](docs/COMPONENTS.md) | All 46 components |
| [docs/FEATURES.md](docs/FEATURES.md) | Feature descriptions |
| [docs/OWNER_GUIDE.md](docs/OWNER_GUIDE.md) | Non-technical overview |

## Tech Stack

Next.js 14 • Supabase • Claude AI • Vercel

---

© 2024 AutoRev
