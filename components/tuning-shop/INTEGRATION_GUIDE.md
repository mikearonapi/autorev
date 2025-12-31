# Tuning Shop Components Integration Guide

This guide explains how to integrate the new mobile-first components into the existing Tuning Shop page.

## Component Overview

### 1. **FactoryConfig**
Factory options selection (transmission, wheel packages, drivetrain).

```jsx
import { FactoryConfig } from '@/components/tuning-shop';

<FactoryConfig
  car={selectedCar}
  initialConfig={vehicle?.customSpecs}
  onChange={(config) => setFactoryConfig(config)}
  defaultExpanded={false}
/>
```

### 2. **WheelTireConfigurator**
Wheel/tire fitment selection with OEM baseline and upgrade options.

```jsx
import { WheelTireConfigurator, useWheelTireSelection } from '@/components/tuning-shop';

const { selectedFitment, selectFitment, toBuildUpgrade } = useWheelTireSelection();

<WheelTireConfigurator
  car={selectedCar}
  selectedFitment={selectedFitment}
  onSelect={selectFitment}
  showCostEstimates={true}
/>
```

### 3. **SizeSelector / InlineSizeSelector**
Part size variant selection for brake rotors, spacers, etc.

```jsx
import { SizeSelector, extractSizeVariants, useSizeSelections } from '@/components/tuning-shop';

// Check if part needs size selection
const { hasSizes } = extractSizeVariants(part);

// Use hook for managing multiple part size selections
const { selections, setSelection, missingSelections } = useSizeSelections(selectedParts);

// Inline selector for part cards
<InlineSizeSelector
  part={part}
  selectedVariant={selections[part.id]}
  onSelect={(variant) => setSelection(part.id, variant)}
/>
```

### 4. **StickyCarHeader**
Collapsible sticky header showing selected car and build stats.

```jsx
import { StickyCarHeader } from '@/components/tuning-shop';

<StickyCarHeader
  car={selectedCar}
  totalHpGain={calculatedHpGain}
  totalCost={calculatedCost}
  onChangeCar={() => setSelectedCar(null)}
/>
```

### 5. **BuildSummaryBar**
Sticky bottom bar with build summary and Save CTA.

```jsx
import { BuildSummaryBar } from '@/components/tuning-shop';

<BuildSummaryBar
  selectedUpgrades={upgradesArray}
  totalHpGain={hpGain}
  totalCost={cost}
  upgradeCount={upgradesArray.length}
  onSaveBuild={handleSaveBuild}
  onClearBuild={handleClearAll}
  canSave={user && upgradesArray.length > 0}
  isSaving={isSaving}
/>
```

### 6. **CategoryNav**
Horizontal scrollable category tabs with icons.

```jsx
import { CategoryNav } from '@/components/tuning-shop';

<CategoryNav
  categories={['power', 'turbo', 'suspension', 'brakes', 'exhaust', 'intake']}
  activeCategory={activeCategory}
  onCategoryChange={setActiveCategory}
  selectedCounts={{ power: 2, suspension: 1 }}
  showAll={true}
/>
```

### 7. **CollapsibleSection**
Reusable accordion for organizing content.

```jsx
import { CollapsibleSection, PerformanceSummarySection } from '@/components/tuning-shop';

// Generic collapsible
<CollapsibleSection
  title="AI Recommendations"
  icon={<BoltIcon />}
  defaultExpanded={false}
  summary="3 suggestions"
>
  {/* Content */}
</CollapsibleSection>

// Performance summary
<PerformanceSummarySection
  hpGain={75}
  tqGain={85}
  zeroToSixty={4.2}
  quarterMile={12.5}
/>
```

## Integration Steps

### Step 1: Import Components

Add to `app/tuning-shop/page.jsx`:

```jsx
import {
  FactoryConfig,
  WheelTireConfigurator,
  StickyCarHeader,
  BuildSummaryBar,
  CategoryNav,
  CollapsibleSection,
  useWheelTireSelection,
} from '@/components/tuning-shop';
```

