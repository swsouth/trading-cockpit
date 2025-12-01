/**
 * Analysis Engine - Main Orchestrator
 *
 * The "central brain" that coordinates all market analysis.
 * Single entry point for analyzing stocks and crypto across all timeframes.
 *
 * Pipeline Stages:
 * 1. Data validation & normalization
 * 2. Indicator calculation (EMA, RSI, ADX, ATR)
 * 3. Market regime detection (trending/ranging)
 * 4. Pattern detection (candlestick + chart patterns)
 * 5. Pre-trade filters (liquidity, spread, earnings)
 * 6. Trade setup calculation (entry/stop/target)
 * 7. Opportunity scoring (0-100)
 * 8. Confidence level (high/medium/low)
 * 9. Rationale generation
 *
 * Usage:
 * ```typescript
 * const engine = new AnalysisEngine({ assetType: 'stock', timeframe: 'daily' });
 * const signal = await engine.analyzeAsset({
 *   symbol: 'AAPL',
 *   candles: [...],
 *   currentPrice: 150.50
 * });
 * ```
 */

import {
  AnalysisConfig,
  AnalysisInput,
  Signal,
  EngineOptions,
  Indicators,
  RegimeAnalysis,
  PatternResult,
  TradeSetup,
  OpportunityScore,
  MarketRegime,
} from './types';
import { loadConfig } from './config';
import { detectEnhancedRegime, EnhancedRegime } from './regime/enhanced';
import { analyzeMultipleTimeframes, MultiTimeframeAnalysis } from './multiTimeframe';
import { adjustScoreForMTF } from './scoring/multiTimeframeScoring';

export class AnalysisEngine {
  private config: AnalysisConfig;
  private version: string = '2.0.0'; // Phase 2: Chart patterns + MTF + Enhanced regime

  constructor(options: EngineOptions) {
    this.config = loadConfig(options);
  }

  /**
   * Main analysis entry point
   * Returns a Signal object or null if no actionable setup found
   */
  async analyzeAsset(input: AnalysisInput): Promise<Signal | null> {
    // Stage 1: Validate input data
    if (!this.validateInput(input)) {
      console.warn(`[AnalysisEngine] Invalid input for ${input.symbol}`);
      return null;
    }

    // Stage 2: Calculate technical indicators
    const indicators = this.calculateIndicators(input.candles);

    // Stage 3: Enhanced Regime Detection (Phase 2)
    const regime = this.detectRegime(input.candles, indicators);

    // Stage 3.5: Multi-Timeframe Analysis (Phase 2) - Optional
    let mtfAnalysis: MultiTimeframeAnalysis | null = null;
    if (input.weeklyCandles && input.weeklyCandles.length >= 20) {
      mtfAnalysis = analyzeMultipleTimeframes(
        input.candles,
        input.weeklyCandles,
        input.currentPrice
      );
    }

    // Stage 4: Detect patterns (candlestick + chart patterns)
    const patterns = this.detectPatterns(input.candles, regime);

    // If no patterns detected, no signal
    if (patterns.length === 0) {
      return null;
    }

    // Stage 5: Apply pre-trade filters (liquidity, spread, earnings)
    const passesFilters = this.applyFilters(input, indicators);
    if (!passesFilters) {
      console.log(`[AnalysisEngine] ${input.symbol} filtered out`);
      return null;
    }

    // Stage 6: Calculate trade setup (entry/stop/target)
    const tradeSetup = this.calculateTradeSetup(
      input.candles,
      input.currentPrice,
      patterns,
      regime
    );

    // If no valid trade setup, no signal
    if (!tradeSetup) {
      return null;
    }

    // Stage 7: Calculate base opportunity score (0-100)
    let scoreResult = this.calculateScore(
      input.candles,
      indicators,
      patterns,
      tradeSetup,
      regime
    );

    // Stage 7.5: Apply Multi-Timeframe Adjustments (Phase 2)
    if (mtfAnalysis) {
      const { adjustedScore, adjustmentReason } = adjustScoreForMTF(
        scoreResult.total,
        mtfAnalysis,
        input.currentPrice
      );
      scoreResult = { ...scoreResult, total: adjustedScore };

      console.log(`[AnalysisEngine] ${input.symbol} MTF adjustment: ${adjustedScore - scoreResult.total >= 0 ? '+' : ''}${adjustedScore - scoreResult.total} (${adjustmentReason})`);
    }

    // Stage 8: Determine confidence level (high/medium/low)
    const confidence = this.determineConfidence(scoreResult.total, patterns, regime);

    // Filter out low confidence signals using config threshold
    if (scoreResult.total < this.config.minScore) {
      return null;
    }

    // Stage 9: Generate rationale
    const rationale = this.generateRationale(patterns, regime, tradeSetup, mtfAnalysis);

    // Construct final Signal
    const signal: Signal = {
      symbol: input.symbol,
      recommendation: tradeSetup.direction,
      entry: tradeSetup.entry,
      stopLoss: tradeSetup.stopLoss,
      target: tradeSetup.target,
      riskReward: tradeSetup.riskReward,
      score: scoreResult.total,
      confidence,
      rationale,
      patterns: patterns.map(p => p.type),
      mainPattern: patterns[0]?.type, // Primary pattern
      regime: regime.type,
      metadata: {
        channelStatus: this.determineChannelStatus(input.candles, input.currentPrice),
        volumeConfirmation: this.hasVolumeConfirmation(input.candles, indicators),
        weeklyTrend: mtfAnalysis?.higherTimeframeTrend === 'bullish' ? 'up' : mtfAnalysis?.higherTimeframeTrend === 'bearish' ? 'down' : 'sideways',
        analysisVersion: this.version,
        // Phase 2: Multi-Timeframe metadata
        trendAlignment: mtfAnalysis?.trendAlignment,
        weeklySupport: mtfAnalysis?.weeklySupport || undefined,
        weeklyResistance: mtfAnalysis?.weeklyResistance || undefined,
        confluenceZones: mtfAnalysis?.confluenceZones.length || 0,
      },
      analyzedAt: new Date(),
      expiresAt: this.config.timeframe === 'intraday'
        ? new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours for intraday
        : undefined,
    };

    return signal;
  }

