# The Complete Guide to Subaru WRX & STI Modifications

## Platform Overview

The Subaru WRX and WRX STI represent two distinct modification paths united by the iconic symmetrical AWD platform. The VA chassis (2015-2021) marked a pivotal split: the WRX adopted the modern FA20DIT engine while the STI retained the legendary EJ257. The VB chassis (2022+) brought the FA24DIT to the WRX, while the STI was discontinued—making the 2015-2021 STI the final EJ-powered performance Subaru.

### Why Enthusiasts Modify These Cars
- **COBB Tuning's founding platform** - The Accessport was literally invented for Subarus
- **Symmetrical AWD** - Unmatched all-weather performance potential
- **Massive aftermarket** - Decades of development across both engine families
- **Rally heritage** - Built for abuse, responds incredibly well to modifications
- **Community depth** - NASIOC, ClubWRX, and IWSTI forums with decades of data

---

## Stock Specifications

### FA20DIT (2015-2021 WRX)
| Specification | Value |
|---------------|-------|
| Displacement | 1,998cc (2.0L) |
| Configuration | Flat-4, DOHC, 16-valve |
| Compression Ratio | 10.6:1 |
| Horsepower | 268 HP @ 5,600 RPM |
| Torque | 258 lb-ft @ 2,000-5,200 RPM |
| Fuel System | Direct Injection (DI) |
| Turbocharger | Mitsubishi TD04-19T (twin-scroll) |
| Redline | 6,500 RPM |
| Transmission | 6-speed manual / CVT |
| Stock Boost | ~16 PSI peak |

**Stock Dyno Baseline:** 220-235 whp / 240-260 wtq

### FA24DIT (2022+ WRX - VB Chassis)
| Specification | Value |
|---------------|-------|
| Displacement | 2,387cc (2.4L) |
| Configuration | Flat-4, DOHC, 16-valve |
| Compression Ratio | 10.6:1 |
| Horsepower | 271 HP @ 5,600 RPM |
| Torque | 258 lb-ft @ 2,000-5,200 RPM |
| Fuel System | Direct Injection (DI) |
| Turbocharger | Mitsubishi TD04-20T |
| Transmission | 6-speed manual / CVT (Subaru Performance Transmission) |

**Note:** FA24 tuning is still maturing; early reports show 350-400 whp with basic modifications.

### EJ257 (2015-2021 WRX STI)
| Specification | 2015-2018 | 2019-2021 |
|---------------|-----------|-----------|
| Displacement | 2,457cc (2.5L) | 2,457cc (2.5L) |
| Compression Ratio | 8.2:1 | 8.2:1 |
| Horsepower | 305 HP @ 6,000 RPM | 310 HP @ 6,000 RPM |
| Torque | 290 lb-ft @ 4,000 RPM | 290 lb-ft @ 4,000 RPM |
| Fuel System | Port Injection | Port Injection |
| Turbocharger | IHI VF48 (single-scroll) | IHI VF48 (single-scroll) |
| Redline | 7,000 RPM | 7,000 RPM |
| Transmission | 6-speed manual (TY85) | 6-speed manual (TY85) |

**Stock Dyno Baseline:** 260-275 whp / 260-280 wtq

### Special Editions
| Model | Year | Power | Notable Features |
|-------|------|-------|------------------|
| Type RA | 2018 | 310 HP | Carbon roof, BBS wheels, Bilstein dampers |
| S209 | 2019 | 341 HP / 330 lb-ft | Modified EJ257, HKS turbo, 209 units built, $64,000 MSRP |

---

## Critical Failure Points & Known Issues

### EJ257 (STI) - The Infamous Weak Points

#### 1. Ringland Failure
**The Issue:** The ringland (piston area supporting compression rings) cracks under detonation/knock, causing catastrophic engine failure.

**Root Causes:**
- Cast hypereutectic pistons are brittle under detonation
- Tight factory ring gaps cause binding under heat
- Lean factory tune under high-load conditions
- Running WOT before engine is fully heat-soaked

**Prevention:**
- **Always tune** - Even Stage 1 COBB tune improves fueling
- Warm engine fully (oil temp, not just coolant) before spirited driving
- Use 93 octane minimum; E85 preferred for high boost
- Install an Air/Oil Separator (AOS) - Crawford, IAG, Perrin
- Downshift to 3,500+ RPM before going WOT

**When It Fails:** 40,000-80,000 miles typical on modified cars without proper tuning

