#!/bin/bash
# =============================================================================
# CSS Color Migration Script
# Batch converts hardcoded hex colors to CSS variables
# =============================================================================

set -e

# Color mapping: hex → CSS variable
# Format: "hex_pattern:replacement"
declare -a COLOR_MAP=(
  # Primary brand colors
  "#d4ff00:var(--brand-lime)"
  "#bfe600:var(--brand-lime-dark)"
  "#10b981:var(--brand-teal)"
  "#34d399:var(--brand-teal-light)"
  "#059669:var(--brand-teal-dark)"
  "#3b82f6:var(--brand-blue)"
  "#60a5fa:var(--brand-blue-light)"
  "#1d4ed8:var(--brand-blue-dark)"
  "#d4a84b:var(--brand-gold)"
  "#e8c875:var(--brand-gold-light)"
  "#c4a564:var(--brand-gold)"
  "#e5b95c:var(--brand-gold-hover)"
  "#e6c048:var(--brand-gold-light)"
  "#e6c54a:var(--brand-gold-light)"
  "#d4b574:var(--brand-gold)"
  "#d4af60:var(--brand-gold-light)"
  "#b8973a:var(--brand-gold)"
  "#f5c35a:var(--brand-gold-light)"
  
  # Legacy accent colors → brand gold
  "#ff4d00:var(--brand-gold)"
  "#ff6620:var(--brand-gold-light)"
  "#ff6a2a:var(--brand-gold-light)"
  "#ff6b00:var(--brand-gold)"
  "#ff8c00:var(--brand-gold-light)"
  "#ffa500:var(--brand-warning)"
  "#e55d00:var(--brand-gold)"
  
  # Status colors
  "#ef4444:var(--brand-error)"
  "#f87171:var(--brand-error-light)"
  "#dc2626:var(--brand-error-dark)"
  "#b91c1c:var(--brand-error-dark)"
  "#c0392b:var(--brand-error-dark)"
  "#e94560:var(--brand-error)"
  "#ff6b6b:var(--brand-error-light)"
  "#ff6b8a:var(--brand-error-light)"
  "#f59e0b:var(--brand-warning)"
  "#d97706:var(--brand-warning)"
  "#fbbf24:var(--brand-warning)"
  "#fcd34d:var(--brand-warning)"
  "#eab308:var(--brand-warning)"
  "#ca8a04:var(--brand-warning)"
  "#f97316:var(--brand-warning)"
  "#22c55e:var(--brand-success)"
  "#4ade80:var(--brand-success-light)"
  "#16a34a:var(--brand-success-dark)"
  "#2ecc71:var(--brand-success)"
  "#27ae60:var(--brand-success-dark)"
  "#047857:var(--brand-teal-dark)"
  
  # Background colors
  "#0d1b2a:var(--brand-bg-primary)"
  "#0a1628:var(--brand-bg-primary-dark)"
  "#0a0a0a:var(--brand-bg-primary-dark)"
  "#0a0a0f:var(--brand-bg-primary-dark)"
  "#0d0d10:var(--brand-bg-primary-dark)"
  "#0d0d12:var(--brand-bg-primary-dark)"
  "#0f1012:var(--brand-bg-primary-dark)"
  "#0f1014:var(--brand-bg-primary-dark)"
  "#0f172a:var(--brand-bg-primary-dark)"
  "#0f3460:var(--brand-bg-primary-dark)"
  "#1b263b:var(--brand-bg-secondary)"
  "#1e293b:var(--brand-bg-secondary)"
  "#16213e:var(--brand-bg-secondary)"
  "#141414:var(--brand-bg-primary-dark)"
  "#141517:var(--brand-bg-primary-dark)"
  "#161616:var(--brand-bg-card-dark)"
  "#1a1a1a:var(--brand-border-subtle)"
  "#1a1a1f:var(--brand-bg-card-dark)"
  "#1a1a2e:var(--brand-bg-card-dark)"
  "#1a1b1e:var(--brand-bg-card-dark)"
  "#1a1b1f:var(--brand-bg-card-dark)"
  "#1c1c1c:var(--brand-bg-card-dark)"
  
  # Border colors
  "#252525:var(--brand-border-default)"
  "#2a2a2a:var(--brand-border-default)"
  "#3a3a3a:var(--brand-border-default)"
  
  # Text colors
  "#ffffff:var(--brand-text-primary)"
  "#fff:var(--brand-text-primary)"
  "#94a3b8:var(--brand-text-secondary)"
  "#a0a0a0:var(--brand-text-secondary)"
  "#808080:var(--brand-text-secondary)"
  "#64748b:var(--brand-text-tertiary)"
  "#666666:var(--brand-text-tertiary)"
  "#606060:var(--brand-text-tertiary)"
  "#475569:var(--brand-text-muted)"
  
  # Dark text on light backgrounds
  "#000:var(--brand-bg-primary)"
  "#000000:var(--brand-bg-primary)"
  
  # Special colors
  "#8b5cf6:var(--brand-purple-accent)"
  "#667eea:var(--brand-purple-accent)"
  "#764ba2:var(--brand-purple-accent)"
  "#c4b5fd:var(--brand-purple-accent)"
  "#00d4ff:var(--brand-info)"
  "#1f5a80:var(--brand-primary-dark)"
  "#357a9c:var(--brand-blue)"
  
  # Grays from Tailwind
  "#93c5fd:var(--brand-blue-light)"
  "#6ee7b7:var(--brand-teal-light)"
  "#7c5c12:var(--brand-gold)"
  "#b45309:var(--brand-warning)"
  "#e5c158:var(--brand-gold)"
  "#d0e3ed:var(--brand-blue-light)"
  "#f0f7ff:var(--brand-blue-light)"
  "#e8f4f8:var(--brand-blue-light)"
  "#f0f0f0:rgba(255, 255, 255, 0.9)"
)

