
import type { Wallet, Tag, Transaction } from '@/lib/types';

export const mockTags: Omit<Tag, 'id' | 'createdAt'>[] = [
  // Expense Tags
  { name: 'Chuyển khoản', icon: 'ArrowRightLeft', textColor: 'text-gray-500', bgColor: 'bg-gray-100', type: 'expense' },
  { name: 'Ăn uống', icon: 'Utensils', textColor: 'text-red-500', bgColor: 'bg-red-100', limit: 3000000, type: 'expense' },
  { name: 'Mua sắm', icon: 'ShoppingCart', textColor: 'text-blue-500', bgColor: 'bg-blue-100', limit: 2000000, type: 'expense' },
  { name: 'Đi lại', icon: 'Car', textColor: 'text-orange-500', bgColor: 'bg-orange-100', limit: 500000, type: 'expense' },
  { name: 'Nhà cửa', icon: 'House', textColor: 'text-green-500', bgColor: 'bg-green-100', limit: 2500000, type: 'expense' },
  { name: 'Quần áo', icon: 'Shirt', textColor: 'text-purple-500', bgColor: 'bg-purple-100', type: 'expense' },
  { name: 'Sức khỏe', icon: 'HeartPulse', textColor: 'text-pink-500', bgColor: 'bg-pink-100', type: 'expense' },
  { name: 'Giáo dục', icon: 'GraduationCap', textColor: 'text-teal-500', bgColor: 'bg-teal-100', type: 'expense' },
  { name: 'Quà tặng', icon: 'Gift', textColor: 'text-pink-500', bgColor: 'bg-pink-100', type: 'expense' },
  { name: 'Khác', icon: 'Coins', textColor: 'text-gray-500', bgColor: 'bg-gray-100', type: 'expense' },
  
  // Income Tags
  { name: 'Nhận tiền', icon: 'ArrowRightLeft', textColor: 'text-gray-500', bgColor: 'bg-gray-100', type: 'income' },
  { name: 'Lương', icon: 'Landmark', textColor: 'text-green-500', bgColor: 'bg-green-100', type: 'income' },
  { name: 'Thưởng', icon: 'Gift', textColor: 'text-yellow-500', bgColor: 'bg-yellow-100', type: 'income' },
  { name: 'Thu nhập phụ', icon: 'Plus', textColor: 'text-teal-500', bgColor: 'bg-teal-100', type: 'income' },
  { name: 'Khác', icon: 'Coins', textColor: 'text-gray-500', bgColor: 'bg-gray-100', type: 'income' },
];

export const mockWallets: Omit<Wallet, 'id' | 'createdAt'>[] = [
  { name: 'Ví chính', initialBalance: 5000000 },
  { name: 'Tiết kiệm', initialBalance: 20000000 },
];
