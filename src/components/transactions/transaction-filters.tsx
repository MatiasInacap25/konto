"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarIcon, X, Search } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import type { AccountOption, CategoryOption } from "@/types/transactions";

type TransactionFiltersProps = {
  accounts: AccountOption[];
  categories: CategoryOption[];
  workspaceId: string;
};

// Helper para formatear fecha a YYYY-MM-DD en timezone local
function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function TransactionFilters({
  accounts,
  categories,
  workspaceId,
}: TransactionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentType = searchParams.get("type");
  const currentAccount = searchParams.get("account");
  const currentCategory = searchParams.get("category");
  const currentStartDate = searchParams.get("from");
  const currentEndDate = searchParams.get("to");

  // Estado local para el date picker (no aplica hasta que se confirma)
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: currentStartDate ? new Date(currentStartDate + "T00:00:00") : undefined,
    to: currentEndDate ? new Date(currentEndDate + "T00:00:00") : undefined,
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const activeFiltersCount = [
    currentAccount,
    currentCategory,
    currentStartDate || currentEndDate,
  ].filter(Boolean).length;

  const hasAnyFilter =
    currentType || currentAccount || currentCategory || currentStartDate || currentEndDate;

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (workspaceId) {
        params.set("workspace", workspaceId);
      }

      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }

      router.push(`/transactions?${params.toString()}`);
    },
    [router, searchParams, workspaceId]
  );

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (workspaceId) {
      params.set("workspace", workspaceId);
    }
    setDateRange({ from: undefined, to: undefined });
    router.push(`/transactions?${params.toString()}`);
  }, [router, workspaceId]);

  const applyDateFilter = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (workspaceId) params.set("workspace", workspaceId);

    if (dateRange.from) {
      params.set("from", formatDateToString(dateRange.from));
    } else {
      params.delete("from");
    }
    if (dateRange.to) {
      params.set("to", formatDateToString(dateRange.to));
    } else {
      params.delete("to");
    }

    router.push(`/transactions?${params.toString()}`);
    setIsCalendarOpen(false);
  }, [dateRange, router, searchParams, workspaceId]);

  const clearDateFilter = useCallback(() => {
    setDateRange({ from: undefined, to: undefined });
  }, []);

  const incomeCategories = categories.filter((c) => c.type === "INCOME");
  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      {/* Type toggle — protagonista, estilo segmented control */}
      <div className="inline-flex items-center rounded-lg bg-muted p-1 gap-1">
        <button
          onClick={() => updateFilter("type", null)}
          className={cn(
            "px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
            !currentType
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Todos
        </button>
        <button
          onClick={() =>
            updateFilter("type", currentType === "INCOME" ? null : "INCOME")
          }
          className={cn(
            "px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
            currentType === "INCOME"
              ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Ingresos
        </button>
        <button
          onClick={() =>
            updateFilter("type", currentType === "EXPENSE" ? null : "EXPENSE")
          }
          className={cn(
            "px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
            currentType === "EXPENSE"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Gastos
        </button>
      </div>

      {/* Filtros secundarios */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Cuenta */}
        <Select
          value={currentAccount || "__all__"}
          onValueChange={(value) => updateFilter("account", value === "__all__" ? null : value)}
        >
          <SelectTrigger
            className={cn(
              "h-9 w-auto min-w-[140px] text-sm",
              currentAccount && "border-primary/50 bg-primary/5"
            )}
          >
            <SelectValue placeholder="Cuenta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas las cuentas</SelectItem>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Categoría */}
        <Select
          value={currentCategory || "__all__"}
          onValueChange={(value) => updateFilter("category", value === "__all__" ? null : value)}
        >
          <SelectTrigger
            className={cn(
              "h-9 w-auto min-w-[140px] text-sm",
              currentCategory && "border-primary/50 bg-primary/5"
            )}
          >
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas</SelectItem>
            {incomeCategories.length > 0 && (
              <SelectGroup>
                <SelectLabel className="text-emerald-600 dark:text-emerald-400">
                  Ingresos
                </SelectLabel>
                {incomeCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
            {expenseCategories.length > 0 && (
              <SelectGroup>
                <SelectLabel className="text-muted-foreground">Gastos</SelectLabel>
                {expenseCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>

        {/* Rango de fechas con Sheet */}
        <Sheet open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 text-sm font-normal gap-2",
                (currentStartDate || currentEndDate) &&
                  "border-primary/50 bg-primary/5 text-foreground"
              )}
            >
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              {currentStartDate || currentEndDate ? (
                <span>
                  {currentStartDate
                    ? format(new Date(currentStartDate + "T00:00:00"), "d MMM", { locale: es })
                    : "..."}
                  {" – "}
                  {currentEndDate
                    ? format(new Date(currentEndDate + "T00:00:00"), "d MMM", { locale: es })
                    : "..."}
                </span>
              ) : (
                <span className="text-muted-foreground">Período</span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[600px] sm:h-[500px] flex flex-col">
            <SheetHeader className="pb-4 border-b">
              <SheetTitle className="text-center">
                {dateRange.from && dateRange.to
                  ? `${format(dateRange.from, "d 'de' MMMM", { locale: es })} – ${format(dateRange.to, "d 'de' MMMM", { locale: es })}`
                  : dateRange.from
                  ? `Desde ${format(dateRange.from, "d 'de' MMMM", { locale: es })}...`
                  : dateRange.to
                  ? `Hasta ${format(dateRange.to, "d 'de' MMMM", { locale: es })}`
                  : "Seleccioná un rango de fechas"}
              </SheetTitle>
            </SheetHeader>
            
            {/* Calendar */}
            <div className="flex-1 overflow-y-auto py-4 flex flex-col items-center">
              <Calendar
                mode="range"
                locale={es}
                selected={{
                  from: dateRange.from,
                  to: dateRange.to,
                }}
                onSelect={(range) => {
                  setDateRange({
                    from: range?.from,
                    to: range?.to,
                  });
                }}
                numberOfMonths={2}
                className="rounded-md border-0"
              />
              
              {/* Botones justo debajo del calendario */}
              <div className="mt-6 flex items-center justify-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearDateFilter}
                  disabled={!dateRange.from && !dateRange.to}
                >
                  Limpiar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCalendarOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={applyDateFilter}
                  disabled={!dateRange.from && !dateRange.to}
                  className="gap-1.5"
                >
                  <Search className="h-3.5 w-3.5" />
                  Aplicar
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Limpiar filtros — solo si hay filtros activos */}
        {hasAnyFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 px-3 text-muted-foreground hover:text-foreground gap-1.5"
          >
            <X className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Limpiar</span>
            {activeFiltersCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-xs font-medium">
                {activeFiltersCount + (currentType ? 1 : 0)}
              </span>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
