# PAGE AUDIT: /profile - User Profile

> **Audit ID:** Page-11  
> **Category:** Settings & Profile  
> **Priority:** 26 of 36  
> **Route:** `/profile`  
> **Auth Required:** Yes

---

## PAGE OVERVIEW

The Profile page displays the **user's public profile information**, including their username, avatar, bio, vehicles, achievements, and community stats.

**Key Features:**
- User avatar and username
- Bio/about section
- Vehicles showcase
- Achievement badges
- Community stats (points, builds, etc.)
- Edit profile link

---

## FILES TO EXAMINE

### Page Files

| File | Purpose |
|------|---------|
| `app/(app)/profile/page.jsx` | Profile page |
| `app/(app)/profile/page.module.css` | Profile styles |
| `app/(app)/profile/layout.jsx` | Profile layout |

### Related Components

| File | Purpose |
|------|---------|
| `components/UserAvatar.jsx` | Avatar display |
| `components/AchievementBadge.jsx` | Badge display |
| `components/VehicleCard.jsx` | Vehicle preview |
| `components/StatsCard.jsx` | Stats display |

### Related Services

| File | Purpose |
|------|---------|
| `lib/userDataService.js` | User data |
| `app/api/users/` | Users API |
| `hooks/useUserData.js` | User data hook |

---

## CRITICAL: Read These First

Before making ANY changes:

1. `docs/SOURCE_OF_TRUTH.md` - User profiles section
2. `docs/BRAND_GUIDELINES.md` - Avatar, cards, badges
3. Cross-cutting audit findings:
   - D (UI/UX) - Card patterns, avatar
   - E (Accessibility) - Profile accessibility

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY code:

1. ✅ Verify profile loads for current user
2. ✅ Test avatar display
3. ✅ Check stats calculate correctly
4. ❌ Do NOT change user data schema without understanding
5. ❓ If data missing, check userDataService

---

## CHECKLIST

### A. Functionality

- [ ] Profile loads for current user
- [ ] Avatar displays correctly
- [ ] Username displays
- [ ] Bio displays (if set)
- [ ] Vehicles list shows
- [ ] Achievements display
- [ ] Stats accurate
- [ ] Edit link works

### B. Data Flow

- [ ] Uses `useUserData()` or similar
- [ ] Profile data from Supabase
- [ ] Stats aggregated correctly
- [ ] Achievements from user data
- [ ] Proper loading states

### C. UI/UX Design System

- [ ] **Avatar** = Circular, fallback initial
- [ ] **Username** = Prominent
- [ ] **Achievements** = Badges in teal/gold
- [ ] **Stats** = Card pattern
- [ ] **Edit button** = Lime CTA
- [ ] No hardcoded colors
- [ ] 44px touch targets

### D. Profile Layout

```
┌─────────────────────────────────────────────────┐
│                                                 │
│        ┌───────┐                                │
│        │ Avatar│   @username                    │
│        │  (lg) │   Member since Jan 2024        │
│        └───────┘                                │
│                                                 │
│  Bio: "Car enthusiast and weekend track..."    │
│                                                 │
│  [Edit Profile]  (lime)                         │
├─────────────────────────────────────────────────┤
│  Stats                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ 12,450  │ │   3     │ │  42     │           │
│  │ Points  │ │ Vehicles│ │ Builds  │           │
│  └─────────┘ └─────────┘ └─────────┘           │
├─────────────────────────────────────────────────┤
│  Achievements                                   │
│  🏆 First Build  🔧 Tuner  ⚡ Speed Demon       │
├─────────────────────────────────────────────────┤
│  My Vehicles                                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ BMW M3  │ │ Miata   │ │         │           │
│  └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────────────────────────────┘
```

- [ ] Avatar prominent at top
- [ ] Username clear
- [ ] Member since date
- [ ] Bio section
- [ ] Stats grid
- [ ] Achievements row
- [ ] Vehicles grid

