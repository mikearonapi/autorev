# SuperNatural Motorsports

**Unleash Your Racing Spirit** — Expert sports car advisory, performance upgrades, and motorsports services.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Image Storage**: Vercel Blob
- **Deployment**: Vercel
- **Styling**: CSS Modules

## Features

- 🚗 **Sports Car Selector** - Find your perfect car based on 7 weighted criteria
- 📊 **Performance HUB** - Gran Turismo-inspired upgrade visualization
- 🔧 **Upgrade Advisory** - Expert guidance on modifications
- 📞 **Contact & Lead Capture** - Non-intrusive lead generation

## Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/mikearonapi/supernaturalmotorsports.git
   cd supernaturalmotorsports
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token (for images) | Optional |

## Vercel Deployment

1. Push to GitHub
2. Connect repository to Vercel
3. Add Supabase integration (auto-configures environment variables)
4. Deploy!

## Database Setup

The database schema is in `supabase/schema.sql`. Run it in the Supabase SQL Editor to set up tables.

To seed with sample data:
```bash
npm run seed
```

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── advisory/          # Car Selector page
│   ├── cars/[slug]/       # Car detail & performance pages
│   ├── contact/           # Contact form
│   ├── performance/       # Performance HUB
│   ├── services/          # Services page
│   ├── upgrades/          # Upgrades advisory
│   ├── layout.jsx         # Root layout
│   └── page.jsx           # Home page
├── components/            # React components
├── data/                  # Static data (cars, categories)
├── lib/                   # Utilities and API clients
├── supabase/              # Database schema
└── scripts/               # Database seeding scripts
```

## License

© 2024 SuperNatural Motorsports. All rights reserved.
