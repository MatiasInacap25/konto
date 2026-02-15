"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type HeroNumberCardProps = {
  label: string;
  amount: number;
  currency: string;
  delta?: number;
  deltaPercent?: number;
  type: "income" | "expense" | "balance";
};

export function HeroNumberCard({
  label,
  amount,
  currency,
  delta,
  deltaPercent,
  type,
}: HeroNumberCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getTypeStyles = () => {
    switch (type) {
      case "income":
        return {
          icon: TrendingUp,
          iconColor: "text-emerald-600",
          iconBg: "bg-emerald-50 dark:bg-emerald-950/30",
          deltaPositive: "good",
        };
      case "expense":
        return {
          icon: TrendingDown,
          iconColor: "text-foreground",
          iconBg: "bg-muted",
          deltaPositive: "bad",
        };
      case "balance":
        return {
          icon: amount >= 0 ? TrendingUp : Minus,
          iconColor: amount >= 0 ? "text-emerald-600" : "text-red-600",
          iconBg: amount >= 0 
            ? "bg-emerald-50 dark:bg-emerald-950/30" 
            : "bg-red-50 dark:bg-red-950/30",
          deltaPositive: "neutral",
        };
    }
  };

  const styles = getTypeStyles();
  const Icon = styles.icon;

  const getDeltaColor = () => {
    if (delta === undefined) return "text-muted-foreground";
    
    if (type === "income") {
      return delta >= 0 ? "text-emerald-600" : "text-red-600";
    }
    if (type === "expense") {
      return delta <= 0 ? "text-emerald-600" : "text-red-600";
    }
    return delta >= 0 ? "text-emerald-600" : "text-red-600";
  };

  return (
    <div className="bg-card border rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1 tabular-nums">
            {formatCurrency(amount)}
          </p>
        </div>
        <div className={cn("p-2 rounded-lg", styles.iconBg)}>
          <Icon className={cn("w-5 h-5", styles.iconColor)} />
        </div>
      </div>
      
      {delta !== undefined && (
        <div className="mt-3 flex items-center gap-1.5 text-sm">
          <span className={getDeltaColor()}>
            {delta >= 0 ? "+" : ""}
            {formatCurrency(delta)}
          </span>
          {deltaPercent !== undefined && (
            <span className={cn("text-xs", getDeltaColor())}>
              ({deltaPercent >= 0 ? "+" : ""}
              {deltaPercent.toFixed(1)}%)
            </span>
          )}
          <span className="text-muted-foreground text-xs ml-1">vs mes ant.</span>
        </div>
      )}
    </div>
  );
}
