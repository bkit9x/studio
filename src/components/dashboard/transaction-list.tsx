
"use client";

import { mockTags } from '@/data/mock-data';
import type { Transaction } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useEffect, useState } from 'react';

const TransactionItem = ({ transaction }: { transaction: Transaction }) => {
    const tag = mockTags.find(t => t.id === transaction.tagId);
    const [isMounted, setIsMounted] = useState(false);
    const transactionDate = typeof transaction.createdAt === 'string' 
        ? new Date(transaction.createdAt) 
        : transaction.createdAt;

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!tag) return null;

    const isIncome = transaction.type === 'income';
    const formattedTime = isMounted ? format(transactionDate, 'HH:mm') : null;

    return (
        <div className="flex items-center space-x-4 p-4">
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", tag.bgColor)}>
                <tag.icon className={cn("h-5 w-5", tag.textColor)} />
            </div>
            <div className="flex-1">
                <p className="font-medium truncate">{transaction.description}</p>
                <p className="text-sm text-muted-foreground">
                    {tag.name} {formattedTime && `・ ${formattedTime}`}
                </p>
            </div>
            <div className={cn("font-bold text-right", isIncome ? "text-[hsl(var(--chart-2))]" : "text-destructive")}>
                {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
            </div>
        </div>
    );
}

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
    const groupedTransactions = transactions.reduce((acc, tx) => {
        const dateKey = format(new Date(tx.createdAt), 'yyyy-MM-dd');
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(tx);
        return acc;
    }, {} as Record<string, Transaction[]>);

    const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    const formatDateHeading = (dateStr: string) => {
        const date = new Date(dateStr);
        if (isToday(date)) return 'Hôm nay';
        if (isYesterday(date)) return 'Hôm qua';
        return format(date, "EEEE, dd 'tháng' M, yyyy", { locale: vi });
    }

    return (
        <div className="space-y-4">
            {sortedDates.map(date => (
                <div key={date}>
                    <h3 className="text-sm font-medium text-muted-foreground px-2 py-1">{formatDateHeading(date)}</h3>
                    <Card>
                        <CardContent className="divide-y p-0">
                           {groupedTransactions[date]
                            .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .map(tx => <TransactionItem key={tx.id} transaction={tx} />)}
                        </CardContent>
                    </Card>
                </div>
            ))}
        </div>
    );
}
