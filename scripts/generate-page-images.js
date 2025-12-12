#!/usr/bin/env node
/**
 * Page & Atmospheric Image Generation Script
 * 
 * Generates enthusiast-focused page images for the AutoRev site.
 * These images capture the weekend warrior / hobbyist spirit - people who love cars,
 * might do track days for fun, and are passionate enthusiasts rather than pros.
 * 
 * Usage:
 *   node scripts/generate-page-images.js generate <key>     # Generate single image
 *   node scripts/generate-page-images.js generate-all       # Generate all images
 *   node scripts/generate-page-images.js upload <key>       # Upload single image to Blob
 *   node scripts/generate-page-images.js upload-all         # Upload all images to Blob
 *   node scripts/generate-page-images.js list               # List all images and status
 *   node scripts/generate-page-images.js prompt <key>       # Show prompt for an image
 * 
 * Environment variables required:
 *   GOOGLE_AI_API_KEY - Google AI API key
 *   BLOB_READ_WRITE_TOKEN - Vercel Blob token (for uploads)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(PROJECT_ROOT, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        let value = valueParts.join('=');
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (key && value) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const GENERATED_IMAGES_DIR = path.join(PROJECT_ROOT, 'generated-images', 'pages');

// Ensure directory exists
if (!fs.existsSync(GENERATED_IMAGES_DIR)) {
  fs.mkdirSync(GENERATED_IMAGES_DIR, { recursive: true });
}

// =============================================================================
// Image Definitions - Enthusiast-Focused
// =============================================================================

/**
 * All page and atmospheric images with enthusiast-focused prompts
 * Each image is designed to resonate with weekend warriors and hobbyists
 */