### E. Avatar Display

- [ ] Uses `<Image>` component
- [ ] Fallback to initial
- [ ] Circular shape
- [ ] Multiple sizes (sm, md, lg)
- [ ] Loading placeholder

### F. Stats Display

| Stat | Source |
|------|--------|
| Points | User points total |
| Vehicles | Owned vehicles count |
| Builds | Shared builds count |
| Following/Followers | Social connections |

- [ ] Numbers formatted (commas)
- [ ] Monospace font
- [ ] Labels clear
- [ ] Card pattern

### G. Achievements/Badges

- [ ] Badges display in row/grid
- [ ] Icon + name visible
- [ ] Locked badges grayed (if shown)
- [ ] Click shows details (optional)
- [ ] Earned badges in teal/gold

### H. Vehicles Section

- [ ] Shows user's vehicles
- [ ] Thumbnail + name
- [ ] Links to garage
- [ ] Handles 0 vehicles

### I. Loading States

- [ ] Avatar skeleton (circle)
- [ ] Stats skeleton
- [ ] Achievements skeleton
- [ ] Vehicles skeleton

### J. Empty States

- [ ] No bio set
- [ ] No vehicles
- [ ] No achievements
- [ ] Helpful prompts

### K. Accessibility

- [ ] Avatar has alt text
- [ ] Stats labeled properly
- [ ] Badges have names
- [ ] Focus visible on edit

### L. Mobile Responsiveness

- [ ] Stack layout on mobile
- [ ] Avatar smaller on mobile
- [ ] Stats 2-column on mobile
- [ ] 44px touch targets

---

## SPECIFIC CHECKS

### Avatar Component

```javascript
// Avatar should handle missing images
const UserAvatar = ({ user, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-24 h-24',
  };
  
  return (
    <div className={cn(styles.avatar, sizeClasses[size])}>
      {user.avatar_url ? (
        <Image
          src={user.avatar_url}
          alt={`${user.username}'s avatar`}
          fill
          className={styles.avatarImage}
        />
      ) : (
        <span className={styles.initial}>
          {user.username?.[0]?.toUpperCase() || '?'}
        </span>
      )}
    </div>
  );
};
```

### Stats Card Pattern

```javascript
// Stats should use card pattern
const StatsCard = ({ label, value }) => (
  <div className={styles.statCard}>
    <span className={styles.statValue}>
      {typeof value === 'number' ? value.toLocaleString() : value}
    </span>
    <span className={styles.statLabel}>{label}</span>
  </div>
);

// Monospace for numbers
.statValue {
  font-family: var(--font-mono);
  font-size: var(--font-size-2xl);
  color: var(--color-text-primary);
}
```

### Achievement Badge Pattern

```javascript
// Badges should show earned vs locked
const AchievementBadge = ({ achievement, earned }) => (
  <div 
    className={cn(
      styles.badge,
      earned ? styles.earned : styles.locked
    )}
    title={achievement.description}
  >
    <span className={styles.icon}>{achievement.icon}</span>
    <span className={styles.name}>{achievement.name}</span>
  </div>
);

