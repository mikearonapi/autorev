# Build Pivot Pre-Launch Checklist

## Date: January 2026
## Branch: `feature/build-pivot`

---

## ✅ Completed Tasks

### UI/UX Implementation
- [x] Created BottomTabBar component for native app navigation
- [x] Created SlideUpPanel for native-style detail views  
- [x] Created BuildWizard full-screen onboarding flow
- [x] Created CarPickerFullscreen for improved car selection
- [x] Redesigned Tuning Shop with GRAVL-style cards
- [x] Redesigned Parts page with filterable list and detail view
- [x] Updated Header for marketing vs app page contexts
- [x] Updated Footer to hide on app pages
- [x] Updated globals.css with GRAVL-inspired generous spacing
- [x] Updated OpenGraph images for Build-focused branding

### Technical
- [x] Build compiles successfully (`npm run build`)
- [x] No linting errors in new components
- [x] Fixed Supabase auth-helpers import issue
- [x] All changes committed to feature branch

---

## 🔲 Pre-Merge Checklist

### Manual Testing (Recommended Before Merge)
- [ ] Test homepage loads correctly
- [ ] Test Build Wizard flow end-to-end
- [ ] Test Tuning Shop page functionality
- [ ] Test Parts page filtering and detail panel
- [ ] Test My Builds page with slide-up details
- [ ] Test Bottom Tab Bar navigation on mobile
- [ ] Test Header/Footer behavior on different pages
- [ ] Verify dark theme looks correct throughout

### Mobile Testing
- [ ] iPhone Safari (375px)
- [ ] iPhone Safari (414px)
- [ ] iPad Safari (768px)
- [ ] Android Chrome (360px)

### Desktop Testing
- [ ] Chrome (1920x1080)
- [ ] Safari (1440x900)
- [ ] Firefox (1920x1080)
- [ ] Edge (1920x1080)

### Performance Checks
- [ ] Lighthouse score > 80 on mobile
- [ ] No significant bundle size increase
- [ ] Images load efficiently

---

## 🚀 Deployment Steps

### 1. Create Preview Deployment
```bash
# Push to feature branch (triggers Vercel preview)
git push origin feature/build-pivot
```

### 2. Test Preview URL
- Verify all pages work on preview URL
- Test on multiple devices

### 3. Merge to Main
```bash
git checkout main
git pull origin main
git merge feature/build-pivot
git push origin main
```

### 4. Verify Production
- Check autorev.app for deployed changes
- Monitor error logs
- Test critical user flows

---

## 🔙 Rollback Plan

If issues are discovered post-merge:

```bash
# Option 1: Revert the merge commit
git revert -m 1 <merge-commit-hash>
git push origin main

# Option 2: Reset to pre-merge state
git checkout main
git reset --hard v1.0-pre-pivot
git push origin main --force
```

---

## 📝 Notes

### New Components Created
| Component | Purpose |
|-----------|---------|
| `BottomTabBar.jsx` | Native app-style bottom navigation |
| `SlideUpPanel.jsx` | iOS-style slide-up detail panels |
| `BuildWizard.jsx` | Full-screen new build onboarding |
| `CarPickerFullscreen.jsx` | Full-screen car selection |

### Modified Files
- `app/(app)/layout.jsx` - Added bottom tab bar
- `app/(app)/tuning-shop/page.jsx` - GRAVL redesign
- `app/(app)/parts/page.jsx` - Filterable list design
- `app/(app)/my-builds/page.jsx` - Slide-up details
- `components/Header.jsx` - Conditional rendering
- `components/Footer.jsx` - Hidden on app pages
- `app/globals.css` - GRAVL spacing system

### Design System Changes
- Spacing scale increased (more generous)
- Bottom nav bar height: 68px + safe area
- Slide-up panel heights: full/half/auto
- Card border radius: 12px
- Accent color: #ff4d00 (performance orange)
