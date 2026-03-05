"use client";

import { useState } from "react";
import { Plus, Calculator, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaxRuleCard } from "./tax-rule-card";
import { TaxRuleSheet } from "./tax-rule-sheet";
import { DeleteConfirmModal } from "./delete-confirm-modal";
import type { TaxRuleWithRelations } from "@/types/tax-rules";
import { deleteTaxRule, toggleTaxRule } from "@/actions/tax-rules";
import { toast } from "sonner";

type TaxRulesClientProps = {
  taxRules: TaxRuleWithRelations[];
  workspaceId: string;
};

export function TaxRulesClient({
  taxRules,
  workspaceId,
}: TaxRulesClientProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTaxRule, setEditingTaxRule] = useState<TaxRuleWithRelations | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTaxRule, setSelectedTaxRule] = useState<TaxRuleWithRelations | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleCreate = () => {
    setEditingTaxRule(null);
    setSheetOpen(true);
  };

  const handleEdit = (taxRule: TaxRuleWithRelations) => {
    setEditingTaxRule(taxRule);
    setSheetOpen(true);
  };

  const handleDelete = (taxRule: TaxRuleWithRelations) => {
    setSelectedTaxRule(taxRule);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTaxRule) return;

    setIsDeleting(true);
    try {
      const result = await deleteTaxRule(selectedTaxRule.id, workspaceId);
      if (result.success) {
        toast.success("Regla eliminada");
        setDeleteModalOpen(false);
        setSelectedTaxRule(null);
      } else {
        toast.error(result.error || "Error al eliminar");
      }
    } catch {
      toast.error("Error inesperado");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggle = async (taxRule: TaxRuleWithRelations) => {
    try {
      const result = await toggleTaxRule(taxRule.id, workspaceId);
      if (result.success) {
        toast.success(taxRule.isActive ? "Regla desactivada" : "Regla activada");
      } else {
        toast.error(result.error || "Error al cambiar estado");
      }
    } catch {
      toast.error("Error inesperado");
    }
  };

  // Filter tax rules
  const filteredTaxRules = taxRules.filter((rule) =>
    rule.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Separate by status
  const activeTaxRules = filteredTaxRules.filter((r) => r.isActive);
  const inactiveTaxRules = filteredTaxRules.filter((r) => !r.isActive);

  const hasTaxRules = taxRules.length > 0;
  const hasFilteredTaxRules = filteredTaxRules.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reglas de Impuestos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configurá reglas para calcular impuestos automáticamente
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
          Nueva regla
        </button>
      </div>

      {/* Filters */}
      {hasTaxRules && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar reglas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "w-full pl-9 pr-4 py-2 rounded-md border bg-background",
                "focus:outline-none focus:ring-2 focus:ring-ring",
                "text-sm"
              )}
            />
          </div>
        </div>
      )}

      {/* Content */}
      {!hasTaxRules ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Calculator className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Sin reglas de impuestos</h2>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Creá reglas de impuestos para calcular automáticamente 
            en tus transacciones.
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
            Crear primera regla
          </button>
        </div>
      ) : !hasFilteredTaxRules ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            No se encontraron reglas con los filtros aplicados
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active tax rules */}
          {activeTaxRules.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                Activas
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeTaxRules.map((taxRule) => (
                  <TaxRuleCard
                    key={taxRule.id}
                    taxRule={taxRule}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Inactive tax rules */}
          {inactiveTaxRules.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                Inactivas
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {inactiveTaxRules.map((taxRule) => (
                  <TaxRuleCard
                    key={taxRule.id}
                    taxRule={taxRule}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Sheet */}
      <TaxRuleSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        taxRule={editingTaxRule}
        workspaceId={workspaceId}
      />

      {/* Delete Modal */}
      <DeleteConfirmModal
        open={deleteModalOpen}
        taxRule={selectedTaxRule}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedTaxRule(null);
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
