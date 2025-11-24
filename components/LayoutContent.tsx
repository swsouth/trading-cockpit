'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { PriceAlertChecker } from '@/components/PriceAlertChecker';
import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Check if we're on an auth page or public page
  const isAuthPage = pathname?.startsWith('/auth');
  const isHomePage = pathname === '/';

  // Redirect to login if not authenticated and not on homepage or auth page
  useEffect(() => {
    if (!loading && !user && !isAuthPage && !isHomePage) {
      router.push('/auth/login');
    }
  }, [user, loading, isAuthPage, isHomePage, router]);

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

  // Auth pages have their own layout (no sidebar)
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Homepage for non-authenticated users (landing page, no sidebar)
  if (isHomePage && !user) {
    return <>{children}</>;
  }

  // Protected pages require authentication
  if (!user) {
    return null; // Will redirect in useEffect
  }

  // Main app layout with sidebar
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header with hamburger menu */}
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      <PriceAlertChecker />
    </div>
  );
}
