
import type { Wallet, Tag, Transaction } from '@/lib/types';

export const mockTags: Tag[] = [
  {
    id: '1', name: 'Chuyển khoản', icon: 'ArrowRightLeft', textColor: 'text-gray-500', bgColor: 'bg-gray-100',
    createdAt: ''
  },
  {
    id: '2', name: 'Ăn uống', icon: 'Utensils', textColor: 'text-red-500', bgColor: 'bg-red-100', limit: 3000,
    createdAt: ''
  },
  {
    id: '3', name: 'Mua sắm', icon: 'ShoppingCart', textColor: 'text-blue-500', bgColor: 'bg-blue-100',
    createdAt: ''
  },
  {
    id: '4', name: 'Đi lại', icon: 'Car', textColor: 'text-orange-500', bgColor: 'bg-orange-100', limit: 300,
    createdAt: ''
  },
  {
    id: '5', name: 'Nhà cửa', icon: 'House', textColor: 'text-green-500', bgColor: 'bg-green-100', limit: 1100,
    createdAt: ''
  },
  {
    id: '6', name: 'Sức khỏe', icon: 'HeartPulse', textColor: 'text-pink-500', bgColor: 'bg-pink-100',
    createdAt: ''
  },
  {
    id: '7', name: 'Đầu tư', icon: 'Briefcase', textColor: 'text-purple-500', bgColor: 'bg-purple-100',
    createdAt: ''
  },
  {
    id: '8', name: 'Xã giao', icon: 'Baby', textColor: 'text-blue-500', bgColor: 'bg-blue-100',
    createdAt: ''
  },
  {
    id: '9', name: 'Giáo dục', icon: 'GraduationCap', textColor: 'text-teal-500', bgColor: 'bg-teal-100',
    createdAt: ''
  },
  {
    id: '10', name: 'Thu nhập', icon: 'Plus', textColor: 'text-teal-500', bgColor: 'bg-teal-100',
    createdAt: ''
  },
  {
    id: '11', name: 'Cho/tặng', icon: 'Ticket', textColor: 'text-pink-500', bgColor: 'bg-pink-100',
    createdAt: ''
  },
];

export const mockWallets: Wallet[] = [
  {
    id: '1', name: 'Tiền mặt', initialBalance: 5000,
    createdAt: ''
  },
  {
    id: '2', name: 'Ngân hàng', initialBalance: 2000,
    createdAt: ''
  },
];

export const mockTransactions: Transaction[] = [
  { id: '1', walletId: '1', tagId: '3', type: 'expense', amount: 50000, description: 'Cà phê Highland', createdAt: new Date() },
];
