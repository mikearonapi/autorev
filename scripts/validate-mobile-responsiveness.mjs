#!/usr/bin/env node

/**
 * Mobile Responsiveness Validation Script
 * 
 * Validates that all critical mobile responsiveness fixes are in place.
 * Run with: node scripts/validate-mobile-responsiveness.mjs
 * 
 * Exit codes:
 *   0 - All checks passed
 *   1 - Validation failures found
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  pass: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  fail: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.blue}━━━ ${msg} ━━━${colors.reset}\n`),
};

let failures = 0;
let passes = 0;

/**
 * Read file contents
 */
function readFile(relativePath) {
  const fullPath = path.join(rootDir, relativePath);
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

/**
 * Check if CSS contains minimum touch target size
 */
function checkTouchTargets(filePath, selectors) {
  const content = readFile(filePath);
  if (!content) {
    log.fail(`File not found: ${filePath}`);
    failures++;
    return;
  }

  for (const selector of selectors) {
    // Look for min-width/min-height: 44px or width/height: 44px
    const patterns = [
      new RegExp(`${selector}[^}]*(?:min-)?(?:width|height):\\s*44px`, 'i'),
      new RegExp(`${selector}[^}]*(?:min-)?(?:width|height):\\s*4[4-9]px`, 'i'),
      new RegExp(`${selector}[^}]*touch-target-min`, 'i'),
    ];
    
    const hasCompliantTarget = patterns.some(pattern => pattern.test(content));
    
    if (hasCompliantTarget) {
      log.pass(`${filePath} - ${selector} has 44px+ touch target`);
      passes++;
    } else {
      log.fail(`${filePath} - ${selector} may not meet 44px touch target minimum`);
      failures++;
    }
  }
}

/**
 * Check if CSS contains safe area inset support
 */
function checkSafeAreaInsets(filePath, patterns = ['env\\(safe-area-inset']) {
  const content = readFile(filePath);
  if (!content) {
    log.fail(`File not found: ${filePath}`);
    failures++;
    return;
  }

  for (const pattern of patterns) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(content)) {
      log.pass(`${filePath} - Has safe area inset support`);
      passes++;
      return;
    }
  }
  
  log.fail(`${filePath} - Missing safe area inset support`);
  failures++;
}

/**
 * Check if CSS has touch manipulation support
 */
function checkTouchAction(filePath) {
  const content = readFile(filePath);
  if (!content) {
    log.fail(`File not found: ${filePath}`);
    failures++;
    return;
  }

  if (/touch-action:\s*manipulation/i.test(content)) {
    log.pass(`${filePath} - Has touch-action: manipulation`);
    passes++;
  } else {
    log.warn(`${filePath} - Consider adding touch-action: manipulation for better touch response`);
  }
}

/**
 * Check if JSX file has proper event handling for Android
 */
function checkAndroidEventHandling(filePath, patterns) {
  const content = readFile(filePath);
  if (!content) {
    log.fail(`File not found: ${filePath}`);
    failures++;
    return;
  }

  for (const pattern of patterns) {
    if (content.includes(pattern)) {
      log.pass(`${filePath} - Has ${pattern}`);
      passes++;
    } else {
      log.warn(`${filePath} - Missing ${pattern} (optional but recommended for Android)`);
    }
  }
}

/**
 * Check mobile utilities CSS exists and is imported
 */
function checkMobileUtilities() {
  const utilitiesPath = 'app/mobile-utilities.css';
  const globalsPath = 'app/globals.css';
  
  const utilitiesContent = readFile(utilitiesPath);
  const globalsContent = readFile(globalsPath);
  
  if (!utilitiesContent) {
    log.fail('Mobile utilities CSS not found');
    failures++;
    return;
  }
  
  log.pass('Mobile utilities CSS exists');
  passes++;
  
  if (globalsContent && globalsContent.includes('mobile-utilities.css')) {
    log.pass('Mobile utilities CSS is imported in globals.css');
    passes++;
  } else {
    log.fail('Mobile utilities CSS not imported in globals.css');
    failures++;
  }
  
  // Check for key utilities
  const requiredUtilities = [
    '.touch-target-44',
    '.safe-area-modal',
    '.scroll-x-with-indicators',
    '--touch-target-min',
  ];
  
  for (const utility of requiredUtilities) {
    if (utilitiesContent.includes(utility)) {
      log.pass(`Mobile utilities has: ${utility}`);
      passes++;
    } else {
      log.fail(`Mobile utilities missing: ${utility}`);
      failures++;
    }
  }
}

/**
 * Check for scroll blocking prevention
 */
