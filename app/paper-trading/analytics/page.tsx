'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, TrendingUp, Target, DollarSign, Percent } from 'lucide-react';
import { PaperTrade, PerformanceMetrics } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

interface AggregatedMetrics {
  total_trades: number;
  total_closed: number;
  win_rate: number;
  avg_r_multiple: number;
  avg_predicted_r: number;
  total_pnl: number;
  best_trade: number;
  worst_trade: number;
}

interface SetupPerformance {
  setup_type: string;
  total_trades: number;
  win_rate: number;
  avg_r: number;
  total_pnl: number;
}

interface PatternPerformance {
  pattern: string;
  total_trades: number;
  win_rate: number;
  avg_r: number;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [allTrades, setAllTrades] = useState<PaperTrade[]>([]);
  const [metrics, setMetrics] = useState<AggregatedMetrics | null>(null);
  const [setupPerformance, setSetupPerformance] = useState<SetupPerformance[]>([]);
  const [patternPerformance, setPatternPerformance] = useState<PatternPerformance[]>([]);
  const [longVsShort, setLongVsShort] = useState<{ long: any; short: any } | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    setIsLoading(true);

    try {
      const supabase = createClient();

      // Fetch all closed trades for this user
      const { data: trades, error } = await supabase
        .from('paper_trades')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'closed')
        .order('closed_at', { ascending: false });

      if (error) throw error;

      setAllTrades(trades || []);

