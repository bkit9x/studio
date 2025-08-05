
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/contexts/auth-provider';
import type { Wallet, Tag, Transaction } from '@/lib/types';
import { useToast } from './use-toast';

// Custom event to notify other components that data has changed
const dispatchDataChangeEvent = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app-data-change'));
  }
};


export function useSupabaseData() {
  const { supabase, user } = useSupabase();
  const { toast } = useToast();
  
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch all data for the current user
  const fetchData = useCallback(async () => {
    if (!supabase || !user) {
      setIsLoading(false);
      return;
    };
    
    setIsLoading(true);
    try {
      const [
        { data: walletsData, error: walletsError },
        { data: tagsData, error: tagsError },
        { data: transactionsData, error: transactionsError }
      ] = await Promise.all([
        supabase.from('wallets').select('*').order('createdAt', { ascending: true }),
        supabase.from('tags').select('*').order('createdAt', { ascending: true }),
        supabase.from('transactions').select('*').order('createdAt', { ascending: false })
      ]);

      if (walletsError) throw walletsError;
      if (tagsError) throw tagsError;
      if (transactionsError) throw transactionsError;

      setWallets(walletsData || []);
      setTags(tagsData || []);
      // Convert createdAt string from DB to Date object
      const formattedTransactions = (transactionsData || []).map(t => ({
          ...t,
          createdAt: new Date(t.createdAt)
      }));
      setTransactions(formattedTransactions);
      
    } catch (error) {
       const err = error as Error;
       console.error("Error fetching data:", err.message);
       toast({ variant: 'destructive', title: 'Lỗi tải dữ liệu', description: err.message });
    } finally {
        setIsLoading(false);
    }
  }, [supabase, user, toast]);

  useEffect(() => {
    // Fetch data when user is available
    if (supabase && user) {
        fetchData();
    } else {
        setIsLoading(false);
    }
  }, [supabase, user, fetchData]);
  
  // Listen for custom data change events to refetch data
  useEffect(() => {
      const handleDataChange = () => fetchData();
      window.addEventListener('app-data-change', handleDataChange);
      return () => {
          window.removeEventListener('app-data-change', handleDataChange);
      };
  }, [fetchData]);


  // Function to clear all data for the user
  const clearAllData = async () => {
    if (!supabase || !user) throw new Error("User not authenticated");
    
    // The RLS policy should handle deleting only the user's data
    const [walletsRes, tagsRes, transactionsRes] = await Promise.all([
        supabase.from('wallets').delete().neq('id', '0'), // Dummy condition to delete all matching rows
        supabase.from('tags').delete().neq('id', '0'),
        supabase.from('transactions').delete().neq('id', '0')
    ]);

    if (walletsRes.error) throw walletsRes.error;
    if (tagsRes.error) throw tagsRes.error;
    if (transactionsRes.error) throw transactionsRes.error;

    // Refetch data after clearing
    dispatchDataChangeEvent();
  };

  // Function to bulk insert data, will clear existing data first
  const bulkInsert = async (
    newWallets: Wallet[],
    newTags: Tag[],
    newTransactions: Transaction[]
  ) => {
    if (!supabase || !user) throw new Error("User not authenticated");

    await clearAllData();
    
    // Note: Supabase insert doesn't automatically map user_id if called from client
    // unless RLS is set up with a default value. We assume RLS handles this.
    const [walletsRes, tagsRes, transactionsRes] = await Promise.all([
      supabase.from('wallets').insert(newWallets.map(({id, ...w}) => w)), // Don't insert client-side ID
      supabase.from('tags').insert(newTags.map(({id, ...t}) => t)),
      supabase.from('transactions').insert(newTransactions.map(({id, ...tx}) => ({...tx, createdAt: new Date(tx.createdAt).toISOString()})))
    ]);

    if (walletsRes.error) throw walletsRes.error;
    if (tagsRes.error) throw tagsRes.error;
    if (transactionsRes.error) throw transactionsRes.error;

    // Refetch data after inserting
    dispatchDataChangeEvent();
  };


  return { 
    wallets, 
    tags, 
    transactions, 
    isLoading, 
    refetch: fetchData, 
    dispatchDataChangeEvent,
    clearAllData,
    bulkInsert,
 };
}

// A generic hook for handling CRUD operations on a single table
export function useSupabaseTable<T extends { id: string, [key: string]: any }> (table: string) {
    const { supabase, user } = useSupabase();
    const { toast } = useToast();

    const addItem = async (item: Partial<T>) => {
        if (!supabase || !user) return;
        const { error } = await supabase.from(table).insert([item]);
        if (error) {
            toast({ variant: 'destructive', title: `Lỗi thêm ${table}`, description: error.message });
        } else {
            dispatchDataChangeEvent();
        }
    };
    
    const updateItem = async (id: string, updates: Partial<T>) => {
        if (!supabase || !user) return;
        const { error } = await supabase.from(table).update(updates).eq('id', id);
        if (error) {
             toast({ variant: 'destructive', title: `Lỗi cập nhật ${table}`, description: error.message });
        } else {
             dispatchDataChangeEvent();
        }
    };

    const deleteItem = async (id: string) => {
        if (!supabase || !user) return;
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) {
             toast({ variant: 'destructive', title: `Lỗi xóa ${table}`, description: error.message });
        } else {
             dispatchDataChangeEvent();
        }
    };
    
     const bulkDelete = async (ids: string[]) => {
        if (!supabase || !user) return;
        const { error } = await supabase.from(table).delete().in('id', ids);
         if (error) {
             toast({ variant: 'destructive', title: `Lỗi xóa nhiều ${table}`, description: error.message });
        } else {
             dispatchDataChangeEvent();
        }
    }

    return { addItem, updateItem, deleteItem, bulkDelete };
}
