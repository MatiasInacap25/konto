"use client";

import { X, AlertTriangle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecurringWithRelations } from "@/types/recurrings";

type DeleteConfirmModalProps = {
  recurring: RecurringWithRelations | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
};

export function DeleteConfirmModal({
  recurring,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteConfirmModalProps) {
  if (!recurring) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border rounded-2xl shadow-2xl z-50 overflow-hidden">
        {/* Header */}
        <div className="bg-destructive/5 px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h2 className="font-semibold">Eliminar recurrente</h2>
                <p className="text-sm text-muted-foreground">
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Recurring info */}
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">{recurring.category?.icon || "📋"}</span>
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{recurring.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {recurring.type === "INCOME" ? "Ingreso" : "Gasto"} • {recurring.amount.toLocaleString("es-CL")}
                </p>
              </div>
            </div>
          </div>

          {/* Warning */}
          {(recurring.transactionCount ?? 0) > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                ⚠️ Este recurrente tiene transacciones asociadas. 
                ¿Estás seguro de eliminarlo?
              </p>
            </div>
          )}

          <p className="text-sm text-muted-foreground text-center">
            ¿Querés eliminar <strong>{recurring.name}</strong>?
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-xl text-sm font-medium",
              "flex items-center justify-center gap-2",
              "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors"
            )}
          >
            {isDeleting ? (
              "Eliminando..."
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Eliminar
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
