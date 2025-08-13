
"use client";

import { useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { Calendar as CalendarIcon, Wallet, type LucideIcon, icons, ChevronLeft, ChevronRight, ArrowRightLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { cn } from '@/lib/utils';
import type { Transaction, TransactionType, Wallet as WalletType, Tag } from '@/lib/types';
import { useFirebaseData, useFirestoreTable, useFirestoreWallets } from '@/hooks/use-firebase-data';
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
  peerWalletId: z.string().optional(), // The other wallet in a transfer
}).refine(data => {
    // If peerWalletId is set, it must not be the same as walletId
    if (data.peerWalletId) {
        return data.peerWalletId !== data.walletId;
    }
    return true;
}, {
    message: "Ví nguồn và ví đích không được trùng nhau.",
    path: ["peerWalletId"],
});


type TransactionFormValues = z.infer<typeof transactionSchema>;

const TagButton = ({ tag, isSelected, onClick }: { tag: Tag, isSelected: boolean, onClick: () => void }) => {
    const IconComponent = icons[tag.icon as keyof typeof icons] as LucideIcon | undefined;

    return (
         <button
          key={tag.id}
          type="button"
          onClick={onClick}
          className={cn(
            "flex flex-col items-center justify-center space-y-1 p-2 border rounded-lg w-20 h-20 flex-shrink-0 transition-all",
            isSelected ? 'border-primary ring-2 ring-primary bg-primary/10' : 'border-border'
          )}
        >
            <div className={cn("flex items-center justify-center h-8 w-8 rounded-full", tag.bgColor)}>
              {IconComponent && <IconComponent className={cn("w-5 h-5", tag.textColor)} />}
            </div>
            <span className="text-xs text-center">{tag.name}</span>
        </button>
    )
}

interface AddTransactionSheetProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    transaction?: Transaction;
    selectedWalletId?: string;
}

