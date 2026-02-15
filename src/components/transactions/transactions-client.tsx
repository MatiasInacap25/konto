"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Plus, Search, List, PieChart, TrendingUp, TrendingDown, CalendarDays } from "lucide-react";
import { format, subDays, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TransactionsList } from "./transactions-list";
import { CategorySummary } from "./category-summary";
import { TransactionFilters } from "./transaction-filters";
import type {
  TransactionWithRelations,
  AccountOption,
  CategoryOption,
} from "@/types/transactions";

// Dynamic import - only loads when sheet opens (bundle-dynamic-imports)
const TransactionSheet = dynamic(
  () => import("./transaction-sheet").then((mod) => ({ default: mod.TransactionSheet })),
  { 
    ssr: false,
    loading: () => null,
  }
);

type TransactionsClientProps = {
  transactions: TransactionWithRelations[];
  accounts: AccountOption[];
  categories: CategoryOption[];
  workspaceId: string;
  workspaceType: "PERSONAL" | "BUSINESS";
  currency: string;
};

// Helper para formatear fecha a YYYY-MM-DD en timezone local
function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Determinar el período actual basado en las fechas de la URL
function getCurrentPeriod(from: string | null, to: string | null): string {
  if (!from || !to) return "all";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const fromDate = new Date(from);
  fromDate.setHours(0, 0, 0, 0);
  const toDate = new Date(to);
  toDate.setHours(0, 0, 0, 0);

  // Check if it's "today"
  if (fromDate.getTime() === today.getTime() && toDate.getTime() === today.getTime()) {
    return "today";
  }

  // Check if it's "last15"
  const last15 = subDays(today, 15);
  if (fromDate.getTime() === last15.getTime() && toDate.getTime() === today.getTime()) {
    return "last15";
  }

  // Check if it's "lastMonth"
  const lastMonth = subMonths(today, 1);
  if (fromDate.getTime() === lastMonth.getTime() && toDate.getTime() === today.getTime()) {
    return "lastMonth";
  }

  return "custom";
}

