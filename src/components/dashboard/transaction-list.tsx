
"use client";

import { useLocalStorage } from '@/hooks/use-local-storage';
import { mockTags } from '@/data/mock-data';
import type { Transaction, Tag } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { icons, type LucideIcon } from 'lucide-react';

const TransactionItem = ({ transaction, tag }: { transaction: Transaction, tag: Tag | undefined }) => {
    const [isMounted, setIsMounted] = useState(false);
    
    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!tag) return null;

    const IconComponent = typeof tag.icon === 'string' ? icons[tag.icon as keyof typeof icons] : tag.icon as LucideIcon;
    
    const transactionDate = typeof transaction.createdAt === 'string' 
        ? new Date(transaction.createdAt) 
        : transaction.createdAt;

    const isIncome = transaction.type === 'income';
    const formattedTime = isMounted ? format(transactionDate, 'HH:mm') : null;

    return (
        <div className="flex items-center space-x-4 p-4">
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", tag.bgColor)}>
                {IconComponent && <IconComponent className={cn("h-5 w-5", tag.textColor)} />}
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
    const [tags] = useLocalStorage<Tag[]>("tags", mockTags);

    const getTagById = (id: string) => tags.find(t => t.id === id);

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
             {transactions.length === 0 && (
                <Card>
                    <CardContent className="p-4 text-center text-muted-foreground">
                        Chưa có giao dịch nào.
                    </CardContent>
                </Card>
            )}
            {sortedDates.map(date => (
                <div key={date}>
                    <h3 className="text-sm font-medium text-muted-foreground px-2 py-1">{formatDateHeading(date)}</h3>
                    <Card>
                        <CardContent className="divide-y p-0">
                           {groupedTransactions[date]
                            .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .map(tx => <TransactionItem key={tx.id} transaction={tx} tag={getTagById(tx.tagId)} />)}
                        </CardContent>
                    </Card>
                </div>
            ))}
        </div>
    );
}
