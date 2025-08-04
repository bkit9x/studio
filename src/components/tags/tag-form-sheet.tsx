
"use client";

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { icons, type LucideIcon } from 'lucide-react';

import type { Tag } from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';
import { mockTags } from '@/data/mock-data';
import { cn } from '@/lib/utils';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const spendingIcons = [
  'ShoppingCart', 'Utensils', 'Car', 'Home', 'Shirt', 'HeartPulse', 'Gift', 'GraduationCap',
  'Plane', 'House', 'PiggyBank', 'ArrowRightLeft', 'BanknoteArrowUp', 'BanknoteArrowDown', 'Coffee', 'Pizza',
  'Droplets', 'Plug', 'Wifi', 'Phone', 'PawPrint', 'Train', 'Bus', 'Bicycle',
  'Dumbbell', 'Sprout', 'Ticket', 'Landmark', 'Wrench', 'Baby', 'Cake',
  'Laptop', 'Tablet', 'Smartphone', 'Watch', 'Tv', 'Headphones', 'MousePointer'
] as const;

const incomeIcons = ['Plus', 'Landmark', 'Briefcase', 'Gift'] as const;

const iconNames = [...new Set([...spendingIcons, ...incomeIcons])];


const colors = [
    { name: 'Xanh dương', textColor: 'text-blue-500', bgColor: 'bg-blue-100' },
    { name: 'Cam', textColor: 'text-orange-500', bgColor: 'bg-orange-100' },
    { name: 'Đỏ', textColor: 'text-red-500', bgColor: 'bg-red-100' },
    { name: 'Xanh lá', textColor: 'text-green-500', bgColor: 'bg-green-100' },
    { name: 'Tím', textColor: 'text-purple-500', bgColor: 'bg-purple-100' },
    { name: 'Hồng', textColor: 'text-pink-500', bgColor: 'bg-pink-100' },
    { name: 'Mòng két', textColor: 'text-teal-500', bgColor: 'bg-teal-100' },
    { name: 'Vàng', textColor: 'text-yellow-500', bgColor: 'bg-yellow-100' },
    { name: 'Xám', textColor: 'text-gray-500', bgColor: 'bg-gray-100' },
];

const tagSchema = z.object({
  name: z.string().min(1, { message: 'Tên hạng mục không được để trống.' }),
  icon: z.string().min(1, { message: 'Vui lòng chọn một biểu tượng.' }),
  colorIndex: z.coerce.number().min(0).max(colors.length - 1),
  limit: z.coerce.number().min(0, { message: 'Hạn mức phải là số không âm.' }).optional(),
});

type TagFormValues = z.infer<typeof tagSchema>;

interface TagFormSheetProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    tag?: Tag;
}

export function TagFormSheet({ isOpen, onOpenChange, tag }: TagFormSheetProps) {
  const [tags, setTags] = useLocalStorage<Tag[]>("tags", mockTags);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
        name: '',
        icon: 'ShoppingCart',
        colorIndex: 0,
        limit: 0,
    }
  });

  useEffect(() => {
    if (isOpen) {
        // Prevent keyboard from popping up on mobile
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }

        if (tag) {
            const colorIndex = colors.findIndex(c => c.bgColor === tag.bgColor);
            form.reset({
                name: tag.name,
                icon: tag.icon,
                colorIndex: colorIndex !== -1 ? colorIndex : 0,
                limit: tag.limit ?? 0,
            });
        } else {
            form.reset({
                name: '',
                icon: 'ShoppingCart',
                colorIndex: 0,
                limit: 0,
            });
        }
    }
  }, [tag, form, isOpen]);


  function onSubmit(data: TagFormValues) {
    const selectedColor = colors[data.colorIndex];
    const newTagData = {
        name: data.name,
        icon: data.icon as keyof typeof icons,
        textColor: selectedColor.textColor,
        bgColor: selectedColor.bgColor,
        limit: data.limit || undefined, // Store as undefined if 0 or empty
    };
    
    if(tag) {
        const updatedTags = tags.map(t => t.id === tag.id ? { ...t, ...newTagData } : t);
        setTags(updatedTags);
        toast({
            title: "Thành công!",
            description: "Đã cập nhật hạng mục.",
        });
    } else { 
        const newTag: Tag = {
            id: crypto.randomUUID(),
            name: newTagData.name,
            icon: newTagData.icon,
            textColor: newTagData.textColor,
            bgColor: newTagData.bgColor,
            limit: newTagData.limit,
        };
        setTags([...tags, newTag]);
        toast({
            title: "Thành công!",
            description: "Đã thêm hạng mục mới.",
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
  
  const selectedIconName = form.watch('icon');
  const SelectedIcon = icons[selectedIconName as keyof typeof icons] ?? icons['ShoppingCart'];
  const selectedColorIndex = form.watch('colorIndex');
  const selectedColor = colors[selectedColorIndex];


  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-lg max-h-[90vh] flex flex-col">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle>{tag ? 'Chỉnh sửa hạng mục' : 'Thêm hạng mục mới'}</SheetTitle>
          <SheetDescription>
            {tag ? 'Cập nhật thông tin cho hạng mục của bạn.' : 'Tạo một hạng mục mới để phân loại giao dịch.'}
          </SheetDescription>
        </SheetHeader>
        
        <Form {...form}>
          <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 space-y-4 pt-4">

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên hạng mục</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="VD: Mua sắm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
                control={form.control}
                name="limit"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Hạn mức chi tiêu hàng tháng (Tùy chọn)</FormLabel>
                    <FormControl>
                    <Input {...field} type="number" placeholder="0" />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Biểu tượng</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <div className="flex items-center gap-2">
                            {SelectedIcon && <SelectedIcon />}
                            <SelectValue placeholder="Chọn biểu tượng" />
                        </div>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <ScrollArea className="h-72">
                         {iconNames.map((iconName) => {
                            const IconComponent = icons[iconName as keyof typeof icons];
                            if (!IconComponent) return null;
                            return (
                                <SelectItem key={iconName} value={iconName}>
                                    <div className="flex items-center gap-2">
                                        <IconComponent className="h-4 w-4" />
                                        <span>{iconName}</span>
                                    </div>
                                </SelectItem>
                            )
                         })}
                        </ScrollArea>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
              control={form.control}
              name="colorIndex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Màu sắc</FormLabel>
                   <div className="flex flex-wrap gap-2">
                      {colors.map((color, index) => (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => field.onChange(index)}
                          className={cn(
                              "h-10 w-10 rounded-full border-2",
                              color.bgColor,
                              field.value === index ? 'border-primary ring-2 ring-primary' : 'border-transparent'
                          )}
                           aria-label={color.name}
                        />
                      ))}
                   </div>
                   <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-center space-x-4 rounded-lg p-4 border">
                <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-lg", selectedColor.bgColor)}>
                    {SelectedIcon && <SelectedIcon className={cn("h-6 w-6", selectedColor.textColor)} />}
                </div>
                <div className="flex-1">
                    <p className="font-bold">{form.watch('name') || 'Tên hạng mục'}</p>
                    <p className="text-sm text-muted-foreground">Đây là giao diện xem trước</p>
                </div>
            </div>

          
            <SheetFooter className="pt-4 sticky bottom-0 bg-background pb-6">
                <Button type="submit" className="w-full">{tag ? 'Lưu thay đổi' : 'Tạo hạng mục'}</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
