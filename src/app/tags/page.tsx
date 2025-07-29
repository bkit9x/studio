import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { mockTags } from "@/data/mock-data";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/formatters";

const TagItem = ({ tag, spent, limit }: { tag: (typeof mockTags)[0], spent: number, limit: number }) => (
    <Card>
        <CardContent className="p-4 flex items-center space-x-4">
            <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-lg", tag.bgColor)}>
                <tag.icon className={cn("h-6 w-6", tag.textColor)} />
            </div>
            <div className="flex-1">
                <div className="flex justify-between">
                    <p className="font-bold">{tag.name}</p>
                    <p className="text-sm font-medium">{formatCurrency(spent)}</p>
                </div>
                <Progress value={(spent / limit) * 100} className="h-2 mt-1" />
                <p className="text-xs text-muted-foreground text-right mt-1">Hạn mức: {formatCurrency(limit)}</p>
            </div>
        </CardContent>
    </Card>
);


export default function TagsPage() {
  return (
    <div className="container mx-auto p-4 space-y-4 pb-28 md:pb-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quản lý Hạng mục</h1>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Thêm Hạng mục
        </Button>
      </div>
      <p className="text-muted-foreground">Tạo và quản lý các hạng mục chi tiêu.</p>
      <div className="space-y-4">
        {mockTags.filter(t => t.name !== 'Thu nhập').map(tag => (
            <TagItem key={tag.id} tag={tag} spent={Math.random() * 2000000} limit={2000000} />
        ))}
      </div>
    </div>
  );
}
