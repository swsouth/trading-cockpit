'use client';

import { useState, useEffect } from 'react';
import { TradeRecommendation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, TrendingUp, RefreshCw, Target, AlertCircle, Calendar, Flame, Star } from 'lucide-react';
import { RecommendationCard } from '@/components/RecommendationCard';
import { PaperTradeConfirmDialog } from '@/components/PaperTradeConfirmDialog';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { usePaperTrade, PaperTradePrep } from '@/hooks/use-paper-trade';
import { useHotList } from '@/hooks/use-hot-list';

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

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'hotlist'>('today');
  const [hotListItems, setHotListItems] = useState<TradeRecommendation[]>([]);
  const [hotListLoading, setHotListLoading] = useState(false);

  // Hot List hook
  const { getHotList } = useHotList();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Paper trading hook
  const { preparePaperTrade, executePaperTrade, tradePrep, isLoading: isPaperTrading } = usePaperTrade({
    accountEquity: 100000, // $100k paper account
    riskPercent: 1, // Risk 1% per trade
  });

  // Confirmation dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingTrade, setPendingTrade] = useState<PaperTradePrep | null>(null);

  // Filters
  const [recommendationTypeFilter, setRecommendationTypeFilter] = useState<'all' | 'long' | 'short'>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [minScore, setMinScore] = useState<number>(0);
  const [minVettingScore, setMinVettingScore] = useState<number>(0);
  const [symbolFilter, setSymbolFilter] = useState<string | null>(null);

  // Sorting
  const [sortBy, setSortBy] = useState<'score' | 'symbol' | 'confidence' | 'setup' | 'riskReward' | 'vettingScore'>('score');
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
      if (minVettingScore > 0) params.append('minVettingScore', minVettingScore.toString());
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
        stats: data.stats,
        maxScore: data.stats?.maxScore,
        maxRiskReward: data.stats?.maxRiskReward
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

  const fetchHotList = async () => {
    setHotListLoading(true);
    try {
      const result = await getHotList();
      if (result.success && result.items) {
        setHotListItems(result.items);
      } else {
        console.error('Failed to fetch hot list:', result.error);
      }
    } catch (error) {
      console.error('Error fetching hot list:', error);
    } finally {
      setHotListLoading(false);
    }
  };

  // Fetch on mount and when filters/sorting change
  useEffect(() => {
    fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recommendationTypeFilter, confidenceFilter, minScore, minVettingScore, sortBy, sortOrder]);

  // Fetch hot list when that tab is active
  useEffect(() => {
    if (activeTab === 'hotlist') {
      fetchHotList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Reset to page 1 when filters or tabs change
  useEffect(() => {
    setCurrentPage(1);
  }, [recommendationTypeFilter, confidenceFilter, minScore, minVettingScore, symbolFilter, sortBy, sortOrder, activeTab]);

  // Filter recommendations by active tab
  const getTabRecommendations = () => {
    if (activeTab === 'hotlist') {
      return hotListItems;
    }

    if (activeTab === 'today') {
      // Filter for today's scan date only
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      return recommendations.filter(r => r.scan_date.startsWith(today));
    }

    // 'week' tab shows all active recommendations (default behavior)
    return recommendations;
  };

  // Calculate paginated results
  const tabRecommendations = getTabRecommendations();
  const filteredRecommendations = symbolFilter
    ? tabRecommendations.filter(r => r.symbol === symbolFilter)
    : tabRecommendations;

  const totalPages = Math.ceil(filteredRecommendations.length / ITEMS_PER_PAGE);
  const paginatedRecommendations = filteredRecommendations.slice(0, currentPage * ITEMS_PER_PAGE);
  const hasMore = currentPage < totalPages;

  // Handle paper trade button click
  const handlePaperTradeClick = async (recommendation: TradeRecommendation) => {
    const prep = await preparePaperTrade(recommendation);
    if (prep) {
      setPendingTrade(prep);
      setConfirmDialogOpen(true);
    }
  };

  // Handle confirmation dialog confirm
  const handleConfirmTrade = async () => {
    if (pendingTrade) {
      await executePaperTrade(pendingTrade);
      setConfirmDialogOpen(false);
      setPendingTrade(null);
    }
  };

  // Handle confirmation dialog cancel
  const handleCancelTrade = () => {
    setConfirmDialogOpen(false);
    setPendingTrade(null);
  };

  // Handle unpin from hot list
  const handleUnpin = () => {
    // Refresh hot list after unpinning
    fetchHotList();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Market Scan Results</h1>
          <p className="text-muted-foreground mt-1">
            {activeTab === 'today'
              ? `Today's scan: ${tabRecommendations.length} stocks analyzed`
              : activeTab === 'hotlist'
              ? `Your Hot List: ${hotListItems.length} pinned opportunities`
              : `This week: ${stats?.total || 0} total scans across all days`
            }
          </p>
          {latestScanDate && (
            <p className="text-sm text-muted-foreground mt-1">
              Latest scan: {new Date(latestScanDate).toLocaleString('en-US', {
                month: 'numeric',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
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

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'today' | 'week' | 'hotlist')} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-[600px] mx-auto">
          <TabsTrigger value="today" className="gap-2">
            <Calendar className="h-4 w-4" />
            Today
            {(() => {
              const todayCount = recommendations.filter(r => r.scan_date.startsWith(new Date().toISOString().split('T')[0])).length;
              return todayCount > 0 ? (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {todayCount}
                </Badge>
              ) : null;
            })()}
          </TabsTrigger>
          <TabsTrigger value="week" className="gap-2">
            <Flame className="h-4 w-4" />
            This Week
            {recommendations.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {recommendations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="hotlist" className="gap-2">
            <Star className="h-4 w-4" />
            Hot List
            {hotListItems.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {hotListItems.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Preset Filter Chips - Quick Access */}
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
              setMinVettingScore(0);
              setRecommendationTypeFilter('all');
              setConfidenceFilter('all');
              setSymbolFilter(null);
              setSortBy('score');
              setSortOrder('desc');
            }}
            className="gap-2"
          >
            <TrendingUp className="h-3 w-3" />
            Best Today (75+)
          </Button>
          <Button
            variant={recommendationTypeFilter === 'long' && minScore >= 60 && confidenceFilter === 'all' ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setRecommendationTypeFilter('long');
              setMinScore(60);
              setMinVettingScore(0);
              setConfidenceFilter('all');
              setSymbolFilter(null);
              setSortBy('score');
              setSortOrder('desc');
            }}
            className="gap-2 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-950/20"
          >
            <TrendingUp className="h-3 w-3" />
            Long Plays (60+)
          </Button>
          <Button
            variant={recommendationTypeFilter === 'short' && minScore >= 60 && confidenceFilter === 'all' ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setRecommendationTypeFilter('short');
              setMinScore(60);
              setMinVettingScore(0);
              setConfidenceFilter('all');
              setSymbolFilter(null);
              setSortBy('score');
              setSortOrder('desc');
            }}
            className="gap-2 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <TrendingUp className="h-3 w-3 rotate-180" />
            Short Plays (60+)
          </Button>
          <Button
            variant={confidenceFilter === 'high' && recommendationTypeFilter === 'all' && minScore === 0 ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setConfidenceFilter('high');
              setRecommendationTypeFilter('all');
              setMinScore(0);
              setMinVettingScore(0);
              setSymbolFilter(null);
              setSortBy('score');
              setSortOrder('desc');
            }}
            className="gap-2 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/20"
          >
            <Badge variant="outline" className="h-3 w-3 p-0 rounded-full bg-purple-600 border-0" />
            High Confidence
          </Button>
          <Button
            variant={sortBy === 'riskReward' && sortOrder === 'desc' && minScore === 0 ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSortBy('riskReward');
              setSortOrder('desc');
              setRecommendationTypeFilter('all');
              setConfidenceFilter('all');
              setMinScore(0);
              setMinVettingScore(0);
              setSymbolFilter(null);
            }}
            className="gap-2 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/20"
          >
            <Target className="h-3 w-3" />
            Best R:R Ratio
          </Button>
          {/* Clear All Filters */}
          {(recommendationTypeFilter !== 'all' || confidenceFilter !== 'all' || minScore > 0 || minVettingScore > 0 || symbolFilter || sortBy !== 'score') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setRecommendationTypeFilter('all');
                setConfidenceFilter('all');
                setMinScore(0);
                setMinVettingScore(0);
                setSymbolFilter(null);
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
              setMinVettingScore(0);
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
              setMinVettingScore(0);
              setSymbolFilter(null);
            }}
            style={{
              outline: sortBy === 'score' && sortOrder === 'desc'
                ? '2px solid rgb(168, 85, 247)'
                : 'none',
            }}
          >
            <CardHeader className="pb-2">
              <CardDescription>Highest Score</CardDescription>
              <CardTitle className="text-3xl text-purple-600 dark:text-purple-400">
                {typeof stats.maxScore === 'number' ? stats.maxScore.toFixed(0) : '—'}
              </CardTitle>
              {stats.topScoreSymbol && (
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.topScoreSymbol}
                </p>
              )}
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
              <CardDescription>Highest R:R</CardDescription>
              <CardTitle className="text-3xl text-blue-600 dark:text-blue-400">
                {typeof stats.maxRiskReward === 'number' ? `${stats.maxRiskReward.toFixed(1)}:1` : '—'}
              </CardTitle>
              {stats.topRiskRewardSymbol && (
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.topRiskRewardSymbol}
                </p>
              )}
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
                onValueChange={(value) => setSortBy(value as 'score' | 'symbol' | 'confidence' | 'setup' | 'riskReward' | 'vettingScore')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">Opportunity Score</SelectItem>
                  <SelectItem value="vettingScore">Vetting Score</SelectItem>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            {/* Min Opportunity Score Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Min Opp Score</label>
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

            {/* Min Vetting Score Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Min Vetting Score</label>
              <Select
                value={minVettingScore.toString()}
                onValueChange={(value) => setMinVettingScore(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any Score</SelectItem>
                  <SelectItem value="50">50+ (Pass)</SelectItem>
                  <SelectItem value="60">60+ (Good)</SelectItem>
                  <SelectItem value="70">70+ (Very Good)</SelectItem>
                  <SelectItem value="80">80+ (Excellent)</SelectItem>
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

      {/* Results Count */}
      {filteredRecommendations.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Showing {paginatedRecommendations.length} of {filteredRecommendations.length} recommendations
          </p>
          {currentPage > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(1)}
              className="text-xs"
            >
              Back to Top
            </Button>
          )}
        </div>
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

      {filteredRecommendations.length > 0 && paginatedRecommendations.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <Target className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No results match your filters</p>
            <p className="text-sm mt-1">Try adjusting your filters or clearing them to see all recommendations</p>
            <Button
              variant="outline"
              onClick={() => {
                setRecommendationTypeFilter('all');
                setConfidenceFilter('all');
                setMinScore(0);
                setMinVettingScore(0);
                setSymbolFilter(null);
              }}
              className="mt-4"
            >
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {paginatedRecommendations.map((recommendation) => (
          <RecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
            onPaperTrade={handlePaperTradeClick}
            hotListId={activeTab === 'hotlist' ? (recommendation as any).hot_list_id : undefined}
            onUnpin={activeTab === 'hotlist' ? handleUnpin : undefined}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={() => setCurrentPage(prev => prev + 1)}
            variant="outline"
            size="lg"
            className="min-w-[200px]"
          >
            Load More ({filteredRecommendations.length - paginatedRecommendations.length} remaining)
          </Button>
        </div>
      )}

      {/* Confirmation Dialog */}
      {pendingTrade && (
        <PaperTradeConfirmDialog
          open={confirmDialogOpen}
          onOpenChange={setConfirmDialogOpen}
          recommendation={pendingTrade.recommendation}
          shares={pendingTrade.shares}
          costBasis={pendingTrade.costBasis}
          dollarRisk={pendingTrade.dollarRisk}
          riskPercent={1}
          currentPrice={pendingTrade.currentPrice}
          priceDeviation={pendingTrade.priceDeviation}
          marketWarning={pendingTrade.marketWarning}
          onConfirm={handleConfirmTrade}
          onCancel={handleCancelTrade}
        />
      )}
    </div>
  );
}
