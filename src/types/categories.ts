import type { TransactionType } from "@prisma/client";

export type CategoryWithCount = {
  id: string;
  name: string;
  icon: string | null;
  type: TransactionType;
  transactionCount: number;
};
