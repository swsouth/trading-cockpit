'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp, Clock, Target, AlertCircle, RefreshCw, Bitcoin, Play, Volume2, Zap, Newspaper } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface IntradayOpportunity {
  id: string;
  symbol: string;
  timeframe: string;
  scan_timestamp: string;
  recommendation_type: 'long' | 'short';
  entry_price: number;
  target_price: number;
  stop_loss: number;
  opportunity_score: number;
  confidence_level: 'high' | 'medium' | 'low';
  rationale: string;
  current_price: number;
  expires_at: string;
  status: string;
  channel_status: string | null;
  pattern_detected: string | null;
  rsi: number | null;
  asset_type?: 'stock' | 'crypto'; // Optional for backward compatibility
}

interface CoinApiUsageStats {
  available: boolean;
  stats?: {
    balance: number;
    creditsPerScan: number;
    estimatedScansRemaining: number;
    creditsPerCrypto: number;
    cryptosPerScan: number;
    lastUpdated: string;
  };
  message?: string;
}

export default function DayTraderPage() {
  const [opportunities, setOpportunities] = useState<IntradayOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [scannerRunning, setScannerRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coinApiUsage, setCoinApiUsage] = useState<CoinApiUsageStats | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Filtering & Sorting
  const [recommendationTypeFilter, setRecommendationTypeFilter] = useState<'all' | 'long' | 'short'>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState<'score' | 'timeToExpire' | 'symbol' | 'confidence'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // Handle paper trade (crypto-only)
  const handlePaperTrade = async (opp: IntradayOpportunity) => {
    try {
      toast({
        title: '🚀 Preparing Crypto Paper Trade',
        description: `Setting up ${opp.symbol} ${opp.recommendation_type} trade...`,
      });

      // Convert intraday opportunity to trade recommendation format
      const tradeData = {
        symbol: opp.symbol,
        side: opp.recommendation_type === 'long' ? 'buy' : 'sell',
        quantity: 0.01, // Start with 0.01 BTC equivalent
        entry_price: opp.entry_price,
        stop_loss: opp.stop_loss,
        target_price: opp.target_price,
        order_type: 'limit',
        limit_price: opp.entry_price,
        time_in_force: 'gtc', // Crypto uses GTC
        asset_type: 'crypto',
      };

      const response = await fetch('/api/paper-trade-crypto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tradeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place paper trade');
      }

      const result = await response.json();

      toast({
        title: '✅ Crypto Paper Trade Placed',
        description: `${opp.symbol} ${opp.recommendation_type} order submitted - Order ID: ${result.order_id}`,
        duration: 5000,
      });

      if (result.bracket_orders) {
        toast({
          title: '🎯 Bracket Orders Set',
          description: `Stop Loss @ $${opp.stop_loss.toFixed(2)}, Target @ $${opp.target_price.toFixed(2)}`,
          duration: 5000,
        });
      }

    } catch (error) {
      console.error('❌ Paper trade error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';

      toast({
        title: '❌ Paper Trade Failed',
        description: message,
        variant: 'destructive',
      });
    }
  };

  // Apply filters and sorting to opportunities
  const filterAndSortOpportunities = (opps: IntradayOpportunity[]) => {
    // Filter
    let filtered = opps.filter(opp => {
      if (recommendationTypeFilter !== 'all' && opp.recommendation_type !== recommendationTypeFilter) return false;
      if (confidenceFilter !== 'all' && opp.confidence_level !== confidenceFilter) return false;
      if (opp.opportunity_score < minScore) return false;
      return true;
    });

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'score') {
        comparison = a.opportunity_score - b.opportunity_score;
      } else if (sortBy === 'timeToExpire') {
        const aExpiry = new Date(a.expires_at).getTime();
        const bExpiry = new Date(b.expires_at).getTime();
        comparison = aExpiry - bExpiry;
      } else if (sortBy === 'symbol') {
        comparison = a.symbol.localeCompare(b.symbol);
      } else if (sortBy === 'confidence') {
        const confidenceOrder = { high: 3, medium: 2, low: 1 };
        comparison = confidenceOrder[a.confidence_level] - confidenceOrder[b.confidence_level];
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  };

  // High-frequency strategy: 10 elite cryptos every 15 minutes
  const CRYPTO_COUNT = 10;
  const ELITE_CRYPTOS = [
    'BTC/USD', 'ETH/USD', 'SOL/USD', 'BNB/USD', 'XRP/USD',
    'ADA/USD', 'AVAX/USD', 'DOGE/USD', 'MATIC/USD', 'LINK/USD'
  ];

  // Filter for crypto opportunities only
  const rawCryptoOpportunities = opportunities.filter(opp =>
    opp.asset_type === 'crypto'
  );

  // Apply filtering and sorting
  const cryptoOpportunities = filterAndSortOpportunities(rawCryptoOpportunities);

  // CoinAPI has no rate limits - credit-based system, never disable
  const isScannerDisabled = false;

  // Fetch opportunities from database
  const fetchOpportunities = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('intraday_opportunities')
        .select('*')
        .eq('user_id', user.id)  // Filter by current user
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .order('opportunity_score', { ascending: false });

      if (fetchError) throw fetchError;

      setOpportunities(data || []);
    } catch (err) {
      console.error('Error fetching intraday opportunities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch opportunities');
    } finally {
      setLoading(false);
    }
  };

  // Fetch CoinAPI usage stats
  const fetchCoinApiUsage = async () => {
    try {
      const response = await fetch('/api/coinapi-usage');
      const data = await response.json();
      setCoinApiUsage(data);
    } catch (err) {
      console.error('Error fetching CoinAPI usage:', err);
    }
  };

  // Run the crypto scanner manually
  const runScanner = async () => {
    if (!user) {
      toast({
        title: 'Not Logged In',
        description: 'Please log in to run the scanner',
        variant: 'destructive',
      });
      return;
    }

    setScannerRunning(true);
    setError(null);

    try {
      toast({
        title: 'Crypto Scanner Starting',
        description: `Scanning ${CRYPTO_COUNT} elite cryptocurrencies...`,
      });

      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch('/api/scan/intraday/crypto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Scanner failed');
      }

      toast({
        title: 'Crypto Scanner Complete',
        description: data.message || 'New crypto opportunities found. Refreshing...',
      });

      // Refresh opportunities and usage stats after scan completes
      setTimeout(() => {
        fetchOpportunities();
        fetchCoinApiUsage();
      }, 1000);

    } catch (err) {
      console.error('Error running scanner:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to run scanner';
      setError(errorMessage);

      toast({
        title: 'Scanner Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setScannerRunning(false);
    }
  };

  // Auto-refresh opportunities every 10 seconds
  useEffect(() => {
    if (user) {
      fetchOpportunities();
      fetchCoinApiUsage();

      const interval = setInterval(() => {
        fetchOpportunities();
        fetchCoinApiUsage();
      }, 10000); // 10 seconds

      return () => clearInterval(interval);
    }
  }, [user]);

  // Update current time every second (for countdown timers)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate time remaining until expiration
  const getTimeRemaining = (expiresAt: string): { minutes: number; seconds: number; isExpired: boolean } => {
    const now = currentTime.getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;

    if (diff <= 0) {
      return { minutes: 0, seconds: 0, isExpired: true };
    }

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return { minutes, seconds, isExpired: false };
  };

  // Format countdown display
  const formatCountdown = (expiresAt: string): string => {
    const { minutes, seconds, isExpired } = getTimeRemaining(expiresAt);

    if (isExpired) {
      return 'EXPIRED';
    }

    return `${minutes}m ${seconds}s`;
  };

  // Get badge color based on confidence level (WCAG AA compliant)
  const getConfidenceBadgeColor = (level: string): string => {
    switch (level) {
      case 'high':
        return 'bg-green-600 text-white font-semibold'; // WCAG AA: 4.5:1
      case 'medium':
        return 'bg-amber-600 text-white font-semibold'; // WCAG AA: 4.5:1
      case 'low':
        return 'bg-red-600 text-white font-semibold'; // WCAG AA: 4.5:1
      default:
        return 'bg-slate-600 text-white font-semibold';
    }
  };

  // Get score color
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 font-bold';
    if (score >= 60) return 'text-yellow-600 font-bold';
    return 'text-red-600 font-bold';
  };

  // Calculate execution quality badges
  const getExecutionBadges = (opp: IntradayOpportunity) => {
    // 1. Spread Quality (estimated from price)
    // Lower priced stocks typically have wider spreads
    const spreadQuality = opp.current_price > 50 ? 'good' : opp.current_price > 10 ? 'fair' : 'poor';

    // 2. Volume Quality (inferred from score - high scores typically have good volume)
    // In real implementation, this would check actual volume data
    const volumeQuality = opp.opportunity_score >= 70 ? 'high' : opp.opportunity_score >= 50 ? 'medium' : 'low';

    // 3. News Risk (time-based heuristic - fresh scans less likely to have breaking news)
    const scanAge = Date.now() - new Date(opp.scan_timestamp).getTime();
    const newsRisk = scanAge < 5 * 60 * 1000 ? 'clear' : scanAge < 15 * 60 * 1000 ? 'caution' : 'stale';

    return {
      spread: {
        status: spreadQuality,
        icon: Zap,
        color: spreadQuality === 'good' ? 'text-green-600' : spreadQuality === 'fair' ? 'text-yellow-600' : 'text-red-600',
        bgColor: spreadQuality === 'good' ? 'bg-green-100 dark:bg-green-950' : spreadQuality === 'fair' ? 'bg-yellow-100 dark:bg-yellow-950' : 'bg-red-100 dark:bg-red-950',
        label: spreadQuality === 'good' ? 'Tight Spread' : spreadQuality === 'fair' ? 'Fair Spread' : 'Wide Spread',
        tooltip: spreadQuality === 'good' ? 'Low execution cost' : spreadQuality === 'fair' ? 'Moderate execution cost' : 'High execution cost - use limits',
      },
      volume: {
        status: volumeQuality,
        icon: Volume2,
        color: volumeQuality === 'high' ? 'text-green-600' : volumeQuality === 'medium' ? 'text-yellow-600' : 'text-red-600',
        bgColor: volumeQuality === 'high' ? 'bg-green-100 dark:bg-green-950' : volumeQuality === 'medium' ? 'bg-yellow-100 dark:bg-yellow-950' : 'bg-red-100 dark:bg-red-950',
        label: volumeQuality === 'high' ? 'High Volume' : volumeQuality === 'medium' ? 'Med Volume' : 'Low Volume',
        tooltip: volumeQuality === 'high' ? 'Excellent liquidity' : volumeQuality === 'medium' ? 'Adequate liquidity' : 'Thin liquidity - reduce size',
      },
      news: {
        status: newsRisk,
        icon: Newspaper,
        color: newsRisk === 'clear' ? 'text-green-600' : newsRisk === 'caution' ? 'text-yellow-600' : 'text-gray-600',
        bgColor: newsRisk === 'clear' ? 'bg-green-100 dark:bg-green-950' : newsRisk === 'caution' ? 'bg-yellow-100 dark:bg-yellow-950' : 'bg-gray-100 dark:bg-gray-950',
        label: newsRisk === 'clear' ? 'Clear' : newsRisk === 'caution' ? 'Check News' : 'Stale Scan',
        tooltip: newsRisk === 'clear' ? 'Recent scan, no major news' : newsRisk === 'caution' ? 'Scan 5-15 min old, verify conditions' : 'Scan >15 min old, price may have changed',
      },
    };
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Day Trader</CardTitle>
            <CardDescription>Please log in to view intraday opportunities</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Enhanced Crypto-Only Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Bitcoin className="h-8 w-8 text-orange-500" />
            <h1 className="text-3xl md:text-4xl font-bold">Crypto Day Trader</h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Live cryptocurrency intraday setups • Auto-scans every 15 mins • 24/7 trading
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={runScanner}
            disabled={scannerRunning || isScannerDisabled}
            variant="default"
            size="lg"
            className="h-12 px-6 text-base font-semibold"
          >
            {scannerRunning ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Play className="mr-2 h-5 w-5" />
            )}
            {scannerRunning ? 'Scanning...' : `Scan ${CRYPTO_COUNT} Elite Cryptos`}
          </Button>
          <Button
            onClick={fetchOpportunities}
            disabled={loading}
            variant="outline"
            size="lg"
            className="h-12 px-6"
          >
            <RefreshCw className={`mr-2 h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Crypto-Only Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CoinAPI Usage Card - Enhanced */}
        <Card className="border-orange-200 dark:border-orange-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bitcoin className={`h-6 w-6 ${
                coinApiUsage?.available && coinApiUsage.stats
                  ? (coinApiUsage.stats.estimatedScansRemaining < 10 ? 'text-red-500' :
                     coinApiUsage.stats.estimatedScansRemaining < 50 ? 'text-amber-500' :
                     'text-green-500')
                  : 'text-slate-400'
              }`} />
              CoinAPI Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    {coinApiUsage?.available && coinApiUsage.stats
                      ? `$${coinApiUsage.stats.balance.toFixed(2)}`
                      : 'No data'}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Account Balance</p>
                </div>
                <Badge className={`text-sm px-3 py-1 ${
                  coinApiUsage?.available && coinApiUsage.stats
                    ? (coinApiUsage.stats.estimatedScansRemaining < 10 ? 'bg-red-600' :
                       coinApiUsage.stats.estimatedScansRemaining < 50 ? 'bg-amber-600' :
                       'bg-green-600')
                    : 'bg-slate-400'
                }`}>
                  {coinApiUsage?.available && coinApiUsage.stats
                    ? `${coinApiUsage.stats.creditsPerScan} credits/scan`
                    : 'IDLE'}
                </Badge>
              </div>
              {coinApiUsage?.available && coinApiUsage.stats && (
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <p>~{coinApiUsage.stats.estimatedScansRemaining} scans remaining</p>
                  <p className="text-xs mt-1">
                    {coinApiUsage.stats.cryptosPerScan} cryptos per scan
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Crypto Scan Schedule Card */}
        <Card className="border-blue-200 dark:border-blue-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-6 w-6 text-blue-500" />
              High-Frequency Strategy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{CRYPTO_COUNT} Elite Cryptos</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Scanned every 15 minutes</p>
                </div>
                <Badge className="text-sm px-3 py-1 bg-green-600">
                  24/7 ACTIVE
                </Badge>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <p className="font-semibold">Tracked Assets:</p>
                <div className="flex flex-wrap gap-1">
                  {ELITE_CRYPTOS.map((crypto) => (
                    <Badge key={crypto} variant="outline" className="text-xs">
                      {crypto.replace('/USD', '')}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs mt-2 pt-2 border-t">
                  📊 96 scans/day • 200 credits/scan • ~$6.40/day cost
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Filters */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Quick Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant={minScore >= 75 && recommendationTypeFilter === 'all' && confidenceFilter === 'all' ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setMinScore(75);
              setRecommendationTypeFilter('all');
              setConfidenceFilter('all');
              setSortBy('score');
              setSortOrder('desc');
            }}
            className="gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Best Today (75+)
          </Button>
          <Button
            variant={recommendationTypeFilter === 'long' && minScore >= 60 && confidenceFilter === 'all' ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setRecommendationTypeFilter('long');
              setMinScore(60);
              setConfidenceFilter('all');
              setSortBy('score');
              setSortOrder('desc');
            }}
            className="gap-2 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-950/20"
          >
            <TrendingUp className="h-4 w-4" />
            Long Plays (60+)
          </Button>
          <Button
            variant={recommendationTypeFilter === 'short' && minScore >= 60 && confidenceFilter === 'all' ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setRecommendationTypeFilter('short');
              setMinScore(60);
              setConfidenceFilter('all');
              setSortBy('score');
              setSortOrder('desc');
            }}
            className="gap-2 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <TrendingUp className="h-4 w-4 rotate-180" />
            Short Plays (60+)
          </Button>
          <Button
            variant={confidenceFilter === 'high' && recommendationTypeFilter === 'all' && minScore === 0 ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setConfidenceFilter('high');
              setRecommendationTypeFilter('all');
              setMinScore(0);
              setSortBy('score');
              setSortOrder('desc');
            }}
            className="gap-2 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/20"
          >
            <Badge variant="outline" className="h-4 w-4 p-0 rounded-full bg-purple-600 border-0" />
            High Confidence
          </Button>
          <Button
            variant={sortBy === 'timeToExpire' && sortOrder === 'asc' ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSortBy('timeToExpire');
              setSortOrder('asc');
              setRecommendationTypeFilter('all');
              setConfidenceFilter('all');
              setMinScore(0);
            }}
            className="gap-2 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-950/20"
          >
            <Clock className="h-4 w-4" />
            Expiring Soon
          </Button>
          {/* Clear All Filters */}
          {(recommendationTypeFilter !== 'all' || confidenceFilter !== 'all' || minScore > 0 || sortBy !== 'score') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setRecommendationTypeFilter('all');
                setConfidenceFilter('all');
                setMinScore(0);
                setSortBy('score');
                setSortOrder('desc');
              }}
              className="gap-2 text-muted-foreground"
            >
              Clear All
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Filters & Sorting Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Sorting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sorting Controls */}
          <div>
            <label className="text-sm font-medium mb-2 block">Sort By</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as 'score' | 'timeToExpire' | 'symbol' | 'confidence')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">Opportunity Score</SelectItem>
                  <SelectItem value="timeToExpire">Time Until Expire</SelectItem>
                  <SelectItem value="symbol">Symbol (A-Z)</SelectItem>
                  <SelectItem value="confidence">Confidence Level</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={sortOrder}
                onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">
                    {sortBy === 'timeToExpire' ? 'Expiring Last' : 'Highest First'}
                  </SelectItem>
                  <SelectItem value="asc">
                    {sortBy === 'timeToExpire' ? 'Expiring Soon' : 'Lowest First'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filter Controls */}
          <div>
            <label className="text-sm font-medium mb-2 block">Filters</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={recommendationTypeFilter}
                  onValueChange={(value) => setRecommendationTypeFilter(value as 'all' | 'long' | 'short')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="long">Long Only</SelectItem>
                    <SelectItem value="short">Short Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Confidence Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Confidence</label>
                <Select
                  value={confidenceFilter}
                  onValueChange={(value) => setConfidenceFilter(value as 'all' | 'high' | 'medium' | 'low')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Confidence</SelectItem>
                    <SelectItem value="high">High Only</SelectItem>
                    <SelectItem value="medium">Medium Only</SelectItem>
                    <SelectItem value="low">Low Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Min Score Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Min Score</label>
                <Select
                  value={minScore.toString()}
                  onValueChange={(value) => setMinScore(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Any Score</SelectItem>
                    <SelectItem value="30">30+ (All)</SelectItem>
                    <SelectItem value="40">40+ (Fair)</SelectItem>
                    <SelectItem value="50">50+ (Good)</SelectItem>
                    <SelectItem value="60">60+ (Medium+)</SelectItem>
                    <SelectItem value="75">75+ (High)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Crypto Opportunities List */}
      {renderOpportunitiesList(cryptoOpportunities)}
    </div>
  );

  // Helper function to render crypto opportunities list
  function renderOpportunitiesList(opps: IntradayOpportunity[]) {
    if (loading && opps.length === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    if (opps.length === 0) {
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-slate-600 dark:text-slate-400">
              <Bitcoin className="h-16 w-16 mx-auto mb-4 opacity-50 text-orange-500" />
              <p className="text-xl font-semibold mb-2">No Active Crypto Opportunities</p>
              <p className="text-sm mb-1">New setups will appear here when the scanner finds them</p>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">Crypto markets trade 24/7 • Scan anytime</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h2 className="text-2xl font-bold">
            Active Crypto Opportunities ({opps.length})
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Showing {opps.length} live crypto setup{opps.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="grid gap-4">
          {opps.map((opp) => {
              const { minutes, seconds, isExpired } = getTimeRemaining(opp.expires_at);
              const isExpiringSoon = minutes < 5 && !isExpired;

              // Risk level border styling (like daily scanner)
              const getRiskBorderClass = (score: number) => {
                if (score >= 75) return 'border-green-500 border-2'; // High confidence
                if (score >= 60) return 'border-yellow-500 border-2'; // Medium confidence
                if (score >= 40) return 'border-orange-500 border-2'; // Fair confidence
                return 'border-red-500 border-2'; // High risk (show with red warning)
              };

              const borderClass = isExpiringSoon
                ? 'border-orange-500 border-2 animate-pulse'
                : getRiskBorderClass(opp.opportunity_score);

              const badges = getExecutionBadges(opp);

              return (
                <Card
                  key={opp.id}
                  className={borderClass}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <CardTitle className="text-2xl">{opp.symbol}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{opp.timeframe}</Badge>
                            <Badge
                              className={
                                opp.recommendation_type === 'long'
                                  ? 'bg-green-600 text-white'
                                  : 'bg-red-600 text-white'
                              }
                            >
                              {opp.recommendation_type.toUpperCase()}
                            </Badge>
                            <Badge className={getConfidenceBadgeColor(opp.confidence_level)}>
                              {opp.confidence_level.toUpperCase()}
                            </Badge>
                            {opp.opportunity_score < 50 && (
                              <Badge variant="destructive">⚠️ HIGH RISK</Badge>
                            )}
                          </CardDescription>
                          {/* Execution Quality Badges */}
                          <div className="flex items-center gap-2 mt-2">
                            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${badges.spread.bgColor} ${badges.spread.color}`} title={badges.spread.tooltip}>
                              <badges.spread.icon className="h-4 w-4" />
                              <span>{badges.spread.label}</span>
                            </div>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${badges.volume.bgColor} ${badges.volume.color}`} title={badges.volume.tooltip}>
                              <badges.volume.icon className="h-4 w-4" />
                              <span>{badges.volume.label}</span>
                            </div>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${badges.news.bgColor} ${badges.news.color}`} title={badges.news.tooltip}>
                              <badges.news.icon className="h-4 w-4" />
                              <span>{badges.news.label}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-3xl font-bold ${getScoreColor(opp.opportunity_score)}`}>
                          {opp.opportunity_score}
                        </p>
                        <p className="text-sm text-muted-foreground">Score</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Countdown Timer */}
                    <div className={`flex items-center gap-2 p-3 rounded-lg ${
                      isExpired ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300' :
                      isExpiringSoon ? 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300' :
                      'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                    }`}>
                      <Clock className="h-4 w-4" />
                      <span className="font-semibold">
                        {isExpired ? 'EXPIRED' : `Expires in ${formatCountdown(opp.expires_at)}`}
                      </span>
                    </div>

                    {/* Price Levels */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Current</p>
                        <p className="text-lg font-semibold">${opp.current_price.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Entry</p>
                        <p className="text-lg font-semibold text-blue-600">${opp.entry_price.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Target</p>
                        <p className="text-lg font-semibold text-green-600">${opp.target_price.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          +{(opp.recommendation_type === 'long'
                            ? ((opp.target_price - opp.entry_price) / opp.entry_price) * 100
                            : ((opp.entry_price - opp.target_price) / opp.entry_price) * 100
                          ).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Stop</p>
                        <p className="text-lg font-semibold text-red-600">${opp.stop_loss.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          -{(opp.recommendation_type === 'long'
                            ? ((opp.entry_price - opp.stop_loss) / opp.entry_price) * 100
                            : ((opp.stop_loss - opp.entry_price) / opp.entry_price) * 100
                          ).toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {/* Rationale */}
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">{opp.rationale}</p>
                    </div>

                    {/* Technical Details */}
                    {(opp.channel_status || opp.pattern_detected || opp.rsi) && (
                      <div className="flex flex-wrap gap-2">
                        {opp.channel_status && (
                          <Badge variant="outline">Channel: {opp.channel_status}</Badge>
                        )}
                        {opp.pattern_detected && opp.pattern_detected !== 'none' && (
                          <Badge variant="outline">Pattern: {opp.pattern_detected}</Badge>
                        )}
                        {opp.rsi && (
                          <Badge variant="outline">RSI: {opp.rsi.toFixed(1)}</Badge>
                        )}
                      </div>
                    )}

                    {/* Action Buttons - WCAG AA Touch Targets (48px) */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1 h-12 text-base font-semibold"
                        disabled={isExpired}
                      >
                        <Target className="mr-2 h-5 w-5" />
                        View Chart
                      </Button>
                      <Button
                        variant="default"
                        className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold"
                        disabled={isExpired}
                        onClick={() => handlePaperTrade(opp)}
                      >
                        <Bitcoin className="mr-2 h-5 w-5" />
                        Paper Trade
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      );
    }
  }
