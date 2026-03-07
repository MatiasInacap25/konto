"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Target } from "lucide-react";
import { BudgetCard } from "./budget-card";
import { BudgetSheet } from "./budget-sheet";
import { deleteBudget } from "@/actions/budgets";
import { toast } from "sonner";
import type { BudgetProgress } from "@/types/budgets";
import type { Category } from "@prisma/client";

type BudgetsClientProps = {
  budgets: BudgetProgress[];
  workspaceId: string;
  expenseCategories: Category[];
};

type BudgetToEdit = {
  id: string;
  name: string;
  totalAmount: number;
  startDate: Date;
  endDate: Date;
  categoryLimits: {
    categoryId: string;
    amount: number;
  }[];
};

export function BudgetsClient({
  budgets,
  workspaceId,
  expenseCategories,
}: BudgetsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<BudgetToEdit | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);

  // Filter budgets
  const now = new Date();
  const activeBudgets = budgets.filter(
    (b) => b.startDate <= now && b.endDate >= now
  );
  const finishedBudgets = budgets.filter((b) => b.endDate < now);
  const futureBudgets = budgets.filter((b) => b.startDate > now);

  const handleEdit = (budgetId: string) => {
    const budget = budgets.find((b) => b.budgetId === budgetId);
    if (!budget) return;

    setBudgetToEdit({
      id: budget.budgetId,
      name: budget.name,
      totalAmount: Number(budget.totalAmount),
      startDate: budget.startDate,
      endDate: budget.endDate,
      categoryLimits: budget.categoryProgress.map((cp) => ({
        categoryId: cp.categoryId,
        amount: Number(cp.limit),
      })),
    });
    setSheetOpen(true);
  };

  const handleDelete = (budgetId: string) => {
    setBudgetToDelete(budgetId);
  };

  const confirmDelete = () => {
    if (!budgetToDelete) return;

    startTransition(async () => {
      const result = await deleteBudget(budgetToDelete, workspaceId);

      if (result.success) {
        toast.success("Presupuesto eliminado");
        setBudgetToDelete(null);
      } else {
        toast.error(result.error || "Error al eliminar presupuesto");
      }
    });
  };

  const handleSheetClose = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setBudgetToEdit(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Presupuestos</h1>
            <p className="text-muted-foreground mt-1">
              Definí límites de gasto y seguí tu progreso
            </p>
          </div>
          <Button onClick={() => setSheetOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Crear Presupuesto
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">
              Activos {activeBudgets.length > 0 && `(${activeBudgets.length})`}
            </TabsTrigger>
            <TabsTrigger value="finished">
              Finalizados {finishedBudgets.length > 0 && `(${finishedBudgets.length})`}
            </TabsTrigger>
            <TabsTrigger value="all">Todos ({budgets.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeBudgets.length === 0 ? (
              <div className="text-center py-12">
                <Target className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No hay presupuestos activos</h3>
                <p className="text-muted-foreground mt-2">
                  Creá un presupuesto para comenzar a trackear tus gastos
                </p>
                <Button onClick={() => setSheetOpen(true)} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Presupuesto
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activeBudgets.map((budget) => (
                  <BudgetCard
                    key={budget.budgetId}
                    budget={budget}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="finished" className="space-y-4">
            {finishedBudgets.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No hay presupuestos finalizados</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {finishedBudgets.map((budget) => (
                  <BudgetCard
                    key={budget.budgetId}
                    budget={budget}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {budgets.length === 0 ? (
              <div className="text-center py-12">
                <Target className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No hay presupuestos</h3>
                <p className="text-muted-foreground mt-2">
                  Creá un presupuesto para comenzar a trackear tus gastos
                </p>
                <Button onClick={() => setSheetOpen(true)} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Presupuesto
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {budgets.map((budget) => (
                  <BudgetCard
                    key={budget.budgetId}
                    budget={budget}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Budget Sheet */}
      <BudgetSheet
        open={sheetOpen}
        onOpenChange={handleSheetClose}
        budget={budgetToEdit}
        workspaceId={workspaceId}
        expenseCategories={expenseCategories}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!budgetToDelete} onOpenChange={() => setBudgetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar presupuesto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Las transacciones no se borrarán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
