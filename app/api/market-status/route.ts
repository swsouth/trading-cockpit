/**
 * Market Status API Endpoint
 *
 * Returns current market hours status (open/closed)
 */

import { NextResponse } from 'next/server';

function getMarketStatus(): {
  isOpen: boolean;
  status: 'open' | 'closed' | 'pre-market' | 'after-hours';
  message: string;
  minutesUntilChange?: number;
} {
  const now = new Date();
  const etTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));

  const day = etTime.getDay();
  const hours = etTime.getHours();
  const minutes = etTime.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const marketOpen = 9 * 60 + 30; // 9:30 AM
  const marketClose = 16 * 60; // 4:00 PM

  // Weekend
  if (day === 0 || day === 6) {
    return {
      isOpen: false,
      status: 'closed',
      message: `Market closed (weekend). Opens Monday 9:30 AM ET`,
    };
  }

  // Market open
  if (totalMinutes >= marketOpen && totalMinutes < marketClose) {
    const minutesUntilClose = marketClose - totalMinutes;
    return {
      isOpen: true,
      status: 'open',
      message: `Market open. Closes at 4:00 PM ET`,
      minutesUntilChange: minutesUntilClose,
    };
  }

  // Pre-market (before 9:30 AM)
  if (totalMinutes < marketOpen) {
    const minutesUntilOpen = marketOpen - totalMinutes;
    return {
      isOpen: false,
      status: 'pre-market',
      message: `Market opens at 9:30 AM ET`,
      minutesUntilChange: minutesUntilOpen,
    };
  }

  // After-hours (after 4:00 PM)
  return {
    isOpen: false,
    status: 'after-hours',
    message: `Market closed. Opens tomorrow 9:30 AM ET`,
  };
}

export async function GET() {
  try {
    const status = getMarketStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error getting market status:', error);
    return NextResponse.json(
      { error: 'Failed to get market status' },
      { status: 500 }
    );
  }
}
