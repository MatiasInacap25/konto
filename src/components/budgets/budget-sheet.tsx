"use client";

import { useEffect, useTransition, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, addMonths, startOfQuarter, endOfQuarter } from "date-fns";
import { es } from "date-fns/locale";
import { createBudget, updateBudget } from "@/actions/budgets";
import { toast } from "sonner";
import {
  createBudgetSchema,
  validateCategoryLimitsSum,
  type CreateBudgetFormData,
} from "@/lib/validations/budgets";
import { parseAmount } from "@/lib/validations/account";
import type { PeriodPreset } from "@/types/budgets";
import type { Category } from "@prisma/client";

type BudgetData = {
  id: string;
  name: string;
  totalAmount: number;
  startDate: Date;
  endDate: Date;
  categoryLimits: {
    categoryId: string;
    amount: number;
  }[];
};

type BudgetSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget?: BudgetData | null;
  workspaceId: string;
  expenseCategories: Category[];
};

export function BudgetSheet({
  open,
  onOpenChange,
  budget,
  workspaceId,
  expenseCategories,
}: BudgetSheetProps) {
  const [isPending, startTransition] = useTransition();
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("custom");
  const isEditing = !!budget;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<Omit<CreateBudgetFormData, "categoryLimits"> & { categoryLimits: { categoryId: string; amount: string }[] }>({
    resolver: zodResolver(createBudgetSchema) as any,
    defaultValues: {
      name: "",
      totalAmount: "",
      startDate: new Date(),
      endDate: new Date(),
      categoryLimits: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "categoryLimits",
  });

  const watchedTotalAmount = watch("totalAmount");
  const watchedCategoryLimits = watch("categoryLimits");

  // Check for category limits sum warning
  const limitsWarning = validateCategoryLimitsSum(
    parseAmount(watchedTotalAmount),
    (watchedCategoryLimits || []).map((cl: { categoryId: string; amount: string }) => ({
      amount: parseAmount(cl.amount),
    }))
  );

  // Reset form when budget changes or sheet opens/closes
  useEffect(() => {
    if (open) {
      if (budget) {
        reset({
          name: budget.name,
          totalAmount: budget.totalAmount.toString(),
          startDate: budget.startDate,
          endDate: budget.endDate,
          categoryLimits: budget.categoryLimits.map((cl) => ({
            categoryId: cl.categoryId,
            amount: cl.amount.toString(),
          })),
        });
        setPeriodPreset("custom");
      } else {
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        reset({
          name: `Presupuesto ${format(monthStart, "MMMM yyyy", { locale: es })}`,
          totalAmount: "",
          startDate: monthStart,
          endDate: monthEnd,
          categoryLimits: [],
        });
        setPeriodPreset("this_month");
      }
    }
  }, [open, budget, reset]);

  // Handle period preset changes
  const handlePeriodChange = (preset: PeriodPreset) => {
    setPeriodPreset(preset);

    const now = new Date();
    let start: Date;
    let end: Date;
    let name: string;

    switch (preset) {
      case "this_month":
        start = startOfMonth(now);
        end = endOfMonth(now);
        name = `Presupuesto ${format(start, "MMMM yyyy", { locale: es })}`;
        break;
      case "next_month":
        start = startOfMonth(addMonths(now, 1));
        end = endOfMonth(addMonths(now, 1));
        name = `Presupuesto ${format(start, "MMMM yyyy", { locale: es })}`;
        break;
      case "this_quarter":
        start = startOfQuarter(now);
        end = endOfQuarter(now);
        name = `Presupuesto Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`;
        break;
      default:
        return;
    }

    setValue("startDate", start);
    setValue("endDate", end);
    if (!isEditing) {
      setValue("name", name);
    }
  };

  // Available categories for limits (excluding already selected)
  const availableCategories = expenseCategories.filter(
    (cat) => !fields.some((field) => field.categoryId === cat.id)
  );

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      const payload = {
        name: data.name,
        totalAmount: parseAmount(data.totalAmount),
        startDate: data.startDate,
        endDate: data.endDate,
        workspaceId,
        categoryLimits: data.categoryLimits.map((cl: { categoryId: string; amount: string }) => ({
          categoryId: cl.categoryId,
          amount: parseAmount(cl.amount),
        })),
      };

      const result = isEditing
        ? await updateBudget({ ...payload, id: budget.id })
        : await createBudget(payload);

      if (result.success) {
        toast.success(isEditing ? "Presupuesto actualizado" : "Presupuesto creado");
        onOpenChange(false);
        reset();
      } else {
        toast.error(result.error || "Error al guardar presupuesto");
      }
    });
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[420px] overflow-y-auto flex flex-col gap-0 px-6">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="text-base font-semibold">
            {isEditing ? "Editar Presupuesto" : "Crear Presupuesto"}
          </SheetTitle>
          <SheetDescription className="text-sm">
            Definí un límite de gasto para un período específico
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex-1 flex flex-col px-1">
          <div className="space-y-4 flex-1">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">Nombre</Label>
              <Input
                id="name"
                placeholder="Presupuesto Febrero"
                className="h-9"
                {...register("name")}
                disabled={isPending}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Total Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="totalAmount" className="text-sm font-medium">Presupuesto Total</Label>
              <div className="relative w-fit">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="totalAmount"
                  type="text"
                  inputMode="decimal"
                  placeholder="500.000"
                  autoComplete="off"
                  className="pl-7 text-base font-semibold h-9 w-44 font-mono tabular-nums"
                  {...register("totalAmount")}
                  disabled={isPending}
                />
              </div>
              {errors.totalAmount && (
                <p className="text-xs text-destructive">{errors.totalAmount.message}</p>
              )}
            </div>

            {/* Period Preset */}
            {!isEditing && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Período</Label>
                <Select value={periodPreset} onValueChange={(v) => handlePeriodChange(v as PeriodPreset)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this_month">Este mes</SelectItem>
                    <SelectItem value="next_month">Próximo mes</SelectItem>
                    <SelectItem value="this_quarter">Este trimestre</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Fecha Inicio</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-9 text-sm",
                        !watch("startDate") && "text-muted-foreground"
                      )}
                      disabled={isPending}
                    >
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                      {watch("startDate") ? format(watch("startDate"), "d MMM", { locale: es }) : "Seleccionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={watch("startDate")}
                      onSelect={(date) => {
                        if (date) {
                          setValue("startDate", date);
                          setPeriodPreset("custom");
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.startDate && (
                  <p className="text-xs text-destructive">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Fecha Fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-9 text-sm",
                        !watch("endDate") && "text-muted-foreground"
                      )}
                      disabled={isPending}
                    >
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                      {watch("endDate") ? format(watch("endDate"), "d MMM", { locale: es }) : "Seleccionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={watch("endDate")}
                      onSelect={(date) => {
                        if (date) {
                          setValue("endDate", date);
                          setPeriodPreset("custom");
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.endDate && (
                  <p className="text-xs text-destructive">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            {/* Category Limits */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Límites por Categoría (opcional)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => append({ categoryId: "", amount: "" })}
                  disabled={isPending || availableCategories.length === 0}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Agregar
                </Button>
              </div>

              {fields.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No hay límites por categoría. El presupuesto aplica al total de gastos.
                </p>
              )}

              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Select
                      value={watchedCategoryLimits[index]?.categoryId || ""}
                      onValueChange={(value) => setValue(`categoryLimits.${index}.categoryId`, value)}
                      disabled={isPending}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              {cat.icon && <span>{cat.icon}</span>}
                              <span>{cat.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                        {/* Include currently selected even if not in available */}
                        {watchedCategoryLimits[index]?.categoryId &&
                          !availableCategories.some((c) => c.id === watchedCategoryLimits[index].categoryId) && (
                            <SelectItem value={watchedCategoryLimits[index].categoryId}>
                              {expenseCategories.find((c) => c.id === watchedCategoryLimits[index].categoryId)?.name ||
                                "Categoría"}
                            </SelectItem>
                          )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-28">
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="$50.000"
                      className="h-9 text-sm font-mono"
                      {...register(`categoryLimits.${index}.amount`)}
                      disabled={isPending}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => remove(index)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}

              {limitsWarning && (
                <p className="text-xs text-yellow-600 font-medium">{limitsWarning}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 pb-1">
            <Button type="submit" disabled={isPending} className="flex-1 h-9">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Actualizar" : "Crear"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="h-9"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
