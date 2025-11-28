'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, TrendingUp, Clock, Target, AlertCircle, Activity, RefreshCw, DollarSign, Bitcoin } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';

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

interface MarketStatus {
  isOpen: boolean;
  status: 'open' | 'closed' | 'pre-market' | 'after-hours';
  message: string;
  minutesUntilChange?: number;
}

export default function DayTraderPage() {
  const [opportunities, setOpportunities] = useState<IntradayOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'stocks' | 'crypto'>('stocks');

  const { user, loading: authLoading } = useAuth();

  // Filter opportunities by asset type
  const stockOpportunities = opportunities.filter(opp =>
    !opp.asset_type || opp.asset_type === 'stock'
  );
  const cryptoOpportunities = opportunities.filter(opp =>
    opp.asset_type === 'crypto'
  );

  // Fetch opportunities from database
  const fetchOpportunities = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('intraday_opportunities')
        .select('*')
        .eq('user_id', user.id)
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

  // Fetch market status
  const fetchMarketStatus = async () => {
    try {
      const response = await fetch('/api/market-status');
      const data = await response.json();
      setMarketStatus(data);
    } catch (err) {
      console.error('Error fetching market status:', err);
    }
  };

  // Auto-refresh opportunities every 10 seconds
  useEffect(() => {
    if (user) {
      fetchOpportunities();
      fetchMarketStatus();

      const interval = setInterval(() => {
        fetchOpportunities();
        fetchMarketStatus();
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

  // Get badge color based on confidence level
  const getConfidenceBadgeColor = (level: string): string => {
    switch (level) {
      case 'high':
        return 'bg-green-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'low':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // Get score color
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 font-bold';
    if (score >= 60) return 'text-yellow-600 font-bold';
    return 'text-red-600 font-bold';
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Day Trader</h1>
          <p className="text-muted-foreground">Live intraday setups • Auto-refreshing every 10s</p>
        </div>
        <Button onClick={fetchOpportunities} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Market Status Card */}
      {marketStatus && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className={`h-5 w-5 ${marketStatus.isOpen ? 'text-green-500' : 'text-red-500'}`} />
                <div>
                  <p className="font-semibold">Market Status: {marketStatus.status.toUpperCase()}</p>
                  <p className="text-sm text-muted-foreground">{marketStatus.message}</p>
                </div>
              </div>
              <Badge className={marketStatus.isOpen ? 'bg-green-500' : 'bg-red-500'}>
                {marketStatus.isOpen ? 'OPEN' : 'CLOSED'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Opportunities Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'stocks' | 'crypto')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="stocks" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Stocks ({stockOpportunities.length})
          </TabsTrigger>
          <TabsTrigger value="crypto" className="flex items-center gap-2">
            <Bitcoin className="h-4 w-4" />
            Crypto ({cryptoOpportunities.length})
          </TabsTrigger>
        </TabsList>

        {/* Stocks Tab */}
        <TabsContent value="stocks" className="space-y-4 mt-6">
          {renderOpportunitiesList(stockOpportunities, 'stocks')}
        </TabsContent>

        {/* Crypto Tab */}
        <TabsContent value="crypto" className="space-y-4 mt-6">
          {renderOpportunitiesList(cryptoOpportunities, 'crypto')}
        </TabsContent>
      </Tabs>
    </div>
  );

  // Helper function to render opportunities list
  function renderOpportunitiesList(opps: IntradayOpportunity[], assetType: 'stocks' | 'crypto') {
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
            <div className="text-center py-8 text-muted-foreground">
              {assetType === 'stocks' ? (
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              ) : (
                <Bitcoin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              )}
              <p className="text-lg font-medium">No active {assetType} opportunities</p>
              <p className="text-sm">New setups will appear here when the scanner finds them</p>
              {marketStatus && !marketStatus.isOpen && assetType === 'stocks' && (
                <p className="text-sm mt-2">Stock market is currently closed</p>
              )}
              {assetType === 'crypto' && (
                <p className="text-sm mt-2 text-green-600">Crypto markets trade 24/7</p>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Active {assetType === 'stocks' ? 'Stock' : 'Crypto'} Opportunities ({opps.length})
          </h2>
          <p className="text-sm text-muted-foreground">
            Showing {opps.length} live setup{opps.length !== 1 ? 's' : ''}
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
                      isExpired ? 'bg-red-100 text-red-700' :
                      isExpiringSoon ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
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
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Stop</p>
                        <p className="text-lg font-semibold text-red-600">${opp.stop_loss.toFixed(2)}</p>
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

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button variant="default" className="flex-1" disabled={isExpired}>
                        <Target className="mr-2 h-4 w-4" />
                        View Chart
                      </Button>
                      <Button variant="outline" className="flex-1" disabled={isExpired}>
                        Copy Details
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
