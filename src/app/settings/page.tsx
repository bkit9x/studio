
"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, LogOut, Download, Upload, Trash2 } from "lucide-react";
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
import { useFirebase } from "@/contexts/auth-provider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useFirebaseData } from "@/hooks/use-firebase-data";
import { useToast } from "@/hooks/use-toast";
import type { Wallet, Tag, Transaction } from "@/lib/types";
import { format as formatDate, isValid } from 'date-fns';


const SettingsItem = ({ children, onClick, asChild = false }: { children: React.ReactNode, onClick?: () => void, asChild?: boolean }) => {
    const Comp = asChild ? "div" : "button";
    return (
    <Comp
      className="flex w-full items-center justify-between p-4 hover:bg-secondary/50 rounded-lg cursor-pointer text-left"
      onClick={onClick}
    >
        <div className="flex items-center gap-3">
         {children}
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </Comp>
    )
}

export default function SettingsPage() {
  const { auth, user } = useFirebase();
  const router = useRouter();
  const { wallets, tags, transactions, bulkInsert, clearAllData } = useFirebaseData();
  const { toast } = useToast();
  const [isResetAlertOpen, setIsResetAlertOpen] = useState(false);
  const [importFileContent, setImportFileContent] = useState<any>(null);


  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/auth');
  }
  
  const handleExport = (format: 'json' | 'csv') => {
    if (format === 'json') {
      const data = { wallets, tags, transactions };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fintrack_data.json';
      a.click();
      URL.revokeObjectURL(url);
    } else { // CSV
        const escapeCsvCell = (cell: any) => `"${String(cell ?? '').replace(/"/g, '""')}"`;
        
        const rows = [
            ['ID', 'Date', 'Wallet', 'Type', 'Category', 'Amount', 'Description'].map(escapeCsvCell).join(','),
            ...transactions.map(t => {
                const date = t.createdAt ? new Date(t.createdAt as string) : null;
                const formattedDate = date && isValid(date) ? formatDate(date, 'dd/MM/yyyy HH:mm:ss') : '';
                
                return [
                    escapeCsvCell(t.id),
                    escapeCsvCell(formattedDate),
                    escapeCsvCell(wallets.find(w => w.id === t.walletId)?.name),
                    escapeCsvCell(t.type),
                    escapeCsvCell(tags.find(tag => tag.id === t.tagId)?.name),
                    escapeCsvCell(t.amount),
                    escapeCsvCell(t.description)
                ].join(',');
            })
        ];
        const csvContent = rows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fintrack_transactions.csv';
        a.click();
        URL.revokeObjectURL(url);
    }
     toast({ title: "Đã xuất dữ liệu", description: `Dữ liệu của bạn đã được tải xuống.` });
  }
  
  const handleImportRequest = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result;
                if(typeof content === 'string') {
                    const data = JSON.parse(content);
                    // Basic validation
                    if(data.wallets && data.tags && data.transactions) {
                        setImportFileContent(data);
                    } else {
                        toast({ variant: "destructive", title: "Lỗi", description: "Tệp JSON không hợp lệ." });
                    }
                }
            } catch (error) {
                toast({ variant: "destructive", title: "Lỗi đọc tệp", description: "Không thể đọc tệp JSON." });
            }
        };
        reader.readAsText(file);
    }
    // Reset file input so user can select the same file again
    event.target.value = '';
  }
  
  const handleImportConfirm = async () => {
    if (!importFileContent || !user) {
        return;
    }
    
    try {
        await bulkInsert(
            importFileContent.wallets,
            importFileContent.tags,
            importFileContent.transactions
        );
        toast({ title: "Thành công!", description: "Dữ liệu đã được nhập thành công." });
    } catch (error) {
        const err = error as Error;
        toast({ variant: "destructive", title: "Lỗi nhập dữ liệu", description: err.message });
    } finally {
        setImportFileContent(null);
    }
  }
  
  const handleResetConfirm = async () => {
    try {
        await clearAllData();
        toast({ title: "Thành công", description: "Đã reset toàn bộ dữ liệu."});
    } catch (error) {
         const err = error as Error;
         toast({ variant: "destructive", title: "Lỗi", description: err.message });
    } finally {
        setIsResetAlertOpen(false);
    }
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SettingsItem asChild>
                  <Download className="h-5 w-5 text-muted-foreground" />
                  <span>Xuất dữ liệu</span>
              </SettingsItem>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('json')}>
                Xuất ra JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                Xuất ra CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <SettingsItem onClick={() => document.getElementById('import-input')?.click()}>
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span>Nhập dữ liệu</span>
            <input type="file" id="import-input" accept=".json" className="hidden" onChange={handleImportRequest} />
          </SettingsItem>
          
          <SettingsItem onClick={() => setIsResetAlertOpen(true)}>
             <Trash2 className="h-5 w-5 text-destructive" />
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
      
    </div>
    
     {/* Import Confirmation Dialog */}
      <AlertDialog open={!!importFileContent} onOpenChange={() => setImportFileContent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận nhập dữ liệu?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ <b className="text-destructive">xóa tất cả dữ liệu hiện tại</b> và thay thế bằng dữ liệu từ tệp bạn đã chọn. Hành động này không thể được hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setImportFileContent(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleImportConfirm}>Tiếp tục</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Confirmation Dialog */}
       <AlertDialog open={isResetAlertOpen} onOpenChange={setIsResetAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn reset?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ <b className="text-destructive">xóa tất cả dữ liệu hiện tại</b> của bạn trên đám mây. Hành động này không thể được hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetConfirm} className="bg-destructive hover:bg-destructive/90">Tôi hiểu, Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
