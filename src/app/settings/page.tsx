
"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, LogOut, AlertTriangle } from "lucide-react";
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
  
  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    // Clear local storage on sign out to be safe
    localStorage.clear(); 
    router.push('/auth');
    router.refresh();
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
            <Button variant="destructive" className="w-full" onClick={handleSignOut} disabled={!supabase}>
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
            <CardTitle className="text-xl">Thông tin</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <p>FinTrack -  Ứng dụng quản lý chi tiêu cá nhân thông minh.
           Phát triển bởi <b className="text-primary">Hoàng Kha</b> - <a href="mailto:hkhadev@gmail.com" title="hkhadev@gmail.com" rel="noopener noreferrer" target="_blank">hkhadev@gmail.com</a></p>
        </CardContent>
      </Card>
      
    </div>
    </>
  );
}
