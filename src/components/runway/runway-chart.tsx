"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

type ProjectionMonth = {
  label: string;
  income: number;
  expense: number;
  net: number;
  balance: number;
};

type RunwayChartProps = {
  data: ProjectionMonth[];
  currency: string;
};

export function RunwayChart({ data, currency }: RunwayChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    if (value <= -1000000) return `-$${(Math.abs(value) / 1000000).toFixed(1)}M`;
    if (value <= -1000) return `-$${(Math.abs(value) / 1000).toFixed(0)}k`;
    return `$${value}`;
  };

  // Check if balance ever goes negative
  const hasNegativeBalance = data.some((d) => d.balance < 0);

  return (
    <div className="bg-card border rounded-xl p-6">
      <h3 className="font-semibold mb-4">Proyección de balance</h3>

      <div className="h-[300px] w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDanger" x1="0" y1="0" x2="0" y2="1">
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
              className="text-muted-foreground"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "currentColor" }}
              tickFormatter={formatYAxis}
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
            {hasNegativeBalance && (
              <ReferenceLine
                y={0}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
            )}
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorBalance)"
              name="Balance"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-sm text-muted-foreground">
            Balance proyectado
          </span>
        </div>
        {hasNegativeBalance && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-red-500" />
            <span className="text-sm text-muted-foreground">Línea de $0</span>
          </div>
        )}
      </div>
    </div>
  );
}
