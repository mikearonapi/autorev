#!/usr/bin/env node
/**
 * Image Generation Helper Script
 * 
 * This script helps generate prompts and manage the image generation workflow.
 * It does NOT automatically generate images - that's done manually via Google AI Studio.
 * 
 * Usage:
 *   node scripts/generate-images.js list          # List all needed images
 *   node scripts/generate-images.js prompts       # Generate prompts for all images
 *   node scripts/generate-images.js prompts cars  # Generate prompts for car images only
 */

import { carData } from '../src/data/cars.js';

// Image categories and their templates
const imageCategories = {
  pageHeroes: [
    { filename: 'pages/home/hero.webp', description: 'Dynamic sports car on track with motion blur', dimensions: '1920x1080' },
    { filename: 'pages/home/value-prop.webp', description: 'Enthusiasts in garage or mechanic working on car', dimensions: '1200x800' },
    { filename: 'pages/advisory/hero.webp', description: 'Multiple sports cars arranged artfully', dimensions: '1920x600' },
    { filename: 'pages/performance/hero.webp', description: 'GT-style racing visualization', dimensions: '1920x600' },
    { filename: 'pages/upgrades/hero.webp', description: 'Close-up of performance parts (turbo, exhaust)', dimensions: '1920x600' },
    { filename: 'pages/services/hero.webp', description: 'Professional automotive shop environment', dimensions: '1920x600' },
    { filename: 'pages/contact/hero.webp', description: 'Subtle automotive background pattern', dimensions: '1920x400' },
  ],
  placeholders: [
    { filename: 'ui/placeholder-car.webp', description: 'Generic sports car silhouette', dimensions: '400x300' },
    { filename: 'ui/placeholder-page.webp', description: 'Abstract automotive pattern', dimensions: '1920x600' },
  ],
};

// Prompt templates
const promptTemplates = {
  carHero: (car) => `
Professional automotive photography of a ${car.years.split('-')[0]} ${car.name}, 
3/4 front angle, dramatic lighting, cinematic composition, high detail, 
8k resolution, Gran Turismo video game style, clean studio background 
with subtle gradient, showroom quality, ${car.category} sports car
  `.trim().replace(/\n/g, ' '),
  
  pageHero: (description, dimensions) => `
Wide cinematic shot of ${description}, professional automotive photography, 
dramatic lighting, motion blur effect, automotive atmosphere, 
8k resolution, aspect ratio ${dimensions === '1920x1080' ? '16:9' : '32:9'}
  `.trim().replace(/\n/g, ' '),
  
  placeholder: (description) => `
${description}, minimalist design, monochromatic gray tones, 
subtle texture, professional, clean
  `.trim().replace(/\n/g, ' '),
};

// Generate slug from car name
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// List all needed images
function listImages() {
  console.log('\n=== PAGE HERO IMAGES ===\n');
  imageCategories.pageHeroes.forEach(img => {
    console.log(`  ${img.filename} (${img.dimensions})`);
    console.log(`    ${img.description}\n`);
  });

  console.log('\n=== PLACEHOLDER IMAGES ===\n');
  imageCategories.placeholders.forEach(img => {
    console.log(`  ${img.filename} (${img.dimensions})`);
    console.log(`    ${img.description}\n`);
  });

  console.log('\n=== CAR HERO IMAGES ===\n');
  carData.forEach(car => {
    const slug = car.slug || generateSlug(car.name);
    console.log(`  cars/${slug}/hero.webp`);
    console.log(`    ${car.name} (${car.years})\n`);
  });

  console.log(`\nTotal: ${imageCategories.pageHeroes.length + imageCategories.placeholders.length + carData.length} images\n`);
}

// Generate prompts
function generatePrompts(category = 'all') {
  if (category === 'all' || category === 'pages') {
    console.log('\n=== PAGE HERO PROMPTS ===\n');
    imageCategories.pageHeroes.forEach(img => {
      console.log(`--- ${img.filename} ---`);
      console.log(promptTemplates.pageHero(img.description, img.dimensions));
      console.log('');
    });
  }

  if (category === 'all' || category === 'placeholders') {
    console.log('\n=== PLACEHOLDER PROMPTS ===\n');
    imageCategories.placeholders.forEach(img => {
      console.log(`--- ${img.filename} ---`);
      console.log(promptTemplates.placeholder(img.description));
      console.log('');
    });
  }

  if (category === 'all' || category === 'cars') {
    console.log('\n=== CAR HERO PROMPTS ===\n');
    carData.forEach(car => {
      const slug = car.slug || generateSlug(car.name);
      console.log(`--- cars/${slug}/hero.webp ---`);
      console.log(promptTemplates.carHero(car));
      console.log('');
    });
  }
}

// Main
const command = process.argv[2];
const subCommand = process.argv[3];

switch (command) {
  case 'list':
    listImages();
    break;
  case 'prompts':
    generatePrompts(subCommand);
    break;
  default:
    console.log(`
Image Generation Helper

Usage:
  node scripts/generate-images.js list            # List all needed images
  node scripts/generate-images.js prompts         # Generate all prompts
  node scripts/generate-images.js prompts cars    # Generate car prompts only
  node scripts/generate-images.js prompts pages   # Generate page prompts only

Workflow:
1. Run 'list' to see all images needed
2. Run 'prompts' to get AI generation prompts
3. Copy prompts to Google AI Studio / Imagen
4. Save generated images to local folder
5. Upload to Vercel Blob
6. Update Supabase with URLs (for car images)

See docs/image-inventory.md for full details.
    `);
}
