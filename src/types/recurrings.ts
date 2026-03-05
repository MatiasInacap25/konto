import type { Frequency, TransactionType, TransactionScope } from "@prisma/client";

export type RecurringWithRelations = {
  id: string;
  name: string;
  amount: number;
  frequency: Frequency;
  nextPayment: Date;
  isActive: boolean;
  type: TransactionType;
  scope: TransactionScope;
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
};

export type RecurringFormData = {
  id?: string;
  name: string;
  amount: number;
  frequency: Frequency;
  nextPayment: Date;
  type: TransactionType;
  scope: TransactionScope;
  accountId: string | null;
  categoryId: string | null;
  workspaceId: string;
};