const PAGE_IMAGES = {
  // =========================================================================
  // PAGE HERO IMAGES (10)
  // =========================================================================
  
  carCatalogHero: {
    filename: 'car-catalog-hero.png',
    blobPath: 'pages/catalog/hero.webp',
    aspectRatio: '16:9',
    description: 'Car Catalog hero - cinematic track day scene with multiple enthusiast cars',
    prompt: `OUTDOOR cinematic photograph looking DOWN a professional racetrack straightaway. Multiple enthusiast sports cars driving at speed in formation - include a variety like a Porsche 911 GT3, a Corvette, a BMW M car, a Nissan GT-R, and a Mazda Miata all sharing the track. Shot from a low angle at track level, looking along the racing line with the cars approaching. Motion blur on the track surface and barriers conveys speed. The setting is a classic American road course like Road Atlanta or Laguna Seca - green grass, catch fencing, dramatic elevation changes visible ahead. Late afternoon golden hour lighting creating long shadows and warm tones. The atmosphere is ALIVE with energy - this is track day, enthusiasts pushing their machines. Porsche press photo quality - cinematic, dramatic, professional automotive photography. NOT a studio shot, real outdoor track environment with sky and scenery. The image should make you want to be there, feel the speed, hear the engines.`,
  },
  
  carSelectorHero: {
    filename: 'car-selector-hero.png',
    blobPath: 'pages/selector/hero.webp',
    aspectRatio: '16:9',
    description: 'Car Selector hero - curated collection of diverse sports cars to browse and choose from',
    prompt: `OUTDOOR photograph from an elevated perspective looking down at a curated gathering of diverse enthusiast sports cars arranged on an elegant brick or cobblestone courtyard. Include 8-12 different sports cars representing variety: a Porsche 911, a Chevrolet Corvette, a BMW M2, a Mazda Miata, a Ford Mustang GT, a Nissan 370Z, a Toyota Supra, and a Lotus in different colors - silver, blue, red, yellow, white, black. The cars are arranged artfully facing different directions, creating visual interest like a car show or private collection. Setting is an upscale venue with lush green trees forming a natural backdrop, dappled sunlight filtering through. The mood is aspirational yet approachable - these are attainable enthusiast cars, a collection you could browse to find YOUR perfect car. Shot from slightly above, inviting the viewer to explore the selection. Porsche press photo quality, warm afternoon light, intimate and exclusive atmosphere. This feels like discovering a hidden enthusiast gathering where you can find your dream car.`,
  },
  
  findYourCarHero: {
    filename: 'find-your-car-hero.png',
    blobPath: 'pages/find-your-car/hero.webp',
    aspectRatio: '16:9',
    description: 'Find Your Car page - silhouette of person getting into their perfect car at sunset',
    prompt: `CINEMATIC silhouette photograph at sunset on California Highway 1 or a stunning coastal cliff road. A beautiful sports car (like a Porsche 911 or sleek coupe) is parked at a scenic overlook, facing toward the Pacific Ocean. A person in SILHOUETTE is captured in the moment of opening the driver's door and stepping into the car - one foot in, hand on the door frame, about to embark on their journey. The sun is setting directly behind the scene, creating a dramatic orange and golden glow that outlines both the person and the car in a warm halo of light. The sky is painted in deep oranges, reds, purples, and golds. The ocean or dramatic landscape is visible in the background, slightly out of focus. The mood is deeply EMOTIONAL - this is THE MOMENT of finding your perfect match, the beginning of a love story between driver and machine. Dark, moody, with the sunset providing all the illumination. The silhouette conveys anticipation, excitement, and the promise of adventures to come. Professional cinematic photography, lens flare from the setting sun, the kind of image that makes your heart race. This is not just a car - it's YOUR car, YOUR perfect match.`,
  },
  
  // =========================================================================
  // CAROUSEL HERO IMAGES - Top 15 Cars (Dramatic Studio Silhouettes)
  // CRITICAL: All cars must be positioned identically for smooth carousel effect
  // - Car PERFECTLY CENTERED horizontally in frame
  // - Car occupies exactly 70% of frame width
  // - Wheels/ground line at exactly 60% down from top of image
  // - Camera at exact eye level, perfect 90-degree side profile
  // - Identical lighting setup and floor reflection for all
  // =========================================================================
  
  carouselCaymanGT4: {
    filename: 'carousel-cayman-gt4.png',
    blobPath: 'carousel/718-cayman-gt4.webp',
    aspectRatio: '16:9',
    description: 'Porsche 718 Cayman GT4 - dramatic studio silhouette',
    prompt: `Dark moody automotive studio photograph. Porsche 718 Cayman GT4 in perfect side profile facing left. Dark grey or black car color. Pure black background. Dramatic rim lighting - thin silver/white light outlines the car's silhouette along the roofline, hood, fenders, and rear wing. Dark reflective floor creates subtle mirror reflection. Very dark and cinematic mood. The car emerges from shadows with only edge lighting visible. Professional automotive photography, clean composition, eye-level camera angle.`,
  },
  
  carouselR8V10: {
    filename: 'carousel-r8-v10.png',
    blobPath: 'carousel/audi-r8-v10.webp',
    aspectRatio: '16:9',
    description: 'Audi R8 V10 - dramatic studio silhouette',
    prompt: `STUDIO photograph of an Audi R8 V10. CRITICAL POSITIONING: Car must be PERFECTLY CENTERED horizontally in frame. Car occupies exactly 70% of the frame width. The ground/wheel line is positioned at exactly 60% down from the top of the image. Camera is at EXACT eye level, shooting a perfect 90-degree side profile - no angle up or down. The car faces LEFT. Dark grey or black color. Pure black background (#000000). Dramatic RIM LIGHTING only - thin white/silver light tracing the roofline, distinctive side blade, and body curves. Dark polished concrete floor with subtle mirror reflection. VERY DARK and MOODY. The R8's mid-engine supercar silhouette emerges from pure darkness. NO other elements, NO gradients. Professional automotive studio photography, ultra-clean, minimalist.`,
  },
  
  carouselGallardo: {
    filename: 'carousel-gallardo.png',
    blobPath: 'carousel/lamborghini-gallardo.webp',
    aspectRatio: '16:9',
    description: 'Lamborghini Gallardo - dramatic studio silhouette',
    prompt: `STUDIO photograph of a Lamborghini Gallardo. CRITICAL POSITIONING: Car must be PERFECTLY CENTERED horizontally in frame. Car occupies exactly 70% of the frame width. The ground/wheel line is positioned at exactly 60% down from the top of the image. Camera is at EXACT eye level, shooting a perfect 90-degree side profile - no angle up or down. The car faces LEFT. Dark grey or black color. Pure black background (#000000). Dramatic RIM LIGHTING only - thin white/silver light tracing the sharp wedge roofline and aggressive Italian lines. Dark polished concrete floor with subtle mirror reflection. VERY DARK and MOODY. The Gallardo's exotic silhouette emerges from pure darkness. NO other elements, NO gradients. Professional automotive studio photography, minimalist.`,
  },
  
  carouselEmira: {
    filename: 'carousel-emira.png',
    blobPath: 'carousel/lotus-emira.webp',
    aspectRatio: '16:9',
    description: 'Lotus Emira - dramatic studio silhouette',
    prompt: `STUDIO photograph of a Lotus Emira. CRITICAL POSITIONING: Car must be PERFECTLY CENTERED horizontally in frame. Car occupies exactly 70% of the frame width. The ground/wheel line is positioned at exactly 60% down from the top of the image. Camera is at EXACT eye level, shooting a perfect 90-degree side profile - no angle up or down. The car faces LEFT. Dark grey or black color. Pure black background (#000000). Dramatic RIM LIGHTING only - thin white/silver light tracing the flowing British sports car curves and elegant mid-engine proportions. Dark polished concrete floor with subtle mirror reflection. VERY DARK and MOODY. The Emira's sophisticated silhouette emerges from pure darkness. NO other elements, NO gradients. Professional automotive studio photography, ultra-clean, minimalist.`,
  },
  
  carouselViper: {
    filename: 'carousel-viper.png',
    blobPath: 'carousel/dodge-viper.webp',
    aspectRatio: '16:9',
    description: 'Dodge Viper - dramatic studio silhouette',
    prompt: `STUDIO photograph of a Dodge Viper Gen 5 ACR. CRITICAL POSITIONING: Car must be PERFECTLY CENTERED horizontally in frame. Car occupies exactly 70% of the frame width. The ground/wheel line is positioned at exactly 60% down from the top of the image. Camera is at EXACT eye level, shooting a perfect 90-degree side profile - no angle up or down. The car faces LEFT. Dark grey or black color. Pure black background (#000000). Dramatic RIM LIGHTING only - thin white/silver light tracing the long hood, massive fenders, and huge rear wing. Dark polished concrete floor with subtle mirror reflection. VERY DARK and MOODY. The Viper's brutish American silhouette emerges from pure darkness. NO other elements, NO gradients. Professional automotive studio photography, minimalist.`,
  },
  
  carouselC8Corvette: {
    filename: 'carousel-c8-corvette.png',
    blobPath: 'carousel/c8-corvette.webp',
    aspectRatio: '16:9',
    description: 'C8 Corvette Stingray - dramatic studio silhouette',
    prompt: `STUDIO photograph of a C8 Chevrolet Corvette Stingray. CRITICAL POSITIONING: Car must be PERFECTLY CENTERED horizontally in frame. Car occupies exactly 70% of the frame width. The ground/wheel line is positioned at exactly 60% down from the top of the image. Camera is at EXACT eye level, shooting a perfect 90-degree side profile - no angle up or down. The car faces LEFT. Dark grey or black color. Pure black background (#000000). Dramatic RIM LIGHTING only - thin white/silver light tracing the sharp angles, floating roofline, and exotic mid-engine proportions. Dark polished concrete floor with subtle mirror reflection. VERY DARK and MOODY. The C8's supercar silhouette emerges from pure darkness. NO other elements, NO gradients. Professional automotive studio photography, ultra-clean, minimalist.`,
  },
  
  carousel911: {
    filename: 'carousel-911-991.png',
    blobPath: 'carousel/porsche-911-991.webp',
    aspectRatio: '16:9',
    description: 'Porsche 911 991 - dramatic studio silhouette',
    prompt: `STUDIO photograph of a Porsche 911 (991 generation Carrera S). CRITICAL POSITIONING: Car must be PERFECTLY CENTERED horizontally in frame. Car occupies exactly 70% of the frame width. The ground/wheel line is positioned at exactly 60% down from the top of the image. Camera is at EXACT eye level, shooting a perfect 90-degree side profile - no angle up or down. The car faces LEFT. Dark grey or black color. Pure black background (#000000). Dramatic RIM LIGHTING only - thin white/silver light tracing the iconic sloping roofline, rear-engine haunches, and timeless 911 curves. Dark polished concrete floor with subtle mirror reflection. VERY DARK and MOODY. The 911's legendary silhouette emerges from pure darkness. NO other elements, NO gradients. Professional automotive studio photography, minimalist.`,
  },
  
  carouselGTR: {
    filename: 'carousel-gtr.png',
    blobPath: 'carousel/nissan-gtr.webp',
    aspectRatio: '16:9',
    description: 'Nissan GT-R - dramatic studio silhouette',
    prompt: `STUDIO photograph of a Nissan GT-R R35. CRITICAL POSITIONING: Car must be PERFECTLY CENTERED horizontally in frame. Car occupies exactly 70% of the frame width. The ground/wheel line is positioned at exactly 60% down from the top of the image. Camera is at EXACT eye level, shooting a perfect 90-degree side profile - no angle up or down. The car faces LEFT. Dark grey or black color. Pure black background (#000000). Dramatic RIM LIGHTING only - thin white/silver light tracing the aggressive wide body, muscular fenders, and functional aerodynamics. Dark polished concrete floor with subtle mirror reflection. VERY DARK and MOODY. Godzilla's menacing silhouette emerges from pure darkness. NO other elements, NO gradients. Professional automotive studio photography, minimalist.`,
  },
  
  carouselGT500: {
    filename: 'carousel-gt500.png',
    blobPath: 'carousel/shelby-gt500.webp',
    aspectRatio: '16:9',
    description: 'Shelby GT500 - dramatic studio silhouette',
    prompt: `STUDIO photograph of a Ford Mustang Shelby GT500. CRITICAL POSITIONING: Car must be PERFECTLY CENTERED horizontally in frame. Car occupies exactly 70% of the frame width. The ground/wheel line is positioned at exactly 60% down from the top of the image. Camera is at EXACT eye level, shooting a perfect 90-degree side profile - no angle up or down. The car faces LEFT. Dark grey or black color. Pure black background (#000000). Dramatic RIM LIGHTING only - thin white/silver light tracing the aggressive hood vents, wide muscular body, and track-focused stance. Dark polished concrete floor with subtle mirror reflection. VERY DARK and MOODY. The GT500's powerful silhouette emerges from pure darkness. NO other elements, NO gradients. Professional automotive studio photography, minimalist.`,
  },
  
  carouselEvoraGT: {
    filename: 'carousel-evora-gt.png',
    blobPath: 'carousel/lotus-evora-gt.webp',
    aspectRatio: '16:9',
    description: 'Lotus Evora GT - dramatic studio silhouette',
    prompt: `STUDIO photograph of a Lotus Evora GT. CRITICAL POSITIONING: Car must be PERFECTLY CENTERED horizontally in frame. Car occupies exactly 70% of the frame width. The ground/wheel line is positioned at exactly 60% down from the top of the image. Camera is at EXACT eye level, shooting a perfect 90-degree side profile - no angle up or down. The car faces LEFT. Dark grey or black color. Pure black background (#000000). Dramatic RIM LIGHTING only - thin white/silver light tracing the elegant British GT curves, rear diffuser, and balanced mid-engine proportions. Dark polished concrete floor with subtle mirror reflection. VERY DARK and MOODY. The Evora GT's refined silhouette emerges from pure darkness. NO other elements, NO gradients. Professional automotive studio photography, minimalist.`,
  },
  
  carouselSupraMk4: {
    filename: 'carousel-supra-mk4.png',
    blobPath: 'carousel/toyota-supra-mk4.webp',
    aspectRatio: '16:9',
    description: 'Toyota Supra Mk4 A80 - dramatic studio silhouette',
    prompt: `STUDIO photograph of a Toyota Supra Mk4 A80 Turbo. CRITICAL POSITIONING: Car must be PERFECTLY CENTERED horizontally in frame. Car occupies exactly 70% of the frame width. The ground/wheel line is positioned at exactly 60% down from the top of the image. Camera is at EXACT eye level, shooting a perfect 90-degree side profile - no angle up or down. The car faces LEFT. Dark grey or black color. Pure black background (#000000). Dramatic RIM LIGHTING only - thin white/silver light tracing the distinctive bubble roof, flowing curves, and iconic rear wing. Dark polished concrete floor with subtle mirror reflection. VERY DARK and MOODY. The legendary Supra silhouette emerges from pure darkness. NO other elements, NO gradients. Professional automotive studio photography, minimalist, JDM legend.`,
  },
  
  carouselRX7: {
    filename: 'carousel-rx7-fd.png',
    blobPath: 'carousel/mazda-rx7-fd.webp',
    aspectRatio: '16:9',
    description: 'Mazda RX-7 FD3S - dramatic studio silhouette',
    prompt: `STUDIO photograph of a Mazda RX-7 FD3S. CRITICAL POSITIONING: Car must be PERFECTLY CENTERED horizontally in frame. Car occupies exactly 70% of the frame width. The ground/wheel line is positioned at exactly 60% down from the top of the image. Camera is at EXACT eye level, shooting a perfect 90-degree side profile - no angle up or down. The car faces LEFT. Dark grey or black color. Pure black background (#000000). Dramatic RIM LIGHTING only - thin white/silver light tracing the sensual organic curves, pop-up headlight profile, and perfect proportions. Dark polished concrete floor with subtle mirror reflection. VERY DARK and MOODY. The FD's gorgeous silhouette emerges from pure darkness. NO other elements, NO gradients. Professional automotive studio photography, minimalist, automotive art.`,
  },
  
  carousel1M: {
    filename: 'carousel-bmw-1m.png',
    blobPath: 'carousel/bmw-1m.webp',
    aspectRatio: '16:9',
    description: 'BMW 1M Coupe - dramatic studio silhouette',
    prompt: `STUDIO photograph of a BMW 1 Series M Coupe (E82 1M). CRITICAL POSITIONING: Car must be PERFECTLY CENTERED horizontally in frame. Car occupies exactly 70% of the frame width. The ground/wheel line is positioned at exactly 60% down from the top of the image. Camera is at EXACT eye level, shooting a perfect 90-degree side profile - no angle up or down. The car faces LEFT. Dark grey or black color. Pure black background (#000000). Dramatic RIM LIGHTING only - thin white/silver light tracing the wide box flares, aggressive compact stance, and muscular proportions. Dark polished concrete floor with subtle mirror reflection. VERY DARK and MOODY. The 1M's brutish silhouette emerges from pure darkness. NO other elements, NO gradients. Professional automotive studio photography, minimalist.`,
  },
  
  carouselRS5: {
    filename: 'carousel-rs5.png',
    blobPath: 'carousel/audi-rs5.webp',
    aspectRatio: '16:9',
    description: 'Audi RS5 - dramatic studio silhouette',
    prompt: `STUDIO photograph of an Audi RS5 Coupe. CRITICAL POSITIONING: Car must be PERFECTLY CENTERED horizontally in frame. Car occupies exactly 70% of the frame width. The ground/wheel line is positioned at exactly 60% down from the top of the image. Camera is at EXACT eye level, shooting a perfect 90-degree side profile - no angle up or down. The car faces LEFT. Dark grey or black color. Pure black background (#000000). Dramatic RIM LIGHTING only - thin white/silver light tracing the wide Quattro fenders, elegant roofline, and athletic GT proportions. Dark polished concrete floor with subtle mirror reflection. VERY DARK and MOODY. The RS5's refined silhouette emerges from pure darkness. NO other elements, NO gradients. Professional automotive studio photography, minimalist.`,
  },
  
  carousel997: {
    filename: 'carousel-997.png',
    blobPath: 'carousel/porsche-997.webp',
    aspectRatio: '16:9',
    description: 'Porsche 997 Carrera S - dramatic studio silhouette',
    prompt: `STUDIO photograph of a Porsche 997 Carrera S. CRITICAL POSITIONING: Car must be PERFECTLY CENTERED horizontally in frame. Car occupies exactly 70% of the frame width. The ground/wheel line is positioned at exactly 60% down from the top of the image. Camera is at EXACT eye level, shooting a perfect 90-degree side profile - no angle up or down. The car faces LEFT. Dark grey or black color. Pure black background (#000000). Dramatic RIM LIGHTING only - thin white/silver light tracing the classic 911 roofline, rear-engine haunches, and timeless curves. Dark polished concrete floor with subtle mirror reflection. VERY DARK and MOODY. The 997's beautiful silhouette emerges from pure darkness. NO other elements, NO gradients. Professional automotive studio photography, minimalist, Porsche perfection.`,
  },
  
  homeHero: {
    filename: 'home-hero.png',
    blobPath: 'pages/home/hero.webp',
    aspectRatio: '16:9',
    description: 'Homepage hero - Sunday morning drive vibes',
    prompt: `OUTDOOR photograph of a sports car driving on a winding mountain road at golden hour. The scene captures the feeling of a perfect Sunday morning drive - no traffic, open road ahead, beautiful scenery. The car is a relatable sports car (like a Porsche Cayman, Corvette, or Mustang GT) shown from a dynamic 3/4 angle. Warm golden sunlight, mountains or hills in the background, the joy of driving. This is NOT a race, it's a passionate enthusiast enjoying their weekend. Aspirational but attainable. Professional automotive photography, cinematic composition, real outdoor location.`,
  },
  
  homeValue: {
    filename: 'home-value.png',
    blobPath: 'pages/home/value-section.webp',
    aspectRatio: '16:9',
    description: 'Value section - Saturday garage session',
    prompt: `INDOOR photograph of a car enthusiast in their HOME GARAGE working on their sports car on a Saturday morning. The garage is a regular 2-car garage (not a professional shop) with tools organized on a pegboard, a workbench, maybe a small fridge. The person is casually dressed, genuinely enjoying the wrench time - this is their happy place. Natural light coming through the garage door. The car could be a Miata, 350Z, or Mustang - something attainable. Authentic enthusiast atmosphere, passion project vibes. NOT a professional setting, just a regular person who loves cars.`,
  },
  
  homeFeature: {
    filename: 'home-feature.png',
    blobPath: 'pages/home/feature-car.webp',
    aspectRatio: '16:9',
    description: 'Feature section - scenic overlook reward',
    prompt: `OUTDOOR photograph of a beautiful sports car parked at a scenic mountain overlook at sunset. The owner is standing nearby, leaning on a guardrail, enjoying the view after a great drive. The scene captures "the reward of ownership" - not just the car, but the experiences it enables. Warm evening light, dramatic vista, sense of accomplishment and peace. The car is clean but clearly driven and enjoyed, not a garage queen. Real location, authentic moment, aspirational lifestyle photography.`,
  },
  
  advisoryHero: {
    filename: 'advisory-hero.png',
    blobPath: 'pages/advisory/hero.webp',
    aspectRatio: '16:9',
    description: 'Advisory page - cars and coffee meet',
    prompt: `OUTDOOR photograph of a cars and coffee meet in a parking lot on a beautiful morning. A row of diverse, attainable sports cars - Mazda Miata, Porsche Cayman, Ford Mustang GT, Nissan 370Z, BMW M2 - parked side by side. Enthusiasts casually chatting, holding coffee cups, morning sunlight. The vibe is welcoming and community-oriented, not exclusive or intimidating. Regular people who share a passion for driving. This is where enthusiasts discover their next car. Authentic car meet atmosphere, warm morning light.`,
  },
  
  upgradesHero: {
    filename: 'upgrades-hero.png',
    blobPath: 'pages/upgrades/hero.webp',
    aspectRatio: '16:9',
    description: 'Upgrades page - parts ready to install',
    prompt: `INDOOR photograph of aftermarket performance parts laid out on a clean workbench, ready to be installed. Include: a set of coilovers (adjustable suspension), a cold air intake, an aftermarket exhaust, and high-performance brake pads. The parts are quality brands, still in packaging or freshly unboxed. A home garage setting with good lighting. The feeling of excitement before a weekend project. Tools nearby, maybe a laptop with installation instructions. Enthusiast DIY upgrade vibes, the anticipation of making your car better.`,
  },
  
  upgradesGarage: {
    filename: 'upgrades-garage.png',
    blobPath: 'pages/upgrades/garage.webp',
    aspectRatio: '16:9',
    description: 'Upgrades page - DIY project in progress',
    prompt: `INDOOR photograph of a home garage with a sports car on jack stands, mid-project. An enthusiast is underneath or beside the car, installing suspension components. The garage is a typical enthusiast's space - organized chaos, tools spread out, shop light providing illumination, maybe a beer on the workbench. The car is something relatable like a Miata, Mustang, or 350Z. Saturday afternoon DIY vibes, the satisfaction of doing it yourself. Authentic, not staged - this is real enthusiast life.`,
  },
  
  servicesHero: {
    filename: 'services-hero.png',
    blobPath: 'pages/services/hero.webp',
    aspectRatio: '16:9',
    description: 'Services page - friendly independent shop',
    prompt: `INDOOR photograph of a clean, well-organized INDEPENDENT automotive shop (not a dealership). A sports car is on a lift, and the atmosphere is professional but approachable and friendly. This is the kind of shop where the owner knows your name and genuinely cares about your car. Clean concrete floors, good lighting, organized tool chests, maybe some automotive art on the walls. The vibe says "trusted local experts" not "corporate service center." Welcoming atmosphere for enthusiasts who need professional help.`,
  },
  
  servicesWorkshop: {
    filename: 'services-workshop.png',
    blobPath: 'pages/services/workshop.webp',
    aspectRatio: '16:9',
    description: 'Services page - collaborative discussion',
    prompt: `INDOOR photograph in an automotive shop: a mechanic/technician and a car owner standing together next to a sports car, having a friendly discussion about the build. They're both pointing at something on the car, collaborating on the plan. The mechanic is approachable (not intimidating), maybe wearing a shop shirt. The owner looks engaged and comfortable, not confused or being upsold. The vibe is "we're in this together" - collaborative, educational, trustworthy. Good shop lighting, professional but friendly atmosphere.`,
  },
  
  performanceHero: {
    filename: 'performance-hero.png',
    blobPath: 'pages/performance/hero.webp',
    aspectRatio: '16:9',
    description: 'Performance HUB - dramatic engine bay showcasing power and engineering',
    prompt: `STUDIO photograph of a high-performance sports car engine bay, dramatically lit against a dark background. The engine features carbon fiber covers, polished aluminum components, and aggressive styling. Moody, high-contrast lighting highlights the textures - the weave of carbon fiber, the gleam of machined metal, the precision engineering. Could be a twin-turbo V8, flat-six, or high-revving inline-6. Red or orange accent details add visual drama. The image conveys RAW POWER, engineering excellence, and premium performance. This is the heart of the machine - where performance comes from. Professional automotive studio photography, dramatic rim lighting, deep shadows, premium feel. NO visible brand logos or badges. The engine should look like a work of art - mechanical beauty that makes enthusiasts' hearts race.`,
  },
  
  educationHero: {
    filename: 'education-hero.png',
    blobPath: 'pages/education/hero.webp',
    aspectRatio: '16:9',
    description: 'Education Center - technical learning and understanding how cars work as systems',
    prompt: `CINEMATIC photograph of a pristine automotive workshop/classroom environment. A sports car (like a Porsche 911 or BMW M3) is elevated on a professional lift with its suspension, brakes, and drivetrain components beautifully exposed and visible. The setting combines a high-end garage with educational elements - clean white walls, professional lighting, perhaps a large display screen showing technical diagrams in the background. Tools are organized immaculately. The mood is EDUCATIONAL and ASPIRATIONAL - this is where you come to truly understand your machine. Think of a premium driving school or manufacturer training center. Soft, even lighting that highlights the mechanical components clearly. The atmosphere suggests knowledge, precision, and mastery. This is NOT a dirty garage - it's a place of learning where enthusiasts become experts. Professional automotive photography, clean and modern aesthetic, cinematic composition.`,
  },
  
  contactHero: {
    filename: 'contact-hero.png',
    blobPath: 'pages/contact/hero.webp',
    aspectRatio: '16:9',
    description: 'Contact page - welcoming garage with sports car',
    prompt: `OUTDOOR photograph at dusk of a clean, well-lit home garage with the door open, a beautiful silver Porsche 911 parked inside facing outward. NO PEOPLE IN THE IMAGE. The garage has warm amber lighting from workshop lights, blue hour twilight sky visible outside. The garage is organized with tool chests, a workbench, and automotive memorabilia on the walls. The Porsche is the hero - clean, beautiful, inviting. The scene conveys "come talk to us about cars" - welcoming, professional, approachable. Focus entirely on the car and garage atmosphere. Cinematic lighting, no humans.`,
  },
  
  // =========================================================================
  // ATMOSPHERIC / DETAIL IMAGES (11)
  // =========================================================================
  
  engineBay: {
    filename: 'engine-bay.png',
    blobPath: 'shared/engine-bay.webp',
    aspectRatio: '16:9',
    description: 'Detail - clean enthusiast engine bay',
    prompt: `CLOSE-UP photograph of a clean, well-maintained engine bay of an enthusiast sports car. Could be a naturally aspirated V8 (like a Corvette LS) or a flat-6 (Porsche). The engine bay is CLEAN but not over-the-top show car - this is a car that gets driven and enjoyed, just well cared for. Maybe a few tasteful modifications visible (intake, strut brace). Good lighting showing the mechanical beauty. Enthusiast pride in maintenance, not concours perfection.`,
  },
  
  brakeDetail: {
    filename: 'brake-detail.png',
    blobPath: 'shared/brake-detail.webp',
    aspectRatio: '1:1',
    description: 'Detail - upgraded brake system',
    prompt: `CLOSE-UP photograph of an upgraded brake system on a sports car, visible through a quality aftermarket wheel. Big slotted or drilled rotors, painted calipers (red, yellow, or black), quality brake pads. The wheel is a tasteful aftermarket design, clean but not overly flashy. This is a street car with upgraded brakes for spirited driving and occasional track days - not a race car. Detail shot showing the quality of components. Good lighting, sharp focus on the brake assembly.`,
  },
  
  cockpitView: {
    filename: 'cockpit-view.png',
    blobPath: 'shared/cockpit-view.webp',
    aspectRatio: '16:9',
    description: 'Detail - driver POV on open road',
    prompt: `INTERIOR photograph from the driver's perspective inside a sports car. Hands on the steering wheel (at 9 and 3), looking out through the windshield at an open, winding road ahead. The interior is a nice sports car but not exotic - something like a Cayman, Corvette, M car, or Mustang. Dashboard gauges visible, sense of speed and engagement. The road ahead is empty and inviting. Captures the feeling of being IN the driving experience. Natural lighting, authentic POV shot.`,
  },
  
  exhaustTips: {
    filename: 'exhaust-tips.png',
    blobPath: 'shared/exhaust-tips.webp',
    aspectRatio: '16:9',
    description: 'Detail - aftermarket exhaust',
    prompt: `CLOSE-UP photograph of aftermarket exhaust tips on a parked sports car. Quality stainless steel or titanium tips, tasteful size (not obnoxiously large). The car's rear bumper and some body lines visible for context. This represents the sound upgrades enthusiasts love - a nice exhaust note that makes every drive more enjoyable. Low angle, good lighting showing the quality of the exhaust. Parked setting, maybe on a driveway or at a car meet.`,
  },
  
  wheelDetail: {
    filename: 'wheel-detail.png',
    blobPath: 'shared/wheel-detail.webp',
    aspectRatio: '1:1',
    description: 'Detail - quality wheel and tire',
    prompt: `CLOSE-UP photograph of a quality aftermarket wheel on a sports car, shot from a low angle at the curb. The wheel is a respected enthusiast brand design (think Enkei, BBS style, Apex style) - tasteful and performance-oriented, not gaudy. Mounted with a quality performance tire (visible sidewall). The car's fender and body line visible above. Represents the wheel/tire upgrades that transform a car's look and feel. Good lighting, sharp detail on the wheel spokes.`,
  },
  
  suspensionSetup: {
    filename: 'suspension-setup.png',
    blobPath: 'shared/suspension-setup.webp',
    aspectRatio: '16:9',
    description: 'Detail - coilover visible through wheel',
    prompt: `PHOTOGRAPH showing an aftermarket coilover suspension visible through the wheel well of a sports car. The coilover has the characteristic spring and adjustable damper body visible. The car has a nice, usable stance - lowered for looks and handling but not slammed. Shot from a low angle showing the suspension detail. This represents handling upgrades that make a car more fun to drive. Street car setup, not race car extreme.`,
  },
  
  garageMood: {
    filename: 'garage-mood.png',
    blobPath: 'shared/garage-mood.webp',
    aspectRatio: '16:9',
    description: 'Atmosphere - moody home garage',
    prompt: `MOODY atmospheric photograph of a home garage at dusk or evening. A sports car silhouette inside, maybe some warm string lights or a work light providing soft illumination. Tools on the wall, a workbench, personal touches that make it an enthusiast's sanctuary. The garage door might be partially open, showing twilight outside. This is someone's happy place - where they escape to work on their passion project. Cinematic mood lighting, warm tones, atmospheric and inviting.`,
  },
  
  carsAndCoffee: {
    filename: 'cars-and-coffee.png',
    blobPath: 'shared/cars-and-coffee.webp',
    aspectRatio: '16:9',
    description: 'Community - casual car meet',
    prompt: `OUTDOOR photograph of a casual cars and coffee meet in full swing. Diverse group of attainable sports cars parked together - mix of Japanese, American, and European. Enthusiasts of different ages walking around, chatting, holding coffee cups, admiring each other's cars. Morning sunlight, relaxed weekend atmosphere. This is the enthusiast community - welcoming, diverse, united by a shared passion. NOT an exclusive exotic car show, just regular people who love cars gathering on a Saturday morning.`,
  },
  
  canyonRoad: {
    filename: 'canyon-road.png',
    blobPath: 'shared/canyon-road.webp',
    aspectRatio: '16:9',
    description: 'Atmosphere - inviting driving road',
    prompt: `LANDSCAPE photograph of an empty, winding canyon or mountain road. The kind of road every enthusiast dreams of - smooth pavement, sweeping curves, beautiful scenery, no traffic. Could be California canyons, Blue Ridge Parkway style, or mountain passes. Golden hour lighting, the road inviting you to explore. NO car in this shot - this is about the destination, the drive waiting to happen. Aspirational driving road, natural beauty, sense of adventure.`,
  },
  
  trackDayFun: {
    filename: 'track-day-fun.png',
    blobPath: 'shared/track-day-fun.webp',
    aspectRatio: '16:9',
    description: 'Experience - amateur track day',
    prompt: `OUTDOOR photograph of an amateur track day in progress. Regular sports cars (Miatas, Mustangs, Corvettes, BMWs) on track - NO professional liveries or race cars. Drivers wearing helmets, having fun pushing their street cars. The paddock area visible with regular enthusiasts, pop-up canopies, coolers. This is accessible motorsport - regular people experiencing the thrill of driving on track. Fun, exciting, but approachable and NOT intimidating professional racing. Sunny day, action shot with some motion.`,
  },
  
  sunsetDrive: {
    filename: 'sunset-drive.png',
    blobPath: 'shared/sunset-drive.webp',
    aspectRatio: '16:9',
    description: 'Atmosphere - end of a great drive',
    prompt: `SILHOUETTE photograph of a sports car against a dramatic sunset sky. The car is parked, maybe at a viewpoint or on a quiet road. The feeling of the end of a perfect drive - satisfaction, peace, gratitude for the experience. Warm oranges and purples in the sky, the car as a dark silhouette. Could have a person leaning against the car, also in silhouette. Emotional, cinematic, captures why we love cars - it's about the experiences and memories. Beautiful end-of-day atmosphere.`,
  },
};

