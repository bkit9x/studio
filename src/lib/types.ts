
import type { LucideIcon } from 'lucide-react';
import { icons } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';

export type Wallet = {
  id: string;
  name: string;
  initialBalance: number;
  createdAt: Timestamp | Date | string;
};

export type Tag = {
  id: string;
  name: string;
  icon: keyof typeof icons;
  textColor: string;
  bgColor: string;
  limit?: number; // Monthly spending limit
  createdAt: Timestamp | Date | string;
};

export type TransactionType = 'income' | 'expense';

export type Transaction = {
  id: string;
  walletId: string;
  tagId: string;
  type: TransactionType;
  amount: number;
  description: string;
  createdAt: Timestamp | Date | string; 
  sourceWalletId?: string | null;
};
