"use client";

import { cn } from "@/lib/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

type ProjectionMonth = {
  label: string;
  income: number;
  expense: number;
  net: number;
  balance: number;
};

type RunwayTableProps = {
  data: ProjectionMonth[];
  currency: string;
};

export function RunwayTable({ data, currency }: RunwayTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-card border rounded-xl p-6">
      <h3 className="font-semibold mb-4">Desglose mensual</h3>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mes</TableHead>
            <TableHead className="text-right">Ingresos</TableHead>
            <TableHead className="text-right">Gastos</TableHead>
            <TableHead className="text-right">Neto</TableHead>
            <TableHead className="text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((month) => (
            <TableRow
              key={month.label}
              className={cn(month.balance < 0 && "bg-red-50/50 dark:bg-red-950/10")}
            >
              <TableCell className="font-medium">{month.label}</TableCell>
              <TableCell className="text-right tabular-nums text-emerald-600">
                {formatCurrency(month.income)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(month.expense)}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right tabular-nums",
                  month.net >= 0 ? "text-emerald-600" : "text-red-600"
                )}
              >
                {month.net >= 0 ? "+" : ""}
                {formatCurrency(month.net)}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right tabular-nums font-medium",
                  month.balance < 0 && "text-red-600"
                )}
              >
                {formatCurrency(month.balance)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
