"use client";

import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoryWithCount } from "@/types/categories";

type DeleteConfirmDialogProps = {
  category: CategoryWithCount | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
};

export function DeleteConfirmDialog({
  category,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteConfirmDialogProps) {
  if (!category) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border rounded-xl shadow-xl z-50 p-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">¿Eliminar categoría?</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Estás por eliminar <strong>{category.name}</strong>. Esta acción no se puede deshacer.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-accent transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Warning */}
        {category.transactionCount > 0 && (
          <div className="mt-4 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">
              ⚠️ Esta categoría tiene {category.transactionCount}{" "}
              {category.transactionCount === 1 ? "transacción" : "transacciones"} asociadas.
              Primero deberás reasignarlas o se mostrará un error.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-md border text-sm font-medium hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={cn(
              "flex-1 px-4 py-2 rounded-md text-sm font-medium",
              "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors"
            )}
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </>
  );
}
