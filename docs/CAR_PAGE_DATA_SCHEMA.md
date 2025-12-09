# Car Detail Page - Curated Experience Data Schema

> **Purpose**: This document defines all data fields needed for the new curated car detail pages. Each car in the database should be populated with these fields to provide a rich, educational experience.

---

## Overview: The New Car Page Structure

The redesigned car detail page moves away from "stats presentation" toward **storytelling and education**. Each section tells part of the car's story:

| Section | Purpose | Primary Emotion |
|---------|---------|-----------------|
| **The Identity** | Who is this car? | Recognition |
| **The Story** | Why does it exist? | Connection |
| **The Driving Experience** | What does it feel like? | Desire |
| **Strengths & Tradeoffs** | The honest truth | Trust |
| **Buyer's Guide** | How to buy smart | Confidence |
| **Ownership Reality** | What it really costs | Preparedness |
| **Track & Performance** | For the enthusiast | Excitement |
| **Alternatives** | Cross-shopping help | Informed decision |
| **Community & Culture** | The ownership experience | Belonging |
| **The Numbers** | Technical reference | Validation |
| **Modification Potential** | For builders | Aspiration |
| **Media & Reviews** | Expert opinions | Confirmation |

---

## Data Fields by Section

### Section 1: The Identity (Hero)

These fields support the enhanced hero section.

```javascript
// EXISTING FIELDS (keep)
name: "718 Cayman GT4",           // Display name
slug: "718-cayman-gt4",           // URL slug
years: "2020-2024",               // Production years
tier: "premium",                  // premium | upper-mid | mid | budget
category: "Mid-Engine",           // Mid-Engine | Front-Engine | Rear-Engine
brand: "Porsche",                 // Manufacturer
imageHeroUrl: "url",              // Main hero image

// EXISTING FIELDS (enhance)
tagline: "Track-ready mid-engine scalpel",  // One-liner (keep, but make more evocative)
highlight: "Best track weapon",              // Badge highlight (keep)

// NEW FIELDS
essence: "The last of the naturally aspirated, mid-engine Porsche scalpels—a future classic built for those who prioritize feedback over comfort.",
// ^ 1-2 sentences that capture the soul of the car

generationCode: "982",           // Chassis/platform code
modelLineage: "718 Cayman",      // Parent model line
```

---

### Section 2: The Story

Rich narrative content about the car's history and significance.

```javascript
// NEW FIELDS
heritage: `The GT4 represents Porsche's answer to enthusiasts demanding a naturally aspirated, driver-focused sports car in an era of forced induction. 

Borrowing its 4.0L flat-six from the 911 GT3, it delivers motorsport DNA in a mid-engine package. The 718 generation marked Porsche's return to the flat-six in this chassis after a controversial turbo-four experiment—the GT4 became the halo car that justified the entire 718 line.

First introduced in 2015 on the 981 platform, the second-generation GT4 (2020+) received the larger, more powerful 4.0L engine with 414 hp, cementing its status as one of the most engaging driver's cars of the modern era.`,

designPhilosophy: `Porsche's Motorsport division designed the GT4 with one goal: create the most engaging driving experience possible within the Cayman platform. 

Unlike the base Cayman, which balances comfort and performance, the GT4 sacrifices daily comfort for razor-sharp handling. The suspension is borrowed from the 911 GT3, the brakes are massive steel rotors, and every calibration prioritizes driver feedback over isolation.`,

motorsportHistory: `While not directly raced in factory form, the GT4 shares DNA with the successful Cayman GT4 Clubsport race car. The Clubsport version has competed in SRO GT4 series worldwide, proving the platform's capability at the highest amateur racing level.`,
// ^ Set to null if no motorsport history

culturalImpact: `The GT4 has become a symbol of Porsche's commitment to the driving enthusiast in an era of SUVs and hybrids. It regularly tops "best driver's car" lists and is frequently cited as a future collectible.`,
// ^ Movies, famous owners, cultural moments. null if not applicable

