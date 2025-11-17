'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { PriceAlertChecker } from '@/components/PriceAlertChecker';
import { useEffect } from 'react';

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  // Check if we're on an auth page
  const isAuthPage = pathname?.startsWith('/auth');

  // Redirect to login if not authenticated and not on auth page
  useEffect(() => {
    if (!loading && !user && !isAuthPage) {
      router.push('/auth/login');
    }
  }, [user, loading, isAuthPage, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Auth pages have their own layout
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Protected pages require authentication
  if (!user) {
    return null; // Will redirect in useEffect
  }

  // Main app layout with sidebar
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <PriceAlertChecker />
    </div>
  );
}
