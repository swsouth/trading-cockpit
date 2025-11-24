import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const FMP_API_KEY = process.env.FMP_API_KEY;
const FMP_BASE_URL = 'https://financialmodelingprep.com/stable';

console.log('═══════════════════════════════════════════════════');
console.log('  FMP API TEST');
console.log('═══════════════════════════════════════════════════\n');

console.log('API Key present:', !!FMP_API_KEY);
console.log('API Key length:', FMP_API_KEY?.length || 0);
console.log('First 10 chars:', FMP_API_KEY?.substring(0, 10));

async function testFmpApi() {
  if (!FMP_API_KEY) {
    console.error('\n❌ FMP_API_KEY not found in .env.local');
    process.exit(1);
  }

  try {
    // Test API call for AAPL using stable endpoint
    const url = `${FMP_BASE_URL}/historical-price-eod/full?symbol=AAPL&apikey=${FMP_API_KEY}`;
    console.log('\nTesting stable endpoint...');
    console.log('URL:', url.replace(FMP_API_KEY || '', '***'));

    const response = await fetch(url);
    console.log('\nResponse status:', response.status);

    const data = await response.json();

    if (!response.ok || data['Error Message'] || data.error) {
      console.error('\n❌ API call failed');
      console.error('Response:', JSON.stringify(data, null, 2));
      process.exit(1);
    }

    console.log('\n✅ API call successful!');
    console.log('Data is array:', Array.isArray(data));
    console.log('Historical data points:', data.length);
    if (data.length > 0) {
      console.log('\nLatest data (first item):');
      console.log('  Date:', data[0].date);
      console.log('  Open:', data[0].open);
      console.log('  High:', data[0].high);
      console.log('  Low:', data[0].low);
      console.log('  Close:', data[0].close);
      console.log('  Volume:', data[0].volume);

      console.log('\nOldest data (last 60 days):');
      const sixtyDaysAgo = data.slice(-60)[0];
      console.log('  Date:', sixtyDaysAgo?.date);
      console.log('  Close:', sixtyDaysAgo?.close);
    }
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

testFmpApi();
