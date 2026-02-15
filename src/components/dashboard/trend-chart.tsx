"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { MonthlyTrendData } from "@/types/insights";

type TrendChartProps = {
  data: MonthlyTrendData[];
  currency: string;
};

export function TrendChart({ data, currency }: TrendChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // If no data, show empty state
  if (data.length === 0 || data.every((d) => d.income === 0 && d.expense === 0)) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          Creá transacciones para ver tu tendencia mensual
        </p>
      </div>
    );
  }

  // Transform data for recharts
  const chartData = data.map((d) => ({
    month: d.month,
    income: d.income,
    expense: d.expense,
  }));

  return (
    <div className="rounded-lg border p-6">
      <h3 className="font-semibold mb-6">Tendencia Mensual</h3>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "currentColor" }}
              className="text-muted-foreground"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "currentColor" }}
              tickFormatter={(value) => {
                if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
                return `$${value}`;
              }}
              className="text-muted-foreground"
            />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              labelStyle={{ color: "hsl(var(--popover-foreground))" }}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="#22c55e"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorIncome)"
              name="Ingresos"
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke="#ef4444"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorExpense)"
              name="Gastos"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm text-muted-foreground">Ingresos</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm text-muted-foreground">Gastos</span>
        </div>
      </div>
    </div>
  );
}
