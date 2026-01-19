# CSS Migration Audit Report

> **Generated:** January 2026  
> **Goal:** Migrate all hardcoded values to design token system

---

## Executive Summary

| Metric | Count | Files |
|--------|-------|-------|
| **Hardcoded Colors** | 3,629 | 191 |
| **Hardcoded Spacing** | 3,365 | 157 |
| **Hardcoded Font Sizes** | 2,347 | 135 |
| **Hardcoded Border Radius** | 1,756 | 171 |
| **Total Hardcoded Values** | ~11,100 | - |

### Migration Estimate

| Priority | Files | Est. Hours | Sprint |
|----------|-------|------------|--------|
| Critical (PWA Core) | 25 | 20-25 | 1 |
| High (Components) | 40 | 25-30 | 2 |
| Medium (Marketing) | 30 | 15-20 | 3 |
| Low (Admin/Internal) | 50 | 20-25 | 4 |

---

## Priority 1: Critical Path (PWA Core)

These files are seen by EVERY user on the mobile app:

### Navigation & Shell
| File | Colors | Spacing | Priority |
|------|--------|---------|----------|
| `components/BottomTabBar.module.css` | 5 | 11 | 🔴 |
| `components/Header.module.css` | 58 | 33 | 🔴 |
| `app/(app)/layout.module.css` | 2 | - | 🔴 |

### Garage Pages (Primary User Flow)
| File | Colors | Spacing | Priority |
|------|--------|---------|----------|
| `app/(app)/garage/page.module.css` | 167 | 328 | ✅ DONE |
| `app/(app)/garage/my-specs/page.module.css` | 12 | 19 | ✅ DONE |
| `app/(app)/garage/my-build/page.module.css` | 4 | 7 | ✅ DONE |
| `app/(app)/garage/my-performance/page.module.css` | 13 | 25 | ✅ DONE |
| `app/(app)/garage/my-parts/page.module.css` | 4 | 12 | ✅ DONE |
| `app/(app)/garage/my-photos/page.module.css` | 9 | 14 | ✅ DONE |
| `app/(app)/garage/builds/page.module.css` | 17 | 32 | ✅ DONE |
| `app/(app)/garage/tuning-shop/page.module.css` | 9 | 16 | 🔴 |

### AL Chat (High Engagement)
| File | Colors | Spacing | Priority |
|------|--------|---------|----------|
| `components/AIMechanicChat.module.css` | 224 | 178 | 🔴 |
| `app/(app)/al/page.module.css` | 24 | 28 | 🔴 |
| `components/AIChatLauncher.module.css` | 3 | - | 🔴 |
| `components/AskALButton.module.css` | 3 | 7 | 🔴 |

### Data & Community
| File | Colors | Spacing | Priority |
|------|--------|---------|----------|
| `app/(app)/data/page.module.css` | 60 | 36 | 🔴 |
| `app/(app)/community/page.module.css` | 6 | 25 | 🔴 |
| `app/(app)/community/BuildDetailSheet.module.css` | 13 | 21 | 🔴 |

### Profile & My Builds
| File | Colors | Spacing | Priority |
|------|--------|---------|----------|
| `app/(app)/profile/page.module.css` | 75 | 8 | 🔴 |
| `app/(app)/my-builds/page.module.css` | 64 | 17 | 🔴 |

---

## Priority 2: High-Impact Components

These components are used across multiple pages:

### Build System Components
| File | Colors | Spacing | Priority |
|------|--------|---------|----------|
| `components/UpgradeCenter.module.css` | 144 | 485 | 🟠 |
| `components/BuildWizard.module.css` | 88 | 5 | 🟠 |
| `components/BuildEditor.module.css` | 32 | - | 🟠 |
| `components/BuildDetailView.module.css` | 15 | 6 | 🟠 |
| `components/BuildsWorkshop.module.css` | 19 | 30 | 🟠 |

### Performance Visualization
| File | Colors | Spacing | Priority |
|------|--------|---------|----------|
| `components/VirtualDynoChart.module.css` | 4 | 19 | 🟠 |
| `components/PerformanceHub.module.css` | 63 | 54 | 🟠 |
| `components/LapTimeEstimator.module.css` | 24 | 89 | 🟠 |
| `components/PowerBreakdown.module.css` | 2 | 7 | 🟠 |
| `components/CalculatedPerformance.module.css` | 1 | 7 | 🟠 |

### Modals & Overlays
| File | Colors | Spacing | Priority |
|------|--------|---------|----------|
| `components/AddVehicleModal.module.css` | 49 | - | 🟠 |
| `components/VehicleSelectModal.module.css` | 3 | 9 | 🟠 |
| `components/CompareModal.module.css` | 14 | - | 🟠 |
| `components/UpgradeDetailModal.module.css` | 41 | - | 🟠 |
| `components/SlideUpPanel.module.css` | 13 | 1 | 🟠 |
| `components/ServiceLogModal.module.css` | 14 | 20 | 🟠 |

