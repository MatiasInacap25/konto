import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { Insight, MonthlyTrendData } from "@/types/insights";

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
 * Calculate monthly trend data (last 6 months)
 */
async function getMonthlyTrend(
  workspaceId: string
): Promise<MonthlyTrendData[]> {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const transactions = await prisma.transaction.findMany({
    where: {
      workspaceId,
      date: { gte: sixMonthsAgo },
    },
    select: {
      amount: true,
      type: true,
      date: true,
    },
  });

  // Group by month
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const monthlyData = new Map<string, { month: string; monthKey: string; income: number; expense: number }>();

  // Initialize all 6 months (even if no data)
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyData.set(monthKey, {
      month: monthNames[d.getMonth()],
      monthKey,
      income: 0,
      expense: 0,
    });
  }

  // Aggregate transactions
  for (const tx of transactions) {
    const d = new Date(tx.date);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const data = monthlyData.get(monthKey);
    if (data) {
      if (tx.type === "INCOME") {
        data.income += Number(tx.amount);
      } else {
        data.expense += Number(tx.amount);
      }
    }
  }

  // Convert to array and sort
  return Array.from(monthlyData.values()).sort((a, b) =>
    a.monthKey.localeCompare(b.monthKey)
  );
}

/**
 * Calculate all insights for dashboard
 */
async function calculateInsights(
  workspaceId: string,
  monthlyIncome: number,
  monthlyExpenses: number,
  monthlyTrend: MonthlyTrendData[]
): Promise<Insight[]> {
  const insights: Insight[] = [];

  try {
    insights.push(...(await calculateSubscriptionAlerts(workspaceId)));
  } catch (e) {
    console.error("Subscription alert calculation failed:", e);
  }

  try {
    insights.push(calculateSavingsRate(monthlyIncome, monthlyExpenses));
  } catch (e) {
    console.error("Savings rate calculation failed:", e);
  }

  try {
    const monthComparison = calculateMonthComparison(monthlyTrend);
    if (monthComparison) insights.push(monthComparison);
  } catch (e) {
    console.error("Month comparison calculation failed:", e);
  }

  try {
    const categoryInsight = await calculateCategoryHighlight(workspaceId, monthlyTrend);
    if (categoryInsight) insights.push(categoryInsight);
  } catch (e) {
    console.error("Category highlight calculation failed:", e);
  }

  try {
    const recurringInsight = await calculateRecurringImpact(workspaceId, monthlyIncome);
    if (recurringInsight) insights.push(recurringInsight);
  } catch (e) {
    console.error("Recurring impact calculation failed:", e);
  }

  try {
    const topMerchant = await calculateTopMerchant(workspaceId);
    if (topMerchant) insights.push(topMerchant);
  } catch (e) {
    console.error("Top merchant calculation failed:", e);
  }

  // Sort by priority
  return insights.sort((a, b) => a.priority - b.priority);
}

/**
 * Detect duplicate subscriptions or price increases
 */
async function calculateSubscriptionAlerts(workspaceId: string): Promise<Insight[]> {
  const insights: Insight[] = [];

  const recurrings = await prisma.recurring.findMany({
    where: { workspaceId, isActive: true, type: "EXPENSE" },
    select: { id: true, name: true, amount: true },
  });

  // Normalize names (remove common suffixes/prefixes, lowercase)
  const normalized = recurrings.map((r) => ({
    ...r,
    normalizedName: r.name.toLowerCase().replace(/\s+/g, "").replace(/(subscription|plan|pro|premium)$/i, ""),
  }));

  // Find duplicates by normalized name
  const byName = new Map<string, typeof normalized>();
  for (const r of normalized) {
    const existing = byName.get(r.normalizedName) || [];
    existing.push(r);
    byName.set(r.normalizedName, existing);
  }

  for (const [, items] of byName) {
    if (items.length > 1) {
      const amounts = items.map((i) => Number(i.amount));
      const totalAmount = amounts.reduce((a, b) => a + b, 0);
      insights.push({
        id: `duplicate-${items[0].normalizedName}`,
        priority: 1,
        type: "alert",
        title: "Suscripción duplicada detectada",
        description: `${items[0].name} aparece ${items.length} veces`,
        value: amounts.map((a) => `$${a.toLocaleString()}`).join(" + "),
        action: { label: "Verificar", href: "/recurrings" },
      });
    }
  }

  return insights;
}

/**
 * Calculate savings rate
 */
function calculateSavingsRate(monthlyIncome: number, monthlyExpenses: number): Insight {
  const savings = monthlyIncome - monthlyExpenses;
  const rate = monthlyIncome > 0 ? ((savings / monthlyIncome) * 100) : 0;

  return {
    id: "savings-rate",
    priority: 2,
    type: "success",
    title: "Tasa de ahorro",
    description: rate >= 0
      ? `Estás ahorrando el ${Math.round(rate)}% de tus ingresos`
      : "Estás gastando más de lo que ingresa",
    value: rate >= 0 ? `${Math.round(rate)}%` : undefined,
    trend: rate > 20 ? "up" : rate < 0 ? "down" : "neutral",
  };
}

/**
 * Compare current month vs previous month
 */
