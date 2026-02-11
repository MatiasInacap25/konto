import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Transaction = {
  id: string;
  amount: number;
  date: Date;
  description: string | null;
  type: "INCOME" | "EXPENSE";
  category: {
    name: string;
    icon: string | null;
  } | null;
  account: {
    name: string;
  };
};

type RecentTransactionsProps = {
  transactions: Transaction[];
  currency: string;
};

export function RecentTransactions({ transactions, currency }: RecentTransactionsProps) {
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

  if (transactions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No hay transacciones registradas
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="flex items-center justify-between py-2 border-b last:border-0"
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm",
                tx.type === "INCOME"
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              )}
            >
              {tx.category?.icon || (tx.type === "INCOME" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />)}
            </div>
            <div>
              <p className="text-sm font-medium">
                {tx.description || tx.category?.name || "Sin descripción"}
              </p>
              <p className="text-xs text-muted-foreground">
                {tx.account.name} · {formatDate(tx.date)}
              </p>
            </div>
          </div>
          <span
            className={cn(
              "text-sm font-semibold",
              tx.type === "INCOME" ? "text-green-600" : "text-red-600"
            )}
          >
            {tx.type === "INCOME" ? "+" : "-"}
            {formatCurrency(Number(tx.amount))}
          </span>
        </div>
      ))}
    </div>
  );
}
