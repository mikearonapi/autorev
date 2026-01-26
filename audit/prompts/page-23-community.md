# PAGE AUDIT: /community - Builds Feed

> **Audit ID:** Page-23  
> **Category:** Community Page  
> **Priority:** 22 of 36  
> **Route:** `/community`  
> **Auth Required:** Yes  
> **Layout:** Shared community layout with tabs

---

## PAGE OVERVIEW

The Community Builds Feed displays **shared vehicle builds** from the AutoRev community. Users can browse, like, comment, and share builds.

**Key Features:**
- Build cards feed
- Like/save functionality
- Comments on builds
- Build detail sheet
- Filtering/sorting
- Infinite scroll or pagination

---

## FILES TO EXAMINE

### Page Files

| File | Purpose |
|------|---------|
| `app/(app)/community/page.jsx` | Main builds feed |
| `app/(app)/community/page.module.css` | Feed styles |
| `app/(app)/community/layout.jsx` | Community layout |
| `app/(app)/community/layout.module.css` | Layout styles |

### Navigation

| File | Purpose |
|------|---------|
| `app/(app)/community/CommunityNav.jsx` | Tab navigation |
| `app/(app)/community/CommunityNav.module.css` | Nav styles |

### Detail Views

| File | Purpose |
|------|---------|
| `app/(app)/community/BuildDetailSheet.jsx` | Build detail modal |
| `app/(app)/community/BuildDetailSheet.module.css` | Detail styles |
| `app/(app)/community/CommentsSheet.jsx` | Comments modal |
| `app/(app)/community/CommentsSheet.module.css` | Comments styles |

### Related Services

| File | Purpose |
|------|---------|
| `lib/communityService.js` | Community data |
| `app/api/community/` | Community API routes |
| `hooks/useFavorites.js` | Like/save state |

---

## CRITICAL: Read These First

Before making ANY changes:

1. `docs/SOURCE_OF_TRUTH.md` - Community section, Build sharing
2. `docs/BRAND_GUIDELINES.md` - Card patterns, Social interactions
3. Cross-cutting audit findings:
   - D (UI/UX) - Card patterns, social UI
   - E (Accessibility) - Interactive elements
   - I (State) - Optimistic updates

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY code:

1. ✅ Verify builds load correctly
2. ✅ Test like/save functionality
3. ✅ Check comments work
4. ❌ Do NOT change feed algorithm without understanding
5. ❓ If likes don't persist, check FavoritesProvider

---

## CHECKLIST

### A. Functionality

- [ ] Feed loads community builds
- [ ] Build cards display correctly
- [ ] Can like/unlike builds
- [ ] Can save/unsave builds
- [ ] Can view build details
- [ ] Can view/add comments
- [ ] Infinite scroll or pagination works
- [ ] Filter/sort options work

### B. Data Flow

- [ ] Uses community API correctly
- [ ] Uses `useFavorites()` for like state
- [ ] Uses React Query for caching
- [ ] Optimistic updates for likes
- [ ] Proper invalidation on changes

### C. UI/UX Design System

- [ ] **Like button** = Lime when active
- [ ] **Save button** = Teal when saved
- [ ] **Comments** = Standard interaction
- [ ] **Cards** = Dark card pattern
- [ ] No hardcoded colors
- [ ] 44px touch targets

### D. Build Card Layout

```
┌─────────────────────────────────────┐
│  [Vehicle Image]                    │
│                                     │
├─────────────────────────────────────┤
│  2024 BMW M3 Competition            │
│  @username · 3 days ago             │
│                                     │
│  "Stage 2 build with FBO..."        │
│                                     │
│  +145 HP  +89 TQ                    │
│  (teal)   (teal)                    │
│                                     │
│  ❤️ 42    💬 8    [Share]           │
└─────────────────────────────────────┘
```

- [ ] Vehicle image prominent
- [ ] Year/Make/Model clear
- [ ] Username with @ prefix
- [ ] Timestamp relative
- [ ] Description truncated
- [ ] Gains in teal
- [ ] Social counts visible
- [ ] Touch targets adequate

### E. Like/Save Interactions

