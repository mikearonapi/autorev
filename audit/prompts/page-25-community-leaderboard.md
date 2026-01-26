# PAGE AUDIT: /community/leaderboard - Rankings

> **Audit ID:** Page-25  
> **Category:** Community Page  
> **Priority:** 24 of 36  
> **Route:** `/community/leaderboard`  
> **Auth Required:** Yes  
> **Layout:** Shared community layout with tabs

---

## PAGE OVERVIEW

The Leaderboard page displays **community rankings** based on various metrics like points, builds, engagement, or performance achievements. It gamifies the AutoRev experience.

**Key Features:**
- User rankings table/list
- Multiple leaderboard categories
- Current user position highlight
- Time period filtering
- Achievement badges display

---

## FILES TO EXAMINE

### Page Files

| File | Purpose |
|------|---------|
| `app/(app)/community/leaderboard/page.jsx` | Leaderboard page |
| `app/(app)/community/LeaderboardView.jsx` | Leaderboard component |
| `app/(app)/community/LeaderboardView.module.css` | Leaderboard styles |

### Shared Layout

| File | Purpose |
|------|---------|
| `app/(app)/community/layout.jsx` | Community layout |
| `app/(app)/community/CommunityNav.jsx` | Tab navigation |

### Related Components

| File | Purpose |
|------|---------|
| `components/LeaderboardRow.jsx` | Individual rank row |
| `components/RankBadge.jsx` | Position badge (1st, 2nd, 3rd) |
| `components/UserAvatar.jsx` | User avatar display |
| `components/PointsDisplay.jsx` | Points formatting |

### Related Services

| File | Purpose |
|------|---------|
| `app/api/community/leaderboard/route.js` | Leaderboard API |
| `lib/pointsService.js` | Points calculations |

---

## CRITICAL: Read These First

Before making ANY changes:

1. `docs/SOURCE_OF_TRUTH.md` - Points system, Gamification
2. `docs/BRAND_GUIDELINES.md` - Rankings display, Badges
3. Cross-cutting audit findings:
   - D (UI/UX) - Table patterns, highlighting
   - E (Accessibility) - Data table accessibility

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY code:

1. ✅ Verify leaderboard loads correctly
2. ✅ Test current user is highlighted
3. ✅ Check rankings calculate correctly
4. ❌ Do NOT change points algorithm without understanding
5. ❓ If rankings seem wrong, check leaderboard API

---

## CHECKLIST

### A. Functionality

- [ ] Leaderboard loads
- [ ] Rankings display correctly
- [ ] Current user highlighted
- [ ] Can switch categories
- [ ] Can switch time periods
- [ ] Position numbers correct
- [ ] Points/scores accurate

### B. Data Flow

- [ ] Uses leaderboard API
- [ ] Uses React Query for caching
- [ ] Current user ID from auth
- [ ] Proper pagination (if paginated)
- [ ] Refresh mechanism

### C. UI/UX Design System

- [ ] **Gold** (1st place) = Special treatment
- [ ] **Silver** (2nd place) = Special treatment
- [ ] **Bronze** (3rd place) = Special treatment
- [ ] **Current user row** = Highlighted (teal/lime accent)
- [ ] **Points** = Monospace font
- [ ] No hardcoded colors
- [ ] 44px row height minimum

### D. Leaderboard Layout

```
┌─────────────────────────────────────────────────┐
│  Leaderboard                                    │
│                                                 │
│  [All Time ▼] [Points ▼]                        │
├─────────────────────────────────────────────────┤
│                                                 │
│  🥇  1   @topuser        12,450 pts            │
│  🥈  2   @secondplace    11,230 pts            │
│  🥉  3   @thirdplace     10,890 pts            │
│      4   @user4           9,450 pts            │
│      5   @user5           8,920 pts            │
│  ─────────────────────────────────────────────  │
│  →  42  @yourusername     2,340 pts  (highlight)│
│  ─────────────────────────────────────────────  │
│      6   @user6           7,650 pts            │
│      ...                                        │
│                                                 │
└─────────────────────────────────────────────────┘
```

- [ ] Top 3 with medals/special treatment
- [ ] Rank number clear
- [ ] Username with avatar
- [ ] Points right-aligned
- [ ] Current user row highlighted
- [ ] "You" indicator if needed

### E. Top 3 Treatment

