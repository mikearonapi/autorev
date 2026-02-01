/**
 * AL Car Extractor
 *
 * Extracts car mentions from user messages and attempts to match them
 * to cars in our database. When no match is found, provides structured
 * data for the agent to use with general knowledge.
 *
 * This enables AL to help users even when their car isn't in our database.
 *
 * @module lib/alCarExtractor
 */

import { fetchCarBySlug, fetchCars } from './carsClient';

// =============================================================================
// CAR MAKE ALIASES (for normalization)
// =============================================================================

const MAKE_ALIASES = {
  // Common abbreviations and alternate names
  chevy: 'Chevrolet',
  vw: 'Volkswagen',
  merc: 'Mercedes-Benz',
  mercedes: 'Mercedes-Benz',
  benz: 'Mercedes-Benz',
  bmw: 'BMW',
  alfa: 'Alfa Romeo',
  lambo: 'Lamborghini',
  ferrari: 'Ferrari',
  porsche: 'Porsche',
  audi: 'Audi',
  lexus: 'Lexus',
  toyota: 'Toyota',
  nissan: 'Nissan',
  honda: 'Honda',
  mazda: 'Mazda',
  subaru: 'Subaru',
  mitsu: 'Mitsubishi',
  mitsubishi: 'Mitsubishi',
  ford: 'Ford',
  dodge: 'Dodge',
  jeep: 'Jeep',
  ram: 'Ram',
  gmc: 'GMC',
  caddy: 'Cadillac',
  cadillac: 'Cadillac',
  lincoln: 'Lincoln',
  buick: 'Buick',
  hyundai: 'Hyundai',
  kia: 'Kia',
  genesis: 'Genesis',
  acura: 'Acura',
  infiniti: 'Infiniti',
  jaguar: 'Jaguar',
  jag: 'Jaguar',
  'land rover': 'Land Rover',
  'range rover': 'Land Rover',
  volvo: 'Volvo',
  saab: 'Saab',
  mini: 'MINI',
  fiat: 'Fiat',
  maserati: 'Maserati',
  aston: 'Aston Martin',
  'aston martin': 'Aston Martin',
  mclaren: 'McLaren',
  lotus: 'Lotus',
  bentley: 'Bentley',
  rolls: 'Rolls-Royce',
  'rolls royce': 'Rolls-Royce',
  tesla: 'Tesla',
  rivian: 'Rivian',
  lucid: 'Lucid',
  polestar: 'Polestar',
};

// =============================================================================
// CAR EXTRACTION PATTERNS
// =============================================================================

/**
 * Extract car mentions from a user message
 * Returns an array of potential car mentions with parsed components
 *
 * @param {string} message - User's message text
 * @returns {Array<Object>} Array of car mention objects
 */