  // ============================================================================
  // STAGE 1: DATA VALIDATION
  // ============================================================================

  private validateInput(input: AnalysisInput): boolean {
    // Must have symbol
    if (!input.symbol || input.symbol.trim() === '') {
      return false;
    }

    // Must have valid current price
    if (!input.currentPrice || input.currentPrice <= 0) {
      return false;
    }

    // Must have candles
    if (!input.candles || input.candles.length === 0) {
      return false;
    }

    // Must have minimum candle count for analysis
    const minCandles = this.config.timeframe === 'intraday' ? 50 : 60;
    if (input.candles.length < minCandles) {
      return false;
    }

    // Validate candles have required fields
    const hasValidCandles = input.candles.every(candle => {
      return (
        candle.open > 0 &&
        candle.high > 0 &&
        candle.low > 0 &&
        candle.close > 0 &&
        (candle.volume === undefined || candle.volume >= 0) &&
        candle.timestamp
      );
    });

    return hasValidCandles;
  }

  // ============================================================================
  // STAGE 2: INDICATOR CALCULATION
  // ============================================================================

  private calculateIndicators(candles: AnalysisInput['candles']): Indicators {
    const {
      calculateEMA,
      calculateRSI,
      calculateADX,
      calculateATR,
      analyzeVolume,
      analyzeIntradayVolume,
    } = require('./patterns/indicators');

    const isIntraday = this.config.timeframe === 'intraday';
    const volumeAnalysis = isIntraday
      ? analyzeIntradayVolume(candles)
      : analyzeVolume(candles);

    return {
      ema50: calculateEMA(candles, 50),
      ema200: calculateEMA(candles, 200),
      rsi: calculateRSI(candles, 14),
      adx: calculateADX(candles, 14),
      atr: calculateATR(candles, 14),
      volume30DayAvg: volumeAnalysis.last30DaysAvg,
      volumeCurrent: volumeAnalysis.currentVolume,
    };
  }

  // ============================================================================
  // STAGE 3: ENHANCED REGIME DETECTION (Phase 2)
  // ============================================================================

  private detectRegime(
    candles: AnalysisInput['candles'],
    indicators: Indicators
  ): EnhancedRegime {
    // Use enhanced regime detection with trend strength, volatility regime, market phase
    const enhancedRegime = detectEnhancedRegime(candles);

    return enhancedRegime;
  }

  // ============================================================================
  // STAGE 4: PATTERN DETECTION
  // ============================================================================

  private detectPatterns(
    candles: AnalysisInput['candles'],
    regime: RegimeAnalysis
  ): PatternResult[] {
    const { detectCandlestickPatterns } = require('./patterns/candlestick');
    const { detectChartPatterns } = require('./patterns/chartPatterns');

    // Detect candlestick patterns (single/double candle formations, regime-aware)
    const candlestickPatterns = detectCandlestickPatterns(candles, regime);

    // Detect chart patterns (multi-bar formations: flags, triangles, double tops/bottoms)
    // Chart patterns require longer price history (20-50 bars) and provide powerful continuation/reversal signals
    const chartPatterns = candles.length >= 20 ? detectChartPatterns(candles) : [];

    // Combine both pattern types
    // Chart patterns often have higher win rates (68-78%) vs candlestick patterns (55-67%)
    // but require more bars to form
    const allPatterns = [...candlestickPatterns, ...chartPatterns];

    // Sort by confidence descending
    allPatterns.sort((a, b) => b.confidence - a.confidence);

    return allPatterns;
  }

