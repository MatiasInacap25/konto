"use client";

import { Pencil, Trash2, Play, Pause, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPercentage } from "@/lib/validations/tax-rule";
import type { TaxRuleWithRelations } from "@/types/tax-rules";

type TaxRuleCardProps = {
  taxRule: TaxRuleWithRelations;
  onEdit: (taxRule: TaxRuleWithRelations) => void;
  onDelete: (taxRule: TaxRuleWithRelations) => void;
  onToggle: (taxRule: TaxRuleWithRelations) => void;
};

export function TaxRuleCard({
  taxRule,
  onEdit,
  onDelete,
  onToggle,
}: TaxRuleCardProps) {
  return (
    <div
      className={cn(
        "group relative bg-card border rounded-xl p-4",
        "transition-all duration-200 ease-out",
        "hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5",
        !taxRule.isActive && "opacity-60 hover:opacity-80"
      )}
    >
      {/* Actions */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(taxRule)}
          className="p-1.5 rounded-md hover:bg-accent transition-colors"
          title="Editar"
        >
          <Pencil className="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          onClick={() => onToggle(taxRule)}
          className="p-1.5 rounded-md hover:bg-accent transition-colors"
          title={taxRule.isActive ? "Desactivar" : "Activar"}
        >
          {taxRule.isActive ? (
            <Pause className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Play className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        <button
          onClick={() => onDelete(taxRule)}
          className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"
          title="Eliminar"
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </button>
      </div>

      {/* Content */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Percent className="w-6 h-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1 pr-16">
          <h3 className="font-semibold truncate">{taxRule.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                taxRule.isActive
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              )}
            >
              {taxRule.isActive ? "Activa" : "Inactiva"}
            </span>
          </div>
        </div>
      </div>

      {/* Percentage */}
      <div className="mt-4">
        <p className="text-2xl font-bold">
          {formatPercentage(Number(taxRule.percentage))}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Porcentaje de impuesto
        </p>
      </div>
    </div>
  );
}
