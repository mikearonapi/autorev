# Naming Conventions

> **PURPOSE**: Consistent naming across the codebase reduces confusion and errors.
> Follow these conventions for all new code. When in doubt, check existing patterns.

---

## Quick Reference

| Concept | Database | Code Variable | Component/File |
|---------|----------|---------------|----------------|
| A car model | `cars` table | `car` | `CarCard.jsx` |
| User's owned car | `user_vehicles` table | `vehicle` | `VehicleCard.jsx` |
| Upgrade configuration | `user_projects` table | `build` or `project` | `SavedBuildsProvider` |
| Favorited car | `user_favorites` table | `favorite` | `FavoritesProvider` |

---

## Entity Naming

### Car vs Vehicle

| Term | Meaning | Example Usage |
|------|---------|---------------|
| **Car** | A model from our database (e.g., "Porsche 911 GT3") | `car.slug`, `getCarBySlug()` |
| **Vehicle** | A user's owned instance of a car | `vehicle.vin`, `addVehicle()` |

```javascript
// ✅ CORRECT
const car = await getCarBySlug('porsche-911-gt3'); // Database car model
const vehicle = await getUserVehicles(userId);     // User's owned instance

// ❌ WRONG
const vehicle = await getCarBySlug('...');  // Confusing - this is a car, not vehicle
const car = await getUserCars(userId);      // These are vehicles, not cars
```

### Build vs Project

| Term | Meaning | Where Used |
|------|---------|------------|
| **Build** | A saved upgrade configuration | UI, components, user-facing |
| **Project** | Same thing, database terminology | Database table `user_projects` |

```javascript
// Both refer to the same thing:
// - UI/Components: "build" (useSavedBuilds, SavedBuildsProvider)
// - Database: "project" (user_projects table)

const { builds } = useSavedBuilds();  // ✅ Component usage
const { data } = await supabase.from('user_projects');  // ✅ DB query
```

---

## File Naming

### Services (`lib/`)

| Pattern | Example | Purpose |
|---------|---------|---------|
| `[domain]Service.js` | `userDataService.js` | CRUD operations for a domain |
| `[domain]Client.js` | `carsClient.js` | API/data fetching client |
| `[feature]Calculator.js` | `tunabilityCalculator.js` | Calculation logic |
| `[feature]Resolver.js` | `carResolver.js` | ID/slug resolution |

### Components

| Pattern | Example | Purpose |
|---------|---------|---------|
| `[Entity][Action].jsx` | `CarCard.jsx`, `CarSelector.jsx` | Single entity component |
| `[Entity]List.jsx` | `CarList.jsx` | List of entities |
| `[Feature]Provider.jsx` | `SavedBuildsProvider.jsx` | React Context provider |
| `[Feature]Modal.jsx` | `AddVehicleModal.jsx` | Modal component |

### Hooks

| Pattern | Example |
|---------|---------|
| `use[Entity].js` | `useCarData.js` |
| `use[Feature].js` | `useCheckout.js` |

---

## Variable Naming

### Boolean Props/Variables

Use `is*` or `has*` prefixes for booleans:

```javascript
// ✅ CORRECT
const isLoading = true;
const hasError = false;
const isAuthenticated = true;
const hasPremiumAccess = false;

// ❌ WRONG
const loading = true;     // Not clear it's boolean
const error = false;      // Could be error object
const authenticated = true;
```

### State Variables

| Pattern | Example |
|---------|---------|
| `[noun]` | `const [cars, setCars] = useState([])` |
| `is[State]` | `const [isLoading, setIsLoading] = useState(false)` |
| `selected[Entity]` | `const [selectedCar, setSelectedCar] = useState(null)` |

### Handler Functions

| Pattern | Example |
|---------|---------|
| `handle[Action]` | `handleSubmit`, `handleClick` |
| `on[Event]` (props) | `onClick`, `onSubmit`, `onChange` |

