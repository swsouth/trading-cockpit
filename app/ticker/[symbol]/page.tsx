'use client';

import { TickerDetail } from '@/components/TickerDetail';
import { useParams } from 'next/navigation';

// Allow dynamic params at runtime (required for Bolt.new static export)
export const dynamicParams = true;

// Generate static params (empty for fully dynamic routing)
export function generateStaticParams() {
  return [];
}

export default function TickerPage() {
  const params = useParams();
  const symbol = params.symbol as string;

  return <TickerDetail symbol={symbol} />;
}
