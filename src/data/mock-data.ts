
import type { Wallet, Tag, Transaction } from '@/lib/types';

export const mockTags: Omit<Tag, 'id' | 'createdAt'>[] = [
  { name: 'Chuyển khoản', icon: 'ArrowRightLeft', textColor: 'text-gray-500', bgColor: 'bg-gray-100', type: 'expense' },
  { name: 'Ăn uống', icon: 'Utensils', textColor: 'text-red-500', bgColor: 'bg-red-100', limit: 3000, type: 'expense' },
  { name: 'Mua sắm', icon: 'ShoppingCart', textColor: 'text-blue-500', bgColor: 'bg-blue-100', type: 'expense' },
  { name: 'Đi lại', icon: 'Car', textColor: 'text-orange-500', bgColor: 'bg-orange-100', limit: 300, type: 'expense' },
  { name: 'Nhà cửa', icon: 'House', textColor: 'text-green-500', bgColor: 'bg-green-100', limit: 1100, type: 'expense' },
  { name: 'Sức khỏe', icon: 'HeartPulse', textColor: 'text-pink-500', bgColor: 'bg-pink-100', type: 'expense' },
  { name: 'Đầu tư', icon: 'Briefcase', textColor: 'text-purple-500', bgColor: 'bg-purple-100', type: 'expense' },
  { name: 'Xã giao', icon: 'Baby', textColor: 'text-blue-500', bgColor: 'bg-blue-100', type: 'expense' },
  { name: 'Giáo dục', icon: 'GraduationCap', textColor: 'text-teal-500', bgColor: 'bg-teal-100', type: 'expense' },
  { name: 'Cho/tặng', icon: 'Ticket', textColor: 'text-pink-500', bgColor: 'bg-pink-100', type: 'expense' },
  // Income Tags
  { name: 'Lương', icon: 'Briefcase', textColor: 'text-green-500', bgColor: 'bg-green-100', type: 'income' },
  { name: 'Thưởng', icon: 'Gift', textColor: 'text-yellow-500', bgColor: 'bg-yellow-100', type: 'income' },
  { name: 'Thu nhập phụ', icon: 'Plus', textColor: 'text-teal-500', bgColor: 'bg-teal-100', type: 'income' },
];

export const mockWallets: Omit<Wallet, 'id' | 'createdAt'>[] = [
  { name: 'Tiền mặt', initialBalance: 5000 },
  { name: 'Ngân hàng', initialBalance: 20000 },
];

export const mockTransactions: Transaction[] = [
  { id: '1', walletId: '1', tagId: '3', type: 'expense', amount: 50000, description: 'Cà phê Highland', createdAt: new Date() },
];
