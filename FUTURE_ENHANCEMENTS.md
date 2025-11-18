# Future Enhancements

## Real-Time Data Integration

**Status:** Future consideration
**Priority:** TBD

### Current State
- **Stock quotes**: Real-time via Finnhub (free tier)
- **Stock charts**: Daily OHLC via Alpha Vantage (end-of-day data, 25 calls/day)
- **Crypto**: Near real-time via CoinGecko (updated every few minutes)

### Potential Upgrades

#### For Intraday Charts
- **Alpha Vantage Premium** ($49.99/mo)
  - 1min, 5min, 15min, 30min, 60min intervals
  - 1200 calls/min
  - Better for swing trading with intraday analysis

#### For True Real-Time Streaming
- **Polygon.io** ($199/mo)
  - Real-time stock data with WebSockets
  - Tick-by-tick updates
  - Best for day trading

- **IEX Cloud** ($9-$499/mo)
  - Real-time quotes and trades
  - Flexible pricing tiers

- **Alpaca Markets** (Free with trading account)
  - Real-time market data
  - Potential trading integration

#### For Crypto Real-Time
- **Exchange WebSockets** (Free)
  - Direct connections to Binance, Coinbase, Kraken
  - True real-time crypto prices

- **CryptoCompare** ($50-$500/mo)
  - Aggregated real-time crypto data
  - Professional-grade streaming

### Decision Factors
- Current use case: Technical analysis, pattern detection, swing trading
- Daily/end-of-day data is sufficient for position trading
- Consider upgrading when:
  - Need intraday chart analysis
  - Moving to day trading strategies
  - Want streaming real-time updates
  - Hit API rate limits

### Notes
- 2025-01-17: Discussed real-time options, decided to defer for now
- Daily candles work well for current technical analysis needs
- May revisit when scaling or changing trading strategies
