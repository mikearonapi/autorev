# Turn 14 Distribution & SEMA Data Co-Op Research
**Date**: 2026-01-21
**Purpose**: Industry-standard ACES-compliant parts fitment data integration

---

## Turn 14 Distribution API

### Overview
Turn 14 Distribution is a major automotive aftermarket parts distributor that provides ACES-compliant fitment data via API to dealers and integration partners.

### API Details

| Property | Value |
|----------|-------|
| Base URL | `https://api.turn14.com` |
| Auth Method | OAuth 2.0 (Client ID + Secret → Access Token) |
| Auth Endpoint | `/v1/token` |
| Rate Limits | Unknown (check dealer portal) |
| Format | JSON |

### Available Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/v1/token` | Exchange Client ID & Secret for access token |
| `/v1/items` | List items (products) with identifiers |
| `/v1/items/data` | Detailed product metadata (brand, description, categories) |
| `/v1/items/fitment` | Vehicle fitment data (Year/Make/Model/Submodel) |
| `/v1/pricing` | Pricing info (dealer, MAP, retail, cost) |
| `/v1/inventory` | Inventory levels across warehouses |
| `/v1/shipping/item_estimation` | Shipping cost estimates |
| `/v1/dropship/{dropship_id}` | Dropship info for items |

### Requirements
- Turn 14 dealer account required
- API access must be enabled in account settings
- Credentials found at: **Settings & Data → API → Documentation / API Credentials**
- Fitment data only available with "fitment option" enabled

### Integration Notes
- Fitment data syncs on specific days (Mondays & Thursdays in some configurations)
- Vehicle IDs use ACES Vehicle IDs (VCdb IDs)
- Supports Year, Make, Model, Submodel at minimum
- Additional qualifiers (engine, transmission) depend on part

### Estimated Coverage
- 500+ brands available through Turn 14
- Hundreds of thousands of SKUs with fitment data
- Direct access without SEMA membership

---

## SEMA Data Co-Op (SDC)

### Overview
The SEMA Data Co-Op is the industry's largest repository of aftermarket automotive parts data, providing standardized ACES & PIES data.

### ACES (Aftermarket Catalog Exchange Standard)
- Handles **fitment data** - which vehicles a part fits
- Fields: Year, Make, Model, Submodel, Engine, Transmission
- Current version: **ACES 4.2 (revision 2)** - October 2024
- ACES 5.0 expected early-to-mid 2026

### PIES (Product Information Exchange Standard)
- Handles **product attribute data**
- Fields: weights, dimensions, descriptions, pricing, images
- Current version: **PIES 7.2 (revision 7)** - March 2024
- PIES 8.0 expected early-to-mid 2026

### Supporting Reference Databases
| Database | Purpose |
|----------|---------|
| VCdb | Vehicle Configuration Database - all vehicles |
| PCdb | Parts Classification Database - part categories |
| Qdb | Qualifier Database - additional qualifiers |
| PAdb | Product Attribute Database - attribute definitions |
| Brand Table | Brand registry |

### Auto Care Association API (NEW - Jan 2025)
- Reference databases now available via API (previously only manual downloads)
- Daily updates available instead of weekly
- Formats: JSON (recommended), Access 2007, SQL Server
- **WARNING**: ASCII and MySQL formats deprecated January 2026

### Requirements
- SEMA membership required for SDC access
- Auto Care Association subscription for reference database API
- Data validation required before distribution

### Coverage
- 2.5M+ part numbers available
- 500+ brands
- Industry gold standard for fitment accuracy

---

## Recommendation: Implementation Path

### Phase 1: Turn 14 Distribution (No SEMA Membership Required)
1. Apply for Turn 14 dealer account
2. Enable API access in account settings
3. Implement `lib/turn14Service.js`:

```javascript
// Proposed Turn 14 Service Structure
export const Turn14Service = {
  // Authentication
  async getAccessToken(clientId, clientSecret),
  
  // Products
  async getItems(options = {}),
  async getItemData(itemId),
  async getItemFitment(itemId),
  
  // Pricing & Inventory
  async getPricing(itemIds),
  async getInventory(itemIds),
  
  // Mapping to AutoRev
  async mapFitmentToCarId(fitment),  // Uses VCdb → car_variants → cars
  async ingestPartWithFitment(part),  // Full part + fitment ingestion
}
```

### Phase 2: SEMA Data Co-Op (Full Industry Access)
1. Apply for SEMA membership (if not already member)
2. Subscribe to Auto Care Association reference database API
3. Implement `lib/semaDataService.js` for:
   - VCdb vehicle lookups
   - ACES/PIES file parsing
   - Incremental sync from SDC exports

### Phase 3: Hybrid Approach
- Use Turn 14 for quick wins (immediate fitment data)
- Use SEMA SDC for comprehensive coverage
- Cross-reference VCdb IDs between sources

---

## Database Schema Additions Needed

### For Turn 14 Integration
```sql
-- Add Turn 14 identifiers to parts table
ALTER TABLE parts ADD COLUMN turn14_item_id TEXT;
ALTER TABLE parts ADD COLUMN turn14_sku TEXT;

-- Create Turn 14 fitment mapping cache
CREATE TABLE turn14_fitment_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turn14_item_id TEXT NOT NULL,
  vcdb_vehicle_id INTEGER,
  year INTEGER,
  make TEXT,
  model TEXT,
  submodel TEXT,
  car_id UUID REFERENCES cars(id),
  car_variant_id UUID REFERENCES car_variants(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(turn14_item_id, vcdb_vehicle_id)
);
```

### For VCdb Integration
```sql
-- ACES Vehicle Configuration Database reference
CREATE TABLE vcdb_vehicles (
  vcdb_id INTEGER PRIMARY KEY,
  year_id INTEGER,
  make_id INTEGER,
  model_id INTEGER,
  submodel_id INTEGER,
  base_vehicle_id INTEGER,
  year INTEGER,
  make TEXT,
  model TEXT,
  submodel TEXT,
  car_id UUID REFERENCES cars(id),  -- Mapped to AutoRev cars
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vcdb_vehicles_car_id ON vcdb_vehicles(car_id);
CREATE INDEX idx_vcdb_vehicles_year_make_model ON vcdb_vehicles(year, make, model);
```

---

## Action Items

1. **Immediate**: Apply for Turn 14 dealer account
2. **Short-term**: Implement Turn 14 API service
3. **Medium-term**: SEMA membership application (if not already member)
4. **Long-term**: Full VCdb/ACES integration

---

## References

- Turn 14 Distribution: https://www.turn14.com/
- SEMA Data Co-Op: https://www.sema.org/data
- Auto Care Association ACES/PIES: https://www.autocare.org/data-standards
- ACES 4.2 Documentation: Auto Care Members Only
- PIES 7.2 Documentation: Auto Care Members Only
