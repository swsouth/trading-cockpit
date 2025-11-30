/**
 * Enhanced Vetting System Types
 *
 * Types for the 20-point vetting checklist that validates
 * trade recommendations before they reach the user
 */

export interface VettingResult {
  symbol: string;
  timestamp: string;
  overallScore: number; // 0-100
  passed: boolean; // true if score >= 70
  checks: VettingChecks;
  summary: string;
  redFlags: string[];
  greenFlags: string[];
}

export interface VettingChecks {
  // Technical Analysis (40 points total)
  technical: {
    channelQuality: CheckResult; // 10 pts - Channel clarity and touch count
    patternReliability: CheckResult; // 10 pts - Pattern confidence
    volumeConfirmation: CheckResult; // 10 pts - Volume vs 30-day avg
    riskRewardRatio: CheckResult; // 10 pts - R:R >= 2:1
  };

  // Fundamental Analysis (30 points total)
  fundamental: {
    earningsProximity: CheckResult; // 10 pts - No earnings within 7 days
    marketCap: CheckResult; // 5 pts - Market cap >= $1B
    averageVolume: CheckResult; // 5 pts - Avg volume >= 1M shares
    priceEarningsRatio: CheckResult; // 5 pts - P/E reasonable (5-50)
    debtToEquity: CheckResult; // 5 pts - D/E < 2.0
  };

  // Sentiment & News (20 points total)
  sentiment: {
    newsSentiment: CheckResult; // 10 pts - Recent news positive/neutral
    socialSentiment: CheckResult; // 5 pts - No negative trending
    analystRating: CheckResult; // 5 pts - Avg rating >= Hold
  };

  // Timing & Liquidity (10 points total)
  timing: {
    marketHours: CheckResult; // 5 pts - Not during pre/post market
    spreadQuality: CheckResult; // 5 pts - Bid-ask spread < 0.5%
  };
}

export interface CheckResult {
  score: number; // Points earned (0 to max for this check)
  maxScore: number; // Maximum possible points
  passed: boolean; // true if score >= 70% of max
  details: string; // Human-readable explanation
  value?: any; // Raw value (e.g., P/E ratio value)
}

export interface EarningsCalendar {
  symbol: string;
  earningsDate: string;
  daysUntilEarnings: number;
  estimatedEPS?: number;
  actualEPS?: number;
}

export interface FundamentalData {
  symbol: string;
  marketCap: number;
  peRatio: number | null;
  debtToEquity: number | null;
  averageVolume: number;
  beta: number | null;
  dividendYield: number | null;
  industry: string;
  sector: string;
}

export interface NewsSentiment {
  symbol: string;
  overallSentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number; // -1 to +1
  articlesAnalyzed: number;
  recentHeadlines: string[];
  lastUpdated: string;
}

export interface AnalystRating {
  symbol: string;
  rating: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  targetPrice: number | null;
  numberOfAnalysts: number;
  lastUpdated: string;
}
