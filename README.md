# SuperNatural Motorsports

A premium sports car advisory platform helping enthusiasts at every budget find their perfect car, plan upgrades, and visualize performance improvements.

## Features

- **Car Selector** - Find your perfect sports car with weighted priority scoring across 7 categories
- **Performance HUB** - Gran Turismo-inspired visualization of stock vs. upgraded performance
- **Upgrade Advisory** - Get personalized upgrade recommendations based on your goals
- **Car Detail Pages** - In-depth profiles for 35+ sports cars from $25K to $100K

## Tech Stack

- **Frontend**: React 18 + Vite
- **Routing**: React Router v6
- **Styling**: CSS Modules with CSS custom properties
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Images**: Vercel Blob Storage

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for database)
- Vercel account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/supernatural-motorsports.git
   cd supernatural-motorsports
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   Edit `.env` with your Supabase credentials (see below).

4. **Start development server**
   ```bash
   npm run dev
   ```
   Open http://localhost:5173

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Supabase (required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...

# Vercel Blob (optional, for images)
VITE_VERCEL_BLOB_URL=https://your-blob.public.blob.vercel-storage.com
```

**Note**: `VITE_` prefixed variables are exposed to the browser. Never put secrets in these.

## Database Setup

### Supabase Configuration

1. Create a new Supabase project
2. Go to SQL Editor
3. Run the schema from `supabase/schema.sql`
4. (Optional) Seed with initial data using `scripts/seed-cars-from-local.js`

### Schema Overview

- `cars` - Vehicle data (specs, scores, metadata)
- `leads` - Contact form submissions and newsletter signups
- `upgrade_packages` - Predefined upgrade tiers with performance deltas

## Deployment

### Vercel Deployment

1. **Connect to GitHub**
   - Import repository in Vercel dashboard
   - Vercel auto-detects Vite configuration

2. **Set Environment Variables**
   In Vercel dashboard → Settings → Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_VERCEL_BLOB_URL` (after setting up Blob storage)

3. **Set up Blob Storage**
   - Go to Storage → Create → Blob
   - Copy the public URL to `VITE_VERCEL_BLOB_URL`

4. **Deploy**
   Push to main branch or click "Deploy" in dashboard

### Build Commands

```bash
npm run build    # Production build
npm run preview  # Preview production build locally
```

## Image Management

Images are stored in Vercel Blob. See `docs/image-inventory.md` for:
- Complete list of required images
- Naming conventions
- AI generation prompts
- Upload workflow

### Quick Image Workflow

1. Generate images using Google AI (prompts in `scripts/generate-images.js`)
2. Upload to Vercel Blob
3. Update car `image_hero_url` in Supabase (for car images)

## Project Structure

```
├── src/
│   ├── api/          # Supabase client and data fetching
│   ├── components/   # Reusable React components
│   ├── data/         # Static data (cars, categories, upgrades)
│   ├── lib/          # Utility functions (scoring, performance)
│   ├── pages/        # Page components (routes)
│   └── styles/       # Global CSS and theme tokens
├── supabase/
│   └── schema.sql    # Database schema
├── scripts/
│   ├── generate-images.js    # Image prompt helper
│   └── seed-cars-from-local.js  # Database seeder
├── docs/
│   ├── data-model.md        # Data architecture
│   └── image-inventory.md   # Image requirements
└── public/           # Static assets
```

## Data Architecture

See `docs/data-model.md` for detailed information about:
- What lives in Supabase vs. local files
- Scoring algorithms
- Performance calculations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

© 2024 SuperNatural Motorsports. All rights reserved.

