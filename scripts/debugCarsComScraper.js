#!/usr/bin/env node

/**
 * Debug Cars.com Scraper
 * 
 * Investigates what data we're actually getting from Cars.com
 */

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

async function test() {
  // Test with specific Porsche 718 Cayman GT4
  const url = 'https://www.cars.com/shopping/results/?makes[]=porsche&models[]=porsche-718_cayman&list_price_max=&maximum_distance=all&stock_type=all&year_min=2020&year_max=2024';
  
  console.log('='.repeat(70));
  console.log('Cars.com Scraper Debug');
  console.log('='.repeat(70));
  console.log('Testing URL:', url);
  console.log('');
  
  const response = await fetch(url, { headers: HEADERS });
  const html = await response.text();
  
  console.log('Response status:', response.status);
  console.log('HTML length:', html.length, 'characters');
  console.log('');
  
  // Method 1: Find ALL dollar amounts (what we were doing - BAD)
  const allPriceMatches = html.matchAll(/\$(\d{1,3}(?:,\d{3})*)/g);
  const allPrices = [...allPriceMatches].map(m => parseInt(m[1].replace(/,/g, '')));
  
  console.log('Method 1: All $ amounts on page');
  console.log('  Total found:', allPrices.length);
  console.log('  Range:', Math.min(...allPrices), '-', Math.max(...allPrices));
  console.log('  Sample:', allPrices.slice(0, 15).join(', '));
  console.log('');
  
  // Method 2: Look for primary-price class (Cars.com specific)
  const primaryPriceMatches = html.matchAll(/primary-price[^>]*>\s*\$(\d{1,3}(?:,\d{3})*)/gi);
  const primaryPrices = [...primaryPriceMatches].map(m => parseInt(m[1].replace(/,/g, '')));
  
  console.log('Method 2: primary-price class');
  console.log('  Total found:', primaryPrices.length);
  if (primaryPrices.length > 0) {
    console.log('  Range:', Math.min(...primaryPrices), '-', Math.max(...primaryPrices));
    console.log('  Sample:', primaryPrices.slice(0, 10).join(', '));
  }
  console.log('');
  
  // Method 3: Look for vehicle-card with price
  const vehicleCardPrices = [];
  const cardMatches = html.matchAll(/vehicle-card[^>]*>[\s\S]*?<\/vehicle-card>/gi);
  
  console.log('Method 3: Vehicle card elements');
  const cardMatchArray = [...html.matchAll(/class="[^"]*vehicle-card[^"]*"/gi)];
  console.log('  Vehicle cards found:', cardMatchArray.length);
  console.log('');
  
  // Method 4: Look for JSON in script tags
  console.log('Method 4: JSON-LD structured data');
  const jsonLdMatches = html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
  
  for (const match of jsonLdMatches) {
    try {
      const data = JSON.parse(match[1]);
      if (data['@type'] === 'ItemList' || data['@type'] === 'Product' || Array.isArray(data)) {
        console.log('  Found structured data type:', data['@type'] || 'Array');
        if (data.itemListElement) {
          console.log('  Items in list:', data.itemListElement.length);
          // Show first item
          const firstItem = data.itemListElement[0]?.item;
          if (firstItem) {
            console.log('  First item:', firstItem.name);
            console.log('  Price:', firstItem.offers?.price || 'N/A');
          }
        }
      }
    } catch (e) {
      // Skip invalid JSON
    }
  }
  console.log('');
  
  // Method 5: Look for specific price data attributes
  console.log('Method 5: Data attributes');
  const dataPriceMatches = html.matchAll(/data-price="(\d+)"/gi);
  const dataPrices = [...dataPriceMatches].map(m => parseInt(m[1]));
  console.log('  data-price attributes:', dataPrices.length);
  if (dataPrices.length > 0) {
    console.log('  Values:', dataPrices.slice(0, 10).join(', '));
  }
  console.log('');
  
  // Method 6: Look for spark-price component
  console.log('Method 6: spark-price component');
  const sparkPriceMatches = html.matchAll(/spark-price[^>]*>\s*\$?(\d{1,3}(?:,\d{3})*)/gi);
  const sparkPrices = [...sparkPriceMatches].map(m => parseInt(m[1].replace(/,/g, '')));
  console.log('  spark-price found:', sparkPrices.length);
  if (sparkPrices.length > 0) {
    console.log('  Values:', sparkPrices.slice(0, 10).join(', '));
  }
  console.log('');
  
  // Show a snippet of HTML around a price
  console.log('='.repeat(70));
  console.log('HTML Context around prices:');
  console.log('='.repeat(70));
  
  const priceContext = html.match(/.{0,100}\$\d{2,3},\d{3}.{0,100}/);
  if (priceContext) {
    console.log(priceContext[0].replace(/\s+/g, ' ').substring(0, 200));
  }
}

test().catch(console.error);



