# Final Reference: Upgrade Availability by Engine Type

This document defines the logic for which upgrades appear in each category based on engine type (NA, Turbo, SC).

## Stage Definitions

| Stage       | Definition                                                            | Tune Required? | Fuel System |
| ----------- | --------------------------------------------------------------------- | -------------- | ----------- |
| **Stage 1** | Intake, cat-back exhaust. Tune optional but optimizes.                | No             | Stock       |
| **Stage 2** | Headers, downpipe, mild cams, pulley, boost increase. Requires tune.  | Yes            | Stock       |
| **Stage 3** | Forced induction kits, turbo upgrades, aggressive cams, nitrous, E85. | Yes            | Upgraded    |

### Stage Logic

- **Stage 1**: Modifications that improve power but the engine can run safely without ECU changes. A tune makes it better but isn't required.
- **Stage 2**: Modifications that change airflow or boost significantly enough that the engine needs recalibration to run properly.
- **Stage 3**: Modifications that exceed what the stock fuel system can support, or involve internal engine changes.

---

## Engine & Performance Category

| Upgrade               | NA  | Turbo | SC  | Stage |
| --------------------- | :-: | :---: | :-: | :---: |
| Cold Air Intake       |  ✓  |   ✓   |  ✓  |   1   |
| Stage 1 Tune          |  ✓  |   ✓   |  ✓  |   1   |
| Piggyback Tuner       |  ✓  |   ✓   |  ✓  |   1   |
| Stage 2 Tune          |  ✓  |   ✓   |  ✓  |   2   |
| Mild Camshafts        |  ✓  |   ✓   |  ✓  |   2   |
| Stage 3 Tune          |  ✓  |   ✓   |  ✓  |   3   |
| Aggressive Camshafts  |  ✓  |   ✓   |  ✓  |   3   |
| Fuel System Upgrade   |  ✓  |   ✓   |  ✓  |   3   |
| E85/Flex Fuel Kit     |  ✓  |   ✓   |  ✓  |   3   |
| Nitrous Oxide         |  ✓  |   ✓   |  ✓  |   3   |
| Transmission Software |  ✓  |   ✓   |  ✓  |   -   |

---

## Forced Induction Category

| Upgrade                        | NA  | Turbo | SC  | Stage |
| ------------------------------ | :-: | :---: | :-: | :---: |
| Supercharger Kit (Centrifugal) |  ✓  |   -   |  -  |   3   |
| Supercharger Kit (Roots/TVS)   |  ✓  |   -   |  -  |   3   |
| Turbo Kit (Single)             |  ✓  |   -   |  -  |   3   |
| Turbo Kit (Twin)               |  ✓  |   -   |  -  |   3   |
| Turbo Upgrade (Larger)         |  -  |   ✓   |  -  |   3   |
| Boost Controller/Wastegate     |  -  |   ✓   |  -  |   2   |
| Intercooler / Heat Exchanger   |  -  |   ✓   |  ✓  |   -   |
| Pulley Upgrade + Tune          |  -  |   -   |  ✓  |   2   |

**Note**: Intercooler/Heat Exchanger is a supporting mod that enables Stage 2/3 builds but doesn't define the stage itself.

---

## Exhaust Category

| Upgrade             | NA  | Turbo | SC  | Stage |
| ------------------- | :-: | :---: | :-: | :---: |
| Axle-Back Exhaust   |  ✓  |   ✓   |  ✓  |   1   |
| Cat-Back Exhaust    |  ✓  |   ✓   |  ✓  |   1   |
| Performance Headers |  ✓  |   ✓   |  ✓  |   2   |
| Downpipe            |  -  |   ✓   |  -  |   2   |

**Note**: Downpipe is the section after the turbocharger - only applicable to turbo cars.

---

## Suspension & Handling Category

| Upgrade              | NA  | Turbo | SC  | Stage |
| -------------------- | :-: | :---: | :-: | :---: |
| Lowering Springs     |  ✓  |   ✓   |  ✓  |   -   |
| Street Coilovers     |  ✓  |   ✓   |  ✓  |   -   |
| Track Coilovers      |  ✓  |   ✓   |  ✓  |   -   |
| Adjustable Sway Bars |  ✓  |   ✓   |  ✓  |   -   |
| Chassis Bracing      |  ✓  |   ✓   |  ✓  |   -   |