notableAccomplishments: [
  "Motor Trend Best Driver's Car finalist 2020",
  "Car and Driver 10Best 2021",
  "Nürburgring lap time: 7:28.2 (factory claim)"
],
// ^ Records, awards, achievements

predecessors: ["981 Cayman GT4 (2015-2016)"],
successors: ["982 Cayman GT4 RS (2022+)"],
// ^ Earlier and later models in the lineage
```

---

### Section 3: The Driving Experience

Paragraph-form descriptions of what the car feels like to drive.

```javascript
// NEW FIELDS
engineCharacter: `The 4.0L flat-six rewards RPMs like few modern engines can. Below 4,000 RPM it's civilized and tractable; above 5,000, it transforms into a wailing instrument that begs for redline.

Peak power arrives at 8,000 RPM—an eternity beyond most turbocharged competitors—and the linear power delivery means you're always in control. There's no boost threshold, no waiting for turbos to spool. Just pure, mechanical response.

The intake howl is addictive. Every downshift through a tunnel becomes an event.`,

transmissionFeel: `The six-speed manual has one of the best shift actions in any modern car—short throws, mechanical precision, perfect weighting. You'll find yourself shifting just for the tactile satisfaction.

Rev-matching is standard but can be disabled for those who prefer heel-toe. The clutch is heavier than a base Cayman but perfectly weighted for spirited driving. The PDK option is lightning-fast but most enthusiasts agree the manual is the soul of this car.`,

chassisDynamics: `The GT4's chassis is its party piece. Turn-in is immediate, rotation is adjustable, and the mid-engine balance means you can play with oversteer and understeer at will.

The rear-biased weight distribution (46/54) makes the car eager to rotate, but never snappy or unpredictable. Push hard through a corner and the rear will gently step out, telegraphing its limits clearly. It's a car that rewards aggression while remaining approachable.

Body roll is minimal but the ride isn't punishing—it walks the line between track weapon and weekend canyon carver beautifully.`,

steeringFeel: `Electric power steering done right. The GT4's rack is quicker than standard Caymans and offers genuine feedback—you feel the road surface, the tire loading, and the exact moment of breakaway.

At parking speeds it's light enough. At speed, it weights up naturally. It's not quite hydraulic-era feel, but it's closer than most modern cars dare to get.`,

brakeConfidence: `The stock brakes are track-capable for most drivers. 380mm front rotors with six-piston calipers provide strong initial bite and excellent modulation.

After 20-30 minutes of hard track use, fade becomes noticeable with stock pads. For serious track days, upgraded pads are the first modification most owners make. The brake pedal feel is firm and progressive—you always know exactly how much stopping power you're commanding.`,

soundSignature: `The flat-six has a distinctive bark that sets it apart from inline-sixes and V8s. It's mechanical, not synthesized—no fake engine notes here.

At idle, a purposeful burble. At mid-RPM, a rising howl. At redline, a full-throated scream that Porsche enthusiasts will recognize instantly. The exhaust has a rasp to it that sounds expensive and angry.

With the windows down in a tunnel, it's genuinely addictive.`,

comfortTrackBalance: "track-focused",
// ^ "daily" | "weekend" | "track-focused" | "race"

comfortNotes: `This is not a comfortable daily driver. The suspension is firm, road noise is present, and the fixed-back buckets (optional but common) aren't designed for long commutes.

That said, it's not punishing either. For weekend use and spirited driving, the tradeoffs are worth it. Just don't expect to arrive at work without some fatigue on rough roads.`
```

---

### Section 4: Strengths & Tradeoffs

Honest assessment structured as insights, not just bullet points.

```javascript
// EXISTING FIELDS (enhance)
pros: [
  "NA flat-6 sounds incredible",
  "Race-bred chassis", 
  "Manual transmission available",
  "Strong resale"
],
cons: [
  "Firm ride on street",
  "Premium pricing",
  "Limited cargo space"
],
bestFor: ["Track days", "Canyon carving", "Collector"],

