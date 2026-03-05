"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Pencil, Trash2, Play, Pause, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFrequency } from "@/lib/validations/recurring";
import type { RecurringWithRelations } from "@/types/recurrings";

type RecurringCardProps = {
  recurring: RecurringWithRelations;
  currency: string;
  onEdit: (recurring: RecurringWithRelations) => void;
  onDelete: (recurring: RecurringWithRelations) => void;
  onToggle: (recurring: RecurringWithRelations) => void;
  onRegisterPayment: (recurring: RecurringWithRelations) => void;
};

export function RecurringCard({
  recurring,
  currency,
  onEdit,
  onDelete,
  onToggle,
  onRegisterPayment,
}: RecurringCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const isOverdue = new Date(recurring.nextPayment) <= new Date();

  return (
    <div
      className={cn(
        "group relative bg-card border rounded-xl p-4",
        "transition-all duration-200 ease-out",
        "hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5",
        !recurring.isActive && "opacity-60 hover:opacity-80",
        isOverdue && recurring.isActive && "border-amber-300 dark:border-amber-700"
      )}
    >
      {/* Actions */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(recurring)}
          className="p-1.5 rounded-md hover:bg-accent transition-colors"
          title="Editar"
        >
          <Pencil className="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          onClick={() => onToggle(recurring)}
          className="p-1.5 rounded-md hover:bg-accent transition-colors"
          title={recurring.isActive ? "Pausar" : "Activar"}
        >
          {recurring.isActive ? (
            <Pause className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Play className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        <button
          onClick={() => onDelete(recurring)}
          className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"
          title="Eliminar"
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </button>
      </div>

      {/* Content */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">{recurring.category?.icon || "📋"}</span>
        </div>
        <div className="min-w-0 flex-1 pr-16">
          <h3 className="font-semibold truncate">{recurring.name}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                recurring.type === "INCOME"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              )}
            >
              {recurring.type === "INCOME" ? "Ingreso" : "Gasto"}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatFrequency(recurring.frequency)}
            </span>
          </div>
        </div>
      </div>

      {/* Amount & Next Payment */}
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className={cn(
            "text-xl font-bold",
            recurring.type === "INCOME" ? "text-emerald-600" : ""
          )}>
            {recurring.type === "INCOME" ? "+" : "−"}
            {formatCurrency(Number(recurring.amount))}
          </p>
        </div>
        <div className="text-right">
          {recurring.isActive ? (
            <button
              onClick={() => onRegisterPayment(recurring)}
              className={cn(
                "flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors",
                isOverdue
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-200"
                  : "bg-muted hover:bg-accent text-muted-foreground"
              )}
            >
              <Calendar className="w-3 h-3" />
              {isOverdue ? "Vencido" : format(new Date(recurring.nextPayment), "d MMM", { locale: es })}
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">Pausado</span>
          )}
        </div>
      </div>

      {/* Account */}
      {recurring.account && (
        <p className="text-xs text-muted-foreground mt-2">
          Cuenta: {recurring.account.name}
        </p>
      )}
    </div>
  );
}
