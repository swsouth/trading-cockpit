'use client';

import { useState } from 'react';
import { TradeRecommendation } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  ExternalLink,
  Calendar,
  TrendingUpIcon,
  BarChart3,
  DollarSign,
} from 'lucide-react';
import Link from 'next/link';
import ChartModal from './ChartModal';
import { getCompanyName } from '@/lib/stockNames';

interface RecommendationCardProps {
  recommendation: TradeRecommendation;
  onPaperTrade?: (recommendation: TradeRecommendation) => void;
}

export function RecommendationCard({ recommendation, onPaperTrade }: RecommendationCardProps) {
  const [isChartOpen, setIsChartOpen] = useState(false);
  const [isPaperTrading, setIsPaperTrading] = useState(false);

  const {
    symbol,
    setup_type,
    recommendation_type,
    entry_price,
    target_price,
    stop_loss,
    risk_reward_ratio,
    opportunity_score,
    confidence_level,
    rationale,
    pattern_detected,
    trend,
    scan_date,
    current_price,
    channel_status,
  } = recommendation;

  // Calculate potential returns
  const potentialGainPct = recommendation_type === 'long'
    ? ((target_price - entry_price) / entry_price) * 100
    : ((entry_price - target_price) / entry_price) * 100;

  const potentialLossPct = recommendation_type === 'long'
    ? ((entry_price - stop_loss) / entry_price) * 100
    : ((stop_loss - entry_price) / entry_price) * 100;

  // Direction badge
  const getDirectionColor = (dir: string) => {
    return dir === 'long'
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  // Confidence badge color
  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default:
        return '';
    }
  };

  // Score color
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 50) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  // High risk indicator for scores < 50
  const isHighRisk = opportunity_score < 50;

  // Calculate expected timeframe based on setup type
  const getExpectedTimeframe = (setupType: string): string => {
    if (setupType.includes('Bounce') || setupType.includes('Rejection')) {
      return '1-2 weeks';
    } else if (setupType.includes('Breakout') || setupType.includes('Breakdown')) {
      return '2-4 weeks';
    } else if (setupType.includes('Channel')) {
      return '1-3 weeks';
    } else if (setupType.includes('Pattern Only')) {
      return 'Days-1 week';
    } else {
      return '1-3 weeks'; // Default for other setups
    }
  };

  return (
    <Card className={isHighRisk ? 'border-2 border-red-500 dark:border-red-600' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 flex-wrap">
                <CardTitle
                  className="text-2xl font-bold cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  onClick={() => setIsChartOpen(true)}
                  title="Click to view chart"
                >
                  {symbol}
                </CardTitle>
              </div>
              <div className="text-sm text-muted-foreground -mt-1">
                {getCompanyName(symbol)}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap mt-2">
              <Badge className={getDirectionColor(recommendation_type)}>
                {recommendation_type === 'long' ? (
                  <>
                    <TrendingUp className="h-3 w-3 mr-1" />
                    LONG
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 mr-1" />
                    SHORT
                  </>
                )}
              </Badge>
              <Badge className={getConfidenceColor(confidence_level)}>
                {confidence_level.toUpperCase()}
              </Badge>
              {isHighRisk && (
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700">
                  ⚠️ HIGH RISK
                </Badge>
              )}
              <Badge variant="outline">{setup_type}</Badge>
              {pattern_detected && pattern_detected !== 'none' && (
                <Badge variant="secondary" className="text-xs">
                  {pattern_detected.replace(/_/g, ' ')}
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${getScoreColor(opportunity_score)}`}>
              {opportunity_score}
            </div>
            <div className="text-xs text-muted-foreground">Score</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Price Levels */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {/* Entry */}
            <div>
              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                {recommendation_type === 'long' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>Entry</span>
              </div>
              <div className="font-bold text-lg">
                ${entry_price.toFixed(2)}
              </div>
              {current_price && (
                <div className="text-xs text-muted-foreground">
                  Current: ${current_price.toFixed(2)}
                </div>
              )}
            </div>

            {/* Target */}
            <div>
              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                <Target className="h-3 w-3" />
                <span>Target</span>
              </div>
              <div className="font-bold text-lg text-green-600 dark:text-green-400">
                ${target_price.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">
                +{potentialGainPct.toFixed(1)}%
              </div>
            </div>

            {/* Stop Loss */}
            <div>
              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                <Shield className="h-3 w-3" />
                <span>Stop Loss</span>
              </div>
              <div className="font-bold text-lg text-red-600 dark:text-red-400">
                ${stop_loss.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">
                -{potentialLossPct.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Expected Timeframe & Risk/Reward */}
          <div className="pt-2 border-t grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Expected</div>
                <div className="font-medium">{getExpectedTimeframe(setup_type)}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground mb-0.5">Risk/Reward</div>
              <div className="font-bold text-blue-600 dark:text-blue-400">
                {risk_reward_ratio.toFixed(2)}:1
              </div>
            </div>
          </div>
        </div>

        {/* Technical Context */}
        {(channel_status || trend) && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            {channel_status && (
              <div>
                <div className="text-muted-foreground">Channel</div>
                <div className="font-medium capitalize">{channel_status.replace(/_/g, ' ')}</div>
              </div>
            )}
            {trend && (
              <div>
                <div className="text-muted-foreground">Trend</div>
                <div className="font-medium capitalize">{trend}</div>
              </div>
            )}
          </div>
        )}

        {/* High Risk Warning */}
        {isHighRisk && (
          <div className="text-sm bg-red-50 dark:bg-red-950/20 rounded-lg p-3 border border-red-200 dark:border-red-900">
            <div className="font-bold text-red-900 dark:text-red-200 mb-1 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              High Risk Trade
            </div>
            <p className="text-red-800 dark:text-red-300 text-xs">
              This recommendation has a low opportunity score (below 50/100). The setup lacks strong technical confirmation.
              Trade with extreme caution, use smaller position sizes, and consider this highly speculative.
            </p>
          </div>
        )}

        {/* Rationale */}
        {rationale && (
          <div className="text-sm bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-100 dark:border-blue-900">
            <div className="font-medium text-blue-900 dark:text-blue-200 mb-1">
              Analysis
            </div>
            <p className="text-blue-800 dark:text-blue-300">{rationale}</p>
          </div>
        )}

        {/* Metadata */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Scanned: {new Date(scan_date).toLocaleDateString()}</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsChartOpen(true)}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View Chart
            </Button>
            {onPaperTrade && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onPaperTrade(recommendation)}
                disabled={isPaperTrading}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto min-h-[44px] sm:min-h-0"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                {isPaperTrading ? 'Trading...' : 'Paper Trade'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      {/* Candlestick Chart Modal */}
      <ChartModal
        symbol={symbol}
        isOpen={isChartOpen}
        onClose={() => setIsChartOpen(false)}
      />
    </Card>
  );
}
