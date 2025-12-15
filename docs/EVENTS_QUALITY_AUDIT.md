# Events Data Quality Report

**Generated:** 2025-12-15T17:48:44.197Z
**Script:** audit-events-quality.js

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total Events | 502 |
| With Coordinates | 502 (100.0%) |
| With Images | 0 (0.0%) |
| Free Events | 267 |
| Past Events | 501 |

### By Status

| Status | Count |
|--------|-------|
| approved | 502 |

### By Region

| Region | Count |
|--------|-------|
| West | 137 |
| Southeast | 124 |
| Midwest | 90 |
| Northeast | 78 |
| Southwest | 73 |

### By Scope

| Scope | Count |
|-------|-------|
| regional | 196 |
| local | 195 |
| national | 111 |

---

## Data Quality Summary

| Category | Count |
|----------|-------|
| Events Missing Required Fields | 0 |
| Events with Quality Issues | 501 |
| → Errors | 0 |
| → Warnings | 504 |
| Relationship Integrity Issues | 0 |

---

## Missing Required Fields

✅ All events have required fields populated.


---

## Quality Issues: ERRORS

✅ No critical data quality errors found.


---

## Quality Issues: WARNINGS

| Event ID | Name | Field | Issue |
|----------|------|-------|-------|
| 06c95f8d... | 2025 Tire Rack SCCA Solo Natio... | start_date | Past event still approved |
| 871c34f3... | Acura/Honda National Meet | start_date | Past event still approved |
| 10b76761... | Alfa Romeo Owners Club Convent... | start_date | Past event still approved |
| 97324399... | Alpine Loop Drive | start_date | Past event still approved |
| e5d47dd5... | Arizona Concours d'Elegance 20... | start_date | Past event still approved |
| 5681280b... | Attack Buttonwillow | start_date | Past event still approved |
| 98046799... | Audi Club Quattrofest | start_date | Past event still approved |
| 69b63b45... | Audi Club Track Day - Summit P... | start_date | Past event still approved |
| 3416d0e2... | Audrain Cars & Coffee Newport | start_date | Past event still approved |
| 0c1cf523... | Audrain Cars & Coffee Newport | start_date | Past event still approved |
| e2e2aa2a... | Barrett-Jackson Scottsdale 202... | start_date | Past event still approved |
| accc120d... | Beartooth Highway Cruise | start_date | Past event still approved |
| 6638decb... | Big Sur Coastal Drive | start_date | Past event still approved |
| b8720584... | Blue Ridge Parkway Cruise | start_date | Past event still approved |
| 742412ab... | Blue Ridge Parkway Spring Crui... | start_date | Past event still approved |
| 28d1dee9... | BMW CCA California Tour | start_date | Past event still approved |
| 1c74c933... | BMW CCA Club Race - Road Atlan... | start_date | Past event still approved |
| 5aaba02d... | BMW CCA O'Fast 2025 at Road Am... | start_date | Past event still approved |
| 9d9ba70b... | BMW CCA O'Fest 2025 | start_date | Past event still approved |
| 9d9ba70b... | BMW CCA O'Fest 2025 | city | Placeholder value |
| df9a4d14... | BMW CCA OktoberFAST HPDE - Roa... | start_date | Past event still approved |
| 4e0b77b9... | BMW CCA Oktoberfest | start_date | Past event still approved |
| a57c17b3... | BMW CCA Street Survival Dallas | start_date | Past event still approved |
| d051ba99... | BMW M Day at Road America | start_date | Past event still approved |
| 6b57445b... | Boca Raton Concours d Elegance | start_date | Past event still approved |
| 40332e23... | Bonhams Quail Lodge Auction | start_date | Past event still approved |
| 63c5b63d... | Bonhams|Cars Scottsdale Auctio... | start_date | Past event still approved |
| 92890af3... | Bonhams|Cars The Quail Auction... | start_date | Past event still approved |
| b1fc8283... | BoxerFest - Subaru Enthusiast ... | start_date | Past event still approved |
| 4a64ac51... | Bring a Trailer Monterey | start_date | Past event still approved |
| d8f327da... | Bull Run Rally | start_date | Past event still approved |

_...and 471 more events with warnings_


---

## Relationship Integrity

✅ All foreign key relationships are valid.


---

## Recommendations

### ⚠️ Maintenance Required

1. Mark 501 past events as 'expired'
### 📝 Nice to Have

1. Address 504 data quality warnings
2. Standardize event name capitalization

---

_End of Data Quality Report_