#### 2. Rod Bearing Failure
**The Issue:** Bearings spin due to oil starvation, especially during hard cornering.

**Root Causes:**
- Low oil level (Subaru boxers consume oil by design)
- Oil sloshing during high-G cornering
- Factory oil pickup tube brazing failures (rare but documented)
- Class action lawsuit covered 2012-2017 WRX/STI

**Prevention:**
- Check oil level every 500 miles (not a joke)
- Use quality oil: Motul 8100 X-cess 5W-40, Rotella T6 5W-40
- Install oil pan baffle (Killer B, Cusco, Crawford)
- Upgrade oil pickup (Killer B, IAG)
- Short oil change intervals: 3,000-4,000 miles

#### 3. Turbo Failure (VF48)
**Symptoms:** Shaft play, boost leaks, oil consumption through turbo seals

**Typical Lifespan:** 80,000-120,000 miles stock; less when running high boost

### FA20DIT (WRX) - Modern but Not Perfect

#### 1. Carbon Buildup
**The Issue:** Direct injection means no fuel washing intake valves; carbon deposits accumulate.

**Symptoms:** Rough idle, misfires, reduced power after 40,000+ miles

**Prevention/Fix:**
- Install catch can (Mishimoto, IAG)
- Walnut blast every 50,000-60,000 miles (~$400-600)
- Rev match downshifts help burn off deposits

#### 2. Rev Hang (2015-2019)
**The Issue:** Throttle stays open after lifting; annoying for heel-toe shifting

**Fix:** COBB Accessport tune eliminates this completely

#### 3. Connecting Rod Limits
**Stock Rod Limit:** ~350 wtq on stock rods safely
**Note:** FA20DIT is easier to tune to 350 whp than EJ but requires built engine for 500+ whp

### Transmission Concerns

#### 6-Speed Manual (Both Platforms)
- **WRX transmission:** Adequate for Stage 2, questionable beyond 350 wtq
- **STI transmission (TY85):** Stronger synchros, handles 400+ wtq reliably
- **Common issue:** 2nd/3rd gear synchro wear on WRX with aggressive driving

---

## ECU Tuning Platforms

### COBB Tuning - Industry Standard
**Hardware:** Accessport V3 ($650-725)

| Stage | WRX (FA20DIT) | STI (EJ257) | Requirements |
|-------|---------------|-------------|--------------|
| Stage 1 | +33 HP / +43 lb-ft | +20 HP / +35 lb-ft | Accessport only |
| Stage 1+ | +10% HP/TQ | +21% HP/TQ (2019+) | + Intake |
| Stage 2 | +30% HP/TQ | +26% HP/TQ | + Downpipe |
| Stage 2+ | +35% HP/TQ | +30% HP/TQ | + Intake + Downpipe |

**Verified WRX Dyno Results (COBB):**
- Stage 2 + FMIC: 313 whp / 344 wtq (93 octane)
- Pro-tuned: 280-320 whp typical

**Verified STI Dyno Results:**
- Stage 1+ Pro-tune: 282 whp / 307 wtq (92 octane) 
- Stage 2 with bolt-ons: 300-320 whp typical

**Features:**
- OTS (off-the-shelf) maps for immediate power
- Real-time monitoring and data logging
- Flat-foot shifting (manual)
- Launch control
- Customizable gauges

### EcuTek
**Best For:** Custom tuning, E85, high-power builds
**Cost:** ~$600 tuning kit + $400-700 pro-tune
**Advantage:** Deeper ECU access than COBB for extreme builds

### Open Source (RomRaider)
**Best For:** Budget tuners with technical knowledge
**Cost:** Free software + $100-200 tactrix cable
**Risk:** Requires significant learning curve; not recommended for beginners

### Tuner Recommendations

| Tuner | Specialty | Method | Cost |
|-------|-----------|--------|------|
| **TORQUED Performance** | E85, high HP | Remote | $350-500 |
| **Bren Tuning** | Reliability-focused | Remote | $350-450 |
| **Phatbotti Tuning** | Track builds | Remote | $400-600 |
| **Ambot Tuning** | STI specialist | Remote/In-person | $350-500 |

---

## Bolt-On Modifications

### Stage 1: Tune Only
**Investment:** $650-800

| Modification | WRX Gain | STI Gain | Notes |
|--------------|----------|----------|-------|
| Accessport + OTS Map | +30-40 whp | +20-30 whp | Immediate transformation |
| 93 Octane Required | — | — | 91 octane maps available but less power |

