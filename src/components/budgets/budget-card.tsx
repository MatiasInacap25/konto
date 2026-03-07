"use client";

import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, Calendar } from "lucide-react";
import { BudgetProgress } from "./budget-progress";
import type { BudgetProgress as BudgetProgressType } from "@/types/budgets";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type BudgetCardProps = {
  budget: BudgetProgressType;
  onEdit: (budgetId: string) => void;
  onDelete: (budgetId: string) => void;
};

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const periodText = `${format(budget.startDate, "d MMM", { locale: es })} - ${format(budget.endDate, "d MMM yyyy", { locale: es })}`;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">{budget.name}</h3>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{periodText}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Acciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(budget.budgetId)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(budget.budgetId)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Total Progress */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Presupuesto Total</p>
          <BudgetProgress
            spent={Number(budget.totalSpent)}
            limit={Number(budget.totalAmount)}
            status={budget.status}
          />
        </div>

        {/* Category Limits */}
        {budget.categoryProgress.length > 0 && (
          <div className="space-y-3 pt-2 border-t">
            <p className="text-sm font-medium text-muted-foreground">Límites por Categoría</p>
            {budget.categoryProgress.map((cat) => (
              <div key={cat.categoryId} className="space-y-1">
                <div className="flex items-center gap-2">
                  {cat.categoryIcon && <span className="text-lg">{cat.categoryIcon}</span>}
                  <span className="text-sm font-medium">{cat.categoryName}</span>
                </div>
                <BudgetProgress
                  spent={Number(cat.spent)}
                  limit={Number(cat.limit)}
                  status={cat.status}
                  showPercentage={false}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
