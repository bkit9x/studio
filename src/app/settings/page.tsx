import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, LogOut } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const SettingsItem = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center justify-between p-4 hover:bg-secondary/50 rounded-lg cursor-pointer">
        {children}
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </div>
)

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-4 space-y-6 pb-28 md:pb-4">
      <div>
        <h1 className="text-2xl font-bold">Cài đặt</h1>
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
            <SettingsItem><span>Xuất dữ liệu</span></SettingsItem>
            <SettingsItem><span>Nhập dữ liệu</span></SettingsItem>
            <SettingsItem><span>Reset dữ liệu</span></SettingsItem>
        </CardContent>
      </Card>

    </div>
  );
}
