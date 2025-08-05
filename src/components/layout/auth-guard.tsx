
"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useFirebase } from '@/contexts/auth-provider';
import { Skeleton } from '../ui/skeleton';

const AUTH_ROUTES = ['/auth'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useFirebase();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    const isAuthRoute = AUTH_ROUTES.includes(pathname);

    if (!user && !isAuthRoute) {
      router.push('/auth');
    }

    if (user && isAuthRoute) {
      router.push('/');
    }
  }, [user, isLoading, router, pathname]);

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

  // If there's no user, children will be null to prevent flashing the main layout
  if (!user) {
    return null;
  }


  return <>{children}</>;
}