// =============================================================================
// Google Gemini Image Generation API
// =============================================================================

async function generateImageWithNanoBananaPro(prompt, outputPath, options = {}) {
  if (!GOOGLE_AI_API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY not set in environment');
  }
  
  const aspectRatio = options.aspectRatio || '16:9';
  const imageSize = options.imageSize || '2K';
  
  console.log('🍌 Generating image with Nano Banana Pro...');
  console.log(`   Aspect Ratio: ${aspectRatio}, Size: ${imageSize}`);
  
  const modelName = 'gemini-2.0-flash-exp';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GOOGLE_AI_API_KEY}`;
  
  const body = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
    }
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText}`);
  }
  
  const result = await response.json();
  
  const candidates = result.candidates || [];
  if (candidates.length === 0) {
    throw new Error('No candidates in response');
  }
  
  const parts = candidates[0].content?.parts || [];
  const imagePart = parts.find(p => p.inlineData);
  const textPart = parts.find(p => p.text);
  
  if (textPart) {
    console.log(`   Model notes: ${textPart.text.substring(0, 150)}...`);
  }
  
  if (!imagePart) {
    throw new Error('No image in response. The model may have refused or encountered an issue.');
  }
  
  const imageData = imagePart.inlineData.data;
  const mimeType = imagePart.inlineData.mimeType || 'image/png';
  
  let ext = '.png';
  if (mimeType === 'image/jpeg') ext = '.jpg';
  if (mimeType === 'image/webp') ext = '.webp';
  
  const buffer = Buffer.from(imageData, 'base64');
  const finalPath = outputPath.replace(/\.[^.]+$/, ext);
  
  fs.writeFileSync(finalPath, buffer);
  console.log(`✅ Image saved to: ${finalPath}`);
  
  return finalPath;
}

