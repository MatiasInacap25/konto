import type { Frequency, TransactionType } from "@prisma/client";

export type RecurringWithRelations = {
  id: string;
  name: string;
  amount: number;
  frequency: Frequency;
  nextPayment: Date;
  isActive: boolean;
  type: TransactionType;
  workspaceId: string;
  accountId: string | null;
  categoryId: string | null;
  createdAt: Date;
  updatedAt: Date;
  account?: {
    id: string;
    name: string;
  } | null;
  category?: {
    id: string;
    name: string;
    icon: string | null;
  } | null;
  transactionCount?: number;
};

export type RecurringFormData = {
  id?: string;
  name: string;
  amount: number;
  frequency: Frequency;
  nextPayment: Date;
  type: TransactionType;
  accountId: string | null;
  categoryId: string | null;
  workspaceId: string;
};
