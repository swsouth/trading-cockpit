/**
 * Intraday Price Refresh Scanner
 *
 * Updates current prices for all active recommendations every 15 minutes
 * Runs continuously during market hours (9:30 AM - 4:00 PM ET)
 *
 * Uses Yahoo Finance unlimited API - no rate limit concerns
 * Much faster than full technical scan (seconds vs minutes)
 */

// Load environment variables
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';
import { getYahooQuote } from '@/lib/marketData/yahooFinanceAdapter';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface PriceUpdate {
  symbol: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  lastPriceUpdate: string;
}

/**
 * Check if market is currently open (9:30 AM - 4:00 PM ET, Mon-Fri)
 */
function isMarketOpen(): boolean {
  const now = new Date();

  // Convert to ET (UTC-5 or UTC-4 depending on DST)
  const etTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));

  const day = etTime.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = etTime.getHours();
  const minute = etTime.getMinutes();

  // Market closed on weekends
  if (day === 0 || day === 6) {
    return false;
  }

  // Market hours: 9:30 AM - 4:00 PM ET
  const currentMinutes = hour * 60 + minute;
  const marketOpen = 9 * 60 + 30;  // 9:30 AM
  const marketClose = 16 * 60;      // 4:00 PM

  return currentMinutes >= marketOpen && currentMinutes <= marketClose;
}

/**
 * Fetch current prices for all active recommendations
 */
async function refreshPrices(): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  INTRADAY PRICE REFRESH');
  console.log('═══════════════════════════════════════════════════════════\n');

  const startTime = new Date();
  console.log(`Refresh Time: ${startTime.toISOString()}`);

  // Check if market is open
  if (!isMarketOpen()) {
    console.log('⏸️  Market closed - skipping price refresh\n');
    return;
  }

  console.log('✅ Market is open - refreshing prices\n');

  try {
    // 1. Get all active recommendations from today
    const today = new Date().toISOString().split('T')[0];

    const { data: recommendations, error } = await supabase
      .from('trade_recommendations')
      .select('symbol, entry_price, scan_date')
      .eq('is_active', true)
      .gte('scan_date', today);

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    if (!recommendations || recommendations.length === 0) {
      console.log('ℹ️  No active recommendations to refresh\n');
      return;
    }

    console.log(`📊 Refreshing prices for ${recommendations.length} active recommendations...\n`);

    // 2. Get unique symbols (remove duplicates)
    const symbols = [...new Set(recommendations.map(r => r.symbol))];

    console.log(`🔍 Fetching live quotes for ${symbols.length} unique symbols...`);

    // 3. Fetch current prices (parallel - no rate limits!)
    const priceUpdates: PriceUpdate[] = [];
    let successCount = 0;
    let failCount = 0;

    await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const quote = await getYahooQuote(symbol);

          // Find original entry price for this symbol
          const rec = recommendations.find(r => r.symbol === symbol);
          const entryPrice = rec?.entry_price || quote.price;

          const priceChange = quote.price - entryPrice;
          const priceChangePercent = (priceChange / entryPrice) * 100;

          priceUpdates.push({
            symbol,
            currentPrice: quote.price,
            priceChange,
            priceChangePercent,
            lastPriceUpdate: new Date().toISOString(),
          });

          successCount++;
          console.log(`   ✅ ${symbol}: $${quote.price.toFixed(2)} (${priceChangePercent >= 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%)`);

        } catch (error) {
          failCount++;
          console.warn(`   ⚠️  ${symbol}: Price fetch failed`);
        }
      })
    );

    console.log(`\n✅ Fetched ${successCount}/${symbols.length} prices (${failCount} failed)\n`);

    // 4. Update database with new prices
    if (priceUpdates.length > 0) {
      console.log('💾 Updating database with fresh prices...');

      let updateCount = 0;

      for (const update of priceUpdates) {
        const { error: updateError } = await supabase
          .from('trade_recommendations')
          .update({
            current_price: update.currentPrice,
            price_change_since_scan: update.priceChangePercent,
            last_price_update: update.lastPriceUpdate,
          })
          .eq('symbol', update.symbol)
          .eq('is_active', true)
          .gte('scan_date', today);

        if (updateError) {
          console.error(`   ❌ Failed to update ${update.symbol}:`, updateError.message);
        } else {
          updateCount++;
        }
      }

      console.log(`   ✅ Updated ${updateCount}/${priceUpdates.length} recommendations\n`);
    }

    // 5. Print summary
    const endTime = new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / 1000;

    console.log('═══════════════════════════════════════════════════════════');
    console.log('  REFRESH COMPLETE');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`Symbols Refreshed:   ${successCount}`);
    console.log(`Failed:              ${failCount}`);
    console.log(`Duration:            ${duration.toFixed(1)}s\n`);

    // Show top movers
    const topMovers = priceUpdates
      .sort((a, b) => Math.abs(b.priceChangePercent) - Math.abs(a.priceChangePercent))
      .slice(0, 5);

    if (topMovers.length > 0) {
      console.log('📈 Top Movers Since Scan:\n');
      topMovers.forEach((mover, i) => {
        const arrow = mover.priceChangePercent >= 0 ? '↗️' : '↘️';
        console.log(`   ${i + 1}. ${arrow} ${mover.symbol}: ${mover.priceChangePercent >= 0 ? '+' : ''}${mover.priceChangePercent.toFixed(2)}%`);
      });
      console.log();
    }

  } catch (error) {
    console.error('\n❌ Price refresh failed:', error);
    throw error;
  }
}

// Run the price refresh
if (require.main === module) {
  refreshPrices()
    .then(() => {
      console.log('✅ Price refresh complete!\n');
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { refreshPrices, isMarketOpen };
