/**
 * Mission Control Dashboard
 *
 * NEW: Replaces watchlist-only homepage with actionable command center
 * Shows: Performance, Top Opportunities, Active Positions, Watchlist
 *
 * Visual Hierarchy:
 * 1. Performance Header (HERO - largest, most prominent)
 * 2. Opportunities + Positions (SECONDARY - two-column grid)
 * 3. Compact Watchlist (TERTIARY - minimal visual weight)
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { PerformanceHeader } from '@/components/dashboard/PerformanceHeader';
import { TopOpportunities } from '@/components/dashboard/TopOpportunities';
import { ActivePositionsSummary } from '@/components/dashboard/ActivePositionsSummary';
import { CompactWatchlist } from '@/components/dashboard/CompactWatchlist';
import { useToast } from '@/hooks/use-toast';

interface DashboardData {
  performance: {
    totalPL: number;
    todaysPL: number;
    winRate: number;
    openPositions: number;
  };
  topOpportunities: any[];
  activePositions: any[];
  scanStatus: {
    lastScan: string | null;
    nextScan: string | null;
    opportunitiesFound: number;
  };
}

export function MissionControlDashboard() {
  const { user, getAccessToken } = useAuth();
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchWatchlist();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = await getAccessToken();
      const response = await fetch('/api/dashboard/summary', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard summary');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWatchlist = async () => {
    try {
      const token = await getAccessToken();
      const response = await fetch('/api/watchlist', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch watchlist');
      }

      const data = await response.json();
      setWatchlist(data);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    }
  };

  const handleClosePosition = async (positionId: string) => {
    try {
      const token = await getAccessToken();
      const response = await fetch(`/api/paper-trading/positions/${positionId}/close`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to close position');
      }

      toast({
        title: 'Success',
        description: 'Position closed successfully',
      });

      // Refresh dashboard data
      fetchDashboardData();
    } catch (error) {
      console.error('Error closing position:', error);
      toast({
        title: 'Error',
        description: 'Failed to close position',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-pulse text-muted-foreground">
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Failed to load dashboard</p>
          <button
            onClick={fetchDashboardData}
            className="text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Mission Control</h1>
        <p className="text-muted-foreground mt-1">
          Your trading command center
        </p>
      </div>

      {/* HERO: Performance Header */}
      <div className="mb-6">
        <PerformanceHeader
          totalPL={dashboardData.performance.totalPL}
          todaysPL={dashboardData.performance.todaysPL}
          winRate={dashboardData.performance.winRate}
          openPositions={dashboardData.performance.openPositions}
        />
      </div>

      {/* SECONDARY: Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left Column: Top Opportunities */}
        <TopOpportunities recommendations={dashboardData.topOpportunities} />

        {/* Right Column: Active Positions */}
        <ActivePositionsSummary
          positions={dashboardData.activePositions}
          onClosePosition={handleClosePosition}
        />
      </div>

      {/* TERTIARY: Compact Watchlist */}
      <div>
        <CompactWatchlist symbols={watchlist} />
      </div>

      {/* Scan Status Footer (Optional) */}
      {dashboardData.scanStatus.lastScan && (
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Last market scan: {new Date(dashboardData.scanStatus.lastScan).toLocaleString()} •
            {dashboardData.scanStatus.opportunitiesFound} opportunities found
          </p>
        </div>
      )}
    </div>
  );
}
