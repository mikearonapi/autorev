#!/bin/bash
# =============================================================================
# Brand Compliance Audit
# Comprehensive check for CSS brand guideline violations
# =============================================================================

DIR="${1:-.}"
VERBOSE="${2:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=============================================="
echo "  AutoRev Brand Compliance Audit"
echo "  $(date)"
echo "=============================================="
echo ""

# Track totals
TOTAL_ISSUES=0
CRITICAL_ISSUES=0

# =============================================================================
# 1. OLD ACCENT COLORS (Critical - Wrong brand identity)
# =============================================================================
echo -e "${BLUE}1. OLD ACCENT COLORS (CRITICAL)${NC}"
echo "   These use old orange accent instead of brand colors:"

OLD_ORANGE=$(grep -rn "#ff4d00\|#ff6a2a\|#ff8040\|rgba(255, 77, 0" app components --include="*.css" 2>/dev/null | grep -v globals.css | wc -l | tr -d ' ')
echo -e "   ${RED}$OLD_ORANGE${NC} instances of old orange (#ff4d00)"

OLD_ACCENT=$(grep -rn "\-\-accent-primary[^-]" app components --include="*.css" 2>/dev/null | grep -v globals.css | wc -l | tr -d ' ')
echo -e "   ${RED}$OLD_ACCENT${NC} references to legacy --accent-primary"

CRITICAL_ISSUES=$((CRITICAL_ISSUES + OLD_ORANGE + OLD_ACCENT))
echo ""

# =============================================================================
# 2. HARDCODED RGBA COLORS (High Priority)
# =============================================================================
echo -e "${BLUE}2. HARDCODED RGBA COLORS${NC}"
echo "   Should use rgba(var(--brand-X-rgb), opacity) pattern:"

RGBA_ERROR=$(grep -rho "rgba(239, 68, 68," app components --include="*.css" 2>/dev/null | wc -l | tr -d ' ')
RGBA_BLUE=$(grep -rho "rgba(59, 130, 246," app components --include="*.css" 2>/dev/null | wc -l | tr -d ' ')
RGBA_SUCCESS=$(grep -rho "rgba(34, 197, 94," app components --include="*.css" 2>/dev/null | wc -l | tr -d ' ')
RGBA_GOLD=$(grep -rho "rgba(212, 168, 75,\|rgba(212, 160, 74," app components --include="*.css" 2>/dev/null | wc -l | tr -d ' ')
RGBA_WARNING=$(grep -rho "rgba(245, 158, 11,\|rgba(251, 191, 36," app components --include="*.css" 2>/dev/null | wc -l | tr -d ' ')
RGBA_LIME=$(grep -rho "rgba(212, 255, 0," app components --include="*.css" 2>/dev/null | wc -l | tr -d ' ')
RGBA_PURPLE=$(grep -rho "rgba(139, 92, 246," app components --include="*.css" 2>/dev/null | wc -l | tr -d ' ')
RGBA_LEGACY=$(grep -rho "rgba(233, 69, 96,\|rgba(231, 76, 60,\|rgba(46, 204, 113,\|rgba(26, 77, 110," app components --include="*.css" 2>/dev/null | wc -l | tr -d ' ')

echo "   - Error (ef4444): $RGBA_ERROR"
echo "   - Blue (3b82f6): $RGBA_BLUE"
echo "   - Success (22c55e): $RGBA_SUCCESS"
echo "   - Gold (d4a84b): $RGBA_GOLD"
echo "   - Warning (f59e0b): $RGBA_WARNING"
echo "   - Lime (d4ff00): $RGBA_LIME"
echo "   - Purple (8b5cf6): $RGBA_PURPLE"
echo "   - Legacy variants: $RGBA_LEGACY"

RGBA_TOTAL=$((RGBA_ERROR + RGBA_BLUE + RGBA_SUCCESS + RGBA_GOLD + RGBA_WARNING + RGBA_LIME + RGBA_PURPLE + RGBA_LEGACY))
echo -e "   ${YELLOW}Total: $RGBA_TOTAL hardcoded RGBA colors${NC}"
TOTAL_ISSUES=$((TOTAL_ISSUES + RGBA_TOTAL))
echo ""

