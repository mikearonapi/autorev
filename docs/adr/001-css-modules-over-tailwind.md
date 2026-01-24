# ADR-001: CSS Modules Over Tailwind CSS

## Status

Accepted

## Date

2026-01-23

## Context

When building AutoRev's design system, we needed to choose a CSS architecture that would:
- Support a complex, custom design system with specific brand colors and spacing
- Allow for component-level scoping to prevent style conflicts
- Work well with our mobile-first responsive approach
- Enable theming (dark mode by default, potential light mode)
- Be maintainable across a large component library

The industry standard has shifted toward utility-first CSS (Tailwind), but this comes with trade-offs.

## Decision Drivers

- **Brand consistency**: AutoRev has a specific visual identity (dark theme, lime/teal accents, GRAVL-inspired spacing)
- **Mobile-first complexity**: Many components have significantly different layouts across breakpoints
- **Design token system**: We have a comprehensive token system with semantic naming
- **AI-assisted development**: CSS Modules are more explicit and easier for AI to understand and modify
- **Team preference**: Cleaner component files without long utility class strings

## Considered Options

### Option 1: CSS Modules

Traditional CSS with automatic class name scoping via `.module.css` files.

**Pros:**
- Full CSS power for complex layouts
- Clear separation of concerns (styling in CSS, logic in JS)
- Design tokens via CSS custom properties
- No build-time processing overhead
- Easier to implement custom animations
- AI can modify styles without touching component logic

**Cons:**
- More files to manage (component + module.css)
- Potential for inconsistent patterns without discipline
- No utility class shortcuts for quick prototyping

### Option 2: Tailwind CSS

Utility-first CSS framework with JIT compilation.

**Pros:**
- Rapid prototyping with utility classes
- Consistent spacing/color through config
- No context switching between files
- Strong ecosystem (shadcn/ui, etc.)

**Cons:**
- Long class strings reduce readability for complex components
- Harder to implement custom animations
- Config complexity for highly custom designs
- Potential for inconsistent usage without strict conventions
- Component files become harder to read

## Decision

Use **CSS Modules** for all component styling, with a centralized design token system in `styles/tokens/`.

## Rationale

1. **Brand Requirements**: Our GRAVL-inspired design requires many custom values that would need extensive Tailwind config
2. **Responsive Complexity**: Mobile-first components with significantly different tablet/desktop layouts are cleaner in CSS
3. **Maintainability**: Separating styles from components makes both easier to reason about
4. **Token Integration**: CSS custom properties work naturally with CSS Modules

## Consequences

### Positive

- Component files are clean and focused on logic
- Full CSS capabilities for complex animations (e.g., shimmer effects, transitions)
- Design token system is straightforward with CSS custom properties
- Easy to implement dark mode via CSS variable overrides
- AI assistants can confidently modify styles without breaking component logic

### Negative

- Team members familiar with Tailwind need to adjust
- Cannot use shadcn/ui components directly (need adaptation)
- Slightly more boilerplate (separate .module.css files)

### Neutral

- Build process unchanged (Next.js handles CSS Modules natively)
- Can still use global utility classes for common patterns

## Implementation Notes

- All components MUST have a corresponding `.module.css` file
- Design tokens are defined in `styles/tokens/` and imported in `globals.css`
- Global utility classes (`.btn`, `.card`, etc.) are defined in `globals.css`
- Component-specific styles use CSS Modules for scoping

## References

- `styles/tokens/` - Token definitions
- `app/globals.css` - Global styles and utilities
- `docs/CSS_ARCHITECTURE.md` - Full CSS documentation
