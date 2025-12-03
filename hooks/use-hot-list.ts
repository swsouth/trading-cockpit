'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';

export interface HotListItem {
  hot_list_id: string;
  recommendation_id: string;
  pinned_at: string;
  notes?: string;
}

export function useHotList() {
  const { user, session } = useAuth();
  const [isPinning, setIsPinning] = useState(false);
  const [isUnpinning, setIsUnpinning] = useState(false);

  /**
   * Check if a recommendation is in the hot list
   */
  const isPinned = useCallback(
    async (recommendationId: string): Promise<boolean> => {
      if (!user || !session) return false;

      try {
        const token = session.access_token;
        const response = await fetch('/api/hot-list', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return false;

        const data = await response.json();
        return data.items.some((item: any) => item.id === recommendationId);
      } catch (error) {
        console.error('Error checking pin status:', error);
        return false;
      }
    },
    [user, session]
  );

  /**
   * Pin a recommendation to the hot list
   */
  const pinRecommendation = useCallback(
    async (recommendationId: string, notes?: string): Promise<{ success: boolean; error?: string }> => {
      if (!user || !session) {
        return { success: false, error: 'User not authenticated' };
      }

      setIsPinning(true);
      try {
        const token = session.access_token;
        const response = await fetch('/api/hot-list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            recommendation_id: recommendationId,
            notes,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: data.error || 'Failed to pin recommendation',
          };
        }

        return { success: true };
      } catch (error) {
        console.error('Error pinning recommendation:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      } finally {
        setIsPinning(false);
      }
    },
    [user, session]
  );

  /**
   * Unpin a recommendation from the hot list
   */
  const unpinRecommendation = useCallback(
    async (hotListId: string): Promise<{ success: boolean; error?: string }> => {
      if (!user || !session) {
        return { success: false, error: 'User not authenticated' };
      }

      setIsUnpinning(true);
      try {
        const token = session.access_token;
        const response = await fetch(`/api/hot-list?hot_list_id=${hotListId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const data = await response.json();
          return {
            success: false,
            error: data.error || 'Failed to unpin recommendation',
          };
        }

        return { success: true };
      } catch (error) {
        console.error('Error unpinning recommendation:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      } finally {
        setIsUnpinning(false);
      }
    },
    [user, session]
  );

  /**
   * Get all hot list items
   */
  const getHotList = useCallback(async (): Promise<{
    success: boolean;
    items?: any[];
    error?: string;
  }> => {
    if (!user || !session) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const token = session.access_token;
      const response = await fetch('/api/hot-list', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to fetch hot list',
        };
      }

      return {
        success: true,
        items: data.items,
      };
    } catch (error) {
      console.error('Error fetching hot list:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, [user, session]);

  return {
    isPinning,
    isUnpinning,
    isPinned,
    pinRecommendation,
    unpinRecommendation,
    getHotList,
  };
}
