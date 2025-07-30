import type { LucideIcon } from 'lucide-react';

export type Wallet = {
  id: string;
  name: string;
  initialBalance: number;
};

export type Tag = {
  id: string;
  name: string;
  icon: LucideIcon;
  textColor: string;
  bgColor: string;
};

export type TransactionType = 'income' | 'expense';

export type Transaction = {
  id: string;
  walletId: string;
  tagId: string;
  type: TransactionType;
  amount: number;
  description: string;
  createdAt: Date | string; // Allow string for serialization
};
