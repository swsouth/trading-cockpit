'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { getDailyOHLC, getQuote } from '@/lib/marketData';
import { getCryptoQuote, getCryptoOHLC } from '@/lib/cryptoData';
import { detectChannel, detectPatterns, computeCombinedSignal } from '@/lib/analysis';
import {
  Candle,
  Quote,
  ChannelDetectionResult,
  PatternDetectionResult,
  CombinedSignal,
  TickerNote,
  Upload,
  PriceAlert,
} from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CandlestickChart } from '@/components/CandlestickChart';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, Bell, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface TickerDetailProps {
  symbol: string;
}

// Helper function to classify pattern significance
function getPatternSignificance(pattern: string): {
  type: 'reversal' | 'continuation' | 'indecision';
  description: string;
  color: string;
} {
  switch (pattern) {
    case 'bullish_engulfing':
      return {
        type: 'reversal',
        description: 'Bullish reversal - potential upward trend change',
        color: 'bg-emerald-100 text-emerald-700',
      };
    case 'bearish_engulfing':
      return {
        type: 'reversal',
        description: 'Bearish reversal - potential downward trend change',
        color: 'bg-red-100 text-red-700',
      };
    case 'hammer':
      return {
        type: 'reversal',
        description: 'Bullish reversal - potential bottom formation',
        color: 'bg-emerald-100 text-emerald-700',
      };
    case 'shooting_star':
      return {
        type: 'reversal',
        description: 'Bearish reversal - potential top formation',
        color: 'bg-red-100 text-red-700',
      };
    case 'piercing_line':
      return {
        type: 'reversal',
        description: 'Bullish reversal - potential upward momentum',
        color: 'bg-emerald-100 text-emerald-700',
      };
    case 'dark_cloud_cover':
      return {
        type: 'reversal',
        description: 'Bearish reversal - potential downward momentum',
        color: 'bg-red-100 text-red-700',
      };
    case 'doji':
      return {
        type: 'indecision',
        description: 'Indecision - balance between buyers and sellers',
        color: 'bg-amber-100 text-amber-700',
      };
    default:
      return {
        type: 'indecision',
        description: 'No pattern detected',
        color: 'bg-slate-100 text-slate-700',
      };
  }
}

