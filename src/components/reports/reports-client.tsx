"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText } from "lucide-react";
import { MonthSelector } from "./month-selector";
import { HeroNumberCard } from "./hero-number-card";
import { CategoryPieChart } from "./category-pie-chart";
import { CategoryDetailPanel } from "./category-detail-panel";
import { TransactionList } from "./transaction-list";
import type { MonthlyReport, AvailableMonth } from "@/types/reports";

type ReportsClientProps = {
  report: MonthlyReport | null;
  availableMonths: AvailableMonth[];
  currency: string;
  workspaceId: string;
};

export function ReportsClient({
  report,
  availableMonths,
  currency,
  workspaceId,
}: ReportsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get current month from URL or use report's month
  const currentYear = report?.year ?? new Date().getFullYear();
  const currentMonth = report?.month ?? new Date().getMonth() + 1;

  const handleMonthSelect = (year: number, month: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("year", year.toString());
    params.set("month", month.toString());
    params.set("workspace", workspaceId);
    router.push(`/reports?${params.toString()}`);
  };

  // Find selected category data
  const selectedCategoryData = selectedCategory
    ? report?.categories.find((c) => c.id === selectedCategory) || null
    : null;

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Sin datos disponibles</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          No hay transacciones registradas en este workspace todavía.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reportes mensuales</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Analizá tus ingresos y gastos por período
          </p>
        </div>
        <MonthSelector
          months={availableMonths}
          selectedYear={currentYear}
          selectedMonth={currentMonth}
          onSelect={handleMonthSelect}
        />
      </div>

      {/* Hero Numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <HeroNumberCard
          label="Ingresos"
          amount={report.totalIncome}
          currency={currency}
          delta={report.comparison?.incomeDelta}
          deltaPercent={report.comparison?.incomeDeltaPercent}
          type="income"
        />
        <HeroNumberCard
          label="Gastos"
          amount={report.totalExpenses}
          currency={currency}
          delta={report.comparison?.expenseDelta}
          deltaPercent={report.comparison?.expenseDeltaPercent}
          type="expense"
        />
        <HeroNumberCard
          label="Balance"
          amount={report.balance}
          currency={currency}
          type="balance"
        />
      </div>

      {/* Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Pie Chart */}
        <div className="lg:col-span-3 bg-card border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Distribución de gastos</h3>
          <CategoryPieChart
            categories={report.categories}
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
            currency={currency}
          />
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-2 bg-card border rounded-xl p-6">
          <CategoryDetailPanel
            category={selectedCategoryData}
            currency={currency}
            totalExpenses={report.totalExpenses}
            onClose={() => setSelectedCategory(null)}
          />
        </div>
      </div>

      {/* Transactions Section */}
      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Transacciones</h3>
        <TransactionList
          transactions={report.transactions}
          selectedCategory={selectedCategory}
          currency={currency}
        />
      </div>
    </div>
  );
}