  // ============================================================================
  // STAGE 5: PRE-TRADE FILTERS
  // ============================================================================

  private applyFilters(input: AnalysisInput, indicators: Indicators): boolean {
    // TODO: Implement filters based on config
    // - minADV (average daily volume in $)
    // - maxSpread (bid-ask spread %)
    // - earningsBuffer (days before/after earnings)

    // For now, return true (no filtering)
    return true;
  }

  // ============================================================================
  // STAGE 6: TRADE SETUP CALCULATION
  // ============================================================================

  private calculateTradeSetup(
    candles: AnalysisInput['candles'],
    currentPrice: number,
    patterns: PatternResult[],
    regime: RegimeAnalysis
  ): TradeSetup | null {
    const { detectChannel } = require('./patterns/channel');
    const { calculateATR } = require('./patterns/indicators');

    // Detect channel for entry/stop/target calculation
    const channel = detectChannel(candles, this.config);

    // Determine trade direction based on patterns and regime
    const direction = this.determineTradeDirection(patterns, regime, channel);
    if (!direction) {
      return null; // No clear direction
    }

    // Calculate ATR for dynamic stop placement
    const atr = calculateATR(candles, 14);

    // Calculate entry, stop, and target
    let entry: number;
    let stopLoss: number;
    let target: number;

    if (direction === 'long') {
      // Long setup
      if (channel.status === 'near_support' && channel.hasChannel) {
        // Enter at support
        entry = channel.support * 1.005; // Slightly above support
      } else {
        // Enter at current price
        entry = currentPrice;
      }

      // Stop loss: Lesser of channel-based or ATR-based
      const channelStop = channel.hasChannel ? channel.support * 0.98 : entry * 0.95;
      const atrStop = entry - atr * 2.5;
      stopLoss = Math.max(channelStop, atrStop);
      stopLoss = Math.max(stopLoss, entry * 0.90); // Max 10% stop

      // Target: Greater of channel-based or R:R-based
      const risk = entry - stopLoss;
      const rrTarget = entry + risk * 2.0; // Minimum 2:1 R:R
      const channelTarget = channel.hasChannel ? channel.resistance * 0.98 : entry * 1.15;
      target = Math.max(rrTarget, channelTarget);

    } else {
      // Short setup
      if (channel.status === 'near_resistance' && channel.hasChannel) {
        // Enter at resistance
        entry = channel.resistance * 0.995; // Slightly below resistance
      } else {
        // Enter at current price
        entry = currentPrice;
      }

      // Stop loss: Lesser of channel-based or ATR-based
      const channelStop = channel.hasChannel ? channel.resistance * 1.02 : entry * 1.05;
      const atrStop = entry + atr * 2.5;
      stopLoss = Math.min(channelStop, atrStop);
      stopLoss = Math.min(stopLoss, entry * 1.10); // Max 10% stop

      // Target: Greater of channel-based or R:R-based
      const risk = stopLoss - entry;
      const rrTarget = entry - risk * 2.0; // Minimum 2:1 R:R
      const channelTarget = channel.hasChannel ? channel.support * 1.02 : entry * 0.85;
      target = Math.min(rrTarget, channelTarget);
    }

    // Validate setup
    const riskReward = direction === 'long'
      ? (target - entry) / (entry - stopLoss)
      : (entry - target) / (stopLoss - entry);

    if (riskReward < 1.5) {
      return null; // R:R too low
    }

    const riskPct = direction === 'long'
      ? ((entry - stopLoss) / entry) * 100
      : ((stopLoss - entry) / entry) * 100;

    if (riskPct > 10) {
      return null; // Risk too high
    }

    return {
      direction,
      entry,
      stopLoss,
      target,
      riskReward,
      rationale: this.generateSetupRationale(patterns, regime, channel, direction),
    };
  }

  private determineTradeDirection(
    patterns: PatternResult[],
    regime: RegimeAnalysis,
    channel: any
  ): 'long' | 'short' | null {
    if (patterns.length === 0) {
      return null;
    }

    const primaryPattern = patterns[0];
    const patternDirection = primaryPattern.data.direction;

    // If pattern is neutral (doji), use regime
    if (patternDirection === 'neutral') {
      if (regime.type === 'trending_bullish') return 'long';
      if (regime.type === 'trending_bearish') return 'short';
      return null;
    }

    // Use pattern direction
    return patternDirection === 'bullish' ? 'long' : 'short';
  }

