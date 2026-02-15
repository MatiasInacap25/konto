"use client";

import { useState } from "react";
import { ChevronDown, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AvailableMonth } from "@/types/reports";

type MonthSelectorProps = {
  months: AvailableMonth[];
  selectedYear: number;
  selectedMonth: number;
  onSelect: (year: number, month: number) => void;
};

export function MonthSelector({
  months,
  selectedYear,
  selectedMonth,
  onSelect,
}: MonthSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedMonthData = months.find(
    (m) => m.year === selectedYear && m.month === selectedMonth
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
          "bg-card border hover:bg-accent transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-ring"
        )}
      >
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <span>
          {selectedMonthData
            ? `${selectedMonthData.monthName} ${selectedYear}`
            : "Seleccionar mes"}
        </span>
        {selectedMonthData && (
          <span className="text-muted-foreground">
            • {selectedMonthData.transactionCount} movimientos
          </span>
        )}
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-64 bg-card border rounded-lg shadow-lg z-50 py-1 max-h-80 overflow-y-auto">
            {months.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                No hay datos disponibles
              </div>
            ) : (
              months.map((month) => (
                <button
                  key={`${month.year}-${month.month}`}
                  onClick={() => {
                    onSelect(month.year, month.month);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 text-sm",
                    "hover:bg-accent transition-colors",
                    month.year === selectedYear && month.month === selectedMonth
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground"
                  )}
                >
                  <span>
                    {month.monthName} {month.year}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {month.transactionCount} mov.
                  </span>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
