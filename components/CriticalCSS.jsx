/**
 * CriticalCSS - Inlines critical CSS in <head> for instant render
 *
 * This component eliminates render-blocking CSS by:
 * 1. Inlining essential above-the-fold styles directly in HTML
 * 2. Allowing the browser to render immediately without waiting for CSS files
 *
 * The critical CSS is read at build time and inlined as a <style> tag.
 * Full styles are still loaded via globals.css import (deferred by browser).
 *
 * @see styles/critical.css for the critical styles source
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Read critical CSS at build time (only runs on server)
function getCriticalCSS() {
  try {
    const criticalPath = join(process.cwd(), 'styles', 'critical.css');
    return readFileSync(criticalPath, 'utf8');
  } catch {
    // Fallback to minimal inline styles if file read fails
    return `
      html, body { background: #0d1b2a; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
    `;
  }
}

// Minify CSS by removing comments and extra whitespace
function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/\s*([{}:;,])\s*/g, '$1') // Remove space around punctuation
    .replace(/;}/g, '}') // Remove last semicolon in block
    .trim();
}

export default function CriticalCSS() {
  const criticalCSS = minifyCSS(getCriticalCSS());

  return <style id="critical-css" dangerouslySetInnerHTML={{ __html: criticalCSS }} />;
}
