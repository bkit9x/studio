
"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useFirebase } from '@/contexts/auth-provider';
import type { Wallet, Tag, Transaction } from '@/lib/types';
import { useToast } from './use-toast';
import { mockTags, mockWallets } from '@/data/mock-data';

// Custom event to notify other components that data has changed
const dispatchDataChangeEvent = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app-data-change'));
  }
};

const seedInitialData = async (userId: string) => {
    const batch = writeBatch(db);

    // Seed Wallets
    mockWallets.forEach(wallet => {
        const { id, ...rest } = wallet;
        const walletRef = doc(collection(db, `users/${userId}/wallets`));
        batch.set(walletRef, { ...rest, createdAt: serverTimestamp() });
    });

    // Seed Tags
    mockTags.forEach(tag => {
        const { id, ...rest } = tag;
        const tagRef = doc(collection(db, `users/${userId}/tags`));
        batch.set(tagRef, { ...rest, createdAt: serverTimestamp() });
    });
    
    await batch.commit();
}


export function useFirebaseData() {
  const { user } = useFirebase();
  const { toast } = useToast();
  
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) {
      setWallets([]);
      setTags([]);
      setTransactions([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);

    const collections = ['wallets', 'tags', 'transactions'];
    const unsubscribes = collections.map(colName => {
        const q = query(
            collection(db, `users/${user.uid}/${colName}`), 
            orderBy('createdAt', colName === 'transactions' ? 'desc' : 'asc')
        );

        return onSnapshot(q, (querySnapshot) => {
            if (colName === 'wallets' && querySnapshot.empty) {
                // If user has no wallets, they are likely new. Seed initial data.
                seedInitialData(user.uid).catch(err => {
                    toast({ variant: 'destructive', title: 'Lỗi tạo dữ liệu mẫu', description: (err as Error).message });
                });
            }
        
            const data = querySnapshot.docs.map(doc => {
                const docData = doc.data();
                // Convert Firestore Timestamps to JS Date objects
                if (docData.createdAt instanceof Timestamp) {
                    docData.createdAt = docData.createdAt.toDate();
                }
                return { id: doc.id, ...docData } as any;
            });
            
            switch (colName) {
                case 'wallets':
                    setWallets(data);
                    break;
                case 'tags':
                    setTags(data);
                    break;
                case 'transactions':
                    setTransactions(data);
                    break;
            }
            setIsLoading(false);
        }, (error) => {
            console.error(`Error fetching ${colName}:`, error);
            toast({ variant: 'destructive', title: `Lỗi tải ${colName}`, description: error.message });
            setIsLoading(false);
        });
    });

    // Cleanup function
    return () => unsubscribes.forEach(unsub => unsub());

  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const clearAllData = async () => {
    if (!user) throw new Error("User not authenticated");
    
    const batch = writeBatch(db);
    
    wallets.forEach(w => batch.delete(doc(db, `users/${user.uid}/wallets`, w.id)));
    tags.forEach(t => batch.delete(doc(db, `users/${user.uid}/tags`, t.id)));
    transactions.forEach(tx => batch.delete(doc(db, `users/${user.uid}/transactions`, tx.id)));
    
    await batch.commit();
    // Snapshot listener will update the UI automatically
  };

  const bulkInsert = async (
    newWallets: Wallet[],
    newTags: Tag[],
    newTransactions: Transaction[]
  ) => {
    if (!user) throw new Error("User not authenticated");

    await clearAllData();
    
    const batch = writeBatch(db);

    newWallets.forEach(w => {
        const { id, ...data } = w;
        const ref = doc(collection(db, `users/${user.uid}/wallets`));
        batch.set(ref, { ...data, createdAt: new Date(w.createdAt) });
    });
    newTags.forEach(t => {
        const { id, ...data } = t;
        const ref = doc(collection(db, `users/${user.uid}/tags`));
        batch.set(ref, { ...data, createdAt: new Date(t.createdAt) });
    });
    newTransactions.forEach(tx => {
        const { id, ...data } = tx;
        const ref = doc(collection(db, `users/${user.uid}/transactions`));
        batch.set(ref, { ...data, createdAt: new Date(tx.createdAt) });
    });

    await batch.commit();
    // Snapshot listener will update the UI
  };

  return { wallets, tags, transactions, isLoading, clearAllData, bulkInsert };
}


export function useFirestoreTable<T extends { id: string, [key: string]: any }>(collectionName: string) {
    const { user } = useFirebase();
    const { toast } = useToast();

    const getCollectionRef = () => {
        if (!user) throw new Error("User not authenticated.");
        return collection(db, `users/${user.uid}/${collectionName}`);
    }

    const addItem = async (item: Omit<T, 'id' | 'createdAt'>) => {
        try {
            await addDoc(getCollectionRef(), { ...item, createdAt: serverTimestamp() });
        } catch (error) {
            console.error(`Error adding item to ${collectionName}:`, error);
            toast({ variant: 'destructive', title: `Lỗi thêm ${collectionName}`, description: (error as Error).message });
        }
    };
    
    const updateItem = async (id: string, updates: Partial<Omit<T, 'id' | 'createdAt'>>) => {
        if (!user) throw new Error("User not authenticated.");
        try {
            const docRef = doc(db, `users/${user.uid}/${collectionName}`, id);
            await updateDoc(docRef, updates);
        } catch (error) {
            console.error(`Error updating item in ${collectionName}:`, error);
            toast({ variant: 'destructive', title: `Lỗi cập nhật ${collectionName}`, description: (error as Error).message });
        }
    };

    const deleteItem = async (id: string) => {
       if (!user) throw new Error("User not authenticated.");
        try {
            const docRef = doc(db, `users/${user.uid}/${collectionName}`, id);
            await deleteDoc(docRef);
        } catch (error) {
             console.error(`Error deleting item from ${collectionName}:`, error);
             toast({ variant: 'destructive', title: `Lỗi xóa ${collectionName}`, description: (error as Error).message });
        }
    };
    
    const bulkDelete = async (ids: string[]) => {
        if (!user) throw new Error("User not authenticated.");
        const batch = writeBatch(db);
        ids.forEach(id => {
            const docRef = doc(db, `users/${user.uid}/${collectionName}`, id);
            batch.delete(docRef);
        });
        try {
            await batch.commit();
        } catch (error) {
            console.error(`Error bulk deleting from ${collectionName}:`, error);
            toast({ variant: 'destructive', title: `Lỗi xóa nhiều ${collectionName}`, description: (error as Error).message });
        }
    }

    return { addItem, updateItem, deleteItem, bulkDelete };
}