// NEW FIELDS
definingStrengths: [
  {
    title: "The Last Great NA Engine",
    description: "In an era of turbocharging, the GT4's 4.0L flat-six is a rare gem. Linear power, incredible sound, and 8,000 RPM redline make every drive an event."
  },
  {
    title: "Perfect Chassis Balance", 
    description: "Mid-engine layout + GT3-derived suspension = one of the most communicative, adjustable chassis in any price range."
  },
  {
    title: "Manual Gearbox Excellence",
    description: "The six-speed manual is among the best in the industry. For those who value engagement over speed, it's the obvious choice."
  },
  {
    title: "Track-Capable Stock",
    description: "Unlike many sports cars that need upgrades for track use, the GT4 can run 20+ minute sessions without drama."
  },
  {
    title: "Future Classic Status",
    description: "Values are already appreciating. As NA engines disappear, cars like the GT4 will only become more desirable."
  }
],

honestWeaknesses: [
  {
    title: "Not a Daily Driver",
    description: "The stiff suspension, road noise, and limited cargo make it impractical for everyday commuting. It's a second car for most owners."
  },
  {
    title: "Premium Pricing",
    description: "At $85-100K, it's expensive for a four-cylinder (by displacement) car. You're paying for engineering, not just specs."
  },
  {
    title: "Limited Practicality",
    description: "Two seats, small frunk, and no rear cargo area. Plan ahead for any trip longer than a weekend."
  }
],

idealOwner: "Someone who prioritizes driving engagement over practicality. Owners who appreciate naturally aspirated engines, manual transmissions, and cars that communicate their limits clearly. Track day enthusiasts who want a street-legal weapon.",

notIdealFor: "Daily commuters, families, or anyone who needs cargo space. Also not for those who want the latest tech features—the infotainment is functional but dated. If comfort is a priority, look elsewhere."
```

---

### Section 5: Buyer's Guide

Comprehensive purchasing guidance.

```javascript
// EXISTING FIELDS (keep/enhance)
yearsToAvoid: null,  // or array of problem years
recommendedYearsNote: "All 718 GT4 years are solid. 2021+ got minor suspension tweaks.",

// NEW FIELDS
buyersSummary: "Any 718 GT4 is a good buy. Focus on condition and maintenance history rather than specific years. Manual transmission cars hold value better than PDK. Look for cars with the Clubsport package for enhanced track capability.",

bestYears: [
  {
    years: "2021-2024",
    reason: "Refined suspension tuning, improved infotainment, all kinks worked out"
  },
  {
    years: "2020",
    reason: "First year of 4.0L engine, slightly softer prices, essentially identical mechanically"
  }
],

yearsToAvoidDetailed: null,
// ^ If yearsToAvoid is set, explain why:
// yearsToAvoidDetailed: [
//   { years: "XXXX", reason: "Known issue with..." }
// ]

mustHaveOptions: [
  {
    name: "Sport Chrono Package",
    code: "XYZ",
    reason: "Adds launch control, dynamic engine mounts, and PDK Sport Plus mode (if equipped)"
  },
  {
    name: "PASM (Adaptive Dampers)",
    code: "ABC",
    reason: "Allows switching between Normal and Sport settings, improving daily usability"
  }
],

niceToHaveOptions: [
  {
    name: "Clubsport Package",
    reason: "Adds roll bar, fire extinguisher, six-point harness anchors. Essential for track use."
  },
  {
    name: "Full Bucket Seats",
    reason: "Better support for track driving but less comfortable for daily use"
  },
  {
    name: "Ceramic Composite Brakes (PCCB)",
    reason: "Better fade resistance but extremely expensive to replace ($15K+)"
  }
],

avoidTheseOptions: [
  {
    name: "R-Tronic (on older models)",
    reason: "Single-clutch automated manual is jerky and unreliable. Avoid."
  }
],
// ^ Options that hurt value or have known issues

