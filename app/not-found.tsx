'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center px-4">
        <h2 className="text-6xl font-bold text-slate-900 mb-4">404</h2>
        <p className="text-xl text-slate-600 mb-2">Page Not Found</p>
        <p className="text-slate-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
