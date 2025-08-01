
import type { Wallet, Tag, Transaction } from '@/lib/types';

export const mockTags: Tag[] = [
  { id: '1', name: 'Mua sắm', icon: 'ShoppingCart', textColor: 'text-blue-500', bgColor: 'bg-blue-100', limit: 2000 },
  { id: '2', name: 'Đi lại', icon: 'Car', textColor: 'text-orange-500', bgColor: 'bg-orange-100', limit: 500 },
  { id: '3', name: 'Ăn uống', icon: 'Utensils', textColor: 'text-red-500', bgColor: 'bg-red-100', limit: 3500 },
  { id: '4', name: 'Nhà cửa', icon: 'ShoppingCart', textColor: 'text-green-500', bgColor: 'bg-green-100', limit: 1100 },
  { id: '5', name: 'Quần áo', icon: 'Shirt', textColor: 'text-purple-500', bgColor: 'bg-purple-100' },
  { id: '6', name: 'Sức khỏe', icon: 'HeartPulse', textColor: 'text-pink-500', bgColor: 'bg-pink-100' },
  { id: '7', name: 'Thu nhập', icon: 'Plus', textColor: 'text-teal-500', bgColor: 'bg-teal-100' },
];

export const mockWallets: Wallet[] = [
  { id: '1', name: 'Ví chính', initialBalance: 5000 },
  { id: '2', name: 'Tiết kiệm', initialBalance: 2000 },
];

export const mockTransactions: Transaction[] = [
  { id: '1', walletId: '1', tagId: '7', type: 'income', amount: 15, description: 'Lương tháng 7', createdAt: new Date(new Date().setDate(new Date().getDate() - 1)) },
];
