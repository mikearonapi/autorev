# F. Android PWA Safe Area & Display Cutout Audit

> **Priority:** High  
> **Impact:** Android PWA experience (50%+ of mobile users)  
> **Goal:** Ensure safe area CSS and PWA features work correctly on Android devices with notches/cutouts

---

## CONTEXT

We've implemented iOS safe area handling using `env(safe-area-inset-*)` CSS environment variables with automatic color switching via `:has()` selectors. We need to verify and optimize this implementation for Android devices.

### Current Implementation (in `app/globals.css`)

```css
/* Safe area fills using env() with fallbacks */
body::before {
  height: env(safe-area-inset-top, 0px);
  background: var(--color-bg-base, #0d1b2a);
  z-index: 10000;
}

/* Automatic color switching when overlay modals are present */
body:has([data-overlay-modal])::before {
  background: var(--brand-bg-overlay, #1a1a1a);
}
```

---

## ANDROID-SPECIFIC CONSIDERATIONS

### 1. Display Cutout Modes

Android has specific display cutout modes that affect how content renders around notches:

| Mode | Behavior |
|------|----------|
| `default` | Content avoids cutout in portrait, may extend in landscape |
| `shortEdges` | Content extends into cutout on short edges |
| `never` | Content never extends into cutout |

### 2. Android Chrome Meta Tags

Check if these are present and correct in the HTML `<head>`:

```html
<!-- Required for safe area to work -->
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">

<!-- Android theme color (affects status bar) -->
<meta name="theme-color" content="#0d1b2a">

<!-- For Android PWA status bar style -->
<meta name="mobile-web-app-capable" content="yes">
```

### 3. PWA Manifest Requirements

Check `public/manifest.json` for Android-specific settings:

```json
{
  "display": "standalone",
  "display_override": ["standalone"],
  "theme_color": "#0d1b2a",
  "background_color": "#0d1b2a"
}
```

### 4. CSS :has() Support

`:has()` is supported in:
- Chrome 105+ (Android Chrome - widely supported)
- Samsung Internet 19+
- Firefox 121+ (limited Android adoption)

For older browsers, we may need a JavaScript fallback.

---

## AUDIT CHECKLIST

### A. Verify Meta Tags

- [ ] `viewport-fit=cover` is present in viewport meta tag
- [ ] `theme-color` meta tag matches app background
- [ ] Consider dynamic theme-color for modals (requires JavaScript)

### B. Verify PWA Manifest

- [ ] `display: "standalone"` is set
- [ ] `theme_color` matches `--color-bg-base`
- [ ] `background_color` matches `--color-bg-base`

### C. Verify CSS Implementation

- [ ] `env(safe-area-inset-top)` has `0px` fallback
- [ ] `env(safe-area-inset-bottom)` has `0px` fallback
- [ ] Safe area fills have appropriate z-index
- [ ] `:has()` selectors work on Android Chrome

### D. Add Android-Specific Enhancements

- [ ] Add `-webkit-` prefixes if needed
- [ ] Test on devices with camera cutouts (hole-punch, notch)
- [ ] Test on devices without cutouts (fallback works)

### E. JavaScript Fallback for :has()

- [ ] Implement fallback for browsers that don't support `:has()`
- [ ] Use MutationObserver or modal event handlers

---

## IMPLEMENTATION TASKS

### Task 1: Verify and Update Meta Tags

Check `app/layout.jsx` (or equivalent) for proper meta tags:

```jsx
// In <head>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#0d1b2a" />
<meta name="mobile-web-app-capable" content="yes" />
```

### Task 2: Add Dynamic Theme Color (Optional Enhancement)

For modals that change the safe area color, we can dynamically update the theme-color:

```javascript
// When opening an overlay modal
document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#1a1a1a');

// When closing
document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0d1b2a');
```

### Task 3: Add :has() Fallback

For browsers without `:has()` support, add a JavaScript fallback:

```javascript
// Check if :has() is supported
const hasSupport = CSS.supports('selector(:has(*))');

if (!hasSupport) {
  // Use MutationObserver to detect [data-overlay-modal] changes
  const observer = new MutationObserver(() => {
    const hasOverlay = document.querySelector('[data-overlay-modal]');
    document.body.classList.toggle('has-overlay-modal', !!hasOverlay);
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
}
```

Then add fallback CSS:

```css
/* Fallback for browsers without :has() support */
body.has-overlay-modal::before,
body.has-overlay-modal::after {
  background: var(--brand-bg-overlay, #1a1a1a);
}
```

### Task 4: Test Android Display Cutout Behavior

Add CSS to handle Android display cutouts explicitly:

```css
/* Android display cutout safe area */
@supports (padding: max(0px)) {
  .app-container {
    padding-left: max(16px, env(safe-area-inset-left));
    padding-right: max(16px, env(safe-area-inset-right));
  }
}
```

---

## ANDROID DEVICE TEST MATRIX

| Device Type | Cutout Style | Test Priority |
|-------------|--------------|---------------|
| Samsung Galaxy S21+ | Hole-punch (center) | High |
| Google Pixel 6/7 | Hole-punch (left) | High |
| Samsung Galaxy A series | Waterdrop notch | Medium |
| Older devices (no cutout) | None | Medium |
| Tablets | Usually none | Low |

---

## VERIFICATION COMMANDS

```bash
# Check for viewport-fit in layout files
grep -r "viewport-fit" app/

# Check for theme-color meta tag
grep -r "theme-color" app/

# Check manifest.json for display settings
cat public/manifest.json | grep -E "(display|theme_color)"

# Verify env() usage in CSS
grep -rn "env(safe-area" app/ styles/ components/
```

---

## SUCCESS CRITERIA

- [ ] Safe area fills work on Android devices with notches
- [ ] Safe area color changes automatically when modals open
- [ ] Fallback works on older Android browsers without `:has()`
- [ ] Status bar color matches app background
- [ ] PWA installs correctly with proper display mode
- [ ] No content cut off by camera cutouts
- [ ] Horizontal safe areas handled (landscape mode)

---

## QUICK START

Copy this into Cursor to begin:

```
Please audit and optimize our safe area CSS implementation for Android devices.

Read the audit prompt at: audit/prompts/F-android-pwa-safe-area-audit.md

Then:
1. Check app/layout.jsx for proper meta tags (viewport-fit=cover, theme-color)
2. Check public/manifest.json for PWA settings
3. Verify app/globals.css safe area implementation
4. Add :has() fallback for older Android browsers if needed
5. Test that env(safe-area-inset-*) has proper fallbacks

Focus on:
- Android Chrome compatibility
- Samsung Internet compatibility
- Devices with camera cutouts (hole-punch, notch)
- PWA mode behavior
```

---

## REFERENCE FILES

- `app/globals.css` - Safe area CSS implementation
- `app/layout.jsx` - Meta tags and head content
- `public/manifest.json` - PWA manifest
- `next.config.js` - Headers and PWA config
