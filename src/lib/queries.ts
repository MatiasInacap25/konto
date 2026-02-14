import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * Cached workspace queries - deduplicated per request
 * Uses React.cache() for per-request memoization (server-cache-react)
 */

/**
 * Get user's workspaces
 */
export const getUserWorkspaces = cache(async (userId: string) => {
  return prisma.workspace.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      type: true,
      currency: true,
    },
    orderBy: { createdAt: "asc" },
  });
});

/**
 * Get workspace by ID or default personal workspace
 */
export const getWorkspace = cache(async (userId: string, workspaceId?: string) => {
  if (workspaceId) {
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId },
      select: { id: true, name: true, type: true, currency: true },
    });
    if (workspace) return workspace;
  }

  // Fallback to personal workspace
  return prisma.workspace.findFirst({
    where: { userId, type: "PERSONAL" },
    select: { id: true, name: true, type: true, currency: true },
  });
});

/**
 * Get workspace with full dashboard data - optimized single query
 * Replaces multiple sequential queries (async-parallel)
 */
export const getWorkspaceWithDashboardData = cache(
  async (userId: string, workspaceId?: string) => {
    const workspace = await getWorkspace(userId, workspaceId);
    if (!workspace) return null;

    // Calculate date range for monthly stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Parallel data fetching - CRITICAL performance optimization
    const [
      accounts,
      transactionCount,
      monthlyStats,
      recentTransactions,
      upcomingRecurrings,
    ] = await Promise.all([
      // Accounts with balance (only active, not archived, not system)
      prisma.account.findMany({
        where: {
          workspaceId: workspace.id,
          archivedAt: null,
          isSystem: false,
        },
        select: { id: true, name: true, balance: true },
      }),

      // Transaction count
      prisma.transaction.count({
        where: { workspaceId: workspace.id },
      }),

      // Monthly income/expense grouped
      prisma.transaction.groupBy({
        by: ["type"],
        where: {
          workspaceId: workspace.id,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),

      // Recent transactions (limit 5, minimal data)
      prisma.transaction.findMany({
        where: { workspaceId: workspace.id },
        orderBy: { date: "desc" },
        take: 5,
        select: {
          id: true,
          amount: true,
          date: true,
          description: true,
          type: true,
          category: { select: { name: true, icon: true } },
          account: { select: { name: true } },
        },
      }),

      // Upcoming recurrings (limit 5)
      prisma.recurring.findMany({
        where: { workspaceId: workspace.id, isActive: true },
        orderBy: { nextPayment: "asc" },
        take: 5,
        select: {
          id: true,
          name: true,
          amount: true,
          nextPayment: true,
          type: true,
          frequency: true,
        },
      }),
    ]);

    // Calculate totals
    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
    const monthlyIncome =
      Number(monthlyStats.find((s) => s.type === "INCOME")?._sum.amount) || 0;
    const monthlyExpenses =
      Number(monthlyStats.find((s) => s.type === "EXPENSE")?._sum.amount) || 0;

    return {
      workspace,
      stats: {
        totalBalance,
        totalAccounts: accounts.length,
        activeRecurrings: upcomingRecurrings.length,
        totalTransactions: transactionCount,
        monthlyIncome,
        monthlyExpenses,
      },
      // Serialize Decimal to number for client
      recentTransactions: recentTransactions.map((tx) => ({
        ...tx,
        amount: Number(tx.amount),
      })),
      upcomingRecurrings: upcomingRecurrings.map((rec) => ({
        ...rec,
        amount: Number(rec.amount),
      })),
    };
  }
);

/**
 * Get workspace data for transactions page
 * Optimized parallel fetching with minimal serialization
 */
export const getWorkspaceTransactionData = cache(
  async (
    userId: string,
    workspaceId?: string,
    filters?: {
      type?: string;
      account?: string;
      category?: string;
      from?: string;
      to?: string;
    }
  ) => {
    const workspace = await getWorkspace(userId, workspaceId);
    if (!workspace) return null;

    // Build where clause for transactions
    type WhereClause = {
      workspaceId: string;
      type?: "INCOME" | "EXPENSE";
      accountId?: string;
      categoryId?: string;
      date?: { gte?: Date; lte?: Date };
    };

    const where: WhereClause = { workspaceId: workspace.id };

    if (filters?.type === "INCOME" || filters?.type === "EXPENSE") {
      where.type = filters.type;
    }
    if (filters?.account) where.accountId = filters.account;
    if (filters?.category) where.categoryId = filters.category;
    if (filters?.from || filters?.to) {
      where.date = {};
      if (filters.from) where.date.gte = new Date(filters.from);
      if (filters.to) where.date.lte = new Date(filters.to + "T23:59:59.999Z");
    }

    // Parallel data fetching
    const [transactions, accounts, categories] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { date: "desc" },
        take: 100,
        select: {
          id: true,
          amount: true,
          date: true,
          description: true,
          type: true,
          scope: true,
          accountId: true,
          categoryId: true,
          workspaceId: true,
          account: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, icon: true } },
        },
      }),
      prisma.account.findMany({
        where: {
          workspaceId: workspace.id,
          OR: [
            { archivedAt: null },
            { isSystem: true }, // Include system accounts for transaction display
          ],
        },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.category.findMany({
        where: {
          OR: [{ userId }, { userId: null }],
        },
        select: { id: true, name: true, type: true, icon: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return {
      workspace,
      transactions: transactions.map((tx) => ({
        ...tx,
        amount: Number(tx.amount),
      })),
      accounts,
      categories,
    };
  }
);

/**
 * Get workspace data for accounts page
 * Returns accounts with last activity and transaction counts
 * By default returns only active accounts, can include archived with flag
 */
export const getWorkspaceAccountsData = cache(
  async (userId: string, workspaceId?: string, includeArchived = false) => {
    const workspace = await getWorkspace(userId, workspaceId);
    if (!workspace) return null;

    // Get accounts with their stats in parallel
    // Always include system accounts (like "Eliminadas"), even when not showing archived
    const accounts = await prisma.account.findMany({
      where: {
        workspaceId: workspace.id,
        ...(includeArchived
          ? {} // When showing archived, don't filter by archivedAt (show all)
          : { archivedAt: null }), // When not showing archived, only show active
      },
      select: {
        id: true,
        name: true,
        balance: true,
        isBusiness: true,
        isSystem: true,
        archivedAt: true,
        transactions: {
          select: { date: true },
          orderBy: { date: "desc" },
          take: 1,
        },
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: [
        { isSystem: "desc" }, // System accounts last
        { archivedAt: "asc" }, // Active first (nulls first), then archived
        { balance: "desc" },
        { name: "asc" },
      ],
    });

    // Calculate total balance (only active, non-system accounts)
    const activeAccounts = accounts.filter(
      (acc) => acc.archivedAt === null && !acc.isSystem
    );
    const totalBalance = activeAccounts.reduce(
      (sum, acc) => sum + Number(acc.balance),
      0
    );

    // Transform to client-friendly format
    const accountsWithStats = accounts.map((acc) => ({
      id: acc.id,
      name: acc.name,
      balance: Number(acc.balance),
      isBusiness: acc.isBusiness,
      isSystem: acc.isSystem,
      archivedAt: acc.archivedAt,
      lastActivityAt: acc.transactions[0]?.date || null,
      transactionCount: acc._count.transactions,
    }));

    // Count archived accounts (exclude system accounts)
    const archivedCount = accounts.filter(
      (acc) => acc.archivedAt !== null && !acc.isSystem
    ).length;

    return {
      workspace,
      accounts: accountsWithStats,
      totalBalance,
      archivedCount,
    };
  }
);
