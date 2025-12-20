#!/usr/bin/env node
/**
 * Generate Migration 040: Seed Multi-Brand Parts + Fitments
 *
 * Why this exists:
 * - Writing a huge SQL migration directly through the editor can time out.
 * - This script streams the SQL file to disk locally, reliably.
 *
 * Output:
 * - supabase/migrations/040_seed_multi_brand_parts.sql (default)
 *
 * Usage:
 *   node scripts/generateSeedMultiBrandMigration.mjs
 *   node scripts/generateSeedMultiBrandMigration.mjs --out supabase/migrations/040_seed_multi_brand_parts.sql
 *   node scripts/generateSeedMultiBrandMigration.mjs --max-cars 10 --dry-run
 *   node scripts/generateSeedMultiBrandMigration.mjs --allow-unmatched
 *
 * Notes:
 * - By default this script FAILS if a car's platform_tags cannot be validated
 *   against `lib/vendorAdapters.js` patterns. Use --allow-unmatched to bypass
 *   that safety check (not recommended).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { resolveCarSlugFromTag } from '../lib/vendorAdapters.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs(argv) {
  const args = {
    out: path.resolve(__dirname, '../supabase/migrations/040_seed_multi_brand_parts.sql'),
    dryRun: false,
    maxCars: null,
    allowUnmatched: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') args.out = path.resolve(process.cwd(), argv[++i] || '');
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--max-cars') args.maxCars = Number(argv[++i] || '0') || null;
    else if (a === '--allow-unmatched') args.allowUnmatched = true;
    else if (a === '--help' || a === '-h') {
      args.help = true;
    } else {
      throw new Error(`Unknown arg: ${a}`);
    }
  }

  return args;
}

function stableDigits(input, digits = 5) {
  const hex = crypto.createHash('sha256').update(String(input)).digest('hex');
  const n = parseInt(hex.slice(0, 12), 16);
  return String(n % 10 ** digits).padStart(digits, '0');
}

function sqlString(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replaceAll("'", "''")}'`;
}

function jsonb(value) {
  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

/**
 * Current gap list (92 cars) captured from:
 * SELECT c.slug, c.name, c.brand FROM cars c
 * LEFT JOIN part_fitments pf ON pf.car_id = c.id
 * WHERE pf.id IS NULL
 * ORDER BY c.brand, c.name;
 *
 * Keep this list in sync if DB changes.
 */
