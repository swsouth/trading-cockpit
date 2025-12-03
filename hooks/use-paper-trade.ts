/**
 * Paper Trading Hook
 * Handles paper trade execution via Alpaca MCP
 */

import { useState } from 'react';
import { TradeRecommendation } from '@/lib/types';
import { validateTrade, formatTradeSummary } from '@/lib/paperTrade';
import { fetchLiveQuote, validateEntryPrice, getRecommendedOrderType } from '@/lib/liveQuote';
import { isMarketOpen } from '@/lib/marketHours';
import { useToast } from '@/hooks/use-toast';

interface UsePaperTradeOptions {
  accountEquity?: number;
  riskPercent?: number;
}

export interface PaperTradePrep {
  recommendation: TradeRecommendation;
  shares: number;
  costBasis: number;
  dollarRisk: number;
  currentPrice?: number;
  priceDeviation?: number;
  marketWarning?: string;
  orderType: 'limit' | 'market' | 'stop-limit';
  limitPrice?: number;
}

export function usePaperTrade(options: UsePaperTradeOptions = {}) {
  const { accountEquity = 100000, riskPercent = 1 } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [tradePrep, setTradePrep] = useState<PaperTradePrep | null>(null);
  const { toast } = useToast();

  const preparePaperTrade = async (recommendation: TradeRecommendation): Promise<PaperTradePrep | null> => {
    setIsLoading(true);

    try {
      // Step 1: Check market hours
      const marketStatus = isMarketOpen();
      let marketWarning: string | undefined;

      if (!marketStatus.isOpen) {
        marketWarning = marketStatus.warning;

        toast({
          title: `⏰ Market ${marketStatus.status}`,
          description: marketStatus.warning,
          variant: 'default',
          duration: 6000,
        });
      }

      // Step 2: Fetch live quote
      let currentPrice: number | undefined;
      let priceDeviation: number | undefined;

      try {
        const quote = await fetchLiveQuote(recommendation.symbol);
        currentPrice = quote.price;

        // Validate entry price vs current market price
        const priceValidation = validateEntryPrice(
          recommendation.entry_price,
          quote.price,
          recommendation.recommendation_type
        );

        if (priceValidation.warning) {
          toast({
            title: '⚠️ Price Alert',
            description: priceValidation.warning,
            variant: 'default',
            duration: 8000,
          });

          if (!marketWarning) {
            marketWarning = priceValidation.warning;
          }
        }

        priceDeviation = priceValidation.deviationPercent;

        // If price deviated too much, warn and abort
        if (priceValidation.deviationPercent > 10) {
          toast({
            title: '❌ Setup Invalidated',
            description: `Price moved ${priceValidation.deviationPercent.toFixed(1)}% since scanner ran. Setup is no longer valid.`,
            variant: 'destructive',
          });
          setIsLoading(false);
          return null;
        }
      } catch (quoteError) {
        console.warn('Could not fetch live quote, using scanner price:', quoteError);
        // Continue with scanner price if quote fails
      }

      // Step 3: Validate the trade
      const validation = validateTrade({
        symbol: recommendation.symbol,
        recommendationType: recommendation.recommendation_type,
        entryPrice: recommendation.entry_price,
        stopPrice: recommendation.stop_loss,
        targetPrice: recommendation.target_price,
        accountEquity,
        riskPercent,
      });

      if (!validation.valid || !validation.shares || !validation.costBasis || !validation.dollarRisk) {
        toast({
          title: '❌ Trade Validation Failed',
          description: validation.error || 'Invalid trade parameters',
          variant: 'destructive',
        });
        setIsLoading(false);
        return null;
      }

      // Step 4: Determine recommended order type
      const orderRecommendation = getRecommendedOrderType(
        recommendation.entry_price,
        currentPrice || recommendation.entry_price,
        recommendation.recommendation_type
      );

      // Create trade preparation object
      const prep: PaperTradePrep = {
        recommendation,
        shares: validation.shares,
        costBasis: validation.costBasis,
        dollarRisk: validation.dollarRisk,
        currentPrice,
        priceDeviation,
        marketWarning,
        orderType: orderRecommendation.orderType,
        limitPrice: orderRecommendation.limitPrice,
      };

      setTradePrep(prep);
      setIsLoading(false);

      return prep;

    } catch (error) {
      console.error('❌ Paper trade prep error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';

      toast({
        title: '❌ Trade Preparation Failed',
        description: message,
        variant: 'destructive',
      });

      setIsLoading(false);
      return null;
    }
  };

  const executePaperTrade = async (prep: PaperTradePrep) => {
    try {
      const { recommendation, shares, costBasis, dollarRisk, orderType, limitPrice } = prep;

      // Log the trade summary
      const summary = formatTradeSummary({
        symbol: recommendation.symbol,
        shares,
        entryPrice: recommendation.entry_price,
        stopPrice: recommendation.stop_loss,
        targetPrice: recommendation.target_price,
        costBasis,
        dollarRisk,
        riskPercent,
      });

      console.log('📊 Paper Trade Summary:\n', summary);

      // Place order via API route that handles Alpaca MCP
      const orderPayload = {
        symbol: recommendation.symbol,
        side: recommendation.recommendation_type === 'long' ? 'buy' : 'sell',
        quantity: shares,
        order_type: orderType,
        limit_price: limitPrice || recommendation.entry_price, // Fallback to entry price
        entry_price: recommendation.entry_price, // For bracket order validation
        time_in_force: 'day',
        stop_loss: recommendation.stop_loss,
        target_price: recommendation.target_price,
      };

      console.log('📤 Placing order via API:', orderPayload);

      const response = await fetch('/api/paper-trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place paper trade order');
      }

      const result = await response.json();

      console.log('✅ Order placed successfully:', result);

      toast({
        title: '✅ Paper Trade Placed',
        description: `${shares} shares of ${recommendation.symbol} - Order ID: ${result.order_id}`,
        duration: 5000,
      });

      if (result.bracket_orders) {
        toast({
          title: '🎯 Bracket Orders Set',
          description: `Stop Loss @ $${recommendation.stop_loss.toFixed(2)}, Target @ $${recommendation.target_price.toFixed(2)}`,
          duration: 5000,
        });
      }

      return { success: true, order_id: result.order_id };

    } catch (error) {
      console.error('❌ Paper trade execution error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';

      toast({
        title: '❌ Execution Failed',
        description: message,
        variant: 'destructive',
      });

      return { success: false, error: message };
    }
  };

  return {
    preparePaperTrade,
    executePaperTrade,
    tradePrep,
    isLoading,
  };
}
