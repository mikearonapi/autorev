# Physics Model Audit - UI ↔ Physics Bidirectional Mapping

## Overview

This document audits the Advanced Tuning UI inputs against the physics model calculations to ensure complete bidirectional coverage:
- **UI → Physics**: Every user input affects at least one physics calculation
- **Physics → UI**: Every physics output has corresponding user inputs

---

## 📊 Physics Model Outputs

| Output | Description | Unit |
|--------|-------------|------|
| **WHP Estimate** | Wheel horsepower | HP |
| **HP Gain** | Gain over stock | HP |
| **Confidence Tier** | Data quality tier (1-4) | - |
| **0-60 Time** | Acceleration | seconds |
| **1/4 Mile ET** | Drag strip time | seconds |
| **Trap Speed** | 1/4 mile exit speed | mph |
| **Power/Weight** | Power density | hp/ton |
| **60-0 Braking** | Stopping distance | feet |
| **Lateral G** | Cornering grip | g |
| **Handling Score** | Composite handling | points |
| **Braking Score** | Composite braking | points |
| **Top Speed Delta** | Effect of aero | mph |

---

## 🔧 UI Inputs → Physics Effects

### ENGINE Section
| Input | UI Location | Physics Effect |
|-------|-------------|----------------|
| Build Type | Engine → Build Type | `engineMultiplier` (+5-35% HP) |
| Cams | Engine → Cams | `breathingMultiplier` (+2-12% VE) |
| Head Work | Engine → Ported Head | `breathingMultiplier` (+5% VE) |
| Displacement | Engine → Displacement | `engineMultiplier` (scales linearly) |
| Internals | Engine → Internals | `engineMultiplier` (+10-20% headroom) |
| Compression | Engine → Compression | ⚠️ **Not yet connected** |
| Valvetrain | Engine → Valvetrain | ⚠️ **Not yet connected** |
| Block Type | Engine → Block Type | ⚠️ **Not yet connected** |

### INTAKE & EXHAUST Section
| Input | UI Location | Physics Effect |
|-------|-------------|----------------|
| Intake Type | Intake & Exhaust → Intake | `breathingMultiplier` (+2-5%) |
| Throttle Body | Intake & Exhaust → Throttle Body | `breathingMultiplier` (+1-3%) |
| Headers | Intake & Exhaust → Headers | `breathingMultiplier` (+2-5%) |
| Downpipe | Intake & Exhaust → Downpipe | `breathingMultiplier` (+1-4%) |
| Catback | Intake & Exhaust → Exhaust System | `breathingMultiplier` (+1-3%) |
| Manifold | Intake & Exhaust → Manifold | ⚠️ **Not yet connected** |
| Throttle Body Size (mm) | - | ⚠️ **Not in UI** |
| Downpipe Diameter | - | ⚠️ **Not in UI** |

### FORCED INDUCTION Section
| Input | UI Location | Physics Effect |
|-------|-------------|----------------|
| Turbo Type | Forced Induction → Turbo Setup | Triggers turbo calculations |
| Turbo Model | Forced Induction → Turbo Model | `flow_hp` from database |
| Inducer Size | Forced Induction → Inducer | HP potential formula |
| Target Boost | Forced Induction → Target PSI | Pressure ratio calc |
| Wastegate | Forced Induction → Wastegate | ⚠️ **Not yet connected** |
| Intercooler | Forced Induction → Intercooler | `icMultiplier` (+1-5%) |
| Ball Bearing | - | Turbo efficiency (78% vs 72%) |
| IC Sprayer | Cooling → IC Sprayer | `icMultiplier` (+2%) |

### FUEL SYSTEM Section
| Input | UI Location | Physics Effect |
|-------|-------------|----------------|
| Fuel Type | Fuel System → Fuel Type | `fuelMultiplier` (+5-15%) |
| Injector CC | Fuel System → Injectors | ⚠️ **Not yet connected** (limit check) |
| Fuel Pump | Fuel System → Fuel Pump | ⚠️ **Not yet connected** |
| Flex Fuel Kit | Fuel System → Flex Fuel | Enables E85 fuel type |