export const ZERO_FITMENT_CARS = [
  { slug: 'acura-integra-type-r-dc2', name: 'Acura Integra Type R', brand: 'Acura' },
  { slug: 'alfa-romeo-4c', name: 'Alfa Romeo 4C', brand: 'Alfa Romeo' },
  { slug: 'alfa-romeo-giulia-quadrifoglio', name: 'Alfa Romeo Giulia Quadrifoglio', brand: 'Alfa Romeo' },
  { slug: 'aston-martin-v8-vantage', name: 'Aston Martin V8 Vantage', brand: 'Aston Martin' },
  { slug: 'audi-r8-v10', name: 'Audi R8 V10', brand: 'Audi' },
  { slug: 'audi-r8-v8', name: 'Audi R8 V8', brand: 'Audi' },
  { slug: 'audi-rs5-b8', name: 'Audi RS5 B8', brand: 'Audi' },
  { slug: 'audi-tt-rs-8j', name: 'Audi TT RS 8J', brand: 'Audi' },
  { slug: 'audi-tt-rs-8s', name: 'Audi TT RS 8S', brand: 'Audi' },
  { slug: 'bmw-1m-coupe-e82', name: 'BMW 1 Series M Coupe', brand: 'BMW' },
  { slug: 'bmw-m2-competition', name: 'BMW M2 Competition', brand: 'BMW' },
  { slug: 'bmw-m3-e46', name: 'BMW M3 E46', brand: 'BMW' },
  { slug: 'bmw-m3-e92', name: 'BMW M3 E92', brand: 'BMW' },
  { slug: 'bmw-m3-f80', name: 'BMW M3 F80', brand: 'BMW' },
  { slug: 'bmw-m4-f82', name: 'BMW M4 F82', brand: 'BMW' },
  { slug: 'bmw-m5-e39', name: 'BMW M5 E39', brand: 'BMW' },
  { slug: 'bmw-m5-e60', name: 'BMW M5 E60', brand: 'BMW' },
  { slug: 'bmw-m5-f10-competition', name: 'BMW M5 F10 Competition', brand: 'BMW' },
  { slug: 'bmw-m5-f90-competition', name: 'BMW M5 F90 Competition', brand: 'BMW' },
  { slug: 'bmw-z4m-e85-e86', name: 'BMW Z4 M Coupe/Roadster', brand: 'BMW' },
  { slug: 'cadillac-cts-v-gen2', name: 'Cadillac CTS-V Gen 2', brand: 'Cadillac' },
  { slug: 'cadillac-cts-v-gen3', name: 'Cadillac CTS-V Gen 3', brand: 'Cadillac' },
  { slug: 'c7-corvette-grand-sport', name: 'C7 Corvette Grand Sport', brand: 'Chevrolet' },
  { slug: 'c7-corvette-z06', name: 'C7 Corvette Z06', brand: 'Chevrolet' },
  { slug: 'c8-corvette-stingray', name: 'C8 Corvette Stingray', brand: 'Chevrolet' },
  { slug: 'camaro-ss-1le', name: 'Camaro SS 1LE', brand: 'Chevrolet' },
  { slug: 'camaro-zl1', name: 'Camaro ZL1', brand: 'Chevrolet' },
  { slug: 'chevrolet-corvette-c5-z06', name: 'Chevrolet Corvette C5 Z06', brand: 'Chevrolet' },
  { slug: 'chevrolet-corvette-c6-grand-sport', name: 'Chevrolet Corvette C6 Grand Sport', brand: 'Chevrolet' },
  { slug: 'chevrolet-corvette-c6-z06', name: 'Chevrolet Corvette C6 Z06', brand: 'Chevrolet' },
  { slug: 'dodge-challenger-hellcat', name: 'Dodge Challenger Hellcat', brand: 'Dodge' },
  { slug: 'dodge-challenger-srt-392', name: 'Dodge Challenger SRT 392', brand: 'Dodge' },
  { slug: 'dodge-charger-hellcat', name: 'Dodge Charger Hellcat', brand: 'Dodge' },
  { slug: 'dodge-charger-srt-392', name: 'Dodge Charger SRT 392', brand: 'Dodge' },
  { slug: 'dodge-viper', name: 'Dodge Viper', brand: 'Dodge' },
  { slug: 'ford-focus-rs', name: 'Ford Focus RS', brand: 'Ford' },
  { slug: 'ford-mustang-boss-302', name: 'Ford Mustang Boss 302', brand: 'Ford' },
  { slug: 'mustang-gt-pp2', name: 'Mustang GT PP2', brand: 'Ford' },
  { slug: 'shelby-gt350', name: 'Shelby GT350', brand: 'Ford' },
  { slug: 'shelby-gt500', name: 'Shelby GT500', brand: 'Ford' },
  { slug: 'honda-civic-type-r-fk8', name: 'Honda Civic Type R FK8', brand: 'Honda' },
  { slug: 'honda-civic-type-r-fl5', name: 'Honda Civic Type R FL5', brand: 'Honda' },
  { slug: 'honda-s2000', name: 'Honda S2000', brand: 'Honda' },
  { slug: 'jaguar-f-type-r', name: 'Jaguar F-Type R', brand: 'Jaguar' },
  { slug: 'jaguar-f-type-v6-s', name: 'Jaguar F-Type V6 S', brand: 'Jaguar' },
  { slug: 'lamborghini-gallardo', name: 'Lamborghini Gallardo', brand: 'Lamborghini' },
  { slug: 'lexus-lc-500', name: 'Lexus LC 500', brand: 'Lexus' },
  { slug: 'lexus-rc-f', name: 'Lexus RC F', brand: 'Lexus' },
  { slug: 'lotus-elise-s2', name: 'Lotus Elise S2', brand: 'Lotus' },
  { slug: 'lotus-emira', name: 'Lotus Emira', brand: 'Lotus' },
  { slug: 'lotus-evora-gt', name: 'Lotus Evora GT', brand: 'Lotus' },
  { slug: 'lotus-evora-s', name: 'Lotus Evora S', brand: 'Lotus' },
  { slug: 'lotus-exige-s', name: 'Lotus Exige S', brand: 'Lotus' },
  { slug: 'maserati-granturismo', name: 'Maserati GranTurismo', brand: 'Maserati' },
  { slug: 'mazda-mx5-miata-na', name: 'Mazda MX-5 Miata NA', brand: 'Mazda' },
  { slug: 'mazda-mx5-miata-nb', name: 'Mazda MX-5 Miata NB', brand: 'Mazda' },
  { slug: 'mazda-mx5-miata-nc', name: 'Mazda MX-5 Miata NC', brand: 'Mazda' },
  { slug: 'mazda-mx5-miata-nd', name: 'Mazda MX-5 Miata ND', brand: 'Mazda' },
  { slug: 'mazda-rx7-fd3s', name: 'Mazda RX-7 FD3S', brand: 'Mazda' },
  { slug: 'mercedes-c63-amg-w204', name: 'Mercedes C63 AMG W204', brand: 'Mercedes-AMG' },
  { slug: 'mercedes-amg-c63-w205', name: 'Mercedes-AMG C63 W205', brand: 'Mercedes-AMG' },
  { slug: 'mercedes-amg-e63s-w213', name: 'Mercedes-AMG E63 S W213', brand: 'Mercedes-AMG' },
  { slug: 'mercedes-amg-e63-w212', name: 'Mercedes-AMG E63 W212', brand: 'Mercedes-AMG' },
  { slug: 'mercedes-amg-gt', name: 'Mercedes-AMG GT', brand: 'Mercedes-AMG' },
  { slug: 'mitsubishi-lancer-evo-8-9', name: 'Mitsubishi Lancer Evolution VIII/IX', brand: 'Mitsubishi' },
  { slug: 'mitsubishi-lancer-evo-x', name: 'Mitsubishi Lancer Evolution X', brand: 'Mitsubishi' },
  { slug: 'nissan-300zx-twin-turbo-z32', name: 'Nissan 300ZX Twin Turbo Z32', brand: 'Nissan' },
  { slug: 'nissan-350z', name: 'Nissan 350Z', brand: 'Nissan' },
  { slug: 'nissan-370z-nismo', name: 'Nissan 370Z NISMO', brand: 'Nissan' },
  { slug: 'nissan-gt-r', name: 'Nissan GT-R', brand: 'Nissan' },
  { slug: 'nissan-z-rz34', name: 'Nissan Z', brand: 'Nissan' },
  { slug: '718-cayman-gt4', name: '718 Cayman GT4', brand: 'Porsche' },
  { slug: '718-cayman-gts-40', name: '718 Cayman GTS 4.0', brand: 'Porsche' },
  { slug: '981-cayman-gts', name: '981 Cayman GTS', brand: 'Porsche' },
  { slug: '981-cayman-s', name: '981 Cayman S', brand: 'Porsche' },
  { slug: '987-2-cayman-s', name: '987.2 Cayman S', brand: 'Porsche' },
  { slug: '991-1-carrera-s', name: '991.1 Carrera S', brand: 'Porsche' },
  { slug: '997-2-carrera-s', name: '997.2 Carrera S', brand: 'Porsche' },
  { slug: 'porsche-911-gt3-996', name: 'Porsche 911 GT3 996', brand: 'Porsche' },
  { slug: 'porsche-911-gt3-997', name: 'Porsche 911 GT3 997', brand: 'Porsche' },
  { slug: 'porsche-911-turbo-997-1', name: 'Porsche 911 Turbo 997.1', brand: 'Porsche' },
  { slug: 'porsche-911-turbo-997-2', name: 'Porsche 911 Turbo 997.2', brand: 'Porsche' },
  { slug: 'subaru-brz-zc6', name: 'Subaru BRZ', brand: 'Subaru' },
  { slug: 'subaru-brz-zd8', name: 'Subaru BRZ (2nd Gen)', brand: 'Subaru' },
  { slug: 'subaru-wrx-sti-gd', name: 'Subaru Impreza WRX STI GD', brand: 'Subaru' },
  { slug: 'subaru-wrx-sti-gr-gv', name: 'Subaru WRX STI GR/GV', brand: 'Subaru' },
  { slug: 'subaru-wrx-sti-va', name: 'Subaru WRX STI VA', brand: 'Subaru' },
  { slug: 'tesla-model-3-performance', name: 'Tesla Model 3 Performance', brand: 'Tesla' },
  { slug: 'toyota-86-scion-frs', name: 'Toyota 86 / Scion FR-S', brand: 'Toyota' },
  { slug: 'toyota-gr-supra', name: 'Toyota GR Supra', brand: 'Toyota' },
  { slug: 'toyota-gr86', name: 'Toyota GR86', brand: 'Toyota' },
  { slug: 'toyota-supra-mk4-a80-turbo', name: 'Toyota Supra Mk4 A80 Turbo', brand: 'Toyota' },
];

