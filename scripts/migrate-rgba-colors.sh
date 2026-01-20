#!/bin/bash
# =============================================================================
# RGBA Color Migration Script
# Converts hardcoded rgba() values to use CSS custom properties
# =============================================================================

DIR="${1:-app components}"
DRY_RUN="${2:-false}"

echo "=============================================="
echo "  RGBA Color Migration Tool"
echo "  $(date)"
echo "=============================================="
echo ""

echo "📁 Scanning directories: $DIR"
echo ""

TOTAL=0

# Function to migrate a specific RGBA pattern
migrate_rgba() {
  local rgb="$1"
  local var="$2"
  local name="$3"
  
  count=$(grep -rho "rgba($rgb," $DIR --include="*.css" 2>/dev/null | wc -l | tr -d ' ')
  
  if [ "$count" -gt 0 ]; then
    echo "🎨 $name: rgba($rgb, x) → rgba(var($var), x)"
    echo "   Found: $count occurrences"
    
    if [ "$DRY_RUN" != "true" ]; then
      find $DIR -name "*.css" -type f -exec sed -i '' "s/rgba($rgb,/rgba(var($var),/g" {} \;
    fi
    
    TOTAL=$((TOTAL + count))
    echo ""
  fi
}

# Migrate each color pattern
migrate_rgba "239, 68, 68" "--brand-error-rgb" "Error"
migrate_rgba "59, 130, 246" "--brand-blue-rgb" "Blue"
migrate_rgba "34, 197, 94" "--brand-success-rgb" "Success"
migrate_rgba "212, 168, 75" "--brand-gold-rgb" "Gold"
migrate_rgba "212, 160, 74" "--brand-gold-rgb" "Gold (variant)"
migrate_rgba "245, 158, 11" "--brand-warning-rgb" "Warning"
migrate_rgba "251, 191, 36" "--brand-warning-rgb" "Warning (variant)"
migrate_rgba "212, 255, 0" "--brand-lime-rgb" "Lime"
migrate_rgba "139, 92, 246" "--brand-purple-rgb" "Purple"

# Legacy colors that should use standard brand colors
migrate_rgba "233, 69, 96" "--brand-error-rgb" "Legacy Error"
migrate_rgba "231, 76, 60" "--brand-error-rgb" "Legacy Error 2"
migrate_rgba "52, 199, 89" "--brand-success-rgb" "Legacy Success"
migrate_rgba "46, 204, 113" "--brand-success-rgb" "Legacy Success 2"
migrate_rgba "74, 222, 128" "--brand-success-rgb" "Legacy Success 3"
migrate_rgba "234, 179, 8" "--brand-warning-rgb" "Legacy Warning"

echo "=============================================="
echo "  SUMMARY"
echo "=============================================="
echo "Total replacements: $TOTAL"

if [ "$DRY_RUN" == "true" ]; then
  echo "⚠️  DRY RUN - No files were modified"
  echo ""
  echo "To apply changes, run:"
  echo "  ./scripts/migrate-rgba-colors.sh"
else
  echo "✅ Migration complete!"
  echo ""
  echo "Next steps:"
  echo "  1. Run: npm run build (verify no errors)"
  echo "  2. Visual spot check key pages"
  echo "  3. Run: ./scripts/brand-compliance-audit.sh"
fi
