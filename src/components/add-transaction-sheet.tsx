"use client";

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockTags } from '@/data/mock-data';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export function AddTransactionSheet({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (isOpen: boolean) => void; }) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-lg max-h-[90vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>Thêm giao dịch mới</SheetTitle>
          <SheetDescription>
            Thêm một khoản thu hoặc chi mới vào sổ của bạn.
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto pr-6">
          <div className="space-y-4 py-4">
            <Tabs defaultValue="expense" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="expense">Chi tiền</TabsTrigger>
                <TabsTrigger value="income">Thu tiền</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Số tiền</Label>
                <Input id="amount" type="number" placeholder="0" className="text-2xl h-14 font-bold text-right" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Input id="description" placeholder="VD: Ăn trưa" />
              </div>

              <div className="space-y-2">
                 <Label>Chọn hạng mục</Label>
                 <ScrollArea className="w-full whitespace-nowrap">
                   <div className="flex w-max space-x-2 p-2">
                      {mockTags.filter(t => t.name !== 'Thu nhập').map(tag => (
                          <button 
                            key={tag.id} 
                            onClick={() => setSelectedTag(tag.id)} 
                            className={cn(
                              "flex flex-col items-center justify-center space-y-1 p-2 border rounded-lg w-20 h-20 flex-shrink-0 transition-all", 
                              selectedTag === tag.id ? 'border-primary ring-2 ring-primary bg-primary/10' : 'border-border'
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
              </div>

              <div className="space-y-2">
                <Label>Ngày giao dịch</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Chọn ngày</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>
        
        <SheetFooter>
            <Button onClick={() => onOpenChange(false)} type="submit" className="w-full">Lưu giao dịch</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
