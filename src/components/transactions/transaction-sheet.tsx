"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Loader2, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { createTransaction, updateTransaction } from "@/actions/transactions";
import { toast } from "sonner";
import {
  createTransactionSchema,
  parseAmount,
  type CreateTransactionFormData,
} from "@/lib/validations/transaction";
import type {
  TransactionWithRelations,
  AccountOption,
  CategoryOption,
} from "@/types/transactions";
import type { TransactionScope } from "@prisma/client";

type TransactionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: TransactionWithRelations | null;
  accounts: AccountOption[];
  categories: CategoryOption[];
  workspaceId: string;
  workspaceType: "PERSONAL" | "BUSINESS";
};

export function TransactionSheet({
  open,
  onOpenChange,
  transaction,
  accounts,
  categories,
  workspaceId,
  workspaceType,
}: TransactionSheetProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!transaction;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateTransactionFormData>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      amount: "",
      description: "",
      type: "EXPENSE",
      scope: workspaceType === "PERSONAL" ? "PERSONAL" : "BUSINESS",
      date: new Date(),
      accountId: "",
      categoryId: "",
    },
  });

  const selectedType = watch("type");
  const selectedDate = watch("date");

  const filteredCategories = categories.filter((c) => c.type === selectedType);

  useEffect(() => {
    if (open) {
      if (transaction) {
        reset({
          amount: String(transaction.amount),
          description: transaction.description || "",
          type: transaction.type,
          scope: transaction.scope,
          date: new Date(transaction.date),
          accountId: transaction.accountId,
          categoryId: transaction.categoryId || "",
        });
      } else {
        reset({
          amount: "",
          description: "",
          type: "EXPENSE",
          scope: workspaceType === "PERSONAL" ? "PERSONAL" : "BUSINESS",
          date: new Date(),
          accountId: accounts[0]?.id || "",
          categoryId: "",
        });
      }
    }
  }, [open, transaction, reset, accounts, workspaceType]);

  useEffect(() => {
    const currentCategoryId = watch("categoryId");
    if (currentCategoryId) {
      const currentCategory = categories.find((c) => c.id === currentCategoryId);
      if (currentCategory && currentCategory.type !== selectedType) {
        setValue("categoryId", "");
      }
    }
  }, [selectedType, categories, setValue, watch]);

  const onSubmit = (data: CreateTransactionFormData) => {
    startTransition(async () => {
      const amount = parseAmount(data.amount);

      if (isEditing && transaction) {
        const result = await updateTransaction(
          {
            id: transaction.id,
            amount,
            description: data.description || undefined,
            type: data.type,
            scope: data.scope,
            date: data.date,
            accountId: data.accountId,
            categoryId: data.categoryId || null,
          },
          workspaceId
        );

        if (result.success) {
          toast.success("Transacción actualizada");
          onOpenChange(false);
        } else {
          toast.error(result.error || "Error al actualizar");
        }
      } else {
        const result = await createTransaction({
          amount,
          description: data.description || undefined,
          type: data.type,
          scope: data.scope,
          date: data.date,
          accountId: data.accountId,
          categoryId: data.categoryId || undefined,
          workspaceId,
        });

        if (result.success) {
          toast.success("Transacción creada");
          onOpenChange(false);
        } else {
          toast.error(result.error || "Error al crear");
        }
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[400px] overflow-y-auto flex flex-col gap-0 px-6">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="text-base font-semibold">
            {isEditing ? "Editar transacción" : "Nueva transacción"}
          </SheetTitle>
          <SheetDescription className="text-sm">
            {isEditing
              ? "Modificá los datos de la transacción."
              : "Registrá un nuevo ingreso o gasto."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col px-1">
          <div className="space-y-4 flex-1">
            {/* Type toggle — compacto */}
            <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-lg w-fit">
              <button
                type="button"
                onClick={() => setValue("type", "EXPENSE")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  selectedType === "EXPENSE"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ArrowDownLeft className="h-3.5 w-3.5" />
                Gasto
              </button>
              <button
                type="button"
                onClick={() => setValue("type", "INCOME")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  selectedType === "INCOME"
                    ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                Ingreso
              </button>
            </div>

            {/* Monto — compacto */}
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-sm font-medium">
                Monto
              </Label>
              <div className="relative w-fit">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  autoComplete="off"
                  className={cn(
                    "pl-7 text-lg font-semibold h-10 w-40",
                    "font-mono tabular-nums",
                    selectedType === "INCOME" && "text-emerald-600 dark:text-emerald-400",
                    errors.amount && "border-destructive focus-visible:ring-destructive"
                  )}
                  {...register("amount")}
                />
              </div>
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount.message}</p>
              )}
            </div>

            {/* Cuenta y Categoría — grid compacto */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Cuenta</Label>
                <Select
                  value={watch("accountId")}
                  onValueChange={(value) => setValue("accountId", value)}
                >
                  <SelectTrigger 
                    className={cn(
                      "h-9",
                      errors.accountId && "border-destructive focus:ring-destructive"
                    )}
                  >
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.accountId && (
                  <p className="text-xs text-destructive">{errors.accountId.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Categoría</Label>
                <Select
                  value={watch("categoryId") || "__none__"}
                  onValueChange={(value) =>
                    setValue("categoryId", value === "__none__" ? "" : value)
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin categoría</SelectItem>
                    {filteredCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fecha */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-fit justify-start text-left font-normal h-9",
                      !selectedDate && "text-muted-foreground",
                      errors.date && "border-destructive"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {selectedDate ? (
                      format(selectedDate, "d MMM yyyy", { locale: es })
                    ) : (
                      "Seleccionar fecha"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    locale={es}
                    selected={selectedDate}
                    onSelect={(date) => date && setValue("date", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.date && (
                <p className="text-xs text-destructive">{errors.date.message}</p>
              )}
            </div>

            {/* Nota */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm font-medium">
                Nota <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Ej: Almuerzo cliente, Pago proyecto..."
                className={cn(
                  "resize-none min-h-[72px] text-sm",
                  errors.description && "border-destructive focus-visible:ring-destructive"
                )}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description.message}</p>
              )}
            </div>

            {/* Scope — solo business */}
            {workspaceType === "BUSINESS" && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Alcance</Label>
                <Select
                  value={watch("scope")}
                  onValueChange={(value) =>
                    setValue("scope", value as TransactionScope)
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUSINESS">Negocio</SelectItem>
                    <SelectItem value="PERSONAL">Personal</SelectItem>
                    <SelectItem value="MIXED">Mixto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 mt-4 mb-4 border-t">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              className={cn(
                selectedType === "INCOME" &&
                  "bg-emerald-600 hover:bg-emerald-700 text-white"
              )}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEditing ? (
                "Guardar"
              ) : (
                "Registrar"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
