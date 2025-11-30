'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { TradeRecommendation } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  Calendar,
  BarChart3,
  DollarSign,
  Clock,
  AlertCircle,
} from 'lucide-react';
import ChartModal from './ChartModal';

// Dynamic import VettingBreakdown to avoid SSR issues
const VettingBreakdown = dynamic(() => import('./VettingBreakdown').then(mod => ({ default: mod.VettingBreakdown })), {
  ssr: false,
  loading: () => <div className="text-sm text-muted-foreground">Loading vetting details...</div>,
});

interface CryptoIntradayCardProps {
  recommendation: TradeRecommendation;
  onPaperTrade?: (recommendation: TradeRecommendation) => void;
}

export function CryptoIntradayCard({ recommendation, onPaperTrade }: CryptoIntradayCardProps) {
  const [isChartOpen, setIsChartOpen] = useState(false);
  const [isPaperTrading, setIsPaperTrading] = useState(false);
  const [minutesRemaining, setMinutesRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

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
    valid_until,
    timeframe,
  } = recommendation;

  // Calculate countdown timer
  useEffect(() => {
    if (!valid_until) return;

    const updateCountdown = () => {
      const now = new Date();
      const expiresAt = new Date(valid_until);
      const diffMs = expiresAt.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);

      if (diffMinutes <= 0) {
        setIsExpired(true);
        setMinutesRemaining(0);
      } else {
        setIsExpired(false);
        setMinutesRemaining(diffMinutes);
      }
    };

    // Update immediately
    updateCountdown();

    // Update every 30 seconds
    const interval = setInterval(updateCountdown, 30000);

    return () => clearInterval(interval);
  }, [valid_until]);

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

  // Urgency color for countdown
  const getUrgencyColor = (minutes: number) => {
    if (minutes <= 5) return 'text-red-600 dark:text-red-400 font-bold';
    if (minutes <= 10) return 'text-orange-600 dark:text-orange-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  return (
    <Card className={isExpired ? 'opacity-50 border-2 border-gray-400' : 'border-2 border-blue-500 dark:border-blue-600'}>
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
                {timeframe && (
                  <Badge variant="outline" className="text-xs">
                    {timeframe} bars
                  </Badge>
                )}
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

        {/* Countdown Timer - Prominent Display */}
        {valid_until && (
          <div className={`mt-3 p-3 rounded-lg border-2 ${
            isExpired
              ? 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700'
              : minutesRemaining <= 5
                ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-900'
                : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className={`h-4 w-4 ${isExpired ? 'text-gray-500' : 'text-blue-600 dark:text-blue-400'}`} />
                <span className="text-sm font-medium">
                  {isExpired ? 'Expired' : 'Valid for:'}
                </span>
              </div>
              <div className={`text-xl font-bold ${isExpired ? 'text-gray-500' : getUrgencyColor(minutesRemaining)}`}>
                {isExpired ? 'STALE' : `${minutesRemaining} min`}
              </div>
            </div>
            {!isExpired && minutesRemaining <= 5 && (
              <div className="mt-2 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="h-3 w-3" />
                <span>Opportunity expires soon! Enter now or wait for next scan.</span>
              </div>
            )}
            <div className="mt-1 text-xs text-muted-foreground">
              {isExpired ? 'Wait for next scan' : `Until ${new Date(valid_until).toLocaleTimeString()}`}
            </div>
          </div>
        )}
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

          {/* Risk/Reward */}
          <div className="pt-2 border-t grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Hold Time</div>
                <div className="font-medium">2-4 hours</div>
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
            <span>Scanned: {new Date(scan_date).toLocaleTimeString()}</span>
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
            {onPaperTrade && !isExpired && (
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
