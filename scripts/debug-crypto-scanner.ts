/**
 * Debug Crypto Scanner - Bypass API/Auth and Call Scanner Directly
 *
 * This script directly invokes the crypto scanner to debug the Supabase connection issue.
 * Will show diagnostic output including the actual Supabase URL being used.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local from project root
config({ path: resolve(__dirname, '../.env.local') });

console.log('🐛 DEBUG CRYPTO SCANNER');
console.log('═'.repeat(60));
console.log('Starting diagnostic run...\n');

// Log environment variables being used
console.log('📋 Environment Variables:');
console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING'}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET (hidden)' : 'MISSING'}`);
console.log(`   COINAPI_API_KEY: ${process.env.COINAPI_API_KEY ? 'SET (hidden)' : 'MISSING'}`);
console.log('');

async function runDebug() {
  try {
    console.log('✓ Importing crypto scanner...');

    // Import the actual scanner function being called by the API
    const { runCryptoScan } = await import('../lib/cryptoScanner');

    console.log('✓ Crypto scanner module imported successfully\n');
    console.log('🚀 Starting crypto scan...\n');
    console.log('═'.repeat(60));

    // Run the scanner - this should trigger our diagnostic logging
    const opportunitiesCount = await runCryptoScan();

    console.log('═'.repeat(60));
    console.log(`\n✅ Scan completed - returned ${opportunitiesCount} opportunities`);

    // Now query database to see if those opportunities actually persisted
    console.log('\n🔍 Verifying database persistence...');

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query for crypto recommendations created in last 5 minutes (trade_recommendations table)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('trade_recommendations')
      .select('id, symbol, timeframe, opportunity_score, created_at')
      .eq('timeframe', '15min')
      .gte('created_at', fiveMinutesAgo)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error querying database:', error);
    } else {
      console.log(`\n📊 Database Query Results (crypto recommendations created in last 5 minutes):`);
      if (data.length === 0) {
        console.log('   ⚠️  NO RECORDS FOUND');
        console.log('   This confirms the persistence issue - scanner reports success but records don\'t exist!');
      } else {
        console.log(`   ✅ Found ${data.length} records:`);
        data.forEach(rec => {
          console.log(`      - ${rec.symbol} (ID: ${rec.id}, Score: ${rec.opportunity_score}, Created: ${rec.created_at})`);
        });
      }
    }

  } catch (error) {
    console.error('\n❌ Debug scan failed:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

runDebug()
  .then(() => {
    console.log('\n✅ Debug scan completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Debug scan failed:', error);
    process.exit(1);
  });
