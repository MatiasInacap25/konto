"use client";

import { Pencil, Trash2, Home, Building2, Wallet, Users, RefreshCcw, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUPPORTED_CURRENCIES } from "@/lib/validations/workspace";
import type { WorkspaceWithCounts } from "@/types/workspaces";

type WorkspaceCardProps = {
  workspace: WorkspaceWithCounts;
  onEdit: (workspace: WorkspaceWithCounts) => void;
  onDelete: (workspace: WorkspaceWithCounts) => void;
};

export function WorkspaceCard({
  workspace,
  onEdit,
  onDelete,
}: WorkspaceCardProps) {
  const isPersonal = workspace.type === "PERSONAL";
  const currencyInfo = SUPPORTED_CURRENCIES.find((c) => c.code === workspace.currency);
  const totalEntities =
    workspace._count.accounts +
    workspace._count.members +
    workspace._count.Recurrings +
    workspace._count.taxRules;

  return (
    <div
      className={cn(
        "group relative bg-card border rounded-xl p-5",
        "transition-all duration-200 ease-out",
        "hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5"
      )}
    >
      {/* Actions */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(workspace)}
          className="p-1.5 rounded-md hover:bg-accent transition-colors"
          title="Editar"
        >
          <Pencil className="w-4 h-4 text-muted-foreground" />
        </button>
        {!isPersonal && (
          <button
            onClick={() => onDelete(workspace)}
            className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        )}
      </div>

      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
            isPersonal
              ? "bg-emerald-500/10"
              : "bg-blue-500/10"
          )}
        >
          {isPersonal ? (
            <Home className={cn("w-6 h-6", "text-emerald-600 dark:text-emerald-400")} />
          ) : (
            <Building2 className={cn("w-6 h-6", "text-blue-600 dark:text-blue-400")} />
          )}
        </div>
        <div className="min-w-0 flex-1 pr-16">
          <h3 className="font-semibold truncate">{workspace.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                isPersonal
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              )}
            >
              {isPersonal ? "Personal" : "Negocio"}
            </span>
            <span className="text-xs text-muted-foreground">
              {currencyInfo ? `${currencyInfo.symbol} ${currencyInfo.code}` : workspace.currency}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Wallet className="w-3.5 h-3.5" />
          <span>{workspace._count.accounts} {workspace._count.accounts === 1 ? "cuenta" : "cuentas"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          <span>{workspace._count.members} {workspace._count.members === 1 ? "usuario" : "usuarios"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCcw className="w-3.5 h-3.5" />
          <span>{workspace._count.Recurrings} {workspace._count.Recurrings === 1 ? "recurrente" : "recurrentes"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calculator className="w-3.5 h-3.5" />
          <span>{workspace._count.taxRules} {workspace._count.taxRules === 1 ? "regla" : "reglas"}</span>
        </div>
      </div>

      {/* Footer hint */}
      {totalEntities === 0 && (
        <p className="mt-3 text-xs text-muted-foreground/60 italic">
          Sin datos todavía
        </p>
      )}
    </div>
  );
}
