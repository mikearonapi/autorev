#!/usr/bin/env node

/**
 * Generate Analysis Reports Script
 * 
 * Generates markdown analysis reports for each competitor using:
 * - The analysis template
 * - Extracted content data
 * - Screenshot references
 * 
 * Usage:
 *   node scripts/competitive-analysis/generate-reports.mjs
 *   node scripts/competitive-analysis/generate-reports.mjs --competitor=bring-a-trailer
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

// Paths
const CONFIG_PATH = path.join(ROOT_DIR, 'SaaS Strategy/competitor-config.json');
const TEMPLATE_PATH = path.join(ROOT_DIR, 'SaaS Strategy/competitor-analysis/ANALYSIS_TEMPLATE.md');
const EXTRACTED_DIR = path.join(ROOT_DIR, 'SaaS Strategy/competitor-analysis/extracted-content');
const OUTPUT_DIR = path.join(ROOT_DIR, 'SaaS Strategy/competitor-analysis/individual');
const SCREENSHOTS_DIR = path.join(ROOT_DIR, 'SaaS Strategy/competitor-screenshots');

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    competitor: null,
    category: null,
    overwrite: false,
  };

  for (const arg of args) {
    if (arg.startsWith('--competitor=')) {
      options.competitor = arg.split('=')[1];
    } else if (arg.startsWith('--category=')) {
      options.category = arg.split('=')[1];
    } else if (arg === '--overwrite') {
      options.overwrite = true;
    }
  }

  return options;
}

/**
 * Load competitor configuration
 */
async function loadConfig(options) {
  const configText = await fs.readFile(CONFIG_PATH, 'utf-8');
  const config = JSON.parse(configText);
  
  let competitors = config.competitors;

  if (options.category) {
    competitors = competitors.filter(c => c.category === options.category);
  }

  if (options.competitor) {
    competitors = competitors.filter(c => c.slug === options.competitor);
  }

  return { competitors, categories: config.categories };
}

/**
 * Load extracted content for a competitor
 */
