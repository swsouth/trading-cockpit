'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TradingViewWidget from './TradingViewWidget';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export interface TradingViewModalProps {
  symbol: string;
  isOpen: boolean;
  onClose: () => void;
  companyName?: string;
  currentPrice?: number;
  changePercent?: number;
}

/**
 * Full-Screen TradingView Chart Modal
 *
 * Opens a responsive modal with an advanced TradingView chart
 * Mobile-friendly with proper sizing
 *
 * @example
 * const [isOpen, setIsOpen] = useState(false);
 * <TradingViewModal
 *   symbol="NASDAQ:AAPL"
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   companyName="Apple Inc."
 *   currentPrice={175.23}
 *   changePercent={2.3}
 * />
 */
export default function TradingViewModal({
  symbol,
  isOpen,
  onClose,
  companyName,
  currentPrice,
  changePercent,
}: TradingViewModalProps) {
  // Format symbol for TradingView (add exchange prefix if not present)
  const formattedSymbol = symbol.includes(':') ? symbol : `NASDAQ:${symbol}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] md:max-w-6xl md:h-[85vh] p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-2 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg md:text-xl font-bold">
                {symbol}
                {companyName && (
                  <span className="ml-2 text-sm md:text-base font-normal text-gray-600">
                    {companyName}
                  </span>
                )}
              </DialogTitle>
              {currentPrice !== undefined && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xl md:text-2xl font-semibold">
                    ${currentPrice.toFixed(2)}
                  </span>
                  {changePercent !== undefined && (
                    <span
                      className={`text-sm md:text-base font-medium ${
                        changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {changePercent >= 0 ? '+' : ''}
                      {changePercent.toFixed(2)}%
                    </span>
                  )}
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.open(
                  `https://www.tradingview.com/chart/?symbol=${formattedSymbol}`,
                  '_blank'
                )
              }
              className="hidden md:flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open in TradingView
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-4">
          <TradingViewWidget
            symbol={formattedSymbol}
            theme="light"
            interval="D"
            autosize={true}
            allow_symbol_change={true}
            hide_top_toolbar={false}
            hide_side_toolbar={false}
            save_image={true}
            show_popup_button={false}
            className="h-full"
          />
        </div>

        {/* Mobile: Show TradingView link at bottom */}
        <div className="md:hidden px-4 pb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(
                `https://www.tradingview.com/chart/?symbol=${formattedSymbol}`,
                '_blank'
              )
            }
            className="w-full flex items-center justify-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Open in TradingView
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