### Stage 1+: Intake Addition
**Investment:** $1,000-1,400

**Top Intakes:**

| Brand | Price | Notes |
|-------|-------|-------|
| COBB SF Intake | $350-400 | Designed for COBB OTS maps |
| COBB Big SF | $450-500 | Larger MAF housing, more headroom |
| Grimmspeed | $300-350 | Great value, proven design |
| Mishimoto | $350-400 | Excellent build quality |

**Gains:** +5-15 whp over Stage 1 when tuned

### Stage 2: Full Bolt-On Power
**Investment:** $2,500-4,500

**Required Components:**

#### Downpipe
| Brand | Type | Price | Notes |
|-------|------|-------|-------|
| COBB Catted | GESI cat | $795 | 50-state legal |
| Grimmspeed Catted | 100 cell | $600-700 | Popular choice |
| Invidia Catted | 100 cell | $400-500 | Budget option |
| Catless | — | $300-500 | Loudest, most power, not street legal |

**Catless Warning:** Removes primary catalyst; illegal for street use in most states. Check local laws.

**Gains:** +15-25 whp over Stage 1+ with downpipe

#### Turbo-Back Exhaust
| Brand | Price | Sound Level |
|-------|-------|-------------|
| Invidia N1 | $500-600 | Loud, raspy |
| Invidia Q300 | $600-700 | Deep, moderate |
| Tomei Expreme Ti | $1,000-1,200 | Titanium, light, LOUD |
| COBB SS 3" | $1,100 | Quality, moderate volume |
| Nameless | $800-1,000 | Customizable, muffler delete options |

#### Front-Mount Intercooler (FMIC)
**Critical for heat soak prevention**

| Brand | Price | Notes |
|-------|-------|-------|
| COBB FMIC | $1,200-1,400 | OEM fitment, proven |
| Grimmspeed TMIC (top-mount) | $800-1,000 | Retains stock look |
| ETS FMIC | $800-1,000 | Great value, race-proven |
| Mishimoto FMIC | $900-1,100 | Excellent cooling |
| Process West Verticooler | $800-900 | Top-mount with FMIC efficiency |

**FMIC vs. TMIC:** FMIC wins for high-power/track; TMIC acceptable for Stage 2 street

### Stage 2+ Results (Pro-Tuned)

| Platform | Fuel | Power Range | Torque Range |
|----------|------|-------------|--------------|
| WRX (FA20DIT) | 93 Oct | 290-320 whp | 320-350 wtq |
| WRX (FA20DIT) | E85 | 320-360 whp | 350-400 wtq |
| STI (EJ257) | 93 Oct | 320-350 whp | 340-380 wtq |
| STI (EJ257) | E85 | 360-400 whp | 400-440 wtq |

---

## Forced Induction Upgrades

### Turbo Upgrades - WRX (FA20DIT)

#### Stock Frame Turbo Options
| Turbo | Power Potential | Price | Notes |
|-------|-----------------|-------|-------|
| Blouch Dominator 1.5XT-R | 350-400 whp | $1,200-1,400 | Popular, quick spool |
| Forced Performance Blue | 400+ whp | $1,500-1,800 | Journal bearing |
| Forced Performance Green | 450+ whp | $1,800-2,200 | Ball bearing |
| PTE 5558 | 400-500 whp | $1,000-1,300 | Budget choice |

**Requirements:** Fuel system upgrade (injectors, HPFP), pro-tune

### Turbo Upgrades - STI (EJ257)

#### Stock Frame Turbos
| Turbo | Power Potential | Price | Notes |
|-------|-----------------|-------|-------|
| Blouch Dominator 1.5XT-R | 400 whp | $1,200-1,400 | STI favorite |
| Forced Performance Green | 450+ whp | $1,800-2,200 | Ball bearing, responsive |
| Blouch Dominator 2.0XT-R | 450+ whp | $1,500-1,800 | More top-end |

#### Large Frame (Rotated) Setup
| Turbo | Power Potential | Price | Notes |
|-------|-----------------|-------|-------|
| Garrett GTX3071R | 500-600 whp | $3,500-5,000 kit | Requires rotated intake manifold |
| Garrett GTX3076R | 600-700 whp | $4,000-6,000 kit | Serious power |
| EFR 7670 | 700+ whp | $5,000-8,000 kit | Modern, efficient |

---

## Supporting Modifications by Power Level