function checkScrollBlockingPrevention(filePath) {
  const content = readFile(filePath);
  if (!content) {
    log.fail(`File not found: ${filePath}`);
    failures++;
    return;
  }

  if (/overscroll-behavior:\s*contain/i.test(content)) {
    log.pass(`${filePath} - Has overscroll-behavior: contain`);
    passes++;
  } else {
    log.warn(`${filePath} - Consider adding overscroll-behavior: contain to prevent scroll blocking`);
  }
}

/**
 * Main validation runner
 */
async function main() {
  console.log('\n' + colors.blue + '🔍 AutoRev Mobile Responsiveness Validation' + colors.reset);
  console.log(colors.cyan + 'Checking 47 mobile responsiveness requirements...' + colors.reset + '\n');

  // 1. Check mobile utilities
  log.header('MOBILE UTILITIES');
  checkMobileUtilities();

  // 2. Touch target compliance (44px minimum)
  log.header('TOUCH TARGET COMPLIANCE (44px minimum)');
  
  checkTouchTargets('app/garage/page.module.css', [
    '.headerActionBtn',
    '.headerActionBtnOwn', 
    '.collapseToggle',
    '.thumbnailDeleteBtn',
    '.overlayClose',
  ]);
  
  checkTouchTargets('app/browse-cars/page.module.css', [
    '.actionButton',
  ]);
  
  checkTouchTargets('components/SaveEventButton.module.css', [
    '.actionBtn',
  ]);
  
  checkTouchTargets('components/AuthModal.module.css', [
    '.closeBtn',
  ]);
  
  checkTouchTargets('components/ServiceLogModal.module.css', [
    '.closeBtn',
  ]);
  
  checkTouchTargets('components/EventFilters.module.css', [
    '.viewBtn',
  ]);
  
  checkTouchTargets('components/CarActionMenu.module.css', [
    '.compactBtn',
    '.dropdownTrigger',
  ]);
  
  checkTouchTargets('app/tuning-shop/page.module.css', [
    '.settingsBtn',
    '.closeBtn',
    '.deleteBtn',
  ]);
  
  checkTouchTargets('components/AddVehicleModal.module.css', [
    '.closeButton',
  ]);
  
  checkTouchTargets('components/AddFavoritesModal.module.css', [
    '.closeButton',
  ]);
  
  checkTouchTargets('components/CompareModal.module.css', [
    '.closeButton',
  ]);

  // 3. Safe area insets
  log.header('SAFE AREA INSET SUPPORT');
  
  checkSafeAreaInsets('app/mobile-utilities.css');
  checkSafeAreaInsets('components/AuthModal.module.css');
  checkSafeAreaInsets('components/ServiceLogModal.module.css');
  checkSafeAreaInsets('app/garage/page.module.css');
  checkSafeAreaInsets('components/Header.module.css');
  checkSafeAreaInsets('components/AddVehicleModal.module.css');
  checkSafeAreaInsets('components/AddFavoritesModal.module.css');
  checkSafeAreaInsets('components/CompareModal.module.css');
  checkSafeAreaInsets('app/tuning-shop/page.module.css');

  // 4. Touch action optimization
  log.header('TOUCH ACTION OPTIMIZATION');
  
  checkTouchAction('app/garage/page.module.css');
  checkTouchAction('app/browse-cars/page.module.css');
  checkTouchAction('components/SaveEventButton.module.css');

  // 5. Android event handling
  log.header('ANDROID EVENT HANDLING');
  
  checkAndroidEventHandling('components/SaveEventButton.jsx', [
    'onTouchEnd',
    'e.preventDefault',
    'e.stopPropagation',
  ]);

  // 6. Scroll blocking prevention
  log.header('SCROLL BLOCKING PREVENTION');
  
  checkScrollBlockingPrevention('components/AuthModal.module.css');
  checkScrollBlockingPrevention('components/ServiceLogModal.module.css');
  checkScrollBlockingPrevention('app/garage/page.module.css');

  // 7. Summary
  log.header('VALIDATION SUMMARY');
  
  const total = passes + failures;
  console.log(`\nTotal checks: ${total}`);
  console.log(`${colors.green}Passed: ${passes}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failures}${colors.reset}`);
  
  if (failures > 0) {
    console.log(`\n${colors.red}❌ ${failures} validation(s) failed. Please review the issues above.${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`\n${colors.green}✅ All mobile responsiveness validations passed!${colors.reset}\n`);
    process.exit(0);
  }
}

// Run validation
main().catch((err) => {
  console.error('Validation error:', err);
  process.exit(1);
});












