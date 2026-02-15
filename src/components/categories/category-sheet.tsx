"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Tags } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createCategorySchema,
  updateCategorySchema,
  type CreateCategoryFormData,
  type UpdateCategoryData,
} from "@/lib/validations/category";
import { createCategory, updateCategory } from "@/actions/categories";
import { IconPicker } from "./icon-picker";
import type { CategoryWithCount } from "@/types/categories";
import { toast } from "sonner";

type CategorySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryWithCount | null;
};

export function CategorySheet({ open, onOpenChange, category }: CategorySheetProps) {
  const isEditing = !!category;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategoryFormData>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
      icon: "",
      type: "EXPENSE",
    },
  });

  // Reset form when category changes
  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        icon: category.icon || "",
        type: category.type,
      });
    } else {
      reset({
        name: "",
        icon: "",
        type: "EXPENSE",
      });
    }
  }, [category, reset]);

  const selectedIcon = watch("icon");
  const selectedType = watch("type");

  const onSubmit = async (data: CreateCategoryFormData) => {
    try {
      if (isEditing && category) {
        const result = await updateCategory({
          id: category.id,
          name: data.name,
          icon: data.icon || null,
          type: data.type,
        });

        if (result.success) {
          toast.success("Categoría actualizada");
          onOpenChange(false);
        } else {
          toast.error(result.error || "Error al actualizar");
        }
      } else {
        const result = await createCategory({
          name: data.name,
          icon: data.icon || null,
          type: data.type,
        });

        if (result.success) {
          toast.success("Categoría creada");
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
            <Tags className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">
              {isEditing ? "Editar categoría" : "Nueva categoría"}
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
              placeholder="Ej: Supermercado"
              className={cn(
                "w-full px-3 py-2 rounded-md border bg-background",
                "focus:outline-none focus:ring-2 focus:ring-ring",
                errors.name && "border-destructive"
              )}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
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

          {/* Icon */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Ícono</label>
            <IconPicker
              value={selectedIcon || null}
              onChange={(icon) => setValue("icon", icon || "")}
            />
          </div>

          {/* Preview */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              Vista previa
            </p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">{selectedIcon || "📋"}</span>
              </div>
              <div>
                <p className="font-medium">
                  {watch("name") || "Nombre de categoría"}
                </p>
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    selectedType === "INCOME"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-700"
                  )}
                >
                  {selectedType === "INCOME" ? "Ingreso" : "Gasto"}
                </span>
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
              : "Crear categoría"}
          </button>
        </div>
      </div>
    </>
  );
}
