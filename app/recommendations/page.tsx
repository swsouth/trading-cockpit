'use client';

import { useState, useEffect } from 'react';
import { TradeRecommendation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp, RefreshCw, Target, AlertCircle } from 'lucide-react';
import { RecommendationCard } from '@/components/RecommendationCard';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';

interface RecommendationStats {
  total: number;
  byType: {
    long: number;
    short: number;
  };
  byConfidence: {
    high: number;
    medium: number;
    low: number;
  };
  avgScore: number;
  avgRiskReward: number;
  maxScore: number;
  maxRiskReward: number;
  topScoreSymbol: string | null;
  topRiskRewardSymbol: string | null;
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<TradeRecommendation[]>([]);
  const [stats, setStats] = useState<RecommendationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [latestScanDate, setLatestScanDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [recommendationTypeFilter, setRecommendationTypeFilter] = useState<'all' | 'long' | 'short'>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [minScore, setMinScore] = useState<number>(0);
  const [symbolFilter, setSymbolFilter] = useState<string | null>(null);

  // Sorting
  const [sortBy, setSortBy] = useState<'score' | 'symbol' | 'confidence' | 'setup' | 'riskReward'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      console.log('🔑 Session check:', {
        hasSession: !!session,
        error: sessionError?.message
      });

      if (sessionError || !session) {
        throw new Error('Please log in to view recommendations');
      }

      // Build query params
      const params = new URLSearchParams();
      if (recommendationTypeFilter !== 'all') params.append('recommendationType', recommendationTypeFilter);
      if (confidenceFilter !== 'all') params.append('confidenceLevel', confidenceFilter);
      if (minScore > 0) params.append('minScore', minScore.toString());
      params.append('activeOnly', 'true');
      params.append('limit', '1000'); // Get all results (was 30, now unlimited)
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      console.log('📡 Fetching:', `/api/recommendations?${params.toString()}`);

      const response = await fetch(`/api/recommendations?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      console.log('📥 Response:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      console.log('✅ Data received:', {
        recommendationsCount: data.recommendations?.length,
        stats: data.stats
      });

      setRecommendations(data.recommendations || []);
      setStats(data.stats || null);
      setLatestScanDate(data.latestScanDate || null);
    } catch (error) {
      console.error('❌ Error fetching recommendations:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch recommendations. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when filters/sorting change
  useEffect(() => {
    fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recommendationTypeFilter, confidenceFilter, minScore, sortBy, sortOrder]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Market Scan Results</h1>
          <p className="text-muted-foreground mt-1">
            Complete analysis of all {stats?.total || '249'} stocks from daily market scan
          </p>
          {latestScanDate && (
            <p className="text-sm text-muted-foreground mt-1">
              Latest scan: {new Date(latestScanDate).toLocaleDateString()}
            </p>
          )}
        </div>
        <Button
          onClick={fetchRecommendations}
          disabled={loading}
          size="lg"
          className="min-w-[140px]"
        >
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
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/10 dark:border-red-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-900 dark:text-red-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Error Loading Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-red-800 dark:text-red-300">
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/10 dark:border-orange-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-200 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Important Disclaimer
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-orange-800 dark:text-orange-300 space-y-1">
          <p>
            These are algorithmic suggestions based on technical analysis patterns.
            This is NOT financial advice. NOT a recommendation to buy or sell.
          </p>
          <p>
            <strong>High-risk trades (score &lt;50) are marked with a red border.</strong> These setups lack strong technical confirmation
            and should be traded with extreme caution or smaller position sizes.
          </p>
          <p>
            Do your own research and consult a financial advisor. Trading involves substantial risk of loss.
            Only trade with money you can afford to lose.
          </p>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card
            className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 active:scale-95"
            onClick={() => {
              setRecommendationTypeFilter('all');
              setConfidenceFilter('all');
              setMinScore(0);
              setSymbolFilter(null);
            }}
            style={{
              outline: recommendationTypeFilter === 'all' && confidenceFilter === 'all' && minScore === 0 && !symbolFilter
                ? '2px solid hsl(var(--primary))'
                : 'none',
            }}
          >
            <CardHeader className="pb-2">
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card
            className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 active:scale-95"
            onClick={() => setRecommendationTypeFilter('long')}
            style={{
              outline: recommendationTypeFilter === 'long'
                ? '2px solid rgb(22, 163, 74)'
                : 'none',
            }}
          >
            <CardHeader className="pb-2">
              <CardDescription>Long Setups</CardDescription>
              <CardTitle className="text-3xl text-green-600 dark:text-green-400">
                {stats.byType.long}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card
            className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 active:scale-95"
            onClick={() => setRecommendationTypeFilter('short')}
            style={{
              outline: recommendationTypeFilter === 'short'
                ? '2px solid rgb(220, 38, 38)'
                : 'none',
            }}
          >
            <CardHeader className="pb-2">
              <CardDescription>Short Setups</CardDescription>
              <CardTitle className="text-3xl text-red-600 dark:text-red-400">
                {stats.byType.short}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card
            className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 active:scale-95"
            onClick={() => {
              setSortBy('score');
              setSortOrder('desc');
              setRecommendationTypeFilter('all');
              setConfidenceFilter('all');
              setMinScore(0);
              setSymbolFilter(null);
            }}
            style={{
              outline: sortBy === 'score' && sortOrder === 'desc'
                ? '2px solid rgb(168, 85, 247)'
                : 'none',
            }}
          >
            <CardHeader className="pb-2">
              <CardDescription>Avg Score</CardDescription>
              <CardTitle className="text-3xl text-purple-600 dark:text-purple-400">
                {stats.avgScore.toFixed(0)}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Click to sort highest first
              </p>
            </CardHeader>
          </Card>
          <Card
            className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 active:scale-95"
            onClick={() => {
              setSortBy('riskReward');
              setSortOrder('desc');
              setRecommendationTypeFilter('all');
              setConfidenceFilter('all');
              setMinScore(0);
              setSymbolFilter(null);
            }}
            style={{
              outline: sortBy === 'riskReward' && sortOrder === 'desc'
                ? '2px solid rgb(59, 130, 246)'
                : 'none',
            }}
          >
            <CardHeader className="pb-2">
              <CardDescription>Avg R:R</CardDescription>
              <CardTitle className="text-3xl text-blue-600 dark:text-blue-400">
                {stats.avgRiskReward.toFixed(1)}:1
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Click to sort highest first
              </p>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Filters & Sorting */}
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
                onValueChange={(value) => setSortBy(value as 'score' | 'symbol' | 'confidence' | 'setup' | 'riskReward')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">Opportunity Score</SelectItem>
                  <SelectItem value="riskReward">Risk:Reward Ratio</SelectItem>
                  <SelectItem value="symbol">Symbol (A-Z)</SelectItem>
                  <SelectItem value="confidence">Confidence Level</SelectItem>
                  <SelectItem value="setup">Setup Type</SelectItem>
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
                  <SelectItem value="desc">Highest First</SelectItem>
                  <SelectItem value="asc">Lowest First</SelectItem>
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

      {/* Active Symbol Filter Indicator */}
      {symbolFilter && (
        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/10 dark:border-purple-900">
          <CardContent className="pt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-purple-700 dark:text-purple-300">
                Filtered by Symbol: {symbolFilter}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Showing {recommendations.filter(r => r.symbol === symbolFilter).length} recommendation(s)
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSymbolFilter(null)}
              className="text-purple-700 dark:text-purple-300"
            >
              Clear Filter
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {recommendations.length === 0 && !loading && !error && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <Target className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No scan results yet</p>
            <p className="text-sm mt-1">
              {latestScanDate
                ? 'Try adjusting your filters or wait for the next scheduled scan (Mon-Fri at 5 PM ET)'
                : 'The daily market scanner will run Mon-Fri at 5 PM ET to analyze all 249 stocks'}
            </p>
            <p className="text-xs mt-3 text-muted-foreground/60">
              Next scan will populate this page with complete market analysis for all stocks in the universe
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {(symbolFilter
          ? recommendations.filter(r => r.symbol === symbolFilter)
          : recommendations
        ).map((recommendation) => (
          <RecommendationCard key={recommendation.id} recommendation={recommendation} />
        ))}
      </div>
    </div>
  );
}
