# ADR-001: Use JavaScript Over TypeScript

## Status

Accepted

## Date

2026-01-23

## Context and Problem Statement

During a comprehensive audit against "Production Grade Cross Platform App Development Standards," we identified that the codebase is 90%+ JavaScript while the standards document recommends TypeScript with strict mode enabled.

We needed to decide whether to:
1. Migrate the entire codebase to TypeScript
2. Continue with JavaScript and address actual security/quality gaps

## Decision Drivers

* **Existing codebase size**: 300+ JavaScript files (179 `.js`, 159 `.jsx`)
* **Production status**: App is live and serving users
* **Development velocity**: Migration would take significant time
* **Root cause analysis**: TypeScript would not solve the actual gaps (security headers, rate limiting, input validation)
* **Team familiarity**: Current team is productive with JavaScript

## Considered Options

### Option 1: Full TypeScript Migration

**Pros:**
- Type safety at compile time
- Better IDE autocomplete
- Industry trend alignment
- Better AI tooling support

**Cons:**
- Months of migration work
- Risk of introducing bugs during migration
- No runtime performance benefit
- Doesn't address security gaps

### Option 2: TypeScript for New Code Only

**Pros:**
- Gradual adoption
- Less risky than full migration
- Type safety on new features

**Cons:**
- Mixed codebase complexity
- Inconsistent patterns
- Still doesn't prioritize security gaps

### Option 3: Stay with JavaScript, Address Real Gaps

**Pros:**
- No migration risk
- Focus on actual security issues
- Immediate impact on app quality
- Team can continue shipping features

**Cons:**
- No compile-time type checking
- May need to revisit if adding React Native

## Decision Outcome

**Chosen option: Option 3 - Stay with JavaScript and address real gaps**

We determined that the highest-impact improvements were:

1. **Security Hardening** (Critical)
   - Security headers (X-Frame-Options, CSP, etc.)
   - Rate limiting on sensitive API routes
   - Input validation with Zod

2. **Code Quality Tooling** (High)
   - Prettier for consistent formatting
   - Husky + lint-staged for pre-commit checks
   - Enhanced ESLint rules

3. **Accessibility** (Medium)
   - Skip link for keyboard navigation
   - Reduced motion support

None of these required TypeScript.

## Consequences

### Positive

- Immediate security improvements deployed
- No disruption to feature development
- Team continues with familiar tooling
- Lower risk of migration-induced bugs

### Negative

- No compile-time type checking
- May need to revisit for cross-platform (React Native) development
- Some AI tooling may work better with TypeScript

### Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Runtime type errors | Zod validation on API boundaries |
| IDE support gaps | JSDoc comments where helpful |
| Future mobile development | Can adopt TypeScript for shared layer if/when needed |

## Future Considerations

If we decide to add React Native mobile apps, we should:
1. Consider TypeScript for the shared code layer only
2. Keep existing JavaScript code as-is
3. Use TypeScript for new cross-platform components

## Related Decisions

- This ADR informs our approach to input validation (Zod over TypeScript types)
- Future ADRs may document cross-platform strategy if mobile is added

## References

- Production Grade Cross Platform App Development Standards audit (January 2026)
- Security and Quality Remediation Plan
