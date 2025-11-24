/**
 * Clean all trade recommendations from database
 *
 * This script deletes ALL recommendations to prepare for production launch
 * with real market data only.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';

// Load environment variables
config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanAllRecommendations() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  🧹 CLEAN ALL RECOMMENDATIONS');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Count existing recommendations
    const { count: existingCount, error: countError } = await supabase
      .from('trade_recommendations')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw countError;
    }

    console.log(`📊 Found ${existingCount || 0} existing recommendations\n`);

    if (!existingCount || existingCount === 0) {
      console.log('✅ Database is already clean. No recommendations to delete.\n');
      process.exit(0);
    }

    // Delete all recommendations
    console.log('🗑️  Deleting all recommendations...\n');

    const { error: deleteError } = await supabase
      .from('trade_recommendations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (neq with impossible ID)

    if (deleteError) {
      throw deleteError;
    }

    console.log('✅ Successfully deleted all recommendations!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  DATABASE READY FOR PRODUCTION');
    console.log('  Run "npm run scan-market" to generate real recommendations');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

cleanAllRecommendations();
