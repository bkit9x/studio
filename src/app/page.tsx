
"use client";

import { useEffect, useState } from "react";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { TransactionList } from "@/components/dashboard/transaction-list";
import { mockWallets, mockTransactions } from "@/data/mock-data";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Transaction } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [transactions] = useLocalStorage<Transaction[]>("transactions", mockTransactions);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="container mx-auto p-4 space-y-6 pb-28 md:pb-4">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-primary">FinTrack</h1>
        <p className="text-muted-foreground">Chào mừng trở lại!</p>
      </header>
      
      {isClient ? (
        <OverviewCards 
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          wallets={mockWallets}
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
        <TransactionList transactions={transactions} />
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