preInspectionChecklist: [
  "Check clutch wear percentage (via PIWIS scan)",
  "Inspect rear main seal for leaks",
  "Verify suspension corner balance (common issue with used track cars)",
  "Check brake rotor thickness and pad life",
  "Look for track damage: curbed wheels, stone chips on leading edges",
  "Verify maintenance was done at Porsche dealer or reputable indie",
  "Check for software updates (several TSBs addressed minor issues)",
  "Inspect for aftermarket modifications that void warranty"
],

ppiRecommendations: "Insist on a Porsche specialist PPI. Generic mechanics may miss Porsche-specific issues. Budget $300-500 for a comprehensive inspection including computer scan.",

marketPosition: "appreciating",
// ^ "appreciating" | "stable" | "depreciating"

marketCommentary: "GT4 values have been remarkably stable despite economic uncertainty. Manual transmission cars command a 5-10% premium over PDK. Low-mile examples (<10K miles) are approaching original MSRP. Expect continued appreciation as NA sports cars become rarer.",

typicalNegotiationPoints: [
  "Service history gaps",
  "Track use evidence",
  "Non-factory modifications",
  "Out-of-warranty status",
  "Higher mileage (>30K)"
],

priceGuide: {
  low: {
    price: "$85,000",
    condition: "Higher mileage (30K+), PDK, base spec, minor wear"
  },
  mid: {
    price: "$92,000",
    condition: "15-25K miles, manual, well-optioned, good history"
  },
  high: {
    price: "$100,000+",
    condition: "Under 10K miles, manual, fully loaded, collector quality"
  }
}
```

---

### Section 6: Ownership Reality

True cost of ownership information.

```javascript
// EXISTING FIELDS (keep/enhance)
maintenanceCostIndex: 4,      // 1-5 scale
insuranceCostIndex: 5,        // 1-5 scale  
fuelEconomyCombined: 20,      // MPG
commonIssues: ["IMS bearing on older models (not 718)", "Clutch wear on track use", "Infotainment quirks"],
ownershipCostNotes: "Porsche parts are expensive but the flat-6 is robust. Budget for track brake pads.",

// NEW FIELDS
annualOwnershipCost: {
  low: "$2,500",
  typical: "$4,000",
  heavy: "$8,000+",
  notes: "Low assumes minimal driving, typical assumes 5-8K miles/year with one service, heavy includes track use and consumables"
},

majorServiceCosts: {
  oilChange: {
    interval: "10,000 miles / 1 year",
    cost: "$350-500",
    notes: "Use Porsche-approved oil only"
  },
  majorService: {
    interval: "40,000 miles / 4 years",
    cost: "$1,500-2,500",
    notes: "Includes spark plugs, filters, brake fluid flush"
  },
  clutch: {
    typicalLife: "40,000-80,000 miles (varies with track use)",
    cost: "$3,500-5,000",
    notes: "Track use significantly reduces clutch life"
  },
  brakes: {
    typicalLife: "25,000-40,000 miles",
    cost: "$2,000-3,500 per axle",
    notes: "OEM rotors are expensive; consider aftermarket for track use"
  },
  tires: {
    typicalLife: "15,000-25,000 miles",
    cost: "$1,200-1,800 for set",
    notes: "Stock Pilot Sport 4S. Track use accelerates wear significantly."
  }
},

commonIssuesDetailed: [
  {
    issue: "Clutch Wear from Track Use",
    severity: "moderate",
    frequency: "common",
    cost: "$3,500-5,000",
    notes: "Hard track launches kill clutches. Many owners baby the clutch at the track."
  },
  {
    issue: "Rear Main Seal Leak",
    severity: "minor",
    frequency: "uncommon",
    cost: "$1,500-2,500",
    notes: "Not a widespread issue but known to occur. Check during PPI."
  },
  {
    issue: "Infotainment Glitches",
    severity: "minor",
    frequency: "common",
    cost: "Usually free (software update)",
    notes: "Bluetooth dropouts, Apple CarPlay hiccups. Software updates typically resolve."
  }
],

