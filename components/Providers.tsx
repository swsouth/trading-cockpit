'use client';

import { LayoutContent } from '@/components/LayoutContent';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/lib/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LayoutContent>{children}</LayoutContent>
      <Toaster />
    </AuthProvider>
  );
}
