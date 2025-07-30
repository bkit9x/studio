import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'FinTrack - Quản lý chi tiêu',
  description: 'Ứng dụng quản lý chi tiêu cá nhân thông minh',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={cn(
          "min-h-screen bg-background font-body antialiased"
      )}>
        <div className="relative flex min-h-screen flex-col">
          <main className="flex-1 pb-24">{children}</main>
        </div>
        <BottomNav />
        <Toaster />
      </body>
    </html>
  );
}
