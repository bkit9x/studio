
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@radix-ui/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useSync } from "@/hooks/use-sync";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { formatRelative } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";


const syncSchema = z.object({
  apiKey: z.string().min(1, { message: "API Key không được để trống." }),
  binId: z.string().min(1, { message: "Bin ID không được để trống." }),
  password: z.string().min(1, { message: "Mật khẩu không được để trống." }),
});

type SyncFormValues = z.infer<typeof syncSchema>;

interface SyncDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function SyncDialog({ isOpen, onOpenChange }: SyncDialogProps) {
  const { config, setConfig, syncData, isLoading, isSyncing, lastSync, hasUnsyncedChanges } = useSync();
  const { toast } = useToast();

  const form = useForm<SyncFormValues>({
    resolver: zodResolver(syncSchema),
    defaultValues: {
      apiKey: "",
      binId: "",
      password: "",
    },
  });

  useEffect(() => {
    if (isOpen && config) {
      form.reset({
        apiKey: config.apiKey,
        binId: config.binId,
        password: config.password,
      });
    }
  }, [isOpen, config, form]);

  const handleSaveAndSync = (data: SyncFormValues) => {
    setConfig(data);
    syncData(data)
      .then(() => {
        toast({ title: "Thành công", description: "Đã đồng bộ dữ liệu từ cloud." });
        onOpenChange(false);
      })
      .catch((err) => {
        const error = err as Error;
        toast({ variant: "destructive", title: "Lỗi đồng bộ", description: error.message });
      });
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return "Chưa từng đồng bộ.";
    try {
        return `Lần cuối: ${formatRelative(date, new Date(), { locale: vi })}`;
    } catch {
        return "Thời gian không hợp lệ";
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đồng bộ hóa dữ liệu</DialogTitle>
          <DialogDescription>
            Đồng bộ dữ liệu của bạn với jsonbin.io. Dữ liệu của bạn sẽ được mã hóa bằng mật khẩu bạn cung cấp.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSaveAndSync)} className="space-y-4">
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>X-Master-Key (API Key)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="API Key từ jsonbin.io" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="binId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bin ID</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="ID của Bin trên jsonbin.io" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mật khẩu mã hóa</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} placeholder="Mật khẩu để mã hóa dữ liệu" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="text-sm text-muted-foreground space-y-1">
                <p>{formatLastSync(lastSync)}</p>
                <div className="flex items-center gap-2">
                    <span>Trạng thái:</span>
                    <span className={cn(
                        "font-medium",
                        hasUnsyncedChanges ? "text-orange-500" : "text-green-500"
                    )}>
                        {hasUnsyncedChanges ? "Có thay đổi chưa đồng bộ" : "Đã đồng bộ"}
                    </span>
                </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={isLoading || isSyncing}>
                {isLoading ? "Đang lưu..." : isSyncing ? "Đang đồng bộ..." : "Lưu & Đồng bộ"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
