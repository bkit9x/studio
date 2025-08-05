
"use client";

import { useSupabaseData, useSupabaseTable } from '@/hooks/use-supabase-data';
import type { Transaction, Tag } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import React, { useEffect, useState } from 'react';
import { icons, type LucideIcon, Trash2, Edit, MoreVertical } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { AddTransactionSheet } from '@/components/add-transaction-sheet';
import { Button } from '@/components/ui/button';


const TransactionItem = ({ transaction, tag, onUpdate, onDelete }: { transaction: Transaction, tag: Tag | undefined, onUpdate: () => void, onDelete: () => void }) => {
    const [isMounted, setIsMounted] = useState(false);
    
    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!tag) return null;

    const IconComponent = icons[tag.icon as keyof typeof icons] as LucideIcon | undefined;
    
    const transactionDate = typeof transaction.createdAt === 'string' 
        ? new Date(transaction.createdAt) 
        : transaction.createdAt;

    const isIncome = transaction.type === 'income';
    const formattedTime = isMounted ? format(transactionDate, 'HH:mm') : null;

    return (
        <div className="flex items-center space-x-4 p-4 bg-white">
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", tag.bgColor)}>
                {IconComponent && <IconComponent className={cn("h-5 w-5", tag.textColor)} />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{transaction.description}</p>
                <p className="text-xs text-muted-foreground truncate">
                    {tag.name} {formattedTime && `・ ${formattedTime}`}
                </p>
            </div>
            <div className={cn("font-bold text-right", isIncome ? "text-[hsl(var(--chart-2))]" : "text-destructive")}>
                {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                       <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onUpdate}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Sửa</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onDelete} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Xóa</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
    const { tags } = useSupabaseData();
    const { deleteItem: deleteTransaction, bulkDelete: bulkDeleteTransactions } = useSupabaseTable<Transaction>('transactions');
    
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [transactionToUpdate, setTransactionToUpdate] = useState<Transaction | undefined>(undefined);
    const { toast } = useToast();

    const getTagById = (id: string) => tags.find(t => t.id === id);

    const handleUpdateRequest = (tx: Transaction) => {
        setTransactionToUpdate(tx);
        setIsSheetOpen(true);
    };

    const handleDeleteRequest = (tx: Transaction) => {
        setTransactionToDelete(tx);
        setIsAlertOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!transactionToDelete) return;
        
        // If it's a transfer, delete both linked transactions
        if (transactionToDelete.sourceWalletId && transactionToDelete.sourceWalletId !== 'none') {
            const linkedTransaction = transactions.find(t => 
                t.sourceWalletId === transactionToDelete.sourceWalletId && 
                t.id !== transactionToDelete.id &&
                t.amount === transactionToDelete.amount
            );
            const idsToDelete = [transactionToDelete.id];
            if(linkedTransaction) {
                idsToDelete.push(linkedTransaction.id);
            }
            await bulkDeleteTransactions(idsToDelete);
            toast({ title: "Thành công!", description: "Đã xóa giao dịch chuyển tiền." });
        } else {
             await deleteTransaction(transactionToDelete.id);
             toast({ title: "Thành công!", description: "Đã xóa giao dịch." });
        }

        setIsAlertOpen(false);
        setTransactionToDelete(null);
    };

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
                        <CardContent className="divide-y p-0 overflow-hidden">
                           {groupedTransactions[date]
                            .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .map(tx => (
                                <TransactionItem 
                                    key={tx.id} 
                                    transaction={tx} 
                                    tag={getTagById(tx.tagId)}
                                    onUpdate={() => handleUpdateRequest(tx)}
                                    onDelete={() => handleDeleteRequest(tx)}
                                />
                            ))}
                        </CardContent>
                    </Card>
                </div>
            ))}
             <AddTransactionSheet 
                isOpen={isSheetOpen} 
                onOpenChange={setIsSheetOpen} 
                transaction={transactionToUpdate}
            />
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này không thể được hoàn tác. Giao dịch sẽ bị xóa vĩnh viễn.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">Xóa</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
