# AutoRev Cursor Rules

## Quick Start

| Starting... | Do This |
|-------------|---------|
| New feature | `@feature-workflow [description]` |
| Debugging | `@debug-workflow [problem]` |
| Before shipping | `@review-workflow` |
| Unsure | `@tech-lead [task]` |

---

## Virtual Design Team (Auto-Invoked Subagents)

These subagents are **automatically invoked** after code changes per the mandatory process. No manual triggering needed.

| Subagent | Auto-Triggers When | Primary Focus |
|----------|-------------------|---------------|
| `code-reviewer` | Any code change | Cardinal Rules, duplication prevention, security |
| `ui-reviewer` | UI/component changes | Design system, accessibility, touch targets |
| `test-writer` | New functionality added | Test coverage generation |
| `debugger` | Errors encountered | Root cause analysis |

### What They Enforce Automatically:

- **No duplicate code** — Checks SOURCE_OF_TRUTH.md before allowing new files
- **Cardinal Rules** — car_id resolution, design tokens, touch targets
- **Design System** — Colors, spacing, loading states
- **Security** — Auth, validation, webhook verification
- **Accessibility** — 44px targets, focus states, contrast

### Manual Invocation (Optional)

You can still invoke manually for specific tasks:
- "Use the code-reviewer to review my changes"
- "Use the ui-reviewer to check this component"
- "Use the debugger to investigate this error"

---

## The Development Process (Auto-Enforced)

### Phase 1: Before Writing Code
1. **Read SOURCE_OF_TRUTH.md** — Cardinal rules, anti-patterns, existing code
2. **Search before creating** — Check `components/`, `lib/`, `hooks/`
3. **STOP if existing code can be extended** — Don't duplicate

### Phase 2: After Writing Code
4. **Auto-review runs** — Subagents check your work
5. **Verify with evidence** — Prove it works

## Specialists

| Invoke | For |
|--------|-----|
| `@frontend-agent` | React components, hooks, state |
| `@database-agent` | Queries, car_id resolution |
| `@ui-quality-agent` | Colors, touch targets, accessibility |
| `@security-agent` | Auth, webhooks, validation |
| `@performance-agent` | Core Web Vitals, images |
| `@code-review-agent` | Quality gate |
| `@testing-agent` | Writing tests |

## Cardinal Rules

1. **car_id** — Resolve slug first, query by car_id
2. **Design tokens** — `var(--color-*)`, never hardcode
3. **Touch targets** — 44px minimum (`h-11`)
4. **Skeletons** — Not spinners for data loading
5. **Domain naming** — Not `handleClick`, `formatData`

## Colors

| Color | Variable | Use |
|-------|----------|-----|
| Lime | `--color-accent-lime` | CTAs |
| Teal | `--color-accent-teal` | Gains |
| Blue | `--color-accent-blue` | Stock |

## Key Files

| Need | Check |
|------|-------|
| Car resolution | `lib/carResolver.js` |
| Car data | `lib/carsClient.js` |
| Performance | `lib/performanceCalculator/` |
| Errors | `lib/apiErrors.js` |
