"use client";

import { useState } from "react";
import { Plus, Tags, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryCard } from "./category-card";
import { CategorySheet } from "./category-sheet";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import type { CategoryWithCount } from "@/types/categories";
import { deleteCategory } from "@/actions/categories";
import { toast } from "sonner";

type CategoriesClientProps = {
  categories: CategoryWithCount[];
};

export function CategoriesClient({ categories }: CategoriesClientProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryWithCount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");

  const handleCreate = () => {
    setEditingCategory(null);
    setSheetOpen(true);
  };

  const handleEdit = (category: CategoryWithCount) => {
    setEditingCategory(category);
    setSheetOpen(true);
  };

  const handleDelete = (category: CategoryWithCount) => {
    setDeletingCategory(category);
  };

  const confirmDelete = async () => {
    if (!deletingCategory) return;

    setIsDeleting(true);
    try {
      const result = await deleteCategory(deletingCategory.id);
      if (result.success) {
        toast.success("Categoría eliminada");
        setDeletingCategory(null);
      } else {
        toast.error(result.error || "Error al eliminar");
      }
    } catch {
      toast.error("Error inesperado");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter categories
  const filteredCategories = categories.filter((cat) => {
    const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "ALL" || cat.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Separate by type
  const incomeCategories = filteredCategories.filter((c) => c.type === "INCOME");
  const expenseCategories = filteredCategories.filter((c) => c.type === "EXPENSE");

  const hasCategories = categories.length > 0;
  const hasFilteredCategories = filteredCategories.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Categorías</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organizá tus transacciones con categorías personalizadas
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
          Nueva categoría
        </button>
      </div>

      {/* Filters */}
      {hasCategories && (
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar categorías..."
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
                {type === "ALL" ? "Todas" : type === "INCOME" ? "Ingresos" : "Gastos"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {!hasCategories ? (
        // Empty state
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Tags className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Sin categorías</h2>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Creá categorías para clasificar tus ingresos y gastos. Te ayudará a entender mejor tus hábitos financieros.
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
            Crear primera categoría
          </button>
        </div>
      ) : !hasFilteredCategories ? (
        // No results
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            No se encontraron categorías con los filtros aplicados
          </p>
        </div>
      ) : (
        // Categories grid
        <div className="space-y-8">
          {/* Expense categories */}
          {(typeFilter === "ALL" || typeFilter === "EXPENSE") && expenseCategories.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                Gastos
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {expenseCategories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Income categories */}
          {(typeFilter === "ALL" || typeFilter === "INCOME") && incomeCategories.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                Ingresos
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {incomeCategories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Sheet */}
      <CategorySheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        category={editingCategory}
      />

      {/* Delete dialog */}
      <DeleteConfirmDialog
        category={deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
