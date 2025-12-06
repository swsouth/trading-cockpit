'use client';

import { MissionControlDashboard } from '@/components/MissionControlDashboard';
import { LandingPage } from '@/components/LandingPage';
import { useAuth } from '@/lib/AuthContext';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch - show nothing until mounted
  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show landing page for non-authenticated users
  if (!user) {
    return <LandingPage />;
  }

  // Show Mission Control Dashboard for authenticated users (NEW UX)
  return <MissionControlDashboard />;
}
