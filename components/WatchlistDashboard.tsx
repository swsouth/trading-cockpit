'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getQuote } from '@/lib/marketData';
import { WatchlistItem, Quote, CombinedSignalRecord } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/AuthContext';

export function WatchlistDashboard() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [signals, setSignals] = useState<Record<string, CombinedSignalRecord>>({});
  const [newSymbol, setNewSymbol] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
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
        const quote = await getQuote(item.symbol);
        quotesMap[item.symbol] = quote;

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
      const { data, error } = await supabase
        .from('watchlist_items')
        .insert({
          user_id: user.id,
          symbol: newSymbol.toUpperCase(),
          display_name: newDisplayName || null,
        })
        .select()
        .single();

      if (error) throw error;

      setWatchlist([data, ...watchlist]);
      setNewSymbol('');
      setNewDisplayName('');
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


  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Watchlist Dashboard</h1>
          <p className="text-slate-600">Monitor your tracked symbols and market signals</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add Symbol</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Symbol (e.g., AAPL)"
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
              <Button onClick={addToWatchlist}>
                <Plus className="h-4 w-4 mr-2" />
                Add to Watchlist
              </Button>
            </div>
          </CardContent>
        </Card>

        {watchlist.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-600">
                Your watchlist is empty. Add a symbol to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {watchlist.map((item) => {
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
