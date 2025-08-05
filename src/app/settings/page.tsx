
"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, LogOut, Upload, Download, RefreshCw, AlertTriangle, Cloud, FileJson, FileText } from "lucide-react";
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
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import type { Wallet, Tag, Transaction } from "@/lib/types";
import { mockWallets, mockTags, mockTransactions } from "@/data/mock-data";
import { SyncDialog } from "@/components/settings/sync-dialog";
import { useSupabase } from "@/contexts/auth-provider";


const SettingsItem = ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => {
    return (
    <div
      className="flex items-center justify-between p-4 hover:bg-secondary/50 rounded-lg cursor-pointer"
      onClick={onClick}
    >
        <div className="flex items-center gap-3">
         {children}
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </div>
    )
}

export default function SettingsPage() {
  const { supabase, user } = useSupabase();
  const router = useRouter();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const { toast } = useToast();

  const [wallets, setWallets] = useLocalStorage<Wallet[]>("wallets", mockWallets);
  const [tags, setTags] = useLocalStorage<Tag[]>("tags", mockTags);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>("transactions", mockTransactions);

  const handleExportJSON = () => {
    const dataToExport = {
      wallets: JSON.parse(localStorage.getItem('wallets') || '[]'),
      tags: JSON.parse(localStorage.getItem('tags') || '[]'),
      transactions,
    };
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fintrack_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Thành công!", description: "Dữ liệu JSON đã được xuất." });
  };
  
  const handleExportCSV = () => {
    if (transactions.length === 0) {
        toast({ variant: 'destructive', title: "Không có dữ liệu", description: "Không có giao dịch nào để xuất." });
        return;
    }
    
    const walletsMap = new Map(wallets.map(w => [w.id, w.name]));
    const tagsMap = new Map(tags.map(t => [t.id, t.name]));

    const headers = ['ID', 'Ngày', 'Mô tả', 'Số tiền', 'Loại', 'Hạng mục', 'Ví'];
    const csvRows = [headers.join(',')];
    
    // Helper to escape CSV fields
    const escapeCsvField = (field: string | number) => {
        let stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
            stringField = `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
    };


    for (const tx of transactions) {
        const row = [
            escapeCsvField(tx.id),
            escapeCsvField(new Date(tx.createdAt).toISOString()),
            escapeCsvField(tx.description),
            String(tx.amount),
            escapeCsvField(tx.type === 'income' ? 'Thu' : 'Chi'),
            escapeCsvField(tagsMap.get(tx.tagId) || 'Không rõ'),
            escapeCsvField(walletsMap.get(tx.walletId) || 'Không rõ'),
        ];
        csvRows.push(row.join(','));
    }
    
    const csvString = csvRows.join('\n');
    const dataBlob = new Blob([`\uFEFF${csvString}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fintrack_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Thành công!", description: "Dữ liệu CSV đã được xuất." });
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("File could not be read");
        }
        
        const importedData = JSON.parse(text);

        if (importedData.wallets && importedData.tags && importedData.transactions) {
          setWallets(importedData.wallets);
          setTags(importedData.tags);
          setTransactions(importedData.transactions);
          toast({ title: "Thành công!", description: "Dữ liệu đã được nhập và thay thế hoàn toàn." });
        } else {
          throw new Error("Invalid data format.");
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Lỗi!", description: "File nhập không hợp lệ." });
        console.error("Import error:", error);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };
  
  const triggerImport = () => {
    document.getElementById('import-input')?.click();
  }

  const handleResetConfirm = () => {
    localStorage.removeItem("wallets");
    localStorage.removeItem("tags");
    localStorage.removeItem("transactions");
    localStorage.removeItem("selectedWalletId");
    localStorage.removeItem("fintrack_sync_config");
    localStorage.removeItem("fintrack_sync_metadata");
    window.location.reload();
  };
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // Clear local storage on sign out
    localStorage.clear();
    router.push('/auth');
  }


  return (
    <>
    <div className="container mx-auto p-4 space-y-6 pb-28 md:pb-4">
      <div>
        <h1 className="text-xl font-bold">Cài đặt</h1>
        <p className="text-muted-foreground">Quản lý tài khoản và tuỳ chỉnh ứng dụng.</p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle className="text-xl">Tài khoản</CardTitle>
            <CardDescription>{user?.email ?? 'Đang tải...'}</CardDescription>
        </CardHeader>
        <CardContent>
            <Button variant="destructive" className="w-full" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
            </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle className="text-xl">Tuỳ chỉnh</CardTitle>
        </CardHeader>
        <CardContent className="divide-y p-0">
            <SettingsItem><span>Ngôn ngữ</span></SettingsItem>
            <SettingsItem><span>Đơn vị tiền tệ</span></SettingsItem>
            <SettingsItem><span>Giao diện</span></SettingsItem>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="text-xl">Dữ liệu</CardTitle>
        </CardHeader>
        <CardContent className="divide-y p-0">
            <SettingsItem onClick={() => setIsSyncOpen(true)}>
                <Cloud className="h-5 w-5 text-muted-foreground" />
                <span>Đồng bộ hóa</span>
            </SettingsItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center justify-between p-4 hover:bg-secondary/50 rounded-lg cursor-pointer">
                    <div className="flex items-center gap-3">
                        <Download className="h-5 w-5 text-muted-foreground" />
                        <span>Xuất dữ liệu</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportJSON}>
                      <FileJson className="mr-2 h-4 w-4" />
                      <span>Xuất ra JSON</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportCSV}>
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Xuất ra CSV/Excel</span>
                  </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <SettingsItem onClick={triggerImport}>
                 <Upload className="h-5 w-5 text-muted-foreground" />
                <span>Nhập dữ liệu</span>
                 <input type="file" id="import-input" accept=".json" className="hidden" onChange={handleImport} />
            </SettingsItem>
             <SettingsItem onClick={() => setIsAlertOpen(true)}>
                 <RefreshCw className="h-5 w-5 text-destructive" />
                <span className="text-destructive">Reset dữ liệu</span>
            </SettingsItem>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="text-xl">Thông tin</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <p>FinTrack -  Ứng dụng quản lý chi tiêu cá nhân thông minh.
           Phát triển bởi <b className="text-primary">Hoàng Kha</b> - <a href="mailto:hkhadev@gmail.com" title="hkhadev@gmail.com" rel="noopener noreferrer" target="_blank">hkhadev@gmail.com</a></p>
        </CardContent>
      </Card>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                Bạn có chắc chắn muốn reset?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể được hoàn tác. Toàn bộ dữ liệu của bạn sẽ bị xóa vĩnh viễn khỏi thiết bị này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetConfirm} className="bg-destructive hover:bg-destructive/90">Tôi hiểu, xóa dữ liệu</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
    <SyncDialog isOpen={isSyncOpen} onOpenChange={setIsSyncOpen} />
    </>
  );
}