### Tuning Shop Components
| File | Colors | Spacing | Priority |
|------|--------|---------|----------|
| `app/(app)/tuning-shop/page.module.css` | 77 | 152 | 🟠 |
| `components/tuning-shop/PartsSelector.module.css` | 6 | 27 | 🟠 |
| `components/tuning-shop/BuildSummaryBar.module.css` | 28 | 5 | 🟠 |
| `components/tuning-shop/WheelTireConfigurator.module.css` | 8 | 66 | 🟠 |
| `components/tuning-shop/CategoryNav.module.css` | 8 | 11 | 🟠 |

---

## Priority 3: Marketing & Landing Pages

### Homepage & Marketing
| File | Colors | Spacing | Priority |
|------|--------|---------|----------|
| `app/(marketing)/page.module.css` | 10 | 41 | 🟡 |
| `app/(marketing)/features/page.module.css` | 4 | 3 | 🟡 |
| `app/(marketing)/join/page.module.css` | 5 | 3 | 🟡 |
| `app/(marketing)/encyclopedia/page.module.css` | 43 | - | 🟡 |

### Community Builds (Public)
| File | Colors | Spacing | Priority |
|------|--------|---------|----------|
| `app/(marketing)/community/builds/page.module.css` | 10 | - | 🟡 |
| `app/(marketing)/community/builds/[slug]/page.module.css` | 9 | 18 | 🟡 |
| `app/(marketing)/community/builds/[slug]/BuildModsList.module.css` | 15 | 31 | 🟡 |

### Articles & Compare
| File | Colors | Spacing | Priority |
|------|--------|---------|----------|
| `app/(marketing)/articles/[category]/[slug]/page.module.css` | 9 | - | 🟡 |
| `app/(marketing)/compare/[slug]/page.module.css` | 13 | - | 🟡 |

---

## Priority 4: Admin & Internal (Lower Priority)

### Admin Dashboard
| File | Colors | Spacing | Priority |
|------|--------|---------|----------|
| `app/admin/page.module.css` | 23 | 69 | 🟢 |
| `app/admin/components/StripeDashboard.module.css` | 52 | 49 | 🟢 |
| `app/admin/components/EmailDashboard.module.css` | 55 | 45 | 🟢 |
| (30+ more admin components) | ... | ... | 🟢 |

### Internal Tools
| File | Colors | Spacing | Priority |
|------|--------|---------|----------|
| `app/internal/car-pipeline/page.module.css` | 51 | - | 🟢 |
| `app/internal/errors/errors.module.css` | 46 | - | 🟢 |
| `app/internal/feedback/page.module.css` | 44 | - | 🟢 |
| (10+ more internal pages) | ... | ... | 🟢 |

---

## Component-Level Statistics

### Top 10 Files by Hardcoded Colors
1. `components/AIMechanicChat.module.css` - **224**
2. `app/(app)/garage/page.module.css` - **167** ✅ DONE
3. `components/UpgradeCenter.module.css` - **144**
4. `components/FeedbackWidget.module.css` - **100**
5. `components/BuildWizard.module.css` - **88**
6. `app/(app)/tuning-shop/page.module.css` - **77**
7. `app/(app)/profile/page.module.css` - **75**
8. `components/PerformanceHub.module.css` - **63**
9. `app/(app)/data/page.module.css` - **60**
10. `components/Header.module.css` - **58**

### Top 10 Files by Hardcoded Spacing
1. `components/UpgradeCenter.module.css` - **485**
2. `app/(app)/garage/page.module.css` - **328** ✅ DONE
3. `components/AIMechanicChat.module.css` - **178**
4. `app/(app)/tuning-shop/page.module.css` - **152**
5. `components/LapTimeEstimator.module.css` - **89**
6. `components/FeedbackWidget.module.css` - **79**
7. `app/admin/page.module.css` - **69**
8. `components/tuning-shop/WheelTireConfigurator.module.css` - **66**
9. `components/SportsCarComparison.module.css` - **68**
10. `components/ReferralPanel.module.css` - **55**

---

## Validation Commands

Run these commands to track migration progress:

```bash
# Count remaining hardcoded colors
grep -r "#[0-9a-fA-F]\{6\}" --include="*.css" app/ components/ | wc -l

# Count remaining hardcoded spacing
grep -rE "padding:\s*\d+px|margin:\s*\d+px|gap:\s*\d+px" --include="*.css" app/ components/ | wc -l

# Find files still using old colors
grep -rl "#ff4d00\|#4ade80\|#22c55e\|#ffc107" --include="*.css" app/ components/
```

---

## Migration Checklist Per File

For each file migration, verify:

- [ ] All hex colors replaced with `var(--color-*)`
- [ ] All spacing replaced with `var(--space-*)`
- [ ] All font-sizes replaced with `var(--text-*)`
- [ ] All border-radius replaced with `var(--radius-*)`
- [ ] Touch targets minimum 44px
- [ ] Safe area insets for bottom-fixed elements
- [ ] No conflicting styles with globals.css
- [ ] Tested on mobile viewport (375px)
- [ ] Tested on tablet viewport (768px)

---

## Next Steps

1. **Start with Priority 1** - These are seen by every user
2. **Focus on components** - They multiply impact
3. **Use automation where possible** - Search/replace patterns
4. **Test thoroughly** - Mobile-first on real devices