export function extractCarMentions(message) {
  if (!message || typeof message !== 'string') {
    return [];
  }

  const mentions = [];

  // Two-word makes that should be kept together
  const TWO_WORD_MAKES = ['land rover', 'aston martin', 'alfa romeo', 'rolls royce'];

  // Pattern 1a: Two-word makes - e.g., "2020 Land Rover Defender"
  const twoWordMakePattern =
    /\b((?:19|20)\d{2})\s+(land\s+rover|aston\s+martin|alfa\s+romeo|rolls\s+royce)\s+([a-z0-9][a-z0-9.\s]*?)(?=\s+(?:sedan|coupe|hatchback|wagon|suv|truck|convertible|roadster|i\s+wanna|i\s+want|and\s|$)|\s*$)/gi;

  let match;
  while ((match = twoWordMakePattern.exec(message)) !== null) {
    const year = parseInt(match[1], 10);
    const rawMake = match[2].trim();
    const rawModel = match[3].trim();

    if (!rawModel || rawModel.length < 1) continue;

    const normalizedMake = MAKE_ALIASES[rawMake.toLowerCase().replace(/\s+/g, ' ')] || rawMake;

    console.log(
      `[AL Car Extractor] Extracted (two-word make): year=${year}, make=${normalizedMake}, model=${rawModel}`
    );

    mentions.push({
      year,
      make: normalizedMake,
      model: rawModel,
      variant: null,
      raw: match[0],
      confidence: 0.9,
      source: 'two_word_make_pattern',
    });
  }

  // Pattern 1b: Single-word makes - e.g., "2013 Hyundai Genesis 3.8 sedan"
  // Captures: year, make, model (word), optional trim (number/letters), optional body type
  const yearMakeModelPattern =
    /\b((?:19|20)\d{2})\s+([a-z]+)\s+([a-z]+(?:\s+[a-z]+)?)\s*(\d+(?:\.\d+)?|gt|sport|se|limited|premium|base|touring|r-spec|track)?(?:\s+(?:sedan|coupe|hatchback|wagon|suv|truck|convertible|roadster))?/gi;

  while ((match = yearMakeModelPattern.exec(message)) !== null) {
    const year = parseInt(match[1], 10);
    const rawMake = match[2].trim();
    const rawModel = match[3].trim();
    const rawTrim = match[4] ? match[4].trim() : null;

    // Skip if already captured by two-word pattern or if model is empty
    if (!rawModel || rawModel.length < 1) continue;
    if (TWO_WORD_MAKES.some((twm) => message.toLowerCase().includes(`${year} ${twm}`))) continue;

    // Normalize make
    const normalizedMake =
      MAKE_ALIASES[rawMake.toLowerCase()] ||
      rawMake.charAt(0).toUpperCase() + rawMake.slice(1).toLowerCase();

    // Capitalize model
    const normalizedModel = rawModel
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    console.log(
      `[AL Car Extractor] Extracted: year=${year}, make=${normalizedMake}, model=${normalizedModel}, trim=${rawTrim || 'none'}`
    );

    mentions.push({
      year,
      make: normalizedMake,
      model: normalizedModel,
      variant: rawTrim,
      raw: match[0],
      confidence: 0.9,
      source: 'year_make_model_pattern',
    });
  }

  // Pattern 2: "my [year] [model]" or "my [model]" - e.g., "my 2020 M3", "my GT3"
  const myCarPattern = /\bmy\s+((?:(?:19|20)\d{2})\s+)?([a-z0-9]+(?:\s+[a-z0-9]+)?)/gi;

  while ((match = myCarPattern.exec(message)) !== null) {
    const year = match[1] ? parseInt(match[1].trim(), 10) : null;
    const rawModel = match[2].trim();

    // Try to infer make from common model names
    const inferredMake = inferMakeFromModel(rawModel);

    mentions.push({
      year,
      make: inferredMake,
      model: rawModel,
      variant: null,
      raw: match[0],
      confidence: inferredMake ? 0.7 : 0.5,
      source: 'my_car_pattern',
    });
  }

  // Pattern 3: "[make] [model]" without year - e.g., "Porsche 911", "BMW M3"
  const makeModelPattern =
    /\b(porsche|bmw|audi|mercedes|toyota|honda|nissan|mazda|subaru|ford|chevy|chevrolet|dodge|hyundai|genesis|lexus|acura|infiniti)\s+([a-z0-9]+(?:\s+[a-z0-9]+)?)/gi;

  while ((match = makeModelPattern.exec(message)) !== null) {
    const rawMake = match[1].trim();
    const rawModel = match[2].trim();

    const normalizedMake =
      MAKE_ALIASES[rawMake.toLowerCase()] ||
      rawMake.charAt(0).toUpperCase() + rawMake.slice(1).toLowerCase();

    // Check if this overlaps with an existing mention (avoid duplicates)
    const isDuplicate = mentions.some(
      (m) =>
        m.make?.toLowerCase() === normalizedMake.toLowerCase() &&
        m.model?.toLowerCase() === rawModel.toLowerCase()
    );

    if (!isDuplicate) {
      mentions.push({
        year: null,
        make: normalizedMake,
        model: rawModel,
        variant: null,
        raw: match[0],
        confidence: 0.75,
        source: 'make_model_pattern',
      });
    }
  }

  // Deduplicate and sort by confidence
  const uniqueMentions = deduplicateMentions(mentions);
  return uniqueMentions.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Infer make from a model name (for common unique model names)
 */
function inferMakeFromModel(model) {
  const modelLower = model.toLowerCase();

  const modelToMake = {
    // Porsche
    911: 'Porsche',
    gt3: 'Porsche',
    gt4: 'Porsche',
    cayman: 'Porsche',
    boxster: 'Porsche',
    taycan: 'Porsche',
    panamera: 'Porsche',
    cayenne: 'Porsche',
    718: 'Porsche',
    997: 'Porsche',
    996: 'Porsche',
    991: 'Porsche',
    992: 'Porsche',

    // BMW
    m3: 'BMW',
    m4: 'BMW',
    m5: 'BMW',
    m2: 'BMW',
    m8: 'BMW',
    e30: 'BMW',
    e36: 'BMW',
    e46: 'BMW',
    e90: 'BMW',
    e92: 'BMW',
    f80: 'BMW',
    f82: 'BMW',
    g80: 'BMW',
    g82: 'BMW',

    // Nissan
    gtr: 'Nissan',
    'gt-r': 'Nissan',
    r35: 'Nissan',
    r34: 'Nissan',
    r33: 'Nissan',
    '370z': 'Nissan',
    '350z': 'Nissan',
    z: 'Nissan',
    skyline: 'Nissan',

    // Toyota/Lexus
    supra: 'Toyota',
    gr86: 'Toyota',
    86: 'Toyota',
    mr2: 'Toyota',
    lfa: 'Lexus',
    is500: 'Lexus',
    isf: 'Lexus',
    rcf: 'Lexus',
    lcf: 'Lexus',

    // Honda/Acura
    nsx: 'Acura',
    s2000: 'Honda',
    civic: 'Honda',
    'type r': 'Honda',
    integra: 'Acura',

    // Subaru
    wrx: 'Subaru',
    sti: 'Subaru',
    brz: 'Subaru',

    // Mazda
    miata: 'Mazda',
    mx5: 'Mazda',
    'mx-5': 'Mazda',
    rx7: 'Mazda',
    rx8: 'Mazda',

    // Ford
    mustang: 'Ford',
    gt350: 'Ford',
    gt500: 'Ford',
    'mach 1': 'Ford',

    // Chevrolet
    corvette: 'Chevrolet',
    camaro: 'Chevrolet',
    z06: 'Chevrolet',
    zr1: 'Chevrolet',
    c8: 'Chevrolet',
    c7: 'Chevrolet',
    c6: 'Chevrolet',

    // Dodge
    challenger: 'Dodge',
    charger: 'Dodge',
    viper: 'Dodge',
    hellcat: 'Dodge',

    // Mercedes
    'amg gt': 'Mercedes-Benz',
    c63: 'Mercedes-Benz',
    e63: 'Mercedes-Benz',

    // Audi
    rs3: 'Audi',
    rs5: 'Audi',
    rs6: 'Audi',
    rs7: 'Audi',
    r8: 'Audi',
    s3: 'Audi',
    s4: 'Audi',
    s5: 'Audi',
  };

  return modelToMake[modelLower] || null;
}

/**
 * Remove duplicate car mentions
 */
function deduplicateMentions(mentions) {
  const seen = new Set();
  return mentions.filter((mention) => {
    const key = `${mention.year || ''}-${mention.make || ''}-${mention.model || ''}`.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Build a slug from car mention components
 */
function buildSlugFromMention(mention) {
  const parts = [];

  if (mention.make) {
    parts.push(mention.make.toLowerCase().replace(/[^a-z0-9]/g, '-'));
  }
  if (mention.model) {
    parts.push(mention.model.toLowerCase().replace(/[^a-z0-9]/g, '-'));
  }
  if (mention.year) {
    parts.push(mention.year.toString());
  }

  return parts.join('-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Try to resolve a car mention to a car in our database
 * Returns enriched mention with database match info
 *
 * @param {Object} mention - Car mention object from extractCarMentions
 * @returns {Promise<Object>} Enriched mention with database info
 */
export async function resolveCarMention(mention) {
  if (!mention) return null;

  const result = {
    ...mention,
    inDatabase: false,
    matchedSlug: null,
    matchedCar: null,
    similarCars: [],
  };

  try {
    // Try to build a slug and find exact match
    const possibleSlug = buildSlugFromMention(mention);

    if (possibleSlug) {
      const car = await fetchCarBySlug(possibleSlug);
      if (car) {
        result.inDatabase = true;
        result.matchedSlug = possibleSlug;
        result.matchedCar = car;
        return result;
      }
    }

    // Try fuzzy search - but be strict about what counts as "in database"
    const allCars = await fetchCars();

    // Build search criteria - need make AND model to match for "in database"
    const mentionMake = (mention.make || '').toLowerCase();
    const mentionModel = (mention.model || '').toLowerCase();
    const mentionYear = mention.year;

    // Look for a car that matches make AND (model OR year+model)
    const exactMatch = allCars.find((car) => {
      const carName = (car.name || '').toLowerCase();
      const carSlug = (car.slug || '').toLowerCase();
      const carYear = car.year;

      // Check if this car matches the make
      const makeMatches =
        carSlug.includes(mentionMake.replace(/\s+/g, '-')) || carName.includes(mentionMake);

      if (!makeMatches) return false;

      // Check if model matches (excluding generic terms like "3.8")
      // Only match if the model is a significant name, not just a number
      const isModelSignificant = mentionModel && !/^\d+(\.\d+)?$/.test(mentionModel);
      if (isModelSignificant) {
        const modelMatches =
          carName.includes(mentionModel) || carSlug.includes(mentionModel.replace(/\s+/g, '-'));
        if (!modelMatches) return false;
      }

      // Check year if provided (new schema: year is integer)
      if (mentionYear && carYear) {
        if (mentionYear !== carYear) return false;
      }

      return true;
    });

    if (exactMatch) {
      console.log(`[AL Car Extractor] Found exact match: ${exactMatch.slug} for ${mention.raw}`);
      result.inDatabase = true;
      result.matchedSlug = exactMatch.slug;
      result.matchedCar = exactMatch;
    } else {
      // Log that we didn't find a match - this car should trigger a car request
      console.log(
        `[AL Car Extractor] No database match for: ${mention.year || ''} ${mention.make || ''} ${mention.model || ''}`
      );

      // Find similar cars for suggestions (loose match on any term)
      const searchTerms = [mentionMake, mentionModel].filter(Boolean);
      const similarMatches = allCars.filter((car) => {
        const carSlug = (car.slug || '').toLowerCase();
        return searchTerms.some((term) => term && carSlug.includes(term.replace(/\s+/g, '-')));
      });

      result.similarCars = similarMatches.slice(0, 3).map((car) => ({
        slug: car.slug,
        name: car.name,
        year: car.year,
      }));
    }
  } catch (err) {
    console.warn('[AL Car Extractor] Error resolving car mention:', err.message);
  }

  return result;
}

/**
 * Extract and resolve all car mentions from a message
 * Combines extraction and resolution in one call
 *
 * @param {string} message - User's message
 * @returns {Promise<Object>} Object with primaryCar and allMentions
 */
export async function extractAndResolveCars(message) {
  const mentions = extractCarMentions(message);

  if (mentions.length === 0) {
    return {
      primaryCar: null,
      allMentions: [],
      hasUnknownCar: false,
    };
  }

  // Resolve all mentions (in parallel for speed)
  const resolvedMentions = await Promise.all(mentions.map((mention) => resolveCarMention(mention)));

  // Primary car is the first (highest confidence) mention
  const primaryCar = resolvedMentions[0];

  // Check if any mentioned cars are not in database
  const hasUnknownCar = resolvedMentions.some((m) => !m.inDatabase);

  return {
    primaryCar,
    allMentions: resolvedMentions,
    hasUnknownCar,
  };
}

/**
 * Format a car mention for logging/display
 * Outputs format: "2013 Hyundai Genesis 3.8" or "2013 Hyundai Genesis"
 */
export function formatCarMention(mention) {
  if (!mention) return 'Unknown vehicle';

  const parts = [];
  if (mention.year) parts.push(mention.year);
  if (mention.make) parts.push(mention.make);
  if (mention.model) parts.push(mention.model);
  if (mention.variant) parts.push(mention.variant); // trim/engine designation

  return parts.join(' ') || mention.raw || 'Unknown vehicle';
}

const alCarExtractor = {
  extractCarMentions,
  resolveCarMention,
  extractAndResolveCars,
  formatCarMention,
};

export default alCarExtractor;
