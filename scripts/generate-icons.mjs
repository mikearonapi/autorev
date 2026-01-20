#!/usr/bin/env node
/**
 * Generate App Icons and Favicons
 * 
 * Creates all required icon sizes for PWA and favicons using the AUTOREV wordmark.
 * - Small sizes (16, 32, 48): Use "AR" condensed logo
 * - Large sizes (180, 192, 512): Use full "AUTOREV" wordmark
 * 
 * Brand colors:
 * - Background: #0d1b2a (navy)
 * - "AUTO": #ffffff (white)
 * - "REV": #d4ff00 (lime)
 * 
 * Usage: node scripts/generate-icons.mjs
 */

import sharp from 'sharp';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

// Brand colors from brand-guidelines.mdc
const COLORS = {
  navy: '#0d1b2a',
  white: '#ffffff',
  lime: '#d4ff00',
};

// Icon configurations
const ICON_SIZES = [
  { name: 'favicon-16x16.png', size: 16, type: 'small' },
  { name: 'favicon-32x32.png', size: 32, type: 'small' },
  { name: 'favicon-48x48.png', size: 48, type: 'small' },
  { name: 'apple-touch-icon.png', size: 180, type: 'large' },
  { name: 'icon-192x192.png', size: 192, type: 'large' },
  { name: 'icon-512x512.png', size: 512, type: 'large' },
  // Header logo icon - condensed AR style for in-app use (displayed at 36px)
  { name: 'images/autorev-logo-wordmark.png', size: 72, type: 'header' },
  // Email logo - larger version of the header logo for email templates
  { name: 'images/autorev-email-logo.png', size: 120, type: 'email' },
];

/**
 * Generate SVG for small icons (AR condensed logo)
 * Uses bold, condensed "AR" letters
 */
function generateSmallIconSVG(size) {
  const padding = Math.round(size * 0.15);
  const fontSize = Math.round(size * 0.55);
  const letterSpacing = Math.round(size * -0.05); // Tight spacing
  
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${COLORS.navy}" rx="${Math.round(size * 0.2)}"/>
      <text 
        x="50%" 
        y="55%" 
        text-anchor="middle" 
        dominant-baseline="middle"
        font-family="'Oswald', 'Arial Black', sans-serif"
        font-weight="700"
        font-size="${fontSize}px"
        letter-spacing="${letterSpacing}px"
      >
        <tspan fill="${COLORS.white}">A</tspan><tspan fill="${COLORS.lime}">R</tspan>
      </text>
    </svg>
  `.trim();
}

/**
 * Generate SVG for large icons (AUTOREV full wordmark)
 */
function generateLargeIconSVG(size) {
  const fontSize = Math.round(size * 0.18); // Slightly smaller to fit with padding
  const cornerRadius = Math.round(size * 0.15);
  
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${COLORS.navy}" rx="${cornerRadius}"/>
      <text 
        x="50%" 
        y="52%" 
        text-anchor="middle" 
        dominant-baseline="middle"
        font-family="'Oswald', 'Arial Black', Impact, sans-serif"
        font-weight="700"
        font-size="${fontSize}px"
        letter-spacing="0"
      >
        <tspan fill="${COLORS.white}">AUTO</tspan><tspan fill="${COLORS.lime}">REV</tspan>
      </text>
    </svg>
  `.trim();
}

/**
 * Generate SVG for favicon.ico (needs to work at very small sizes)
 */
