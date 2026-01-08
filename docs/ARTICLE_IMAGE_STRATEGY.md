# AL Articles Image Generation Strategy

> **Last Updated:** January 2026  
> **Status:** V2 Implementation Complete

This document defines the strategy for creating high-quality, relevant AI-generated images for AutoRev's AL Articles section.

---

## Executive Summary

### The Problem
Our current article images suffer from:
1. **Wrong cars shown** - Budget articles showing supercars, wrong models in comparisons
2. **Environment monotony** - 80%+ of images use "mountain overlook with sky" backgrounds
3. **CGI appearance** - Dark studio shots, overly polished surfaces, reflective floors
4. **Cropping issues** - Cars partially cut off (wheels, bumpers)
5. **Inconsistent quality** - No systematic QA process tied to article context

### The Solution (V2 Strategy)
1. **Context-aware car selection** - Query database for appropriate cars per article
2. **Environment diversity system** - Rotating backgrounds across 5 categories
3. **Anti-CGI prompting** - Specific instructions to avoid AI tells
4. **Enhanced QA** - Validates images against article requirements

---

## V2 Image Generation Pipeline

### 1. Car Selection Logic

```
Article Type → Cars to Show
─────────────────────────────────────────────────
Head-to-head (vs)     → Extract both cars from title
Three-way comparison  → Extract all 3 cars from title
Budget ($X or less)   → Query top cars from DB under price
JDM/Culture           → Predefined appropriate cars
Technical (wheels)    → Attainable enthusiast cars (NOT supercars)
First sports car      → Entry-level: Miata, GR86, BRZ
```

**Critical Rule: Budget articles MUST NOT show supercars.**

Banned in budget articles: Lamborghini, Ferrari, McLaren, Bugatti, Pagani, Koenigsegg, Porsche 918/GT2 RS

### 2. Environment Categories

| Category | Use % | Examples |
|----------|-------|----------|
| **Urban** | 35% | Downtown street, parking garage, coffee shop |
| **Automotive** | 25% | Cars & coffee, autocross, tuning shop |
| **Scenic** | 20% | Coastal overlook, mountain pass (use sparingly!) |
| **Lifestyle** | 15% | Suburban driveway, apartment building |
| **Technical** | 10% | Garage, lift, dyno facility (technical articles only) |

The system tracks recently used environments to ensure variety.

### 3. Prompt Structure (V2)

```
[Car Subject with Colors], [Environment].

[Camera Settings by Category]

COMPOSITION REQUIREMENTS:
- Show COMPLETE car(s) from 3/4 front angle
- All 4 wheels, both bumpers, full roofline visible
- Car(s) are the clear hero subject

PHOTOREALISM REQUIREMENTS:
- Natural daylight with soft shadows
- Realistic paint reflections with subtle imperfections
- Natural dust on lower panels if outdoors

AVOID:
- Dark studio with reflective floor
- Hyper-saturated colors
- Supercars unless specifically requested
- Any text or license plate text
```

---

## Quality Assurance (QA) Criteria

### Scoring Weights (V2)

| Criterion | Weight | What It Measures |
|-----------|--------|------------------|
| Car Completeness | 25% | Is the entire car visible? No cropping? |
| Car Appropriateness | 25% | Does it show the RIGHT cars for this article? |
| Realism | 20% | Would this pass as a real photograph? |
| Composition | 15% | Professional framing, good angle? |
| Environment | 10% | Setting appropriate for article type? |
| Quality | 5% | Technical sharpness, resolution |

### Auto-Approve/Reject Thresholds

- **≥80**: Auto-approve
- **50-79**: Manual review needed
- **<50**: Auto-reject

### Critical Auto-Reject Issues

- Car partially cut off (missing wheel, bumper)
- **Supercar in budget article**
- Extra/merged car parts
- Dark studio with reflective floor
- Obvious CGI/3D render appearance
- Wrong vehicle type for article

---

## Running the Pipeline

### 1. Generate New Images

```bash
# Dry run - see what would be generated
node scripts/regenerate-article-images-v2.mjs --dry-run

# Regenerate specific article
node scripts/regenerate-article-images-v2.mjs --slug=best-sports-cars-under-50k

# Regenerate high-priority (rejected/low-score) articles
node scripts/regenerate-article-images-v2.mjs --priority=high --limit=10

# Regenerate all articles (careful!)
node scripts/regenerate-article-images-v2.mjs --all --limit=30
```

