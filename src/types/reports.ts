export type CategoryReport = {
  id: string;
  name: string;
  icon: string | null;
  type: "INCOME" | "EXPENSE";
  amount: number;
  percentage: number;
  transactionCount: number;
};

export type MonthlyComparison = {
  incomeDelta: number;
  expenseDelta: number;
  incomeDeltaPercent: number;
  expenseDeltaPercent: number;
};

export type ReportTransaction = {
  id: string;
  amount: number;
  date: Date;
  description: string | null;
  type: "INCOME" | "EXPENSE";
  categoryId: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  accountName: string;
};

export type MonthlyReport = {
  year: number;
  month: number;
  monthName: string;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
  categories: CategoryReport[];
  transactions: ReportTransaction[];
  comparison: MonthlyComparison | null;
};

export type AvailableMonth = {
  year: number;
  month: number;
  monthName: string;
  transactionCount: number;
};
