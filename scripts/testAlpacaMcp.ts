/**
 * Test Script: Alpaca MCP Server Connection
 *
 * Purpose: Verify Alpaca MCP server is working and explore capabilities
 *
 * What this tests:
 * 1. Account information (paper trading account)
 * 2. Current positions (if any)
 * 3. Market data retrieval (stock bars)
 * 4. Portfolio history
 *
 * Prerequisites:
 * - Alpaca MCP server added to .mcp.json ✅
 * - ALPACA_API_KEY, ALPACA_SECRET_KEY, ALPACA_BASE_URL in .env.local ✅
 * - Python + uv installed (for MCP server)
 * - Claude Code restarted to load new MCP server
 *
 * Usage:
 * 1. Restart Claude Code to load Alpaca MCP
 * 2. Run this via Claude Code (not directly via npx tsx)
 * 3. Claude will use MCP tools to fetch data
 *
 * Expected Output:
 * - Account details (buying power, equity, etc.)
 * - Current positions (likely empty for paper account)
 * - Sample market data for AAPL
 * - Confirmation that MCP server is working
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testAlpacaMcp() {
  console.log('🧪 Alpaca MCP Server Test\n');
  console.log('=' .repeat(60));

  console.log('\n📋 Test Plan:');
  console.log('1. Verify environment variables');
  console.log('2. Test account information retrieval');
  console.log('3. Test position retrieval');
  console.log('4. Test market data (AAPL 5-min bars)');
  console.log('5. Test portfolio history');

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Step 1: Environment Variables\n');

  const hasApiKey = !!process.env.ALPACA_API_KEY;
  const hasSecretKey = !!process.env.ALPACA_SECRET_KEY;
  const hasBaseUrl = !!process.env.ALPACA_BASE_URL;

  console.log(`ALPACA_API_KEY: ${hasApiKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`ALPACA_SECRET_KEY: ${hasSecretKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`ALPACA_BASE_URL: ${hasBaseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`Base URL: ${process.env.ALPACA_BASE_URL}`);

  if (!hasApiKey || !hasSecretKey || !hasBaseUrl) {
    console.error('\n❌ Missing required environment variables!');
    console.error('Please check your .env.local file.');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n⚠️  NEXT STEPS (Manual via Claude Code):\n');

  console.log('This script verifies env vars only.');
  console.log('To test Alpaca MCP capabilities, use Claude Code:\n');

  console.log('📝 Prompt Claude Code with:');
  console.log('─'.repeat(60));
  console.log('"Use the Alpaca MCP server to:');
  console.log('1. Get my account information');
  console.log('2. List current positions');
  console.log('3. Get 5-minute bars for AAPL from today');
  console.log('4. Show portfolio history for the last 7 days"\n');
  console.log('─'.repeat(60));

  console.log('\n📊 Expected MCP Tools Available:');
  console.log('Account & Portfolio:');
  console.log('  - get_account_info');
  console.log('  - get_positions');
  console.log('  - get_portfolio_history');
  console.log('  - get_watchlists');

  console.log('\nMarket Data:');
  console.log('  - get_stock_bars (historical OHLC)');
  console.log('  - get_stock_quotes (bid/ask)');
  console.log('  - get_stock_trades (recent trades)');
  console.log('  - get_stock_snapshot (current state)');

  console.log('\nTrading (Paper Account):');
  console.log('  - place_order');
  console.log('  - cancel_order');
  console.log('  - close_position');

  console.log('\nCrypto (if enabled):');
  console.log('  - get_crypto_bars');
  console.log('  - get_crypto_quotes');
  console.log('  - get_crypto_trades');

  console.log('\n' + '='.repeat(60));
  console.log('\n🎯 Validation Checklist:\n');

  console.log('[ ] Alpaca MCP server loads without errors');
  console.log('[ ] Account info returns buying power, equity');
  console.log('[ ] Positions query works (even if empty)');
  console.log('[ ] Market data fetches successfully');
  console.log('[ ] Ready for paper trading validation loop');

  console.log('\n' + '='.repeat(60));
  console.log('\n💡 Next Implementation Steps:\n');

  console.log('Once MCP is verified:');
  console.log('1. Create lib/paperTradingValidator.ts');
  console.log('2. Auto-place paper trades for top 10 daily recommendations');
  console.log('3. Monitor positions daily via MCP');
  console.log('4. Close at target/stop automatically');
  console.log('5. Store outcomes in recommendation_feedback table');
  console.log('6. Build analytics dashboard for win rate, R:R');

  console.log('\n✅ Environment check complete!\n');
}

// Run the test
testAlpacaMcp().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
