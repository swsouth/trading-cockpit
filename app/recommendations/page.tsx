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
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<TradeRecommendation[]>([]);
  const [stats, setStats] = useState<RecommendationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [latestScanDate, setLatestScanDate] = useState<string | null>(null);

  // Filters
  const [recommendationTypeFilter, setRecommendationTypeFilter] = useState<'all' | 'long' | 'short'>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [minScore, setMinScore] = useState<number>(0);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('Please log in to view recommendations');
      }

      // Build query params
      const params = new URLSearchParams();
      if (recommendationTypeFilter !== 'all') params.append('recommendationType', recommendationTypeFilter);
      if (confidenceFilter !== 'all') params.append('confidenceLevel', confidenceFilter);
      if (minScore > 0) params.append('minScore', minScore.toString());
      params.append('activeOnly', 'true');
      params.append('limit', '30');

      const response = await fetch(`/api/recommendations?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
      setStats(data.stats || null);
      setLatestScanDate(data.latestScanDate || null);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch recommendations. Please try again.';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchRecommendations();
  }, [recommendationTypeFilter, confidenceFilter, minScore]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Recommendations</h1>
          <p className="text-muted-foreground mt-1">
            Top trading opportunities from daily market-wide scans
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
            Do your own research and consult a financial advisor. Trading involves substantial risk of loss.
            Only trade with money you can afford to lose.
          </p>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Long Setups</CardDescription>
              <CardTitle className="text-3xl text-green-600 dark:text-green-400">
                {stats.byType.long}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Short Setups</CardDescription>
              <CardTitle className="text-3xl text-red-600 dark:text-red-400">
                {stats.byType.short}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg Score</CardDescription>
              <CardTitle className="text-3xl">
                {stats.avgScore.toFixed(0)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg R:R</CardDescription>
              <CardTitle className="text-3xl text-blue-600 dark:text-blue-400">
                {stats.avgRiskReward.toFixed(1)}:1
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
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
                  <SelectItem value="60">60+ (Medium+)</SelectItem>
                  <SelectItem value="75">75+ (High)</SelectItem>
                  <SelectItem value="85">85+ (Very High)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {recommendations.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <Target className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No recommendations found</p>
            <p className="text-sm mt-1">
              {latestScanDate
                ? 'Try adjusting your filters or check back after the next scan'
                : 'Run the daily market scanner to generate recommendations'}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {recommendations.map((recommendation) => (
          <RecommendationCard key={recommendation.id} recommendation={recommendation} />
        ))}
      </div>
    </div>
  );
}
