import type { TransactionType, TransactionScope } from "@prisma/client";

export type TransactionWithRelations = {
  id: string;
  amount: number;
  date: Date;
  description: string | null;
  type: TransactionType;
  scope: TransactionScope;
  accountId: string;
  categoryId: string | null;
  workspaceId: string;
  account: {
    id: string;
    name: string;
  };
  category: {
    id: string;
    name: string;
    icon: string | null;
  } | null;
};

export type TransactionFilters = {
  type?: TransactionType;
  accountId?: string;
  categoryId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
};

export type AccountOption = {
  id: string;
  name: string;
};

export type CategoryOption = {
  id: string;
  name: string;
  type: TransactionType;
  icon: string | null;
};
