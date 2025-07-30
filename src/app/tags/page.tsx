
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreVertical, Edit, Trash2, type LucideIcon } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { mockTags } from "@/data/mock-data";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import type { Tag, Transaction } from "@/lib/types";
import { TagFormSheet } from "@/components/tags/tag-form-sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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


const TagItem = ({ tag, spent, onEdit, onDelete }: { tag: Tag, spent: number, onEdit: () => void, onDelete: () => void }) => {
    // Handle both component and string icon types
    const IconComponent = typeof tag.icon === 'string' ? icons[tag.icon as keyof typeof icons] : tag.icon as LucideIcon;

    return (
    <Card>
        <CardContent className="p-4 flex items-center space-x-4">
             <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-lg", tag.bgColor)}>
                {IconComponent && <IconComponent className={cn("h-6 w-6", tag.textColor)} />}
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-center">
                    <p className="font-bold">{tag.name}</p>
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-destructive">{formatCurrency(spent)}</p>
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
                </div>
            </div>
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

  const getSpentAmount = (tagId: string) => {
    return transactions
        .filter(t => t.tagId === tagId && t.type === 'expense')
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
      <p className="text-muted-foreground">Tạo và quản lý các hạng mục chi tiêu và thu nhập.</p>
      <div className="space-y-4">
        {tags.map(tag => (
            <TagItem 
                key={tag.id} 
                tag={tag} 
                spent={getSpentAmount(tag.id)} 
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
