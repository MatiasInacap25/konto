"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import type { TransactionWithRelations, CategoryOption } from "@/types/transactions";

type CategorySummaryProps = {
  transactions: TransactionWithRelations[];
  categories: CategoryOption[];
  currency: string;
};

export function CategorySummary({
  transactions,
  categories,
  currency,
}: CategorySummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Group transactions by category
  const categoryStats = useMemo(() => {
    const stats = new Map<
      string,
      {
        category: CategoryOption | null;
        income: number;
        expense: number;
        count: number;
      }
    >();

    // Initialize with all categories that have transactions
    transactions.forEach((tx) => {
      const categoryId = tx.categoryId || "uncategorized";
      
      if (!stats.has(categoryId)) {
        const category = categories.find((c) => c.id === tx.categoryId) || null;
        stats.set(categoryId, {
          category,
          income: 0,
          expense: 0,
          count: 0,
        });
      }

      const stat = stats.get(categoryId)!;
      if (tx.type === "INCOME") {
        stat.income += tx.amount;
      } else {
        stat.expense += tx.amount;
      }
      stat.count += 1;
    });

    // Convert to array and sort by total amount (expense + income)
    return Array.from(stats.values())
      .map((stat) => ({
        ...stat,
        total: stat.income + stat.expense,
        net: stat.income - stat.expense,
      }))
      .sort((a, b) => b.total - a.total);
  }, [transactions, categories]);

  // Calculate totals for progress bars
  const maxAmount = useMemo(() => {
    if (categoryStats.length === 0) return 0;
    return Math.max(...categoryStats.map((s) => s.expense));
  }, [categoryStats]);

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted/80 flex items-center justify-center mb-5">
          <svg
            className="w-7 h-7 text-muted-foreground/70"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
            />
          </svg>
        </div>
        <h3 className="text-base font-semibold mb-1.5">Sin datos para mostrar</h3>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          No hay transacciones que coincidan con los filtros aplicados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Income section */}
      <section>
        <h3 className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Ingresos por categoría
        </h3>
        <div className="space-y-3">
          {categoryStats
            .filter((stat) => stat.income > 0)
            .sort((a, b) => b.income - a.income)
            .map((stat) => (
              <CategoryRow
                key={`income-${stat.category?.id || "uncategorized"}`}
                name={stat.category?.name || "Sin categoría"}
                icon={stat.category?.icon}
                amount={stat.income}
                count={stat.count}
                formattedAmount={formatCurrency(stat.income)}
                maxAmount={maxAmount}
                type="income"
              />
            ))}
          {categoryStats.filter((stat) => stat.income > 0).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay ingresos en este período
            </p>
          )}
        </div>
      </section>

      {/* Expense section */}
      <section>
        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          Gastos por categoría
        </h3>
        <div className="space-y-3">
          {categoryStats
            .filter((stat) => stat.expense > 0)
            .sort((a, b) => b.expense - a.expense)
            .map((stat) => (
              <CategoryRow
                key={`expense-${stat.category?.id || "uncategorized"}`}
                name={stat.category?.name || "Sin categoría"}
                icon={stat.category?.icon}
                amount={stat.expense}
                count={stat.count}
                formattedAmount={formatCurrency(stat.expense)}
                maxAmount={maxAmount}
                type="expense"
              />
            ))}
          {categoryStats.filter((stat) => stat.expense > 0).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay gastos en este período
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

// Category Row Component
function CategoryRow({
  name,
  icon,
  amount,
  count,
  formattedAmount,
  maxAmount,
  type,
}: {
  name: string;
  icon?: string | null;
  amount: number;
  count: number;
  formattedAmount: string;
  maxAmount: number;
  type: "income" | "expense";
}) {
  const percentage = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {icon && <span className="text-base">{icon}</span>}
          <span className="font-medium">{name}</span>
          <span className="text-xs text-muted-foreground">
            ({count} {count === 1 ? "mov." : "movs."})
          </span>
        </div>
        <span
          className={cn(
            "font-semibold tabular-nums",
            type === "income"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-foreground"
          )}
        >
          {type === "income" ? "+" : "−"}{formattedAmount}
        </span>
      </div>
      <Progress
        value={percentage}
        className={cn(
          "h-1.5",
          type === "income" && "[&>div]:bg-emerald-500"
        )}
      />
    </div>
  );
}
