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
} from 'lucide-react';
import Link from 'next/link';
import TradingViewModal from './TradingViewModal';

interface RecommendationCardProps {
  recommendation: TradeRecommendation;
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const [isChartOpen, setIsChartOpen] = useState(false);

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
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <CardTitle
                className="text-2xl font-bold cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={() => setIsChartOpen(true)}
                title="Click to view chart"
              >
                {symbol}
              </CardTitle>
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
          <div className="pt-2 border-t flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Risk/Reward Ratio:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {risk_reward_ratio.toFixed(2)}:1
            </span>
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
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Scanned: {new Date(scan_date).toLocaleDateString()}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsChartOpen(true)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            View Chart
          </Button>
        </div>
      </CardContent>

      {/* TradingView Chart Modal */}
      <TradingViewModal
        symbol={symbol}
        isOpen={isChartOpen}
        onClose={() => setIsChartOpen(false)}
        currentPrice={current_price}
      />
    </Card>
  );
}
