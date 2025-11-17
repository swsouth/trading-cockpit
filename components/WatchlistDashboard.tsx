'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getQuote } from '@/lib/marketData';
import { getCryptoQuote } from '@/lib/cryptoData';
import { WatchlistItem, Quote, CombinedSignalRecord } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, TrendingUp, TrendingDown, Bitcoin, TrendingUpIcon } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/AuthContext';
import { formatDistanceToNow } from 'date-fns';

type FilterType = 'all' | 'stocks' | 'crypto';

export function WatchlistDashboard() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [signals, setSignals] = useState<Record<string, CombinedSignalRecord>>({});
  const [newSymbol, setNewSymbol] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newAssetType, setNewAssetType] = useState<'stock' | 'crypto'>('stock');
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadWatchlist();
    }
  }, [user]);

  useEffect(() => {
    if (watchlist.length > 0) {
      loadQuotesAndSignals();
    }
  }, [watchlist]);

  async function loadWatchlist() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('watchlist_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase request failed', error);
        throw error;
      }
      setWatchlist(data || []);
    } catch (error) {
      console.error('Error loading watchlist:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadQuotesAndSignals() {
    const quotesMap: Record<string, Quote> = {};
    const signalsMap: Record<string, CombinedSignalRecord> = {};

    for (const item of watchlist) {
      try {
        // Route to appropriate API based on asset type
        const quote = item.asset_type === 'crypto'
          ? await getCryptoQuote(item.symbol)
          : await getQuote(item.symbol);
        quotesMap[item.symbol] = quote;

        // Only load signals for stocks (crypto doesn't have channel/pattern analysis yet)
        if (item.asset_type === 'stock') {
          const { data: signalData } = await supabase
            .from('combined_signals')
            .select('*')
            .eq('symbol', item.symbol)
            .order('detected_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (signalData) {
            signalsMap[item.symbol] = signalData;
          }
        }
      } catch (error) {
        console.error(`Error loading data for ${item.symbol}:`, error);
      }
    }

    setQuotes(quotesMap);
    setSignals(signalsMap);
  }

  async function addToWatchlist() {
    if (!newSymbol.trim() || !user) return;

    try {
      const { data, error} = await supabase
        .from('watchlist_items')
        .insert({
          user_id: user.id,
          symbol: newSymbol.toUpperCase(),
          display_name: newDisplayName || null,
          asset_type: newAssetType,
        })
        .select()
        .single();

      if (error) throw error;

      setWatchlist([data, ...watchlist]);
      setNewSymbol('');
      setNewDisplayName('');
      setNewAssetType('stock'); // Reset to default
      toast({
        title: 'Added to watchlist',
        description: `${data.symbol} has been added to your watchlist.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  async function removeFromWatchlist(id: string) {
    try {
      const { error } = await supabase
        .from('watchlist_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setWatchlist(watchlist.filter((item) => item.id !== id));
      toast({
        title: 'Removed from watchlist',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-slate-600">Loading...</div>
      </div>
    );
  }


  // Filter watchlist based on selected filter
  const filteredWatchlist = watchlist.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'stocks') return item.asset_type === 'stock';
    if (filter === 'crypto') return item.asset_type === 'crypto';
    return true;
  });

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Watchlist Dashboard</h1>
          <p className="text-slate-600">Monitor your tracked symbols and market signals</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            All ({watchlist.length})
          </Button>
          <Button
            variant={filter === 'stocks' ? 'default' : 'outline'}
            onClick={() => setFilter('stocks')}
            className={filter === 'stocks' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            <TrendingUpIcon className="h-4 w-4 mr-2" />
            Stocks ({watchlist.filter(i => i.asset_type === 'stock').length})
          </Button>
          <Button
            variant={filter === 'crypto' ? 'default' : 'outline'}
            onClick={() => setFilter('crypto')}
            className={filter === 'crypto' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            <Bitcoin className="h-4 w-4 mr-2" />
            Crypto ({watchlist.filter(i => i.asset_type === 'crypto').length})
          </Button>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add Symbol</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              <Input
                placeholder="Symbol (e.g., AAPL or BTC)"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addToWatchlist()}
                className="max-w-xs"
              />
              <Input
                placeholder="Display name (optional)"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addToWatchlist()}
                className="max-w-xs"
              />
              <div className="flex gap-2">
                <Button
                  variant={newAssetType === 'stock' ? 'default' : 'outline'}
                  onClick={() => setNewAssetType('stock')}
                  size="sm"
                  className={newAssetType === 'stock' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                >
                  Stock
                </Button>
                <Button
                  variant={newAssetType === 'crypto' ? 'default' : 'outline'}
                  onClick={() => setNewAssetType('crypto')}
                  size="sm"
                  className={newAssetType === 'crypto' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                >
                  Crypto
                </Button>
              </div>
              <Button onClick={addToWatchlist}>
                <Plus className="h-4 w-4 mr-2" />
                Add to Watchlist
              </Button>
            </div>
          </CardContent>
        </Card>

        {filteredWatchlist.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-600">
                Your watchlist is empty. Add a symbol to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredWatchlist.map((item) => {
              const quote = quotes[item.symbol];
              const signal = signals[item.symbol];

              return (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Link
                            href={`/ticker/${item.symbol}`}
                            className="text-2xl font-bold text-slate-900 hover:text-emerald-600 transition-colors"
                          >
                            {item.symbol}
                          </Link>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              item.asset_type === 'crypto'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {item.asset_type === 'crypto' ? 'CRYPTO' : 'STOCK'}
                          </span>
                          {item.display_name && (
                            <span className="text-sm text-slate-500">{item.display_name}</span>
                          )}
                        </div>

                        {quote && (
                          <div className="flex items-center gap-4 mb-3">
                            <div className="text-3xl font-semibold text-slate-900">
                              ${quote.price.toFixed(2)}
                            </div>
                            <div
                              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                                quote.changePercent >= 0
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {quote.changePercent >= 0 ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : (
                                <TrendingDown className="h-4 w-4" />
                              )}
                              {quote.changePercent >= 0 ? '+' : ''}
                              {quote.changePercent.toFixed(2)}%
                            </div>
                            <span className="text-xs text-slate-500">
                              Updated {formatDistanceToNow(new Date(quote.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                        )}

                        {signal && (
                          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-slate-700">Latest Signal:</span>
                              <span
                                className={`px-2 py-1 rounded text-xs font-semibold ${
                                  signal.bias === 'bullish'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : signal.bias === 'bearish'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {signal.bias.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-sm text-slate-600">
                              Channel: <span className="font-medium">{signal.channel_status.replace('_', ' ')}</span>
                              {signal.main_pattern && signal.main_pattern !== 'none' && (
                                <>
                                  {' • '}
                                  Pattern: <span className="font-medium">{signal.main_pattern.replace('_', ' ')}</span>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromWatchlist(item.id)}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
