'use client';

import { TickerDetail } from '@/components/TickerDetail';
import { useParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function TickerPage() {
  const params = useParams();
  const symbol = params.symbol as string;

  return <TickerDetail symbol={symbol} />;
}
