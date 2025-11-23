/**
 * Verify trade recommendations exist in database
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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyRecommendations() {
  console.log('\n🔍 Verifying trade recommendations in database...\n');

  try {
    // Query all recommendations
    const { data, error } = await supabase
      .from('trade_recommendations')
      .select('*')
      .order('opportunity_score', { ascending: false });

    if (error) {
      throw error;
    }

    console.log(`Found ${data.length} recommendations in database\n`);

    if (data.length === 0) {
      console.log('❌ No recommendations found!');
      console.log('Run: npm run test-populate');
      return;
    }

    // Show summary
    console.log('📊 Summary:');
    console.log(`   Total: ${data.length}`);
    console.log(`   Active: ${data.filter(r => r.is_active).length}`);
    console.log(`   Long: ${data.filter(r => r.recommendation_type === 'long').length}`);
    console.log(`   Short: ${data.filter(r => r.recommendation_type === 'short').length}`);
    console.log(`   High Confidence: ${data.filter(r => r.confidence_level === 'high').length}`);
    console.log(`   Medium Confidence: ${data.filter(r => r.confidence_level === 'medium').length}`);
    console.log(`   Low Confidence: ${data.filter(r => r.confidence_level === 'low').length}`);

    // Show first 3
    console.log('\n📋 Top 3 Recommendations:');
    data.slice(0, 3).forEach((rec, i) => {
      console.log(`\n${i + 1}. ${rec.symbol} (${rec.recommendation_type.toUpperCase()})`);
      console.log(`   Score: ${rec.opportunity_score}`);
      console.log(`   Confidence: ${rec.confidence_level}`);
      console.log(`   Entry: $${rec.entry_price}`);
      console.log(`   Target: $${rec.target_price}`);
      console.log(`   Stop: $${rec.stop_loss}`);
      console.log(`   R:R: ${rec.risk_reward_ratio}:1`);
      console.log(`   Active: ${rec.is_active}`);
      console.log(`   Scan Date: ${rec.scan_date}`);
    });

    console.log('\n✅ Database verification complete!\n');
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

verifyRecommendations();
