/**
 * Multi-Timeframe Scoring Adjustments
 *
 * Adjusts signal scores based on multi-timeframe analysis:
 * - Aligned trends: +10-15% boost to score
 * - Divergent trends: -10-15% penalty
 * - Confluence zones: +5-10% boost
 * - Weekly S/R proximity: +5% boost if near key level
 *
 * This module enhances base scores without replacing existing logic.
 */

import { MultiTimeframeAnalysis } from '../multiTimeframe';

export interface MTFScoreAdjustment {
  baseScore: number;
  adjustedScore: number;
  adjustments: {
    trendAlignment: number;    // +/- 0-15
    confluence: number;         // +/- 0-10
    weeklyLevel: number;        // +/- 0-5
  };
  total: number;                // Sum of adjustments
  adjustmentReason: string;      // Human-readable explanation
}

/**
 * Adjust signal score based on multi-timeframe analysis
 *
 * Logic:
 * 1. Trend Alignment: Aligned = +15%, Divergent = -15%, Neutral = 0%
 * 2. Confluence Zones: 2+ zones = +10%, 1 zone = +5%, 0 zones = 0%
 * 3. Weekly Level Proximity: Within 2% of weekly S/R = +5%
 */
export function adjustScoreForMTF(
  baseScore: number,
  mtfAnalysis: MultiTimeframeAnalysis,
  currentPrice: number
): MTFScoreAdjustment {
  console.log(`[MTF-Scoring] Base score: ${baseScore}, Alignment: ${mtfAnalysis.trendAlignment}, Higher TF: ${mtfAnalysis.higherTimeframeTrend}, Strength: ${mtfAnalysis.trendStrength}`);

  const adjustments = {
    trendAlignment: 0,
    confluence: 0,
    weeklyLevel: 0,
  };

  // 1. Trend Alignment Adjustment (±15 points)
  if (mtfAnalysis.trendAlignment === 'aligned') {
    adjustments.trendAlignment = 15 * mtfAnalysis.trendStrength;
    console.log(`[MTF-Scoring] Aligned trend bonus: +${adjustments.trendAlignment.toFixed(1)}`);
  } else if (mtfAnalysis.trendAlignment === 'divergent') {
    adjustments.trendAlignment = -15 * mtfAnalysis.trendStrength;
    console.log(`[MTF-Scoring] Divergent trend penalty: ${adjustments.trendAlignment.toFixed(1)}`);
  } else {
    console.log(`[MTF-Scoring] Neutral trend: no adjustment`);
  }

  // 2. Confluence Zone Adjustment (+10 points max)
  const confluenceCount = mtfAnalysis.confluenceZones.length;
  if (confluenceCount >= 2) {
    adjustments.confluence = 10;
  } else if (confluenceCount === 1) {
    adjustments.confluence = 5;
  }

  // 3. Weekly Level Proximity (+5 points)
  const nearWeeklySupport = mtfAnalysis.weeklySupport
    ? Math.abs(currentPrice - mtfAnalysis.weeklySupport) / currentPrice < 0.02
    : false;

  const nearWeeklyResistance = mtfAnalysis.weeklyResistance
    ? Math.abs(currentPrice - mtfAnalysis.weeklyResistance) / currentPrice < 0.02
    : false;

  if (nearWeeklySupport || nearWeeklyResistance) {
    adjustments.weeklyLevel = 5;
  }

  // Calculate total adjustment
  const total = adjustments.trendAlignment + adjustments.confluence + adjustments.weeklyLevel;

  // Apply adjustment (capped at 0-100)
  const adjustedScore = Math.max(0, Math.min(100, baseScore + total));

  // Generate human-readable reason
  const reasons: string[] = [];
  if (adjustments.trendAlignment > 0) reasons.push('aligned with weekly trend');
  if (adjustments.trendAlignment < 0) reasons.push('divergent from weekly trend');
  if (adjustments.confluence > 0) reasons.push(`${confluenceCount} confluence zones`);
  if (adjustments.weeklyLevel > 0) reasons.push('near weekly S/R');

  const adjustmentReason = reasons.length > 0 ? reasons.join(', ') : 'no MTF adjustment';

  return {
    baseScore,
    adjustedScore,
    adjustments,
    total,
    adjustmentReason,
  };
}

/**
 * Get trend alignment bonus/penalty
 */
export function getTrendAlignmentBonus(
  alignment: 'aligned' | 'divergent' | 'neutral',
  strength: number
): number {
  if (alignment === 'aligned') {
    return 15 * strength; // Up to +15 points
  } else if (alignment === 'divergent') {
    return -15 * strength; // Up to -15 points
  }
  return 0; // Neutral = no adjustment
}

/**
 * Get confluence zone bonus
 */
export function getConfluenceBonus(confluenceZones: number): number {
  if (confluenceZones >= 2) return 10;
  if (confluenceZones === 1) return 5;
  return 0;
}

/**
 * Check if price is near a weekly level
 */
export function isNearWeeklyLevel(
  currentPrice: number,
  weeklySupport?: number | null,
  weeklyResistance?: number | null
): boolean {
  const threshold = 0.02; // Within 2%

  if (weeklySupport) {
    const distFromSupport = Math.abs(currentPrice - weeklySupport) / currentPrice;
    if (distFromSupport < threshold) return true;
  }

  if (weeklyResistance) {
    const distFromResistance = Math.abs(currentPrice - weeklyResistance) / currentPrice;
    if (distFromResistance < threshold) return true;
  }

  return false;
}