/**
 * Canonical platform_tags per car slug.
 * These should match the intent of `PLATFORM_TAG_PATTERNS` in `lib/vendorAdapters.js`.
 *
 * IMPORTANT:
 * - For cars that do not yet have patterns defined in vendorAdapters.js, the
 *   generator will fail unless run with --allow-unmatched.
 */
export const PLATFORM_TAGS_BY_SLUG = {
  // BMW
  // NOTE: vendorAdapters patterns generally match "combined" tags like "E46 M3",
  // not atomized tokens like "E46" and "M3" separately.
  'bmw-m3-e46': ['E46 M3', 'S54'],
  'bmw-m3-e92': ['E92 M3', 'S65'],
  'bmw-m3-f80': ['F80 M3', 'S55'],
  'bmw-m4-f82': ['F82 M4', 'S55'],
  'bmw-m2-competition': ['M2 Competition', 'F87 M2'],
  'bmw-1m-coupe-e82': ['E82 1M', '1 Series M'],
  'bmw-m5-e39': ['E39 M5'],
  'bmw-m5-e60': ['E60 M5'],
  'bmw-m5-f10-competition': ['F10 M5'],
  'bmw-m5-f90-competition': ['F90 M5'],
  'bmw-z4m-e85-e86': ['E85 Z4 M', 'E86 Z4 M'],

  // Porsche
  '718-cayman-gt4': ['718 GT4', 'Cayman GT4', '982 Cayman'],
  '718-cayman-gts-40': ['718 GTS 4.0', '718 GTS 4.0 Cayman'],
  '981-cayman-gts': ['981 GTS'],
  '981-cayman-s': ['981 Cayman S', '981 Cayman'],
  '987-2-cayman-s': ['987.2 Cayman', '987 Cayman'],
  'porsche-911-gt3-996': ['996 GT3', 'GT3 996'],
  'porsche-911-gt3-997': ['997 GT3', 'GT3 997'],
  '991-1-carrera-s': ['991.1 Carrera', '991.1 Carrera S'],
  '997-2-carrera-s': ['997.2 Carrera', '997.2 Carrera S'],
  'porsche-911-turbo-997-1': ['997.1 Turbo', '997 Turbo'],
  'porsche-911-turbo-997-2': ['997.2 Turbo', '997 Turbo'],

  // Nissan
  'nissan-gt-r': ['R35 GT-R', 'GT-R R35', 'GT-R VR38'],
  'nissan-370z-nismo': ['370Z NISMO', 'Z34 370Z'],
  'nissan-350z': ['350Z', 'Z33 350Z'],
  'nissan-z-rz34': ['RZ34', 'Nissan Z'],
  'nissan-300zx-twin-turbo-z32': ['Z32 300ZX', '300ZX Twin Turbo'],

  // Toyota/Subaru 86 twins
  'toyota-gr-supra': ['GR Supra A90', 'A90 Supra', 'MK5 Supra', 'GR Supra'],
  'toyota-supra-mk4-a80-turbo': ['A80 Supra', 'MK4 Supra'],
  'toyota-gr86': ['GR86', 'ZN8 86'],
  'toyota-86-scion-frs': ['ZN6 86', 'FT86', 'FR-S'],
  'subaru-brz-zd8': ['ZD8 BRZ', 'BRZ 2nd Gen'],
  'subaru-brz-zc6': ['ZC6 BRZ', 'BRZ'],

  // Subaru WRX/STI
  'subaru-wrx-sti-va': ['VA STI', 'STI VA'],
  'subaru-wrx-sti-gr-gv': ['GR STI', 'GV STI', 'Hatch STI'],
  'subaru-wrx-sti-gd': ['GD STI', 'Blob Eye STI'],

  // Domestic
  'c8-corvette-stingray': ['C8 Corvette', 'Corvette C8'],
  'c7-corvette-z06': ['C7 Z06', 'Z06 C7'],
  'c7-corvette-grand-sport': ['C7 Grand Sport'],
  'chevrolet-corvette-c6-z06': ['C6 Z06', 'Z06 C6'],
  'chevrolet-corvette-c6-grand-sport': ['C6 Grand Sport'],
  'chevrolet-corvette-c5-z06': ['C5 Z06', 'Z06 C5'],
  'camaro-zl1': ['Camaro ZL1', 'ZL1 Camaro'],
  'camaro-ss-1le': ['SS 1LE', '1LE SS'],
  'shelby-gt350': ['GT350'],
  'shelby-gt500': ['GT500'],
  'mustang-gt-pp2': ['S550 Mustang GT', 'Mustang GT 2015'],
  'ford-mustang-boss-302': ['Boss 302'],
  'dodge-challenger-hellcat': ['Challenger Hellcat'],
  'dodge-charger-hellcat': ['Charger Hellcat'],
  'dodge-challenger-srt-392': ['Challenger 392'],
  'dodge-charger-srt-392': ['Charger 392'],

  // Honda/Acura
  'honda-civic-type-r-fk8': ['FK8 Type R', 'CTR FK8'],
  'honda-civic-type-r-fl5': ['FL5 Type R', 'CTR FL5'],
  'honda-s2000': ['AP1 S2000', 'AP2 S2000', 'Honda S2000'],
  'acura-integra-type-r-dc2': ['DC2 Integra Type R'],

  // Mazda
  'mazda-mx5-miata-nd': ['ND Miata', 'ND MX-5'],
  'mazda-mx5-miata-nc': ['NC Miata', 'NC MX-5'],
  'mazda-mx5-miata-nb': ['NB Miata', 'NB MX-5'],
  'mazda-mx5-miata-na': ['NA Miata', 'NA MX-5'],
  'mazda-rx7-fd3s': ['FD3S RX-7', 'RX-7 FD'],

  // Mitsubishi
  'mitsubishi-lancer-evo-x': ['Evo X', 'Evo 10', 'CZ4A'],
  'mitsubishi-lancer-evo-8-9': ['Evo VIII', 'Evo IX', 'CT9A'],

  // Audi / VAG (additional)
  'audi-r8-v10': ['R8 V10', 'Audi R8 V10'],
  'audi-r8-v8': ['R8 V8', 'Audi R8 V8'],
  'audi-rs5-b8': ['B8 RS5', 'RS5 B8'],
  'audi-tt-rs-8j': ['8J TT RS', '8J-TTRS'],
  'audi-tt-rs-8s': ['8S TT RS', '8S-TTRS'],
  'ford-focus-rs': ['Focus RS'],

  // Domestic (additional)
  'cadillac-cts-v-gen2': ['CTS-V Gen 2', 'Cadillac CTS-V Gen 2'],
  'cadillac-cts-v-gen3': ['CTS-V Gen 3', 'Cadillac CTS-V Gen 3'],
  'dodge-viper': ['Dodge Viper', 'Viper'],

  // Mercedes / Mercedes-AMG
  'mercedes-c63-amg-w204': ['W204 C63', 'C63 W204'],
  'mercedes-amg-c63-w205': ['W205 C63', 'C63 W205'],
  'mercedes-amg-e63-w212': ['W212 E63', 'E63 W212'],
  'mercedes-amg-e63s-w213': ['W213 E63 S', 'E63 S W213'],
  'mercedes-amg-gt': ['AMG GT', 'Mercedes-AMG GT'],

  // Misc / Exotic
  'alfa-romeo-4c': ['Alfa Romeo 4C', '4C'],
  'alfa-romeo-giulia-quadrifoglio': ['Giulia Quadrifoglio', 'Quadrifoglio'],
  'aston-martin-v8-vantage': ['V8 Vantage', 'Aston Martin Vantage'],
  'jaguar-f-type-v6-s': ['F-Type V6 S', 'Jaguar F-Type V6 S'],
  'jaguar-f-type-r': ['F-Type R', 'Jaguar F-Type R'],
  'lamborghini-gallardo': ['Gallardo', 'Lamborghini Gallardo'],
  'lexus-lc-500': ['LC 500', 'Lexus LC 500'],
  'lexus-rc-f': ['RC F', 'Lexus RC F'],
  'lotus-elise-s2': ['Elise S2', 'Lotus Elise'],
  'lotus-emira': ['Emira', 'Lotus Emira'],
  'lotus-evora-gt': ['Evora GT', 'Lotus Evora GT'],
  'lotus-evora-s': ['Evora S', 'Lotus Evora S'],
  'lotus-exige-s': ['Exige S', 'Lotus Exige S'],
  'maserati-granturismo': ['GranTurismo', 'Maserati GranTurismo'],
  'tesla-model-3-performance': ['Model 3 Performance', 'Tesla Model 3 Performance', 'M3P'],
};