| Position | Medal | Special Style |
|----------|-------|---------------|
| 1st | 🥇 Gold | Gold accent/glow |
| 2nd | 🥈 Silver | Silver accent |
| 3rd | 🥉 Bronze | Bronze accent |

- [ ] Medals or badges visible
- [ ] Distinct from rest
- [ ] Not just color difference

### F. Current User Highlight

- [ ] Row has distinct background
- [ ] Uses teal or lime accent
- [ ] Shows even if not in visible range
- [ ] "Your Position" label

### G. Category Tabs/Filters

| Category | Metric |
|----------|--------|
| Overall | Total points |
| Builds | Build count/quality |
| Engagement | Comments, likes |
| Performance | HP gains, track times |

- [ ] Categories clear
- [ ] Switching updates rankings
- [ ] Active category highlighted

### H. Time Period Filter

- [ ] All Time
- [ ] This Month
- [ ] This Week
- [ ] Switching updates data

### I. Points/Score Display

- [ ] Formatted with commas (12,450)
- [ ] Monospace font
- [ ] Unit label (pts, HP, etc.)
- [ ] Right-aligned in row

### J. Loading States

- [ ] Skeleton rows while loading
- [ ] Loading on filter change
- [ ] Maintain layout shape

### K. Empty States

- [ ] No rankings (new leaderboard)
- [ ] User not ranked yet
- [ ] Category has no data

### L. Accessibility

- [ ] Use `<table>` semantics
- [ ] Headers for columns
- [ ] Screen reader announces rank
- [ ] Focus visible on rows
- [ ] Current user row announced

### M. Mobile Responsiveness

- [ ] Table scrolls horizontally or adapts
- [ ] Rank + name + score visible
- [ ] Touch-friendly filters
- [ ] 44px row heights

---

## SPECIFIC CHECKS

### Leaderboard Table Semantics

```javascript
// Must use proper table semantics
<table className={styles.leaderboard}>
  <thead>
    <tr>
      <th scope="col">Rank</th>
      <th scope="col">User</th>
      <th scope="col">Points</th>
    </tr>
  </thead>
  <tbody>
    {rankings.map((user, index) => (
      <tr 
        key={user.id}
        className={cn(
          styles.row,
          user.id === currentUserId && styles.currentUser,
          index < 3 && styles[`rank${index + 1}`]
        )}
      >
        <td className={styles.rank}>
          {index < 3 ? medals[index] : index + 1}
        </td>
        <td className={styles.user}>
          <UserAvatar user={user} size="sm" />
          <span>@{user.username}</span>
        </td>
        <td className={styles.points}>
          {user.points.toLocaleString()} pts
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

### Current User Highlight Style

```css
/* Current user row should stand out */
.row.currentUser {
  background: var(--color-accent-teal-bg);
  border-left: 3px solid var(--color-accent-teal);
}

/* Or with lime */
.row.currentUser {
  background: rgba(163, 230, 53, 0.1);
  border-left: 3px solid var(--color-accent-lime);
}
```

### Points Formatting

```javascript
// Points must be formatted consistently
const formatPoints = (points) => {
  return points.toLocaleString();
};

// With unit
<span className={styles.points}>
  {formatPoints(user.points)} pts
</span>
```

### Medal/Badge Pattern

```javascript
const medals = ['🥇', '🥈', '🥉'];

