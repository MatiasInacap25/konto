"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Building2, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createWorkspaceSchema,
  SUPPORTED_CURRENCIES,
  type CreateWorkspaceFormData,
} from "@/lib/validations/workspace";
import { createWorkspace, updateWorkspace } from "@/actions/workspaces";
import type { WorkspaceWithCounts } from "@/types/workspaces";
import { toast } from "sonner";

type WorkspaceSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: WorkspaceWithCounts | null;
};

export function WorkspaceSheet({
  open,
  onOpenChange,
  workspace,
}: WorkspaceSheetProps) {
  const isEditing = !!workspace;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateWorkspaceFormData>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: "",
      type: "BUSINESS",
      currency: "CLP",
    },
  });

  const selectedType = watch("type");
  const selectedCurrency = watch("currency");

  useEffect(() => {
    if (open) {
      if (workspace) {
        reset({
          name: workspace.name,
          type: workspace.type,
          currency: workspace.currency,
        });
      } else {
        reset({
          name: "",
          type: "BUSINESS",
          currency: "CLP",
        });
      }
    }
  }, [open, workspace, reset]);

  const onSubmit = async (data: CreateWorkspaceFormData) => {
    try {
      if (isEditing && workspace) {
        const result = await updateWorkspace({
          id: workspace.id,
          name: data.name,
          currency: data.currency,
        });

        if (result.success) {
          toast.success("Workspace actualizado");
          onOpenChange(false);
        } else {
          toast.error(result.error || "Error al actualizar");
        }
      } else {
        const result = await createWorkspace({
          name: data.name,
          type: data.type,
          currency: data.currency,
        });

        if (result.success) {
          toast.success("Workspace creado");
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
            <Building2 className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">
              {isEditing ? "Editar workspace" : "Nuevo workspace"}
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
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto p-4 space-y-6"
        >
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Nombre <span className="text-destructive">*</span>
            </label>
            <input
              {...register("name")}
              type="text"
              placeholder="Ej: Mi Empresa, Freelance"
              className={cn(
                "w-full px-3 py-2 rounded-md border bg-background",
                "focus:outline-none focus:ring-2 focus:ring-ring",
                errors.name && "border-destructive"
              )}
            />
            {errors.name && (
              <p className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Type - only when creating */}
          {!isEditing && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Tipo <span className="text-destructive">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue("type", "PERSONAL")}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    selectedType === "PERSONAL"
                      ? "border-emerald-500 bg-emerald-500/5"
                      : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <Home
                    className={cn(
                      "w-6 h-6",
                      selectedType === "PERSONAL"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm font-medium",
                      selectedType === "PERSONAL"
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    Personal
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue("type", "BUSINESS")}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    selectedType === "BUSINESS"
                      ? "border-blue-500 bg-blue-500/5"
                      : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <Building2
                    className={cn(
                      "w-6 h-6",
                      selectedType === "BUSINESS"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-muted-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm font-medium",
                      selectedType === "BUSINESS"
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    Negocio
                  </span>
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedType === "PERSONAL"
                  ? "Para tus finanzas personales"
                  : "Para tu empresa o emprendimiento"}
              </p>
            </div>
          )}

          {/* Currency */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Moneda <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SUPPORTED_CURRENCIES.map((currency) => (
                <button
                  key={currency.code}
                  type="button"
                  onClick={() => setValue("currency", currency.code)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-lg border transition-all text-center",
                    selectedCurrency === currency.code
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      selectedCurrency === currency.code
                        ? "text-primary"
                        : "text-foreground"
                    )}
                  >
                    {currency.symbol}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {currency.code}
                  </span>
                </button>
              ))}
            </div>
            {errors.currency && (
              <p className="text-sm text-destructive">
                {errors.currency.message}
              </p>
            )}
          </div>

          {/* Info box */}
          {!isEditing && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                Se creará automáticamente una cuenta &quot;Principal&quot; con balance $0 
                en la moneda seleccionada.
              </p>
            </div>
          )}
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
              : "Crear workspace"}
          </button>
        </div>
      </div>
    </>
  );
}
