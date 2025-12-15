# MECE Audit Report

**Generated:** 2025-12-15T17:48:39.159Z
**Script:** audit-events-mece.js

---

## Summary

| Metric | Value |
|--------|-------|
| Total Events | 502 |
| Cross-Category Duplicates | 4 |
| Within-Category Near-Duplicates | 52 |
| Potential Miscategorizations | 49 |
| **Critical Issues** | **4** |

### Events by Category

| Category | Count |
|----------|-------|
| Cars & Coffee | 258 |
| Car Show | 54 |
| Club Meetup | 35 |
| Cruise / Drive | 21 |
| Autocross | 37 |
| Track Day / HPDE | 62 |
| Time Attack | 10 |
| Industry Event | 7 |
| Auction | 18 |
| Other | 0 |

---

## Cross-Category Duplicates (CRITICAL)

### Same URL in Different Categories (4)

⚠️ **These events share the same URL but are in different categories - likely data entry errors**

**URL:** `https://bmwcca.org`
| Event ID | Name | Category | Date | Location |
|----------|------|----------|------|----------|
| 28d1dee9... | BMW CCA California Tour | Cruise / Drive | 2025-06-07 | Sonoma, CA |
| 4e0b77b9... | BMW CCA Oktoberfest | Club Meetup | 2025-09-15 | Greer, SC |

**URL:** `https://larzanderson.org`
| Event ID | Name | Category | Date | Location |
|----------|------|----------|------|----------|
| 7af48b6c... | Cars & Coffee Boston | Cars & Coffee | 2025-06-21 | Brookline, MA |
| 1e8ab7f1... | Cars & Coffee Boston | Cars & Coffee | 2025-07-19 | Brookline, MA |
| 37ed3e96... | Cars & Coffee Boston | Cars & Coffee | 2025-08-16 | Brookline, MA |
| 4aac0459... | Cars & Coffee Boston | Cars & Coffee | 2025-05-17 | Brookline, MA |
| d69ec5fe... | Larz Anderson Auto Museum - British Car Day | Car Show | 2025-07-20 | Brookline, MA |
| 60ec2c4a... | Larz Anderson Auto Museum - German Car Day | Car Show | 2025-06-15 | Brookline, MA |
| d1b861e5... | Larz Anderson Auto Museum - Italian Car Day | Car Show | 2025-05-18 | Brookline, MA |

**URL:** `https://carsandcoffeela.com`
| Event ID | Name | Category | Date | Location |
|----------|------|----------|------|----------|
| 69cf6022... | Cars & Coffee Los Angeles | Cars & Coffee | 2025-05-25 | Los Angeles, CA |
| 0e21eb05... | Cars & Coffee Los Angeles | Cars & Coffee | 2025-01-26 | Los Angeles, CA |
| 4ba63ffe... | Cars & Coffee Los Angeles | Cars & Coffee | 2025-02-23 | Los Angeles, CA |
| d584bb6f... | Cars & Coffee Los Angeles | Cars & Coffee | 2025-03-30 | Los Angeles, CA |
| 3fb76bc0... | Cars & Coffee Los Angeles | Cars & Coffee | 2025-04-27 | Los Angeles, CA |
| b090f876... | Cars & Coffee Los Angeles | Cars & Coffee | 2025-06-29 | Los Angeles, CA |
| b2d11622... | Cars & Coffee Los Angeles | Cars & Coffee | 2025-07-27 | Los Angeles, CA |
| c460aa6c... | Cars & Coffee Los Angeles | Cars & Coffee | 2025-08-31 | Los Angeles, CA |
| e1a7cc1b... | Cars & Coffee Los Angeles | Cars & Coffee | 2025-09-28 | Los Angeles, CA |
| da0f5c83... | Cars & Coffee Los Angeles | Cars & Coffee | 2025-10-26 | Los Angeles, CA |
| f9bdf844... | Cars & Coffee Los Angeles | Cars & Coffee | 2025-11-30 | Los Angeles, CA |
| 7c5fecf4... | Mulholland Morning Drive | Cruise / Drive | 2025-06-14 | Los Angeles, CA |

