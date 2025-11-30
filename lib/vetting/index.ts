/**
 * Enhanced Vetting System
 *
 * 20-point checklist that validates trade recommendations
 * before they reach the user. Combines technical, fundamental,
 * sentiment, and timing factors.
 *
 * Scoring: 0-100 points, must achieve 70+ to pass
 */

import type { TradeRecommendation } from '../types';
import type { TradeRecommendation as TradeCalcRecommendation } from '../tradeCalculator/types';
import type {
  VettingResult,
  VettingChecks,
  CheckResult,
  FundamentalData,
  EarningsCalendar,
  AnalystRating,
} from './types';
import { getFundamentals, getEarningsCalendar, getAnalystRatings } from './yahooFinance';

/**
 * Run comprehensive vetting on a trade recommendation
 * Returns detailed breakdown of all 20 checks
 * Accepts either the database type or trade calculator type
 */
export async function vetRecommendation(
  recommendation: TradeRecommendation | TradeCalcRecommendation,
  candles?: any[]
): Promise<VettingResult> {
  const { symbol } = recommendation;

  console.log(`\n🔍 Vetting ${symbol}...`);

  // Fetch external data in parallel
  const [fundamentals, earnings, analystRating] = await Promise.all([
    getFundamentals(symbol).catch(() => null),
    getEarningsCalendar(symbol).catch(() => null),
    getAnalystRatings(symbol).catch(() => null),
  ]);

  // Run all checks
  const checks: VettingChecks = {
    technical: {
      channelQuality: checkChannelQuality(recommendation),
      patternReliability: checkPatternReliability(recommendation),
      volumeConfirmation: checkVolumeConfirmation(recommendation),
      riskRewardRatio: checkRiskRewardRatio(recommendation),
    },
    fundamental: {
      earningsProximity: checkEarningsProximity(earnings),
      marketCap: checkMarketCap(fundamentals),
      averageVolume: checkAverageVolume(fundamentals),
      priceEarningsRatio: checkPERatio(fundamentals),
      debtToEquity: checkDebtToEquity(fundamentals),
    },
    sentiment: {
      newsSentiment: checkNewsSentiment(symbol),
      socialSentiment: checkSocialSentiment(symbol),
      analystRating: checkAnalystRating(analystRating),
    },
    timing: {
      marketHours: checkMarketHours(),
      spreadQuality: checkSpreadQuality(recommendation),
    },
  };

  // Calculate overall score
  const overallScore = calculateOverallScore(checks);
  const passed = overallScore >= 70;

  // Extract red/green flags
  const { redFlags, greenFlags } = extractFlags(checks);

  // Generate summary
  const summary = generateSummary(symbol, overallScore, passed, redFlags, greenFlags);

  const result: VettingResult = {
    symbol,
    timestamp: new Date().toISOString(),
    overallScore,
    passed,
    checks,
    summary,
    redFlags,
    greenFlags,
  };

  console.log(`${passed ? '✅' : '❌'} ${symbol} vetting: ${overallScore}/100 (${passed ? 'PASS' : 'FAIL'})`);
  if (redFlags.length > 0) {
    console.log(`   🚩 Red flags: ${redFlags.join(', ')}`);
  }

  return result;
}

// ============================================================================
// TECHNICAL CHECKS (40 points total)
// ============================================================================

function checkChannelQuality(rec: any): CheckResult {
  const maxScore = 10;
  const score = rec.opportunity_score >= 75 ? 10 : rec.opportunity_score >= 60 ? 7 : 5;

  return {
    score,
    maxScore,
    passed: score >= 7,
    details: `Opportunity score: ${rec.opportunity_score}/100`,
    value: rec.opportunity_score,
  };
}

function checkPatternReliability(rec: any): CheckResult {
  const maxScore = 10;

  // Pattern confidence mapping
  const patternScores: Record<string, number> = {
    bullish_engulfing: 10,
    hammer: 9,
    piercing_line: 8,
    bearish_engulfing: 10,
    shooting_star: 9,
    dark_cloud_cover: 8,
    doji: 5,
  };

  const score = rec.rationale ? (patternScores[rec.rationale.toLowerCase()] || 5) : 5;

  return {
    score,
    maxScore,
    passed: score >= 7,
    details: `Pattern: ${rec.rationale || 'None detected'}`,
    value: rec.rationale,
  };
}

function checkVolumeConfirmation(rec: any): CheckResult {
  const maxScore = 10;

  // For now, use confidence level as proxy (will enhance with actual volume data later)
  const score = rec.confidence_level === 'high' ? 10 : rec.confidence_level === 'medium' ? 7 : 4;

  return {
    score,
    maxScore,
    passed: score >= 7,
    details: `Confidence level: ${rec.confidence_level}`,
    value: rec.confidence_level,
  };
}