// =============================================================================
// Vercel Blob Upload
// =============================================================================

async function uploadToBlob(localPath, blobPath) {
  if (!BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN not set in environment');
  }
  
  console.log(`☁️  Uploading to Vercel Blob: ${blobPath}`);
  
  const { put, del, list } = await import('@vercel/blob');
  
  // First, try to delete the old file to force cache invalidation
  try {
    const existingBlobs = await list({ prefix: blobPath, token: BLOB_READ_WRITE_TOKEN });
    for (const existingBlob of existingBlobs.blobs) {
      console.log(`   Deleting old blob: ${existingBlob.pathname}`);
      await del(existingBlob.url, { token: BLOB_READ_WRITE_TOKEN });
    }
  } catch (e) {
    // Ignore if file doesn't exist
  }
  
  const fileBuffer = fs.readFileSync(localPath);
  const contentType = localPath.endsWith('.webp') ? 'image/webp' : 
                      localPath.endsWith('.jpg') ? 'image/jpeg' : 'image/png';
  
  const blob = await put(blobPath, fileBuffer, {
    access: 'public',
    contentType,
    token: BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
    cacheControlMaxAge: 60, // 60 seconds cache - lower for development
  });
  
  console.log(`✅ Uploaded to: ${blob.url}`);
  return blob.url;
}