function calculateMonthComparison(monthlyTrend: MonthlyTrendData[]): Insight | null {
  if (monthlyTrend.length < 2) return null;

  const current = monthlyTrend[monthlyTrend.length - 1];
  const previous = monthlyTrend[monthlyTrend.length - 2];

  const change = previous.expense > 0
    ? ((current.expense - previous.expense) / previous.expense) * 100
    : 0;

  const diff = current.expense - previous.expense;

  return {
    id: "month-comparison",
    priority: 3,
    type: "trend",
    title: change > 0 ? "Gastos crecieron" : "Gastos bajaron",
    description: change > 0
      ? `Gastaste ${Math.round(Math.abs(change))}% más que ${previous.month.toLowerCase()}`
      : `Gastaste ${Math.round(Math.abs(change))}% menos que ${previous.month.toLowerCase()}`,
    value: diff >= 0 ? `+$${diff.toLocaleString()}` : `-$${Math.abs(diff).toLocaleString()}`,
    trend: change > 0 ? "up" : change < 0 ? "down" : "neutral",
  };
}

/**
 * Find category with biggest change vs previous month
 */
async function calculateCategoryHighlight(
  workspaceId: string,
  monthlyTrend: MonthlyTrendData[]
): Promise<Insight | null> {
  if (monthlyTrend.length < 2) return null;

  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [currentCategories, prevCategories] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        workspaceId,
        type: "EXPENSE",
        date: { gte: currentMonth },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        workspaceId,
        type: "EXPENSE",
        date: { gte: prevMonth, lte: prevMonthEnd },
      },
      _sum: { amount: true },
    }),
  ]);

  // Get category names (filter out nulls)
  const categoryIds = [...new Set([...currentCategories.map(c => c.categoryId), ...prevCategories.map(c => c.categoryId)])].filter((id): id is string => id !== null);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true },
  });
  const categoryNames = new Map(categories.map(c => [c.id, c.name]));

  // Find biggest change
  let maxChange = 0;
  let maxCategory: { name: string; change: number } | null = null;

  const currentByCat = new Map(currentCategories.filter(c => c.categoryId !== null).map(c => [c.categoryId!, Number(c._sum.amount)]));
  const prevByCat = new Map(prevCategories.filter(c => c.categoryId !== null).map(c => [c.categoryId!, Number(c._sum.amount)]));

  for (const [catId, currentAmount] of currentByCat) {
    const prevAmount = prevByCat.get(catId) || 0;
    if (prevAmount > 0) {
      const change = ((currentAmount - prevAmount) / prevAmount) * 100;
      if (Math.abs(change) > Math.abs(maxChange) && Math.abs(change) > 20) {
        maxChange = change;
        maxCategory = { name: categoryNames.get(catId) || "Sin categoría", change };
      }
    }
  }

  if (!maxCategory) return null;

  return {
    id: "category-highlight",
    priority: 4,
    type: "trend",
    title: "Categoría destacada",
    description: `${maxCategory.name} ${maxChange > 0 ? "creció" : "bajó"} ${Math.round(Math.abs(maxChange))}% este mes`,
    action: { label: "Ver transacciones", href: "/transactions" },
    trend: maxChange > 0 ? "up" : "down",
  };
}

/**
 * Calculate impact of recurring expenses on income
 */
async function calculateRecurringImpact(workspaceId: string, monthlyIncome: number): Promise<Insight | null> {
  if (monthlyIncome <= 0) return null;

  const recurrings = await prisma.recurring.findMany({
    where: { workspaceId, isActive: true, type: "EXPENSE" },
    select: { amount: true },
  });

  const totalRecurring = recurrings.reduce((sum, r) => sum + Number(r.amount), 0);
  const percentage = (totalRecurring / monthlyIncome) * 100;

  if (percentage < 15) return null; // Only show if significant

  return {
    id: "recurring-impact",
    priority: 5,
    type: "info",
    title: "Impacto de suscripciones",
    description: `Tus suscripciones representan el ${Math.round(percentage)}% de tus ingresos`,
    value: `$${totalRecurring.toLocaleString()}/mes`,
  };
}

/**
 * Find top merchant by expense amount
 */
async function calculateTopMerchant(workspaceId: string): Promise<Insight | null> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const transactions = await prisma.transaction.findMany({
    where: {
      workspaceId,
      type: "EXPENSE",
      date: { gte: startOfMonth },
      description: { not: null },
    },
    select: { description: true, amount: true },
  });

  if (transactions.length === 0) return null;

  // Group by description (merchant)
  const byMerchant = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.description) {
      const current = byMerchant.get(tx.description) || 0;
      byMerchant.set(tx.description, current + Number(tx.amount));
    }
  }

  // Find max
  let maxMerchant = "";
  let maxAmount = 0;
  for (const [merchant, amount] of byMerchant) {
    if (amount > maxAmount) {
      maxAmount = amount;
      maxMerchant = merchant;
    }
  }

  if (maxAmount === 0) return null;

  const totalExpenses = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const percentage = totalExpenses > 0 ? Math.round((maxAmount / totalExpenses) * 100) : 0;

  return {
    id: "top-merchant",
    priority: 6,
    type: "info",
    title: "Mayor gasto del mes",
    description: `${maxMerchant}: $${maxAmount.toLocaleString()}`,
    value: `${percentage}% de tus gastos`,
    action: { label: "Ver detalle", href: `/transactions?search=${encodeURIComponent(maxMerchant)}` },
  };
}

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
      monthlyTrend,
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

      // Monthly trend (last 6 months)
      getMonthlyTrend(workspace.id),
    ]);

    // Calculate totals
    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
    const monthlyIncome =
      Number(monthlyStats.find((s) => s.type === "INCOME")?._sum.amount) || 0;
    const monthlyExpenses =
      Number(monthlyStats.find((s) => s.type === "EXPENSE")?._sum.amount) || 0;

    // Calculate insights (after we have monthly trend)
    const insights = await calculateInsights(
      workspace.id,
      monthlyIncome,
      monthlyExpenses,
      monthlyTrend
    );

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
      monthlyTrend,
      insights,
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
      if (filters.from) where.date.gte = new Date(filters.from + "T00:00:00.000Z");
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
