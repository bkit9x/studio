
"use client";

import { useEffect, useState } from "react";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { TransactionList } from "@/components/dashboard/transaction-list";
import { useFirebaseData } from "@/hooks/use-firebase-data";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { wallets, transactions, isLoading } = useFirebaseData();
  const [selectedWalletId, setSelectedWalletId] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Set a default wallet if none is selected, once data is loaded
    if (!isLoading && wallets.length > 0 && !selectedWalletId) {
        // Check local storage for previously selected wallet
        const storedWalletId = localStorage.getItem('selectedWalletId');
        if (storedWalletId && wallets.some(w => w.id === storedWalletId)) {
            setSelectedWalletId(storedWalletId);
        } else {
            setSelectedWalletId(wallets[0].id);
        }
    }
  }, [wallets, selectedWalletId, isLoading]);
  
  // Save selected wallet to local storage
  useEffect(() => {
      if (selectedWalletId) {
          localStorage.setItem('selectedWalletId', selectedWalletId);
      }
  }, [selectedWalletId])

  const selectedWallet = wallets.find(w => w.id === selectedWalletId);
  
  const filteredTransactions = selectedWalletId 
    ? transactions.filter(t => t.walletId === selectedWalletId)
    : [];

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = (selectedWallet?.initialBalance ?? 0) + totalIncome - totalExpense;


  return (
    <div className="container mx-auto p-4 space-y-6 pb-28 md:pb-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-primary">FinTrack</h1>
        <p className="text-muted-foreground">Chào mừng trở lại!</p>
      </header>
      
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (
         <OverviewCards 
          balance={balance}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          wallets={wallets}
          selectedWalletId={selectedWalletId}
          onWalletChange={setSelectedWalletId}
        />
      )}
      
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : (
         <TransactionList transactions={filteredTransactions} />
      )}
    </div>
  );
}