### POWER ADDERS Section
| Input | UI Location | Physics Effect |
|-------|-------------|----------------|
| Methanol Injection | Power Adders → Meth/Water | `powerAdderHp` (+6-15%) |
| Methanol Ratio | Power Adders → Meth % | Scales meth bonus |
| Nitrous | Power Adders → Nitrous | `powerAdderHp` (direct addition) |
| Nitrous Shot | Power Adders → Shot Size | Direct HP addition |

### ECU & TUNING Section
| Input | UI Location | Physics Effect |
|-------|-------------|----------------|
| ECU Type | ECU & Tuning → ECU Type | `tuneMultiplier` (+2-5%) |
| Dyno Tuned | ECU & Tuning → Dyno Tuned | `tuneMultiplier` (+2%) |
| Anti-Lag | ECU & Tuning → Anti-Lag | `tuneMultiplier` (+2%) |
| Launch Control | ECU & Tuning → Launch Control | ⚠️ **Not yet connected** (affects 0-60) |
| Boost by Gear | ECU & Tuning → Boost by Gear | ⚠️ **Not yet connected** |

### SUSPENSION Section ✅ NEW
| Input | UI Location | Physics Effect |
|-------|-------------|----------------|
| Setup Type | Suspension → Setup Type | `handlingScore` (+8-25 pts) |
| Ride Height Drop | Suspension → Drop | Lower CoG (implied) |
| Front Sway Bar | Suspension → Front Sway | `handlingScore` (+3-5 pts) |
| Rear Sway Bar | Suspension → Rear Sway | `handlingScore` (+2-4 pts) |
| Strut Bar | Suspension → Front Strut Bar | `handlingScore` (+3 pts) |
| Subframe Brace | Suspension → Subframe Brace | `handlingScore` (+4 pts) |
| Alignment | Suspension → Alignment | `handlingScore` (+5-15 pts) |

### BRAKES Section ✅ NEW
| Input | UI Location | Physics Effect |
|-------|-------------|----------------|
| Pad Compound | Brakes → Pad Compound | `brakingScore` (+10-30 pts) |
| Rotor Type | Brakes → Rotor Type | `brakingScore` (+5-12 pts) |
| BBK Front | Brakes → BBK Front | `brakingScore` (+20 pts) |
| BBK Rear | Brakes → BBK Rear | `brakingScore` (+10 pts) |
| Brake Fluid | Brakes → Brake Fluid | `brakingScore` (+3-8 pts) |
| Stainless Lines | Brakes → Lines | `brakingScore` (+5 pts) |
| Brake Ducts | Brakes → Brake Ducts | `brakingScore` (+5 pts) |

### AERO Section ✅ NEW
| Input | UI Location | Physics Effect |
|-------|-------------|----------------|
| Front Splitter | Aero → Front | `handlingScore` (+2-8 pts), `topSpeedDelta` (-2 to -4 mph) |
| Rear Wing | Aero → Rear | `handlingScore` (+2-12 pts), `topSpeedDelta` (-5 to -12 mph) |
| Diffuser | Aero → Rear Diffuser | `handlingScore` (+6 pts), `topSpeedDelta` (-2 mph) |
| Canards | Aero → Canards | `handlingScore` (+3 pts) |
| Flat Underbody | Aero → Flat Underbody | `handlingScore` (+4 pts) |

### WHEELS Section ✅ NEW
| Input | UI Location | Physics Effect |
|-------|-------------|----------------|
| Wheel Type | Wheels → Wheel Type | `handlingScore` (+2-7 pts) |
| Weight Per Wheel | Wheels → Weight/wheel | Rotational inertia (affects 0-60, 1/4) |
| Wheel Width | Wheels → Width | ⚠️ **Not yet connected** (affects grip) |

### WEIGHT & TIRES Section
| Input | UI Location | Physics Effect |
|-------|-------------|----------------|
| Weight Reduction | Weight & Tires → Weight Change | `totalWeight` (direct) |
| Driver Weight | Weight & Tires → Driver | `totalWeight` (direct) |
| Stripped Interior | Weight & Tires → Stripped Interior | `totalWeight` (-150 lbs) |
| Roll Cage | Weight & Tires → Roll Cage | `totalWeight` (+80 lbs) |
| Tire Compound | Weight & Tires → Tire Compound | `tireGrip`, `handlingScore`, `brakingScore` |
| Final Drive | Weight & Tires → Final Drive | `trapSpeed` calculation |

