
"use client";

import { useState, useEffect } from 'react';
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
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useFirebase } from '@/contexts/auth-provider';
import type { Wallet, Tag, Transaction } from '@/lib/types';
import { useToast } from './use-toast';
import { mockTags, mockWallets } from '@/data/mock-data';

export const seedInitialDataForUser = async (userId: string) => {
    const walletsCheckRef = collection(db, `users/${userId}/wallets`);
    const walletsCheckSnapshot = await getDocs(query(walletsCheckRef));
    if (!walletsCheckSnapshot.empty) {
      console.log("Data already exists for this user. Skipping seed.");
      return;
    }

    const batch = writeBatch(db);

    mockWallets.forEach(wallet => {
        const walletRef = doc(collection(db, `users/${userId}/wallets`));
        const newWalletData = {
          ...wallet,
          balance: wallet.initialBalance,
          totalIncome: 0,
          totalExpense: 0,
          createdAt: serverTimestamp()
        };
        batch.set(walletRef, newWalletData);
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

    setIsLoading(true);
    const unsubscribes = ['wallets', 'tags', 'transactions'].map(colName => {
        const q = query(
            collection(db, `users/${user.uid}/${colName}`), 
            orderBy('createdAt', colName === 'transactions' ? 'desc' : 'asc')
        );

        return onSnapshot(q, (querySnapshot) => {
             const data = querySnapshot.docs.map(doc => {
                const docData = doc.data();
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
            
            if(wallets.length > 0 && tags.length > 0) {
              setIsLoading(false);
            }

        }, (error) => {
            console.error(`Error fetching ${colName}:`, error);
            toast({ variant: 'destructive', title: `Lỗi tải ${colName}`, description: error.message });
            setIsLoading(false);
        });
    });

    return () => unsubscribes.forEach(unsub => unsub());

  }, [user, toast, wallets.length, tags.length]);
  
  const clearAllData = async () => {
    if (!user) throw new Error("User not authenticated");
    
    const batch = writeBatch(db);
    
    const walletsSnapshot = await getDocs(collection(db, `users/${user.uid}/wallets`));
    walletsSnapshot.forEach(doc => batch.delete(doc.ref));

    const tagsSnapshot = await getDocs(collection(db, `users/${user.uid}/tags`));
    tagsSnapshot.forEach(doc => batch.delete(doc.ref));

    const transactionsSnapshot = await getDocs(collection(db, `users/${user.uid}/transactions`));
    transactionsSnapshot.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();
  };

 const bulkInsert = async (
    newWallets: Wallet[],
    newTags: Tag[],
    newTransactions: Transaction[]
  ) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
        await clearAllData();

        const batch = writeBatch(db);
        const oldToNewWalletIdMap = new Map<string, string>();
        const oldToNewTagIdMap = new Map<string, string>();

        for (const wallet of newWallets) {
            const oldId = wallet.id;
            const { id, ...walletData } = wallet;
            const newWalletRef = doc(collection(db, `users/${user.uid}/wallets`));
            
            const newWalletData = {
                ...walletData,
                balance: wallet.initialBalance,
                totalIncome: 0,
                totalExpense: 0,
                createdAt: serverTimestamp()
            };
            batch.set(newWalletRef, newWalletData);
            oldToNewWalletIdMap.set(oldId, newWalletRef.id);
        }

        for (const tag of newTags) {
            const oldId = tag.id;
            const { id, ...tagData } = tag;
            const newTagRef = doc(collection(db, `users/${user.uid}/tags`));
            batch.set(newTagRef, { ...tagData, createdAt: serverTimestamp() });
            oldToNewTagIdMap.set(oldId, newTagRef.id);
        }
        
        await batch.commit(); 
        
        const transactionBatch = writeBatch(db);

        const walletUpdates = new Map<string, { totalIncome: number, totalExpense: number, balance: number }>();

        for (const transaction of newTransactions) {
            const { id, ...transactionData } = transaction;

            const newWalletId = oldToNewWalletIdMap.get(transaction.walletId);
            const newTagId = oldToNewTagIdMap.get(transaction.tagId);

            if (!newWalletId || !newTagId) {
                console.warn(`Skipping transaction with missing wallet/tag: ${transaction.description}`);
                continue;
            }

            let finalDate: Timestamp;
            const rawDate = transaction.createdAt;

             if (rawDate && typeof rawDate === 'object' && 'seconds' in rawDate && !Array.isArray(rawDate) && !(rawDate instanceof Date)) {
                finalDate = new Timestamp((rawDate as any).seconds, (rawDate as any).nanoseconds);
            } else if (rawDate instanceof Date) {
                finalDate = Timestamp.fromDate(rawDate);
            } else if (typeof rawDate === 'string' && new Date(rawDate).toString() !== 'Invalid Date') {
                finalDate = Timestamp.fromDate(new Date(rawDate));
            } else {
                 console.error(`Invalid date format for transaction: ${transaction.description}`, rawDate);
                 continue;
            }
            
            const finalTransaction = {
                ...transactionData,
                walletId: newWalletId,
                tagId: newTagId,
                createdAt: finalDate,
            };

            const newTransactionRef = doc(collection(db, `users/${user.uid}/transactions`));
            transactionBatch.set(newTransactionRef, finalTransaction);

            const wallet = newWallets.find(w => w.id === transaction.walletId);
            if (wallet) {
                const updates = walletUpdates.get(newWalletId) || { totalIncome: 0, totalExpense: 0, balance: wallet.initialBalance };
                if (finalTransaction.type === 'income') {
                    updates.totalIncome += finalTransaction.amount;
                    updates.balance += finalTransaction.amount;
                } else {
                    updates.totalExpense += finalTransaction.amount;
                    updates.balance -= finalTransaction.amount;
                }
                walletUpdates.set(newWalletId, updates);
            }
        }
        
        for (const [walletId, updates] of walletUpdates.entries()) {
            const walletRef = doc(db, `users/${user.uid}/wallets`, walletId);
            transactionBatch.update(walletRef, updates);
        }
        
        await transactionBatch.commit();

    } catch (error: any) {
        console.error("Lỗi trong quá trình nhập dữ liệu:", error);
        toast({ variant: 'destructive', title: "Lỗi nhập dữ liệu", description: error.message || "Đã xảy ra lỗi không xác định." });
        throw error;
    }
  };

  return { wallets, tags, transactions, isLoading, clearAllData, bulkInsert };
}


