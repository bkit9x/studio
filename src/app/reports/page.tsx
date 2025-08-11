
"use client";

import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { useFirebaseData } from '@/hooks/use-firebase-data';
import type { Transaction, Tag } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/reports/date-range-picker';
import { ReportsChart } from '@/components/reports/reports-chart';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { icons, type LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type Preset = 'today' | 'last7' | 'thisMonth' | 'thisYear' | 'all' | 'custom';

const getPresetDateRange = (preset: Preset): DateRange | undefined => {
    const now = new Date();
    switch (preset) {
        case 'today':
            return { from: now, to: now };
        case 'last7':
            return { from: subDays(now, 6), to: now };
        case 'thisMonth':
            return { from: startOfMonth(now), to: endOfMonth(now) };
        case 'thisYear':
            return { from: startOfYear(now), to: endOfYear(now) };
        case 'all':
            return { from: undefined, to: undefined };
        default:
            return undefined;
    }
};

const CategorySpendingItem = ({ tag, amount, percentage }: { tag: Tag, amount: number, percentage: number }) => {
    const IconComponent = icons[tag.icon as keyof typeof icons] as LucideIcon | undefined;
    
    return (
        <div className="flex items-center space-x-4 p-2 rounded-lg hover:bg-muted/50">
             <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", tag.bgColor)}>
                {IconComponent && <IconComponent className={cn("h-5 w-5", tag.textColor)} />}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                    <p className="font-medium truncate">{tag.name}</p>
                    <p className="font-bold text-destructive">{formatCurrency(amount)}</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                     <div className="w-full bg-muted rounded-full h-1.5">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground w-12 text-right">{percentage.toFixed(0)}%</span>
                </div>
            </div>
        </div>
    )
}


export default function ReportsPage() {
    const { transactions, tags, isLoading } = useFirebaseData();
    const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: subDays(new Date(), 6), to: new Date() });
    const [preset, setPreset] = useState<Preset>('last7');

    const handlePresetChange = (value: Preset) => {
        setPreset(value);
        if (value !== 'custom') {
            setDateRange(getPresetDateRange(value));
        }
    };
    
    const handleDateRangeChange = (range: DateRange | undefined) => {
        setPreset('custom');
        setDateRange(range);
    }

    const filteredTransactions = transactions.filter(t => {
        if (t.type !== 'expense') return false;
        const txDate = new Date(t.createdAt as string);
        const from = dateRange?.from;
        const to = dateRange?.to;

        if (from && txDate < from) return false;
        // Set 'to' to the end of the day for inclusive filtering
        if (to) {
            const toEndOfDay = new Date(to);
            toEndOfDay.setHours(23, 59, 59, 999);
            if (txDate > toEndOfDay) return false;
        }
        
        return true;
    });
    
    const spendingByCategory = filteredTransactions.reduce((acc, t) => {
        if (!acc[t.tagId]) {
            acc[t.tagId] = 0;
        }
        acc[t.tagId] += t.amount;
        return acc;
    }, {} as Record<string, number>);
    
    const totalSpent = Object.values(spendingByCategory).reduce((sum, amount) => sum + amount, 0);

    const chartData = Object.entries(spendingByCategory)
        .map(([tagId, amount]) => {
            const tag = tags.find(t => t.id === tagId);
            return {
                name: tag?.name ?? 'Không rõ',
                value: amount,
                fill: `hsl(var(--${tag?.name === 'Mua sắm' ? 'chart-1' : tag?.name === 'Ăn uống' ? 'chart-2' : 'primary'}))`,
            };
        })
        .sort((a,b) => b.value - a.value); // Sort for better visualization
        
    const sortedCategories = Object.entries(spendingByCategory)
        .sort(([, a], [, b]) => b - a)
        .map(([tagId, amount]) => ({
            tag: tags.find(t => t.id === tagId)!,
            amount,
        }))
        .filter(item => item.tag); // Ensure tag exists

    return (
        <div className="container mx-auto p-4 space-y-6 pb-28 md:pb-4">
            <header>
                <h1 className="text-xl font-bold">Báo cáo & Thống kê</h1>
                <p className="text-muted-foreground">Phân tích chi tiêu của bạn.</p>
            </header>
            
            <div className="grid grid-cols-2 gap-2">
                 <Select value={preset} onValueChange={handlePresetChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Chọn khoảng thời gian" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="today">Hôm nay</SelectItem>
                        <SelectItem value="last7">7 ngày qua</SelectItem>
                        <SelectItem value="thisMonth">Tháng này</SelectItem>
                        <SelectItem value="thisYear">Năm này</SelectItem>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="custom" disabled>Tùy chỉnh</SelectItem>
                    </SelectContent>
                </Select>
                <DateRangePicker date={dateRange} onDateChange={handleDateRangeChange} />
            </div>
            
            {isLoading ? (
                 <Card>
                    <CardHeader><CardTitle>Phân tích chi tiêu</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            ) : (
                <>
                <Card>
                    <CardHeader>
                        <CardTitle>Phân tích chi tiêu</CardTitle>
                        <p className="text-muted-foreground text-sm">Tổng chi: <span className="font-bold text-destructive">{formatCurrency(totalSpent)}</span></p>
                    </CardHeader>
                    <CardContent>
                        {filteredTransactions.length > 0 ? (
                             <ReportsChart data={chartData} />
                        ) : (
                            <div className="h-48 flex items-center justify-center text-muted-foreground">
                                Không có dữ liệu chi tiêu trong khoảng thời gian này.
                            </div>
                        )}
                       
                    </CardContent>
                </Card>
                
                {sortedCategories.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Chi tiết theo hạng mục</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {sortedCategories.map(({ tag, amount }) => (
                           <CategorySpendingItem 
                                key={tag.id}
                                tag={tag}
                                amount={amount}
                                percentage={(amount / totalSpent) * 100}
                           />
                        ))}
                    </CardContent>
                </Card>
                )}
                </>
            )}
        </div>
    );
}

