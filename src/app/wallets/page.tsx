
"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreVertical, Edit, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useFirebaseData, useFirestoreTable } from "@/hooks/use-firebase-data";
import type { Wallet, Transaction } from "@/lib/types";
import { WalletFormSheet } from "@/components/wallets/wallet-form-sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
import { useToast } from "@/hooks/use-toast";

const WalletItem = ({ wallet, onEdit, onDelete }: { wallet: Wallet; onEdit: () => void; onDelete: () => void; }) => {

    const balance = wallet.balance ?? wallet.initialBalance ?? 0;
    const income = wallet.totalIncome ?? 0;
    const expense = wallet.totalExpense ?? 0;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{wallet.name}</CardTitle>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onEdit}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Chỉnh sửa</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onDelete} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Xóa</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="space-y-2">
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Số dư ban đầu:</span>
                    <span className="font-medium">{formatCurrency(wallet.initialBalance)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Tổng thu:</span>
                    <span className="font-medium text-[hsl(var(--chart-2))]">{formatCurrency(income)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Tổng chi:</span>
                    <span className="font-medium text-destructive">{formatCurrency(expense)}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t">
                    <span>Số dư cuối:</span>
                    <span>{formatCurrency(balance)}</span>
                </div>
            </CardContent>
        </Card>
    );
}

export default function WalletsPage() {
  const { wallets, transactions } = useFirebaseData();
  const { deleteItem: deleteWallet } = useFirestoreTable<Wallet>('wallets');
  const { bulkDelete: deleteTransactions } = useFirestoreTable<Transaction>('transactions');
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | undefined>(undefined);
  const [walletToDelete, setWalletToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAddWallet = () => {
    setSelectedWallet(undefined);
    setIsSheetOpen(true);
  }

  const handleEditWallet = (wallet: Wallet) => {
    setSelectedWallet(wallet);
    setIsSheetOpen(true);
  }
  
  const handleDeleteRequest = (walletId: string) => {
    setWalletToDelete(walletId);
    setIsAlertOpen(true);
  }

  const handleDeleteConfirm = async () => {
    if (!walletToDelete) return;
      
    if (wallets.length <= 1) {
        toast({ variant: "destructive", title: "Lỗi", description: "Không thể xóa ví cuối cùng." });
        setIsAlertOpen(false);
        return;
    }
    
    // Find transactions associated with the wallet to be deleted
    const transactionsToDelete = transactions
        .filter(t => t.walletId === walletToDelete)
        .map(t => t.id);

    // Delete associated transactions first
    if (transactionsToDelete.length > 0) {
        await deleteTransactions(transactionsToDelete);
    }
    
    // Then delete the wallet
    await deleteWallet(walletToDelete);

    toast({ title: "Thành công!", description: "Đã xóa ví và các giao dịch liên quan." });
    
    setIsAlertOpen(false);
    setWalletToDelete(null);
  }

  return (
    <div className="container mx-auto p-4 space-y-4 pb-28 md:pb-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Quản lý Ví</h1>
        <Button onClick={handleAddWallet}>
            <PlusCircle className="mr-2 h-4 w-4" /> Thêm
        </Button>
      </div>
      <p className="text-muted-foreground">Quản lý tất cả các ví của bạn ở một nơi.</p>
      <div className="space-y-4">
        {wallets.map(wallet => (
            <WalletItem 
                key={wallet.id} 
                wallet={wallet} 
                onEdit={() => handleEditWallet(wallet)}
                onDelete={() => handleDeleteRequest(wallet.id)}
            />
        ))}
      </div>
      <WalletFormSheet 
        isOpen={isSheetOpen} 
        onOpenChange={setIsSheetOpen}
        wallet={selectedWallet} 
      />
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể được hoàn tác. Thao tác này sẽ xóa vĩnh viễn ví và tất cả các giao dịch liên quan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Tiếp tục</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