partsAvailability: "excellent",
// ^ "excellent" | "good" | "moderate" | "difficult"

partsNotes: "Porsche parts are readily available but expensive. Aftermarket options exist for wear items (brakes, suspension, exhaust). Engine internals are typically OEM-only.",

dealerVsIndependent: "indie-friendly",
// ^ "dealer-only" | "indie-friendly" | "either"

dealerNotes: "Many excellent independent Porsche specialists exist. For warranty work, dealer is required. For post-warranty service, a quality indie can save 30-40% on labor.",

diyFriendliness: 4,
// ^ 1-10 scale (10 = very DIY friendly)

diyNotes: "Oil changes are straightforward. Brake work is manageable for experienced DIYers. Engine and transmission work requires specialist tools and knowledge. PIWIS scanner helpful for diagnostics.",

warrantyInfo: {
  factory: "4 years / 50,000 miles",
  cpo: "2 additional years, unlimited miles",
  notes: "CPO cars command a premium but provide peace of mind. Many owners opt for third-party warranties for extended coverage."
},

insuranceNotes: "Insurance is expensive due to the car's value and performance capability. Expect $2,000-4,000/year depending on history and location. Track day coverage requires separate policy."
```

---

### Section 7: Track & Performance

For enthusiast-focused content.

```javascript
// NEW FIELDS
trackReadiness: "track-ready",
// ^ "needs-prep" | "weekend-warrior" | "track-ready" | "race-bred"

trackReadinessNotes: "The GT4 is one of the most track-capable street cars available. Stock brakes last 20-30 minutes of hard use before fade. Cooling is adequate for most track days. For frequent track use, brake pad and fluid upgrades are recommended.",

coolingCapacity: {
  rating: 8,
  notes: "Adequate cooling for 95% of track day situations. Extended sessions in hot weather may trigger thermal management. Optional front radiators help."
},

brakeFadeResistance: {
  rating: 7,
  stockPadLife: "3-5 track days",
  notes: "Stock pads are street-focused. Serious track use demands upgraded pads (Pagid, Ferodo, PFC)."
},

recommendedTrackPrep: [
  {
    item: "Brake Pads",
    priority: "essential",
    cost: "$400-800",
    notes: "Upgrade to track compound (Pagid RSL29, Ferodo DS2500)"
  },
  {
    item: "Brake Fluid",
    priority: "essential",
    cost: "$50-100",
    notes: "Use DOT 4 racing fluid (Motul RBF 660, Castrol SRF)"
  },
  {
    item: "Alignment",
    priority: "recommended",
    cost: "$200-400",
    notes: "More aggressive camber (-2.5 to -3.0 front) improves turn-in"
  },
  {
    item: "Fresh Tires",
    priority: "recommended",
    cost: "$1,200-1,800",
    notes: "Heat cycles matter. Fresh rubber makes a significant difference."
  }
],

popularTrackMods: [
  {
    mod: "Adjustable Rear Wing",
    purpose: "Tunable downforce",
    cost: "$2,000-5,000"
  },
  {
    mod: "Roll Bar",
    purpose: "Safety for HPDE/time attack",
    cost: "$1,500-3,000"
  },
  {
    mod: "Coilovers",
    purpose: "Corner balancing, ride height adjustment",
    cost: "$3,500-7,000"
  }
],