| State | Like Button | Save Button |
|-------|-------------|-------------|
| Default | Heart outline | Bookmark outline |
| Active | Filled lime | Filled teal |
| Loading | Disabled | Disabled |

- [ ] Instant visual feedback
- [ ] Optimistic updates
- [ ] Rollback on error
- [ ] Count updates correctly

### F. Build Detail Sheet

- [ ] Opens on card tap
- [ ] Full build info visible
- [ ] Mod list displayed
- [ ] Performance gains shown
- [ ] Photos gallery
- [ ] Comments accessible
- [ ] Share button works
- [ ] Close button (44px)

### G. Comments Sheet

- [ ] Opens from build detail
- [ ] Existing comments load
- [ ] Can add new comment
- [ ] Comment saves correctly
- [ ] Shows commenter info
- [ ] Timestamps relative
- [ ] Input accessible

### H. Community Navigation

- [ ] Tabs: Builds / Events / Leaderboard
- [ ] Active tab highlighted
- [ ] Tab switch smooth
- [ ] URL updates correctly

### I. Loading States

- [ ] Skeleton cards while loading
- [ ] Loading indicator for more
- [ ] Detail sheet loading state
- [ ] Comments loading state

### J. Empty States

- [ ] No builds found (with filters)
- [ ] No comments yet
- [ ] Error loading feed

### K. Accessibility

- [ ] Cards keyboard navigable
- [ ] Like/save buttons labeled
- [ ] Comments form accessible
- [ ] Sheet focus management
- [ ] Screen reader announces likes

### L. Mobile Responsiveness

- [ ] Cards full-width on mobile
- [ ] Bottom sheet pattern
- [ ] Touch-friendly interactions
- [ ] 44px touch targets

---

## SPECIFIC CHECKS

### Build Card Component

```javascript
// Build card should follow pattern
const BuildCard = ({ build }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  
  return (
    <article className={styles.card}>
      <Image src={build.image} alt={`${build.car_name}`} />
      <div className={styles.content}>
        <h3>{build.year} {build.make} {build.model}</h3>
        <p className={styles.author}>@{build.username}</p>
        <p className={styles.description}>{build.description}</p>
        <div className={styles.gains}>
          <span className={styles.hpGain}>+{build.hp_gain} HP</span>
          <span className={styles.tqGain}>+{build.tq_gain} TQ</span>
        </div>
        <div className={styles.actions}>
          <button 
            onClick={() => toggleFavorite(build.id)}
            className={isFavorite(build.id) ? styles.liked : ''}
            aria-label={isFavorite(build.id) ? 'Unlike' : 'Like'}
          >
            ❤️ {build.like_count}
          </button>
        </div>
      </div>
    </article>
  );
};
```

### Optimistic Like Pattern

```javascript
// Likes should use optimistic updates
const toggleLike = useMutation({
  mutationFn: (buildId) => likeService.toggle(buildId),
  onMutate: async (buildId) => {
    await queryClient.cancelQueries(['builds']);
    const previous = queryClient.getQueryData(['builds']);
    queryClient.setQueryData(['builds'], (old) =>
      old.map(b => b.id === buildId 
        ? { ...b, liked: !b.liked, like_count: b.liked ? b.like_count - 1 : b.like_count + 1 }
        : b
      )
    );
    return { previous };
  },
  onError: (err, buildId, context) => {
    queryClient.setQueryData(['builds'], context.previous);
  },
});
```

### Infinite Scroll Pattern

```javascript
// Feed should use infinite scroll
const { 
  data, 
  fetchNextPage, 
  hasNextPage, 
  isFetchingNextPage 
} = useInfiniteQuery({
  queryKey: ['builds', filters],
  queryFn: ({ pageParam = 0 }) => fetchBuilds({ page: pageParam, ...filters }),
  getNextPageParam: (lastPage) => lastPage.nextPage,
});
```

---

## TESTING SCENARIOS

### Test Case 1: Browse Feed

1. Navigate to /community
2. **Expected:** Grid of build cards loads
3. **Verify:** Cards display correctly, images load

### Test Case 2: Like a Build

1. Click like on a build
2. **Expected:** Heart fills lime, count increases
3. **Verify:** Persists on refresh

### Test Case 3: Unlike a Build

