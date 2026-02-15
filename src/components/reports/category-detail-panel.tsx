"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoryReport } from "@/types/reports";

type CategoryDetailPanelProps = {
  category: CategoryReport | null;
  currency: string;
  totalExpenses: number;
  onClose: () => void;
};

export function CategoryDetailPanel({
  category,
  currency,
  totalExpenses,
  onClose,
}: CategoryDetailPanelProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (!category) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <span className="text-xl">👆</span>
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          Seleccioná una categoría en el gráfico
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Para ver detalles y transacciones
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{category.icon || "📋"}</span>
          <div>
            <h3 className="font-semibold">{category.name}</h3>
            <p className="text-sm text-muted-foreground">
              {category.transactionCount}{" "}
              {category.transactionCount === 1 ? "transacción" : "transacciones"}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Amount */}
      <div className="bg-muted/50 rounded-lg p-4 mb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          Total gastado
        </p>
        <p className="text-2xl font-bold mt-1">{formatCurrency(category.amount)}</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.min(category.percentage, 100)}%` }}
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {category.percentage.toFixed(1)}%
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          del total de gastos ({formatCurrency(totalExpenses)})
        </p>
      </div>

      {/* Hint */}
      <div className="mt-auto">
        <p className="text-xs text-muted-foreground text-center">
          Las transacciones de esta categoría aparecen abajo
        </p>
      </div>
    </div>
  );
}