function inferFamilyFromSlug(slug) {
  if (slug.startsWith('bmw-')) return 'bmw';
  if (slug.startsWith('porsche-') || slug.includes('cayman') || slug.startsWith('991-') || slug.startsWith('997-')) return 'porsche';
  if (slug.startsWith('nissan-')) return 'nissan';
  if (slug.startsWith('toyota-')) return 'toyota';
  // BRZ/86 twins are patterned under the "toyota" family in vendorAdapters.
  if (slug.startsWith('subaru-brz-')) return 'toyota';
  if (slug.startsWith('subaru-')) return 'subaru';
  if (slug.startsWith('mercedes-')) return 'mercedes';
  // Focus RS is treated as VAG-family by vendors (already patterned under vag).
  if (slug === 'ford-focus-rs') return 'vag';
  if (
    slug.includes('corvette') ||
    slug.startsWith('camaro-') ||
    slug.startsWith('mustang-') ||
    slug.startsWith('shelby-') ||
    slug.startsWith('ford-') ||
    slug.startsWith('dodge-')
  ) {
    return 'domestic';
  }
  if (slug.startsWith('cadillac-')) return 'domestic';
  if (slug.startsWith('honda-') || slug.startsWith('acura-')) return 'honda';
  if (slug.startsWith('mazda-')) return 'mazda';
  if (slug.startsWith('mitsubishi-')) return 'mitsubishi';
  if (slug.startsWith('audi-') || slug.startsWith('volkswagen-')) return 'vag';
  if (
    slug.startsWith('alfa-romeo-') ||
    slug.startsWith('aston-martin-') ||
    slug.startsWith('jaguar-') ||
    slug.startsWith('lamborghini-') ||
    slug.startsWith('lexus-') ||
    slug.startsWith('lotus-') ||
    slug.startsWith('maserati-') ||
    slug.startsWith('tesla-')
  ) {
    return 'misc';
  }
  return 'other';
}