export function TickerDetail({ symbol }: TickerDetailProps) {
  const { user } = useAuth();
  const [assetType, setAssetType] = useState<'stock' | 'crypto'>('stock');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [channel, setChannel] = useState<ChannelDetectionResult | null>(null);
  const [pattern, setPattern] = useState<PatternDetectionResult | null>(null);
  const [signal, setSignal] = useState<CombinedSignal | null>(null);
  const [notes, setNotes] = useState<TickerNote[]>([]);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteBody, setNewNoteBody] = useState('');
  const [newNoteTimeframe, setNewNoteTimeframe] = useState('');

  const [newAlertPrice, setNewAlertPrice] = useState('');
  const [newAlertDirection, setNewAlertDirection] = useState<'above' | 'below'>('above');

  const { toast } = useToast();

  async function loadNotes() {
    const { data } = await supabase
      .from('ticker_notes')
      .select('*')
      .eq('symbol', symbol)
      .order('created_at', { ascending: false });

    setNotes(data || []);
  }

  async function loadUploads() {
    const { data } = await supabase
      .from('research_uploads')
      .select('*')
      .eq('symbol', symbol)
      .order('uploaded_at', { ascending: false });

    setUploads(data || []);
  }

  async function loadAlerts() {
    if (!user) return;
    const { data } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('user_id', user.id)
      .eq('symbol', symbol)
      .order('created_at', { ascending: false });

    setAlerts(data || []);
  }

  const loadTickerData = useCallback(async () => {
    if (!user) return;

    try {
      // First, check if this symbol is in the watchlist to get asset type
      const { data: watchlistItem } = await supabase
        .from('watchlist_items')
        .select('asset_type')
        .eq('user_id', user.id)
        .eq('symbol', symbol)
        .maybeSingle();

      const itemAssetType = watchlistItem?.asset_type || 'stock';
      setAssetType(itemAssetType);

      // Route to appropriate API based on asset type
      const [candlesData, quoteData] = await Promise.all([
        itemAssetType === 'crypto' ? getCryptoOHLC(symbol) : getDailyOHLC(symbol),
        itemAssetType === 'crypto' ? getCryptoQuote(symbol) : getQuote(symbol),
      ]);

      setCandles(candlesData);
      setQuote(quoteData);

      // Run channel/pattern analysis for all asset types
      const channelResult = detectChannel(candlesData);
      const patternResult = detectPatterns(candlesData);
      const signalResult = computeCombinedSignal(channelResult, patternResult, candlesData);

      setChannel(channelResult);
      setPattern(patternResult);
      setSignal(signalResult);

      if (channelResult.hasChannel) {
        const { error: upsertError } = await supabase.from('combined_signals').upsert({
          user_id: user.id,
          symbol,
          timeframe: '1d',
          detected_at: new Date().toISOString().split('T')[0],
          bias: signalResult.bias,
          channel_status: channelResult.status,
          main_pattern: patternResult.mainPattern,
          notes: signalResult.notes,
          cautions: signalResult.cautions,
        });

        if (upsertError) {
          console.error('Failed to save signal:', upsertError);
          toast({
            title: 'Warning',
            description: 'Failed to save analysis signal to database',
            variant: 'destructive',
          });
        }
      }

      await Promise.all([
        loadNotes(),
        loadUploads(),
        loadAlerts(),
      ]);

      // Set last updated timestamp
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading ticker data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load ticker data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [symbol, user, toast]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTickerData();
    toast({
      title: 'Data refreshed',
      description: 'Market data has been updated',
    });
  };

  useEffect(() => {
    if (user) {
      loadTickerData();
    }
  }, [user, loadTickerData]);

  async function addNote() {
    if (!newNoteTitle.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('ticker_notes')
        .insert({
          user_id: user.id,
          symbol,
          title: newNoteTitle,
          body: newNoteBody,
          timeframe: newNoteTimeframe || null,
        })
        .select()
        .single();

      if (error) throw error;

      setNotes([data, ...notes]);
      setNewNoteTitle('');
      setNewNoteBody('');
      setNewNoteTimeframe('');

      toast({
        title: 'Note added',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  async function deleteNote(id: string) {
    try {
      const { error } = await supabase
        .from('ticker_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotes(notes.filter((n) => n.id !== id));
      toast({
        title: 'Note deleted',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  async function addAlert() {
    if (!newAlertPrice || !user) return;

    const price = parseFloat(newAlertPrice);
    if (isNaN(price) || price <= 0) {
      toast({
        title: 'Invalid price',
        description: 'Please enter a valid price',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .insert({
          user_id: user.id,
          symbol,
          target_price: price,
          direction: newAlertDirection,
        })
        .select()
        .single();

      if (error) throw error;

      setAlerts([data, ...alerts]);
      setNewAlertPrice('');

      toast({
        title: 'Alert created',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  async function deleteAlert(id: string) {
    try {
      const { error } = await supabase
        .from('price_alerts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAlerts(alerts.filter((a) => a.id !== id));
      toast({
        title: 'Alert deleted',
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
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-4">
              <h1 className="text-4xl font-bold text-slate-900">{symbol}</h1>
              {quote && (
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-semibold text-slate-900">
                    ${quote.price.toFixed(2)}
                  </span>
                  <span
                    className={`text-lg font-medium ${
                      quote.changePercent >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {quote.changePercent >= 0 ? '+' : ''}
                    {quote.changePercent.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="text-sm text-slate-500">
                  Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
                </span>
              )}
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Price Chart</CardTitle>
                  {lastUpdated && candles.length > 0 && (
                    <span className="text-xs text-slate-500 font-normal">
                      Last updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CandlestickChart candles={candles} channel={channel} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Input
                    placeholder="Note title"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                  />
                  <Textarea
                    placeholder="Note body"
                    value={newNoteBody}
                    onChange={(e) => setNewNoteBody(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-3">
                    <Select value={newNoteTimeframe} onValueChange={setNewNoteTimeframe}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="intraday">Intraday</SelectItem>
                        <SelectItem value="swing">Swing</SelectItem>
                        <SelectItem value="longterm">Long-term</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={addNote}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="border rounded-lg p-4 bg-slate-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900">{note.title}</h4>
                          {note.timeframe && (
                            <span className="text-xs text-slate-500 uppercase">{note.timeframe}</span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteNote(note.id)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {note.body && <p className="text-sm text-slate-600 whitespace-pre-wrap">{note.body}</p>}
                      <p className="text-xs text-slate-400 mt-2">
                        {new Date(note.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">No notes yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {uploads.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Related Research</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {uploads.map((upload) => (
                      <div key={upload.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{upload.filename}</p>
                          {upload.note && <p className="text-sm text-slate-600">{upload.note}</p>}
                          {upload.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {upload.tags.map((tag) => (
                                <span key={tag} className="text-xs px-2 py-1 bg-slate-200 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Channel Detection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {channel && channel.hasChannel ? (
                  <>
                    <div>
                      <p className="text-sm text-slate-600">Support</p>
                      <p className="text-lg font-semibold text-slate-900">${channel.support.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Resistance</p>
                      <p className="text-lg font-semibold text-slate-900">${channel.resistance.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Width</p>
                      <p className="text-lg font-semibold text-slate-900">{(channel.widthPct * 100).toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Status</p>
                      <p className="text-lg font-semibold text-slate-900 capitalize">
                        {channel.status.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="text-xs text-slate-500 pt-2 border-t">
                      <p>Support touches: {channel.supportTouches}</p>
                      <p>Resistance touches: {channel.resistanceTouches}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500 italic">
                    No channel detected
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pattern Detection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pattern && pattern.mainPattern !== 'none' ? (
                  <>
                    <div>
                      <p className="text-sm text-slate-600 mb-2">Detected Pattern</p>
                      <p className="text-lg font-semibold text-slate-900 capitalize">
                        {pattern.mainPattern.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-2">Significance</p>
                      <div className="space-y-2">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase ${getPatternSignificance(pattern.mainPattern).color}`}>
                          {getPatternSignificance(pattern.mainPattern).type}
                        </span>
                        <p className="text-sm text-slate-600">
                          {getPatternSignificance(pattern.mainPattern).description}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500 italic">
                    No pattern detected
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Signal Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {signal ? (
                  <>
                    <div>
                      <p className="text-sm text-slate-600 mb-2">Bias</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
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

                    {signal.notes.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Notes</p>
                        <ul className="space-y-1">
                          {signal.notes.map((note, i) => (
                            <li key={i} className="text-sm text-slate-600 flex gap-2">
                              <span className="text-emerald-600">•</span>
                              <span>{note}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {signal.cautions.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Cautions</p>
                        <ul className="space-y-1">
                          {signal.cautions.map((caution, i) => (
                            <li key={i} className="text-sm text-slate-600 flex gap-2">
                              <span className="text-amber-600">⚠</span>
                              <span>{caution}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-500 italic">
                    No signal data available
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Price Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Select value={newAlertDirection} onValueChange={(v: any) => setNewAlertDirection(v)}>
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="above">Above</SelectItem>
                        <SelectItem value="below">Below</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      value={newAlertPrice}
                      onChange={(e) => setNewAlertPrice(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <Button onClick={addAlert} className="w-full">
                    <Bell className="h-4 w-4 mr-2" />
                    Add Alert
                  </Button>
                </div>

                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">
                          {alert.direction === 'above' ? '↑' : '↓'} ${Number(alert.target_price).toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">{alert.direction}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAlert(alert.id)}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {alerts.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">No active alerts</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
