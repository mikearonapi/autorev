# Start Codebase Audit

Execute the comprehensive codebase audit defined in `.cursor/commands/codebase-deep-audit.md`.

## Quick Start

I need you to perform an exhaustive audit of this codebase. This is a major undertaking - expect it to take 1-3 hours. Do NOT rush.

**Your mission:**
1. Read the full audit plan at `.cursor/commands/codebase-deep-audit.md`
2. Execute each phase systematically
3. Create detailed reports in `/audit/` directory
4. Do NOT skip any section or make assumptions

**Key concerns I want investigated:**
- Duplicate code (same function in multiple places)
- Conflicting API routes (overlapping endpoints)
- Duplicate components (similar UI elements)
- Inconsistent naming (car vs vehicle, build vs project)
- Dead code (unused files, exports, dependencies)
- Data flow issues (same data from multiple sources)

**Output required:**
- `audit/api-routes-audit.md`
- `audit/components-audit.md`
- `audit/services-audit.md`
- `audit/data-flow-audit.md`
- `audit/naming-consistency-audit.md`
- `audit/dead-code-audit.md`
- `audit/tech-debt-priority-matrix.md`
- `audit/consolidation-plan.md`

Start with Phase 1.1 (API Routes Audit). Be thorough. Document everything with file paths and line numbers.

Begin now.