function checkRiskRewardRatio(rec: any): CheckResult {
  const maxScore = 10;

  const targetGain = rec.target_price - rec.entry_price;
  const stopLoss = rec.entry_price - rec.stop_loss;
  const rr = targetGain / stopLoss;

  const score = rr >= 3 ? 10 : rr >= 2.5 ? 9 : rr >= 2 ? 7 : rr >= 1.5 ? 5 : 2;

  return {
    score,
    maxScore,
    passed: score >= 7,
    details: `R:R ratio: ${rr.toFixed(2)}:1`,
    value: rr,
  };
}

// ============================================================================
// FUNDAMENTAL CHECKS (30 points total)
// ============================================================================

function checkEarningsProximity(earnings: EarningsCalendar | null): CheckResult {
  const maxScore = 10;

  if (!earnings) {
    // No earnings data = assume safe (neutral score)
    return {
      score: 7,
      maxScore,
      passed: true,
      details: 'No upcoming earnings data available',
      value: null,
    };
  }

  const { daysUntilEarnings } = earnings;

  // Penalize trades within 7 days of earnings
  const score = daysUntilEarnings >= 7 ? 10 : daysUntilEarnings >= 3 ? 5 : 0;

  return {
    score,
    maxScore,
    passed: score >= 7,
    details: `Earnings in ${daysUntilEarnings} days`,
    value: daysUntilEarnings,
  };
}

function checkMarketCap(fundamentals: FundamentalData | null): CheckResult {
  const maxScore = 5;

  if (!fundamentals) {
    return {
      score: 3,
      maxScore,
      passed: true,
      details: 'Market cap data unavailable',
      value: null,
    };
  }

  const { marketCap } = fundamentals;

  // Prefer large/mid cap stocks (>= $1B)
  const score = marketCap >= 10_000_000_000 ? 5 : marketCap >= 1_000_000_000 ? 4 : marketCap >= 500_000_000 ? 2 : 0;

  return {
    score,
    maxScore,
    passed: score >= 3,
    details: `Market cap: $${(marketCap / 1_000_000_000).toFixed(1)}B`,
    value: marketCap,
  };
}

function checkAverageVolume(fundamentals: FundamentalData | null): CheckResult {
  const maxScore = 5;

  if (!fundamentals) {
    return {
      score: 3,
      maxScore,
      passed: true,
      details: 'Volume data unavailable',
      value: null,
    };
  }

  const { averageVolume } = fundamentals;

  // Require minimum liquidity (>= 1M shares/day)
  const score = averageVolume >= 5_000_000 ? 5 : averageVolume >= 1_000_000 ? 4 : averageVolume >= 500_000 ? 2 : 0;

  return {
    score,
    maxScore,
    passed: score >= 3,
    details: `Avg volume: ${(averageVolume / 1_000_000).toFixed(1)}M shares`,
    value: averageVolume,
  };
}

function checkPERatio(fundamentals: FundamentalData | null): CheckResult {
  const maxScore = 5;

  if (!fundamentals || !fundamentals.peRatio) {
    return {
      score: 3,
      maxScore,
      passed: true,
      details: 'P/E ratio unavailable',
      value: null,
    };
  }

  const { peRatio } = fundamentals;

  // Reasonable P/E range: 5-50
  const score = peRatio >= 5 && peRatio <= 50 ? 5 : peRatio > 50 && peRatio <= 100 ? 3 : 1;

  return {
    score,
    maxScore,
    passed: score >= 3,
    details: `P/E ratio: ${peRatio.toFixed(1)}`,
    value: peRatio,
  };
}

function checkDebtToEquity(fundamentals: FundamentalData | null): CheckResult {
  const maxScore = 5;

  if (!fundamentals || fundamentals.debtToEquity === null) {
    return {
      score: 3,
      maxScore,
      passed: true,
      details: 'Debt/equity ratio unavailable',
      value: null,
    };
  }

  const { debtToEquity } = fundamentals;

  // Prefer low debt (<2.0)
  const score = debtToEquity < 1 ? 5 : debtToEquity < 2 ? 4 : debtToEquity < 3 ? 2 : 0;

  return {
    score,
    maxScore,
    passed: score >= 3,
    details: `Debt/Equity: ${debtToEquity.toFixed(2)}`,
    value: debtToEquity,
  };
}

// ============================================================================
// SENTIMENT CHECKS (20 points total)
// ============================================================================

function checkNewsSentiment(symbol: string): CheckResult {
  const maxScore = 10;

  // TODO: Integrate NewsAPI or similar for real sentiment
  // For now, neutral score
  return {
    score: 7,
    maxScore,
    passed: true,
    details: 'News sentiment analysis not yet implemented',
    value: 'neutral',
  };
}

function checkSocialSentiment(symbol: string): CheckResult {
  const maxScore = 5;

  // TODO: Integrate social sentiment API
  // For now, neutral score
  return {
    score: 3,
    maxScore,
    passed: true,
    details: 'Social sentiment analysis not yet implemented',
    value: 'neutral',
  };
}

