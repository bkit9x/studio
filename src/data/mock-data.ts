
import type { Wallet, Tag, Transaction } from '@/lib/types';

export const mockTags: Tag[] = [
  { id: '1', name: 'Mua sắm', icon: 'ShoppingCart', textColor: 'text-blue-500', bgColor: 'bg-blue-100', limit: 2000000 },
  { id: '2', name: 'Đi lại', icon: 'Car', textColor: 'text-orange-500', bgColor: 'bg-orange-100', limit: 500000 },
  { id: '3', name: 'Ăn uống', icon: 'Utensils', textColor: 'text-red-500', bgColor: 'bg-red-100', limit: 3000000 },
  { id: '4', name: 'Nhà cửa', icon: 'Landmark', textColor: 'text-green-500', bgColor: 'bg-green-100', limit: 2500000 },
  { id: '5', name: 'Quần áo', icon: 'Shirt', textColor: 'text-purple-500', bgColor: 'bg-purple-100' },
  { id: '6', name: 'Sức khỏe', icon: 'HeartPulse', textColor: 'text-pink-500', bgColor: 'bg-pink-100' },
  { id: '7', name: 'Thu nhập', icon: 'Plus', textColor: 'text-teal-500', bgColor: 'bg-teal-100' },
  { id: '8', name: 'Chuyển khoản', icon: 'ArrowRightLeft', textColor: 'text-gray-500', bgColor: 'bg-gray-100' },
];

export const mockWallets: Wallet[] = [
  { id: '1', name: 'Ví chính', initialBalance: 5000000 },
  { id: '2', name: 'Tiết kiệm', initialBalance: 20000000 },
];

export const mockTransactions: Transaction[] = [
  { id: '1', walletId: '1', tagId: '3', type: 'expense', amount: 50000, description: 'Cà phê Highland', createdAt: new Date() },
  { id: '2', walletId: '1', tagId: '1', type: 'expense', amount: 1200000, description: 'Mua sắm Shopee', createdAt: new Date(new Date().setDate(new Date().getDate() - 1)) },
  { id: '3', walletId: '1', tagId: '7', type: 'income', amount: 15000000, description: 'Lương tháng 7', createdAt: new Date(new Date().setDate(new Date().getDate() - 1)) },
  { id: '4', walletId: '1', tagId: '2', type: 'expense', amount: 70000, description: 'Grab đi làm', createdAt: new Date(new Date().setDate(new Date().getDate() - 2)) },
  { id: '5', walletId: '1', tagId: '4', type: 'expense', amount: 2000000, description: 'Tiền nhà', createdAt: new Date(new Date().setDate(new Date().getDate() - 2)) },
  { id: '6', walletId: '1', tagId: '3', type: 'expense', amount: 250000, description: 'Ăn tối cùng bạn bè', createdAt: new Date(new Date().setDate(new Date().getDate() - 3)) },
];
