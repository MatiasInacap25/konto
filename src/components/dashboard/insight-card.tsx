import { AlertTriangle, TrendingUp, TrendingDown, Wallet, Info, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Insight } from "@/types/insights";

type InsightCardProps = {
  insight: Insight;
};

export function InsightCard({ insight }: InsightCardProps) {
  const getIcon = () => {
    switch (insight.type) {
      case "alert":
        return <AlertTriangle className="h-5 w-5" />;
      case "success":
        return <Wallet className="h-5 w-5" />;
      case "trend":
        return insight.trend === "up" ? (
          <TrendingUp className="h-5 w-5" />
        ) : insight.trend === "down" ? (
          <TrendingDown className="h-5 w-5" />
        ) : (
          <TrendingUp className="h-5 w-5" />
        );
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getColors = () => {
    switch (insight.type) {
      case "alert":
        return {
          bg: "bg-amber-50 dark:bg-amber-950/30",
          text: "text-amber-700 dark:text-amber-400",
          icon: "text-amber-600 dark:text-amber-400",
          border: "border-amber-200 dark:border-amber-800",
        };
      case "success":
        return {
          bg: "bg-green-50 dark:bg-green-950/30",
          text: "text-green-700 dark:text-green-400",
          icon: "text-green-600 dark:text-green-400",
          border: "border-green-200 dark:border-green-800",
        };
      case "trend":
        if (insight.trend === "up") {
          return {
            bg: "bg-blue-50 dark:bg-blue-950/30",
            text: "text-blue-700 dark:text-blue-400",
            icon: "text-blue-600 dark:text-blue-400",
            border: "border-blue-200 dark:border-blue-800",
          };
        }
        return {
          bg: "bg-slate-50 dark:bg-slate-950/30",
          text: "text-slate-700 dark:text-slate-400",
          icon: "text-slate-600 dark:text-slate-400",
          border: "border-slate-200 dark:border-slate-800",
        };
      default:
        return {
          bg: "bg-slate-50 dark:bg-slate-950/30",
          text: "text-slate-700 dark:text-slate-400",
          icon: "text-slate-600 dark:text-slate-400",
          border: "border-slate-200 dark:border-slate-800",
        };
    }
  };

  const colors = getColors();

  return (
    <div
      className={cn(
        "relative rounded-lg border p-4 transition-colors",
        colors.bg,
        colors.border
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 shrink-0", colors.icon)}>{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <h4 className={cn("font-medium text-sm", colors.text)}>
            {insight.title}
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {insight.description}
          </p>
          {insight.value && (
            <p className={cn("font-semibold mt-2", colors.text)}>
              {insight.value}
            </p>
          )}
          {insight.action && (
            <a
              href={insight.action.href}
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium mt-3 hover:underline",
                colors.text
              )}
            >
              {insight.action.label}
              <ArrowRight className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
