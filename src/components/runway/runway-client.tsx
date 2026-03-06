"use client";

import { useState, useMemo } from "react";
import { TrendingUp, CircleHelp } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { RunwaySummary } from "./runway-summary";
import { RunwayTable } from "./runway-table";
import type { RunwayData } from "@/lib/queries/runway";
import type { Frequency } from "@prisma/client";

// Lazy-load RunwayChart — it imports Recharts (~200KB)
import dynamic from "next/dynamic";
const RunwayChart = dynamic(
  () => import("./runway-chart").then((m) => ({ default: m.RunwayChart })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[350px] w-full rounded-xl border bg-card animate-pulse" />
    ),
  }
);

type Horizon = "3" | "6" | "12";

type ProjectionMonth = {
  label: string;
  income: number;
  expense: number;
  net: number;
  balance: number;
};

// Frequency → monthly multipliers
const FREQUENCY_MULTIPLIER: Record<Frequency, number> = {
  WEEKLY: 4.33,
  BIWEEKLY: 2.17,
  MONTHLY: 1,
  QUARTERLY: 1 / 3,
  SEMI_ANNUALLY: 1 / 6,
  YEARLY: 1 / 12,
};

const MONTH_NAMES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

function calculateMonthlyFromRecurrings(
  recurrings: RunwayData["recurrings"]
): { income: number; expense: number } {
  let income = 0;
  let expense = 0;

  for (const r of recurrings) {
    const monthlyAmount = r.amount * FREQUENCY_MULTIPLIER[r.frequency];
    if (r.type === "INCOME") {
      income += monthlyAmount;
    } else {
      expense += monthlyAmount;
    }
  }

  return { income, expense };
}

function calculateProjection(
  data: RunwayData,
  horizon: number,
  useHistorical: boolean
): ProjectionMonth[] {
  const { income: recurringIncome, expense: recurringExpense } =
    calculateMonthlyFromRecurrings(data.recurrings);

  // Start with recurrings as base
  let monthlyIncome = recurringIncome;
  let monthlyExpense = recurringExpense;

  // If historical toggle is on, add extra non-recurring amounts
  if (useHistorical && data.historical.monthsAnalyzed > 0) {
    const extraIncome = Math.max(
      0,
      data.historical.avgMonthlyIncome - recurringIncome
    );
    const extraExpense = Math.max(
      0,
      data.historical.avgMonthlyExpense - recurringExpense
    );
    monthlyIncome += extraIncome;
    monthlyExpense += extraExpense;
  }

  const now = new Date();
  let balance = data.currentBalance;
  const months: ProjectionMonth[] = [];

  for (let i = 0; i < horizon; i++) {
    const futureDate = new Date(now.getFullYear(), now.getMonth() + 1 + i, 1);
    const label = `${MONTH_NAMES[futureDate.getMonth()]} ${futureDate.getFullYear()}`;

    const net = monthlyIncome - monthlyExpense;
    balance += net;

    months.push({
      label,
      income: Math.round(monthlyIncome),
      expense: Math.round(monthlyExpense),
      net: Math.round(net),
      balance: Math.round(balance),
    });
  }

  return months;
}

type RunwayClientProps = {
  data: RunwayData;
};

export function RunwayClient({ data }: RunwayClientProps) {
  const [horizon, setHorizon] = useState<Horizon>("6");
  const [useHistorical, setUseHistorical] = useState(false);

  const projection = useMemo(
    () => calculateProjection(data, Number(horizon), useHistorical),
    [data, horizon, useHistorical]
  );

  // Get the monthly figures from projection (they're the same each month)
  const monthlyIncome = projection[0]?.income ?? 0;
  const monthlyExpense = projection[0]?.expense ?? 0;

  // Balance at the end of the selected horizon
  const estimatedBalance = projection[projection.length - 1]?.balance ?? 0;

  const horizonLabels: Record<Horizon, string> = {
    "3": "3 meses",
    "6": "6 meses",
    "12": "12 meses",
  };

  const hasRecurrings = data.recurrings.length > 0;
  const hasHistorical = data.historical.monthsAnalyzed > 0;

  if (!hasRecurrings && !hasHistorical) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <TrendingUp className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Sin datos para proyectar</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Creá transacciones recurrentes o registrá transacciones durante al
          menos un mes para ver proyecciones.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Proyección (Runway)</h1>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="¿Cómo funciona?"
                >
                  <CircleHelp className="w-5 h-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 text-sm space-y-3" side="bottom" align="start">
                <p className="font-semibold">¿Cómo funciona?</p>
                <p className="text-muted-foreground">
                  El gráfico proyecta tu <strong>balance futuro</strong> mes a mes.
                  Arranca con tu saldo actual y suma ingresos / resta gastos cada mes.
                  La línea roja punteada marca $0.
                </p>
                <p className="text-muted-foreground">
                  <strong>Base de cálculo:</strong> tus transacciones recurrentes activas
                  se convierten a valor mensual (ej: semanal ×4,33, trimestral ÷3).
                </p>
                <p className="text-muted-foreground">
                  <strong>Toggle &quot;Incluir histórico&quot;:</strong> analiza tus últimos
                  3 meses completos y agrega los gastos/ingresos extras que no están
                  cubiertos por recurrentes (compras sueltas, imprevistos, etc.).
                </p>
                <p className="text-muted-foreground">
                  <strong>Runway estimado:</strong> cantidad de meses hasta que tu
                  balance llega a $0. Si tus ingresos superan tus gastos, el runway
                  es infinito (∞).
                </p>
              </PopoverContent>
            </Popover>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Proyectá cuánto tiempo te dura tu capital actual
          </p>
        </div>
        <div className="flex items-center gap-4">
          {hasHistorical && (
            <div className="flex items-center gap-2">
              <Switch
                id="historical"
                checked={useHistorical}
                onCheckedChange={setUseHistorical}
                size="sm"
              />
              <Label htmlFor="historical" className="text-sm cursor-pointer">
                Incluir histórico
              </Label>
            </div>
          )}
          <ToggleGroup
            type="single"
            value={horizon}
            onValueChange={(v) => {
              if (v) setHorizon(v as Horizon);
            }}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="3">3M</ToggleGroupItem>
            <ToggleGroupItem value="6">6M</ToggleGroupItem>
            <ToggleGroupItem value="12">12M</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Summary cards */}
      <RunwaySummary
        currentBalance={data.currentBalance}
        estimatedBalance={estimatedBalance}
        horizonLabel={horizonLabels[horizon]}
        monthlyIncome={monthlyIncome}
        monthlyExpense={monthlyExpense}
        currency={data.currency}
      />

      {/* Chart */}
      <RunwayChart data={projection} currency={data.currency} />

      {/* Table */}
      <RunwayTable data={projection} currency={data.currency} />
    </div>
  );
}
