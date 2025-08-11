
"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence, type User } from 'firebase/auth';
import { app } from '@/lib/firebase/client';

type FirebaseContextType = {
  auth: ReturnType<typeof getAuth>;
  user: User | null;
  isLoading: boolean;
};

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === null) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const FirebaseProvider = ({ children }: { children: React.ReactNode }) => {
  const [auth] = useState(() => getAuth(app));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set session persistence and listen for auth state changes
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setUser(user);
          setIsLoading(false);
        });
        return unsubscribe;
      })
      .catch((error) => {
        console.error("Error setting auth persistence:", error);
        setIsLoading(false);
      });
  }, [auth]);

  const value = {
    auth,
    user,
    isLoading,
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};
