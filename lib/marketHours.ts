/**
 * Market Hours Validation
 * Checks if US stock market is currently open
 */

export interface MarketStatus {
  isOpen: boolean;
  status: 'open' | 'closed' | 'pre-market' | 'post-market';
  nextOpen?: string;
  nextClose?: string;
  warning?: string;
}

/**
 * Check if US stock market is currently open
 * Market hours: 9:30 AM - 4:00 PM ET, Monday-Friday (excluding holidays)
 */
export function isMarketOpen(): MarketStatus {
  const now = new Date();

  // Convert to ET timezone
  const etTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = etTime.getDay(); // 0=Sunday, 6=Saturday
  const hours = etTime.getHours();
  const minutes = etTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // Weekend check
  if (day === 0 || day === 6) {
    return {
      isOpen: false,
      status: 'closed',
      nextOpen: getNextMonday(etTime),
      warning: 'Market is closed on weekends. Orders will queue until Monday 9:30 AM ET.',
    };
  }

  // Market hours: 9:30 AM - 4:00 PM ET
  const marketOpen = 9 * 60 + 30;  // 9:30 AM in minutes
  const marketClose = 16 * 60;     // 4:00 PM in minutes

  // Pre-market: 4:00 AM - 9:30 AM ET
  const preMarketStart = 4 * 60;   // 4:00 AM in minutes

  // Post-market: 4:00 PM - 8:00 PM ET
  const postMarketEnd = 20 * 60;   // 8:00 PM in minutes

  if (timeInMinutes >= marketOpen && timeInMinutes < marketClose) {
    // Regular market hours
    return {
      isOpen: true,
      status: 'open',
      nextClose: formatTime(16, 0),
    };
  } else if (timeInMinutes >= preMarketStart && timeInMinutes < marketOpen) {
    // Pre-market
    return {
      isOpen: false,
      status: 'pre-market',
      nextOpen: formatTime(9, 30),
      warning: 'Pre-market hours. Lower liquidity and wider spreads. Order will execute at market open (9:30 AM ET) if using limit orders.',
    };
  } else if (timeInMinutes >= marketClose && timeInMinutes < postMarketEnd) {
    // Post-market
    return {
      isOpen: false,
      status: 'post-market',
      nextOpen: getNextTradingDay(etTime),
      warning: 'Post-market hours. Lower liquidity and wider spreads. Order will queue until next trading day.',
    };
  } else {
    // After hours (8 PM - 4 AM ET)
    return {
      isOpen: false,
      status: 'closed',
      nextOpen: getNextTradingDay(etTime),
      warning: 'Market is closed. Order will queue until next trading day at 9:30 AM ET.',
    };
  }
}

/**
 * Get next Monday's open time
 */
function getNextMonday(date: Date): string {
  const next = new Date(date);
  next.setDate(next.getDate() + (1 + 7 - next.getDay()) % 7 || 7);
  return `Monday ${formatDate(next)} at 9:30 AM ET`;
}

/**
 * Get next trading day
 */
function getNextTradingDay(date: Date): string {
  const next = new Date(date);
  const day = next.getDay();

  if (day === 5) {
    // Friday evening -> Monday
    next.setDate(next.getDate() + 3);
  } else if (day === 6) {
    // Saturday -> Monday
    next.setDate(next.getDate() + 2);
  } else {
    // Weekday -> Next day
    next.setDate(next.getDate() + 1);
  }

  return `${formatDate(next)} at 9:30 AM ET`;
}

/**
 * Format time as HH:MM AM/PM
 */
function formatTime(hours: number, minutes: number): string {
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${period} ET`;
}

/**
 * Format date as Day, Mon DD
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/New_York',
  });
}

/**
 * Check if given date is a US market holiday
 * Note: This is a simplified check. For production, use an API or comprehensive holiday list.
 */
export function isMarketHoliday(date: Date = new Date()): boolean {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Simplified holiday check (major US holidays)
  const holidays = [
    { month: 0, day: 1 },   // New Year's Day
    { month: 6, day: 4 },   // Independence Day
    { month: 11, day: 25 }, // Christmas
  ];

  return holidays.some(h => h.month === month && h.day === day);
}