const updateWalletBalance = async (
    userId: string,
    transaction: Transaction,
    operation: 'create' | 'delete'
) => {
    const walletRef = doc(db, `users/${userId}/wallets`, transaction.walletId);

    try {
        await runTransaction(db, async (t) => {
            const walletDoc = await t.get(walletRef);
            if (!walletDoc.exists()) {
                throw new Error("Ví không tồn tại.");
            }

            const walletData = walletDoc.data() as Wallet;

            // Initialize fields if they don't exist
            const currentBalance = walletData.balance ?? walletData.initialBalance ?? 0;
            const currentTotalIncome = walletData.totalIncome ?? 0;
            const currentTotalExpense = walletData.totalExpense ?? 0;
            
            let newBalance = currentBalance;
            let newTotalIncome = currentTotalIncome;
            let newTotalExpense = currentTotalExpense;

            const amount = transaction.amount;
            const type = transaction.type;

            if (operation === 'create') {
                if (type === 'income') {
                    newBalance += amount;
                    newTotalIncome += amount;
                } else {
                    newBalance -= amount;
                    newTotalExpense += amount;
                }
            } else { // delete
                if (type === 'income') {
                    newBalance -= amount;
                    newTotalIncome -= amount;
                } else {
                    newBalance += amount;
                    newTotalExpense -= amount;
                }
            }
            
            t.update(walletRef, { 
                balance: newBalance,
                totalIncome: newTotalIncome,
                totalExpense: newTotalExpense
            });
        });
    } catch (error) {
        console.error("Lỗi cập nhật số dư ví:", error);
        throw error; // Re-throw to be caught by the caller
    }
}


export function useFirestoreTable<T extends { id: string, [key: string]: any }>(collectionName: string) {
    const { user } = useFirebase();
    const { toast } = useToast();

    const getCollectionRef = () => {
        if (!user) throw new Error("User not authenticated.");
        return collection(db, `users/${user.uid}/${collectionName}`);
    }

    const addItem = async (item: Omit<T, 'id' | 'createdAt'>) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Lỗi', description: 'Người dùng chưa được xác thực.' });
            return null;
        }

        try {
            const newItem = { ...item, createdAt: serverTimestamp() };
            const docRef = await addDoc(getCollectionRef(), newItem);

            if (collectionName === 'transactions') {
                await updateWalletBalance(user.uid, { ...item, id: docRef.id } as Transaction, 'create');
            }

            return docRef.id;
        } catch (error) {
            console.error(`Error adding item to ${collectionName}:`, error);
            toast({ variant: 'destructive', title: `Lỗi thêm ${collectionName}`, description: (error as Error).message });
            return null;
        }
    };
    
    const updateItem = async (id: string, updates: Partial<Omit<T, 'id' | 'createdAt'>>) => {
        if (!user) throw new Error("User not authenticated.");
        
        // This is complex because we need the old transaction data to revert the balance correctly.
        // For now, we will prevent editing transactions that affect balance.
        // A full solution would require fetching the old doc inside a transaction.
        if (collectionName === 'transactions') {
            toast({ title: "Thông báo", description: "Chức năng chỉnh sửa giao dịch sẽ sớm được cập nhật." });
            return;
        }

        try {
            const docRef = doc(db, `users/${user.uid}/${collectionName}`, id);
            await updateDoc(docRef, updates);
        } catch (error) {
            console.error(`Error updating item in ${collectionName}:`, error);
            toast({ variant: 'destructive', title: `Lỗi cập nhật ${collectionName}`, description: (error as Error).message });
        }
    };

    const deleteItem = async (id: string, oldItem?: T) => {
       if (!user) throw new Error("User not authenticated.");
        try {
            const docRef = doc(db, `users/${user.uid}/${collectionName}`, id);
            await deleteDoc(docRef);

             if (collectionName === 'transactions' && oldItem) {
                await updateWalletBalance(user.uid, oldItem as Transaction, 'delete');
            }
        } catch (error) {
             console.error(`Error deleting item from ${collectionName}:`, error);
             toast({ variant: 'destructive', title: `Lỗi xóa ${collectionName}`, description: (error as Error).message });
        }
    };
    
    const bulkDelete = async (ids: string[]) => {
        if (!user) throw new Error("User not authenticated.");
        
        // This needs to be done carefully to update wallet balances.
        // For now, this is only used when deleting a wallet, which has its own logic.
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