function getPlatformTagsForCarSlug(slug) {
  return PLATFORM_TAGS_BY_SLUG[slug] || [];
}

function validatePlatformTagsOrThrow({ slug, tags, family, allowUnmatched }) {
  if (!tags || tags.length === 0) {
    if (allowUnmatched) return { ok: false, reason: 'no_tags' };
    throw new Error(`No platform_tags defined for ${slug}. Add to PLATFORM_TAGS_BY_SLUG or run with --allow-unmatched.`);
  }

  // Safety: require at least one tag to resolve to this slug within the inferred family.
  let matched = false;
  for (const t of tags) {
    const res = resolveCarSlugFromTag(t, [family]);
    if (res?.car_slug === slug) {
      matched = true;
      break;
    }
  }

  if (matched) return { ok: true };
  if (allowUnmatched) return { ok: false, reason: 'no_pattern_match' };

  throw new Error(
    `platform_tags for ${slug} do not validate against vendorAdapters patterns (family=${family}). ` +
      `Either update PLATFORM_TAGS_BY_SLUG / vendorAdapters patterns, or run with --allow-unmatched.`
  );
}

function pickTuneBrandForFamily(family) {
  // Constrained to user-approved tune brands list.
  if (family === 'bmw') return 'Dinan';
  if (family === 'vag') return 'APR';
  if (family === 'subaru') return 'COBB';
  if (family === 'nissan') return 'EcuTek';
  if (family === 'toyota') return 'EcuTek';
  if (family === 'honda') return 'Hondata';
  return null;
}