      // Calculate aggregated metrics
      if (trades && trades.length > 0) {
        const wins = trades.filter(t => (t.realized_pnl || 0) > 0).length;
        const totalClosed = trades.length;
        const winRate = (wins / totalClosed) * 100;

        const totalPnl = trades.reduce((sum, t) => sum + (t.realized_pnl || 0), 0);
        const avgRMultiple = trades.reduce((sum, t) => sum + (t.realized_r_multiple || 0), 0) / totalClosed;
        const avgPredictedR = trades.reduce((sum, t) => sum + t.predicted_r_multiple, 0) / totalClosed;

        const pnls = trades.map(t => t.realized_pnl || 0);
        const bestTrade = Math.max(...pnls);
        const worstTrade = Math.min(...pnls);

        setMetrics({
          total_trades: totalClosed,
          total_closed: totalClosed,
          win_rate: winRate,
          avg_r_multiple: avgRMultiple,
          avg_predicted_r: avgPredictedR,
          total_pnl: totalPnl,
          best_trade: bestTrade,
          worst_trade: worstTrade,
        });

        // Calculate performance by setup type
        const setupMap: Record<string, PaperTrade[]> = {};
        trades.forEach(t => {
          const setup = t.setup_type || 'Unknown';
          if (!setupMap[setup]) setupMap[setup] = [];
          setupMap[setup].push(t);
        });

        const setupStats: SetupPerformance[] = Object.entries(setupMap).map(([setup, trades]) => {
          const wins = trades.filter(t => (t.realized_pnl || 0) > 0).length;
          const winRate = (wins / trades.length) * 100;
          const avgR = trades.reduce((sum, t) => sum + (t.realized_r_multiple || 0), 0) / trades.length;
          const totalPnl = trades.reduce((sum, t) => sum + (t.realized_pnl || 0), 0);

          return {
            setup_type: setup,
            total_trades: trades.length,
            win_rate: winRate,
            avg_r: avgR,
            total_pnl: totalPnl,
          };
        });

        setSetupPerformance(setupStats.sort((a, b) => b.win_rate - a.win_rate));

        // Calculate performance by pattern
        const patternMap: Record<string, PaperTrade[]> = {};
        trades.forEach(t => {
          const pattern = t.candlestick_pattern || 'None';
          if (!patternMap[pattern]) patternMap[pattern] = [];
          patternMap[pattern].push(t);
        });

        const patternStats: PatternPerformance[] = Object.entries(patternMap).map(([pattern, trades]) => {
          const wins = trades.filter(t => (t.realized_pnl || 0) > 0).length;
          const winRate = (wins / trades.length) * 100;
          const avgR = trades.reduce((sum, t) => sum + (t.realized_r_multiple || 0), 0) / trades.length;

          return {
            pattern,
            total_trades: trades.length,
            win_rate: winRate,
            avg_r: avgR,
          };
        });

        setPatternPerformance(patternStats.sort((a, b) => b.win_rate - a.win_rate));

        // Calculate Long vs Short performance
        const longTrades = trades.filter(t => t.recommendation_type === 'long');
        const shortTrades = trades.filter(t => t.recommendation_type === 'short');

        if (longTrades.length > 0 || shortTrades.length > 0) {
          const longWins = longTrades.filter(t => (t.realized_pnl || 0) > 0).length;
          const shortWins = shortTrades.filter(t => (t.realized_pnl || 0) > 0).length;

          setLongVsShort({
            long: {
              total: longTrades.length,
              winRate: longTrades.length > 0 ? (longWins / longTrades.length) * 100 : 0,
              avgR: longTrades.length > 0
                ? longTrades.reduce((sum, t) => sum + (t.realized_r_multiple || 0), 0) / longTrades.length
                : 0,
              totalPnl: longTrades.reduce((sum, t) => sum + (t.realized_pnl || 0), 0),
            },
            short: {
              total: shortTrades.length,
              winRate: shortTrades.length > 0 ? (shortWins / shortTrades.length) * 100 : 0,
              avgR: shortTrades.length > 0
                ? shortTrades.reduce((sum, t) => sum + (t.realized_r_multiple || 0), 0) / shortTrades.length
                : 0,
              totalPnl: shortTrades.reduce((sum, t) => sum + (t.realized_pnl || 0), 0),
            },
          });
        }
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Please log in to view analytics.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Performance Analytics</h1>
        <p className="text-slate-500">Loading analytics...</p>
      </div>
    );
  }

  if (!metrics || metrics.total_closed === 0) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Performance Analytics</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Closed Trades Yet</h3>
              <p className="text-slate-500 mb-6">
                Complete some paper trades to see your performance analytics.
              </p>
              <p className="text-sm text-slate-400">
                Analytics will show win rates, R:R multiples, and performance by setup type and pattern.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Performance Analytics</h1>
        <p className="text-slate-500">Track your paper trading performance and validate the scanner</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Total Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.total_closed}</div>
            <p className="text-sm text-slate-500 mt-1">Closed positions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold">{metrics.win_rate.toFixed(1)}%</div>
              <Percent className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500 mt-1">Winning trades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Avg R:R</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold">{metrics.avg_r_multiple.toFixed(2)}R</div>
              {metrics.avg_r_multiple >= metrics.avg_predicted_r ? (
                <ArrowUp className="h-5 w-5 text-emerald-500" />
              ) : (
                <ArrowDown className="h-5 w-5 text-red-500" />
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              vs {metrics.avg_predicted_r.toFixed(2)}R predicted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Total P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className={`text-3xl font-bold ${metrics.total_pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                ${metrics.total_pnl.toFixed(2)}
              </div>
              <DollarSign className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500 mt-1">Paper profit/loss</p>
          </CardContent>
        </Card>
      </div>

      {/* Long vs Short Performance */}
      {longVsShort && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Performance by Direction</CardTitle>
            <CardDescription>Compare long vs short trade performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Long Trades</h3>
                  <Badge variant="outline" className="bg-emerald-50">
                    {longVsShort.long.total} trades
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Win Rate:</span>
                    <span className="font-medium">{longVsShort.long.winRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Avg R:R:</span>
                    <span className="font-medium">{longVsShort.long.avgR.toFixed(2)}R</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total P&L:</span>
                    <span className={`font-medium ${longVsShort.long.totalPnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      ${longVsShort.long.totalPnl.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Short Trades</h3>
                  <Badge variant="outline" className="bg-red-50">
                    {longVsShort.short.total} trades
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Win Rate:</span>
                    <span className="font-medium">{longVsShort.short.winRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Avg R:R:</span>
                    <span className="font-medium">{longVsShort.short.avgR.toFixed(2)}R</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total P&L:</span>
                    <span className={`font-medium ${longVsShort.short.totalPnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      ${longVsShort.short.totalPnl.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance by Setup Type */}
      {setupPerformance.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Performance by Setup Type</CardTitle>
            <CardDescription>Which trade setups perform best?</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Setup Type</TableHead>
                  <TableHead className="text-right">Trades</TableHead>
                  <TableHead className="text-right">Win Rate</TableHead>
                  <TableHead className="text-right">Avg R:R</TableHead>
                  <TableHead className="text-right">Total P&L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {setupPerformance.map((setup) => (
                  <TableRow key={setup.setup_type}>
                    <TableCell className="font-medium">{setup.setup_type}</TableCell>
                    <TableCell className="text-right">{setup.total_trades}</TableCell>
                    <TableCell className="text-right">
                      <span className={setup.win_rate >= 50 ? 'text-emerald-600 font-medium' : ''}>
                        {setup.win_rate.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{setup.avg_r.toFixed(2)}R</TableCell>
                    <TableCell className={`text-right font-medium ${setup.total_pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      ${setup.total_pnl.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Performance by Pattern */}
      {patternPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance by Candlestick Pattern</CardTitle>
            <CardDescription>Which patterns are most reliable?</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pattern</TableHead>
                  <TableHead className="text-right">Trades</TableHead>
                  <TableHead className="text-right">Win Rate</TableHead>
                  <TableHead className="text-right">Avg R:R</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patternPerformance.map((pattern) => (
                  <TableRow key={pattern.pattern}>
                    <TableCell className="font-medium">{pattern.pattern}</TableCell>
                    <TableCell className="text-right">{pattern.total_trades}</TableCell>
                    <TableCell className="text-right">
                      <span className={pattern.win_rate >= 50 ? 'text-emerald-600 font-medium' : ''}>
                        {pattern.win_rate.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{pattern.avg_r.toFixed(2)}R</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
