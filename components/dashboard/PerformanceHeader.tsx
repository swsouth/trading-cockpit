/**
 * Performance Header Component
 *
 * Displays key account metrics in a prominent hero section:
 * - Total P/L with percentage
 * - Win rate
 * - Number of open positions
 * - Today's P/L
 *
 * Visual hierarchy: Large numbers, green/red color coding, clear labels
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Target, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface PerformanceHeaderProps {
  totalPL: number;
  todaysPL: number;
  winRate: number;
  openPositions: number;
  accountValue?: number; // Optional: total account value
}

export function PerformanceHeader({
  totalPL,
  todaysPL,
  winRate,
  openPositions,
  accountValue = 100000, // Default paper trading account
}: PerformanceHeaderProps) {
  const totalPLPercentage = ((totalPL / accountValue) * 100).toFixed(2);
  const isPositivePL = totalPL >= 0;
  const isPositiveTodayPL = todaysPL >= 0;

  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Portfolio Performance
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Paper Trading Account
            </p>
          </div>
          <Link href="/paper-trading/analytics">
            <Button variant="outline" size="sm">
              View Full Analytics →
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Total P/L - PRIMARY METRIC */}
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2 mb-1">
              {isPositivePL ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
              <span className="text-xs font-medium text-muted-foreground uppercase">
                Total P/L
              </span>
            </div>
            <div className={`text-3xl font-bold ${isPositivePL ? 'text-green-600' : 'text-red-600'}`}>
              {isPositivePL ? '+' : ''}${totalPL.toFixed(2)}
            </div>
            <div className={`text-sm ${isPositivePL ? 'text-green-600' : 'text-red-600'}`}>
              {isPositivePL ? '+' : ''}{totalPLPercentage}%
            </div>
          </div>

          {/* Today's P/L */}
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase">
                Today
              </span>
            </div>
            <div className={`text-2xl font-semibold ${isPositiveTodayPL ? 'text-green-600' : 'text-red-600'}`}>
              {isPositiveTodayPL ? '+' : ''}${todaysPL.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Intraday P/L
            </div>
          </div>

          {/* Win Rate */}
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2 mb-1">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase">
                Win Rate
              </span>
            </div>
            <div className="text-2xl font-semibold">
              {winRate.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              <Badge
                variant={winRate >= 60 ? 'default' : winRate >= 50 ? 'secondary' : 'destructive'}
                className="text-xs"
              >
                {winRate >= 60 ? 'Excellent' : winRate >= 50 ? 'Good' : 'Needs Work'}
              </Badge>
            </div>
          </div>

          {/* Open Positions */}
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase">
                Open Positions
              </span>
            </div>
            <div className="text-2xl font-semibold">
              {openPositions}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              <Link href="/paper-trading/positions" className="text-primary hover:underline">
                Manage →
              </Link>
            </div>
          </div>
        </div>

        {/* Optional: Risk Meter */}
        {openPositions > 5 && (
          <div className="mt-4 pt-4 border-t">
            <Badge variant="secondary" className="text-xs">
              ⚠️ High exposure: {openPositions} open positions
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
