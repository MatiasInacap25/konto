"use client";

import { useState } from "react";
import { Plus, CreditCard, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { RecurringCard } from "./recurring-card";
import { RecurringSheet } from "./recurring-sheet";
import type { RecurringWithRelations } from "@/types/recurrings";
import type { CategoryOption } from "@/types/transactions";
import type { AccountOption } from "@/types/accounts";
import { deleteRecurring, toggleRecurring, registerRecurringPayment } from "@/actions/recurrings";
import { toast } from "sonner";

type RecurringClientProps = {
  recurrings: RecurringWithRelations[];
  workspaceId: string;
  currency: string;
  accounts: AccountOption[];
  categories: CategoryOption[];
};

export function RecurringClient({
  recurrings,
  workspaceId,
  currency,
  accounts,
  categories,
}: RecurringClientProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringWithRelations | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = () => {
    setEditingRecurring(null);
    setSheetOpen(true);
  };

  const handleEdit = (recurring: RecurringWithRelations) => {
    setEditingRecurring(recurring);
    setSheetOpen(true);
  };

  const handleDelete = async (recurring: RecurringWithRelations) => {
    const confirmed = confirm(`¿Estás seguro de eliminar "${recurring.name}"?`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const result = await deleteRecurring(recurring.id, workspaceId);
      if (result.success) {
        toast.success("Recurrente eliminado");
      } else {
        toast.error(result.error || "Error al eliminar");
      }
    } catch {
      toast.error("Error inesperado");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggle = async (recurring: RecurringWithRelations) => {
    try {
      const result = await toggleRecurring(recurring.id, workspaceId);
      if (result.success) {
        toast.success(recurring.isActive ? "Recurrente pausado" : "Recurrente activado");
      } else {
        toast.error(result.error || "Error al cambiar estado");
      }
    } catch {
      toast.error("Error inesperado");
    }
  };

  const handleRegisterPayment = async (recurring: RecurringWithRelations) => {
    const confirmed = confirm(`¿Registrar pago de "${recurring.name}" por ${currency} ${Number(recurring.amount).toLocaleString("es-CL")}?`);
    if (!confirmed) return;

    try {
      const result = await registerRecurringPayment(recurring.id, workspaceId);
      if (result.success) {
        toast.success("Pago registrado");
      } else {
        toast.error(result.error || "Error al registrar pago");
      }
    } catch {
      toast.error("Error inesperado");
    }
  };

  // Filter recurrings
  const filteredRecurrings = recurrings.filter((rec) => {
    const matchesSearch = rec.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "ALL" || rec.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Separate by type and status
  const activeRecurrings = filteredRecurrings.filter((r) => r.isActive);
  const pausedRecurrings = filteredRecurrings.filter((r) => !r.isActive);

  const hasRecurrings = recurrings.length > 0;
  const hasFilteredRecurrings = filteredRecurrings.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Recurrentes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Controlá tus pagos e ingresos recurrentes
          </p>
        </div>
        <button
          onClick={handleCreate}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-md",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            "text-sm font-medium transition-colors"
          )}
        >
          <Plus className="w-4 h-4" />
          Nuevo recurrente
        </button>
      </div>

      {/* Filters */}
      {hasRecurrings && (
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar recurrentes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "w-full pl-9 pr-4 py-2 rounded-md border bg-background",
                "focus:outline-none focus:ring-2 focus:ring-ring",
                "text-sm"
              )}
            />
          </div>

          {/* Type filter */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            {(["ALL", "INCOME", "EXPENSE"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  typeFilter === type
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {type === "ALL" ? "Todos" : type === "INCOME" ? "Ingresos" : "Gastos"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {!hasRecurrings ? (
        // Empty state
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <CreditCard className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Sin recurrentes</h2>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Registrá tus pagos e ingresos recurrentes para llevar un mejor control de tus finanzas.
          </p>
          <button
            onClick={handleCreate}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-md",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "text-sm font-medium transition-colors"
            )}
          >
            <Plus className="w-4 h-4" />
            Crear primer recurrente
          </button>
        </div>
      ) : !hasFilteredRecurrings ? (
        // No results
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            No se encontraron recurrentes con los filtros aplicados
          </p>
        </div>
      ) : (
        // Recurrings grid
        <div className="space-y-8">
          {/* Active recurrings */}
          {(typeFilter === "ALL" || typeFilter === "EXPENSE") && activeRecurrings.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                Activos
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeRecurrings.map((recurring) => (
                  <RecurringCard
                    key={recurring.id}
                    recurring={recurring}
                    currency={currency}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                    onRegisterPayment={handleRegisterPayment}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Paused recurrings */}
          {pausedRecurrings.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                Pausados
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pausedRecurrings.map((recurring) => (
                  <RecurringCard
                    key={recurring.id}
                    recurring={recurring}
                    currency={currency}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                    onRegisterPayment={handleRegisterPayment}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Sheet */}
      <RecurringSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        recurring={editingRecurring}
        workspaceId={workspaceId}
        currency={currency}
        accounts={accounts}
        categories={categories}
      />
    </div>
  );
}
