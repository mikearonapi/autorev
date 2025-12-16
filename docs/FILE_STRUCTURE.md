# AutoRev File Structure

**Last Generated:** December 15, 2024

## Purpose
Documents the actual file organization and structure of the AutoRev codebase, based on current state analysis.

## Top-Level Organization

```
/Volumes/10TB External HD/01. Apps - WORKING/AutoRev/
├── app/              # Next.js 14 App Router pages and API routes
├── components/       # React components with CSS modules
├── lib/              # Business logic services and utilities  
├── scripts/          # Data processing and utility scripts
├── data/             # Static data files and configurations
├── docs/             # Documentation files
├── supabase/         # Database migrations and schema
├── public/           # Static assets (images, manifest)
├── audit/            # Code audit reports and analysis
├── planning/         # Project planning documents
├── reports/          # Generated coverage and analysis reports
└── data-samples/     # Sample data files
```

## Detailed Structure

### `/lib` Directory (98 files)
Main business logic and services organized into:

```
lib/
├── encyclopediaTopics/    # Encyclopedia content organized by system
├── eventsIngestion/       # Event data ingestion utilities
├── eventSourceFetchers/   # Event source scraping adapters
├── forumScraper/         
│   └── adapters/         # Forum-specific scraping adapters
├── scrapers/             # Web scrapers for various data sources
└── stores/               # Client-side state management
```

**Key Service Files:**
- `supabase.js` - Database client configuration
- `alTools.js` (1,984 lines) - AI tool implementations
- `encyclopediaHierarchy.js` (1,457 lines) - Content organization
- `eventsService.js` - Event search and management
- `carsClient.js` - Car data service
- `tierAccess.js` - Feature gating and permissions

### `/components` Directory (104 files)
React components with CSS modules organized into:

```
components/
├── icons/            # SVG icon components
└── providers/        # React context providers
```

**Naming Convention:** PascalCase for component files (`.jsx`) with matching CSS modules (`.module.css`)

**Largest Components:**
- `PerformanceHub.jsx` (1,715 lines) - Performance data display
- `UpgradeCenter.jsx` (1,159 lines) - Modification planning interface
- `SportsCarComparison.jsx` (1,148 lines) - Car comparison tool
- `AIMechanicChat.jsx` (874 lines) - AI assistant interface

### `/app` Directory (135 files)
Next.js App Router structure with nested routes:

```
app/
├── api/                  # API route handlers
│   ├── cars/
│   │   ├── [slug]/      # Dynamic car-specific routes
│   │   └── expert-reviewed/
│   ├── events/
│   │   ├── [slug]/      # Dynamic event routes
│   │   └── submit/
│   ├── cron/            # Scheduled job endpoints
│   └── users/           # User-specific API routes
├── browse-cars/         # Car browsing pages
├── community/           # Community features
├── events/              # Event listing pages
├── garage/              # User garage functionality
├── internal/            # Admin/internal tools
└── profile/             # User profile pages
```

### `/scripts` Directory (132 files)
Data processing and utility scripts:

- **Extensions:** 102 `.js` files, 28 `.mjs` files, 1 `.json` file, 1 `.sql` file
- **Purpose:** Data enrichment, testing, migration, scraping automation
- **Notable:** Uses ES modules (`.mjs`) for newer scripts

### `/data` Directory (10 files)
Static configuration and reference data:

```
data/
├── upgradeEducation.js    # Modification guidance data
├── upgradeConflicts.js    # Parts compatibility rules
├── upgradeTools.js        # Tool requirements for mods
└── carCategories.js       # Vehicle classification
```

## Barrel Exports (index.js files)

Four barrel export files found:

1. **`/lib/encyclopediaTopics/index.js`** - Exports all encyclopedia topics organized by system (136 topics total)
2. **`/lib/eventSourceFetchers/index.js`** - Event scraper adapters
3. **`/lib/forumScraper/index.js`** - Forum scraping utilities  
4. **`/lib/scrapers/index.js`** - Web scraping framework

## Naming Convention Analysis

**Consistency Issues Found:**
- **Components:** Mix of PascalCase (preferred) and kebab-case
- **API routes:** Consistent kebab-case for directories, camelCase for some files
- **Services:** Consistent camelCase for most lib files
- **CSS:** Consistent kebab-case for CSS module classes

**File Extension Patterns:**
- React components: `.jsx` (not `.js`)
- Services/utilities: `.js` 
- Modern scripts: `.mjs` for ES modules
- Styles: `.module.css` for component-scoped styles

## Notable Patterns

- **Co-located CSS:** Each component has a matching `.module.css` file
- **Service organization:** Related services grouped in subdirectories
- **API structure:** RESTful routes with dynamic segments using Next.js convention
- **Migration system:** Numbered SQL files in `/supabase/migrations/`

## Size Analysis

**Large files requiring potential refactoring (>1000 lines):**
- `lib/alTools.js` (1,984 lines) - AI tool implementations
- `lib/encyclopediaHierarchy.js` (1,457 lines) - Content hierarchy
- `components/PerformanceHub.jsx` (1,715 lines) - Performance data component
- `components/UpgradeCenter.jsx` (1,159 lines) - Modification planning
- `components/SportsCarComparison.jsx` (1,148 lines) - Comparison interface

## NEEDS VERIFICATION

- Whether barrel exports are fully utilized across the codebase
- If large components could benefit from splitting into smaller components
- Whether all scripts in `/scripts/` are still actively used