/**
 * Populate test trade recommendations
 *
 * This script creates sample recommendations for testing the UI
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

// Sample recommendations
const sampleRecommendations = [
  {
    symbol: 'AAPL',
    scan_date: new Date().toISOString().split('T')[0],
    recommendation_type: 'long',
    setup_type: 'support_bounce',
    timeframe: 'swing_trade',
    entry_price: 225.50,
    target_price: 242.00,
    stop_loss: 220.00,
    risk_amount: 5.50,
    reward_amount: 16.50,
    risk_reward_ratio: 3.0,
    opportunity_score: 82,
    confidence_level: 'high',
    current_price: 226.30,
    channel_status: 'near_support',
    pattern_detected: 'hammer',
    volume_status: 'high',
    rsi: 52.5,
    trend: 'uptrend',
    rationale: 'Strong support bounce at key level with bullish hammer pattern. Price holding above rising 50-day MA. Volume confirmation on bounce. Uptrend intact with clear channel structure.',
    is_active: true,
  },
  {
    symbol: 'MSFT',
    scan_date: new Date().toISOString().split('T')[0],
    recommendation_type: 'long',
    setup_type: 'breakout',
    timeframe: 'swing_trade',
    entry_price: 415.00,
    target_price: 435.00,
    stop_loss: 408.00,
    risk_amount: 7.00,
    reward_amount: 20.00,
    risk_reward_ratio: 2.9,
    opportunity_score: 78,
    confidence_level: 'high',
    current_price: 414.20,
    channel_status: 'near_resistance',
    pattern_detected: 'bullish_engulfing',
    volume_status: 'high',
    rsi: 65.0,
    trend: 'uptrend',
    rationale: 'Consolidating near all-time highs with bullish engulfing pattern. Strong volume accumulation. RSI in healthy zone (60-70). Target is measured move based on previous range.',
    is_active: true,
  },
  {
    symbol: 'TSLA',
    scan_date: new Date().toISOString().split('T')[0],
    recommendation_type: 'short',
    setup_type: 'resistance_rejection',
    timeframe: 'swing_trade',
    entry_price: 355.00,
    target_price: 330.00,
    stop_loss: 362.00,
    risk_amount: 7.00,
    reward_amount: 25.00,
    risk_reward_ratio: 3.6,
    opportunity_score: 74,
    confidence_level: 'medium',
    current_price: 353.80,
    channel_status: 'near_resistance',
    pattern_detected: 'shooting_star',
    volume_status: 'high',
    rsi: 68.5,
    trend: 'downtrend',
    rationale: 'Multiple rejections at resistance zone near $360. Shooting star pattern with high volume. Downtrend channel intact. RSI showing bearish divergence.',
    is_active: true,
  },
  {
    symbol: 'NVDA',
    scan_date: new Date().toISOString().split('T')[0],
    recommendation_type: 'long',
    setup_type: 'channel_support',
    timeframe: 'swing_trade',
    entry_price: 495.00,
    target_price: 530.00,
    stop_loss: 485.00,
    risk_amount: 10.00,
    reward_amount: 35.00,
    risk_reward_ratio: 3.5,
    opportunity_score: 85,
    confidence_level: 'high',
    current_price: 496.50,
    channel_status: 'near_support',
    pattern_detected: 'piercing_line',
    volume_status: 'high',
    rsi: 48.0,
    trend: 'uptrend',
    rationale: 'Perfect bounce off rising channel support with piercing line reversal. Strong uptrend with consistent higher lows. Volume surge on reversal day. All systems bullish.',
    is_active: true,
  },
  {
    symbol: 'GOOGL',
    scan_date: new Date().toISOString().split('T')[0],
    recommendation_type: 'long',
    setup_type: 'mean_reversion',
    timeframe: 'swing_trade',
    entry_price: 142.00,
    target_price: 150.00,
    stop_loss: 138.50,
    risk_amount: 3.50,
    reward_amount: 8.00,
    risk_reward_ratio: 2.3,
    opportunity_score: 68,
    confidence_level: 'medium',
    current_price: 142.80,
    channel_status: 'inside',
    pattern_detected: 'doji',
    volume_status: 'average',
    rsi: 42.0,
    trend: 'sideways',
    rationale: 'Oversold bounce setup with doji indecision candle at support. Mid-channel position with room to resistance. Moderate volume. Good R:R but watch for break below support.',
    is_active: true,
  },
  {
    symbol: 'META',
    scan_date: new Date().toISOString().split('T')[0],
    recommendation_type: 'short',
    setup_type: 'channel_resistance',
    timeframe: 'swing_trade',
    entry_price: 575.00,
    target_price: 550.00,
    stop_loss: 582.00,
    risk_amount: 7.00,
    reward_amount: 25.00,
    risk_reward_ratio: 3.6,
    opportunity_score: 71,
    confidence_level: 'medium',
    current_price: 573.20,
    channel_status: 'near_resistance',
    pattern_detected: 'dark_cloud_cover',
    volume_status: 'high',
    rsi: 72.0,
    trend: 'downtrend',
    rationale: 'Dark cloud cover pattern at channel resistance. Trend showing signs of weakness with lower highs. Volume increasing on down days. Target is channel support.',
    is_active: true,
  },
  {
    symbol: 'AMD',
    scan_date: new Date().toISOString().split('T')[0],
    recommendation_type: 'long',
    setup_type: 'breakout_retest',
    timeframe: 'swing_trade',
    entry_price: 165.00,
    target_price: 178.00,
    stop_loss: 160.00,
    risk_amount: 5.00,
    reward_amount: 13.00,
    risk_reward_ratio: 2.6,
    opportunity_score: 76,
    confidence_level: 'high',
    current_price: 166.20,
    channel_status: 'broken_out',
    pattern_detected: 'bullish_engulfing',
    volume_status: 'high',
    rsi: 58.0,
    trend: 'uptrend',
    rationale: 'Clean breakout retest with bullish engulfing confirmation. Former resistance becoming new support. Strong sector momentum. Volume profile supportive.',
    is_active: true,
  },
  {
    symbol: 'AMZN',
    scan_date: new Date().toISOString().split('T')[0],
    recommendation_type: 'long',
    setup_type: 'support_bounce',
    timeframe: 'swing_trade',
    entry_price: 210.00,
    target_price: 225.00,
    stop_loss: 205.00,
    risk_amount: 5.00,
    reward_amount: 15.00,
    risk_reward_ratio: 3.0,
    opportunity_score: 79,
    confidence_level: 'high',
    current_price: 211.50,
    channel_status: 'near_support',
    pattern_detected: 'hammer',
    volume_status: 'high',
    rsi: 45.0,
    trend: 'uptrend',
    rationale: 'Textbook hammer at key support zone. Buyers defending 200-day MA. Uptrend channel intact. Strong risk/reward with clear invalidation level.',
    is_active: true,
  },
];

async function populateTestRecommendations() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  POPULATE TEST RECOMMENDATIONS');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Delete existing test data for today
    const today = new Date().toISOString().split('T')[0];
    const { error: deleteError } = await supabase
      .from('trade_recommendations')
      .delete()
      .eq('scan_date', today);

    if (deleteError) {
      console.warn('⚠️  Warning cleaning old data:', deleteError.message);
    } else {
      console.log('🧹 Cleaned existing recommendations for today\n');
    }

    // Insert new test recommendations
    console.log(`📥 Inserting ${sampleRecommendations.length} test recommendations...\n`);

    const { data, error } = await supabase
      .from('trade_recommendations')
      .insert(sampleRecommendations)
      .select();

    if (error) {
      throw error;
    }

    console.log('✅ Successfully inserted test recommendations!\n');
    console.log('📊 Summary:');
    console.log(`   Total: ${data.length}`);
    console.log(`   Long: ${data.filter((r: any) => r.recommendation_type === 'long').length}`);
    console.log(`   Short: ${data.filter((r: any) => r.recommendation_type === 'short').length}`);
    console.log(`   High Confidence: ${data.filter((r: any) => r.confidence_level === 'high').length}`);
    console.log(`   Avg Score: ${(data.reduce((sum: number, r: any) => sum + r.opportunity_score, 0) / data.length).toFixed(1)}`);
    console.log(`   Avg R:R: ${(data.reduce((sum: number, r: any) => sum + r.risk_reward_ratio, 0) / data.length).toFixed(2)}:1`);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  ✅ DONE - Visit /recommendations page to view!');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

populateTestRecommendations();
