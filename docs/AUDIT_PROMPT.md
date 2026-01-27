# Vehicle Data Accuracy Audit Prompt

Use this prompt with Cursor to audit vehicle data for accuracy, consistency, and logical correctness.

---

## The Prompt

Copy and paste this into Cursor:

````
I need you to perform a comprehensive data accuracy audit for AutoRev. This is NOT about checking if data exists - it's about verifying that data is CORRECT, CONSISTENT, and LOGICALLY MAKES SENSE for each specific vehicle.

## Audit Scope: [Choose One]
- Single vehicle: [paste car slug, e.g., "bmw-m3-f80"]
- All vehicles with issues
- Random sample of 20 vehicles

## What to Check

### 1. Ground Truth Verification
For each vehicle, first establish what is ACTUALLY true:
- What is the real engine? (verify displacement, cylinder config, aspiration)
- What is the real drivetrain? (FWD/RWD/AWD)
- What is the actual stock horsepower?
- What tuning platforms ACTUALLY support this car?

### 2. Engine/Aspiration Logic
Check if content matches the car's engine type:
- NA cars should NOT have: intercooler, BOV, wastegate, boost controller recommendations (unless discussing turbo conversion)
- Turbo cars SHOULD have: boost-related content
- Supercharged cars should NOT have: wastegate, BOV (turbo-specific parts)
- EVs should NOT have: exhaust, intake, ECU tune, fuel system recommendations
- Hybrids need clarity on which advice applies to which powertrain

### 3. Drivetrain Logic
- FWD cars should NOT have: rear diff upgrade, traditional drift tips
- RWD cars should NOT have: front diff upgrade recommendations
- Check that drivetrain is correctly identified

### 4. Tuning Platform Compatibility
Verify listed tuning platforms actually work with the car:
- Hondata/KTuner = Honda/Acura ONLY
- MHD/Bootmod3 = BMW/MINI (+ GR Supra which uses BMW engine)
- HP Tuners = GM/Ford/Stellantis ONLY
- SCT = Ford/Stellantis ONLY
- APR/Unitronic = Audi/VW ONLY
- EcuTek = Subaru, Nissan, Toyota, Mazda, McLaren, Ferrari, Aston Martin

### 5. Stage Progression Realism
- Stage 1 NA: 5-15% gain realistic
- Stage 1 Turbo: 15-40% gain realistic
- Stages should progress (Stage 1 < Stage 2 < Stage 3)
- HP/L should not exceed realistic limits without internal work

### 6. Self-Contradiction Check
- Do strengths contradict weaknesses on the same topic?
- Do community tips contradict platform insights?
- Do recommendations align with stated limitations?

### 7. Cross-Page Consistency
- Same HP shown across all pages?
- Same engine description everywhere?
- Same recommendations in all contexts?

## How to Execute

1. Run the existing audit script:
   ```bash
   node scripts/logic-accuracy-audit.mjs
````

2. For any critical issues found, investigate the specific vehicle:

   ```javascript
   // Check a specific car's data
   const { data: car } = await supabase.from('cars').select('*').eq('slug', '[slug]').single();
   const { data: profile } = await supabase
     .from('car_tuning_profiles')
     .select('*')
     .eq('car_id', car.id)
     .single();
   ```

3. Fix issues by:
   - Removing incompatible tuning platforms
   - Removing aspiration-inappropriate content
   - Correcting factual errors
   - Adding context where needed (e.g., "for turbo conversion builds")

## Output Format

For each issue found, report:

```
VEHICLE: [Name] ([slug])
ISSUE TYPE: [Critical/Warning/Info]
CATEGORY: [Engine Logic/Drivetrain/Platform/Stage/Contradiction]
FOUND: [What the data currently says]
PROBLEM: [Why this is wrong]
FIX: [Specific correction needed]
```

## Success Criteria

- 0 Critical issues remaining
- All tuning platforms verified compatible
- All aspiration-specific content matches engine type
- All drivetrain-specific content matches configuration
- No self-contradictions (unless validly nuanced)

Please proceed with the audit and report all findings.

````

---

## Quick Audit Commands

### Run Full Logic Audit
```bash
cd "/Volumes/10TB External HD/01. Apps - WORKING/AutoRev"
node scripts/logic-accuracy-audit.mjs
````

### Audit Single Vehicle

```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function auditCar(slug) {
  const { data: car } = await supabase.from('cars')
    .select('*').eq('slug', slug).single();

  if (!car) { console.log('Car not found'); return; }

  const { data: profile } = await supabase.from('car_tuning_profiles')
    .select('*').eq('car_id', car.id).single();

  console.log('=== VEHICLE AUDIT ===');
  console.log('Name:', car.name);
  console.log('Engine:', car.engine);
  console.log('Drivetrain:', car.drivetrain);
  console.log('HP:', car.hp);
  console.log('');
  console.log('Tuning Platforms:', profile?.tuning_platforms?.map(p => p.name).join(', ') || 'None');
  console.log('');
  console.log('Community Tips:', JSON.stringify(profile?.platform_insights?.community_tips, null, 2));
  console.log('');
  console.log('Weaknesses:', JSON.stringify(profile?.platform_insights?.weaknesses, null, 2));
}

auditCar('YOUR-CAR-SLUG-HERE');
"
```

### Fix Incompatible Platforms

```bash
node scripts/fix-logic-issues.mjs --dry-run  # Preview changes
node scripts/fix-logic-issues.mjs            # Apply fixes
```

### Fix Duplicate Profiles

```bash
node scripts/fix-duplicate-profiles.mjs --dry-run  # Preview
node scripts/fix-duplicate-profiles.mjs            # Apply
```

---

## Known Problem Patterns

### Pattern 1: BMW Tools on Non-BMW Cars

**Problem**: MHD, Bootmod3, JB4 listed on Toyota/Honda/etc.
**Exception**: Toyota GR Supra uses BMW B58 engine, so BMW tools ARE valid
**Fix**: Remove unless it's the GR Supra

### Pattern 2: Hondata on Non-Honda Cars

**Problem**: Hondata FlashPro listed on Toyota, Mazda, etc.
**Exception**: None - Hondata is Honda/Acura exclusive
**Fix**: Remove from all non-Honda/Acura vehicles

### Pattern 3: Turbo Tips on NA Cars

**Problem**: "Monitor boost levels" or "upgrade intercooler" on naturally aspirated car
**Exception**: Valid if discussing turbo conversion
**Fix**: Remove tip OR add context "for turbo conversion builds"

### Pattern 4: Drift Tips on FWD Cars

**Problem**: "Use surge tank on drift cars" for Honda Civic FWD
**Exception**: Valid if discussing lift-off oversteer or rally driving
**Fix**: Remove tip OR add appropriate context

### Pattern 5: Generic Tips Copied to Wrong Cars

**Problem**: Same tip appearing on incompatible vehicles
**Cause**: AI content generation without vehicle-specific validation
**Fix**: Review all tips for vehicle-specific applicability

---

## Verification Checklist

After running fixes, verify with:

```bash
# Re-run audit - should show 0 critical issues
node scripts/logic-accuracy-audit.mjs

# Check specific vehicle was fixed
node -e "..." # (single vehicle audit from above)
```

Expected final output:

```
Critical (must fix): 0
Warnings (should review): X  # Some warnings may be valid nuances
Info (minor): X
```

---

## When to Run This Audit

1. **After bulk data imports** - New AI-generated content may have errors
2. **Before major releases** - Ensure data quality for users
3. **When adding new vehicles** - Validate new entries
4. **Periodically** - Monthly data quality check
5. **After user reports** - If users report incorrect info
