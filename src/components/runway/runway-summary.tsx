"use client";

import {
  Wallet,
  CalendarCheck,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SummaryCard = {
  label: string;
  value: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  subtitle?: string;
};

type RunwaySummaryProps = {
  currentBalance: number;
  estimatedBalance: number;
  horizonLabel: string;
  monthlyIncome: number;
  monthlyExpense: number;
  currency: string;
};

export function RunwaySummary({
  currentBalance,
  estimatedBalance,
  horizonLabel,
  monthlyIncome,
  monthlyExpense,
  currency,
}: RunwaySummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const cards: SummaryCard[] = [
    {
      label: "Balance actual",
      value: formatCurrency(currentBalance),
      icon: Wallet,
      iconColor:
        currentBalance >= 0 ? "text-emerald-600" : "text-red-600",
      iconBg:
        currentBalance >= 0
          ? "bg-emerald-50 dark:bg-emerald-950/30"
          : "bg-red-50 dark:bg-red-950/30",
    },
    {
      label: `Balance estimado (${horizonLabel})`,
      value: formatCurrency(estimatedBalance),
      icon: CalendarCheck,
      iconColor:
        estimatedBalance >= 0 ? "text-emerald-600" : "text-red-600",
      iconBg:
        estimatedBalance >= 0
          ? "bg-emerald-50 dark:bg-emerald-950/30"
          : "bg-red-50 dark:bg-red-950/30",
      subtitle:
        estimatedBalance < 0
          ? "Tu capital se agota en este período"
          : undefined,
    },
    {
      label: "Ingreso mensual proyectado",
      value: formatCurrency(monthlyIncome),
      icon: TrendingUp,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      label: "Gasto mensual proyectado",
      value: formatCurrency(monthlyExpense),
      icon: TrendingDown,
      iconColor: "text-foreground",
      iconBg: "bg-muted",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="bg-card border rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </p>
                <p className="text-2xl font-bold mt-1 tabular-nums">
                  {card.value}
                </p>
              </div>
              <div className={cn("p-2 rounded-lg", card.iconBg)}>
                <Icon className={cn("w-5 h-5", card.iconColor)} />
              </div>
            </div>
            {card.subtitle && (
              <p className="text-xs text-muted-foreground mt-2">
                {card.subtitle}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