```javascript
// ✅ CORRECT - handler naming
const handleAddVehicle = async () => { ... };
<Button onClick={handleAddVehicle} />

// Callback props use on* prefix
<Modal onClose={handleClose} onSubmit={handleSubmit} />
```

---

## Database Column Naming

### Tables

| Pattern | Example |
|---------|---------|
| Plural noun | `cars`, `events`, `users` |
| `[entity]_[relation]` | `user_vehicles`, `car_issues` |
| `[entity]_[entity]_links` | `youtube_video_car_links` |

### Columns

| Pattern | Example | Usage |
|---------|---------|-------|
| `snake_case` | `created_at`, `car_slug` | All columns |
| `[entity]_id` | `car_id`, `user_id` | Foreign keys |
| `is_[state]` | `is_active`, `is_archived` | Booleans |
| `[metric]_at` | `created_at`, `updated_at` | Timestamps |

---

## API Route Naming

| Pattern | Example |
|---------|---------|
| `/api/[entity]` | `/api/cars` |
| `/api/[entity]/[id]` | `/api/cars/[slug]` |
| `/api/[entity]/[id]/[sub-resource]` | `/api/cars/[slug]/issues` |
| `/api/users/[userId]/[resource]` | `/api/users/[userId]/vehicles` |

**Prefer kebab-case for URL paths:**

```
✅ /api/cars/[slug]/price-by-year
❌ /api/cars/[slug]/priceByYear
```

---

## CSS Class Naming

### Module CSS

| Pattern | Example |
|---------|---------|
| `camelCase` | `.pageContainer`, `.cardHeader` |
| `[element][Modifier]` | `.buttonPrimary`, `.cardHover` |

```css
/* ✅ CORRECT */
.pageContainer { }
.cardHeader { }
.buttonPrimary { }

/* ❌ WRONG */
.page-container { }  /* Use camelCase in modules */
.PageContainer { }   /* Don't use PascalCase */
```

---

## Common Abbreviations

| Full Term | Abbreviation | Usage |
|-----------|--------------|-------|
| Horsepower | `hp` | `car.hp`, `hpGain` |
| Torque | `tq` or `torque` | `car.torque` |
| Configuration | `config` | `alConfig.js` |
| Properties | `props` | Component props |
| Authentication | `auth` | `AuthProvider` |
| Application | `app` | Directory name |
| Button | `btn` | CSS classes |
| Information | `info` | `carInfo` |

---

## Anti-Patterns to Avoid

### ❌ Inconsistent Entity Names

```javascript
// DON'T mix car/vehicle inconsistently
const vehicle = getCarBySlug(slug);  // This returns a car, not vehicle
const cars = getUserVehicles(userId); // These are vehicles
```

### ❌ Generic Names

```javascript
// DON'T use generic names
const data = await fetchData();     // What data?
const items = getItems();           // What items?
const list = getList();             // List of what?

// DO use specific names
const cars = await fetchCars();
const upgrades = getAvailableUpgrades();
const favorites = getUserFavorites();
```

### ❌ Abbreviations Without Context

```javascript
// DON'T use unclear abbreviations
const c = await getCarBySlug(slug);
const v = vehicles[0];
const u = upgrades.filter(...);

// DO use clear names
const car = await getCarBySlug(slug);
const vehicle = vehicles[0];
const filteredUpgrades = upgrades.filter(...);
```

---

## Migration Notes

Some legacy patterns exist that don't follow these conventions:

| Legacy Pattern | Current Standard | Notes |
|----------------|------------------|-------|
| `/api/cars/[slug]/priceByYear` | Should be `price-by-year` | Pending rename |
| `user_projects` table | Used "project" not "build" | Keep for DB compatibility |

When modifying existing code, prefer maintaining consistency with surrounding code over strict convention adherence - unless doing a dedicated refactor.

---

*Last Updated: 2026-01-22*
