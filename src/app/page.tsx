
"use client";

import { useEffect, useState } from "react";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { TransactionList } from "@/components/dashboard/transaction-list";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Transaction, Wallet } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { mockWallets, mockTransactions } from "@/data/mock-data";

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  
  const [transactions] = useLocalStorage<Transaction[]>("transactions", mockTransactions);
  const [wallets] = useLocalStorage<Wallet[]>("wallets", mockWallets);

  const [selectedWalletId, setSelectedWalletId] = useLocalStorage<string | undefined>(
    "selectedWalletId", 
    wallets[0]?.id
  );

  useEffect(() => {
    setIsClient(true);
    // Ensure selectedWalletId is valid
    if (!selectedWalletId && wallets.length > 0) {
      setSelectedWalletId(wallets[0].id);
    } else if (selectedWalletId && !wallets.find(w => w.id === selectedWalletId)) {
      setSelectedWalletId(wallets[0]?.id);
    }
  }, [wallets, selectedWalletId, setSelectedWalletId]);

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
      
      {isClient ? (
        <OverviewCards 
          balance={balance}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          wallets={wallets}
          selectedWalletId={selectedWalletId}
          onWalletChange={setSelectedWalletId}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      )}
      
      {isClient ? (
        <TransactionList transactions={filteredTransactions} />
      ) : (
        <div className="space-y-4">
          <Skeleton className="h-12" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      )}
    </div>
  );
}