laptimeBenchmarks: [
  {
    track: "Nürburgring Nordschleife",
    time: "7:28.2",
    source: "Porsche factory",
    notes: "With optional Michelin Pilot Sport Cup 2 tires"
  },
  {
    track: "Laguna Seca",
    time: "1:33.xx",
    source: "Various magazine tests",
    notes: "Stock configuration"
  }
]
```

---

### Section 8: Alternatives to Consider

Help buyers cross-shop effectively.

```javascript
// NEW FIELDS
directCompetitors: [
  {
    slug: "lotus-emira",
    name: "Lotus Emira",
    comparison: "More exotic, similar price. Less refined but more raw. New car warranty advantage."
  },
  {
    slug: "alpine-a110",
    name: "Alpine A110",
    comparison: "Lighter, more nimble. Less power but arguably more engaging at legal speeds. Turbo-four vs NA-six."
  },
  {
    slug: "bmw-m2",
    name: "BMW M2 Competition",
    comparison: "Front-engine, RWD. More practical (4 seats). Similar power, different character. Better daily driver."
  }
],

ifYouWantMore: [
  {
    slug: "718-cayman-gt4-rs",
    name: "718 Cayman GT4 RS",
    reason: "500hp, GT3-derived PDK, full race car for the street. +$50K over GT4."
  },
  {
    slug: "911-gt3-992",
    name: "911 GT3 (992)",
    reason: "More power, more presence, better rear-engine handling for some. Significant price increase."
  }
],

ifYouWantLess: [
  {
    slug: "718-cayman-s",
    name: "718 Cayman S",
    reason: "Turbo-four, less intense. Better daily driver. 40% less expensive."
  },
  {
    slug: "toyota-gr86",
    name: "Toyota GR86",
    reason: "Back-to-basics sports car. Much cheaper but similar philosophy of engagement over speed."
  }
],

similarDrivingExperience: [
  {
    slug: "lotus-elise-s2",
    name: "Lotus Elise S2",
    reason: "Different execution, same philosophy: lightweight, communicative, driver-focused. Much cheaper, less polished."
  }
]
```

---

### Section 9: Community & Culture

The ownership ecosystem.

```javascript
// NEW FIELDS  
communityStrength: 9,
// ^ 1-10 scale

communityNotes: "The Porsche community is one of the strongest in the automotive world. Dedicated GT4 forums, Facebook groups, and regional PCA chapters provide support, advice, and camaraderie.",

keyResources: [
  {
    name: "Rennlist",
    type: "forum",
    url: "https://rennlist.com/forums/718-forum/",
    notes: "Primary enthusiast forum for 718 Cayman owners"
  },
  {
    name: "Planet-9",
    type: "forum",
    url: "https://planet-9.com/",
    notes: "Another popular Cayman/Boxster community"
  },
  {
    name: "PCA (Porsche Club of America)",
    type: "club",
    url: "https://pca.org/",
    notes: "Track days, tours, social events. Essential for any Porsche owner."
  }
],

facebookGroups: [
  "718 Cayman & Boxster Owners",
  "Porsche GT4 Owners Club",
  "PCA Track Junkies"
],

annualEvents: [
  {
    name: "Rennsport Reunion",
    frequency: "Every 4 years",
    location: "Laguna Seca, CA",
    notes: "Massive Porsche gathering with racing, displays, and community"
  },
  {
    name: "PCA Parade",
    frequency: "Annual",
    location: "Varies",
    notes: "Week-long event with concours, rallies, and driving tours"
  }
],

aftermarketSceneNotes: "Strong aftermarket support from specialists like SharkWerks, GMG Racing, TechArt, and others. Exhaust, suspension, and wheel options are plentiful. Engine tuning is limited due to NA configuration.",

resaleReputation: "Excellent. GT4s are seen as future collectibles and hold value exceptionally well. Low-depreciation makes them relatively affordable to own long-term."
```

---

### Section 10: The Numbers (Technical Reference)

Existing specs moved to a dedicated reference section.

```javascript
// EXISTING FIELDS (keep all technical specs)
engine: "4.0L NA Flat-6",
hp: 414,
torque: 309,
trans: "6MT/7PDK",
drivetrain: "RWD",
curbWeight: 3227,
zeroToSixty: 4.2,
quarterMile: 12.5,
braking60To0: 97,
lateralG: 1.12,
priceRange: "$85-100K",
priceAvg: 92500,

