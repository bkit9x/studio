
"use client";

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import type { Wallet } from '@/lib/types';
import { useFirestoreTable } from '@/hooks/use-firebase-data';
import { useToast } from '@/hooks/use-toast';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';


const walletSchema = z.object({
  name: z.string().min(1, { message: 'Tên ví không được để trống.' }),
  initialBalance: z.coerce.number().min(0, { message: 'Số dư phải là số không âm.' }),
});

type WalletFormValues = z.infer<typeof walletSchema>;

interface WalletFormSheetProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    wallet?: Wallet;
}

export function WalletFormSheet({ isOpen, onOpenChange, wallet }: WalletFormSheetProps) {
  const { addItem: addWallet, updateItem: updateWallet } = useFirestoreTable<Wallet>('wallets');
  const { toast } = useToast();

  const form = useForm<WalletFormValues>({
    resolver: zodResolver(walletSchema),
  });

  useEffect(() => {
    if (wallet) {
      form.reset({
        name: wallet.name,
        initialBalance: wallet.initialBalance,
      });
    } else {
        form.reset({
        name: '',
        initialBalance: 0,
      });
    }
  }, [wallet, form, isOpen]);


  async function onSubmit(data: WalletFormValues) {
    if(wallet) { // Update existing wallet
        await updateWallet(wallet.id, data);
        toast({
            title: "Thành công!",
            description: "Đã cập nhật ví.",
        });
    } else { // Add new wallet
        await addWallet(data);
        toast({
            title: "Thành công!",
            description: "Đã thêm ví mới.",
        });
    }
    onOpenChange(false);
  }
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
        form.reset();
    }
    onOpenChange(open);
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-lg max-h-[90vh] flex flex-col p-0">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle>{wallet ? 'Chỉnh sửa ví' : 'Thêm ví mới'}</SheetTitle>
          <SheetDescription>
            {wallet ? 'Cập nhật thông tin cho ví của bạn.' : 'Tạo một ví mới để theo dõi chi tiêu.'}
          </SheetDescription>
        </SheetHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 space-y-4 pt-4">

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên ví</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="VD: Ví chính" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="initialBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số dư ban đầu</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" placeholder="0" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          
            <SheetFooter className="pt-4 sticky bottom-0 bg-background pb-6">
                <Button type="submit" className="w-full">{wallet ? 'Lưu thay đổi' : 'Tạo ví'}</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
