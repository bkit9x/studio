
"use client";

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Wallet } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { cn } from '@/lib/utils';
import { mockTags, mockWallets } from '@/data/mock-data';
import type { Transaction, TransactionType } from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().min(1, { message: 'Số tiền phải lớn hơn 0.' }),
  description: z.string().min(1, { message: 'Mô tả không được để trống.' }),
  tagId: z.string({ required_error: 'Vui lòng chọn một hạng mục.' }),
  walletId: z.string({ required_error: 'Vui lòng chọn một ví.' }),
  createdAt: z.date(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

export function AddTransactionSheet({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (isOpen: boolean) => void; }) {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>("transactions", []);
  const { toast } = useToast();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      amount: 0,
      description: '',
      createdAt: new Date(),
      walletId: mockWallets[0]?.id,
    },
  });

  function onSubmit(data: TransactionFormValues) {
    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      ...data
    };
    setTransactions([newTransaction, ...transactions]);
    toast({
      title: "Thành công!",
      description: "Đã thêm giao dịch mới.",
    });
    onOpenChange(false);
    form.reset({
      type: 'expense',
      amount: 0,
      description: '',
      createdAt: new Date(),
      walletId: mockWallets[0]?.id,
    });
  }

  const transactionType = form.watch('type');

  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
      if (!open) form.reset();
      onOpenChange(open);
    }}>
      <SheetContent side="bottom" className="rounded-t-lg max-h-[90vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>Thêm giao dịch mới</SheetTitle>
          <SheetDescription>
            Thêm một khoản thu hoặc chi mới vào sổ của bạn.
          </SheetDescription>
        </SheetHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto pr-6 space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <Tabs 
                  value={field.value}
                  onValueChange={(value) => field.onChange(value as TransactionType)}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="expense">Chi tiền</TabsTrigger>
                    <TabsTrigger value="income">Thu tiền</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số tiền</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" placeholder="0" className="text-2xl h-14 font-bold text-right" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="walletId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ví</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                           <Wallet className="mr-2 h-4 w-4" />
                          <SelectValue placeholder="Chọn ví" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockWallets.map(wallet => (
                            <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="createdAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "dd/MM/yy") : <span>Chọn ngày</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="VD: Ăn trưa" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tagId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chọn hạng mục</FormLabel>
                   <ScrollArea className="w-full whitespace-nowrap">
                     <div className="flex w-max space-x-2 p-2">
                        {mockTags
                          .filter(t => transactionType === 'income' ? t.name === 'Thu nhập' : t.name !== 'Thu nhập')
                          .map(tag => (
                            <button 
                              key={tag.id} 
                              type="button"
                              onClick={() => field.onChange(tag.id)} 
                              className={cn(
                                "flex flex-col items-center justify-center space-y-1 p-2 border rounded-lg w-20 h-20 flex-shrink-0 transition-all", 
                                field.value === tag.id ? 'border-primary ring-2 ring-primary bg-primary/10' : 'border-border'
                              )}
                            >
                                <div className={cn("flex items-center justify-center h-8 w-8 rounded-full", tag.bgColor)}>
                                  <tag.icon className={cn("w-5 h-5", tag.textColor)} />
                                </div>
                                <span className="text-xs text-center">{tag.name}</span>
                            </button>
                        ))}
                     </div>
                     <ScrollBar orientation="horizontal" />
                   </ScrollArea>
                   <FormMessage />
                </FormItem>
              )}
            />
          
            <SheetFooter className="pt-4">
                <Button type="submit" className="w-full">Lưu giao dịch</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
