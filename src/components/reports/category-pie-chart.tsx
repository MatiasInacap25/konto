"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, type TooltipProps } from "recharts";
import type { CategoryReport } from "@/types/reports";

// Category colors - consistent palette
const CATEGORY_COLORS = [
  "#10b981", // emerald-500
  "#3b82f6", // blue-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
  "#ec4899", // pink-500
  "#84cc16", // lime-500
  "#6366f1", // indigo-500
];

type CategoryPieChartProps = {
  categories: CategoryReport[];
  selectedCategory: string | null;
  onSelect: (categoryId: string | null) => void;
  currency: string;
};

export function CategoryPieChart({
  categories,
  selectedCategory,
  onSelect,
  currency,
}: CategoryPieChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Filter only expense categories and sort by amount
  const expenseCategories = useMemo(() => {
    return categories
      .filter((cat) => cat.type === "EXPENSE")
      .sort((a, b) => b.amount - a.amount);
  }, [categories]);

  // Calculate total for percentage
  const totalExpenses = useMemo(() => {
    return expenseCategories.reduce((sum, cat) => sum + cat.amount, 0);
  }, [expenseCategories]);

  // Prepare data for chart
  const chartData = useMemo(() => {
    return expenseCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      value: cat.amount,
      percentage: totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0,
    }));
  }, [expenseCategories, totalExpenses]);

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted/80 flex items-center justify-center mb-4">
          <svg
            className="w-7 h-7 text-muted-foreground/70"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium">Sin gastos este mes</p>
        <p className="text-xs text-muted-foreground mt-1">
          No hay transacciones de gastos para mostrar
        </p>
      </div>
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            onClick={(_, index) => {
              const category = chartData[index];
              if (category) {
                onSelect(selectedCategory === category.id ? null : category.id);
              }
            }}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${entry.id}`}
                fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                stroke={selectedCategory === entry.id ? "#000" : "none"}
                strokeWidth={selectedCategory === entry.id ? 2 : 0}
                style={{
                  cursor: "pointer",
                  filter: selectedCategory && selectedCategory !== entry.id
                    ? "opacity(0.3)"
                    : "none",
                  transform: selectedCategory === entry.id ? "scale(1.02)" : "scale(1)",
                  transformOrigin: "center",
                  transition: "all 0.2s ease",
                }}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload as { name: string; value: number; percentage: number };
                return (
                  <div className="bg-card border rounded-lg px-3 py-2 shadow-lg">
                    <p className="text-sm font-medium">{data.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(data.value)} ({data.percentage.toFixed(1)}%)
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
