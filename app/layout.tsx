import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { LayoutContent } from '@/components/LayoutContent';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/lib/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Stock Trading Cockpit',
  description: 'Personal stock trading analysis dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