export function AddTransactionSheet({ isOpen, onOpenChange, transaction, selectedWalletId }: AddTransactionSheetProps) {
  const { wallets, tags } = useFirebaseData();
  const { addItem: addTransaction, updateItem: updateTransaction } = useFirestoreTable<Transaction>('transactions');
  const { updateWalletBalance } = useFirestoreWallets();
  const { toast } = useToast();

  const isEditMode = !!transaction;

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      description: '',
      createdAt: new Date(),
      walletId: selectedWalletId || wallets[0]?.id,
      tagId: undefined,
      peerWalletId: undefined,
    }
  });

  useEffect(() => {
    if (isOpen) {
        if (isEditMode && transaction) {
             form.reset({
                type: transaction.type,
                amount: transaction.amount,
                description: transaction.description,
                createdAt: transaction.createdAt instanceof Date ? transaction.createdAt : new Date(transaction.createdAt as string),
                walletId: transaction.walletId,
                tagId: transaction.tagId,
                peerWalletId: undefined, 
            });
        } else {
            form.reset({
                type: 'expense',
                amount: undefined,
                description: '',
                createdAt: new Date(),
                walletId: selectedWalletId || wallets[0]?.id,
                tagId: undefined,
                peerWalletId: undefined,
            });
        }
    }
  }, [isOpen, transaction, isEditMode, selectedWalletId, wallets, form]);


  const saveTransaction = async (data: TransactionFormValues): Promise<boolean> => {
     const selectedTagName = tags.find(t => t.id === data.tagId)?.name;
     const isTransfer = selectedTagName === 'Chuyển khoản' || selectedTagName === 'Nhận tiền';

     if (isTransfer && !data.peerWalletId) {
        form.setError("peerWalletId", { type: "manual", message: "Vui lòng chọn ví đối ứng." });
        return false;
     }

     if (isEditMode && transaction) {
        const { type, peerWalletId, ...updates } = data; // Type cannot be changed in edit mode
        
        // This is the important part: we need to pass the old transaction to updateWalletBalance
        await updateWalletBalance(transaction.walletId, updates.amount, 'update', transaction);
        await updateTransaction(transaction.id, { ...updates });
        
        toast({ title: "Thành công!", description: "Đã cập nhật giao dịch." });

    } else if (isTransfer && data.peerWalletId) {
        const sourceWalletId = data.type === 'expense' ? data.walletId : data.peerWalletId;
        const destinationWalletId = data.type === 'expense' ? data.peerWalletId : data.walletId;

        const sourceWallet = wallets.find(w => w.id === sourceWalletId);
        const destinationWallet = wallets.find(w => w.id === destinationWalletId);
        
        if (!sourceWallet || !destinationWallet) return false;

        const transferExpenseTag = tags.find(t => t.name === 'Chuyển khoản' && t.type === 'expense');
        const transferIncomeTag = tags.find(t => t.name === 'Nhận tiền' && t.type === 'income');
        
        if (!transferExpenseTag || !transferIncomeTag) return false;

        // Create expense from source wallet
        await addTransaction({ type: 'expense', amount: data.amount, description: data.description || `Chuyển đến ${destinationWallet.name}`, tagId: transferExpenseTag.id, walletId: sourceWallet.id, createdAt: data.createdAt });
        await updateWalletBalance(sourceWallet.id, -data.amount, 'add');

        // Create income to destination wallet
         await addTransaction({ type: 'income', amount: data.amount, description: data.description || `Nhận từ ${sourceWallet.name}`, tagId: transferIncomeTag.id, walletId: destinationWallet.id, createdAt: data.createdAt });
         await updateWalletBalance(destinationWallet.id, data.amount, 'add');

        toast({ title: "Thành công!", description: "Đã tạo giao dịch chuyển tiền." });

    } else {
        // Regular income/expense
        const { peerWalletId, ...transactionData } = data;
        await addTransaction({...transactionData});
        const amount = transactionData.type === 'income' ? transactionData.amount : -transactionData.amount;
        await updateWalletBalance(transactionData.walletId, amount, 'add');
        
        toast({ title: "Thành công!", description: "Đã thêm giao dịch mới." });
    }
    return true;
  }

  const handleSave = async (data: TransactionFormValues) => {
    if (await saveTransaction(data)) {
        onOpenChange(false);
    }
  }

  const handleSaveAndNew = async (data: TransactionFormValues) => {
    if (await saveTransaction(data)) {
        form.reset({
            ...data,
            amount: undefined,
            description: '',
            tagId: undefined,
            peerWalletId: undefined,
        });
    }
  };

  const transactionType = form.watch('type');
  const selectedTagId = form.watch('tagId');
  
  const selectedTagName = tags.find(t => t.id === selectedTagId)?.name;
  const isTransferSelected = selectedTagName === 'Chuyển khoản' || selectedTagName === 'Nhận tiền';
  
  const handleDateChange = (days: number) => {
    const currentDate = form.getValues('createdAt');
    const newDate = days > 0 ? addDays(currentDate, days) : subDays(currentDate, -days);
    form.setValue('createdAt', newDate, { shouldDirty: true, shouldValidate: true });
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-lg max-h-[90vh] flex flex-col p-0">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle>{isEditMode ? 'Cập nhật giao dịch' : 'Thêm giao dịch mới'}</SheetTitle>
          <SheetDescription>
            {isEditMode ? 'Chỉnh sửa thông tin giao dịch của bạn.' : 'Thêm một khoản thu hoặc chi mới vào sổ của bạn.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form className="flex-1 overflow-y-auto px-6 space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <Tabs
                  value={field.value}
                  onValueChange={(value) => {
                    if(isEditMode) return;
                    const newType = value as TransactionType;
                    field.onChange(newType);
                    form.setValue('tagId', '');
                    form.setValue('peerWalletId', undefined);
                  }}
                  className="w-full pt-4"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="expense" disabled={isEditMode}>Chi tiền</TabsTrigger>
                    <TabsTrigger value="income" disabled={isEditMode}>Thu tiền</TabsTrigger>
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
                    <Input {...field} value={field.value ?? ''} type="number" placeholder="0" className="text-xl h-14 font-bold text-right" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="VD: Ăn trưa, Chuyển tiền học" />
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
                    <FormLabel>{transactionType === 'income' ? 'Ví nhận' : 'Ví chi'}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isEditMode}>
                      <FormControl>
                        <SelectTrigger>
                           <Wallet className="mr-2 h-4 w-4" />
                          <SelectValue placeholder="Chọn ví" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {wallets.map(wallet => (
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
                     <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" type="button" onClick={() => handleDateChange(-1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
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
                      <Button size="icon" variant="outline" type="button" onClick={() => handleDateChange(1)}>
                          <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {!isEditMode && isTransferSelected && (
                <FormField
                    control={form.control}
                    name="peerWalletId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>{transactionType === 'expense' ? 'Đến ví' : 'Từ ví'}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <ArrowRightLeft className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Chọn ví đối ứng" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {wallets.filter(w => w.id !== form.getValues('walletId')).map(wallet => (
                                <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            )}


            <FormField
              control={form.control}
              name="tagId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chọn hạng mục</FormLabel>
                   <ScrollArea className="w-full whitespace-nowrap -mx-2 px-4">
                     <div className="flex w-max space-x-2 py-2 mx-1">
                        {tags
                          .filter(t => t.type === transactionType)
                          .map(tag => (
                            <TagButton
                                key={tag.id}
                                tag={tag}
                                isSelected={field.value === tag.id}
                                onClick={() => {
                                    if(isEditMode && (tag.name === 'Chuyển khoản' || tag.name === 'Nhận tiền')) return;
                                    field.onChange(tag.id);
                                    if (tag.name !== 'Chuyển khoản' && tag.name !== 'Nhận tiền') {
                                        form.setValue('peerWalletId', undefined);
                                    }
                                }}
                            />
                        ))}
                     </div>
                     <ScrollBar orientation="horizontal" />
                   </ScrollArea>
                   <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter className="pt-4 sticky bottom-0 bg-background pb-6 flex-row gap-2">
                 {isEditMode ? (
                     <Button onClick={form.handleSubmit(handleSave)} className="w-full">Lưu thay đổi</Button>
                 ) : (
                    <>
                        <Button type="button" onClick={form.handleSubmit(handleSaveAndNew)} variant="outline" className="w-full">
                            Lưu & Nhập tiếp
                        </Button>
                         <Button type="button" onClick={form.handleSubmit(handleSave)} className="w-full">
                            Lưu giao dịch
                        </Button>
                    </>
                 )}
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

    
