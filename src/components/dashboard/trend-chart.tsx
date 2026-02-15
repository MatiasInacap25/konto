"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MonthlyTrendData, DailyTrendData } from "@/types/insights";

type TrendChartProps = {
  monthlyData: MonthlyTrendData[];
  dailyData: DailyTrendData[];
  currency: string;
};

type TimeRange = "30d" | "3m" | "6m" | "1y";

export function TrendChart({ monthlyData, dailyData, currency }: TrendChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Filter data based on selected time range
  const chartData = useMemo(() => {
    switch (timeRange) {
      case "30d":
        // Show last 30 days with data
        return {
          data: dailyData
            .slice(-30) // Last 30 days
            .map((d) => ({
              label: d.day,
              income: d.income,
              expense: d.expense,
            })),
          xAxisKey: "label",
        };
      case "3m":
        // Show last 3 months
        return {
          data: monthlyData.slice(-3).map((d) => ({
            label: d.month,
            income: d.income,
            expense: d.expense,
          })),
          xAxisKey: "label",
        };
      case "6m":
        // Show last 6 months
        return {
          data: monthlyData.slice(-6).map((d) => ({
            label: d.month,
            income: d.income,
            expense: d.expense,
          })),
          xAxisKey: "label",
        };
      case "1y":
        // Show all 12 months
        return {
          data: monthlyData.map((d) => ({
            label: d.month,
            income: d.income,
            expense: d.expense,
          })),
          xAxisKey: "label",
        };
      default:
        return { data: [], xAxisKey: "label" };
    }
  }, [timeRange, monthlyData, dailyData]);

  // If no data, show empty state
  if (
    chartData.data.length === 0 ||
    chartData.data.every((d) => d.income === 0 && d.expense === 0)
  ) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          Creá transacciones para ver tu tendencia
        </p>
      </div>
    );
  }

  const timeRangeOptions = [
    { value: "30d", label: "Últimos 30 días" },
    { value: "3m", label: "3 meses" },
    { value: "6m", label: "6 meses" },
    { value: "1y", label: "1 año" },
  ];

  return (
    <div className="rounded-lg border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold">Tendencia</h3>
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timeRangeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData.data}
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
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "currentColor" }}
              interval={timeRange === "30d" ? 4 : 0} // Show every 5th day for 30d view
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