# Directories to process
DIRS=("app" "components")

# Backup flag
BACKUP=false
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --backup) BACKUP=true; shift ;;
    --dry-run) DRY_RUN=true; shift ;;
    --dir) DIRS=("$2"); shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

echo "=============================================="
echo "  CSS Color Migration Tool"
echo "  $(date)"
echo "=============================================="
echo ""

# Count files
FILE_COUNT=$(find "${DIRS[@]}" -name "*.module.css" -o -name "*.css" 2>/dev/null | grep -v globals.css | grep -v node_modules | wc -l | tr -d ' ')
echo "📁 Found $FILE_COUNT CSS files to process"
echo ""

# Process each mapping
TOTAL_REPLACEMENTS=0
for mapping in "${COLOR_MAP[@]}"; do
  HEX="${mapping%%:*}"
  VAR="${mapping##*:}"
  
  # Count occurrences (case insensitive, excluding var() contexts and globals.css)
  COUNT=$(grep -rli "$HEX" "${DIRS[@]}" --include="*.css" 2>/dev/null | grep -v globals.css | grep -v node_modules | xargs grep -h "$HEX" 2>/dev/null | grep -v "var(" | wc -l | tr -d ' ')
  
  if [ "$COUNT" -gt 0 ]; then
    echo "🎨 $HEX → $VAR ($COUNT occurrences)"
    TOTAL_REPLACEMENTS=$((TOTAL_REPLACEMENTS + COUNT))
    
    if [ "$DRY_RUN" = false ]; then
      # Find and replace in all CSS files (excluding globals.css)
      find "${DIRS[@]}" -name "*.css" ! -name "globals.css" 2>/dev/null | while read -r file; do
        if [ "$BACKUP" = true ]; then
          cp "$file" "$file.bak"
        fi
        # Replace standalone occurrences (not inside var())
        # This handles: color: #hex; background: #hex; border: 1px solid #hex;
        sed -i '' "s/: ${HEX};/: ${VAR};/gi" "$file" 2>/dev/null || true
        sed -i '' "s/: ${HEX} /: ${VAR} /gi" "$file" 2>/dev/null || true
        sed -i '' "s/ ${HEX},/ ${VAR},/gi" "$file" 2>/dev/null || true
        sed -i '' "s/ ${HEX})/ ${VAR})/gi" "$file" 2>/dev/null || true
        sed -i '' "s/(${HEX}/(${VAR}/gi" "$file" 2>/dev/null || true
        sed -i '' "s/(${HEX},/(${VAR},/gi" "$file" 2>/dev/null || true
      done
    fi
  fi
done

echo ""
echo "=============================================="
echo "  SUMMARY"
echo "=============================================="
echo "Total potential replacements: $TOTAL_REPLACEMENTS"
if [ "$DRY_RUN" = true ]; then
  echo "⚠️  DRY RUN - No files were modified"
  echo "   Run without --dry-run to apply changes"
else
  echo "✅ Migration complete!"
fi
echo ""
echo "Next steps:"
echo "  1. Run: ./scripts/css-audit.sh"
echo "  2. Visual spot check key pages"
echo "  3. Run: npm run build"
