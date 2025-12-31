# Mobile Cross-Device Testing Strategy

## Overview

AutoRev must work flawlessly across all mobile devices, not just iPhones. This document outlines our testing strategy and standards.

## Critical Viewport Breakpoints

Always test against these device widths (CSS pixels):

| Tier | Width | Devices |
|------|-------|---------|
| **XS (Minimum)** | 320px | iPhone SE 1st gen, older Android |
| **S (Android baseline)** | 360px | Samsung Galaxy S/A series, ~30% of Android market |
| **M (iPhone standard)** | 375-393px | iPhone 12-15, iPhone SE 2/3 |
| **L (Large phones)** | 412-430px | Pixel phones, iPhone Plus/Pro Max |

## Golden Rule: Design for 360px, Enhance for Larger

If it works at 360px, it works everywhere. Samsung's 360px viewport is the practical minimum for modern responsive design.

## Testing Checklist

### Before Every Mobile CSS Change:

1. **Open Chrome DevTools** → Device Toolbar (Ctrl/Cmd + Shift + M)
2. **Test these exact devices:**
   - Samsung Galaxy S20 (360 × 800)
   - Samsung Galaxy A51/71 (412 × 914)  
   - iPhone 12/13/14 (390 × 844)
   - iPhone SE (375 × 667)
   - Pixel 5 (393 × 851)
   
3. **Custom viewport test:** Set to exactly 320px wide to verify nothing breaks

### Visual Regression Tests

Run Playwright visual tests before merging:
```bash
npm run test:visual
```

## CSS Patterns for Cross-Device Compatibility

### ❌ Avoid

```css
/* Fixed pixel widths */
width: 350px;

/* Assuming viewport won't be smaller than iPhone */
@media (max-width: 390px) { ... }

/* Preventing text wrap on critical headlines */
white-space: nowrap;

/* Hard-coded font sizes that don't scale */
font-size: 32px;
```

### ✅ Use Instead

```css
/* Flexible widths with constraints */
width: 100%;
max-width: 350px;
min-width: min(280px, 100%);

/* Content-based breakpoints, not device-based */
@media (max-width: 360px) { ... } /* Samsung baseline */

/* Allow wrapping with controlled breaks */
white-space: normal;
/* OR use word-break for controlled wrapping */
word-break: break-word;
overflow-wrap: break-word;

/* Fluid typography with safe minimums */
font-size: clamp(1.5rem, 5vw, 2.5rem);
```

### Fluid Typography Formula

For hero text that must scale:
```css
/* Formula: clamp(minimum, preferred, maximum) */
/* preferred = (min + max) / 2 in vw units */

/* For hero titles: */
font-size: clamp(1.75rem, 5vw + 0.5rem, 3rem);

/* This gives:
   - 360px viewport: ~28px
   - 390px viewport: ~30px  
   - 430px viewport: ~32px
*/
```

## Handling Text That Might Overflow

### Option 1: Allow Wrapping (Preferred)
```css
.heroTitle {
  white-space: normal; /* Allow wrapping */
  text-wrap: balance; /* Modern browsers: balanced line breaks */
}
```

### Option 2: Scale Font Based on Container
```css
.heroTitle {
  font-size: clamp(1.5rem, 8vw, 3rem);
  max-width: 100%;
  overflow-wrap: break-word;
}
```

### Option 3: Use Container Queries (Best)
```css
@container hero (max-width: 360px) {
  .heroTitle {
    font-size: 1.5rem;
  }
}
```

## Browser DevTools Quick Reference

### Chrome (Recommended for Android testing)
1. Open DevTools (F12)
2. Click device toolbar icon (or Ctrl+Shift+M)
3. Select "Samsung Galaxy S20" from dropdown
4. Also test "Responsive" mode at 320px, 360px, 375px

### Safari (Required for iOS testing)
1. Develop → Enter Responsive Design Mode
2. Select different iOS devices
3. Note: Safari rendering can differ from Chrome

### Firefox
1. Ctrl+Shift+M for Responsive Design Mode
2. Add custom device profiles for Samsung devices

## Real Device Testing

For production releases, test on actual devices:

- **BrowserStack** - Cloud-based real device testing
- **Samsung Remote Test Lab** - Free testing on Samsung devices
- **Physical devices** - Keep an Android phone for testing

## Common Cross-Device Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Text cut off | `white-space: nowrap` on narrow viewport | Remove or make conditional |
| Buttons too small | Fixed pixel sizes | Use `min-height: 44px` |
| Horizontal scroll | Fixed-width elements | Use `max-width: 100%` |
| Layout breaking | Absolute positioning | Use flexbox/grid |
| Images overflowing | Missing `max-width` | Add `max-width: 100%` |

## Integration with CI/CD

Add Playwright visual regression tests to PR checks:

```yaml
# .github/workflows/visual-test.yml
- name: Visual Regression Tests
  run: npx playwright test --project=mobile-chrome
```

---

## Summary

1. **Always start at 360px** - Samsung's baseline
2. **Test 4 viewports minimum** - 320, 360, 390, 430
3. **Use fluid units** - clamp(), vw, %
4. **Allow text to wrap** - Never assume single-line headlines fit
5. **Run visual tests** - Catch regressions before users do