**URL:** `https://pca-chicago.org/event-directory`
| Event ID | Name | Category | Date | Location |
|----------|------|----------|------|----------|
| e5ab0b3d... | PCA Chicago - Road America Drivers Education | Track Day / HPDE | 2025-05-22 | Elkhart Lake, WI |
| c6c9f2f2... | PCA Chicago Summer Driving Tour to Galena | Cruise / Drive | 2025-07-25 | Galena, IL |

✅ No events share the same name across different categories.

✅ No events at same date+location in different categories.

---

## Potential Miscategorizations (REVIEW)

| Event ID | Name | Current Category | Suggested | Keyword | Severity |
|----------|------|------------------|-----------|---------|----------|
| 69b63b45... | Audi Club Track Day - Summit Point | Club Meetup | track-day | "track day" | MEDIUM |
| 69b63b45... | Audi Club Track Day - Summit Point | Club Meetup | industry | "summit" | MEDIUM |
| 742412ab... | Blue Ridge Parkway Spring Cruise | Cruise / Drive | industry | "pri" | MEDIUM |
| 28d1dee9... | BMW CCA California Tour | Cruise / Drive | club-meetup | "bmw cca" | MEDIUM |
| 1c74c933... | BMW CCA Club Race - Road Atlanta | Track Day / HPDE | club-meetup | "bmw cca" | MEDIUM |
| df9a4d14... | BMW CCA OktoberFAST HPDE - Road America | Track Day / HPDE | club-meetup | "bmw cca" | MEDIUM |
| b1489057... | Cars & Coffee at Charlotte Motor Speedwa | Cars & Coffee | auction | "lot" | HIGH |
| f8aacf6d... | Cars & Coffee at Charlotte Motor Speedwa | Cars & Coffee | auction | "lot" | HIGH |
| b94fea82... | Cars & Coffee at Charlotte Motor Speedwa | Cars & Coffee | auction | "lot" | HIGH |
| 9694843b... | Cars & Coffee at Charlotte Motor Speedwa | Cars & Coffee | auction | "lot" | HIGH |
| b1a61756... | Cars & Coffee at Charlotte Motor Speedwa | Cars & Coffee | auction | "lot" | HIGH |
| 0e04a38d... | Cars & Coffee at Charlotte Motor Speedwa | Cars & Coffee | auction | "lot" | HIGH |
| f33f9041... | Cars & Coffee at Charlotte Motor Speedwa | Cars & Coffee | auction | "lot" | HIGH |
| 9817b6de... | Cars & Coffee at Charlotte Motor Speedwa | Cars & Coffee | auction | "lot" | HIGH |
| 69762c2f... | Cars & Coffee at Charlotte Motor Speedwa | Cars & Coffee | auction | "lot" | HIGH |
| 7f8ccd8f... | Cars & Coffee at Charlotte Motor Speedwa | Cars & Coffee | auction | "lot" | HIGH |
| 8b6098fd... | ECC Cars & Coffee Dream Cruise Kickoff | Cars & Coffee | cruise | "cruise" | MEDIUM |
| c9ee86c1... | Global Time Attack - Buttonwillow Spring | Time Attack | industry | "pri" | MEDIUM |
| ce02876b... | HOT ROD Power Tour 2025 | Car Show | cruise | "tour" | MEDIUM |
| 2010898a... | Lotus Owners Gathering | Club Meetup | auction | "lot" | MEDIUM |
| c5f8c060... | Lotus Track Weekend at VIR | Club Meetup | auction | "lot" | MEDIUM |
| a577a965... | NASA SoCal at Willow Springs | Track Day / HPDE | industry | "pri" | MEDIUM |
| d92ab5a5... | NASA SoCal at Willow Springs | Track Day / HPDE | industry | "pri" | MEDIUM |
| a9173907... | NASA Texas Spring Fling - MSR Houston | Track Day / HPDE | industry | "pri" | MEDIUM |
| 2bc9f6a8... | Parade of Porsches - PCA Parade 2025 | Cruise / Drive | club-meetup | "pca" | MEDIUM |
| 50f982c5... | PBOC - NCM Motorsports Park | Track Day / HPDE | club-meetup | "ncm" | MEDIUM |
| e5ab0b3d... | PCA Chicago - Road America Drivers Educa | Track Day / HPDE | club-meetup | "pca" | MEDIUM |
| e5ab0b3d... | PCA Chicago - Road America Drivers Educa | Track Day / HPDE | cruise | "drive" | MEDIUM |
| c6c9f2f2... | PCA Chicago Summer Driving Tour to Galen | Cruise / Drive | club-meetup | "pca" | MEDIUM |
| eb298f83... | PCA Club Racing Watkins Glen | Track Day / HPDE | club-meetup | "pca" | MEDIUM |
| be220627... | PCA Escape - Pacific Northwest | Cruise / Drive | club-meetup | "pca" | MEDIUM |
| 3801e1be... | PCA Zone 1 Autocross | Autocross | club-meetup | "pca" | MEDIUM |
| c3c640f9... | PCA Zone 2 Autocross | Autocross | club-meetup | "pca" | MEDIUM |
| 024cb886... | PCA Zone 7 Concours | Club Meetup | car-show | "concours" | MEDIUM |
| 1ba50502... | PCA-LA Autocross Championship Series | Autocross | club-meetup | "pca" | MEDIUM |
| 6ab4a938... | RallyCross Nationals | Autocross | cruise | "rally" | MEDIUM |
| ab536d72... | SCCA National Tour Bristol | Autocross | cruise | "tour" | MEDIUM |
| 14163ae7... | SCCA National Tour Texas | Autocross | cruise | "tour" | MEDIUM |
| f8e4972d... | SCCA ProSolo National Tour - Texas | Autocross | cruise | "tour" | MEDIUM |
| 97e40710... | SpeedVentures Willow Springs | Track Day / HPDE | industry | "pri" | MEDIUM |
| 89a97b27... | Super Lap Battle USA | Time Attack | auction | "bat" | MEDIUM |
| c636a602... | Tail of the Dragon Spring Run | Cruise / Drive | industry | "pri" | MEDIUM |
| a6f604ad... | Tire Rack SCCA Chicago National Tour | Autocross | cruise | "tour" | MEDIUM |
| 28be4f2c... | Tire Rack SCCA Crows Landing National To | Autocross | cruise | "tour" | MEDIUM |
| 5466c83b... | Tire Rack SCCA Lincoln National Tour | Autocross | cruise | "tour" | MEDIUM |
| cd658b0a... | Tourqd Houston Cars and Coffee | Cars & Coffee | cruise | "tour" | MEDIUM |
| b319e8f8... | Tourqd Houston Cars and Coffee | Cars & Coffee | cruise | "tour" | MEDIUM |
| e54a9a38... | TrackMasters - NCM Motorsports Park | Track Day / HPDE | club-meetup | "ncm" | MEDIUM |
| 4c21c7f2... | Woodward Dream Cruise 2025 | Car Show | cruise | "cruise" | MEDIUM |


---

## Within-Category Near-Duplicates (INFO)

ℹ️ **These are events with similar names in the same category - may be recurring events or true duplicates**

### High Confidence (Levenshtein = 1)

**Category:** autocross
| Event ID | Name | Date | Location |
|----------|------|------|----------|
| 3801e1be... | PCA Zone 1 Autocross | 2025-06-14 | Ayer, MA |
| c3c640f9... | PCA Zone 2 Autocross | 2025-05-17 | Hampton, GA |


**Total within-category near-duplicates:** 52
- High confidence: 1
- Medium confidence: 13
- Low confidence: 38


---

## Recommendations

### 🚨 Critical Issues to Fix

1. Review and fix the 4 events sharing URLs across categories
2. Review the 0 events with identical names in different categories
### ⚠️ Review Recommended

1. Check 10 high-severity miscategorizations
2. Consider reviewing 39 medium-severity miscategorizations

---

_End of MECE Audit Report_
