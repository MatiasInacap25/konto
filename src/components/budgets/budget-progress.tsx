import { cn } from "@/lib/utils";
import type { BudgetStatus } from "@/types/budgets";

type BudgetProgressProps = {
  spent: number;
  limit: number;
  status: BudgetStatus;
  showPercentage?: boolean;
  className?: string;
};

const statusColors: Record<BudgetStatus, { bg: string; indicator: string }> = {
  ok: { bg: "bg-green-100", indicator: "bg-green-500" },
  warning: { bg: "bg-yellow-100", indicator: "bg-yellow-500" },
  danger: { bg: "bg-red-100", indicator: "bg-red-500" },
  exceeded: { bg: "bg-red-100", indicator: "bg-red-600" },
};

export function BudgetProgress({
  spent,
  limit,
  status,
  showPercentage = true,
  className,
}: BudgetProgressProps) {
  const percentage = Math.min((spent / limit) * 100, 100);
  const formattedSpent = spent.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  });
  const formattedLimit = limit.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  });

  const colors = statusColors[status];

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {formattedSpent} / {formattedLimit}
        </span>
        {showPercentage && (
          <span
            className={cn(
              "text-xs font-semibold",
              status === "ok" && "text-green-600",
              status === "warning" && "text-yellow-600",
              status === "danger" && "text-red-600",
              status === "exceeded" && "text-red-700"
            )}
          >
            {percentage.toFixed(0)}%
          </span>
        )}
      </div>
      <div className={cn("relative h-2 w-full overflow-hidden rounded-full", colors.bg)}>
        <div
          className={cn("h-full transition-all duration-300", colors.indicator)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {status === "exceeded" && (
        <p className="text-xs text-red-600 font-medium">
          Presupuesto excedido por {(spent - limit).toLocaleString("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 })}
        </p>
      )}
    </div>
  );
}