export function TransactionsClient({
  transactions,
  accounts,
  categories,
  workspaceId,
  workspaceType,
  currency,
}: TransactionsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<TransactionWithRelations | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "categories">("list");

  // Filter transactions by search query
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    
    const query = searchQuery.toLowerCase();
    return transactions.filter((tx) => {
      const description = (tx.description || "").toLowerCase();
      const categoryName = (tx.category?.name || "").toLowerCase();
      const accountName = (tx.account?.name || "").toLowerCase();
      
      return (
        description.includes(query) ||
        categoryName.includes(query) ||
        accountName.includes(query)
      );
    });
  }, [transactions, searchQuery]);

  // Calculate totals from filtered transactions
  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter((tx) => tx.type === "INCOME")
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const expense = filteredTransactions
      .filter((tx) => tx.type === "EXPENSE")
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    return {
      income,
      expense,
      net: income - expense,
    };
  }, [filteredTransactions]);

  // Handle period selection
  const handlePeriodChange = useCallback((period: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (workspaceId) {
      params.set("workspace", workspaceId);
    }

    const today = new Date();

    switch (period) {
      case "today":
        params.set("from", formatDateToString(today));
        params.set("to", formatDateToString(today));
        break;
      case "last15":
        params.set("from", formatDateToString(subDays(today, 15)));
        params.set("to", formatDateToString(today));
        break;
      case "lastMonth":
        params.set("from", formatDateToString(subMonths(today, 1)));
        params.set("to", formatDateToString(today));
        break;
      case "all":
        params.delete("from");
        params.delete("to");
        break;
      default:
        return;
    }

    router.push(`/transactions?${params.toString()}`);
  }, [router, searchParams, workspaceId]);

  // Get current period from URL
  const currentFrom = searchParams.get("from");
  const currentTo = searchParams.get("to");
  const currentPeriod = getCurrentPeriod(currentFrom, currentTo);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  }, [currency]);

  // Memoized handlers
  const handleEdit = useCallback((transaction: TransactionWithRelations) => {
    setEditingTransaction(transaction);
    setSheetOpen(true);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setEditingTransaction(null);
    }
  }, []);

  const handleNewTransaction = useCallback(() => {
    setEditingTransaction(null);
    setSheetOpen(true);
  }, []);

  return (
    <div className="space-y-6">
      {/* Page header with financial summary */}
      <header className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Transacciones</h1>
            <p className="text-sm text-muted-foreground">
              Registro de ingresos y gastos
            </p>
            {/* Period selector */}
            <Select
              value={currentPeriod}
              onValueChange={handlePeriodChange}
            >
              <SelectTrigger className="w-[160px] h-8 text-sm mt-2">
                <CalendarDays className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el tiempo</SelectItem>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="last15">Últimos 15 días</SelectItem>
                <SelectItem value="lastMonth">Último mes</SelectItem>
                <SelectItem value="custom" disabled>Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleNewTransaction} size="sm" className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            Nueva transacción
          </Button>
        </div>

        {/* Financial summary cards */}
        {filteredTransactions.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <SummaryCard
              label="Ingresos"
              amount={totals.income}
              formattedAmount={formatCurrency(totals.income)}
              icon={<TrendingUp className="h-3.5 w-3.5" />}
              variant="income"
            />
            <SummaryCard
              label="Gastos"
              amount={totals.expense}
              formattedAmount={formatCurrency(totals.expense)}
              icon={<TrendingDown className="h-3.5 w-3.5" />}
              variant="expense"
            />
            <SummaryCard
              label="Neto"
              amount={totals.net}
              formattedAmount={formatCurrency(totals.net)}
              formattedPrefix={totals.net >= 0 ? "+" : ""}
              variant={totals.net >= 0 ? "positive" : "negative"}
            />
          </div>
        )}
      </header>

      {/* Filters and search bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en descripciones, categorías..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* View toggle */}
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value: string) => value && setViewMode(value as "list" | "categories")}
            className="border rounded-md p-1 h-9"
          >
            <ToggleGroupItem value="list" aria-label="Ver lista" className="h-7 px-3">
              <List className="h-4 w-4 mr-1.5" />
              <span className="text-xs">Lista</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="categories" aria-label="Ver por categoría" className="h-7 px-3">
              <PieChart className="h-4 w-4 mr-1.5" />
              <span className="text-xs">Por categoría</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <TransactionFilters
          accounts={accounts}
          categories={categories}
          workspaceId={workspaceId}
        />
      </div>

      {/* Divider sutil */}
      <div className="h-px bg-border/50" />

      {/* Content based on view mode */}
      {viewMode === "list" ? (
        <TransactionsList
          transactions={filteredTransactions}
          currency={currency}
          workspaceId={workspaceId}
          onEdit={handleEdit}
        />
      ) : (
        <CategorySummary
          transactions={filteredTransactions}
          categories={categories}
          currency={currency}
        />
      )}

      {/* Sheet for create/edit */}
      {sheetOpen && (
        <TransactionSheet
          open={sheetOpen}
          onOpenChange={handleOpenChange}
          transaction={editingTransaction}
          accounts={accounts}
          categories={categories}
          workspaceId={workspaceId}
          workspaceType={workspaceType}
        />
      )}
    </div>
  );
}

// Summary Card Component
function SummaryCard({
  label,
  amount,
  formattedAmount,
  formattedPrefix = "",
  icon,
  variant,
}: {
  label: string;
  amount: number;
  formattedAmount: string;
  formattedPrefix?: string;
  icon?: React.ReactNode;
  variant: "income" | "expense" | "positive" | "negative";
}) {
  const variantStyles = {
    income: "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900",
    expense: "bg-muted/50 border-border",
    positive: "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900",
    negative: "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900",
  };

  const textStyles = {
    income: "text-emerald-600 dark:text-emerald-400",
    expense: "text-muted-foreground",
    positive: "text-emerald-600 dark:text-emerald-400",
    negative: "text-rose-600 dark:text-rose-400",
  };

  return (
    <div className={cn("rounded-lg border px-3 py-2", variantStyles[variant])}>
      <div className="flex items-center gap-1.5">
        {icon && <span className={textStyles[variant]}>{icon}</span>}
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className={cn("text-sm font-bold tabular-nums mt-0.5", textStyles[variant])}>
        {formattedPrefix}{formattedAmount}
      </p>
    </div>
  );
}
