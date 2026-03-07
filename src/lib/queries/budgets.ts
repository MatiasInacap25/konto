import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type {
  BudgetWithLimits,
  BudgetProgress,
  CategoryProgress,
  BudgetStatus,
} from "@/types/budgets";

/**
 * Calculate budget status based on percentage spent
 */
function calculateStatus(percentage: number): BudgetStatus {
  if (percentage >= 100) return "exceeded";
  if (percentage >= 90) return "danger";
  if (percentage >= 70) return "warning";
  return "ok";
}

/**
 * Get budgets for a workspace with category limits
 * Cached per request
 */
export const getBudgets = cache(async (workspaceId: string) => {
  return prisma.budget.findMany({
    where: { workspaceId },
    include: {
      categoryLimits: {
        include: { category: true },
      },
    },
    orderBy: { startDate: "desc" },
  });
});

/**
 * Get active budgets for a workspace at a specific date
 * Default to current date
 */
export const getActiveBudgets = cache(
  async (workspaceId: string, date: Date = new Date()) => {
    return prisma.budget.findMany({
      where: {
        workspaceId,
        startDate: { lte: date },
        endDate: { gte: date },
      },
      include: {
        categoryLimits: {
          include: { category: true },
        },
      },
      orderBy: { startDate: "desc" },
    });
  }
);

/**
 * Get a single budget by ID with limits
 */
export const getBudgetById = cache(async (budgetId: string) => {
  return prisma.budget.findUnique({
    where: { id: budgetId },
    include: {
      categoryLimits: {
        include: { category: true },
      },
    },
  });
});

/**
 * Calculate spending for a budget
 * Returns total spent and spending by category
 */
export const calculateBudgetSpending = cache(
  async (budget: BudgetWithLimits): Promise<{
    totalSpent: number;
    categorySpending: Map<string, number>;
  }> => {
    // Get all EXPENSE transactions in the budget period
    const transactions = await prisma.transaction.findMany({
      where: {
        workspaceId: budget.workspaceId,
        type: "EXPENSE",
        date: {
          gte: budget.startDate,
          lte: budget.endDate,
        },
      },
      select: {
        amount: true,
        categoryId: true,
      },
    });

    // Calculate totals
    let totalSpent = 0;
    const categorySpending = new Map<string, number>();

    for (const tx of transactions) {
      const amount = Number(tx.amount);
      totalSpent += amount;

      if (tx.categoryId) {
        const current = categorySpending.get(tx.categoryId) || 0;
        categorySpending.set(tx.categoryId, current + amount);
      }
    }

    return { totalSpent, categorySpending };
  }
);

/**
 * Calculate full progress for a budget
 */
export const calculateBudgetProgress = cache(
  async (budget: BudgetWithLimits): Promise<BudgetProgress> => {
    const { totalSpent, categorySpending } = await calculateBudgetSpending(budget);

    const totalAmount = Number(budget.totalAmount);
    const percentage = totalAmount > 0 ? (totalSpent / totalAmount) * 100 : 0;
    const status = calculateStatus(percentage);

    // Calculate category progress
    const categoryProgress: CategoryProgress[] = budget.categoryLimits.map((limit) => {
      const spent = categorySpending.get(limit.categoryId) || 0;
      const limitAmount = Number(limit.amount);
      const catPercentage = limitAmount > 0 ? (spent / limitAmount) * 100 : 0;

      return {
        categoryId: limit.categoryId,
        categoryName: limit.category.name,
        categoryIcon: limit.category.icon,
        limit: limitAmount,
        spent: spent,
        percentage: catPercentage,
        status: calculateStatus(catPercentage),
      };
    });

    return {
      budgetId: budget.id,
      name: budget.name,
      totalAmount: totalAmount,
      totalSpent: totalSpent,
      percentage,
      status,
      startDate: budget.startDate,
      endDate: budget.endDate,
      categoryProgress,
    };
  }
);

/**
 * Get all budgets with progress for a workspace
 */
export const getBudgetsWithProgress = cache(async (workspaceId: string) => {
  const budgets = await getBudgets(workspaceId);
  return Promise.all(budgets.map((budget) => calculateBudgetProgress(budget)));
});

/**
 * Get active budgets with progress
 */
export const getActiveBudgetsWithProgress = cache(
  async (workspaceId: string, date?: Date) => {
    const budgets = await getActiveBudgets(workspaceId, date);
    return Promise.all(budgets.map((budget) => calculateBudgetProgress(budget)));
  }
);

/**
 * Check if a budget exists in a workspace
 */
export const budgetExists = cache(async (budgetId: string, workspaceId: string) => {
  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, workspaceId },
    select: { id: true },
  });

  return !!budget;
});
