"use client";

import { X, AlertTriangle, Trash2, Building2, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspaceWithCounts } from "@/types/workspaces";

type DeleteConfirmModalProps = {
  open: boolean;
  workspace: WorkspaceWithCounts | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
};

export function DeleteConfirmModal({
  open,
  workspace,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteConfirmModalProps) {
  if (!open || !workspace) return null;

  const totalData =
    workspace._count.accounts +
    workspace._count.Recurrings +
    workspace._count.taxRules;

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
                <h2 className="font-semibold">Eliminar workspace</h2>
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
          {/* Workspace info */}
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold">{workspace.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {workspace.currency}
                </p>
              </div>
            </div>
          </div>

          {/* Data warning */}
          {totalData > 0 && (
            <div className="bg-destructive/5 rounded-xl p-4 space-y-2">
              <p className="text-sm font-medium text-destructive">
                Se eliminarán permanentemente:
              </p>
              <ul className="space-y-1.5">
                {workspace._count.accounts > 0 && (
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Wallet className="w-3.5 h-3.5" />
                    {workspace._count.accounts} {workspace._count.accounts === 1 ? "cuenta" : "cuentas"}
                  </li>
                )}
                {workspace._count.Recurrings > 0 && (
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    {workspace._count.Recurrings} {workspace._count.Recurrings === 1 ? "recurrente" : "recurrentes"}
                  </li>
                )}
                {workspace._count.taxRules > 0 && (
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    {workspace._count.taxRules} {workspace._count.taxRules === 1 ? "regla de impuesto" : "reglas de impuestos"}
                  </li>
                )}
              </ul>
            </div>
          )}

          <p className="text-sm text-muted-foreground text-center">
            ¿Querés eliminar <strong>{workspace.name}</strong> y todos sus datos?
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