---

## Brakes Category

| Upgrade                   | NA  | Turbo | SC  | Stage |
| ------------------------- | :-: | :---: | :-: | :---: |
| Performance Pads (Street) |  ✓  |   ✓   |  ✓  |   -   |
| Track Brake Pads          |  ✓  |   ✓   |  ✓  |   -   |
| Brake Fluid & SS Lines    |  ✓  |   ✓   |  ✓  |   -   |
| Big Brake Kit             |  ✓  |   ✓   |  ✓  |   -   |
| Slotted/Drilled Rotors    |  ✓  |   ✓   |  ✓  |   -   |

---

## Cooling Category

| Upgrade              | NA  | Turbo | SC  | Stage |
| -------------------- | :-: | :---: | :-: | :---: |
| Oil Cooler           |  ✓  |   ✓   |  ✓  |   -   |
| Transmission Cooler  |  ✓  |   ✓   |  ✓  |   -   |
| Performance Radiator |  ✓  |   ✓   |  ✓  |   -   |

---

## Drivetrain Category

| Upgrade                   | NA  | Turbo | SC  | Stage |
| ------------------------- | :-: | :---: | :-: | :---: |
| Clutch / Torque Converter |  ✓  |   ✓   |  ✓  |   -   |
| Performance Driveshaft    |  ✓  |   ✓   |  ✓  |   -   |

**Note**: Clutch upgrade applies to all transmission types (manual, DCT, automatic torque converter).

---

## Wheels & Tires Category

| Upgrade            | NA  | Turbo | SC  | Stage |
| ------------------ | :-: | :---: | :-: | :---: |
| Lightweight Wheels |  ✓  |   ✓   |  ✓  |   -   |

---

## Body & Aero Category

| Upgrade        | NA  | Turbo | SC  | Stage |
| -------------- | :-: | :---: | :-: | :---: |
| Front Splitter |  ✓  |   ✓   |  ✓  |   -   |
| Rear Wing      |  ✓  |   ✓   |  ✓  |   -   |

---

## Engine Type Detection

The system detects engine type from the car's `engine` field using pattern matching:

| Pattern                              | Engine Type                    |
| ------------------------------------ | ------------------------------ |
| Contains "SC" or "Supercharged"      | SC (V8, V6, etc.)              |
| Contains "Turbo", "TT", or "Biturbo" | Turbo (V8, V6, I6, I4, Flat-6) |
| Contains "V8" (no turbo/SC)          | NA V8                          |
| Contains "V6" (no turbo/SC)          | NA V6                          |
| Contains "Flat" or "H6" (no turbo)   | NA Flat-6                      |
| Contains "I4" or "4-cyl" (no turbo)  | NA I4                          |

---

## Implementation Details

### Files Modified

- `data/upgradePackages.js` - Main upgrade module definitions

### Key Properties

- `applicableEngines`: Array of engine types this upgrade applies to. If empty/missing, upgrade is universal.
- `applicableLayouts`: Array of car layouts (Front-Engine, Mid-Engine, Rear-Engine)
- `stage`: The stage level (1, 2, or 3) for power-related mods
- `requires`: Array of module keys that must be selected for this upgrade
- `stronglyRecommended`: Array of module keys recommended with this upgrade

### Filtering Logic

```javascript
// In getModulesForCar(car, carLayout)
1. Check layout compatibility (applicableLayouts)
2. Check car-specific restriction (carSlug)
3. Check engine compatibility (applicableEngines via isUpgradeCompatible)
```

---

## Changelog

- **2026-01-29**: Initial logic definition
  - Stage 1/2/3 tunes now universal (all engine types)
  - Piggyback tuner now universal
  - E85/Flex Fuel now universal
  - Added: Mild Camshafts, Aggressive Camshafts, Nitrous, Axle-Back Exhaust, Boost Controller
  - Clutch upgrade now applies to all transmission types
  - Headers now requires Stage 2 tune
