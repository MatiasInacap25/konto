import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import type { TransactionType } from "@prisma/client";

export type CategoryReport = {
  id: string;
  name: string;
  icon: string | null;
  type: TransactionType;
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
  type: TransactionType;
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

/**
 * Get available months for the selector (months with transactions)
 */
export async function getAvailableMonths(
  workspaceId: string
): Promise<AvailableMonth[]> {
  const user = await getUser();
  if (!user) {
    return [];
  }

  // Get all transactions grouped by month
  const transactions = await prisma.transaction.findMany({
    where: {
      workspaceId,
      workspace: {
        userId: user.id,
      },
    },
    select: {
      date: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  // Group by year-month
  const monthMap = new Map<string, { year: number; month: number; count: number }>();

  for (const tx of transactions) {
    const date = new Date(tx.date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${year}-${month}`;

    if (monthMap.has(key)) {
      monthMap.get(key)!.count++;
    } else {
      monthMap.set(key, { year, month, count: 1 });
    }
  }

  // Convert to array and add month names
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  return Array.from(monthMap.entries())
    .sort((a, b) => {
      if (a[1].year !== b[1].year) return b[1].year - a[1].year;
      return b[1].month - a[1].month;
    })
    .map(([_, data]) => ({
      year: data.year,
      month: data.month,
      monthName: monthNames[data.month - 1],
      transactionCount: data.count,
    }));
}

/**
 * Get report data for a specific month
 */
export async function getMonthlyReport(
  workspaceId: string,
  year: number,
  month: number
): Promise<MonthlyReport | null> {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // Calculate date range for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  // Get previous month for comparison
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevStartDate = new Date(prevYear, prevMonth - 1, 1);
  const prevEndDate = new Date(prevYear, prevMonth, 0, 23, 59, 59, 999);

  // Get all transactions for the month with relations
  const transactions = await prisma.transaction.findMany({
    where: {
      workspaceId,
      workspace: {
        userId: user.id,
      },
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      category: true,
      account: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  // Get previous month transactions for comparison
  const prevMonthTransactions = await prisma.transaction.findMany({
    where: {
      workspaceId,
      workspace: {
        userId: user.id,
      },
      date: {
        gte: prevStartDate,
        lte: prevEndDate,
      },
    },
    select: {
      type: true,
      amount: true,
    },
  });

  // Calculate totals
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const tx of transactions) {
    const amount = Number(tx.amount);
    if (tx.type === "INCOME") {
      totalIncome += amount;
    } else {
      totalExpenses += amount;
    }
  }

  // Calculate previous month totals
  let prevIncome = 0;
  let prevExpenses = 0;

  for (const tx of prevMonthTransactions) {
    const amount = Number(tx.amount);
    if (tx.type === "INCOME") {
      prevIncome += amount;
    } else {
      prevExpenses += amount;
    }
  }

  // Calculate deltas
  const incomeDelta = totalIncome - prevIncome;
  const expenseDelta = totalExpenses - prevExpenses;
  const incomeDeltaPercent = prevIncome > 0 ? (incomeDelta / prevIncome) * 100 : 0;
  const expenseDeltaPercent = prevExpenses > 0 ? (expenseDelta / prevExpenses) * 100 : 0;

  // Group by category
  const categoryMap = new Map<string, CategoryReport>();

  for (const tx of transactions) {
    const categoryId = tx.categoryId || "uncategorized";
    const categoryName = tx.category?.name || "Sin categoría";
    const categoryIcon = tx.category?.icon || "📋";
    const categoryType = tx.category?.type || "EXPENSE";
    const amount = Number(tx.amount);

    if (!categoryMap.has(categoryId)) {
      categoryMap.set(categoryId, {
        id: categoryId,
        name: categoryName,
        icon: categoryIcon,
        type: categoryType,
        amount: 0,
        percentage: 0,
        transactionCount: 0,
      });
    }

    const cat = categoryMap.get(categoryId)!;
    cat.amount += amount;
    cat.transactionCount++;
  }

  // Calculate percentages (based on total expenses for expense categories)
  const categories = Array.from(categoryMap.values())
    .sort((a, b) => b.amount - a.amount);

  // Calculate percentages for expenses and incomes separately
  for (const cat of categories) {
    if (cat.type === "EXPENSE") {
      cat.percentage = totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0;
    } else {
      cat.percentage = totalIncome > 0 ? (cat.amount / totalIncome) * 100 : 0;
    }
  }

  // Format transactions
  const formattedTransactions: ReportTransaction[] = transactions.map((tx) => ({
    id: tx.id,
    amount: Number(tx.amount),
    date: tx.date,
    description: tx.description,
    type: tx.type,
    categoryId: tx.categoryId,
    categoryName: tx.category?.name || null,
    categoryIcon: tx.category?.icon || null,
    accountName: tx.account.name,
  }));

  return {
    year,
    month,
    monthName: monthNames[month - 1],
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    transactionCount: transactions.length,
    categories,
    transactions: formattedTransactions,
    comparison: {
      incomeDelta,
      expenseDelta,
      incomeDeltaPercent,
      expenseDeltaPercent,
    },
  };
}
