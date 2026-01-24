# Cursor Rules Quick Reference

## PRIMARY SOURCE OF TRUTH

**`docs/SOURCE_OF_TRUTH.md`** — The CANONICAL reference for the entire AutoRev codebase.

Contains:
- 10 Cardinal Rules (violating them WILL cause bugs)
- Anti-Patterns & Common Mistakes (with fixes)
- Service file locations and responsibilities
- Component registry by feature
- "I need to..." quick reference table
- Database table source of truth matrix

**RULE: If it's not in SOURCE_OF_TRUTH.md, check before creating.**

## Which Rule Applies When?

| Task | Rule File | Source Docs to Read |
|------|-----------|---------------------|
| **Any task** | 00-core-workflow | `docs/SOURCE_OF_TRUTH.md` first |
| **Database/API work** | 01-database | `docs/SOURCE_OF_TRUTH.md`, `docs/DATABASE.md` |
| **UI/Components/Styling** | 02-ui-design | `docs/SOURCE_OF_TRUTH.md`, `docs/BRAND_GUIDELINES.md` |
| **Feature logic/Tiers** | 03-domain-logic | `docs/SOURCE_OF_TRUTH.md`, `docs/TIER_ACCESS_MATRIX.md` |
| **AI/AL features** | 03-domain-logic | `docs/SOURCE_OF_TRUTH.md`, `docs/AL.md` |

## The Workflow (Every Time)

1. **UNDERSTAND** → What's the goal?
2. **RESEARCH** → Search code + `docs/SOURCE_OF_TRUTH.md`
3. **PLAN** → Propose using existing patterns
4. **BUILD** → Minimal changes only

## Golden Rule

**Search before creating. Reuse before building. SOURCE_OF_TRUTH.md before guessing.**

## Key Docs Quick Reference

| Doc | Contains |
|-----|----------|
| `docs/SOURCE_OF_TRUTH.md` | **CANONICAL** - Everything, check this first |
| `docs/DATABASE.md` | Tables, schemas, relationships |
| `docs/BRAND_GUIDELINES.md` | Brand colors (lime/teal/blue/amber), typography |
| `docs/CSS_ARCHITECTURE.md` | Design tokens, component CSS classes |
| `docs/AL.md` | AI assistant tools, prompts, constraints |
| `docs/TIER_ACCESS_MATRIX.md` | Feature gating (free/collector/tuner/admin) |
| `docs/API.md` | API routes, response shapes |

## Color Quick Reference

| Color | Hex | Use For |
|-------|-----|---------|
| Lime | `#d4ff00` | CTAs, buttons, user actions |
| Teal | `#10b981` | Gains, improvements, positive data |
| Blue | `#3b82f6` | Stock values, baseline data |
| Amber | `#f59e0b` | Warnings only (sparingly) |

## Key Service Files

| Need | Check |
|------|-------|
| Car resolution | `lib/carResolver.js` |
| Car data | `lib/carsClient.js` |
| User data | `lib/userDataService.js` |
| AL/AI | `lib/alTools.js` |
| Errors | `lib/apiErrors.js` |

## Verification Protocol

Before marking ANY task complete:
1. STATE success criteria
2. RUN verification
3. SHOW evidence
4. THEN mark complete