### Step 2: Add State for New Features

```jsx
// In TuningShopContent component
const [factoryConfig, setFactoryConfig] = useState(null);
const { selectedFitment, selectFitment, toBuildUpgrade } = useWheelTireSelection();
```

### Step 3: Replace Car Selection Display

When a car is selected, wrap content with `StickyCarHeader`:

```jsx
{selectedCar && (
  <>
    <StickyCarHeader
      car={selectedCar}
      totalHpGain={totalHpGain}
      totalCost={totalCost}
      onChangeCar={() => {
        setSelectedCar(null);
        setFactoryConfig(null);
      }}
    />
    
    {/* Factory Config - shown after car selection */}
    <FactoryConfig
      car={selectedCar}
      initialConfig={matchingVehicle?.customSpecs}
      onChange={setFactoryConfig}
    />
    
    {/* Rest of content */}
  </>
)}
```

### Step 4: Add Wheel/Tire Configurator to Upgrade Center

In the upgrade categories or as a separate section:

```jsx
<WheelTireConfigurator
  car={selectedCar}
  selectedFitment={selectedFitment}
  onSelect={selectFitment}
/>
```

### Step 5: Add Build Summary Bar

At the end of the page (it's position:fixed):

```jsx
<BuildSummaryBar
  selectedUpgrades={getSelectedUpgradesArray()}
  totalHpGain={totalHpGain}
  totalTqGain={totalTqGain}
  totalCost={totalCost}
  upgradeCount={selectedModulesCount}
  onSaveBuild={handleSaveBuild}
  onClearBuild={handleClearSelections}
  canSave={!!user && selectedModulesCount > 0}
  isSaving={isSaving}
/>
```

### Step 6: Replace Category Pills with CategoryNav

Replace the existing horizontal category pills:

```jsx
<CategoryNav
  categories={availableCategories}
  activeCategory={activeCategory}
  onCategoryChange={setActiveCategory}
  selectedCounts={categorySelectedCounts}
/>
```

## Data Flow

```
User Flow:
1. Select Car → StickyCarHeader appears
2. Configure Factory Options → FactoryConfig
3. Select Wheel/Tire Setup → WheelTireConfigurator
4. Browse Categories → CategoryNav
5. Select Parts (with sizes) → SizeSelector
6. Review Build → BuildSummaryBar (always visible)
7. Save Build → onSaveBuild callback

Data Persistence:
- Factory config → user_vehicles.customSpecs (if owned vehicle)
- Wheel/tire selection → user_projects.selected_upgrades
- Part selections → user_projects.selected_upgrades
- Size variants → included in selected_upgrades JSONB
```

## Mobile Responsive Behavior

- **375px (iPhone SE)**: All components stack vertically, bottom bar is sticky
- **390px (iPhone 14)**: Similar to SE with slightly more breathing room
- **768px (tablet)**: Category nav becomes horizontal row, two-column grids
- **1024px+ (desktop)**: Full layout with sidebar navigation option

## CSS Variables Used

The components use these CSS custom properties from `globals.css`:

```css
:root {
  --color-gold: #d4af37;
  --color-success: #4ade80;
  --color-error: #ef4444;
  --color-warning: #f59e0b;
  --color-info: #3b82f6;
  --color-cyan: #22d3d8;
  --font-mono: 'JetBrains Mono', monospace;
}
```

## Testing

```bash
# Run the dev server
npm run dev

# Navigate to /tuning-shop
# Select a car
# Verify:
# 1. StickyCarHeader appears and becomes sticky on scroll
# 2. FactoryConfig loads options for the selected car
# 3. WheelTireConfigurator shows fitment options
# 4. CategoryNav scrolls horizontally on mobile
# 5. BuildSummaryBar shows at bottom when upgrades selected
# 6. All components are responsive at 375px width
```