// =============================================================================
// Commands
// =============================================================================

function listImages() {
  console.log('\n📋 Page & Atmospheric Images\n');
  console.log('='.repeat(70));
  
  const keys = Object.keys(PAGE_IMAGES);
  
  for (const key of keys) {
    const img = PAGE_IMAGES[key];
    const localPath = path.join(GENERATED_IMAGES_DIR, img.filename);
    const exists = fs.existsSync(localPath) || 
                   fs.existsSync(localPath.replace('.png', '.jpg')) ||
                   fs.existsSync(localPath.replace('.png', '.webp'));
    const status = exists ? '✅' : '⬜';
    
    console.log(`${status} ${key}`);
    console.log(`   File: ${img.filename}`);
    console.log(`   Blob: ${img.blobPath}`);
    console.log(`   Desc: ${img.description}`);
    console.log('');
  }
  
  console.log(`Total: ${keys.length} images`);
}

function showPrompt(key) {
  const img = PAGE_IMAGES[key];
  if (!img) {
    console.error(`❌ Image not found: ${key}`);
    console.log('\nAvailable keys:');
    Object.keys(PAGE_IMAGES).forEach(k => console.log(`  - ${k}`));
    return;
  }
  
  console.log(`\n📝 Prompt for "${key}":\n`);
  console.log(img.prompt);
  console.log(`\n📁 Save as: generated-images/pages/${img.filename}`);
  console.log(`☁️  Blob path: ${img.blobPath}`);
}

