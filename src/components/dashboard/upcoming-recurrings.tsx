"use client";

import { useState } from "react";
import { AlertTriangle, Calendar, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { registerRecurringPayment } from "@/actions/recurrings";

type Recurring = {
  id: string;
  name: string;
  amount: number;
  nextPayment: Date;
  type: "INCOME" | "EXPENSE";
  frequency: string;
};

type UpcomingRecurringsProps = {
  recurrings: Recurring[];
  currency: string;
  workspaceId: string;
};

export function UpcomingRecurrings({ 
  recurrings, 
  currency, 
  workspaceId 
}: UpcomingRecurringsProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-CL", {
      day: "numeric",
      month: "short",
    }).format(new Date(date));
  };

  const isOverdue = (date: Date) => {
    return new Date(date) < new Date();
  };

  const getDaysUntil = (date: Date) => {
    const now = new Date();
    const target = new Date(date);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleRegisterPayment = async (recurringId: string) => {
    setLoadingId(recurringId);
    try {
      const result = await registerRecurringPayment(recurringId, workspaceId);
      if (result.success) {
        setRegisteredIds(prev => new Set([...prev, recurringId]));
      } else {
        console.error("Error registering payment:", result.error);
      }
    } catch (error) {
      console.error("Error registering payment:", error);
    } finally {
      setLoadingId(null);
    }
  };

  if (recurrings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No hay recurrentes activos
      </p>
    );
  }

  // Ordenar: vencidos primero, luego por fecha
  const sortedRecurrings = [...recurrings].sort((a, b) => {
    const aOverdue = isOverdue(a.nextPayment);
    const bOverdue = isOverdue(b.nextPayment);
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    return new Date(a.nextPayment).getTime() - new Date(b.nextPayment).getTime();
  });

  return (
    <div className="space-y-3">
      {sortedRecurrings.map((rec) => {
        const overdue = isOverdue(rec.nextPayment);
        const daysUntil = getDaysUntil(rec.nextPayment);
        const isRegistered = registeredIds.has(rec.id);
        const isLoading = loadingId === rec.id;

        return (
          <div
            key={rec.id}
            className={cn(
              "flex items-center justify-between py-2 border-b-2 last:border-0",
              overdue && !isRegistered
                ? "border-amber-400 dark:border-amber-600"
                : "border-border"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  isRegistered
                    ? "bg-green-100 dark:bg-green-500/20 text-green-600"
                    : overdue
                    ? "bg-amber-100 dark:bg-amber-500/20 text-amber-600"
                    : "bg-blue-100 dark:bg-blue-500/20 text-blue-600"
                )}
              >
                {isRegistered ? (
                  <CheckCircle className="w-4 h-4" />
                ) : overdue ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <Calendar className="w-4 h-4" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">{rec.name}</p>
                <p className={cn(
                  "text-xs",
                  isRegistered
                    ? "text-green-600"
                    : overdue
                    ? "text-amber-600 dark:text-amber-500 font-medium"
                    : "text-muted-foreground"
                )}>
                  {isRegistered 
                    ? "Registrado ✓"
                    : overdue 
                    ? `Vencido el ${formatDate(rec.nextPayment)}`
                    : daysUntil === 0
                    ? "Vence hoy"
                    : daysUntil === 1
                    ? "Vence mañana"
                    : `En ${daysUntil} días`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-sm font-semibold",
                  rec.type === "INCOME" ? "text-green-600" : "text-muted-foreground"
                )}
              >
                {rec.type === "INCOME" ? "+" : ""}
                {formatCurrency(Number(rec.amount))}
              </span>
              {overdue && !isRegistered && (
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handleRegisterPayment(rec.id)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    "Registrar"
                  )}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
