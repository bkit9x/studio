
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowDown, ArrowUp, Banknote, Scale } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Wallet } from "@/lib/types";

type OverviewCardsProps = {
    balance: number;
    totalIncome: number;
    totalExpense: number;
    wallets: Wallet[];
    selectedWalletId: string | undefined;
    onWalletChange: (walletId: string) => void;
};

export function OverviewCards({ balance, totalIncome, totalExpense, wallets, selectedWalletId, onWalletChange }: OverviewCardsProps) {
    const selectedWallet = wallets.find(w => w.id === selectedWalletId);
    
    return (
        <div className="grid grid-cols-2 gap-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ví</CardTitle>
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <Select value={selectedWalletId} onValueChange={onWalletChange}>
                        <SelectTrigger className="text-lg font-bold p-2 h-auto">
                            <SelectValue placeholder="Chọn ví">{selectedWallet?.name ?? "Chọn ví"}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {wallets.map(wallet => (
                                <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>
            <Card className="bg-[hsl(var(--chart-2)/0.1)] dark:bg-[hsl(var(--chart-2)/0.2)] border-[hsl(var(--chart-2)/0.2)]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-[hsl(var(--chart-2))]">Tổng thu</CardTitle>
                    <ArrowUp className="h-4 w-4 text-[hsl(var(--chart-2))]" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-[hsl(var(--chart-2))]">{formatCurrency(totalIncome)}</div>
                </CardContent>
            </Card>
            <Card className="bg-[hsl(var(--destructive)/0.05)] dark:bg-[hsl(var(--destructive)/0.2)] border-[hsl(var(--destructive)/0.2)]">
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-[hsl(var(--destructive))]">Tổng chi</CardTitle>
                    <ArrowDown className="h-4 w-4 text-[hsl(var(--destructive))]" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-[hsl(var(--destructive))]">{formatCurrency(totalExpense)}</div>
                </CardContent>
            </Card>
            <Card>
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Số dư</CardTitle>
                    <Scale className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(balance)}</div>
                </CardContent>
            </Card>
        </div>
    );
}
