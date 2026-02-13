"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarIcon, X, SlidersHorizontal } from "lucide-react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { AccountOption, CategoryOption } from "@/types/transactions";

type TransactionFiltersProps = {
  accounts: AccountOption[];
  categories: CategoryOption[];
  workspaceId: string;
};

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
    router.push(`/transactions?${params.toString()}`);
  }, [router, workspaceId]);

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

        {/* Rango de fechas */}
        <Popover>
          <PopoverTrigger asChild>
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
                    ? format(new Date(currentStartDate), "d MMM", { locale: es })
                    : "..."}
                  {" – "}
                  {currentEndDate
                    ? format(new Date(currentEndDate), "d MMM", { locale: es })
                    : "..."}
                </span>
              ) : (
                <span className="text-muted-foreground">Período</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              locale={es}
              selected={{
                from: currentStartDate ? new Date(currentStartDate) : undefined,
                to: currentEndDate ? new Date(currentEndDate) : undefined,
              }}
              onSelect={(range) => {
                const params = new URLSearchParams(searchParams.toString());
                if (workspaceId) params.set("workspace", workspaceId);

                if (range?.from) {
                  params.set("from", range.from.toISOString().split("T")[0]);
                } else {
                  params.delete("from");
                }
                if (range?.to) {
                  params.set("to", range.to.toISOString().split("T")[0]);
                } else {
                  params.delete("to");
                }

                router.push(`/transactions?${params.toString()}`);
              }}
              numberOfMonths={2}
              className="rounded-md border-0"
            />
          </PopoverContent>
        </Popover>

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
