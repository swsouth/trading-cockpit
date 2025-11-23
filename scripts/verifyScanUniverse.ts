/**
 * Verify Scan Universe Script
 *
 * Quick verification that scan_universe table is populated correctly
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyScanUniverse() {
  console.log('🔍 Verifying scan_universe table...\n');

  // 1. Get total count
  const { count: totalCount, error: countError } = await supabase
    .from('scan_universe')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Error querying table:', countError);
    process.exit(1);
  }

  console.log(`✅ Total stocks in database: ${totalCount}`);

  // 2. Get active count
  const { count: activeCount } = await supabase
    .from('scan_universe')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  console.log(`✅ Active stocks: ${activeCount}\n`);

  // 3. Sample a few stocks
  const { data: sampleStocks, error: sampleError } = await supabase
    .from('scan_universe')
    .select('symbol, company_name, sector, data_source')
    .eq('is_active', true)
    .limit(10);

  if (!sampleError && sampleStocks) {
    console.log('📊 Sample stocks:');
    sampleStocks.forEach(stock => {
      console.log(`  ${stock.symbol.padEnd(8)} - ${stock.company_name?.substring(0, 30).padEnd(30)} [${stock.sector}]`);
    });
  }

  console.log('\n✅ Verification complete!');
}

verifyScanUniverse()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
