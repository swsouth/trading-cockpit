/**
 * Populate Scan Universe Script
 *
 * Populates the scan_universe table with top liquid stocks for daily scanning
 *
 * Usage:
 *   npx ts-node scripts/populateScanUniverse.ts
 *   OR
 *   npm run populate-universe
 */

// Load environment variables from .env.local
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';
import { STOCK_UNIVERSE, getUniverseCount } from './stockUniverse';

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role for insert

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Required environment variables:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nMake sure these are set in your .env.local file');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function populateScanUniverse() {
  console.log('🚀 Starting scan universe population...\n');
  console.log(`📊 Total stocks to insert: ${getUniverseCount()}\n`);

  try {
    // Prepare data for insertion
    const stocksToInsert = STOCK_UNIVERSE.map(stock => ({
      symbol: stock.symbol,
      company_name: stock.company_name,
      sector: stock.sector,
      data_source: stock.data_source,
      is_active: true,
      // Market cap and volume will be null for now
      // These can be fetched and updated later via a separate script
    }));

    // Insert in batches of 100 to avoid payload size limits
    const batchSize = 100;
    let inserted = 0;
    let updated = 0;
    let errors = 0;

    for (let i = 0; i < stocksToInsert.length; i += batchSize) {
      const batch = stocksToInsert.slice(i, i + batchSize);

      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(stocksToInsert.length / batchSize)}...`);

      // Upsert: insert new, update existing
      const { data, error } = await supabase
        .from('scan_universe')
        .upsert(batch, {
          onConflict: 'symbol',
          ignoreDuplicates: false, // Update if exists
        })
        .select();

      if (error) {
        console.error(`❌ Error inserting batch:`, error.message);
        errors += batch.length;
      } else {
        // Count how many were actually inserted vs updated
        // (Supabase doesn't distinguish in response, so we'll estimate)
        const batchCount = data?.length || batch.length;
        inserted += batchCount;
        console.log(`✅ Processed ${batchCount} stocks`);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n🎉 Population complete!\n');
    console.log('📈 Summary:');
    console.log(`  Total attempted: ${stocksToInsert.length}`);
    console.log(`  Successful: ${inserted - errors}`);
    console.log(`  Errors: ${errors}`);

    // Verify count in database
    const { count, error: countError } = await supabase
      .from('scan_universe')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (!countError && count !== null) {
      console.log(`\n✅ Active stocks in scan_universe: ${count}`);
    }

    // Show breakdown by sector
    console.log('\n📊 Breakdown by sector:');
    const { data: sectorStats } = await supabase
      .from('scan_universe')
      .select('sector')
      .eq('is_active', true);

    if (sectorStats) {
      const sectorCounts = sectorStats.reduce((acc, row) => {
        acc[row.sector] = (acc[row.sector] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(sectorCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([sector, count]) => {
          console.log(`  ${sector}: ${count}`);
        });
    }

    // Show breakdown by data source
    console.log('\n📊 Breakdown by source:');
    const { data: sourceStats } = await supabase
      .from('scan_universe')
      .select('data_source')
      .eq('is_active', true);

    if (sourceStats) {
      const sourceCounts = sourceStats.reduce((acc, row) => {
        acc[row.data_source] = (acc[row.data_source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(sourceCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([source, count]) => {
          console.log(`  ${source}: ${count}`);
        });
    }

    console.log('\n✅ Scan universe is ready for daily scanning!');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Optional: Update market cap and volume data
// This would require fetching from a market data API
async function updateMarketData() {
  console.log('\n📊 Updating market cap and volume data...');
  console.log('⚠️  This requires a market data API (not implemented yet)');
  console.log('💡 You can add this later using Alpaca, Finnhub, or similar APIs\n');

  // Example implementation (commented out):
  /*
  const { data: stocks } = await supabase
    .from('scan_universe')
    .select('symbol')
    .eq('is_active', true);

  if (stocks) {
    for (const stock of stocks) {
      // Fetch market data for stock.symbol
      // const marketData = await getMarketData(stock.symbol);

      // Update scan_universe
      // await supabase
      //   .from('scan_universe')
      //   .update({
      //     market_cap: marketData.marketCap,
      //     avg_volume: marketData.avgVolume,
      //     avg_price: marketData.avgPrice,
      //   })
      //   .eq('symbol', stock.symbol);
    }
  }
  */
}

// Run the script
console.log('═══════════════════════════════════════════════════');
console.log('  POPULATE SCAN UNIVERSE');
console.log('═══════════════════════════════════════════════════\n');

populateScanUniverse()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