// Styles
.badge.earned {
  background: var(--color-accent-teal-bg);
  border-color: var(--color-accent-teal);
}
.badge.locked {
  opacity: 0.5;
  filter: grayscale(1);
}
```

---

## TESTING SCENARIOS

### Test Case 1: View Own Profile

1. Navigate to /profile
2. **Expected:** Your profile displays
3. **Verify:** Avatar, username, stats correct

### Test Case 2: Avatar Display

1. User has avatar image
2. **Expected:** Image displays circular
3. **Verify:** Proper sizing, no distortion

### Test Case 3: Avatar Fallback

1. User has no avatar
2. **Expected:** Initial letter displays
3. **Verify:** Centered, styled correctly

### Test Case 4: Stats Accuracy

1. Check points, vehicles, builds counts
2. **Expected:** Numbers match actual data
3. **Verify:** Formatted with commas

### Test Case 5: Achievements

1. User has some achievements
2. **Expected:** Badges display
3. **Verify:** Earned badges highlighted

### Test Case 6: Edit Profile

1. Click "Edit Profile"
2. **Expected:** Navigate to /settings
3. **Verify:** Link works

### Test Case 7: Empty Profile

1. New user with minimal data
2. **Expected:** Graceful display, prompts to complete
3. **Verify:** No errors, helpful guidance

---

## AUTOMATED CHECKS

```bash
# 1. Check for hardcoded colors
grep -rn "#[0-9a-fA-F]\{3,6\}" app/\(app\)/profile/*.jsx app/\(app\)/profile/*.css

# 2. Check for design tokens
grep -rn "accent-lime\|accent-teal" app/\(app\)/profile/*.jsx

# 3. Check for Next.js Image
grep -rn "next/image\|<Image" app/\(app\)/profile/*.jsx

# 4. Check for monospace font
grep -rn "font-mono\|monospace" app/\(app\)/profile/*.jsx app/\(app\)/profile/*.css

# 5. Check for toLocaleString
grep -rn "toLocaleString" app/\(app\)/profile/*.jsx

# 6. Check for console.log
grep -rn "console\.log" app/\(app\)/profile/*.jsx
```

---

## CROSS-REFERENCE WITH FOUNDATION AUDITS

| Audit | Check On This Page |
|-------|-------------------|
| D. UI/UX | Avatar, cards, badges |
| E. Accessibility | Alt text, labels |
| A. Performance | Avatar image optimization |
| C. Database | User data queries |

---

## DELIVERABLES

### 1. Functionality Report

| Feature | Works | Issues |
|---------|-------|--------|
| Profile loads | ✅/❌ | |
| Avatar display | ✅/❌ | |
| Stats display | ✅/❌ | |
| Achievements | ✅/❌ | |
| Vehicles | ✅/❌ | |
| Edit link | ✅/❌ | |

### 2. UI Compliance Report

| Element | Expected | Actual | Status |
|---------|----------|--------|--------|
| Edit button | Lime | | ✅/❌ |
| Earned badges | Teal | | ✅/❌ |
| Stats numbers | Monospace | | ✅/❌ |
| Avatar | Circular | | ✅/❌ |

### 3. Issues Found

| Severity | Issue | File:Line | Fix |
|----------|-------|-----------|-----|
| | | | |

---

## VERIFICATION

- [ ] Profile loads correctly
- [ ] Avatar has fallback
- [ ] Stats formatted with commas
- [ ] Edit button is lime
- [ ] Badges use teal/gold
- [ ] Mobile responsive

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | Profile displays for current user |
| 2 | Avatar circular with fallback |
| 3 | Stats formatted correctly |
| 4 | Edit button = lime |
| 5 | Achievements display |
| 6 | Mobile responsive |
| 7 | No critical/high issues remaining |

---

## OUTPUT FORMAT

```
👤 PAGE AUDIT: /profile

**Status:** ✅ Pass / ⚠️ Issues / ❌ Fail

**UI Compliance:** ✅ / ❌
- Edit button: Lime ✅
- Badges: Teal ✅
- Stats: Monospace ✅

**Functionality:**
- [x] Profile loads
- [x] Avatar display
- [x] Stats
- [ ] Achievements missing (issue #1)

**Issues Found:**
1. [Medium] Achievements section not implemented
2. [Low] Stats missing comma formatting
...

**Test Results:**
- Own profile: ✅
- Avatar: ✅
- Stats: ⚠️
- Edit link: ✅
```

---

## AUDIT EXECUTION LOG

| Date | Auditor | Status | Issues Fixed | Notes |
|------|---------|--------|--------------|-------|
| | | | | |

---

*Audit prompt generated: January 25, 2026*  
*Part of AutoRev Systematic Audit Suite (36 total audits)*
