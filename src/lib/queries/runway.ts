import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import type { Frequency, TransactionType } from "@prisma/client";

export type RunwayRecurring = {
  id: string;
  name: string;
  amount: number;
  frequency: Frequency;
  type: TransactionType;
};

export type HistoricalAverages = {
  avgMonthlyIncome: number;
  avgMonthlyExpense: number;
  monthsAnalyzed: number;
};

export type RunwayData = {
  currentBalance: number;
  currency: string;
  recurrings: RunwayRecurring[];
  historical: HistoricalAverages;
};

/**
 * Get all data needed for the runway projection page:
 * - Sum of active account balances
 * - Active recurrings with amount, frequency, type
 * - Historical averages from last 3 complete months
 */
export const getRunwayData = cache(
  async (workspaceId: string): Promise<RunwayData | null> => {
    const user = await getUser();
    if (!user) return null;

    // Verify workspace ownership
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: user.id },
      select: { id: true, currency: true },
    });

    if (!workspace) return null;

    // Fetch all three data sets in parallel
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [accounts, recurrings, historicalTransactions] = await Promise.all([
      prisma.account.findMany({
        where: {
          workspaceId,
          archivedAt: null,
        },
        select: { balance: true },
      }),
      prisma.recurring.findMany({
        where: {
          workspaceId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          amount: true,
          frequency: true,
          type: true,
        },
      }),
      prisma.transaction.findMany({
        where: {
          workspaceId,
          workspace: { userId: user.id },
          date: {
            gte: threeMonthsAgo,
            lt: currentMonthStart, // Exclude current (incomplete) month
          },
        },
        select: {
          amount: true,
          type: true,
          date: true,
        },
      }),
    ]);

    const currentBalance = accounts.reduce(
      (sum, acc) => sum + Number(acc.balance),
      0
    );

    const formattedRecurrings: RunwayRecurring[] = recurrings.map((r) => ({
      id: r.id,
      name: r.name,
      amount: Number(r.amount),
      frequency: r.frequency,
      type: r.type,
    }));

    // Group by month and calculate totals
    const monthTotals = new Map<
      string,
      { income: number; expense: number }
    >();

    for (const tx of historicalTransactions) {
      const date = new Date(tx.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!monthTotals.has(key)) {
        monthTotals.set(key, { income: 0, expense: 0 });
      }
      const totals = monthTotals.get(key)!;
      const amount = Number(tx.amount);
      if (tx.type === "INCOME") {
        totals.income += amount;
      } else {
        totals.expense += amount;
      }
    }

    const monthsAnalyzed = monthTotals.size;
    let avgMonthlyIncome = 0;
    let avgMonthlyExpense = 0;

    if (monthsAnalyzed > 0) {
      let totalIncome = 0;
      let totalExpense = 0;
      for (const totals of monthTotals.values()) {
        totalIncome += totals.income;
        totalExpense += totals.expense;
      }
      avgMonthlyIncome = totalIncome / monthsAnalyzed;
      avgMonthlyExpense = totalExpense / monthsAnalyzed;
    }

    return {
      currentBalance,
      currency: workspace.currency,
      recurrings: formattedRecurrings,
      historical: {
        avgMonthlyIncome,
        avgMonthlyExpense,
        monthsAnalyzed,
      },
    };
  }
);
