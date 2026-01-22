#!/usr/bin/env node

/**
 * Generate all merch designs with proper brand guidelines
 * - Oswald font (matching logo)
 * - Brand colors: white (#ffffff), lime (#d4ff00), teal (#10b981)
 * - 5 variations per design: white, white+lime, white+teal, all lime, all teal
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, '..', 'public', 'merch-designs');

// Brand colors from guidelines
const COLORS = {
  white: '#ffffff',
  lime: '#d4ff00',   // User actions, CTAs
  teal: '#10b981',   // Positive data, improvements
};

// All designs with their text
const designs = [
  // 1-word
  { name: 'modified', text: 'MODIFIED', size: 80, width: 800, spacing: 4 },
  { name: 'tuned', text: 'TUNED', size: 88, width: 600, spacing: 8 },
  { name: 'boosted', text: 'BOOSTED', size: 80, width: 700, spacing: 6 },
  
  // 2-word
  { name: 'never-stock', text: ['NEVER', 'STOCK'], size: 72, width: 750, spacing: 4 },
  { name: 'built-different', text: ['BUILT', 'DIFFERENT'], size: 68, width: 850, spacing: 4 },
  { name: 'track-ready', text: ['TRACK', 'READY'], size: 72, width: 750, spacing: 4 },
  { name: 'garage-built', text: ['GARAGE', 'BUILT'], size: 68, width: 800, spacing: 4 },
  { name: 'boost-mode', text: ['BOOST', 'MODE'], size: 72, width: 750, spacing: 4 },
  
  // 3-word
  { name: 'built-not-bought', text: ['BUILT', 'NOT', 'BOUGHT'], size: 64, width: 950, spacing: 4 },
  { name: 'dyno-dont-lie', text: ['DYNO', 'DON\'T', 'LIE'], size: 64, width: 850, spacing: 4 },
  { name: 'more-boost-please', text: ['MORE', 'BOOST', 'PLEASE'], size: 62, width: 1000, spacing: 4 },
];

function createSVG(design, variant) {
  const { text, size, width, spacing } = design;
  const height = 200;
  const x = width / 2;
  const y = height / 2;
  
  let textElement;
  
  if (typeof text === 'string') {
    // Single word - simple fill
    const color = variant === 'white' ? COLORS.white : 
                  variant === 'lime' ? COLORS.lime : 
                  COLORS.teal;
    
    textElement = `  <text 
    x="${x}" 
    y="${y}" 
    text-anchor="middle" 
    dominant-baseline="middle"
    font-family="'Oswald', sans-serif"
    font-weight="700"
    font-size="${size}px"
    letter-spacing="${spacing}"
    fill="${color}"
  >${text}</text>`;
    
  } else {
    // Multi-word - handle color variations
    let tspans;
    
    if (variant === 'white') {
      tspans = text.map(word => `<tspan fill="${COLORS.white}">${word}${word !== text[text.length - 1] ? ' ' : ''}</tspan>`).join('');
    } else if (variant === 'lime') {
      tspans = text.map(word => `<tspan fill="${COLORS.lime}">${word}${word !== text[text.length - 1] ? ' ' : ''}</tspan>`).join('');
    } else if (variant === 'teal') {
      tspans = text.map(word => `<tspan fill="${COLORS.teal}">${word}${word !== text[text.length - 1] ? ' ' : ''}</tspan>`).join('');
    } else if (variant === 'white-lime') {
      // Last word lime, rest white
      tspans = text.map((word, i) => {
        const color = i === text.length - 1 ? COLORS.lime : COLORS.white;
        return `<tspan fill="${color}">${word}${i !== text.length - 1 ? ' ' : ''}</tspan>`;
      }).join('');
    } else if (variant === 'white-teal') {
      // Last word teal, rest white
      tspans = text.map((word, i) => {
        const color = i === text.length - 1 ? COLORS.teal : COLORS.white;
        return `<tspan fill="${color}">${word}${i !== text.length - 1 ? ' ' : ''}</tspan>`;
      }).join('');
    }
    
    textElement = `  <text 
    x="${x}" 
    y="${y}" 
    text-anchor="middle" 
    dominant-baseline="middle"
    font-family="'Oswald', sans-serif"
    font-weight="700"
    font-size="${size}px"
    letter-spacing="${spacing}"
  >
    ${tspans}
  </text>`;
  }
  
  const fullText = typeof text === 'string' ? text : text.join(' ');
  
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- ${fullText} - ${variant} -->
${textElement}
</svg>`;
}

// Generate all designs with all variants
let count = 0;
for (const design of designs) {
  const variants = typeof design.text === 'string' 
    ? ['white', 'lime', 'teal']  // 1-word: 3 variants
    : ['white', 'white-lime', 'white-teal', 'lime', 'teal'];  // Multi-word: 5 variants
  
  for (const variant of variants) {
    const filename = `${design.name}-${variant}.svg`;
    const filepath = path.join(outputDir, filename);
    const svg = createSVG(design, variant);
    
    fs.writeFileSync(filepath, svg);
    count++;
  }
}

console.log(`✅ Generated ${count} brand-consistent merch designs`);
console.log('\nUsing:');
console.log('- Font: Oswald (matching logo)');
console.log('- Colors: White, Lime (#d4ff00), Teal (#10b981)');
console.log(`\nFiles saved to: ${outputDir}`);
