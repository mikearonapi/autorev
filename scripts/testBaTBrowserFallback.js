#!/usr/bin/env node

/**
 * Test Bring a Trailer via HTTP->Browser fallback
 */

import { searchCompletedAuctions, getMarketData } from '../lib/scrapers/bringATrailerScraper.js';
import { closeBrowser } from '../lib/scrapers/browserScraper.js';

async function main() {
  console.log('='.repeat(80));
  console.log('BaT Browser Fallback Test');
  console.log('='.repeat(80));

  const query = 'Porsche 718 Cayman GT4';

  try {
    const auctions = await searchCompletedAuctions(query, { limit: 5, soldOnly: true });
    console.log(`\nAuctions found: ${auctions.length}`);
    for (const a of auctions.slice(0, 5)) {
      console.log(`- ${a.title} | sold: ${a.sold} | price: ${a.soldPrice ?? 'N/A'} | mileage: ${a.mileage ?? 'N/A'} | ${a.url}`);
    }

    const market = await getMarketData(query, { limit: 20 });
    console.log('\nMarket summary:');
    console.log({
      sampleSize: market.sampleSize,
      medianPrice: market.medianPrice,
      averagePrice: market.averagePrice,
      minPrice: market.minPrice,
      maxPrice: market.maxPrice,
      sellThroughRate: market.sellThroughRate,
      averageMileage: market.averageMileage,
    });
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await closeBrowser().catch(() => {});
  }
}

main();