function generateFaviconSVG(size) {
  // For very small sizes, just use a simple "A" with lime accent
  const fontSize = Math.round(size * 0.7);
  const cornerRadius = Math.round(size * 0.2);
  
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${COLORS.navy}" rx="${cornerRadius}"/>
      <text 
        x="50%" 
        y="55%" 
        text-anchor="middle" 
        dominant-baseline="middle"
        font-family="'Oswald', 'Arial Black', Impact, sans-serif"
        font-weight="700"
        font-size="${fontSize}px"
      >
        <tspan fill="${COLORS.white}">A</tspan>
      </text>
      <!-- Lime accent bar -->
      <rect 
        x="${Math.round(size * 0.65)}" 
        y="${Math.round(size * 0.2)}" 
        width="${Math.round(size * 0.12)}" 
        height="${Math.round(size * 0.25)}" 
        fill="${COLORS.lime}"
        rx="${Math.round(size * 0.03)}"
      />
    </svg>
  `.trim();
}

/**
 * Generate SVG for header logo (medium size AR icon)
 * Larger, more refined version of the small icon
 */
function generateHeaderIconSVG(size) {
  const fontSize = Math.round(size * 0.5);
  const cornerRadius = Math.round(size * 0.18);
  
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${COLORS.navy}" rx="${cornerRadius}"/>
      <text 
        x="50%" 
        y="54%" 
        text-anchor="middle" 
        dominant-baseline="middle"
        font-family="'Oswald', 'Arial Black', Impact, sans-serif"
        font-weight="700"
        font-size="${fontSize}px"
        letter-spacing="-1px"
      >
        <tspan fill="${COLORS.white}">A</tspan><tspan fill="${COLORS.lime}">R</tspan>
      </text>
    </svg>
  `.trim();
}

/**
 * Generate SVG for email logo (medium-large size with full wordmark)
 * Square format optimized for email headers at 60-120px display
 */
function generateEmailIconSVG(size) {
  const fontSize = Math.round(size * 0.22);
  const cornerRadius = Math.round(size * 0.12);
  
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${COLORS.navy}" rx="${cornerRadius}"/>
      <text 
        x="50%" 
        y="52%" 
        text-anchor="middle" 
        dominant-baseline="middle"
        font-family="'Oswald', 'Arial Black', Impact, sans-serif"
        font-weight="700"
        font-size="${fontSize}px"
        letter-spacing="0"
      >
        <tspan fill="${COLORS.white}">AUTO</tspan><tspan fill="${COLORS.lime}">REV</tspan>
      </text>
    </svg>
  `.trim();
}

/**
 * Convert SVG string to PNG buffer using sharp
 */
async function svgToPng(svgString, size) {
  const svgBuffer = Buffer.from(svgString);
  
  return sharp(svgBuffer)
    .resize(size, size)
    .png({ quality: 100 })
    .toBuffer();
}

/**
 * Generate all icons
 */
async function generateIcons() {
  console.log('🎨 Generating AUTOREV app icons...\n');
  console.log(`   Background: ${COLORS.navy}`);
  console.log(`   "AUTO": ${COLORS.white}`);
  console.log(`   "REV": ${COLORS.lime}\n`);

  for (const icon of ICON_SIZES) {
    try {
      let svg;
      
      if (icon.type === 'header') {
        // Header icon: Use refined AR logo
        svg = generateHeaderIconSVG(icon.size);
      } else if (icon.type === 'email') {
        // Email icon: Use full wordmark at larger size
        svg = generateEmailIconSVG(icon.size);
      } else if (icon.size <= 48) {
        // Small icons: Use "AR" or single "A" with accent
        svg = icon.size <= 24 ? generateFaviconSVG(icon.size) : generateSmallIconSVG(icon.size);
      } else {
        // Large icons: Use full "AUTOREV" wordmark
        svg = generateLargeIconSVG(icon.size);
      }
      
      const pngBuffer = await svgToPng(svg, icon.size);
      const outputPath = join(PUBLIC_DIR, icon.name);
      
      writeFileSync(outputPath, pngBuffer);
      console.log(`   ✅ ${icon.name} (${icon.size}x${icon.size})`);
      
    } catch (error) {
      console.error(`   ❌ Failed to generate ${icon.name}:`, error.message);
    }
  }

  // Also generate an SVG version for better scaling
  const svgPath = join(PUBLIC_DIR, 'icon.svg');
  writeFileSync(svgPath, generateLargeIconSVG(512));
  console.log('   ✅ icon.svg (scalable vector)');

  console.log('\n✨ Icon generation complete!');
  console.log('\nGenerated files:');
  ICON_SIZES.forEach(icon => console.log(`   • public/${icon.name}`));
  console.log('   • public/icon.svg');
  
  console.log('\n📝 Note: The icons use system fonts. For best results with the');
  console.log('   Oswald font, you may want to install it locally or create');
  console.log('   the icons manually in a design tool for pixel-perfect results.');
}

// Run the generator
generateIcons().catch(console.error);