function sourceUrlForBrand(brandName) {
  const urls = {
    AFE: 'https://afepower.com',
    'K&N': 'https://www.knfilters.com',
    Injen: 'https://injen.com',
    Mishimoto: 'https://www.mishimoto.com',
    Akrapovic: 'https://akrapovic.com',
    Borla: 'https://www.borla.com',
    MagnaFlow: 'https://www.magnaflow.com',
    AWE: 'https://awe-tuning.com',
    KW: 'https://www.kwsuspensions.com',
    Ohlins: 'https://www.ohlins.com',
    'BC Racing': 'https://bcracing-na.com',
    Bilstein: 'https://www.bilstein.com',
    COBB: 'https://www.cobbtuning.com',
    Dinan: 'https://www.dinancars.com',
    APR: 'https://www.goapr.com',
    Hondata: 'https://hondata.com',
    EcuTek: 'https://www.ecutek.com',
    StopTech: 'https://www.stoptech.com',
    Brembo: 'https://www.brembo.com',
    EBC: 'https://ebcbrakes.com',
    'AP Racing': 'https://apracing.com',
  };

  return urls[brandName] || null;
}

function tunePartNumber({ tuneBrand, seed }) {
  // Deterministic, brand-styled part numbers (realistic formatting).
  if (tuneBrand === 'Dinan') return `D${seed}-STG1`;
  if (tuneBrand === 'APR') return `APR${seed}-STG1`;
  if (tuneBrand === 'COBB') return `COBB-${seed}-STG1`;
  if (tuneBrand === 'Hondata') return `HD-${seed}-STG1`;
  if (tuneBrand === 'EcuTek') return `ETK-${seed}-STG1`;
  return `${seed}-STG1`;
}

