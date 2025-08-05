
"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSupabase } from '@/contexts/auth-provider';
import { Skeleton } from '../ui/skeleton';

const AUTH_ROUTES = ['/auth'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { supabase, session, isLoading } = useSupabase();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading || !supabase) return;

    const isAuthRoute = AUTH_ROUTES.includes(pathname);

    if (!session && !isAuthRoute) {
      router.push('/auth');
    }

    if (session && isAuthRoute) {
      router.push('/');
    }
  }, [session, isLoading, router, pathname, supabase]);

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

  // If Supabase is not configured, we might show a message or just the children (which could be the login page)
  if (!supabase) {
      // You can add a message here to prompt the user to configure Supabase
       if (AUTH_ROUTES.includes(pathname)) {
        return <>{children}</>;
       }
       // Redirect to auth page if not configured and not on it
       if (!AUTH_ROUTES.includes(pathname)) {
           router.push('/auth');
       }
       return null; // Or a loading/configuration needed screen
  }


  // If on an auth route, don't show the main layout, just the auth page children
  if (AUTH_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }


  return <>{children}</>;
}