### 350 whp (Safe Stock Internals Limit - WRX)
- COBB Accessport + pro-tune
- Cold air intake
- FMIC or upgraded TMIC
- Catback exhaust (catted downpipe for street)
- 3-port boost controller

### 400 whp (STI Stock Internals Limit)
**Add to above:**
- Upgraded fuel injectors (DeatschWerks 1000cc / ID1050x)
- High-pressure fuel pump upgrade (WRX)
- Air/Oil Separator (AOS)
- Upgraded clutch (ACT HD, Exedy Stage 1)

### 500+ whp (Built Engine Territory)
**Requires:**
- Forged pistons (Manley, CP, JE)
- Forged rods (Manley, Brian Crower)
- ARP head studs
- Upgraded valve springs
- Upgraded oil pump
- Built transmission or upgraded synchros
- Full fuel system (injectors, pump, lines)
- Upgraded clutch (ACT 6-puck, Competition)

**Investment:** $8,000-15,000 (engine build) + $3,000-5,000 (turbo system) + supporting mods

---

## Suspension & Handling

### Coilovers
| Brand | Price | Notes |
|-------|-------|-------|
| Fortune Auto 500 | $1,600-1,900 | USA-built, excellent value |
| BC Racing BR | $1,100-1,300 | Budget king, 30-click damping |
| KW V3 | $2,800-3,200 | Premium, dual adjustable |
| Ohlins Road & Track | $3,000-3,500 | Race pedigree |
| STI Group N | $600-800 | Firm, rally-proven (OEM option) |

### Essential Handling Mods
| Modification | Price | Effect |
|--------------|-------|--------|
| Rear sway bar | $200-350 | Reduces understeer |
| Front sway bar | $200-350 | Improves turn-in (carefully balanced) |
| Strut tower brace | $150-250 | Chassis stiffness |
| Pitch stop mount | $100-150 | Reduces engine/trans movement |
| Transmission mount | $150-250 | Improved shift feel |
| Whiteline positive shift kit | $25-50 | Crisper shifts |

### Alignment Specs
**Street:**
- Front: -1.0° to -1.5° camber, 0° toe
- Rear: -1.2° to -1.8° camber, +1/16" toe-in

**Track:**
- Front: -2.5° to -3.5° camber, slight toe-out
- Rear: -1.8° to -2.5° camber, +1/8" toe-in

---

## Brake Systems

### OEM Brake Summary
| Model | Front | Rear |
|-------|-------|------|
| WRX Base | 2-piston, 11.6" | Single-piston, 11.4" |
| STI | Brembo 4-piston, 13.0" | Brembo 2-piston, 12.4" |

### Popular Upgrades

**Big Brake Kits:**
| Brand | Size | Price | Notes |
|-------|------|-------|-------|
| StopTech ST-40 | 13" / 14" | $2,000-2,800 | Popular choice |
| DBA 4000 | Stock size | $300-500 | Slotted rotors, great value |
| AP Racing | 14"+ | $3,500+ | Track focused |

**Brake Pads:**
| Type | Brand/Model | Use Case |
|------|-------------|----------|
| Street | Hawk HPS 5.0 | Daily + spirited |
| Street/Track | Ferodo DS2500 | Dual-purpose |
| Track | Ferodo DS1.11, Hawk DTC-60 | High temp capability |

**Brake Fluid:**
| Type | Boiling Point | Use Case |
|------|---------------|----------|
| Motul RBF 600 | 594°F dry | Track day |
| ATE Super Blue | 536°F dry | Spirited street/light track |

---

## Build Stages & Costs

### Stage 1: Daily Plus
**Investment:** $700-900
**Power:** 290-310 whp (WRX) / 290-300 whp (STI)

- Accessport V3 + OTS tune
- Results: Eliminates rev hang, improves throttle response, adds power throughout

### Stage 2: Street Fighter
**Investment:** $2,500-4,000
**Power:** 300-340 whp (WRX) / 320-360 whp (STI)

- Everything in Stage 1
- Cold air intake
- Downpipe (catted recommended)
- Cat-back exhaust
- Pro-tune

### Stage 3: Track Weapon
**Investment:** $6,000-10,000
**Power:** 350-400 whp (WRX) / 380-450 whp (STI)

- Everything in Stage 2
- FMIC
- Fuel system (injectors, HPFP for WRX)
- Upgraded turbo (stock-frame)
- E85 or flex fuel kit
- Upgraded clutch
- AOS/catch can
- Pro-tune on target fuel

