
import type { LucideIcon } from 'lucide-react';
import { icons } from 'lucide-react';

export type Wallet = {
  id: string;
  name: string;
  initialBalance: number;
};

export type Tag = {
  id: string;
  name: string;
  icon: keyof typeof icons;
  textColor: string;
  bgColor: string;
  limit?: number; // Monthly spending limit
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
  sourceWalletId?: string;
};