  private generateSetupRationale(
    patterns: PatternResult[],
    regime: RegimeAnalysis,
    channel: any,
    direction: 'long' | 'short'
  ): string {
    const parts: string[] = [];

    // Pattern component
    if (patterns.length > 0) {
      const patternName = patterns[0].type.replace(/_/g, ' ');
      parts.push(`${patternName} detected`);
    }

    // Channel component
    if (channel.hasChannel) {
      parts.push(`${channel.status.replace(/_/g, ' ')}`);
    }

    // Regime component
    const regimeName = regime.type.replace(/_/g, ' ');
    parts.push(`${regimeName} regime`);

    return parts.join(', ');
  }

  // ============================================================================
  // STAGE 7: OPPORTUNITY SCORING
  // ============================================================================

  private calculateScore(
    candles: AnalysisInput['candles'],
    indicators: Indicators,
    patterns: PatternResult[],
    tradeSetup: TradeSetup,
    regime: RegimeAnalysis
  ): OpportunityScore {
    const { detectChannel } = require('./patterns/channel');
    const { calculateOpportunityScore } = require('./scoring');

    // Detect channel for scoring
    const channel = detectChannel(candles, this.config);

    // Use the scoring module
    const score = calculateOpportunityScore(
      candles,
      channel,
      patterns,
      tradeSetup,
      indicators,
      this.config
    );

    return score;
  }

  // ============================================================================
  // STAGE 8: CONFIDENCE LEVEL
  // ============================================================================

  private determineConfidence(
    score: number,
    patterns: PatternResult[],
    regime: RegimeAnalysis
  ): 'high' | 'medium' | 'low' {
    // High confidence: 75+ score, multiple patterns, strong regime
    if (score >= 75 && patterns.length >= 2 && regime.strength > 0.6) {
      return 'high';
    }

    // Low confidence: <60 score (shouldn't reach here due to filter)
    if (score < 60) {
      return 'low';
    }

    // Medium confidence: everything else
    return 'medium';
  }

  // ============================================================================
  // STAGE 9: RATIONALE GENERATION
  // ============================================================================

  private generateRationale(
    patterns: PatternResult[],
    regime: EnhancedRegime,
    tradeSetup: TradeSetup,
    mtfAnalysis?: MultiTimeframeAnalysis | null
  ): string {
    const parts: string[] = [];

    // Pattern component
    if (patterns.length > 0) {
      const patternNames = patterns.map(p => p.type.replace(/_/g, ' ')).join(', ');
      parts.push(`Detected ${patternNames}`);
    }

    // Regime component (enhanced with Phase 2 info)
    const regimeName = regime.type.replace(/_/g, ' ');
    const trendStrength = regime.trendStrengthClass;
    parts.push(`${regimeName} (${trendStrength} trend, ${regime.volatilityRegime} vol)`);

    // Multi-timeframe component (Phase 2)
    if (mtfAnalysis && mtfAnalysis.trendAlignment !== 'neutral') {
      const alignment = mtfAnalysis.trendAlignment === 'aligned' ? 'aligned with weekly' : 'divergent from weekly';
      parts.push(`${alignment} trend`);
    }

    // Trade setup component
    const rrRatio = tradeSetup.riskReward.toFixed(1);
    parts.push(`${rrRatio}:1 risk/reward ${tradeSetup.direction}`);

    return parts.join('. ') + '.';
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private determineChannelStatus(
    candles: AnalysisInput['candles'],
    currentPrice: number
  ): 'near_support' | 'near_resistance' | 'inside' | 'broken_out' | null {
    const { detectChannel } = require('./patterns/channel');
    const channel = detectChannel(candles, this.config);
    return channel.hasChannel ? channel.status : null;
  }

  private hasVolumeConfirmation(
    candles: AnalysisInput['candles'],
    indicators: Indicators
  ): boolean {
    // Recent volume vs 30-day average
    const recentVolume = indicators.volumeCurrent || 0;
    const avgVolume = indicators.volume30DayAvg || 1;

    return recentVolume > avgVolume * 1.2; // 20% above average
  }

  /**
   * Get current configuration (for debugging/inspection)
   */
  getConfig(): AnalysisConfig {
    return { ...this.config };
  }

  /**
   * Get engine version
   */
  getVersion(): string {
    return this.version;
  }
}
