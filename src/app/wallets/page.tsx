import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

const WalletItem = ({ name, income, expense }: { name: string; income: number; expense: number }) => (
    <Card>
        <CardHeader>
            <CardTitle>{name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
            <div className="flex justify-between">
                <span className="text-muted-foreground">Thu:</span>
                <span className="font-medium text-[hsl(var(--chart-2))]">{formatCurrency(income)}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-muted-foreground">Chi:</span>
                <span className="font-medium text-destructive">{formatCurrency(expense)}</span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t">
                <span>Số dư:</span>
                <span>{formatCurrency(income - expense)}</span>
            </div>
        </CardContent>
    </Card>
);

export default function WalletsPage() {
  return (
    <div className="container mx-auto p-4 space-y-4 pb-28 md:pb-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quản lý Ví</h1>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Thêm Ví
        </Button>
      </div>
      <p className="text-muted-foreground">Quản lý tất cả các ví của bạn ở một nơi.</p>
      <div className="space-y-4">
        <WalletItem name="Ví chính" income={15000000} expense={3570000} />
        <WalletItem name="Ví tiết kiệm" income={1000000} expense={0} />
      </div>
    </div>
  );
}
