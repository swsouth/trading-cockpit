'use client';

import { useState } from 'react';
import { ScanResult, ScanCriteria } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Search } from 'lucide-react';
import { OpportunityCard } from '@/components/OpportunityCard';
import { ScannerFilters } from '@/components/ScannerFilters';

interface ScanStats {
  total: number;
  actionable: number;
  byAction: Record<string, number>;
  byConfidence: Record<string, number>;
  avgRiskReward: number;
}

export default function ScannerPage() {
  const [results, setResults] = useState<ScanResult[]>([]);
  const [stats, setStats] = useState<ScanStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannedAt, setScannedAt] = useState<string | null>(null);
  const [criteria, setCriteria] = useState<ScanCriteria>({});
  const [sortBy, setSortBy] = useState<'riskReward' | 'confidence' | 'priceChange' | 'setup'>('riskReward');

  const runScan = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/scanner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ criteria, sortBy }),
      });

      if (!response.ok) {
        throw new Error('Failed to run scan');
      }

      const data = await response.json();
      setResults(data.results || []);
      setStats(data.stats || null);
      setScannedAt(data.scannedAt || null);
    } catch (error) {
      console.error('Error running scan:', error);
      alert('Failed to run scan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newCriteria: ScanCriteria) => {
    setCriteria(newCriteria);
  };

  const handleSortChange = (newSort: typeof sortBy) => {
    setSortBy(newSort);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Market Scanner</h1>
          <p className="text-muted-foreground mt-1">
            Scan your watchlist for actionable trading opportunities
          </p>
        </div>
        <Button
          onClick={runScan}
          disabled={loading}
          size="lg"
          className="min-w-[140px]"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Run Scan
            </>
          )}
        </Button>
      </div>

      {/* Disclaimer */}
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/10 dark:border-orange-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-200">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Scanned</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Actionable Setups</CardDescription>
              <CardTitle className="text-3xl text-green-600 dark:text-green-400">
                {stats.actionable}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg Risk/Reward</CardDescription>
              <CardTitle className="text-3xl">
                {stats.avgRiskReward > 0 ? `${stats.avgRiskReward.toFixed(1)}:1` : '--'}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>High Confidence</CardDescription>
              <CardTitle className="text-3xl text-blue-600 dark:text-blue-400">
                {stats.byConfidence['HIGH'] || 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Filters */}
      <ScannerFilters
        criteria={criteria}
        onCriteriaChange={handleFilterChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
      />

      {/* Results */}
      {scannedAt && (
        <div className="text-sm text-muted-foreground">
          Last scanned: {new Date(scannedAt).toLocaleString()}
        </div>
      )}

      {results.length === 0 && !loading && scannedAt && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <TrendingUp className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No opportunities found</p>
            <p className="text-sm mt-1">
              Try adjusting your filters or add more symbols to your watchlist
            </p>
          </CardContent>
        </Card>
      )}

      {results.length === 0 && !loading && !scannedAt && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Ready to scan</p>
            <p className="text-sm mt-1">
              Click "Run Scan" to analyze your watchlist for trading opportunities
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {results.map((result) => (
          <OpportunityCard key={result.watchlistItem.id} result={result} />
        ))}
      </div>
    </div>
  );
}