async function loadExtractedContent(slug) {
  try {
    const extractedPath = path.join(EXTRACTED_DIR, `${slug}.json`);
    const content = await fs.readFile(extractedPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Check if screenshots exist for a competitor
 */
async function checkScreenshots(category, slug) {
  const screenshotDir = path.join(SCREENSHOTS_DIR, category, slug);
  const screenshots = {
    desktopHomepage: false,
    desktopPricing: false,
    mobileHomepage: false,
  };

  try {
    await fs.access(path.join(screenshotDir, 'desktop/homepage.png'));
    screenshots.desktopHomepage = true;
  } catch {}

  try {
    await fs.access(path.join(screenshotDir, 'desktop/pricing.png'));
    screenshots.desktopPricing = true;
  } catch {}

  try {
    await fs.access(path.join(screenshotDir, 'mobile/homepage.png'));
    screenshots.mobileHomepage = true;
  } catch {}

  return screenshots;
}

/**
 * Generate a report for a competitor
 */
async function generateReport(competitor, extracted, screenshots, categories) {
  const categoryInfo = categories[competitor.category];
  const today = new Date().toISOString().split('T')[0];

  // Get extracted data with fallbacks
  const homepage = extracted?.pages?.homepage || {};
  const pricing = extracted?.pages?.pricing || {};
  const summary = extracted?.summary || {};

  // Build headlines section
  const h1 = summary.primaryHeadline || homepage.headlines?.h1?.[0] || '[Not extracted]';
  const h2s = summary.secondaryHeadlines?.join(', ') || homepage.headlines?.h2?.slice(0, 3).join(', ') || '[Not extracted]';

  // Build CTAs section
  const primaryCTA = summary.primaryCTA || '[Not extracted]';
  const secondaryCTAs = summary.allCTAs?.slice(1, 4).join(', ') || '[Not extracted]';

  // Build pricing table
  let pricingTable = '';
  if (summary.pricingTiers && summary.pricingTiers.length > 0) {
    pricingTable = summary.pricingTiers.map(tier => 
      `| ${tier.name || 'Unknown'} | ${tier.price || 'N/A'} | ${tier.features?.slice(0, 3).join('; ') || 'N/A'} |`
    ).join('\n');
  } else if (summary.pricePoints && summary.pricePoints.length > 0) {
    pricingTable = `| Various | ${summary.pricePoints.join(', ')} | See website |`;
  } else {
    pricingTable = '| N/A | N/A | [Not extracted - visit website] |';
  }

  // Build social proof stats
  const stats = summary.stats?.slice(0, 5).map(s => `- ${s}`).join('\n') || '- [Not extracted]';

  // Screenshot sections
  const desktopScreenshot = screenshots.desktopHomepage 
    ? `![Homepage Desktop](../competitor-screenshots/${competitor.category}/${competitor.slug}/desktop/homepage.png)`
    : '*Screenshot not yet captured*';

  const mobileScreenshot = screenshots.mobileHomepage
    ? `![Homepage Mobile](../competitor-screenshots/${competitor.category}/${competitor.slug}/mobile/homepage.png)`
    : '*Screenshot not yet captured*';

  const pricingScreenshot = screenshots.desktopPricing
    ? `![Pricing](../competitor-screenshots/${competitor.category}/${competitor.slug}/desktop/pricing.png)`
    : '*Screenshot not yet captured*';

  // Generate the report
  const report = `# ${competitor.name} - Competitive Analysis

> **Category**: ${categoryInfo?.displayName || competitor.category} | **Subcategory**: ${competitor.subcategory || 'General'}  
> **URL**: ${competitor.urls.homepage}  
> **Analyzed**: ${today}

---

## Quick Facts

| Attribute | Value |
|-----------|-------|
| **Business Model** | ${competitor.businessModel} |
| **Target Audience** | [To be analyzed] |
| **Key Differentiator** | ${competitor.topPattern} |
| **Study Focus** | ${competitor.studyFocus?.join(', ') || 'General'} |

---

## Screenshots

### Desktop Homepage
${desktopScreenshot}

### Mobile Homepage
${mobileScreenshot}

### Pricing Page (if available)
${pricingScreenshot}

---

## Positioning Analysis

### Hero Message
> "${h1}"

### Value Proposition
[To be analyzed - Core promise based on hero message and overall positioning]

### Target Audience Signals
- [To be analyzed - Who are they speaking to?]
- [To be analyzed - What language/imagery do they use?]
- [To be analyzed - What problems do they solve?]

### Competitive Positioning
[To be analyzed - How do they position against alternatives?]

---

## Scoring Rubric

### 1. Positioning & Messaging (1-5)

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Value Prop Clarity** | /5 | [To be scored] |
| **Target Audience Specificity** | /5 | [To be scored] |
| **Differentiation** | /5 | [To be scored] |
| **Emotional vs. Functional** | /5 | [To be scored] |
| **Subtotal** | **/20** | |

### 2. Visual Design & UX (1-5)

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Hero Section Impact** | /5 | [To be scored] |
| **Visual Hierarchy** | /5 | [To be scored] |
| **Mobile Experience** | /5 | [To be scored] |
| **Imagery Quality** | /5 | [To be scored] |
| **Typography/Color** | /5 | [To be scored] |
| **Subtotal** | **/25** | |

### 3. Trust & Social Proof (1-5)

| Dimension | Score | Notes |
|-----------|-------|-------|
| **User/Customer Stats** | /5 | [To be scored] |
| **Testimonials/Case Studies** | /5 | [To be scored] |
| **Logos/Partnerships** | /5 | [To be scored] |
| **Awards/Recognition** | /5 | [To be scored] |
| **Security/Privacy** | /5 | [To be scored] |
| **Subtotal** | **/25** | |

### 4. CTA & Conversion (1-5)

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Primary CTA Clarity** | /5 | [To be scored] |
| **Free vs. Paid Entry** | /5 | [To be scored] |
| **Signup Friction** | /5 | [To be scored] |
| **Urgency/Scarcity** | /5 | [To be scored] |
| **Subtotal** | **/20** | |

### 5. AI Integration (if applicable) (1-5)

| Dimension | Score | Notes |
|-----------|-------|-------|
| **AI Positioning** | /5 | [To be scored] |
| **AI Feature Gating** | /5 | [To be scored] |
| **AI Trust Signals** | /5 | [To be scored] |
| **Subtotal** | **/15** | |

### 6. Community & Engagement (1-5)

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Community Visibility** | /5 | [To be scored] |
| **UGC Integration** | /5 | [To be scored] |
| **Gamification** | /5 | [To be scored] |
| **Subtotal** | **/15** | |

---

## Total Score

| Category | Score |
|----------|-------|
| Positioning & Messaging | /20 |
| Visual Design & UX | /25 |
| Trust & Social Proof | /25 |
| CTA & Conversion | /20 |
| AI Integration | /15 |
| Community & Engagement | /15 |
| **TOTAL** | **/120** |

**Grade**: [ ] A (96+) [ ] B (84-95) [ ] C (72-83) [ ] D (60-71) [ ] F (<60)

---

## What They Do Well

1. **${competitor.studyFocus?.[0] || 'Key Strength 1'}**: [To be analyzed]
2. **${competitor.studyFocus?.[1] || 'Key Strength 2'}**: [To be analyzed]
3. **${competitor.studyFocus?.[2] || 'Key Strength 3'}**: [To be analyzed]

---

## What They Could Improve

1. **[To be identified]**: [Specific observation]
2. **[To be identified]**: [Specific observation]

---

## Key Patterns to Study

- **Pattern**: ${competitor.topPattern}
- **Implementation**: [To be analyzed based on screenshots]
- **Evidence**: [To be documented]

---

## What AutoRev Can Learn

### Immediate Applicability
1. **[To be identified]**: [How AutoRev could apply this]
2. **[To be identified]**: [How AutoRev could apply this]

### Strategic Considerations
1. **[To be identified]**: [Longer-term opportunity]

---

## Extracted Content Summary

### Headlines Found
- **H1**: ${h1}
- **H2s**: ${h2s}

### CTAs Found
- **Primary**: ${primaryCTA}
- **Secondary**: ${secondaryCTAs}

### Pricing Information
| Tier | Price | Key Features |
|------|-------|--------------|
${pricingTable}

### Social Proof Stats
${stats}

---

## Related Resources

- **Company Website**: ${competitor.urls.homepage}
- **Pricing Page**: ${competitor.urls.pricing || 'N/A'}
- **Features Page**: ${competitor.urls.features || 'N/A'}
- **About Page**: ${competitor.urls.about || 'N/A'}

---

*Analysis generated as part of AutoRev's competitive intelligence initiative.*
*Report template pre-filled with extracted data. Manual analysis and scoring required.*
`;

  return report;
}

/**
 * Main execution
 */
async function main() {
  const options = parseArgs();
  const { competitors, categories } = await loadConfig(options);

  console.log('\n📝 Generating Analysis Reports');
  console.log('━'.repeat(50));
  console.log(`📊 Competitors: ${competitors.length}`);

  // Ensure output directory exists
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  let generated = 0;
  let skipped = 0;
  let errors = 0;

  for (const competitor of competitors) {
    const outputPath = path.join(OUTPUT_DIR, `${competitor.slug}.md`);

    // Check if file exists and skip if not overwriting
    try {
      await fs.access(outputPath);
      if (!options.overwrite) {
        console.log(`  ⊘ Skipping ${competitor.name} (exists, use --overwrite)`);
        skipped++;
        continue;
      }
    } catch {
      // File doesn't exist, proceed
    }

    try {
      // Load extracted content
      const extracted = await loadExtractedContent(competitor.slug);
      
      // Check screenshots
      const screenshots = await checkScreenshots(competitor.category, competitor.slug);

      // Generate report
      const report = await generateReport(competitor, extracted, screenshots, categories);

      // Write report
      await fs.writeFile(outputPath, report);
      
      console.log(`  ✓ Generated: ${competitor.slug}.md`);
      generated++;
    } catch (error) {
      console.error(`  ✗ Error for ${competitor.name}: ${error.message}`);
      errors++;
    }
  }

  console.log('\n' + '━'.repeat(50));
  console.log('📊 GENERATION SUMMARY');
  console.log('━'.repeat(50));
  console.log(`✓ Generated: ${generated}`);
  console.log(`⊘ Skipped: ${skipped}`);
  console.log(`✗ Errors: ${errors}`);
  console.log(`📁 Output: ${OUTPUT_DIR}`);
  console.log('━'.repeat(50) + '\n');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
