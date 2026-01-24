# ADR-002: React Context Providers Over Zustand

## Status

Accepted

## Date

2026-01-23

## Context

AutoRev needs to manage several types of client-side state:
- User authentication state
- User preferences and settings
- Selected car context (for cross-page persistence)
- Favorites and saved items
- Theme settings

We needed to decide between using React Context with providers or adopting a dedicated state management library like Zustand.

## Decision Drivers

- **Complexity fit**: State management solution should match actual complexity needs
- **Bundle size**: Minimize JavaScript sent to client
- **Server Components**: Work well with Next.js App Router and RSC
- **Developer familiarity**: React Context is built-in and well understood
- **TanStack Query**: Most server state is already handled by React Query

## Considered Options

### Option 1: React Context with Providers

Use React's built-in Context API with custom provider components.

**Pros:**
- Zero additional dependencies
- Built into React (stable, well-documented)
- Works naturally with Next.js App Router
- Simple mental model for component-local state
- TanStack Query handles server state, reducing need for global store

**Cons:**
- Can cause unnecessary re-renders without careful optimization
- No built-in devtools (though React DevTools works)
- State persistence (localStorage) must be implemented manually
- Less ergonomic for deeply nested state updates

### Option 2: Zustand

Lightweight state management library with hooks-based API.

**Pros:**
- Minimal boilerplate
- Built-in persistence middleware
- DevTools support
- Works outside React components
- Prevents unnecessary re-renders with selectors

**Cons:**
- Additional dependency (~1.2KB gzipped)
- Another pattern for team to learn
- Overkill when most state is server-fetched
- Need to handle SSR carefully in App Router

## Decision

Use **React Context with custom Provider components** for global client state, combined with **TanStack Query** for all server state.

## Rationale

1. **State Classification**: Most "state" in AutoRev is actually server data (cars, events, user profile), which TanStack Query handles excellently
2. **Minimal Client State**: The remaining client state (auth, theme, selections) is simple enough for Context
3. **No Extra Dependencies**: React Context requires no additional packages
4. **SSR Simplicity**: Context providers integrate naturally with App Router's server/client boundary

## Consequences

### Positive

- Zero additional state management dependencies
- Clear separation: Context for client UI state, React Query for server data
- Team uses familiar React patterns
- Simple provider composition in layout files
- Easy to understand data flow

### Negative

- Must be careful about Context value stability to prevent re-renders
- No built-in persistence (implemented manually where needed)
- Deep nesting of providers in root layout

### Neutral

- Testing approach unchanged (mock providers as needed)
- Can migrate specific contexts to Zustand later if needed

## Implementation Notes

- Providers are in `components/providers/`
- Each provider handles one domain (Auth, Favorites, Theme, etc.)
- Providers are composed in `app/layout.jsx`
- Use `useMemo` for context values that are objects to prevent re-renders
- Server state should ALWAYS use TanStack Query, never Context

## Provider Inventory

| Provider | Purpose |
|----------|---------|
| `AuthProvider` | User authentication state |
| `QueryProvider` | TanStack Query client |
| `FavoritesProvider` | Saved cars and builds |
| `OwnedVehiclesProvider` | User's garage vehicles |
| `ThemeProvider` | Dark/light mode (next-themes) |
| `PostHogProvider` | Analytics context |
| `BannerProvider` | Site-wide banner state |

## References

- `components/providers/` - All provider implementations
- `app/layout.jsx` - Provider composition
- React Query for server state: `hooks/useCarData.js`, `hooks/useUserData.js`
