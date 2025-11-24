/**
 * Daily Market Scanner
 *
 * Scans the market for trade opportunities and stores top recommendations
 */

// Load environment variables
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { ScannerConfig, ScannerStats, StockAnalysisResult } from './scanner/types';
import { analyzeBatch } from './scanner/stockAnalyzer';
import { getActiveStocks, storeRecommendations, cleanupOldRecommendations, updateLastScanned } from './scanner/database';
import { storePriceDataBatch } from './scanner/priceStorage';
import { Candle } from '@/lib/types';

// Default configuration
const DEFAULT_CONFIG: ScannerConfig = {
  batchSize: 25,              // Process 25 stocks at a time
  batchDelayMs: 2000,         // 2 second delay between batches
  minScore: 0,                // Store ALL results (was 60, now 0 to show everything)
  maxRecommendations: 1000,   // Store all results (was 30, now unlimited)
  lookbackDays: 60,           // Use 60 days of historical data
};

/**
 * Main scanner function
 */
async function runDailyMarketScan(config: ScannerConfig = DEFAULT_CONFIG): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  DAILY MARKET SCANNER');
  console.log('═══════════════════════════════════════════════════════════\n');

  const stats: ScannerStats = {
    totalStocks: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    opportunities: 0,
    saved: 0,
    startTime: new Date(),
  };

  const scanDate = new Date().toISOString().split('T')[0];
  console.log(`Scan Date: ${scanDate}\n`);

  try {
    // 1. Get stock universe
    console.log('📊 Fetching stock universe...');
    const symbols = await getActiveStocks();
    stats.totalStocks = symbols.length;
    console.log(`   Found ${symbols.length} active stocks\n`);

    // 2. Process in batches
    const batches: string[][] = [];
    for (let i = 0; i < symbols.length; i += config.batchSize) {
      batches.push(symbols.slice(i, i + config.batchSize));
    }

    console.log(`🔍 Processing ${batches.length} batches of ${config.batchSize} stocks...\n`);

    const allResults: StockAnalysisResult[] = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchNum = i + 1;
      const totalBatches = batches.length;

      console.log(`⏳ Batch ${batchNum}/${totalBatches} (${batch.length} stocks)...`);

      // Analyze batch
      const results = await analyzeBatch(batch, config.lookbackDays);

      // Update stats
      stats.processed += batch.length;
      stats.successful += results.filter(r => r.success).length;
      stats.failed += results.filter(r => !r.success).length;

      // Collect ALL successful results (not just opportunities)
      const successfulResults = results.filter(
        r => r.success && r.recommendation && r.score
      );

      // Count how many meet the quality threshold (for stats only)
      const opportunities = successfulResults.filter(
        r => r.score && r.score.totalScore >= 60
      );
      stats.opportunities += opportunities.length;

      // But store ALL successful scans
      allResults.push(...successfulResults);

      // Log progress
      const opportunitiesInBatch = opportunities.length;
      if (opportunitiesInBatch > 0) {
        console.log(`   ✅ Found ${opportunitiesInBatch} opportunities`);
      } else {
        console.log(`   ℹ️  No opportunities found`);
      }

      // Update last scanned timestamp for all symbols in batch
      await Promise.all(batch.map(symbol => updateLastScanned(symbol)));

      // Rate limiting: wait between batches (except last one)
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, config.batchDelayMs));
      }
    }

    console.log(`\n✅ Scanning complete!\n`);

    // 3. Store price data from all successful scans
    console.log('💾 Storing historical price data...');
    const priceDataMap = new Map<string, Candle[]>();

    for (const result of allResults) {
      if (result.success && result.candles && result.candles.length > 0) {
        priceDataMap.set(result.symbol, result.candles);
      }
    }

    if (priceDataMap.size > 0) {
      const priceStats = await storePriceDataBatch(priceDataMap, 'fmp');
      console.log(`   ✅ Stored price data for ${priceStats.successful}/${priceStats.total} stocks\n`);
    } else {
      console.log('   ⚠️  No price data to store\n');
    }

    // 4. Sort ALL results by score (highest first)
    const allSortedResults = allResults
      .sort((a, b) => (b.score?.totalScore || 0) - (a.score?.totalScore || 0));

    console.log(`📈 All Scan Results: ${allSortedResults.length} stocks analyzed\n`);
    console.log(`📊 Top 10 by Score:\n`);
    if (allSortedResults.length > 0) {
      allSortedResults.slice(0, 10).forEach((result, index) => {
        const { symbol, score, recommendation } = result;
        if (score && recommendation) {
          console.log(`   ${(index + 1).toString().padStart(2)}. ${symbol.padEnd(6)} - Score: ${score.totalScore}/100 (${score.confidenceLevel}) - ${recommendation.setup.setupName}`);
        }
      });

      if (allSortedResults.length > 10) {
        console.log(`   ... and ${allSortedResults.length - 10} more (all will be saved to database)`);
      }
    } else {
      console.log('   No results to display');
    }

    // 5. Store ALL results in database (not just top N)
    console.log(`\n💾 Storing all ${allSortedResults.length} scan results...`);
    const saved = await storeRecommendations(allSortedResults, scanDate);
    stats.saved = saved;
    console.log(`   ✅ Saved ${saved} scan results (all stocks analyzed)\n`);

    // 6. Cleanup old recommendations
    console.log('🧹 Cleaning up old recommendations (>30 days)...');
    await cleanupOldRecommendations(30);
    console.log('   ✅ Cleanup complete\n');

    // 7. Print final stats
    stats.endTime = new Date();
    stats.durationMs = stats.endTime.getTime() - stats.startTime.getTime();

    console.log('═══════════════════════════════════════════════════════════');
    console.log('  SCAN SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`Total Stocks:        ${stats.totalStocks}`);
    console.log(`Processed:           ${stats.processed}`);
    console.log(`Successful:          ${stats.successful} (${((stats.successful / stats.processed) * 100).toFixed(1)}%)`);
    console.log(`Failed:              ${stats.failed}`);
    console.log(`Opportunities:       ${stats.opportunities} (${((stats.opportunities / stats.successful) * 100).toFixed(1)}% of successful)`);
    console.log(`Saved:               ${stats.saved}\n`);

    console.log(`Duration:            ${(stats.durationMs / 1000).toFixed(1)}s`);
    console.log(`Avg per stock:       ${(stats.durationMs / stats.processed).toFixed(0)}ms\n`);

    console.log(`Confidence Breakdown:`);
    const highConf = allSortedResults.filter(r => r.score?.confidenceLevel === 'high').length;
    const medConf = allSortedResults.filter(r => r.score?.confidenceLevel === 'medium').length;
    const lowConf = allSortedResults.filter(r => r.score?.confidenceLevel === 'low').length;
    console.log(`  High:   ${highConf}`);
    console.log(`  Medium: ${medConf}`);
    console.log(`  Low:    ${lowConf}\n`);

    console.log(`Score Distribution:`);
    const score80Plus = allSortedResults.filter(r => r.score && r.score.totalScore >= 80).length;
    const score60to79 = allSortedResults.filter(r => r.score && r.score.totalScore >= 60 && r.score.totalScore < 80).length;
    const score40to59 = allSortedResults.filter(r => r.score && r.score.totalScore >= 40 && r.score.totalScore < 60).length;
    const scoreBelow40 = allSortedResults.filter(r => r.score && r.score.totalScore < 40).length;
    console.log(`  80-100 (Excellent): ${score80Plus}`);
    console.log(`  60-79  (Good):      ${score60to79}`);
    console.log(`  40-59  (Fair):      ${score40to59}`);
    console.log(`  0-39   (Weak):      ${scoreBelow40}\n`);

    console.log('✅ Daily market scan complete!\n');

  } catch (error) {
    console.error('\n❌ Scanner failed:', error);
    throw error;
  }
}

// Run the scanner
if (require.main === module) {
  runDailyMarketScan()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runDailyMarketScan };