### 2. Run QA Validation

```bash
# Run QA on pending images
node scripts/run-image-qa-v2.mjs

# Run QA on specific article
node scripts/run-image-qa-v2.mjs --article best-sports-cars-under-50k

# Generate full QA report
node scripts/run-image-qa-v2.mjs --report

# Re-run QA on all articles
node scripts/run-image-qa-v2.mjs --rerun-all
```

### 3. Iterate Until Quality

```bash
# Typical workflow:
node scripts/regenerate-article-images-v2.mjs --priority=high
node scripts/run-image-qa-v2.mjs --rerun-all
node scripts/run-image-qa-v2.mjs --report
# Repeat until all articles pass
```

---

## Article-Specific Guidelines

### Comparison Articles (Head-to-Head)
- **Cars**: Extract directly from title (e.g., "Mustang vs Camaro" → both cars)
- **Environment**: Urban or automotive context preferred
- **Composition**: Both cars equally prominent, side by side

### Budget/Buyer's Guide Articles
- **Cars**: Query database for top-rated cars under the price point
- **NEVER**: Show supercars, hypercars, or unattainable vehicles
- **Environment**: Lifestyle (relatable) or urban settings
- **Composition**: 1-3 cars, emphasizing accessibility

### Technical Articles (Mods, Maintenance)
- **Cars**: Attainable enthusiast vehicles (M3, Miata, Mustang)
- **Environment**: Workshop, garage, or detailing bay
- **Focus**: Show the relevant component if article-specific

### Culture/History Articles
- **Cars**: Match the era and topic
- **Environment**: Contextually appropriate (JDM = nighttime meet, etc.)
- **Style**: More atmospheric, storytelling composition

---

## Common Issues & Solutions

### Issue: "Mountain overlook in every image"
**Solution**: Environment diversity system now limits scenic to 20% and tracks usage

### Issue: "Lamborghini in 'Best Sports Cars Under $50k'"
**Solution**: V2 QA checks for supercar presence in budget articles, auto-rejects

### Issue: "Dark studio with reflective floor"
**Solution**: Prompt explicitly bans this and prefers outdoor/natural settings

### Issue: "Car's rear wheel cut off"
**Solution**: Prompt requires "all 4 wheels visible" and QA checks completeness

### Issue: "Cars don't match article content"
**Solution**: Smart car selection queries database based on article context

---

## AI Image Service Comparison

We use **Google Gemini** (`gemini-3-pro-image-preview`) for article images.

| Service | Pros | Cons | Use Case |
|---------|------|------|----------|
| **Gemini Pro** | Good realism, fast, affordable | Occasional CGI tells | Article heroes (current) |
| DALL-E 3 | Excellent composition | Expensive, watermark issues | Not used |
| Midjourney | Best aesthetics | API limitations, slow | Manual car images |
| Flux | Good detail | Inconsistent | Testing only |

---

## Database Schema

Images are stored in Vercel Blob and tracked in `al_articles`:

```sql
hero_image_url      TEXT     -- Vercel Blob URL
image_qa_status     TEXT     -- 'pending', 'approved', 'rejected', 'needs_review'
image_qa_score      INTEGER  -- 0-100 weighted score
image_qa_issues     TEXT[]   -- Array of critical issues found
image_qa_details    JSONB    -- Full QA analysis response
image_qa_reviewed_at TIMESTAMPTZ
```

---

## Future Improvements

1. **Reference image injection** - Use real car photos as style/color reference
2. **A/B testing** - Track which image styles drive engagement
3. **Automated regeneration** - CRON job for rejected images
4. **Human review queue** - UI for manual approval of "needs_review" images

---

## Files Reference

| File | Purpose |
|------|---------|
| `lib/articleImageStrategyV2.js` | Core V2 logic, prompt generation, car selection |
| `scripts/regenerate-article-images-v2.mjs` | CLI for regenerating images |
| `scripts/run-image-qa-v2.mjs` | CLI for QA validation |
| `lib/articleImageService.js` | Original V1 service (deprecated for new images) |