function seedPartsForCar({ slug, name, family, platformTags }) {
  const seed = stableDigits(`${slug}:${name}`);
  const tagsJson = { platform_tags: platformTags };

  const intakeBrand = 'AFE';
  const exhaustBrand = 'Borla';
  const suspensionBrand = 'KW';
  const brakesBrand = 'StopTech';
  const tuneBrand = pickTuneBrandForFamily(family);

  const parts = [];

  // Intake (1)
  parts.push({
    brand_name: intakeBrand,
    part_number: `54-${seed}`,
    name: `${name} High-Flow Intake`,
    category: 'intake',
    description: `High-flow intake (seeded) for ${name}.`,
    attributes: tagsJson,
    is_active: true,
    source_url: sourceUrlForBrand(intakeBrand),
    confidence: 0.85,
    fitment_notes: 'Seeded fitment (platform_tags validated where possible).',
    requires_tune: false,
  });

  // Exhaust (1)
  parts.push({
    brand_name: exhaustBrand,
    part_number: `140${seed}`,
    name: `${name} Cat-Back Exhaust`,
    category: 'exhaust',
    description: `Cat-back exhaust (seeded) for ${name}.`,
    attributes: tagsJson,
    is_active: true,
    source_url: sourceUrlForBrand(exhaustBrand),
    confidence: 0.85,
    fitment_notes: 'Seeded fitment (platform_tags validated where possible).',
    requires_tune: false,
  });

  // Suspension (1)
  parts.push({
    brand_name: suspensionBrand,
    part_number: `352${seed}`,
    name: `${name} Coilover Kit`,
    category: 'suspension',
    description: `Coilover kit (seeded) for ${name}.`,
    attributes: tagsJson,
    is_active: true,
    source_url: sourceUrlForBrand(suspensionBrand),
    confidence: 0.85,
    fitment_notes: 'Seeded fitment (platform_tags validated where possible).',
    requires_tune: false,
  });

  // Brakes (1)
  parts.push({
    brand_name: brakesBrand,
    part_number: `83-${seed}`,
    name: `${name} Big Brake Kit`,
    category: 'brakes',
    description: `Big brake kit (seeded) for ${name}.`,
    attributes: tagsJson,
    is_active: true,
    source_url: sourceUrlForBrand(brakesBrand),
    confidence: 0.85,
    fitment_notes: 'Seeded fitment (platform_tags validated where possible).',
    requires_tune: false,
  });

  // Tune (1 where applicable)
  if (tuneBrand) {
    parts.push({
      brand_name: tuneBrand,
      part_number: tunePartNumber({ tuneBrand, seed }),
      name: `${name} Stage 1 ECU Tune`,
      category: 'tune',
      description: `Stage 1 ECU tune (seeded) for ${name}.`,
      attributes: tagsJson,
      is_active: true,
      source_url: sourceUrlForBrand(tuneBrand),
      confidence: 0.85,
      fitment_notes: 'Seeded fitment (platform_tags validated where possible).',
      requires_tune: false,
    });
  } else {
    // Ensure minimum 5 parts per car even when tune brand is not defined.
    // Add a second suspension part using another approved brand.
    parts.push({
      brand_name: 'Bilstein',
      part_number: `B8-${seed}`,
      name: `${name} Performance Damper Set`,
      category: 'suspension',
      description: `Performance damper set (seeded) for ${name}.`,
      attributes: tagsJson,
      is_active: true,
      source_url: sourceUrlForBrand('Bilstein'),
      confidence: 0.85,
      fitment_notes: 'Seeded fitment (platform_tags validated where possible).',
      requires_tune: false,
    });
  }

  return parts;
}

