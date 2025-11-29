'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Loader2,
  DollarSign,
  Target,
  Shield,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Position {
  symbol: string;
  qty: number;
  side: 'long' | 'short';
  avg_entry_price: number;
  current_price: number;
  market_value: number;
  cost_basis: number;
  unrealized_pl: number;
  unrealized_plpc: number;
  asset_id: string;
}

interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
  filled_qty: number;
  type: string;
  status: string;
  limit_price?: number;
  filled_avg_price?: number;
  created_at: string;
  filled_at?: string;
}

interface AccountInfo {
  equity: number;
  cash: number;
  buying_power: number;
  portfolio_value: number;
  long_market_value: number;
  short_market_value: number;
}

export default function PaperTradingPositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch account info, positions, and orders in parallel
      const [accountRes, positionsRes, ordersRes] = await Promise.all([
        fetch('/api/paper-trading/account'),
        fetch('/api/paper-trading/positions'),
        fetch('/api/paper-trading/orders?status=filled&limit=20'),
      ]);

      if (!accountRes.ok || !positionsRes.ok || !ordersRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [accountData, positionsData, ordersData] = await Promise.all([
        accountRes.json(),
        positionsRes.json(),
        ordersRes.json(),
      ]);

      setAccountInfo(accountData);
      setPositions(positionsData.positions || []);
      setOrders(ordersData.orders || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(message);
      toast({
        title: '❌ Error Loading Data',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClosePosition = async (symbol: string) => {
    try {
      const response = await fetch('/api/paper-trading/close-position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      });

      if (!response.ok) {
        throw new Error('Failed to close position');
      }

      toast({
        title: '✅ Position Closed',
        description: `Market order placed to close ${symbol}`,
      });

      // Refresh data
      fetchData();
    } catch (err) {
      toast({
        title: '❌ Failed to Close Position',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const totalPL = positions.reduce((sum, pos) => sum + pos.unrealized_pl, 0);
  const totalPLPercent = accountInfo
    ? (totalPL / accountInfo.portfolio_value) * 100
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paper Trading Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track positions, orders, and performance
          </p>
        </div>
        <Button onClick={fetchData} disabled={loading} size="lg">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/10">
          <CardContent className="pt-6 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="font-medium text-red-900 dark:text-red-200">Error</p>
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Summary */}
      {accountInfo && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Portfolio Value</CardDescription>
              <CardTitle className="text-2xl">
                ${accountInfo.portfolio_value.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Cash</CardDescription>
              <CardTitle className="text-2xl">
                ${accountInfo.cash.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Buying Power</CardDescription>
              <CardTitle className="text-2xl">
                ${accountInfo.buying_power.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className={totalPL >= 0 ? 'border-green-200' : 'border-red-200'}>
            <CardHeader className="pb-2">
              <CardDescription>Total P/L</CardDescription>
              <CardTitle
                className={`text-2xl ${
                  totalPL >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {totalPL >= 0 ? '+' : ''}${totalPL.toFixed(2)}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {totalPLPercent >= 0 ? '+' : ''}
                {totalPLPercent.toFixed(2)}%
              </p>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="positions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="positions">
            <Activity className="h-4 w-4 mr-2" />
            Open Positions ({positions.length})
          </TabsTrigger>
          <TabsTrigger value="orders">
            <Target className="h-4 w-4 mr-2" />
            Order History
          </TabsTrigger>
        </TabsList>

        {/* Positions Tab */}
        <TabsContent value="positions" className="space-y-4">
          {positions.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <Activity className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No Open Positions</p>
                <p className="text-sm mt-1">
                  Place paper trades from recommendations to see them here
                </p>
              </CardContent>
            </Card>
          ) : (
            positions.map((position) => (
              <Card key={position.symbol}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">{position.symbol}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          className={
                            position.side === 'long'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }
                        >
                          {position.side === 'long' ? (
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
                        <Badge variant="outline">{position.qty} shares</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-2xl font-bold ${
                          position.unrealized_pl >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {position.unrealized_pl >= 0 ? '+' : ''}$
                        {position.unrealized_pl.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {position.unrealized_plpc >= 0 ? '+' : ''}
                        {position.unrealized_plpc.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Price Info */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground mb-1">Avg Entry</div>
                      <div className="font-bold">${position.avg_entry_price.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Current Price</div>
                      <div className="font-bold">${position.current_price.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Market Value</div>
                      <div className="font-bold">${position.market_value.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleClosePosition(position.symbol)}
                      className="flex-1"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Close Position (Market Order)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          {orders.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <Target className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No Order History</p>
                <p className="text-sm mt-1">Filled orders will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="font-bold text-lg">{order.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString()} at{' '}
                            {new Date(order.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                        <Badge
                          className={
                            order.side === 'buy'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {order.side.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{order.type.toUpperCase()}</Badge>
                        <Badge
                          variant={order.status === 'filled' ? 'default' : 'secondary'}
                        >
                          {order.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {order.filled_qty || order.qty} shares
                        </div>
                        {order.filled_avg_price && (
                          <div className="text-sm text-muted-foreground">
                            @ ${order.filled_avg_price.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
