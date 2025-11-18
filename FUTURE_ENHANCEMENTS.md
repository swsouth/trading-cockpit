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

---

## Price Alert Notifications

**Status:** Future consideration
**Priority:** TBD
**Estimated effort:** 2-6 hours depending on approach

### Current State
- Price alerts stored in database
- PriceAlertChecker runs in browser only (client-side)
- No notifications when app is closed
- User must be actively using the app to see alerts

### Email Notifications (Recommended First)

**Difficulty:** Easy to Medium (2-4 hours)

#### Service Options

**Resend (Recommended)**
- Free tier: 3,000 emails/month, 100/day
- Modern, developer-friendly API
- Great templates and React email support
- Setup time: ~30 minutes
- Cost: Free for most use cases

**SendGrid**
- Free tier: 100 emails/day (forever)
- Industry standard, very reliable
- More complex setup but powerful
- Setup time: ~1 hour
- Cost: Free tier sufficient

**AWS SES**
- Cost: $0.10 per 1,000 emails (very cheap)
- Requires domain verification
- Best for high volume
- Setup time: ~2 hours
- Cost: Pay-as-you-go (minimal)

#### Implementation Approach
1. Set up email service (Resend recommended)
2. Create Supabase Edge Function to check alerts periodically
3. Run via cron job (every 5-15 minutes)
4. Design clean email template
5. Send email when price crosses threshold
6. Mark alert as triggered in database

#### Benefits
- ✅ Free tier available
- ✅ Works when app is closed
- ✅ Can include charts and details
- ✅ No recurring costs (free tier)
- ✅ Better for non-urgent alerts
- ✅ Email digest option (daily summary)

### SMS Notifications (Optional Premium Feature)

**Difficulty:** Medium (4-6 hours)

#### Service Options

**Twilio (Most Popular)**
- Cost: ~$0.0075 per SMS in US (~$7.50 per 1,000 texts)
- $15 trial credit to start
- Very reliable
- Setup time: ~1 hour
- Cost: Pay-per-message

**AWS SNS**
- Cost: $0.00645 per SMS in US
- Slightly cheaper than Twilio
- Requires AWS setup
- Setup time: ~2 hours
- Cost: Pay-per-message

#### Implementation Considerations
- Need to collect and verify phone numbers
- Costs scale with usage
- May need opt-in/opt-out flow (compliance)
- Rate limits to manage
- Could be premium feature (charge users)

#### Benefits
- ✅ Instant notifications
- ✅ Best for time-sensitive alerts
- ✅ High visibility (SMS open rates ~98%)
- ⚠️ Costs money per message
- ⚠️ Requires phone number collection

### Recommended Approach

**Phase 1: Email Notifications**
1. Start with Resend (free, easy)
2. Implement basic alert emails
3. Test with real price movements
4. Add daily digest feature (optional)

**Phase 2: SMS (if needed)**
1. Only for high-priority alerts
2. Make it optional/premium feature
3. Implement after email proves valuable
4. Consider charging for SMS alerts

### Architecture

```
Supabase Edge Function (cron: every 5 min)
  ↓
Check active alerts
  ↓
Fetch current prices (Finnhub/CoinGecko)
  ↓
Compare against thresholds
  ↓
If triggered → Send notification (email/SMS)
  ↓
Mark alert as triggered
  ↓
Update database
```

### Notes
- 2025-01-17: Discussed email and SMS options, decided to track for future
- Current in-app alerts work for active users
- Email makes most sense as first step (free, easy)
- SMS could be premium feature later
- Consider user preferences for notification types