// Or with components
const RankBadge = ({ position }) => {
  if (position === 1) return <GoldMedal />;
  if (position === 2) return <SilverMedal />;
  if (position === 3) return <BronzeMedal />;
  return <span>{position}</span>;
};
```

---

## TESTING SCENARIOS

### Test Case 1: View Leaderboard

1. Navigate to /community/leaderboard
2. **Expected:** Rankings list loads
3. **Verify:** Top users displayed with correct order

### Test Case 2: Current User Highlight

1. View leaderboard as logged-in user
2. **Expected:** Your row highlighted (teal/lime)
3. **Verify:** Position number correct

### Test Case 3: Top 3 Treatment

1. View users in positions 1-3
2. **Expected:** Medals displayed (🥇🥈🥉)
3. **Verify:** Visually distinct from others

### Test Case 4: Switch Category

1. Change category (e.g., to "Builds")
2. **Expected:** Rankings update
3. **Verify:** Order changes based on metric

### Test Case 5: Switch Time Period

1. Change from "All Time" to "This Week"
2. **Expected:** Rankings recalculate
3. **Verify:** Points/scores reflect time period

### Test Case 6: Points Formatting

1. Check user with 12450 points
2. **Expected:** Displays as "12,450 pts"
3. **Verify:** Monospace font, right-aligned

### Test Case 7: Mobile View

1. View on mobile device
2. **Expected:** Table adapts/scrolls
3. **Verify:** Core info visible, 44px rows

---

## AUTOMATED CHECKS

```bash
# 1. Check for hardcoded colors
grep -rn "#[0-9a-fA-F]\{3,6\}" app/\(app\)/community/leaderboard/*.jsx app/\(app\)/community/LeaderboardView*.jsx app/\(app\)/community/LeaderboardView*.css

# 2. Check for design tokens
grep -rn "accent-teal\|accent-lime" app/\(app\)/community/LeaderboardView*.jsx app/\(app\)/community/LeaderboardView*.css

# 3. Check for table semantics
grep -rn "<table\|<thead\|<tbody\|<th\|scope=" app/\(app\)/community/LeaderboardView*.jsx

# 4. Check for monospace on points
grep -rn "font-mono\|monospace" app/\(app\)/community/LeaderboardView*.jsx app/\(app\)/community/LeaderboardView*.css

# 5. Check for toLocaleString
grep -rn "toLocaleString" app/\(app\)/community/LeaderboardView*.jsx

# 6. Check for console.log
grep -rn "console\.log" app/\(app\)/community/leaderboard/*.jsx app/\(app\)/community/LeaderboardView*.jsx
```

---

## CROSS-REFERENCE WITH FOUNDATION AUDITS

| Audit | Check On This Page |
|-------|-------------------|
| D. UI/UX | Table patterns, highlighting |
| E. Accessibility | Table semantics, screen reader |
| A. Performance | Large list rendering |
| H. API | Leaderboard endpoint |

---

## DELIVERABLES

### 1. Functionality Report

| Feature | Works | Issues |
|---------|-------|--------|
| Rankings load | ✅/❌ | |
| Current user highlight | ✅/❌ | |
| Category switch | ✅/❌ | |
| Time period switch | ✅/❌ | |
| Top 3 medals | ✅/❌ | |

### 2. Ranking Display Compliance

| Element | Expected | Actual | Status |
|---------|----------|--------|--------|
| 1st place | Gold medal | | ✅/❌ |
| 2nd place | Silver medal | | ✅/❌ |
| 3rd place | Bronze medal | | ✅/❌ |
| Current user | Highlighted | | ✅/❌ |
| Points | Monospace, commas | | ✅/❌ |

### 3. Issues Found

| Severity | Issue | File:Line | Fix |
|----------|-------|-----------|-----|
| | | | |

---

## VERIFICATION

- [ ] Table uses proper semantics
- [ ] Top 3 have medals
- [ ] Current user highlighted
- [ ] Points formatted with commas
- [ ] Monospace font for numbers
- [ ] Mobile responsive

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | Leaderboard displays rankings |
| 2 | Top 3 have medals (🥇🥈🥉) |
| 3 | Current user row highlighted |
| 4 | Points formatted with commas |
| 5 | Proper table accessibility |
| 6 | Category/time filters work |
| 7 | No critical/high issues remaining |

---

## OUTPUT FORMAT

```
🏆 PAGE AUDIT: /community/leaderboard

**Status:** ✅ Pass / ⚠️ Issues / ❌ Fail

**Ranking Display Compliance:** ✅ / ❌
- Top 3 medals: ✅
- Current user: Highlighted ✅
- Points format: Commas ✅
- Monospace: ✅

**Functionality:**
- [x] Rankings load
- [x] Top 3 treatment
- [x] Current user highlight
- [ ] Time filter broken (issue #1)

**Issues Found:**
1. [Medium] "This Week" filter returns all time data
2. [Low] Points missing "pts" unit label
...

**Test Results:**
- View rankings: ✅
- Current user: ✅
- Top 3: ✅
- Categories: ✅
- Time period: ❌
```

---

## AUDIT EXECUTION LOG

| Date | Auditor | Status | Issues Fixed | Notes |
|------|---------|--------|--------------|-------|
| | | | | |

---

*Audit prompt generated: January 25, 2026*  
*Part of AutoRev Systematic Audit Suite (36 total audits)*
