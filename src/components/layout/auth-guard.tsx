
"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSupabase } from '@/contexts/auth-provider';
import { Skeleton } from '../ui/skeleton';

const AUTH_ROUTES = ['/auth'];
const PUBLIC_ROUTES = ['/']; // Adjust if you have more public routes

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useSupabase();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    const isAuthRoute = AUTH_ROUTES.includes(pathname);
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname) && !isAuthRoute;

    if (!session && !isAuthRoute) {
      router.push('/auth');
    }

    if (session && isAuthRoute) {
      router.push('/');
    }
  }, [session, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="w-full max-w-md space-y-4 p-4">
           <Skeleton className="h-12 w-full" />
           <Skeleton className="h-10 w-full" />
           <Skeleton className="h-10 w-full" />
           <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  // If on an auth route, don't show the main layout, just the auth page children
  if (AUTH_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }


  return <>{children}</>;
}
