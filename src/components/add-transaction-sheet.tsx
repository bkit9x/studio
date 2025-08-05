
"use client";

import { useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { Calendar as CalendarIcon, Wallet, type LucideIcon, icons, ChevronLeft, ChevronRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { cn } from '@/lib/utils';
import type { Transaction, TransactionType, Wallet as WalletType, Tag } from '@/lib/types';
import { useFirebaseData, useFirestoreTable } from '@/hooks/use-firebase-data';
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
  sourceWalletId: z.string().optional(),
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
      sourceWalletId: undefined,
    }
  });

  useEffect(() => {
    if (isOpen) {
        if (isEditMode && transaction) {
             form.reset({
                type: transaction.type,
                amount: transaction.amount,
                description: transaction.description,
                createdAt: transaction.createdAt instanceof Date ? transaction.createdAt : new Date(transaction.createdAt),
                walletId: transaction.walletId,
                tagId: transaction.tagId,
                sourceWalletId: transaction.sourceWalletId || undefined,
            });
        } else {
            form.reset({
                type: 'expense',
                amount: undefined, // Default to empty instead of 0
                description: '',
                createdAt: new Date(),
                walletId: selectedWalletId || wallets[0]?.id,
                tagId: undefined,
                sourceWalletId: undefined,
            });
        }
    }
  }, [isOpen, transaction, isEditMode, selectedWalletId, wallets, form]);


  const saveTransaction = async (data: TransactionFormValues): Promise<boolean> => {
     if (isEditMode && transaction) {
        const { type, ...updates } = data; // cannot update type
        await updateTransaction(transaction.id, {
            ...updates,
        });
        toast({
            title: "Thành công!",
            description: "Đã cập nhật giao dịch.",
        });
    } else {
        if (data.type === 'income' && data.sourceWalletId && data.sourceWalletId !== 'none' && data.sourceWalletId !== data.walletId) {
            // Transfer between wallets
            const sourceWallet = wallets.find(w => w.id === data.sourceWalletId);
            const destinationWallet = wallets.find(w => w.id === data.walletId);
            const transferTag = tags.find(t => t.name === 'Chuyển khoản') || tags[0];

            if (!sourceWallet || !destinationWallet) {
                toast({ variant: 'destructive', title: 'Lỗi', description: 'Không tìm thấy ví.' });
                return false;
            }

            const expenseTransaction = {
                type: 'expense' as TransactionType,
                amount: data.amount,
                description: `Chuyển tiền đến ${destinationWallet.name}`,
                tagId: transferTag.id,
                walletId: sourceWallet.id,
                createdAt: data.createdAt,
                sourceWalletId: data.sourceWalletId,
            };

            const incomeTransaction = {
                type: 'income' as TransactionType,
                amount: data.amount,
                description: `Nhận tiền từ ${sourceWallet.name}`,
                tagId: data.tagId,
                walletId: data.walletId,
                createdAt: data.createdAt,
                sourceWalletId: data.sourceWalletId,
            };

            await addTransaction(expenseTransaction);
            await addTransaction(incomeTransaction);

            toast({
                title: "Thành công!",
                description: "Đã tạo giao dịch chuyển tiền.",
            });

        } else {
            // Regular income/expense
            await addTransaction(data);
            toast({
              title: "Thành công!",
              description: "Đã thêm giao dịch mới.",
            });
        }
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
        // Reset form but keep some fields
        form.reset({
            ...data, // This keeps wallet, tag, date, type
            amount: undefined,
            description: '',
        });
    }
  };

  const transactionType = form.watch('type');
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
                    if(isEditMode) return; // Prevent changing type in edit mode
                    const newType = value as TransactionType;
                    field.onChange(newType);
                    form.setValue('tagId', '');
                    if (newType === 'income') {
                        const incomeTag = tags.find(t => t.name === 'Thu nhập');
                        if (incomeTag) {
                            form.setValue('tagId', incomeTag.id);
                        }
                    }
                  }}
                  className="w-full pt-4"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="expense" disabled={isEditMode && transaction?.type === 'income'}>Chi tiền</TabsTrigger>
                    <TabsTrigger value="income" disabled={isEditMode && transaction?.type === 'expense'}>Thu tiền</TabsTrigger>
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
                    <Input {...field} placeholder="VD: Ăn trưa" />
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
                    <FormLabel>{transactionType === 'income' ? 'Đến ví' : 'Từ ví'}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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

            {transactionType === 'income' && !isEditMode && (
                 <FormField
                    control={form.control}
                    name="sourceWalletId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Từ ví (Tùy chọn)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <Wallet className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Chuyển tiền từ ví..." />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="none">Không chọn</SelectItem>
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
                          .filter(t => transactionType === 'income' ? t.name === 'Thu nhập' : t.name !== 'Thu nhập')
                          .map(tag => (
                            <TagButton
                                key={tag.id}
                                tag={tag}
                                isSelected={field.value === tag.id}
                                onClick={() => field.onChange(tag.id)}
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
