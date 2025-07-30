
"use client";

import { useLocalStorage } from '@/hooks/use-local-storage';
import { mockTags } from '@/data/mock-data';
import type { Transaction, Tag } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import React, { useEffect, useState, useRef } from 'react';
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
import { useIsMobile } from '@/hooks/use-mobile';


const TransactionItem = ({ transaction, tag, onUpdate, onDelete }: { transaction: Transaction, tag: Tag | undefined, onUpdate: () => void, onDelete: () => void }) => {
    const [isMounted, setIsMounted] = useState(false);
    const isMobile = useIsMobile();
    
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
        <div className="flex items-center space-x-4 p-4 bg-background">
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", tag.bgColor)}>
                {IconComponent && <IconComponent className={cn("h-5 w-5", tag.textColor)} />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{transaction.description}</p>
                <p className="text-sm text-muted-foreground truncate">
                    {tag.name} {formattedTime && `・ ${formattedTime}`}
                </p>
            </div>
            <div className={cn("font-bold text-right", isIncome ? "text-[hsl(var(--chart-2))]" : "text-destructive")}>
                {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
            </div>
            {!isMobile && (
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
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
            )}
        </div>
    );
}

const SwipeableTransactionItem = ({ transaction, tag, onUpdate, onDelete }: { transaction: Transaction, tag: Tag | undefined, onUpdate: () => void, onDelete: () => void }) => {
    const itemRef = useRef<HTMLDivElement>(null);
    const [dragX, setDragX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const isMobile = useIsMobile();

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        setIsDragging(true);
        itemRef.current?.style.setProperty('transition', 'none');
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (isDragging) {
            const currentX = e.touches[0].clientX;
            const newDragX = currentX - (itemRef.current?.getBoundingClientRect().left ?? 0);
            if (newDragX < -150) {
                setDragX(-150);
            } else if (newDragX > 150) {
                setDragX(150);
            } else {
                setDragX(newDragX);
            }
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        itemRef.current?.style.removeProperty('transition');
        
        if (dragX < -80) { 
            onUpdate();
        } else if (dragX > 80) { 
            onDelete();
        }
        
        setDragX(0);
    };
    
    const isIncome = transaction.type === 'income';

    if (!isMobile) {
        return <TransactionItem transaction={transaction} tag={tag} onUpdate={onUpdate} onDelete={onDelete} />
    }

    return (
        <div className="relative overflow-hidden">
             <div className="absolute inset-y-0 left-0 flex items-center justify-start bg-red-500 text-white w-2/3" style={{ transform: `translateX(${Math.max(0, dragX - 80)}px)`}}>
                <div className="flex items-center px-6">
                    <Trash2 className="h-5 w-5 mr-2" />
                    <span>Xóa</span>
                </div>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center justify-end bg-blue-500 text-white w-2/3" style={{ transform: `translateX(${Math.min(0, dragX + 80)}px)`}}>
                <div className="flex items-center px-6">
                    <Edit className="h-5 w-5 mr-2" />
                    <span>Sửa</span>
                </div>
            </div>
            <div
                ref={itemRef}
                className="w-full relative z-10"
                style={{ transform: `translateX(${dragX}px)`, transition: 'transform 0.3s ease' }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <TransactionItem transaction={transaction} tag={tag} onUpdate={onUpdate} onDelete={onDelete} />
            </div>
        </div>
    );
};

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
    const [tags] = useLocalStorage<Tag[]>("tags", mockTags);
    const [allTransactions, setAllTransactions] = useLocalStorage<Transaction[]>("transactions", []);
    
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [transactionToUpdate, setTransactionToUpdate] = useState<Transaction | undefined>(undefined);
    const { toast } = useToast();

    const getTagById = (id: string) => tags.find(t => t.id === id);

    const handleUpdateRequest = (tx: Transaction) => {
        setTransactionToUpdate(tx);
        setIsSheetOpen(true);
    };

    const handleDeleteRequest = (id: string) => {
        setTransactionToDelete(id);
        setIsAlertOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (transactionToDelete) {
            setAllTransactions(allTransactions.filter(t => t.id !== transactionToDelete));
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
                                <SwipeableTransactionItem 
                                    key={tx.id} 
                                    transaction={tx} 
                                    tag={getTagById(tx.tagId)}
                                    onUpdate={() => handleUpdateRequest(tx)}
                                    onDelete={() => handleDeleteRequest(tx.id)}
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

    