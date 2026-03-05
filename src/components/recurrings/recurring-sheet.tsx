"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { createRecurringSchema } from "@/lib/validations/recurring";
import { createRecurring, updateRecurring } from "@/actions/recurrings";
import type { RecurringWithRelations, RecurringFormData } from "@/types/recurrings";
import type { CategoryOption } from "@/types/transactions";
import type { AccountOption } from "@/types/accounts";
import { toast } from "sonner";
import { format } from "date-fns";

type RecurringSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recurring: RecurringWithRelations | null;
  workspaceId: string;
  currency: string;
  accounts: AccountOption[];
  categories: CategoryOption[];
};

export function RecurringSheet({
  open,
  onOpenChange,
  recurring,
  workspaceId,
  currency,
  accounts,
  categories,
}: RecurringSheetProps) {
  const isEditing = !!recurring;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createRecurringSchema),
    defaultValues: {
      name: "",
      amount: "",
      frequency: "MONTHLY",
      nextPayment: format(new Date(), "yyyy-MM-dd"),
      type: "EXPENSE",
      scope: "PERSONAL",
      accountId: "",
      categoryId: "",
    },
  });

  // Reset form when recurring changes
  useEffect(() => {
    if (recurring) {
      reset({
        name: recurring.name,
        amount: String(Number(recurring.amount)),
        frequency: recurring.frequency,
        nextPayment: format(new Date(recurring.nextPayment), "yyyy-MM-dd"),
        type: recurring.type,
        scope: recurring.scope,
        accountId: recurring.accountId || "",
        categoryId: recurring.categoryId || "",
      });
    } else {
      reset({
        name: "",
        amount: "",
        frequency: "MONTHLY",
        nextPayment: format(new Date(), "yyyy-MM-dd"),
        type: "EXPENSE",
        scope: "PERSONAL",
        accountId: "",
        categoryId: "",
      });
    }
  }, [recurring, reset]);

  const selectedType = watch("type");
  const selectedFrequency = watch("frequency");

  // Filter categories by type
  const filteredCategories = categories.filter(
    (c) => c.type === selectedType
  );

  const onSubmit = async (data: any) => {
    try {
      if (isEditing && recurring) {
        const result = await updateRecurring({
          id: recurring.id,
          name: data.name,
          amount: data.amount,
          frequency: data.frequency,
          nextPayment: data.nextPayment,
          type: data.type,
          scope: data.scope,
          accountId: data.accountId || null,
          categoryId: data.categoryId || null,
          workspaceId,
        });

        if (result.success) {
          toast.success("Recurrente actualizado");
          onOpenChange(false);
        } else {
          toast.error(result.error || "Error al actualizar");
        }
      } else {
        const result = await createRecurring({
          name: data.name,
          amount: data.amount,
          frequency: data.frequency,
          nextPayment: data.nextPayment,
          type: data.type,
          scope: data.scope,
          accountId: data.accountId || null,
          categoryId: data.categoryId || null,
          workspaceId,
        });

        if (result.success) {
          toast.success("Recurrente creado");
          onOpenChange(false);
        } else {
          toast.error(result.error || "Error al crear");
        }
      }
    } catch {
      toast.error("Error inesperado");
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={() => onOpenChange(false)}
      />

      {/* Sheet */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-card border-l shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">
              {isEditing ? "Editar recurrente" : "Nuevo recurrente"}
            </h2>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-md hover:bg-accent transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Nombre <span className="text-destructive">*</span>
            </label>
            <input
              {...register("name")}
              type="text"
              placeholder="Ej: Netflix, Spotify, Salario"
              className={cn(
                "w-full px-3 py-2 rounded-md border bg-background",
                "focus:outline-none focus:ring-2 focus:ring-ring",
                errors.name && "border-destructive"
              )}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message as string}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Monto <span className="text-destructive">*</span>
            </label>
            <input
              {...register("amount")}
              type="text"
              placeholder={currency === "CLP" ? "15.000" : "100.00"}
              className={cn(
                "w-full px-3 py-2 rounded-md border bg-background",
                "focus:outline-none focus:ring-2 focus:ring-ring",
                errors.amount && "border-destructive"
              )}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message as string}</p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setValue("type", "EXPENSE")}
                className={cn(
                  "flex-1 px-4 py-2 rounded-md border text-sm font-medium transition-colors",
                  selectedType === "EXPENSE"
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background hover:bg-accent"
                )}
              >
                Gasto
              </button>
              <button
                type="button"
                onClick={() => setValue("type", "INCOME")}
                className={cn(
                  "flex-1 px-4 py-2 rounded-md border text-sm font-medium transition-colors",
                  selectedType === "INCOME"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-background hover:bg-accent"
                )}
              >
                Ingreso
              </button>
            </div>
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Frecuencia</label>
            <select
              {...register("frequency")}
              className={cn(
                "w-full px-3 py-2 rounded-md border bg-background",
                "focus:outline-none focus:ring-2 focus:ring-ring"
              )}
            >
              <option value="WEEKLY">Semanal</option>
              <option value="BIWEEKLY">Quincenal</option>
              <option value="MONTHLY">Mensual</option>
              <option value="QUARTERLY">Trimestral</option>
              <option value="SEMI_ANNUALLY">Semestral</option>
              <option value="YEARLY">Anual</option>
            </select>
          </div>

          {/* Next Payment */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Próximo pago <span className="text-destructive">*</span>
            </label>
            <input
              {...register("nextPayment")}
              type="date"
              className={cn(
                "w-full px-3 py-2 rounded-md border bg-background",
                "focus:outline-none focus:ring-2 focus:ring-ring",
                errors.nextPayment && "border-destructive"
              )}
            />
            {errors.nextPayment && (
              <p className="text-sm text-destructive">{errors.nextPayment.message as string}</p>
            )}
          </div>

          {/* Account */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Cuenta</label>
            <select
              {...register("accountId")}
              className={cn(
                "w-full px-3 py-2 rounded-md border bg-background",
                "focus:outline-none focus:ring-2 focus:ring-ring"
              )}
            >
              <option value="">Seleccionar cuenta...</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Categoría</label>
            <select
              {...register("categoryId")}
              className={cn(
                "w-full px-3 py-2 rounded-md border bg-background",
                "focus:outline-none focus:ring-2 focus:ring-ring"
              )}
            >
              <option value="">Seleccionar categoría...</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t flex gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex-1 px-4 py-2 rounded-md border text-sm font-medium hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className={cn(
              "flex-1 px-4 py-2 rounded-md text-sm font-medium",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors"
            )}
          >
            {isSubmitting
              ? "Guardando..."
              : isEditing
              ? "Guardar cambios"
              : "Crear recurrente"}
          </button>
        </div>
      </div>
    </>
  );
}