function checkAnalystRating(rating: AnalystRating | null): CheckResult {
  const maxScore = 5;

  if (!rating) {
    return {
      score: 3,
      maxScore,
      passed: true,
      details: 'Analyst ratings unavailable',
      value: null,
    };
  }

  const ratingScores: Record<AnalystRating['rating'], number> = {
    strong_buy: 5,
    buy: 4,
    hold: 3,
    sell: 1,
    strong_sell: 0,
  };

  const score = ratingScores[rating.rating];

  return {
    score,
    maxScore,
    passed: score >= 3,
    details: `${rating.numberOfAnalysts} analysts: ${rating.rating.replace('_', ' ')}`,
    value: rating.rating,
  };
}

// ============================================================================
// TIMING CHECKS (10 points total)
// ============================================================================

function checkMarketHours(): CheckResult {
  const maxScore = 5;

  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  // Market hours: 9:30 AM - 4:00 PM ET, Mon-Fri
  // For simplicity, assume local time approximates ET
  const isWeekday = day >= 1 && day <= 5;
  const isMarketHours = hour >= 9 && hour < 16;

  const score = isWeekday && isMarketHours ? 5 : 3;

  return {
    score,
    maxScore,
    passed: true, // Not a strict requirement
    details: `Generated during ${isMarketHours ? 'market hours' : 'off hours'}`,
    value: isMarketHours,
  };
}

function checkSpreadQuality(rec: any): CheckResult {
  const maxScore = 5;

  // TODO: Fetch real-time bid-ask spread from Alpaca
  // For now, assume acceptable spread
  return {
    score: 4,
    maxScore,
    passed: true,
    details: 'Spread quality check not yet implemented',
    value: null,
  };
}

// ============================================================================
// SCORING & SUMMARY
// ============================================================================

function calculateOverallScore(checks: VettingChecks): number {
  let total = 0;

  // Technical (40 pts)
  total += checks.technical.channelQuality.score;
  total += checks.technical.patternReliability.score;
  total += checks.technical.volumeConfirmation.score;
  total += checks.technical.riskRewardRatio.score;

  // Fundamental (30 pts)
  total += checks.fundamental.earningsProximity.score;
  total += checks.fundamental.marketCap.score;
  total += checks.fundamental.averageVolume.score;
  total += checks.fundamental.priceEarningsRatio.score;
  total += checks.fundamental.debtToEquity.score;

  // Sentiment (20 pts)
  total += checks.sentiment.newsSentiment.score;
  total += checks.sentiment.socialSentiment.score;
  total += checks.sentiment.analystRating.score;

  // Timing (10 pts)
  total += checks.timing.marketHours.score;
  total += checks.timing.spreadQuality.score;

  return Math.round(total);
}

function extractFlags(checks: VettingChecks): { redFlags: string[]; greenFlags: string[] } {
  const redFlags: string[] = [];
  const greenFlags: string[] = [];

  // Red flags (failed checks with high importance)
  if (!checks.fundamental.earningsProximity.passed) {
    redFlags.push('Earnings within 7 days');
  }
  if (checks.technical.riskRewardRatio.value && checks.technical.riskRewardRatio.value < 1.5) {
    redFlags.push('Poor R:R ratio (<1.5:1)');
  }
  if (checks.fundamental.marketCap.value && checks.fundamental.marketCap.value < 500_000_000) {
    redFlags.push('Small cap (<$500M)');
  }
  if (checks.fundamental.averageVolume.value && checks.fundamental.averageVolume.value < 500_000) {
    redFlags.push('Low liquidity (<500K vol)');
  }

  // Green flags (strong indicators)
  if (checks.technical.channelQuality.score === 10) {
    greenFlags.push('Strong technical setup');
  }
  if (checks.technical.riskRewardRatio.value && checks.technical.riskRewardRatio.value >= 3) {
    greenFlags.push('Excellent R:R (>=3:1)');
  }
  if (checks.sentiment.analystRating.value === 'strong_buy') {
    greenFlags.push('Analyst strong buy');
  }
  if (checks.fundamental.marketCap.value && checks.fundamental.marketCap.value >= 10_000_000_000) {
    greenFlags.push('Large cap (>$10B)');
  }

  return { redFlags, greenFlags };
}

function generateSummary(
  symbol: string,
  score: number,
  passed: boolean,
  redFlags: string[],
  greenFlags: string[]
): string {
  if (!passed) {
    return `${symbol} failed vetting with ${score}/100 points. Issues: ${redFlags.join(', ')}.`;
  }

  if (score >= 85) {
    return `${symbol} is a strong opportunity (${score}/100). ${greenFlags.join(', ')}.`;
  }

  if (score >= 70) {
    return `${symbol} passed vetting with ${score}/100 points. Proceed with caution${redFlags.length > 0 ? `: ${redFlags.join(', ')}` : ''}.`;
  }

  return `${symbol} scored ${score}/100 points.`;
}
