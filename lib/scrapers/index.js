/**
 * Scrapers Index
 * 
 * Central export point for all scraper modules.
 * 
 * @module lib/scrapers
 */

// Frameworks
export * from './scraperFramework.js';
export * from './stealthScraper.js';
export * from './browserScraper.js';

// Individual scrapers
export * as iihs from './iihsScraper.js';
export * as bringATrailer from './bringATrailerScraper.js';
export * as carAndDriver from './carAndDriverScraper.js';
export * as hagerty from './hagertyScraper.js';
export * as carsCom from './carsComScraper.js';
export * as motorTrend from './motorTrendScraper.js';

// Default export with all scrapers
import * as scraperFramework from './scraperFramework.js';
import * as stealthScraper from './stealthScraper.js';
import * as browserScraper from './browserScraper.js';
import * as iihsScraper from './iihsScraper.js';
import * as bringATrailerScraper from './bringATrailerScraper.js';
import * as carAndDriverScraper from './carAndDriverScraper.js';
import * as hagertyScraper from './hagertyScraper.js';
import * as carsComScraper from './carsComScraper.js';
import * as motorTrendScraper from './motorTrendScraper.js';

export default {
  // Frameworks
  framework: scraperFramework,
  stealth: stealthScraper,
  browser: browserScraper,
  
  // Individual scrapers
  iihs: iihsScraper,
  bringATrailer: bringATrailerScraper,
  carAndDriver: carAndDriverScraper,
  hagerty: hagertyScraper,
  carsCom: carsComScraper,
  motorTrend: motorTrendScraper,
};





