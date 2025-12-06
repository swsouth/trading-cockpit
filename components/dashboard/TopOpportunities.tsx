/**
 * Top Opportunities Component
 *
 * Displays top 3 highest-scoring trade recommendations in compact format
 * Minimal information hierarchy: Symbol, Score, Direction, Price levels
 */

'use client';

import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface Recommendation {
  id: string;
  symbol: string;
  recommendation_type: 'long' | 'short';
  opportunity_score: number;
  confidence_level: 'high' | 'medium' | 'low';
  entry_price: number;
  target_price: number;
  stop_loss: number;
  risk_reward_ratio: number;
}

interface TopOpportunitiesProps {
  recommendations: Recommendation[];
  onViewAll?: () => void;
}

export function TopOpportunities({ recommendations, onViewAll }: TopOpportunitiesProps) {
  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Top Opportunities</CardTitle>
            <Badge variant="secondary">0 Active</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              No active recommendations
            </p>
            <Link href="/scanner">
              <Button variant="outline" size="sm">
                Run Scanner
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
          <CardTitle className="text-lg">Top Opportunities</CardTitle>
          <Badge variant="default">{recommendations.length} High-Confidence</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec) => {
          const isLong = rec.recommendation_type === 'long';
          const targetPercent = ((rec.target_price - rec.entry_price) / rec.entry_price) * 100;
          const stopPercent = ((rec.stop_loss - rec.entry_price) / rec.entry_price) * 100;

          return (
            <div
              key={rec.id}
              className="p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
            >
              {/* Header: Symbol + Score + Direction */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold">{rec.symbol}</h3>
                  <Badge
                    variant={isLong ? 'default' : 'destructive'}
                    className="flex items-center gap-1"
                  >
                    {isLong ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {rec.recommendation_type.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex flex-col items-end">
                  <Badge
                    variant={
                      rec.opportunity_score >= 80
                        ? 'default'
                        : rec.opportunity_score >= 70
                        ? 'secondary'
                        : 'outline'
                    }
                    className="text-lg px-3 py-1"
                  >
                    {rec.opportunity_score}
                  </Badge>
                  <span className="text-xs text-muted-foreground mt-1">
                    {rec.confidence_level.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Price Levels Grid - Compact */}
              <div className="grid grid-cols-4 gap-2 text-sm mb-3">
                <div>
                  <div className="text-xs text-muted-foreground">Entry</div>
                  <div className="font-semibold">${rec.entry_price.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Target</div>
                  <div className="font-semibold text-green-600">
                    ${rec.target_price.toFixed(2)}
                  </div>
                  <div className="text-xs text-green-600">
                    {isLong ? '+' : '-'}{Math.abs(targetPercent).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Stop</div>
                  <div className="font-semibold text-red-600">
                    ${rec.stop_loss.toFixed(2)}
                  </div>
                  <div className="text-xs text-red-600">
                    {Math.abs(stopPercent).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">R:R</div>
                  <div className="font-semibold">{rec.risk_reward_ratio.toFixed(1)}:1</div>
                </div>
              </div>

              {/* Action Buttons - Compact */}
              <div className="flex gap-2">
                <Link href={`/recommendations?symbol=${rec.symbol}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    Details
                  </Button>
                </Link>
                <Button size="sm" className="flex-1">
                  Paper Trade
                </Button>
              </div>
            </div>
          );
        })}

        {/* View All Link */}
        <div className="pt-2">
          <Link href="/recommendations">
            <Button variant="ghost" size="sm" className="w-full">
              View All Recommendations →
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
