"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { ReportTransaction } from "@/types/reports";

type TransactionListProps = {
  transactions: ReportTransaction[];
  selectedCategory: string | null;
  currency: string;
};

export function TransactionList({
  transactions,
  selectedCategory,
  currency,
}: TransactionListProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Filter by selected category
  const filteredTransactions = selectedCategory
    ? transactions.filter((tx) => tx.categoryId === selectedCategory)
    : [];

  if (!selectedCategory) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">
          Seleccioná una categoría para ver sus transacciones
        </p>
      </div>
    );
  }

  if (filteredTransactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">
          No hay transacciones en esta categoría
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <h4 className="text-sm font-medium mb-3 px-1">
        {filteredTransactions.length}{" "}
        {filteredTransactions.length === 1 ? "transacción" : "transacciones"}
      </h4>
      
      {filteredTransactions.map((tx) => (
        <div
          key={tx.id}
          className={cn(
            "flex items-center justify-between py-3 px-3 rounded-lg",
            "hover:bg-muted/50 transition-colors"
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Category icon */}
            <span className="text-lg flex-shrink-0">
              {tx.categoryIcon || "📋"}
            </span>
            
            {/* Description and meta */}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {tx.description || tx.categoryName || "Sin descripción"}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(tx.date), "d MMM", { locale: es })} • {tx.accountName}
              </p>
            </div>
          </div>
          
          {/* Amount */}
          <span
            className={cn(
              "text-sm font-semibold tabular-nums flex-shrink-0",
              tx.type === "INCOME"
                ? "text-emerald-600"
                : tx.type === "TRANSFER"
                  ? "text-blue-600"
                  : "text-foreground"
            )}
          >
            {tx.type === "INCOME" ? "+" : tx.type === "TRANSFER" ? "" : "−"}
            {formatCurrency(tx.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}
