
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  query,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  orderBy,
  Timestamp,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useFirebase } from '@/contexts/auth-provider';
import type { Wallet, Tag, Transaction } from '@/lib/types';
import { useToast } from './use-toast';
import { mockTags, mockWallets } from '@/data/mock-data';

export const seedInitialDataForUser = async (userId: string) => {
    // Check if data already exists to be absolutely sure
    const walletsCheckRef = collection(db, `users/${userId}/wallets`);
    const walletsCheckSnapshot = await getDocs(query(walletsCheckRef));
    if (!walletsCheckSnapshot.empty) {
      console.log("Data already exists for this user. Skipping seed.");
      return;
    }

    const batch = writeBatch(db);

    mockWallets.forEach(wallet => {
        const walletRef = doc(collection(db, `users/${userId}/wallets`));
        batch.set(walletRef, { ...wallet, createdAt: serverTimestamp() });
    });

    mockTags.forEach(tag => {
        const tagRef = doc(collection(db, `users/${userId}/tags`));
        batch.set(tagRef, { ...tag, createdAt: serverTimestamp() });
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

  useEffect(() => {
    if (!user) {
      setWallets([]);
      setTags([]);
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    const unsubscribes = ['wallets', 'tags', 'transactions'].map(colName => {
        const q = query(
            collection(db, `users/${user.uid}/${colName}`), 
            orderBy('createdAt', colName === 'transactions' ? 'desc' : 'asc')
        );

        return onSnapshot(q, (querySnapshot) => {
             const data = querySnapshot.docs.map(doc => {
                const docData = doc.data();
                // Firestore Timestamps need to be converted to JS Dates
                for (const key in docData) {
                    if (docData[key] instanceof Timestamp) {
                       docData[key] = docData[key].toDate();
                    }
                }
                return { id: doc.id, ...docData } as any;
            });
            
            if (colName === 'wallets') setWallets(data);
            if (colName === 'tags') setTags(data);
            if (colName === 'transactions') setTransactions(data);

            setIsLoading(false);

        }, (error) => {
            console.error(`Error fetching ${colName}:`, error);
            toast({ variant: 'destructive', title: `Lỗi tải ${colName}`, description: error.message });
            setIsLoading(false);
        });
    });

    return () => unsubscribes.forEach(unsub => unsub());

  }, [user, toast]);
  
  const clearAllData = async () => {
    if (!user) throw new Error("User not authenticated");
    
    const batch = writeBatch(db);
    
    // Fetch all document IDs to delete
    const walletsSnapshot = await getDocs(collection(db, `users/${user.uid}/wallets`));
    walletsSnapshot.forEach(doc => batch.delete(doc.ref));

    const tagsSnapshot = await getDocs(collection(db, `users/${user.uid}/tags`));
    tagsSnapshot.forEach(doc => batch.delete(doc.ref));

    const transactionsSnapshot = await getDocs(collection(db, `users/${user.uid}/transactions`));
    transactionsSnapshot.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();
  };

  const bulkInsert = async (
    newWallets: Omit<Wallet, 'id'>[],
    newTags: Omit<Tag, 'id'>[],
    newTransactions: Omit<Transaction, 'id'>[]
  ) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
        await clearAllData();

        const batch = writeBatch(db);

        // Process Wallets and Tags first to get their new IDs if needed
        newWallets.forEach(wallet => {
            const walletRef = doc(collection(db, `users/${user.uid}/wallets`));
            batch.set(walletRef, { ...wallet, createdAt: serverTimestamp() });
        });

        newTags.forEach(tag => {
            const tagRef = doc(collection(db, `users/${user.uid}/tags`));
            batch.set(tagRef, { ...tag, createdAt: serverTimestamp() });
        });
        
        // Process Transactions
        newTransactions.forEach(transaction => {
            const transactionRef = doc(collection(db, `users/${user.uid}/transactions`));
            
            let finalDate: Timestamp;
            const rawDate = transaction.createdAt;

            if (rawDate && typeof rawDate === 'object' && 'seconds' in rawDate && 'nanoseconds' in rawDate) {
                finalDate = new Timestamp((rawDate as any).seconds, (rawDate as any).nanoseconds);
            } else if (typeof rawDate === 'string' && new Date(rawDate).toString() !== 'Invalid Date') {
                finalDate = Timestamp.fromDate(new Date(rawDate));
            } else if (rawDate instanceof Date) {
                finalDate = Timestamp.fromDate(rawDate);
            } else {
                 throw new Error(`Định dạng ngày không hợp lệ cho giao dịch: ${transaction.description}`);
            }
            
            const finalTransaction = {
                ...transaction,
                createdAt: finalDate,
            };

            batch.set(transactionRef, finalTransaction);
        });
        
        await batch.commit();
    } catch (error) {
        console.error("Lỗi trong quá trình nhập dữ liệu:", error);
        throw error; // Re-throw the error to be caught in the component
    }
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