// EXISTING scoring fields
sound: 9.4,
interior: 8.4,
track: 9.8,
reliability: 9.3,
value: 6.1,
driverFun: 9.9,
aftermarket: 7,

// EXISTING performance HUB scores
perfPowerAccel: 8,
perfGripCornering: 9,
perfBraking: 9,
perfTrackPace: 10,
perfDrivability: 5,
perfReliabilityHeat: 8,
perfSoundEmotion: 9,
```

---

### Section 11: Media & Reviews

Expert opinions and resources.

```javascript
// NEW FIELDS
notableReviews: [
  {
    source: "Car and Driver",
    title: "2020 Porsche 718 Cayman GT4",
    quote: "A sports car this good shouldn't exist in 2020.",
    url: "https://...",
    rating: "10/10"
  },
  {
    source: "Motor Trend",
    title: "Porsche 718 Cayman GT4 First Test",
    quote: "The GT4 is proof that Porsche still knows how to build a driver's car.",
    url: "https://...",
    rating: null
  }
],

mustWatchVideos: [
  {
    title: "718 Cayman GT4 - The Best Porsche?",
    channel: "Carfection",
    url: "https://youtube.com/...",
    duration: "15:32"
  },
  {
    title: "GT4 Track Review",
    channel: "Randy Pobst",
    url: "https://youtube.com/...",
    duration: "12:45"
  }
],

expertQuotes: [
  {
    person: "Chris Harris",
    outlet: "Top Gear",
    quote: "If I could only have one Porsche, it would be this."
  }
]
```

---

## Implementation Priority

### Phase 1: Core Experience (High Priority)
1. `essence` - The one-liner soul
2. `heritage` - The story
3. `engineCharacter` - What it feels like
4. `chassisDynamics` - How it handles
5. `buyersSummary` - Quick buying advice
6. `definingStrengths` / `honestWeaknesses` - Enhanced pros/cons

### Phase 2: Buyer Confidence (Medium Priority)
7. `bestYears` - Detailed year recommendations
8. `preInspectionChecklist` - What to check
9. `majorServiceCosts` - Real ownership costs
10. `commonIssuesDetailed` - Known problems with context

### Phase 3: Enthusiast Depth (Lower Priority)
11. `directCompetitors` - Cross-shopping
12. `trackReadinessNotes` - Track capability
13. `communityStrength` - Community info
14. `notableReviews` - Media coverage

---

## Data Collection Template

For each car, use this template to gather information:

```markdown
## [Car Name]

### Quick Facts
- Production Years:
- Generation/Chassis Code:
- Engine:
- Transmission Options:

### The Story (2-3 paragraphs)
Why does this car exist? What was the manufacturer trying to achieve?

### Engine Character (1-2 paragraphs)
What does the engine feel like? Where does it shine?

### Chassis Dynamics (1-2 paragraphs)
How does it handle? What's the balance like?

### Top 3 Defining Strengths
1.
2.
3.

### Top 3 Honest Weaknesses
1.
2.
3.

### Buyer's Guide Summary (2-3 sentences)
Quick advice for prospective buyers.

### Best Years to Buy
-

### Years to Avoid (if any)
-

### Must-Have Options
-

### Major Service Costs
- Oil change:
- Major service:
- Clutch (if manual):
- Brakes:

### Common Issues
-

### Direct Competitors
-

### Community Resources
- Primary forum:
- Facebook groups:
```

---

## Next Steps

1. **Review and approve this schema** - Ensure it captures what we want
2. **Create data collection workflow** - How we'll gather this info for 98 cars
3. **Design the new page layout** - Build the UI for these sections
4. **Populate data incrementally** - Start with highest-traffic cars
5. **Launch progressively** - Show new sections as data becomes available

---

*Document created: December 8, 2024*
*Version: 1.0*






