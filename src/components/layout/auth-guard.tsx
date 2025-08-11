
"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useFirebase } from '@/contexts/auth-provider';
import { Skeleton } from '../ui/skeleton';

const AUTH_ROUTES = ['/auth'];
const PUBLIC_ROUTES = ['/auth']; // Extend this if there are other public pages

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useFirebase();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    const isAuthRoute = AUTH_ROUTES.includes(pathname);
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (!user && !isPublicRoute) {
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
  
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // If the user is not logged in and it's not a public route, don't render children
  if (!user && !isPublicRoute) {
    return null;
  }


  return <>{children}</>;
}
