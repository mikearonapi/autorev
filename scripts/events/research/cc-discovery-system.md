# Cars & Coffee Discovery System

## Approach That Worked for Leesburg

1. **Search Query Pattern**: `"cars and coffee [city] [state] [nearby cities]"`
2. **Key Data Points to Extract**:
   - Venue name
   - Address / Location
   - Schedule (Every Saturday, 1st Sunday monthly, etc.)
   - Source URL
   - Coordinates (can geocode from address)

3. **Recurrence Patterns Supported**:
   - `Every Saturday` → 52 events/year
   - `Every Sunday` → 52 events/year  
   - `1st/2nd/3rd/4th Saturday monthly` → 12 events/year
   - `1st/2nd/3rd/4th Sunday monthly` → 12 events/year
   - `Last Saturday/Sunday monthly` → 12 events/year

## Scalable Process

### Step 1: Batch City Research
For each city in top 500, run searches:
- `cars and coffee [city] [state]`
- `cars and coffee near [city]`
- `[city] car meets weekly monthly`

### Step 2: Collect Venues in JSON Format
```json
{
  "name": "Cars & Coffee [City]",
  "city": "City Name",
  "state": "ST",
  "venue_name": "Venue Name",
  "address": "123 Main St",
  "zip": "12345",
  "lat": 39.1234,
  "lng": -77.5678,
  "recurrence": "Every Saturday",
  "source_url": "https://..."
}
```

### Step 3: Run Seeder
The seeder generates all 2026 dates based on recurrence pattern.

## Coverage Targets

| City Tier | Cities | Target Venues/City | Total Venues |
|-----------|--------|-------------------|--------------|
| Top 50 metros | 50 | 5-10 | 250-500 |
| Cities 51-150 | 100 | 3-5 | 300-500 |
| Cities 151-300 | 150 | 2-3 | 300-450 |
| Cities 301-500 | 200 | 1-2 | 200-400 |
| **TOTAL** | **500** | - | **1,050-1,850** |

With average 25 events/venue → **26,000-46,000 C&C events**

## Research Priority Order

### Batch 1: Major Metros (Top 50)
New York, Los Angeles, Chicago, Houston, Phoenix, Philadelphia, 
San Antonio, San Diego, Dallas, San Jose, Austin, Jacksonville,
Fort Worth, Columbus, Charlotte, Indianapolis, Seattle, Denver,
Washington DC, Boston, El Paso, Nashville, Detroit, Portland,
Las Vegas, Memphis, Louisville, Baltimore, Milwaukee, Albuquerque,
Tucson, Fresno, Sacramento, Kansas City, Mesa, Atlanta, Omaha,
Colorado Springs, Raleigh, Long Beach, Virginia Beach, Miami,
Oakland, Minneapolis, Tulsa, Bakersfield, Tampa, Arlington, Aurora

### Batch 2: Secondary Cities (51-150)
Focus on college towns, affluent suburbs, car culture hubs

### Batch 3: Smaller Cities (151-500)
Regional coverage, 1-2 venues per city

