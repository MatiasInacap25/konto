import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import type { GoalWithProgress, SavingsSummary, AccountOption } from "@/types/savings";
import { differenceInMonths } from "date-fns";

/**
 * Calculate progress for a savings goal
 */
function calculateProgress(
  currentBalance: number,
  targetAmount: number,
  deadline: Date | null,
  createdAt: Date
): GoalWithProgress["progress"] {
  const percentage = Math.min((currentBalance / targetAmount) * 100, 100);
  const remaining = Math.max(targetAmount - currentBalance, 0);
  const isCompleted = currentBalance >= targetAmount;

  // If no deadline, return basic progress
  if (!deadline) {
    return {
      percentage,
      isCompleted,
      remaining,
    };
  }

  const now = new Date();
  const monthsLeft = differenceInMonths(deadline, now);
  const monthlyNeeded = monthsLeft > 0 ? remaining / monthsLeft : 0;

  // Calculate if on track
  const totalMonths = differenceInMonths(deadline, createdAt);
  const monthsPassed = totalMonths - monthsLeft;
  const expectedProgress = totalMonths > 0 ? (monthsPassed / totalMonths) * 100 : 0;
  const isOnTrack = percentage >= expectedProgress;

  return {
    percentage,
    isCompleted,
    remaining,
    monthlyNeeded,
    isOnTrack,
    monthsLeft: Math.max(monthsLeft, 0),
  };
}

/**
 * Get all savings goals for a workspace with progress calculation
 */
export const getSavingsGoals = cache(
  async (workspaceId: string): Promise<GoalWithProgress[]> => {
    const user = await getUser();
    if (!user) {
      return [];
    }

    const goals = await prisma.savingsGoal.findMany({
      where: {
        workspaceId,
        workspace: {
          userId: user.id,
        },
      },
      include: {
        account: {
          select: {
            balance: true,
          },
        },
      },
      orderBy: [
        { status: "asc" }, // ACTIVE first, then COMPLETED, then CANCELLED
        { createdAt: "desc" },
      ],
    });

    return goals.map((goal) => {
      const currentBalance = Number(goal.account.balance);
      const targetAmount = Number(goal.targetAmount);

      const progress = calculateProgress(
        currentBalance,
        targetAmount,
        goal.deadline,
        goal.createdAt
      );

      return {
        id: goal.id,
        name: goal.name,
        emoji: goal.emoji,
        description: goal.description,
        targetAmount,
        currentBalance,
        deadline: goal.deadline,
        status: goal.status,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt,
        completedAt: goal.completedAt,
        accountId: goal.accountId,
        progress,
      };
    });
  }
);

/**
 * Get a single savings goal by ID
 */
export const getSavingsGoal = cache(
  async (goalId: string, workspaceId: string): Promise<GoalWithProgress | null> => {
    const user = await getUser();
    if (!user) {
      return null;
    }

    const goal = await prisma.savingsGoal.findFirst({
      where: {
        id: goalId,
        workspaceId,
        workspace: {
          userId: user.id,
        },
      },
      include: {
        account: {
          select: {
            balance: true,
          },
        },
      },
    });

    if (!goal) {
      return null;
    }

    const currentBalance = Number(goal.account.balance);
    const targetAmount = Number(goal.targetAmount);

    const progress = calculateProgress(
      currentBalance,
      targetAmount,
      goal.deadline,
      goal.createdAt
    );

    return {
      id: goal.id,
      name: goal.name,
      emoji: goal.emoji,
      description: goal.description,
      targetAmount,
      currentBalance,
      deadline: goal.deadline,
      status: goal.status,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
      completedAt: goal.completedAt,
      accountId: goal.accountId,
      progress,
    };
  }
);

/**
 * Get accounts available for contributions/withdrawals (excludes system accounts)
 */
export const getAvailableAccounts = cache(
  async (workspaceId: string): Promise<AccountOption[]> => {
    const user = await getUser();
    if (!user) {
      return [];
    }

    const accounts = await prisma.account.findMany({
      where: {
        workspaceId,
        workspace: {
          userId: user.id,
        },
        isSystem: false, // Exclude system accounts (other goals)
        archivedAt: null, // Exclude archived accounts
      },
      select: {
        id: true,
        name: true,
        balance: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return accounts.map((acc) => ({
      id: acc.id,
      name: acc.name,
      balance: Number(acc.balance),
    }));
  }
);

/**
 * Get savings summary for dashboard card
 */
export const getSavingsSummary = cache(
  async (workspaceId: string): Promise<SavingsSummary> => {
    const user = await getUser();
    if (!user) {
      return {
        totalSaved: 0,
        activeGoalsCount: 0,
        completedGoalsCount: 0,
        nextDeadline: null,
        nextDeadlineGoalName: null,
      };
    }

    const goals = await prisma.savingsGoal.findMany({
      where: {
        workspaceId,
        workspace: {
          userId: user.id,
        },
      },
      include: {
        account: {
          select: {
            balance: true,
          },
        },
      },
    });

    const totalSaved = goals.reduce((sum, goal) => sum + Number(goal.account.balance), 0);
    const activeGoalsCount = goals.filter((g) => g.status === "ACTIVE").length;
    const completedGoalsCount = goals.filter((g) => g.status === "COMPLETED").length;

    // Find next deadline (active goals only)
    const activeGoalsWithDeadlines = goals
      .filter((g) => g.status === "ACTIVE" && g.deadline)
      .sort((a, b) => {
        if (!a.deadline || !b.deadline) return 0;
        return a.deadline.getTime() - b.deadline.getTime();
      });

    const nextDeadlineGoal = activeGoalsWithDeadlines[0];

    return {
      totalSaved,
      activeGoalsCount,
      completedGoalsCount,
      nextDeadline: nextDeadlineGoal?.deadline ?? null,
      nextDeadlineGoalName: nextDeadlineGoal?.name ?? null,
    };
  }
);

/**
 * Get all data needed for the savings page
 */
export const getSavingsPageData = cache(async (workspaceId: string) => {
  const [goals, accounts] = await Promise.all([
    getSavingsGoals(workspaceId),
    getAvailableAccounts(workspaceId),
  ]);

  return { goals, accounts };
});
