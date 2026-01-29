# 'use client' Directive Audit

Generated: 2026-01-08

## Summary

Audited 99 components with `'use client'` directive. Most are legitimate client components requiring hooks, event handlers, or browser APIs.

## Already Converted (Previous Session)

These components were converted from client to server during the landing page performance work:

- `components/landing/LandingTestimonial.jsx` - Removed useState for image error handling
- `components/IPhoneFrame.jsx` - Was client for no reason

## Candidates Reviewed (No Action Needed)

The following components have low hook usage but legitimately need `'use client'`:

| Component | Reason for 'use client' |
|-----------|------------------------|
| `CarDetailSections.jsx` | Uses React Query hooks (useCarEfficiency, etc.) |
| `BetaBanner.jsx` | Uses useEffect, usePathname, BannerProvider context |
| `PillarsSection.jsx` | Uses useMemo for pillar data computation |
| `IntentStep.jsx` | Has onClick handlers for toggle buttons |
| `BuildDetailView.jsx` | Uses useMemo for computed build data |
| `ArticleShareButtons.jsx` | Uses onClick for share actions |
| `EventCategoryPill.jsx` | Uses onClick for filter toggles |

## Landing Components Status

| Component | Status | Notes |
|-----------|--------|-------|
| `LandingHero.jsx` | Client | Video state management, IntersectionObserver |
| `LandingAL.jsx` | Client | Video state, IntersectionObserver |
| `LandingProblem.jsx` | Server | No client features needed |
| `LandingCTA.jsx` | Client | trackEvent onClick handlers |
| `LandingTestimonial.jsx` | **Server** | Converted - removed useState |
| `LandingTracking.jsx` | Client | Analytics tracking on mount |
| `FeatureShowcase.jsx` | Server | Just renders Image components |

## Recommendations

### No Further Conversions Recommended

Most components genuinely need client features. The low-hanging fruit has been picked:
- LandingTestimonial → Server ✓
- IPhoneFrame → Server ✓

### Future Opportunities (Lower Priority)

If we want to pursue further:

1. **Component Splitting**: Some large client components could be split into:
   - Server component for static content
   - Client component for interactive parts
   
   Examples:
   - `BuildDetailView.jsx` - Large static content with small interactive parts
   - `CarDetailSections.jsx` - Could render static parts server-side

2. **Analytics Refactor**: 
   - `LandingCTA.jsx` is client only for `trackEvent` calls
   - Could use a server action or API route pattern instead
   - Low priority - analytics timing matters less than initial render

## Metrics

- Total client components: 99
- Legitimately client: ~97
- Already converted: 2
- Potential future candidates: 2-3 (low priority)

## Conclusion

The 'use client' audit found minimal optimization opportunities. The codebase already has a reasonable server/client split. The bigger performance wins will come from:

1. Route group split (reduce JS shipped to marketing pages)
2. Carousel/hero image optimization (reduce LCP)
3. Asset re-encoding (reduce transfer size)
