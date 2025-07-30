
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreVertical, Edit, Trash2, type LucideIcon, AlertTriangle } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { mockTags } from "@/data/mock-data";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import type { Tag, Transaction } from "@/lib/types";
import { TagFormSheet } from "@/components/tags/tag-form-sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
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
import { useToast } from "@/hooks/use-toast";
import { icons } from 'lucide-react';
import { getMonth, getYear } from "date-fns";


const TagItem = ({ tag, spent, onEdit, onDelete }: { tag: Tag, spent: number, onEdit: () => void, onDelete: () => void }) => {
    const IconComponent = icons[tag.icon as keyof typeof icons] as LucideIcon | undefined;
    const progress = tag.limit && tag.limit > 0 ? (spent / tag.limit) * 100 : 0;
    const isExceeded = progress > 100;

    return (
    <Card>
        <CardContent className="p-4">
            <div className="flex items-center space-x-4">
                <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-lg", tag.bgColor)}>
                    {IconComponent ? <IconComponent className={cn("h-6 w-6", tag.textColor)} /> : null}
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-center">
                        <p className="font-bold">{tag.name}</p>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={onEdit}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>Chỉnh sửa</span>
                                </DropdownMenuItem>
                                {tag.name !== 'Thu nhập' && ( // Prevent deleting income tag
                                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Xóa</span>
                                </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                     <p className={cn(
                        "text-sm font-medium",
                        isExceeded ? "text-destructive" : "text-muted-foreground"
                    )}>
                        Đã chi: {formatCurrency(spent)}
                        {tag.limit && ` / ${formatCurrency(tag.limit)}`}
                    </p>
                </div>
            </div>
            {tag.limit && tag.limit > 0 && tag.name !== 'Thu nhập' &&(
                <div className="mt-4">
                   <Progress value={progress} className={cn(
                       "h-2",
                       isExceeded && "[&>div]:bg-destructive"
                   )} />
                    {isExceeded && (
                        <div className="flex items-center text-xs mt-1 text-destructive">
                            <AlertTriangle className="h-3 w-3 mr-1"/>
                            <span>Vượt hạn mức!</span>
                        </div>
                    )}
                </div>
            )}
        </CardContent>
    </Card>
    )
};


export default function TagsPage() {
  const [tags, setTags] = useLocalStorage<Tag[]>("tags", mockTags);
  const [transactions] = useLocalStorage<Transaction[]>("transactions", []);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | undefined>(undefined);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAddTag = () => {
    setSelectedTag(undefined);
    setIsSheetOpen(true);
  }

  const handleEditTag = (tag: Tag) => {
    setSelectedTag(tag);
    setIsSheetOpen(true);
  }

  const handleDeleteRequest = (tagId: string) => {
    const isTagInUse = transactions.some(t => t.tagId === tagId);
    if (isTagInUse) {
        toast({
            variant: "destructive",
            title: "Không thể xóa hạng mục",
            description: "Hạng mục này đang được sử dụng trong một hoặc nhiều giao dịch."
        });
        return;
    }
    setTagToDelete(tagId);
    setIsAlertOpen(true);
  }

  const handleDeleteConfirm = () => {
    if (tagToDelete) {
        setTags(tags.filter(t => t.id !== tagToDelete));
        toast({
            title: "Thành công",
            description: "Đã xóa hạng mục."
        });
    }
    setIsAlertOpen(false);
    setTagToDelete(null);
  }
  
  const getMonthlySpentAmount = (tagId: string) => {
    const currentMonth = getMonth(new Date());
    const currentYear = getYear(new Date());
    
    return transactions
        .filter(t => {
            const transactionDate = new Date(t.createdAt);
            return (
                t.tagId === tagId && 
                t.type === 'expense' &&
                getMonth(transactionDate) === currentMonth &&
                getYear(transactionDate) === currentYear
            )
        })
        .reduce((sum, t) => sum + t.amount, 0);
  }

  return (
    <div className="container mx-auto p-4 space-y-4 pb-28 md:pb-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quản lý Hạng mục</h1>
        <Button onClick={handleAddTag}>
            <PlusCircle className="mr-2 h-4 w-4" /> Thêm Hạng mục
        </Button>
      </div>
      <p className="text-muted-foreground">Tạo, quản lý và đặt hạn mức chi tiêu cho các hạng mục.</p>
      <div className="space-y-4">
        {tags
            .filter(t => t.name !== 'Thu nhập')
            .map(tag => (
            <TagItem 
                key={tag.id} 
                tag={tag} 
                spent={getMonthlySpentAmount(tag.id)} 
                onEdit={() => handleEditTag(tag)}
                onDelete={() => handleDeleteRequest(tag.id)}
            />
        ))}
         <h2 className="text-xl font-bold pt-4">Hạng mục Thu nhập</h2>
         {tags
            .filter(t => t.name === 'Thu nhập')
            .map(tag => (
             <TagItem 
                key={tag.id} 
                tag={tag} 
                spent={0}
                onEdit={() => handleEditTag(tag)}
                onDelete={() => handleDeleteRequest(tag.id)}
            />
        ))}
      </div>
       <TagFormSheet 
        isOpen={isSheetOpen} 
        onOpenChange={setIsSheetOpen}
        tag={selectedTag} 
      />
       <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể được hoàn tác. Hạng mục sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Tiếp tục</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