### ENVIRONMENT Section
| Input | UI Location | Physics Effect |
|-------|-------------|----------------|
| Altitude | Environment → Altitude | `environmentMultiplier` (-2%/1000ft) |
| Ambient Temp | Environment → Temp | `environmentMultiplier` (-1%/10°F) |
| Humidity | Environment → (not shown) | ⚠️ **Not yet connected** |

### DRIVETRAIN Section
| Input | UI Location | Physics Effect |
|-------|-------------|----------------|
| Clutch | Drivetrain → Clutch | ⚠️ **Not yet connected** |
| Flywheel | Drivetrain → Flywheel | ⚠️ **Not yet connected** (affects spool) |
| Differential | Drivetrain → Differential | ⚠️ **Not yet connected** (affects traction) |
| Final Drive | (in Weight section) | `trapSpeed` formula |
| Trans Type | - | ⚠️ **Not yet connected** |

### VERIFIED RESULTS Section
| Input | UI Location | Physics Effect |
|-------|-------------|----------------|
| Has Dyno | Verified Results → I have dyno | Enables Tier 1 |
| WHP | Verified Results → WHP | **Overrides all estimates** |
| WTQ | Verified Results → WTQ | Reference data |
| Dyno Shop | Verified Results → Dyno Shop | Confidence metadata |
| 1/4 Mile | Verified Results → 1/4 Mile | ⚠️ **Not yet connected** (could validate) |
| 0-60 | Verified Results → 0-60 | ⚠️ **Not yet connected** (could validate) |

---

## ⚠️ Items Not Yet Connected

### UI Inputs without Physics Connection:
1. **Compression Ratio** - Should affect NA power, detonation limits
2. **Valvetrain** - Should affect rev limit, VE at high RPM
3. **Block Type** - Should affect max boost potential
4. **Intake Manifold** - Should affect mid-range torque
5. **Wastegate Type** - Should affect boost control quality
6. **Injector CC** - Should validate fuel system capacity
7. **Fuel Pump LPH** - Should validate fuel system capacity
8. **Launch Control** - Should improve 0-60 on RWD
9. **Boost by Gear** - Could show different HP by gear
10. **Clutch/Flywheel** - Should affect spool, shift speed
11. **Differential** - Should affect traction out of corners
12. **Humidity** - Should affect air density

### Physics Concepts without UI:
1. **Torque Curve Shape** - Only show peak, not curve
2. **Boost Curve** - Only show target, not spool
3. **Fuel System Limit** - Not calculating max supported HP
4. **Cooling Limit** - Not calculating thermal limit

---

## ✅ Verification Checklist

### Power (WHP) Calculation
- [x] Engine type affects multiplier
- [x] Cams affect breathing
- [x] Turbo model from database
- [x] Boost pressure ratio
- [x] Fuel type bonus
- [x] Methanol adds power
- [x] Nitrous adds power
- [x] Altitude/temp correction
- [x] Verified dyno overrides all

### Acceleration (0-60, 1/4)
- [x] Power affects times
- [x] Weight affects times
- [x] Tire compound affects launch grip
- [x] Wheel weight affects acceleration
- [x] Final drive affects trap speed
- [x] Drivetrain (AWD/RWD) affects launch

### Handling (Lateral G)
- [x] Suspension type affects score
- [x] Sway bars affect score
- [x] Chassis bracing affects score
- [x] Alignment affects score
- [x] Tire compound affects score
- [x] Aero affects score
- [x] Wheel type affects score

### Braking (60-0)
- [x] Pad compound affects score
- [x] Rotor type affects score
- [x] BBK affects score
- [x] Brake fluid affects score
- [x] Lines affect score
- [x] Tire compound affects score

---

## Summary

**Total UI Input Fields**: ~80
**Connected to Physics**: ~55 (69%)
**Not Yet Connected**: ~25 (31%)

The physics model now covers:
- ✅ Power estimation (comprehensive)
- ✅ Acceleration (0-60, 1/4 mile)
- ✅ Handling (lateral G, handling score)
- ✅ Braking (60-0 distance, braking score)
- ✅ Top speed effect (aero drag)

Areas for future improvement:
- Torque curve simulation (virtual dyno)
- Fuel system capacity validation
- Thermal limits
- Boost curve by RPM