async function generateImage(key) {
  const img = PAGE_IMAGES[key];
  if (!img) {
    console.error(`❌ Image not found: ${key}`);
    return null;
  }
  
  console.log(`\n🖼️  Generating: ${key}`);
  console.log(`   ${img.description}`);
  console.log(`   Aspect: ${img.aspectRatio}`);
  
  const outputPath = path.join(GENERATED_IMAGES_DIR, img.filename);
  
  try {
    const finalPath = await generateImageWithNanoBananaPro(
      img.prompt,
      outputPath,
      { aspectRatio: img.aspectRatio, imageSize: '2K' }
    );
    
    console.log(`\n✅ Generated: ${key}`);
    return finalPath;
  } catch (error) {
    console.error(`\n❌ Failed to generate ${key}: ${error.message}`);
    return null;
  }
}

async function uploadImage(key) {
  const img = PAGE_IMAGES[key];
  if (!img) {
    console.error(`❌ Image not found: ${key}`);
    return null;
  }
  
  // Find the local file
  const possibleFiles = [
    img.filename,
    img.filename.replace('.png', '.jpg'),
    img.filename.replace('.png', '.webp'),
  ];
  
  let localPath = null;
  for (const filename of possibleFiles) {
    const fullPath = path.join(GENERATED_IMAGES_DIR, filename);
    if (fs.existsSync(fullPath)) {
      localPath = fullPath;
      break;
    }
  }
  
  if (!localPath) {
    console.error(`❌ No local file found for ${key}`);
    return null;
  }
  
  try {
    const url = await uploadToBlob(localPath, img.blobPath);
    return url;
  } catch (error) {
    console.error(`❌ Failed to upload ${key}: ${error.message}`);
    return null;
  }
}