# =============================================================================
# 3. ACCEPTABLE PATTERNS (Info only)
# =============================================================================
echo -e "${BLUE}3. ACCEPTABLE PATTERNS${NC}"

RGBA_WHITE=$(grep -rho "rgba(255, 255, 255," app components --include="*.css" 2>/dev/null | wc -l | tr -d ' ')
RGBA_BLACK=$(grep -rho "rgba(0, 0, 0," app components --include="*.css" 2>/dev/null | wc -l | tr -d ' ')
RGBA_TEAL=$(grep -rho "rgba(16, 185, 129," app components --include="*.css" 2>/dev/null | wc -l | tr -d ' ')
RGBA_VAR=$(grep -rho "rgba(var(--brand" app components --include="*.css" 2>/dev/null | wc -l | tr -d ' ')

echo -e "   ${GREEN}✓${NC} White overlays (rgba 255,255,255): $RGBA_WHITE"
echo -e "   ${GREEN}✓${NC} Black shadows (rgba 0,0,0): $RGBA_BLACK"
echo -e "   ${GREEN}✓${NC} Brand teal (rgba 16,185,129): $RGBA_TEAL"
echo -e "   ${GREEN}✓${NC} Variable-based rgba: $RGBA_VAR"
echo ""

# =============================================================================
# 4. BRAND TOKEN USAGE (Positive indicators)
# =============================================================================
echo -e "${BLUE}4. BRAND TOKEN USAGE${NC}"

BRAND_TOKENS=$(grep -rho "var(--brand-" app components --include="*.css" 2>/dev/null | wc -l | tr -d ' ')
COLOR_TOKENS=$(grep -rho "var(--color-" app components --include="*.css" 2>/dev/null | wc -l | tr -d ' ')

echo -e "   ${GREEN}✓${NC} --brand-* tokens: $BRAND_TOKENS"
echo -e "   ${GREEN}✓${NC} --color-* tokens: $COLOR_TOKENS"
echo ""

# =============================================================================
# 5. FILES BY VIOLATION COUNT (Priority list)
# =============================================================================
echo -e "${BLUE}5. TOP FILES WITH HARDCODED COLORS${NC}"
echo "   (Priority for migration):"

# Find files with most hardcoded hex colors
for f in $(find app components -name "*.css" -type f 2>/dev/null); do
  count=$(grep -oE "#[0-9a-fA-F]{3,8}" "$f" 2>/dev/null | grep -v "var(" | wc -l | tr -d ' ')
  if [ "$count" -gt 20 ]; then
    echo "   $count: $f"
  fi
done | sort -rn | head -15

echo ""

# =============================================================================
# SUMMARY
# =============================================================================
echo "=============================================="
echo -e "  ${BLUE}SUMMARY${NC}"
echo "=============================================="
echo -e "  Critical issues (old brand): ${RED}$CRITICAL_ISSUES${NC}"
echo -e "  RGBA migrations needed: ${YELLOW}$RGBA_TOTAL${NC}"
echo -e "  Brand tokens in use: ${GREEN}$BRAND_TOKENS${NC}"
echo ""

if [ "$CRITICAL_ISSUES" -gt 0 ]; then
  echo -e "${RED}⚠️  CRITICAL: Old accent colors detected!${NC}"
  echo "   Run: ./scripts/migrate-colors.sh"
  echo ""
fi

if [ "$RGBA_TOTAL" -gt 100 ]; then
  echo -e "${YELLOW}⚠️  HIGH: Many hardcoded RGBA colors${NC}"
  echo "   Run: ./scripts/migrate-rgba-colors.sh"
  echo ""
fi

echo "For detailed file list:"
echo "  grep -rn 'rgba(239, 68, 68' app components --include='*.css'"
