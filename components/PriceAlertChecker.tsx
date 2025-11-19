'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getQuote } from '@/lib/marketData';
import { PriceAlert } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/AuthContext';

export function PriceAlertChecker() {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    async function checkAlerts() {
      if (!user) return;

      try {
        const { data: alerts, error } = await supabase
          .from('price_alerts')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (error || !alerts) return;

        const symbolSet = new Set<string>();
        alerts.forEach((a) => symbolSet.add(a.symbol));
        const uniqueSymbols = Array.from(symbolSet);

        for (const symbol of uniqueSymbols) {
          try {
            const quote = await getQuote(symbol);
            const symbolAlerts = alerts.filter((a) => a.symbol === symbol);

            for (const alert of symbolAlerts) {
              const shouldTrigger =
                (alert.direction === 'above' && quote.price >= alert.target_price) ||
                (alert.direction === 'below' && quote.price <= alert.target_price);

              if (shouldTrigger) {
                await supabase
                  .from('price_alerts')
                  .update({
                    is_active: false,
                    triggered_at: new Date().toISOString(),
                  })
                  .eq('id', alert.id);

                toast({
                  title: `Price Alert: ${symbol}`,
                  description: `${symbol} is now ${alert.direction} $${alert.target_price.toFixed(2)} at $${quote.price.toFixed(2)}`,
                });

                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification(`Price Alert: ${symbol}`, {
                    body: `${symbol} is now ${alert.direction} $${alert.target_price.toFixed(2)} at $${quote.price.toFixed(2)}`,
                  });
                }
              }
            }
          } catch (error) {
            console.error(`Error checking alerts for ${symbol}:`, error);
          }
        }
      } catch (error) {
        console.error('Error checking alerts:', error);
      }
    }

    const interval = setInterval(checkAlerts, 60000);
    checkAlerts();

    return () => clearInterval(interval);
  }, [user, toast]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return null;
}