1. Click like on already-liked build
2. **Expected:** Heart unfills, count decreases
3. **Verify:** Instant feedback

### Test Case 4: View Build Detail

1. Tap on a build card
2. **Expected:** Detail sheet opens
3. **Verify:** Full mod list, photos, gains

### Test Case 5: Add Comment

1. Open comments on a build
2. Type and submit comment
3. **Expected:** Comment appears in list
4. **Verify:** Persists, shows your username

### Test Case 6: Tab Navigation

1. Switch between Builds/Events/Leaderboard
2. **Expected:** Content changes, URL updates
3. **Verify:** Back button works correctly

### Test Case 7: Empty/Error State

1. Apply filters with no results
2. **Expected:** Helpful empty state message
3. **Verify:** Suggests removing filters

---

## AUTOMATED CHECKS

```bash
# 1. Check for hardcoded colors
grep -rn "#[0-9a-fA-F]\{3,6\}" app/\(app\)/community/*.jsx app/\(app\)/community/*.css

# 2. Check for design tokens
grep -rn "accent-lime\|accent-teal" app/\(app\)/community/*.jsx

# 3. Check for optimistic updates
grep -rn "onMutate\|optimistic" app/\(app\)/community/*.jsx

# 4. Check for touch targets
grep -rn "h-11\|min-h-\[44px\]" app/\(app\)/community/*.jsx

# 5. Check for accessible buttons
grep -rn "aria-label\|aria-pressed" app/\(app\)/community/*.jsx

# 6. Check for console.log
grep -rn "console\.log" app/\(app\)/community/*.jsx
```

---

## CROSS-REFERENCE WITH FOUNDATION AUDITS

| Audit | Check On This Page |
|-------|-------------------|
| D. UI/UX | Card patterns, social interactions |
| E. Accessibility | Interactive elements, focus |
| I. State | Optimistic updates, caching |
| A. Performance | Infinite scroll, image loading |

---

## DELIVERABLES

### 1. Functionality Report

| Feature | Works | Issues |
|---------|-------|--------|
| Feed loads | ✅/❌ | |
| Like/unlike | ✅/❌ | |
| Save/unsave | ✅/❌ | |
| Build detail | ✅/❌ | |
| Comments | ✅/❌ | |
| Pagination | ✅/❌ | |

### 2. Social Interaction Compliance

| Element | Expected | Actual | Status |
|---------|----------|--------|--------|
| Like active | Lime | | ✅/❌ |
| Save active | Teal | | ✅/❌ |
| Gains display | Teal | | ✅/❌ |
| Touch targets | 44px | | ✅/❌ |

### 3. Issues Found

| Severity | Issue | File:Line | Fix |
|----------|-------|-----------|-----|
| | | | |

---

## VERIFICATION

- [ ] Build cards follow design pattern
- [ ] Like/save use correct colors
- [ ] Optimistic updates implemented
- [ ] Infinite scroll works
- [ ] Comments functional
- [ ] Mobile responsive

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | Feed loads community builds |
| 2 | Like = lime when active |
| 3 | Gains displayed in teal |
| 4 | Optimistic updates smooth |
| 5 | Build detail sheet works |
| 6 | Comments can be added |
| 7 | No critical/high issues remaining |

---

## OUTPUT FORMAT

```
👥 PAGE AUDIT: /community (Builds Feed)

**Status:** ✅ Pass / ⚠️ Issues / ❌ Fail

**Social Compliance:** ✅ / ❌
- Like active: Lime ✅
- Save active: Teal ✅
- Gains: Teal ✅

**Functionality:**
- [x] Feed loads
- [x] Like/unlike
- [ ] Comments broken (issue #1)

**Issues Found:**
1. [High] Comments don't save
2. [Medium] Like button too small (36px)
...

**Test Results:**
- Browse feed: ✅
- Like: ✅
- Unlike: ✅
- Build detail: ✅
- Comments: ❌
```

---

## AUDIT EXECUTION LOG

| Date | Auditor | Status | Issues Fixed | Notes |
|------|---------|--------|--------------|-------|
| | | | | |

---

*Audit prompt generated: January 25, 2026*  
*Part of AutoRev Systematic Audit Suite (36 total audits)*
