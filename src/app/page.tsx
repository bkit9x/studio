
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart2 } from "lucide-react";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { TransactionList } from "@/components/dashboard/transaction-list";
import { useFirebaseData } from "@/hooks/use-firebase-data";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { wallets, transactions, isLoading } = useFirebaseData();
  const [selectedWalletId, setSelectedWalletId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!isLoading && wallets.length > 0 && !selectedWalletId) {
        const storedWalletId = localStorage.getItem('selectedWalletId');
        if (storedWalletId && wallets.some(w => w.id === storedWalletId)) {
            setSelectedWalletId(storedWalletId);
        } else {
            setSelectedWalletId(wallets[0].id);
        }
    }
  }, [wallets, selectedWalletId, isLoading]);
  
  useEffect(() => {
      if (selectedWalletId) {
          localStorage.setItem('selectedWalletId', selectedWalletId);
      }
  }, [selectedWalletId])

  const selectedWallet = wallets.find(w => w.id === selectedWalletId);
  
  const filteredTransactions = selectedWalletId 
    ? transactions.filter(t => t.walletId === selectedWalletId)
    : [];

  return (
    <div className="container mx-auto p-4 space-y-6 pb-28 md:pb-4">
      <header className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">FinTrack</h1>
            <p className="text-muted-foreground">Chào mừng trở lại!</p>
        </div>
         <Button asChild variant="outline" size="sm">
            <Link href="/reports">
                <BarChart2 className="mr-2 h-4 w-4" />
                Báo cáo
            </Link>
        </Button>
      </header>
      
      {isLoading || !selectedWallet ? (
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (
         <OverviewCards 
          balance={selectedWallet.balance}
          totalIncome={selectedWallet.totalIncome}
          totalExpense={selectedWallet.totalExpense}
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
