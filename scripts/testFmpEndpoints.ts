import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const FMP_API_KEY = process.env.FMP_API_KEY;
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';
const FMP_V4_BASE_URL = 'https://financialmodelingprep.com/api/v4';

console.log('═══════════════════════════════════════════════════');
console.log('  FMP ENDPOINT AVAILABILITY TEST');
console.log('═══════════════════════════════════════════════════\n');

const endpoints = [
  // V3 endpoints
  { name: 'Quote (v3)', url: `${FMP_BASE_URL}/quote/AAPL?apikey=${FMP_API_KEY}` },
  { name: 'Historical Price Full (v3 - legacy)', url: `${FMP_BASE_URL}/historical-price-full/AAPL?apikey=${FMP_API_KEY}` },
  { name: 'Historical Chart 1day (v3)', url: `${FMP_BASE_URL}/historical-chart/1day/AAPL?apikey=${FMP_API_KEY}` },
  { name: 'Stock Price (v3)', url: `${FMP_BASE_URL}/stock/real-time-price/AAPL?apikey=${FMP_API_KEY}` },

  // V4 endpoints
  { name: 'Historical Price (v4)', url: `${FMP_V4_BASE_URL}/historical-price/AAPL?apikey=${FMP_API_KEY}` },
  { name: 'Batch Quote (v4)', url: `${FMP_V4_BASE_URL}/batch-quote?symbol=AAPL&apikey=${FMP_API_KEY}` },
];

async function testEndpoint(name: string, url: string) {
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (response.status === 200 && !data['Error Message'] && !data.error) {
      console.log(`✅ ${name}`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Data: ${Array.isArray(data) ? `Array (${data.length} items)` : 'Object'}`);
      if (Array.isArray(data) && data.length > 0) {
        console.log(`   First item keys:`, Object.keys(data[0]).join(', '));
      } else if (typeof data === 'object' && !Array.isArray(data)) {
        console.log(`   Keys:`, Object.keys(data).join(', '));
      }
      return true;
    } else {
      console.log(`❌ ${name}`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${data['Error Message'] || data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error}`);
    return false;
  }
}

async function runTests() {
  console.log('Testing endpoints...\n');

  for (const endpoint of endpoints) {
    await testEndpoint(endpoint.name, endpoint.url);
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('Test complete!');
}

runTests();
