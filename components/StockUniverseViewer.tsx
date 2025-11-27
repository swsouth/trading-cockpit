'use client';

/**
 * Stock Universe Viewer Component
 *
 * Shows stock universes for daily and intraday scanners with:
 * - Performance analytics (30/60/90 day opportunities)
 * - Pause/resume functionality
 * - Filtering and sorting
 */

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DailyStockAnalytics,
  IntradayStockAnalytics,
  getDailyStockAnalytics,
  getIntradayStockAnalytics,
  getDailyScannerSummary,
  getIntradayScannerSummary,
  pauseDailyStock,
  resumeDailyStock,
  pauseIntradayStock,
  resumeIntradayStock,
  getPerformanceTier,
  getPerformanceColor,
} from '@/lib/stockUniverseAnalytics';

interface StockUniverseViewerProps {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export default function StockUniverseViewer({
  supabaseUrl,
  supabaseAnonKey,
}: StockUniverseViewerProps) {
  const [activeTab, setActiveTab] = useState('daily');
  const [dailyStocks, setDailyStocks] = useState<DailyStockAnalytics[]>([]);
  const [intradayStocks, setIntradayStocks] = useState<IntradayStockAnalytics[]>([]);
  const [dailySummary, setDailySummary] = useState({
    totalStocks: 0,
    activeStocks: 0,
    pausedStocks: 0,
    totalOpportunities: 0,
    avgScore: 0,
  });
  const [intradaySummary, setIntradaySummary] = useState({
    totalStocks: 0,
    activeStocks: 0,
    pausedStocks: 0,
    totalOpportunities: 0,
    avgScore: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const [daily, intraday, dailySum, intradaySum] = await Promise.all([
        getDailyStockAnalytics(supabaseUrl, supabaseAnonKey),
        getIntradayStockAnalytics(supabaseUrl, supabaseAnonKey),
        getDailyScannerSummary(supabaseUrl, supabaseAnonKey),
        getIntradayScannerSummary(supabaseUrl, supabaseAnonKey),
      ]);

      setDailyStocks(daily);
      setIntradayStocks(intraday);
      setDailySummary(dailySum);
      setIntradaySummary(intradaySum);
    } catch (err) {
      console.error('Error loading stock universe data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handlePauseDaily(symbol: string) {
    try {
      await pauseDailyStock(supabaseUrl, supabaseAnonKey, symbol);
      await loadData(); // Refresh data
    } catch (err) {
      console.error('Error pausing stock:', err);
      alert('Failed to pause stock');
    }
  }

  async function handleResumeDaily(symbol: string) {
    try {
      await resumeDailyStock(supabaseUrl, supabaseAnonKey, symbol);
      await loadData(); // Refresh data
    } catch (err) {
      console.error('Error resuming stock:', err);
      alert('Failed to resume stock');
    }
  }

  async function handlePauseIntraday(symbol: string) {
    try {
      await pauseIntradayStock(supabaseUrl, supabaseAnonKey, symbol);
      await loadData(); // Refresh data
    } catch (err) {
      console.error('Error pausing stock:', err);
      alert('Failed to pause stock');
    }
  }

  async function handleResumeIntraday(symbol: string) {
    try {
      await resumeIntradayStock(supabaseUrl, supabaseAnonKey, symbol);
      await loadData(); // Refresh data
    } catch (err) {
      console.error('Error resuming stock:', err);
      alert('Failed to resume stock');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading stock universe data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h3>
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Stock Universe Manager</h2>
        <p className="text-gray-600">
          View and manage stocks being scanned for trading opportunities
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="daily">
            Daily Scanner ({dailySummary.activeStocks} active)
          </TabsTrigger>
          <TabsTrigger value="intraday">
            Day Trader ({intradaySummary.activeStocks} active)
          </TabsTrigger>
        </TabsList>

        {/* Daily Scanner Tab */}
        <TabsContent value="daily" className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="rounded-lg border bg-white p-4">
              <div className="text-sm font-medium text-gray-600">Total Stocks</div>
              <div className="text-2xl font-bold">{dailySummary.totalStocks}</div>
            </div>
            <div className="rounded-lg border bg-green-50 p-4">
              <div className="text-sm font-medium text-green-600">Active</div>
              <div className="text-2xl font-bold text-green-700">{dailySummary.activeStocks}</div>
            </div>
            <div className="rounded-lg border bg-yellow-50 p-4">
              <div className="text-sm font-medium text-yellow-600">Paused</div>
              <div className="text-2xl font-bold text-yellow-700">{dailySummary.pausedStocks}</div>
            </div>
            <div className="rounded-lg border bg-blue-50 p-4">
              <div className="text-sm font-medium text-blue-600">Opportunities (90d)</div>
              <div className="text-2xl font-bold text-blue-700">{dailySummary.totalOpportunities}</div>
            </div>
            <div className="rounded-lg border bg-purple-50 p-4">
              <div className="text-sm font-medium text-purple-600">Avg Score</div>
              <div className="text-2xl font-bold text-purple-700">{dailySummary.avgScore}/100</div>
            </div>
          </div>

          {/* Stock Table */}
          <div className="rounded-lg border bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Symbol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sector
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Opportunities
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dailyStocks.map((stock) => {
                    const tier = getPerformanceTier(stock.opps_90d);
                    const colorClass = getPerformanceColor(tier);

                    return (
                      <tr key={stock.symbol} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">{stock.symbol}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{stock.company_name || '—'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{stock.sector}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              stock.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : stock.status === 'paused'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {stock.status === 'active' && '🟢 Active'}
                            {stock.status === 'paused' && '🟡 Paused'}
                            {stock.status === 'removed' && '🔴 Removed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium px-2 py-1 rounded ${colorClass}`}>
                            {stock.opps_30d} / {stock.opps_60d} / {stock.opps_90d}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">30 / 60 / 90 days</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {stock.avg_score}/100
                          </div>
                          {stock.max_score && (
                            <div className="text-xs text-gray-500">Max: {stock.max_score}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {stock.status === 'active' && (
                            <button
                              onClick={() => handlePauseDaily(stock.symbol)}
                              className="text-yellow-600 hover:text-yellow-900 font-medium"
                            >
                              ⏸️ Pause
                            </button>
                          )}
                          {stock.status === 'paused' && (
                            <button
                              onClick={() => handleResumeDaily(stock.symbol)}
                              className="text-green-600 hover:text-green-900 font-medium"
                            >
                              ▶️ Resume
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            💡 <strong>Tip:</strong> Paused stocks are excluded from the next scheduled scan (5 PM ET daily).
            You can resume them anytime.
          </div>
        </TabsContent>

        {/* Intraday Scanner Tab */}
        <TabsContent value="intraday" className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="rounded-lg border bg-white p-4">
              <div className="text-sm font-medium text-gray-600">Total Stocks</div>
              <div className="text-2xl font-bold">{intradaySummary.totalStocks}</div>
            </div>
            <div className="rounded-lg border bg-green-50 p-4">
              <div className="text-sm font-medium text-green-600">Active</div>
              <div className="text-2xl font-bold text-green-700">{intradaySummary.activeStocks}</div>
            </div>
            <div className="rounded-lg border bg-yellow-50 p-4">
              <div className="text-sm font-medium text-yellow-600">Paused</div>
              <div className="text-2xl font-bold text-yellow-700">{intradaySummary.pausedStocks}</div>
            </div>
            <div className="rounded-lg border bg-blue-50 p-4">
              <div className="text-sm font-medium text-blue-600">Opportunities (90d)</div>
              <div className="text-2xl font-bold text-blue-700">{intradaySummary.totalOpportunities}</div>
            </div>
            <div className="rounded-lg border bg-purple-50 p-4">
              <div className="text-sm font-medium text-purple-600">Avg Score</div>
              <div className="text-2xl font-bold text-purple-700">{intradaySummary.avgScore}/100</div>
            </div>
          </div>

          {/* Stock Table */}
          <div className="rounded-lg border bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Symbol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sector
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Opportunities
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days Active
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {intradayStocks.map((stock) => {
                    const tier = getPerformanceTier(stock.opps_90d);
                    const colorClass = getPerformanceColor(tier);

                    return (
                      <tr key={stock.symbol} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">{stock.symbol}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{stock.company_name || '—'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{stock.sector}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              stock.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {stock.is_active ? '🟢 Active' : '🟡 Paused'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium px-2 py-1 rounded ${colorClass}`}>
                            {stock.opps_7d} / {stock.opps_30d} / {stock.opps_90d}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">7 / 30 / 90 days</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {stock.avg_score}/100
                          </div>
                          {stock.max_score && (
                            <div className="text-xs text-gray-500">Max: {stock.max_score}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{stock.days_active}</div>
                          <div className="text-xs text-gray-500">of 90 days</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {stock.is_active && (
                            <button
                              onClick={() => handlePauseIntraday(stock.symbol)}
                              className="text-yellow-600 hover:text-yellow-900 font-medium"
                            >
                              ⏸️ Pause
                            </button>
                          )}
                          {!stock.is_active && (
                            <button
                              onClick={() => handleResumeIntraday(stock.symbol)}
                              className="text-green-600 hover:text-green-900 font-medium"
                            >
                              ▶️ Resume
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            💡 <strong>Tip:</strong> Paused stocks are excluded from the next scan (every 5 minutes during market hours).
            Changes take effect within 5 minutes.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
