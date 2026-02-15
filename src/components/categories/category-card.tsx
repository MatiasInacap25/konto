"use client";

import { useState } from "react";
import { Pencil, Trash2, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoryWithCount } from "@/types/categories";

type CategoryCardProps = {
  category: CategoryWithCount;
  onEdit: (category: CategoryWithCount) => void;
  onDelete: (category: CategoryWithCount) => void;
};

export function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  return (
    <div
      className={cn(
        "group relative bg-card border rounded-xl p-4",
        "hover:border-primary/30 transition-colors"
      )}
    >
      {/* Actions */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(category)}
          className="p-1.5 rounded-md hover:bg-accent transition-colors"
          title="Editar"
        >
          <Pencil className="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          onClick={() => onDelete(category)}
          className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"
          title="Eliminar"
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </button>
      </div>

      {/* Content */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">{category.icon || "📋"}</span>
        </div>
        <div className="min-w-0 flex-1 pr-16">
          <h3 className="font-semibold truncate">{category.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                category.type === "INCOME"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              )}
            >
              {category.type === "INCOME" ? "Ingreso" : "Gasto"}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Receipt className="w-3 h-3" />
              {category.transactionCount}{" "}
              {category.transactionCount === 1 ? "mov." : "movs."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
