'use client';

import { TradeRecommendation } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, Shield, DollarSign, AlertTriangle } from 'lucide-react';

interface PaperTradeConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommendation: TradeRecommendation;
  shares: number;
  costBasis: number;
  dollarRisk: number;
  riskPercent: number;
  currentPrice?: number;
  priceDeviation?: number;
  marketWarning?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PaperTradeConfirmDialog({
  open,
  onOpenChange,
  recommendation,
  shares,
  costBasis,
  dollarRisk,
  riskPercent,
  currentPrice,
  priceDeviation,
  marketWarning,
  onConfirm,
  onCancel,
}: PaperTradeConfirmDialogProps) {
  const {
    symbol,
    recommendation_type,
    entry_price,
    stop_loss,
    target_price,
    risk_reward_ratio,
  } = recommendation;

  const potentialGain = shares * Math.abs(target_price - entry_price);
  const hasWarnings = !!marketWarning || (priceDeviation && priceDeviation > 2);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Confirm Paper Trade
          </AlertDialogTitle>
          <AlertDialogDescription>
            Review trade details before placing order
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Symbol & Direction */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{symbol}</span>
              <Badge className={
                recommendation_type === 'long'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }>
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
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{shares}</div>
              <div className="text-xs text-muted-foreground">shares</div>
            </div>
          </div>

          {/* Warnings */}
          {hasWarnings && (
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="text-sm space-y-1">
                  {marketWarning && (
                    <p className="text-yellow-800 dark:text-yellow-300">{marketWarning}</p>
                  )}
                  {currentPrice && priceDeviation && priceDeviation > 2 && (
                    <p className="text-yellow-800 dark:text-yellow-300">
                      Current price: ${currentPrice.toFixed(2)} ({priceDeviation > 0 ? '+' : ''}{priceDeviation.toFixed(1)}% from scanner)
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Price Levels */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground mb-1">Entry Price</div>
                <div className="font-bold text-lg">${entry_price.toFixed(2)}</div>
                {currentPrice && (
                  <div className="text-xs text-muted-foreground">
                    Current: ${currentPrice.toFixed(2)}
                  </div>
                )}
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Shares</div>
                <div className="font-bold text-lg">{shares}</div>
                <div className="text-xs text-muted-foreground">
                  @ ${entry_price.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <Target className="h-3 w-3" />
                  <span>Target</span>
                </div>
                <div className="font-bold text-green-600 dark:text-green-400">
                  ${target_price.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <Shield className="h-3 w-3" />
                  <span>Stop Loss</span>
                </div>
                <div className="font-bold text-red-600 dark:text-red-400">
                  ${stop_loss.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Risk/Reward Summary */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground mb-1">Cost Basis</div>
              <div className="font-bold">${costBasis.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Dollar Risk</div>
              <div className="font-bold text-red-600 dark:text-red-400">
                ${dollarRisk.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">
                {riskPercent}% of account
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Potential Gain</div>
              <div className="font-bold text-green-600 dark:text-green-400">
                ${potentialGain.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Risk/Reward</div>
              <div className="font-bold text-blue-600 dark:text-blue-400">
                {risk_reward_ratio.toFixed(2)}:1
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2">
            <div className="font-medium mb-1">Order Details:</div>
            <div>Type: Limit order @ ${entry_price.toFixed(2)}</div>
            <div>Time in Force: Day order</div>
            <div>Account: Paper Trading ($100,000)</div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Place Paper Trade
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
