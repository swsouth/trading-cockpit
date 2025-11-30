'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center px-4">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          Something went wrong!
        </h2>
        <p className="text-slate-600 mb-6">
          {error.message || 'An unexpected error occurred'}
        </p>
        <Button
          onClick={reset}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          Try again
        </Button>
      </div>
    </div>
  );
}
