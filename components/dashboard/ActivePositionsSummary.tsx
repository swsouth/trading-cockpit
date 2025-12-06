/**
 * Active Positions Summary Component
 *
 * Displays up to 3 most recent open positions with P/L emphasis
 * Quick access to position management
 */

'use client';

import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, X } from 'lucide-react';
import Link from 'next/link';

interface Position {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  quantity: number;
  entry_price: number;
  current_price: number;
  created_at: string;
}

interface ActivePositionsSummaryProps {
  positions: Position[];
  onManageAll?: () => void;
  onClosePosition?: (positionId: string) => void;
}

export function ActivePositionsSummary({
  positions,
  onManageAll,
  onClosePosition,
}: ActivePositionsSummaryProps) {
  if (positions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Active Positions</CardTitle>
            <Badge variant="secondary">0 Open</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
              <TrendingUp className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              No open positions
            </p>
            <Link href="/recommendations">
              <Button variant="outline" size="sm">
                Find Opportunities
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Active Positions</CardTitle>
          <Badge variant="default">{positions.length} Open</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {positions.map((position) => {
          const isLong = position.side === 'long';
          const unrealizedPL = isLong
            ? (position.current_price - position.entry_price) * position.quantity
            : (position.entry_price - position.current_price) * position.quantity;
          const unrealizedPLPercent =
            ((unrealizedPL / (position.entry_price * position.quantity)) * 100);
          const isProfit = unrealizedPL > 0;

          return (
            <div
              key={position.id}
              className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              {/* Header: Symbol + Side + P/L */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold">{position.symbol}</h3>
                  <Badge
                    variant={isLong ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {position.side.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {position.quantity} shares
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <div className={`text-lg font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                    {isProfit ? '+' : ''}${unrealizedPL.toFixed(2)}
                  </div>
                  <div className={`text-xs ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                    {isProfit ? '+' : ''}{unrealizedPLPercent.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Price Details */}
              <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                <div>
                  <div className="text-xs text-muted-foreground">Entry</div>
                  <div className="font-semibold">${position.entry_price.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Current</div>
                  <div className="font-semibold">${position.current_price.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Change</div>
                  <div className={`font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                    {isProfit ? '▲' : '▼'} {Math.abs(position.current_price - position.entry_price).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Link href={`/paper-trading/positions?symbol=${position.symbol}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    Details
                  </Button>
                </Link>
                {onClosePosition && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => onClosePosition(position.id)}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Close
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {/* Manage All Link */}
        <div className="pt-2">
          <Link href="/paper-trading/positions">
            <Button variant="ghost" size="sm" className="w-full">
              Manage All Positions →
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
