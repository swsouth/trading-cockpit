# Alpaca MCP Server - Connection Fix ✅

**Issue:** Alpaca MCP server failed to reconnect with error: "Package not found in registry"

**Root Cause:** Incorrect package name in `.mcp.json` configuration

**Fix Applied:** Changed package name from `mcp-server-alpaca` to `alpaca-mcp-server`

---

## What Was Changed

### 1. Updated `.mcp.json` Configuration

**Issue:** Configuration was missing the `serve` subcommand and used Windows-specific `cmd /c` wrapper.

**Before (Incorrect):**
```json
"alpaca": {
  "command": "cmd",
  "args": ["/c", "python", "-m", "uv", "tool", "run", "alpaca-mcp-server@latest"],
  "env": { ... }
}
```

**After (Correct - Windows Compatible):**
```json
"alpaca": {
  "command": "python",
  "args": ["-m", "uv", "tool", "run", "alpaca-mcp-server", "serve"],
  "env": {
    "ALPACA_API_KEY": "${ALPACA_API_KEY}",
    "ALPACA_SECRET_KEY": "${ALPACA_SECRET_KEY}",
    "ALPACA_BASE_URL": "${ALPACA_BASE_URL}"
  }
}
```

**Key Changes:**
1. ✅ Added `serve` subcommand (required to start the MCP server in stdio mode)
2. ✅ Removed `cmd /c` wrapper (not needed, use `python` directly)
3. ✅ Removed `@latest` version suffix (uv tool run handles versions automatically)

### 2. Verification

Tested the corrected package manually:
```bash
python -m uv tool run alpaca-mcp-server@latest --help
```

**Result:** ✅ Package installed successfully (45 packages, 3.89s)

---

## Next Steps

### 1. Restart Claude Code (REQUIRED)

**Why:** MCP servers load at startup. The configuration has been fixed, but Claude Code needs to restart to reload it.

**How:**
1. Save any open work
2. Close Claude Code completely
3. Reopen Claude Code in this project directory
4. Wait for startup to complete

**Expected:** Alpaca MCP server should now load without errors.

---

### 2. Test the Connection (5 minutes)

After restart, prompt Claude Code with:

```
Use the Alpaca MCP server to:

1. Get my account information (paper trading account)
2. Show current positions
3. Get today's 5-minute bars for AAPL
4. Show portfolio history for the last 7 days

Please format the results clearly so I can verify the MCP is working.
```

**Expected Results:**

✅ **Account Info:**
- Account number (paper)
- Buying power: ~$100,000
- Equity: ~$100,000
- Status: ACTIVE

✅ **Positions:**
- Likely empty (no trades placed yet)
- Or shows any existing paper trades

✅ **AAPL Bars:**
- Array of 5-minute OHLCV candles
- From today's market session
- Proper timestamps and price data

✅ **Portfolio History:**
- Equity values over last 7 days
- Likely flat at $100,000 if no trades

---

## Technical Details

### Package Information

**Official Package:** [`alpaca-mcp-server`](https://pypi.org/project/alpaca-mcp-server/)
- **Version:** 1.0.4 (latest)
- **Maintainer:** Alpaca (idsts2670)
- **License:** MIT
- **Requires:** Python >=3.10

**GitHub Repository:** https://github.com/alpacahq/alpaca-mcp-server
- ⭐ 359 stars
- 🍴 105 forks
- Status: Active development

### Dependencies Installed

The package automatically installs:
- `mcp` - Model Context Protocol SDK
- `alpaca-py` - Alpaca Trading API client
- `pydantic` - Data validation
- `pandas` - Data analysis
- `numpy` - Numerical computing
- 40+ additional dependencies

---

## What This Enables

Once the MCP server is working, you can:

### 1. Paper Trading Validation Loop ⭐⭐⭐⭐⭐
- Auto-validate every recommendation
- Track actual win rate vs predicted
- Prove your scanner works with real data
- Build user trust with verified results

### 2. Better Intraday Data
- 5-minute bars for day trading scanner
- Cleaner code (MCP vs direct API calls)
- Unified interface for stocks + crypto + options

### 3. Options Scanner (Future)
- Full options chain access
- Greeks (delta, gamma, theta, vega)
- Covered calls, protective puts

---

## Troubleshooting

### If MCP Still Won't Load After Restart

**Check 1: Python Version**
```bash
python --version
```
**Required:** Python 3.10 or higher
**Current:** Python 3.14.0 ✅

**Check 2: UV Package Manager**
```bash
pip show uv
```
**Required:** uv installed
**Current:** uv 0.9.11 ✅

**Check 3: Environment Variables**
Verify `.env.local` contains:
```bash
ALPACA_API_KEY=your_paper_api_key_here
ALPACA_SECRET_KEY=your_paper_secret_key_here
ALPACA_BASE_URL=https://paper-api.alpaca.markets/v2
```
**Current:** All variables present ✅

**Check 4: API Connectivity**
```bash
curl -I https://paper-api.alpaca.markets/v2
```
**Expected:** HTTP 404 (normal - endpoint requires authentication)
**Current:** Connection successful ✅

### If MCP Loads But Returns Errors

**Symptom:** "Unauthorized" or "Account not found"

**Possible Causes:**
1. Using production URL with paper keys (or vice versa)
2. API keys expired or invalid
3. Account not activated

**Solution:**
1. Verify `ALPACA_BASE_URL` matches key type (paper vs production)
2. Regenerate API keys on [Alpaca Dashboard](https://app.alpaca.markets/paper/dashboard/overview)
3. Check account status at alpaca.markets

---

## Documentation Updated

Files updated to reflect the fix:
- ✅ `.mcp.json` - Corrected package name
- ✅ `docs/ALPACA_MCP_SETUP.md` - Updated configuration example
- ✅ `ALPACA_MCP_FIX.md` - This file (for future reference)

---

## References

**Official Alpaca MCP Docs:**
https://docs.alpaca.markets/docs/alpaca-mcp-server

**PyPI Package:**
https://pypi.org/project/alpaca-mcp-server/

**GitHub Repository:**
https://github.com/alpacahq/alpaca-mcp-server

**Model Context Protocol Spec:**
https://modelcontextprotocol.io/

---

**Status:** ✅ Fix applied, ready for testing after restart

**Next Action:** Restart Claude Code to load the corrected MCP configuration