async function generateAll(delayMs = 5000) {
  console.log('\n🚀 Starting batch page image generation...\n');
  
  const keys = Object.keys(PAGE_IMAGES);
  const results = { success: [], failed: [], skipped: [] };
  
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const img = PAGE_IMAGES[key];
    
    console.log(`\n📍 Progress: ${i + 1}/${keys.length}`);
    
    // Check if already exists
    const possibleFiles = [
      img.filename,
      img.filename.replace('.png', '.jpg'),
      img.filename.replace('.png', '.webp'),
    ];
    
    let exists = false;
    for (const filename of possibleFiles) {
      if (fs.existsSync(path.join(GENERATED_IMAGES_DIR, filename))) {
        exists = true;
        break;
      }
    }
    
    if (exists) {
      console.log(`⏭️  Skipping ${key} - already exists`);
      results.skipped.push(key);
    } else {
      const result = await generateImage(key);
      if (result) {
        results.success.push(key);
      } else {
        results.failed.push(key);
      }
      
      // Delay between API calls
      if (i < keys.length - 1) {
        console.log(`⏳ Waiting ${delayMs/1000}s before next generation...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 GENERATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${results.success.length}`);
  console.log(`⏭️  Skipped: ${results.skipped.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed images:');
    results.failed.forEach(k => console.log(`   - ${k}`));
  }
  
  return results;
}

async function uploadAll() {
  console.log('\n☁️  Uploading all generated images to Blob...\n');
  
  const keys = Object.keys(PAGE_IMAGES);
  const results = { success: [], failed: [], skipped: [] };
  const urls = {};
  
  for (const key of keys) {
    const img = PAGE_IMAGES[key];
    
    // Find the local file
    const possibleFiles = [
      img.filename,
      img.filename.replace('.png', '.jpg'),
      img.filename.replace('.png', '.webp'),
    ];
    
    let localPath = null;
    for (const filename of possibleFiles) {
      const fullPath = path.join(GENERATED_IMAGES_DIR, filename);
      if (fs.existsSync(fullPath)) {
        localPath = fullPath;
        break;
      }
    }
    
    if (!localPath) {
      console.log(`⏭️  Skipping ${key} - no local file`);
      results.skipped.push(key);
      continue;
    }
    
    try {
      const url = await uploadToBlob(localPath, img.blobPath);
      results.success.push(key);
      urls[key] = url;
    } catch (error) {
      console.error(`❌ Failed ${key}: ${error.message}`);
      results.failed.push(key);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 UPLOAD SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Uploaded: ${results.success.length}`);
  console.log(`⏭️  Skipped: ${results.skipped.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  
  if (results.success.length > 0) {
    console.log('\n📋 Uploaded URLs:');
    for (const key of results.success) {
      console.log(`   ${key}: ${urls[key]}`);
    }
  }
  
  return { results, urls };
}

// =============================================================================
// Main
// =============================================================================

const command = process.argv[2];
const arg = process.argv[3];
const delayFlag = process.argv.find(a => a.startsWith('--delay='));
const delayMs = delayFlag ? parseInt(delayFlag.split('=')[1], 10) : 5000;

switch (command) {
  case 'list':
    listImages();
    break;
    
  case 'prompt':
    if (!arg) {
      console.error('Usage: node scripts/generate-page-images.js prompt <key>');
      process.exit(1);
    }
    showPrompt(arg);
    break;
    
  case 'generate':
    if (!arg) {
      console.error('Usage: node scripts/generate-page-images.js generate <key>');
      process.exit(1);
    }
    generateImage(arg);
    break;
    
  case 'generate-all':
    generateAll(delayMs);
    break;
    
  case 'upload':
    if (!arg) {
      console.error('Usage: node scripts/generate-page-images.js upload <key>');
      process.exit(1);
    }
    uploadImage(arg);
    break;
    
  case 'upload-all':
    uploadAll();
    break;
    
  default:
    console.log(`
🖼️  Page & Atmospheric Image Generation Script

Usage:
  node scripts/generate-page-images.js <command> [args]

Commands:
  list                    List all images and their status
  prompt <key>            Show the prompt for an image
  generate <key>          Generate a single image
  generate-all            Generate all images (skips existing)
  upload <key>            Upload a single image to Blob
  upload-all              Upload all generated images to Blob

Options:
  --delay=5000            Delay between generations in ms (default: 5000)

Examples:
  node scripts/generate-page-images.js list
  node scripts/generate-page-images.js generate homeHero
  node scripts/generate-page-images.js generate-all --delay=3000
  node scripts/generate-page-images.js upload-all

Image Keys:
${Object.keys(PAGE_IMAGES).map(k => `  - ${k}`).join('\n')}
`);
}

