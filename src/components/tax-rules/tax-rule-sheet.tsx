"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import { createTaxRuleSchema, formatPercentage } from "@/lib/validations/tax-rule";
import { createTaxRule, updateTaxRule } from "@/actions/tax-rules";
import type { TaxRuleWithRelations } from "@/types/tax-rules";
import { toast } from "sonner";

type TaxRuleSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taxRule: TaxRuleWithRelations | null;
  workspaceId: string;
};

export function TaxRuleSheet({
  open,
  onOpenChange,
  taxRule,
  workspaceId,
}: TaxRuleSheetProps) {
  const isEditing = !!taxRule;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createTaxRuleSchema),
    defaultValues: {
      name: "",
      percentage: "",
    },
  });

  // Reset form when taxRule changes
  useEffect(() => {
    if (taxRule) {
      reset({
        name: taxRule.name,
        percentage: String(Number(taxRule.percentage)),
      });
    } else {
      reset({
        name: "",
        percentage: "",
      });
    }
  }, [taxRule, reset]);

  const onSubmit = async (data: { name: string; percentage: string }) => {
    try {
      if (isEditing && taxRule) {
        const result = await updateTaxRule({
          id: taxRule.id,
          name: data.name,
          percentage: data.percentage,
          workspaceId,
        });

        if (result.success) {
          toast.success("Regla actualizada");
          onOpenChange(false);
        } else {
          toast.error(result.error || "Error al actualizar");
        }
      } else {
        const result = await createTaxRule({
          name: data.name,
          percentage: data.percentage,
          workspaceId,
        });

        if (result.success) {
          toast.success("Regla creada");
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
      <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-card border-l shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">
              {isEditing ? "Editar regla" : "Nueva regla"}
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
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Nombre <span className="text-destructive">*</span>
            </label>
            <input
              {...register("name")}
              type="text"
              placeholder="Ej: IVA, Retención, Impuesto"
              className={cn(
                "w-full px-3 py-2 rounded-md border bg-background",
                "focus:outline-none focus:ring-2 focus:ring-ring",
                errors.name && "border-destructive"
              )}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message as string}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Nombre descriptivo para identificar la regla
            </p>
          </div>

          {/* Percentage */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Porcentaje <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <input
                {...register("percentage")}
                type="text"
                placeholder="19"
                className={cn(
                  "w-full px-3 py-2 rounded-md border bg-background",
                  "focus:outline-none focus:ring-2 focus:ring-ring",
                  "pr-8",
                  errors.percentage && "border-destructive"
                )}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                %
              </span>
            </div>
            {errors.percentage && (
              <p className="text-sm text-destructive">{errors.percentage.message as string}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Porcentaje de impuesto (0-100)
            </p>
          </div>

          {/* Preview */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              Vista previa
            </p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Percent className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  {isEditing ? taxRule.name : "Nombre de la regla"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isEditing ? formatPercentage(Number(taxRule.percentage)) : "0"}%
                </p>
              </div>
            </div>
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
              : "Crear regla"}
          </button>
        </div>
      </div>
    </>
  );
}
