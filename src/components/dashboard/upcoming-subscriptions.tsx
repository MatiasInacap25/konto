"use client";

import { useState } from "react";
import { AlertTriangle, Calendar, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { registerSubscriptionPayment } from "@/actions/subscriptions";

type Subscription = {
  id: string;
  name: string;
  amount: number;
  nextPayment: Date;
  type: "INCOME" | "EXPENSE";
  frequency: string;
};

type UpcomingSubscriptionsProps = {
  subscriptions: Subscription[];
  currency: string;
  workspaceId: string;
};

export function UpcomingSubscriptions({ 
  subscriptions, 
  currency, 
  workspaceId 
}: UpcomingSubscriptionsProps) {
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

  const handleRegisterPayment = async (subscriptionId: string) => {
    setLoadingId(subscriptionId);
    try {
      const result = await registerSubscriptionPayment(subscriptionId, workspaceId);
      if (result.success) {
        setRegisteredIds(prev => new Set([...prev, subscriptionId]));
      } else {
        console.error("Error registering payment:", result.error);
      }
    } catch (error) {
      console.error("Error registering payment:", error);
    } finally {
      setLoadingId(null);
    }
  };

  if (subscriptions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No hay suscripciones activas
      </p>
    );
  }

  // Ordenar: vencidas primero, luego por fecha
  const sortedSubscriptions = [...subscriptions].sort((a, b) => {
    const aOverdue = isOverdue(a.nextPayment);
    const bOverdue = isOverdue(b.nextPayment);
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    return new Date(a.nextPayment).getTime() - new Date(b.nextPayment).getTime();
  });

  return (
    <div className="space-y-3">
      {sortedSubscriptions.map((sub) => {
        const overdue = isOverdue(sub.nextPayment);
        const daysUntil = getDaysUntil(sub.nextPayment);
        const isRegistered = registeredIds.has(sub.id);
        const isLoading = loadingId === sub.id;

        return (
          <div
            key={sub.id}
            className={cn(
              "flex items-center justify-between py-2 border-b last:border-0",
              overdue && !isRegistered && "bg-red-50 -mx-2 px-2 rounded-md"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  isRegistered
                    ? "bg-green-100 text-green-600"
                    : overdue
                    ? "bg-red-100 text-red-600"
                    : "bg-blue-100 text-blue-600"
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
                <p className="text-sm font-medium">{sub.name}</p>
                <p className={cn(
                  "text-xs",
                  isRegistered
                    ? "text-green-600"
                    : overdue
                    ? "text-red-600 font-medium"
                    : "text-muted-foreground"
                )}>
                  {isRegistered 
                    ? "Registrado ✓"
                    : overdue 
                    ? `Vencido el ${formatDate(sub.nextPayment)}`
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
                  sub.type === "INCOME" ? "text-green-600" : "text-muted-foreground"
                )}
              >
                {sub.type === "INCOME" ? "+" : ""}
                {formatCurrency(Number(sub.amount))}
              </span>
              {overdue && !isRegistered && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => handleRegisterPayment(sub.id)}
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
