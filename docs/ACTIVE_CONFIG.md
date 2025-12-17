# AutoRev Active Configuration

**Last Generated:** December 15, 2024

## Purpose
Documents the actual configuration state of the AutoRev application, including build tools, environment variables, and feature flags.

## ESLint Configuration

**File:** `.eslintrc.json`

```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "react/no-unescaped-entities": "off"
  }
}
```

**Analysis:**
- **Base:** Extends Next.js recommended configuration
- **Custom Rules:** Single override to allow unescaped entities in React components
- **Rationale:** Content-heavy application likely needs unescaped quotes, apostrophes in text

**Coverage:** ESLint covers JavaScript/JSX files with minimal customization, indicating adherence to Next.js standards.

## Prettier Configuration

**Status:** No Prettier configuration files found (`.prettierrc`, `prettier.config.js`, etc.)

**Implication:** Code formatting likely relies on:
1. Editor/IDE formatting
2. ESLint's formatting rules
3. Default Next.js formatting

## Next.js Configuration

**File:** `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'abqnp7qrs0nhv5pw.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https', 
        hostname: '**.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
    ],
  },

  async redirects() {
    return [];
  },
};
```

**Key Settings:**
- **React Strict Mode:** Enabled (development checks)
- **Image Optimization:** Configured for Vercel Blob Storage, Supabase, Google
- **Redirects:** Empty array (placeholder for future redirects)

## Environment Variables

### Required Variables (Referenced in Code)

**Supabase Configuration:**
```
NEXT_PUBLIC_SUPABASE_URL         # Public - Database URL
NEXT_PUBLIC_SUPABASE_ANON_KEY    # Public - Anonymous access key  
SUPABASE_SERVICE_ROLE_KEY        # Server-only - Full access key
```

**Cron/Automation:**
```
CRON_SECRET                      # Server-only - Cron job authentication
```

**Alternative Supabase Config (for scripts):**
```
SUPABASE_URL                     # Fallback for NEXT_PUBLIC_SUPABASE_URL
```

### Environment Variable Usage Patterns

**Client-side (NEXT_PUBLIC_*):**
- Automatically available in browser
- Used for Supabase client initialization
- Safe for public exposure

**Server-side:**
- Available only in API routes and server components
- Used for service role operations
- Must be kept secure

**Configuration Check Pattern:**
```javascript
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn('[AutoRev] Supabase not configured. Using local data fallback.');
}
```

## Package.json Scripts

### Development Scripts
```json
{
  "dev": "next dev",
  "build": "next build", 
  "start": "next start",
  "lint": "next lint"
}
```

### Testing Scripts
```json
{
  "test": "node --test \"lib/**/*.test.js\" \"scripts/**/*.test.js\"",
  "al:eval": "node scripts/al-eval-regression-tests.mjs"
}
```

### Data Processing Scripts
```json
{
  "seed": "node scripts/migrate-and-seed.js",
  "gen:seed-multi-brand-migration": "node scripts/generateSeedMultiBrandMigration.mjs",
  "smoke:parts-search-api": "node scripts/smokePartsSearchApi.mjs"
}
```

### YouTube Pipeline Scripts
```json
{
  "youtube:pipeline": "node scripts/youtube-pipeline.js",
  "youtube:discover": "node scripts/youtube-discovery.js",
  "youtube:transcripts": "node scripts/youtube-transcripts.js",
  "youtube:ai": "node scripts/youtube-ai-processing.js",
  "youtube:consensus": "node scripts/youtube-aggregate-consensus.js",
  "youtube:curated": "node scripts/youtube-browser-discovery.js"
}
```

### Event Processing Scripts  
```json
{
  "events:enrich:2026": "node scripts/enrich-events-2026-from-sources.js"
}
```

### Audit Scripts
```json
{
  "audit:events:mece": "node scripts/audit-events-mece.js",
  "audit:events:urls": "node scripts/validate-event-urls.js", 
  "audit:events:quality": "node scripts/audit-events-quality.js",
  "audit:events": "node scripts/audit-events-all.js"
}
```

**Analysis:**
- **Heavy automation:** Many custom scripts for data processing
- **Node.js native testing:** Uses built-in Node.js test runner
- **ES modules:** Scripts use `.mjs` extension for module support
- **Domain-specific:** Scripts organized by feature area (YouTube, events, audit)

## Feature Flags & Beta Toggles

### IS_BETA Flag Usage

**Found in:** `components/providers/SavedBuildsProvider.jsx`

```javascript
import { hasAccess, IS_BETA } from '@/lib/tierAccess';

// Feature gating logic
const canSaveBuilds = IS_BETA ? isAuthenticated : hasAccess(userTier, 'buildProjects', isAuthenticated);

if (!IS_BETA && !canSaveBuilds) {
  // Show premium gate
}

// Context value
isBeta: IS_BETA,
```

**Pattern:**
- `IS_BETA` acts as global feature flag
- When enabled: Features available to all authenticated users
- When disabled: Features respect tier-based access control

**Files using IS_BETA:**
- `components/providers/SavedBuildsProvider.jsx` (4 references)
- Likely defined in `lib/tierAccess.js`

### Tier-Based Feature Gates

**System:** Tier-based access control for features

**Tiers identified:**
- `free`
- `collector` 
- `tuner`
- `admin`

**Gating pattern:**
```javascript
const hasFeature = hasAccess(userTier, 'featureName', isAuthenticated);
```

## TypeScript Configuration

**File:** `tsconfig.json` (exists in project root)

**Status:** TypeScript configuration present, indicating the project supports TypeScript alongside JavaScript.

**Module Type:** `package.json` specifies `"type": "module"` for ES modules.

## Build Dependencies

### Core Framework
- **Next.js:** `^14.2.0` (App Router architecture)
- **React:** `^18.2.0`
- **React DOM:** `^18.2.0`

### Database & Auth
- **Supabase:** Multiple packages for different use cases
  - `@supabase/supabase-js`: `^2.86.2` (main client)
  - `@supabase/auth-helpers-nextjs`: `^0.15.0` (auth integration)
  - `@supabase/ssr`: `^0.8.0` (server-side rendering)

### AI & External APIs
- **Anthropic:** `@anthropic-ai/sdk: ^0.39.0`
- **OpenAI:** `openai: ^6.10.0`
- **Google APIs:** `googleapis: ^144.0.0`

### Web Scraping & Automation
- **Puppeteer:** `^24.32.1` (browser automation)
- **Cheerio:** `^1.1.2` (HTML parsing)

### Utilities
- **Sharp:** `^0.34.5` (image processing)
- **dotenv:** `^16.4.5` (environment management)

## Development Dependencies

### TypeScript Support
- **TypeScript:** `^5.9.3`
- **@types/node:** `^24.10.1`
- **@types/react:** `^19.2.7`

### Database Tooling
- **pg:** `^8.16.3` (PostgreSQL client for scripts)

### Utilities
- **image-size:** `^2.0.2` (image dimension detection)

## Vercel Configuration

**File:** `vercel.json` (exists in project root)

**Deployment:** Application configured for Vercel deployment with specific settings.

## NEEDS VERIFICATION

- **Prettier configuration:** Whether formatting is handled by ESLint or separate Prettier config
- **TypeScript usage:** Extent of TypeScript adoption vs plain JavaScript
- **Feature flag configuration:** Where `IS_BETA` flag is defined and controlled
- **Environment variable completeness:** Whether all required env vars are documented
- **Build optimization:** Whether bundle analysis reveals optimization opportunities
- **Vercel-specific settings:** Contents of `vercel.json` configuration
