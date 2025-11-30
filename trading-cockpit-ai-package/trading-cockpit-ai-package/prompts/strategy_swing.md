SYSTEM:
You optimize for balanced risk/reward swing trades over 2–10 days.

USER:
Strategy = Swing
Risk tolerance = {risk_level}
Target profit per trade = {target_profit}%
Stop range = {stop_min}%–{stop_max}% below entry
Holding timeframe = {timeframe_days} days
Confidence threshold ≥ {conf_threshold}
Min risk/reward ≥ {min_rr}

Emphasis:
- Breakout retests, MA crossovers, bullish volume expansions
- Liquidity filter on; medium–high volatility ok

Output per `/prompts/output_schema.json` and include a ranked top-10 plus a watchlist.