### Stage 4: Built Motor Beast
**Investment:** $20,000-40,000+
**Power:** 500-700+ whp

- Fully built engine (forged internals)
- Large frame turbo or twins
- Full fuel system
- Transmission build or swap
- Standalone ECU or advanced tuning
- Supporting drivetrain upgrades

---

## E85 & Flex Fuel

### Benefits
- **+30-50 whp** over 93 octane at same boost
- Lower combustion temps (safer on stock internals)
- Higher octane (~105 equivalent)
- Eliminates detonation concerns

### Requirements
- Flex fuel sensor + wiring (COBB, Fuel-It, etc.) - $200-400
- E85-compatible fuel lines (recommended for FA20DIT)
- Injector headroom (1000cc+ for 400+ whp goals)
- Pro-tune for target ethanol content

### Cautions
- Check oil more frequently (ethanol can dilute oil)
- E85 availability varies by region
- ~30% worse fuel economy
- Cold start issues below 40°F in some cases

---

## Recommended Modification Order

### WRX (FA20DIT)
1. **Accessport + Stage 1 tune** — Foundation, biggest single improvement
2. **AOS or catch can** — Prevent carbon buildup
3. **Intake** — Sound, slight gains when tuned
4. **TMIC or FMIC** — Essential for heat management
5. **Downpipe + tune** — Unlocks Stage 2 potential
6. **E85/Flex fuel** — Safe power increase
7. **Turbo upgrade** — When you've maxed stock turbo

### STI (EJ257)
1. **Accessport + Stage 1 tune** — Fix factory fueling issues
2. **AOS (Crawford/IAG)** — Critical for ringland protection
3. **Oil pan baffle + pickup** — Bearing protection
4. **Intake + tune** — Better throttle response
5. **Downpipe + exhaust** — Frees turbo
6. **FMIC** — Heat soak prevention
7. **Fuel system + E85** — Safe high power

---

## What to Avoid

### Modifications to Skip
- **Pod filters without tune** — Causes MAF scaling issues
- **Cheap eBay turbos** — Reliability nightmare
- **Mixing OTS maps with non-specified parts** — Recipe for blown engine
- **Boost controllers without tune** — Can cause immediate damage
- **Skipping AOS on EJ motors** — Oil vapor causes ringland failure

### Common Mistakes
- Running WOT before oil is at temp
- Not checking oil level regularly (every fill-up on STI)
- Cheap out on tune after expensive hardware
- Ignoring knock readings in AccessPort
- Running 91 octane tune with 87 octane fuel

---

## Community Resources

### Forums
- **NASIOC** (North American Subaru Impreza Owners Club) — nasioc.com
- **ClubWRX** — clubwrx.net
- **IWSTI** — iwsti.com
- **r/WRX** — reddit.com/r/WRX

### YouTube Channels
- **COBB Tuning** — Official tutorials and dyno content
- **MAPerformance** — Build guides and product reviews
- **Engineering Explained** — Technical deep-dives
- **Bren Tuning** — Tuning education

### Trusted Vendors
| Vendor | Specialty |
|--------|-----------|
| MAPerformance | One-stop Subaru shop |
| SubiSpeed | WRX/STI parts |
| Rallysportdirect | Performance parts |
| IAG Performance | Engine builds, EJ specialists |
| Crawford Performance | AOS, turbo systems |
| Killer B Motorsport | Oil system components |

---

## Platform Comparison: WRX vs STI

| Aspect | WRX (FA20DIT) | STI (EJ257) |
|--------|---------------|-------------|
| Easier to 350 whp | ✅ Yes | ❌ More work |
| Easier to 500 whp | ❌ Built motor needed | ✅ Established path |
| Fuel economy | Better | Worse |
| Engine reliability (stock) | Better | More fragile |
| Aftermarket depth | Growing | Massive (20+ years) |
| Transmission strength | Weaker | Stronger |
| AWD system | Basic | DCCD (adjustable) |
| Sound character | Quieter turbo | Rumble + turbo whistle |
| Collector value | Lower | Higher (final EJ) |

### The Verdict
- **Choose WRX if:** You want modern efficiency, plan to stay under 400 whp, or prioritize daily driveability
- **Choose STI if:** You want the classic experience, plan for big power, or value the stronger drivetrain

---

*Last Updated: January 2025*
*Research compiled from COBB Tuning, MAPerformance, NASIOC, ClubWRX, IWSTI, DSport Magazine, and verified dyno data*