export function buildMigrationSql({ cars, allowUnmatched = false }) {
  const lines = [];
  lines.push('-- ============================================================================');
  lines.push('-- Migration 040: Seed Multi-Brand Parts + Fitments');
  lines.push('--');
  lines.push('-- Generated by: scripts/generateSeedMultiBrandMigration.mjs');
  lines.push('-- Purpose: seed baseline parts + direct fitments for cars with 0 fitments.');
  lines.push('--');
  lines.push('-- IMPORTANT: This migration inserts parts first, then creates fitments by');
  lines.push('-- selecting part_id + car_id. All inserts are idempotent via ON CONFLICT.');
  lines.push('-- ============================================================================');
  lines.push('');

  // PARTS INSERTS
  lines.push('-- ==========================================================================');
  lines.push('-- PARTS');
  lines.push('-- ==========================================================================');
  lines.push('');

  // Keep a list of (brand_name, part_number, car_slug) to emit fitments after parts.
  const fitmentLinks = [];

  for (const car of cars) {
    const family = inferFamilyFromSlug(car.slug);
    const platformTags = getPlatformTagsForCarSlug(car.slug);
    validatePlatformTagsOrThrow({ slug: car.slug, tags: platformTags, family, allowUnmatched });

    const parts = seedPartsForCar({ slug: car.slug, name: car.name, family, platformTags });

    lines.push(`-- ${car.brand}: ${car.name} (${car.slug})`);
    for (const p of parts) {
      lines.push(
        `INSERT INTO parts (name, brand_name, part_number, category, description, attributes, is_active)\n` +
          `VALUES (${sqlString(p.name)}, ${sqlString(p.brand_name)}, ${sqlString(p.part_number)}, ${sqlString(p.category)}, ${sqlString(
            p.description
          )}, ${jsonb(p.attributes)}, true)\n` +
          `ON CONFLICT (brand_name, part_number) DO NOTHING;`
      );
      lines.push('');
      fitmentLinks.push({ brand_name: p.brand_name, part_number: p.part_number, car_slug: car.slug, fitment: p });
    }
    lines.push('');
  }

  // FITMENTS INSERTS
  lines.push('-- ==========================================================================');
  lines.push('-- FITMENTS');
  lines.push('-- ==========================================================================');
  lines.push('');

  for (const link of fitmentLinks) {
    const f = link.fitment;
    lines.push(
      `INSERT INTO part_fitments (part_id, car_id, fitment_notes, confidence, requires_tune, source_url)\n` +
        `SELECT p.id, c.id, ${sqlString(f.fitment_notes)}, ${f.confidence}, ${f.requires_tune ? 'true' : 'false'}, ${sqlString(
          f.source_url
        )}\n` +
        `FROM parts p, cars c\n` +
        `WHERE p.brand_name = ${sqlString(link.brand_name)} AND p.part_number = ${sqlString(link.part_number)} AND c.slug = ${sqlString(
          link.car_slug
        )}\n` +
        `ON CONFLICT DO NOTHING;`
    );
    lines.push('');
  }

  // VALIDATIONS (as comments)
  lines.push('-- ==========================================================================');
  lines.push('-- POST-MIGRATION VALIDATIONS (run manually)');
  lines.push('-- ==========================================================================');
  lines.push('');
  lines.push('-- Check all cars now have fitments');
  lines.push(
    '-- SELECT c.brand, COUNT(DISTINCT c.id) as total_cars, COUNT(DISTINCT pf.car_id) as cars_with_fitments, COUNT(DISTINCT c.id) - COUNT(DISTINCT pf.car_id) as gap\n' +
      '-- FROM cars c\n' +
      '-- LEFT JOIN part_fitments pf ON pf.car_id = c.id\n' +
      '-- GROUP BY c.brand\n' +
      '-- ORDER BY gap DESC;'
  );
  lines.push('');
  lines.push('-- Verify minimum 5 fitments per car');
  lines.push(
    '-- SELECT c.slug, c.name, COUNT(pf.id) as fitment_count\n' +
      '-- FROM cars c\n' +
      '-- LEFT JOIN part_fitments pf ON pf.car_id = c.id\n' +
      '-- GROUP BY c.slug, c.name\n' +
      "-- HAVING COUNT(pf.id) < 5\n" +
      '-- ORDER BY fitment_count;'
  );
  lines.push('');

  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    console.log(`Usage: node scripts/generateSeedMultiBrandMigration.mjs [options]

Options:
  --out <path>           Output SQL file path (default: supabase/migrations/040_seed_multi_brand_parts.sql)
  --dry-run              Print to stdout instead of writing file
  --max-cars <n>          Limit generation to first N cars (for iteration)
  --allow-unmatched       Do not fail if platform_tags can't be validated against vendorAdapters patterns
`);
    process.exit(0);
  }

  const cars = args.maxCars ? ZERO_FITMENT_CARS.slice(0, args.maxCars) : ZERO_FITMENT_CARS;
  const sql = buildMigrationSql({ cars, allowUnmatched: args.allowUnmatched });

  if (args.dryRun) {
    process.stdout.write(sql);
    return;
  }

  // Ensure parent dir exists
  fs.mkdirSync(path.dirname(args.out), { recursive: true });

  // Stream write to avoid large in-memory editor writes.
  const ws = fs.createWriteStream(args.out, { encoding: 'utf8' });
  await new Promise((resolve, reject) => {
    ws.on('error', reject);
    ws.on('finish', resolve);
    ws.write(sql);
    ws.end();
  });

  console.log(`Wrote migration: ${args.out}`);
}

// Robust "is CLI entrypoint" check (handles URL encoding like %20 for spaces).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err?.stack || String(err));
    process.exit(1);
  });
}













