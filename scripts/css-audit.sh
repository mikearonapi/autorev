#!/bin/bash

# =============================================================================
# AutoRev CSS Audit Script
# Run this to check migration progress and find remaining hardcoded values
# =============================================================================

echo "=============================================="
echo "  AutoRev CSS Migration Audit"
echo "  $(date)"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directory to scan
BASE_DIR="${1:-.}"

# =============================================================================
# 1. Count Hardcoded Hex Colors
# =============================================================================
echo "📊 Hardcoded Colors (hex values like #ffffff):"
COLOR_COUNT=$(grep -rE "#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}" --include="*.css" "$BASE_DIR/app" "$BASE_DIR/components" 2>/dev/null | grep -v "styles/tokens" | grep -v "styles/components" | wc -l | tr -d ' ')
if [ "$COLOR_COUNT" -gt 100 ]; then
    echo -e "   ${RED}$COLOR_COUNT matches remaining${NC}"
else
    echo -e "   ${GREEN}$COLOR_COUNT matches remaining${NC}"
fi
echo ""

# =============================================================================
# 2. Count Hardcoded Spacing
# =============================================================================
echo "📐 Hardcoded Spacing (padding/margin/gap with px):"
SPACING_COUNT=$(grep -rE "padding:\s*\d+px|margin:\s*\d+px|gap:\s*\d+px" --include="*.css" "$BASE_DIR/app" "$BASE_DIR/components" 2>/dev/null | grep -v "styles/tokens" | wc -l | tr -d ' ')
if [ "$SPACING_COUNT" -gt 100 ]; then
    echo -e "   ${RED}$SPACING_COUNT matches remaining${NC}"
else
    echo -e "   ${GREEN}$SPACING_COUNT matches remaining${NC}"
fi
echo ""

# =============================================================================
# 3. Count Hardcoded Font Sizes
# =============================================================================
echo "🔤 Hardcoded Font Sizes:"
FONT_COUNT=$(grep -rE "font-size:\s*\d+px" --include="*.css" "$BASE_DIR/app" "$BASE_DIR/components" 2>/dev/null | grep -v "styles/tokens" | grep -v "16px !important" | wc -l | tr -d ' ')
if [ "$FONT_COUNT" -gt 100 ]; then
    echo -e "   ${RED}$FONT_COUNT matches remaining${NC}"
else
    echo -e "   ${GREEN}$FONT_COUNT matches remaining${NC}"
fi
echo ""

# =============================================================================
# 4. Count Hardcoded Border Radius
# =============================================================================
echo "⭕ Hardcoded Border Radius:"
RADIUS_COUNT=$(grep -rE "border-radius:\s*\d+px" --include="*.css" "$BASE_DIR/app" "$BASE_DIR/components" 2>/dev/null | grep -v "styles/tokens" | wc -l | tr -d ' ')
if [ "$RADIUS_COUNT" -gt 100 ]; then
    echo -e "   ${RED}$RADIUS_COUNT matches remaining${NC}"
else
    echo -e "   ${GREEN}$RADIUS_COUNT matches remaining${NC}"
fi
echo ""

# =============================================================================
# 5. Check for OLD Color Patterns (should be migrated)
# =============================================================================
echo "⚠️  OLD Color Patterns (should be migrated):"
OLD_COLORS=$(grep -rE "#ff4d00|#4ade80|#22c55e|#ffc107|#fbbf24" --include="*.css" "$BASE_DIR/app" "$BASE_DIR/components" 2>/dev/null | grep -v "styles/" | wc -l | tr -d ' ')
if [ "$OLD_COLORS" -gt 0 ]; then
    echo -e "   ${RED}$OLD_COLORS old colors found${NC}"
    echo "   These should be:"
    echo "   - #ff4d00 → var(--color-accent-lime) or var(--color-accent-gold)"
    echo "   - #4ade80 → var(--color-accent-teal)"
    echo "   - #22c55e → var(--color-accent-teal) or var(--color-success)"
    echo "   - #ffc107, #fbbf24 → var(--color-accent-gold) or var(--color-warning)"
else
    echo -e "   ${GREEN}No old color patterns found!${NC}"
fi
echo ""

# =============================================================================
# 6. Check for Token Usage
# =============================================================================
echo "✅ Token Usage (var(--color-*), var(--space-*)):"
TOKEN_USAGE=$(grep -rE "var\(--color-|var\(--space-|var\(--text-|var\(--radius-" --include="*.css" "$BASE_DIR/app" "$BASE_DIR/components" 2>/dev/null | wc -l | tr -d ' ')
echo -e "   ${GREEN}$TOKEN_USAGE token usages found${NC}"
echo ""

# =============================================================================
# 7. Touch Target Compliance
# =============================================================================
echo "👆 Touch Target Compliance (44px minimum):"
SMALL_TARGETS=$(grep -rE "min-height:\s*[0-3][0-9]px|min-width:\s*[0-3][0-9]px" --include="*.css" "$BASE_DIR/app" "$BASE_DIR/components" 2>/dev/null | wc -l | tr -d ' ')
if [ "$SMALL_TARGETS" -gt 0 ]; then
    echo -e "   ${YELLOW}$SMALL_TARGETS elements may have touch targets < 44px${NC}"
else
    echo -e "   ${GREEN}All touch targets appear compliant${NC}"
fi
echo ""

# =============================================================================
# Summary
# =============================================================================
echo "=============================================="
echo "  SUMMARY"
echo "=============================================="
TOTAL=$((COLOR_COUNT + SPACING_COUNT + FONT_COUNT + RADIUS_COUNT))
echo "Total hardcoded values: $TOTAL"
echo ""

if [ "$TOTAL" -lt 500 ]; then
    echo -e "${GREEN}🎉 Great progress! Migration nearly complete.${NC}"
elif [ "$TOTAL" -lt 2000 ]; then
    echo -e "${YELLOW}📈 Good progress. Keep migrating.${NC}"
else
    echo -e "${RED}⚠️  Significant work remaining.${NC}"
fi

echo ""
echo "Run with: bash scripts/css-audit.sh"
echo "Or for specific dir: bash scripts/css-audit.sh /path/to/project"
