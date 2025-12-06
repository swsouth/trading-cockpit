/**
 * Compact Watchlist Component
 *
 * Horizontal ticker-style display of watchlist symbols
 * Deprioritized visual weight (tertiary section)
 */

'use client';

import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, Search } from 'lucide-react';
import Link from 'next/link';

interface WatchlistSymbol {
  symbol: string;
  currentPrice?: number;
  change?: number;
  changePercent?: number;
}

interface CompactWatchlistProps {
  symbols: WatchlistSymbol[];
  onAddSymbol?: () => void;
  onScan?: () => void;
}

export function CompactWatchlist({
  symbols,
  onAddSymbol,
  onScan,
}: CompactWatchlistProps) {
  if (symbols.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Watchlist</CardTitle>
            <Button variant="outline" size="sm" onClick={onAddSymbol}>
              <Plus className="w-4 h-4 mr-1" />
              Add Symbol
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Search className="w-10 h-10 mx-auto text-muted-foreground opacity-50 mb-2" />
            <p className="text-sm text-muted-foreground">
              No symbols in watchlist
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Watchlist</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onAddSymbol}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
            <Link href="/scanner">
              <Button variant="default" size="sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                Scan
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Horizontal scroll ticker */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {symbols.map((item) => {
            const isPositive = (item.change || 0) >= 0;

            return (
              <div
                key={item.symbol}
                className="flex-shrink-0 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer min-w-[140px]"
              >
                <div className="font-semibold text-sm mb-1">{item.symbol}</div>
                {item.currentPrice ? (
                  <>
                    <div className="text-lg font-bold">
                      ${item.currentPrice.toFixed(2)}
                    </div>
                    <div className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? '▲' : '▼'} {Math.abs(item.changePercent || 0).toFixed(2)}%
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    Price unavailable
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Scroll hint for many symbols */}
        {symbols.length > 5 && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Scroll for more symbols →
          </p>
        )}
      </CardContent>
    </Card>
  );
}
