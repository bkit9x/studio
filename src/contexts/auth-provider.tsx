
"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence, type User, getRedirectResult, getAdditionalUserInfo } from 'firebase/auth';
import { app } from '@/lib/firebase/client';
import { seedInitialDataForUser } from '@/hooks/use-firebase-data';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

type FirebaseContextType = {
  auth: ReturnType<typeof getAuth>;
  user: User | null;
  isLoading: boolean;
  isProcessingRedirect: boolean;
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
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);
  const { toast } = useToast();
  const router = useRouter();


  useEffect(() => {
    // Process redirect result first
    getRedirectResult(auth)
      .then(async (userCredential) => {
        if (userCredential) {
          const additionalInfo = getAdditionalUserInfo(userCredential);
          if (additionalInfo?.isNewUser) {
            await seedInitialDataForUser(userCredential.user.uid);
            toast({ title: 'Chào mừng bạn!', description: 'Tài khoản của bạn đã được tạo.' });
          } else {
            toast({ title: 'Chào mừng trở lại!', description: 'Đã đăng nhập thành công.' });
          }
          router.push('/');
        }
        setIsProcessingRedirect(false);
      })
      .catch((error) => {
        console.error("Error processing redirect result:", error);
        toast({ variant: 'destructive', title: 'Đăng nhập Google thất bại', description: error.message });
        setIsProcessingRedirect(false);
      });

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
  }, [auth, router, toast]);

  const value = {
    auth,
    user,
    isLoading: isLoading || isProcessingRedirect, // Combine loading states
    isProcessingRedirect,
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};
