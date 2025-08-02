
"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, LogOut, Upload, Download, RefreshCw, AlertTriangle, CloudSync } from "lucide-react";
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
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import type { Wallet, Tag, Transaction } from "@/lib/types";
import { mockWallets, mockTags, mockTransactions } from "@/data/mock-data";
import { SyncDialog } from "@/components/settings/sync-dialog";


const SettingsItem = ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => (
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

export default function SettingsPage() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const { toast } = useToast();

  const [wallets, setWallets] = useLocalStorage<Wallet[]>("wallets", mockWallets);
  const [tags, setTags] = useLocalStorage<Tag[]>("tags", mockTags);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>("transactions", mockTransactions);

  const handleExport = () => {
    const dataToExport = {
      wallets,
      tags,
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
    toast({ title: "Thành công!", description: "Dữ liệu đã được xuất." });
  };

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

        // Simple validation
        if (importedData.wallets && importedData.tags && importedData.transactions) {
          // Replace old data with imported data
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
    // Reset file input to allow importing the same file again
    event.target.value = '';
  };
  
  const triggerImport = () => {
    document.getElementById('import-input')?.click();
  }

  const handleResetConfirm = () => {
    setWallets(mockWallets);
    setTags(mockTags);
    setTransactions(mockTransactions);
    setIsAlertOpen(false);
    toast({ title: "Thành công!", description: "Dữ liệu đã được reset." });
  };


  return (
    <>
    <div className="container mx-auto p-4 space-y-6 pb-28 md:pb-4">
      <div>
        <h1 className="text-xl font-bold">Cài đặt</h1>
        <p className="text-muted-foreground">Quản lý tài khoản và tuỳ chỉnh ứng dụng.</p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Tài khoản</CardTitle>
            <CardDescription>user@example.com</CardDescription>
        </CardHeader>
        <CardContent>
            <Button variant="destructive" className="w-full">
                <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
            </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Tuỳ chỉnh</CardTitle>
        </CardHeader>
        <CardContent className="divide-y p-0">
            <SettingsItem><span>Ngôn ngữ</span></SettingsItem>
            <SettingsItem><span>Đơn vị tiền tệ</span></SettingsItem>
            <SettingsItem><span>Giao diện</span></SettingsItem>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Dữ liệu</CardTitle>
        </CardHeader>
        <CardContent className="divide-y p-0">
            <SettingsItem onClick={() => setIsSyncOpen(true)}>
                <CloudSync className="h-5 w-5 text-muted-foreground" />
                <span>Đồng bộ hóa</span>
            </SettingsItem>
            <SettingsItem onClick={handleExport}>
                <Download className="h-5 w-5 text-muted-foreground" />
                <span>Xuất dữ liệu</span>
            </SettingsItem>
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
            <CardTitle>Thông tin</CardTitle>
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
              Hành động này không thể được hoàn tác. Toàn bộ dữ liệu của bạn (ví, hạng mục, giao dịch) sẽ bị xóa và thay thế bằng dữ liệu mặc định.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetConfirm}>Tiếp tục</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
    <SyncDialog isOpen={isSyncOpen} onOpenChange={setIsSyncOpen} />
    </>
  );
}
