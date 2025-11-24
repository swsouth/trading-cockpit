'use client';

import { useState } from 'react';
import { ScanResult } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import TradingViewModal from './TradingViewModal';

interface OpportunityCardProps {
  result: ScanResult;
}

export function OpportunityCard({ result }: OpportunityCardProps) {
  const [isChartOpen, setIsChartOpen] = useState(false);
  const { watchlistItem, quote, action, signal, channel, pattern } = result;

  // Action badge color
  const getActionColor = (recommendation: string) => {
    switch (recommendation) {
      case 'BUY':
      case 'BUY_BREAKOUT':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'SELL':
      case 'SHORT':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'WAIT':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  // Confidence badge color
  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'HIGH':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'MODERATE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'LOW':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default:
        return '';
    }
  };

  // Skip WAIT actions with low confidence (no actionable setup)
  const isActionable = action.recommendation !== 'WAIT';

  return (
    <Card className={!isActionable ? 'opacity-60' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <CardTitle
                className="text-2xl font-bold cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={() => setIsChartOpen(true)}
                title="Click to view chart"
              >
                {watchlistItem.symbol}
              </CardTitle>
              <Badge className={getActionColor(action.recommendation)}>
                {action.recommendation === 'BUY_BREAKOUT'
                  ? 'BREAKOUT'
                  : action.recommendation}
              </Badge>
              <Badge className={getConfidenceColor(action.confidence)}>
                {action.confidence}
              </Badge>
              <Badge variant="outline">{action.setup}</Badge>
            </div>
            {watchlistItem.display_name && (
              <p className="text-sm text-muted-foreground mt-1">
                {watchlistItem.display_name}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">${quote.price.toFixed(2)}</div>
            <div
              className={`text-sm font-medium ${
                quote.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {quote.changePercent >= 0 ? '+' : ''}
              {quote.changePercent.toFixed(2)}%
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Technical Summary */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Channel</div>
            <div className="font-medium">
              {channel.hasChannel
                ? `$${channel.support.toFixed(2)} - $${channel.resistance.toFixed(2)}`
                : 'No channel'}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Pattern</div>
            <div className="font-medium">
              {pattern.mainPattern !== 'none'
                ? pattern.mainPattern.replace(/_/g, ' ')
                : 'None'}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Bias</div>
            <div className="font-medium capitalize">{signal.bias}</div>
          </div>
        </div>

        {/* Trading Action Details */}
        {isActionable && action.entry && action.target && action.stopLoss && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="font-semibold text-sm uppercase tracking-wide">
              Recommended Action
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {/* Entry */}
              <div>
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>Entry ({action.entry.type})</span>
                </div>
                <div className="font-bold text-base">
                  ${action.entry.price.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Range: ${action.entry.range.low.toFixed(2)} - $
                  {action.entry.range.high.toFixed(2)}
                </div>
              </div>

              {/* Targets */}
              <div>
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <Target className="h-3 w-3" />
                  <span>Targets</span>
                </div>
                <div className="font-bold text-base text-green-600 dark:text-green-400">
                  ${action.target.primary.toFixed(2)}
                  {action.target.secondary && (
                    <span className="text-sm font-normal text-muted-foreground">
                      {' '}
                      / ${action.target.secondary.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {action.riskReward && `R/R: ${action.riskReward.toFixed(1)}:1`}
                </div>
              </div>

              {/* Stop Loss */}
              <div>
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <Shield className="h-3 w-3" />
                  <span>Stop Loss</span>
                </div>
                <div className="font-bold text-base text-red-600 dark:text-red-400">
                  ${action.stopLoss.price.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {action.stopLoss.rationale}
                </div>
              </div>
            </div>

            {action.target.rationale && (
              <div className="text-xs text-muted-foreground pt-2 border-t">
                {action.target.rationale}
              </div>
            )}
          </div>
        )}

        {/* Reasoning */}
        {action.reasoning.length > 0 && (
          <div className="space-y-1">
            {action.reasoning.map((reason, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        )}

        {/* Cautions */}
        {action.cautions.length > 0 && (
          <div className="space-y-1">
            {action.cautions.map((caution, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm text-orange-600 dark:text-orange-400">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{caution}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
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
        symbol={watchlistItem.symbol}
        isOpen={isChartOpen}
        onClose={() => setIsChartOpen(false)}
        companyName={watchlistItem.display_name || undefined}
        currentPrice={quote.price}
        changePercent={quote.changePercent}
      />
    </Card>
  );
}
