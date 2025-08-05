
"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

type SupabaseContextType = {
  supabase: SupabaseClient | null;
  session: Session | null;
  user: User | null;
  isLoading: boolean;
};

const SupabaseContext = createContext<SupabaseContextType | null>(null);

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === null) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

const isSupabaseConfigured = () => {
    return (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL !== 'YOUR_SUPABASE_URL' &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY'
    );
};


export const SupabaseProvider = ({ children }: { children: React.ReactNode }) => {
  const [supabase] = useState(() => isSupabaseConfigured() ? createClient() : null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
        setIsLoading(false);
        return;
    }
  
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setIsLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase]);

  const value = {
    supabase,
    session,
    user: session?.user ?? null,
    isLoading,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};
