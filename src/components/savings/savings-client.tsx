"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoalCard } from "./goal-card";
import { GoalSheet } from "./goal-sheet";
import { ContributeDialog } from "./contribute-dialog";
import { WithdrawDialog } from "./withdraw-dialog";
import type { GoalWithProgress, AccountOption } from "@/types/savings";
import { deleteSavingsGoal } from "@/actions/savings";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type SavingsClientProps = {
  goals: GoalWithProgress[];
  accounts: AccountOption[];
  workspaceId: string;
};

export function SavingsClient({ goals, accounts, workspaceId }: SavingsClientProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [contributeOpen, setContributeOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<GoalWithProgress | null>(null);
  const [returnAccountId, setReturnAccountId] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateNew = () => {
    setSelectedGoal(null);
    setSheetOpen(true);
  };

  const handleEdit = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (goal) {
      setSelectedGoal(goal);
      setSheetOpen(true);
    }
  };

  const handleContribute = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (goal) {
      setSelectedGoal(goal);
      setContributeOpen(true);
    }
  };

  const handleWithdraw = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (goal) {
      setSelectedGoal(goal);
      setWithdrawOpen(true);
    }
  };

  const handleDelete = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (goal) {
      setSelectedGoal(goal);
      setReturnAccountId("");
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!selectedGoal) return;

    const hasBalance = selectedGoal.currentBalance > 0;

    if (hasBalance && !returnAccountId) {
      toast.error("Debés seleccionar una cuenta para devolver los fondos");
      return;
    }

    setIsDeleting(true);

    const result = await deleteSavingsGoal({
      goalId: selectedGoal.id,
      returnAccountId: hasBalance ? returnAccountId : undefined,
    });

    setIsDeleting(false);

    if (result.success) {
      toast.success("Meta eliminada");
      setDeleteDialogOpen(false);
      setSelectedGoal(null);
    } else {
      toast.error(result.error || "Error al eliminar meta");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(amount);
  };

  const activeGoals = goals.filter((g) => g.status === "ACTIVE");
  const completedGoals = goals.filter((g) => g.status === "COMPLETED");

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Metas de Ahorro</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Creá y gestioná tus metas para alcanzar objetivos financieros
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus />
          Nueva meta
        </Button>
      </div>

      {/* Goals list */}
      {goals.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center size-16 rounded-full bg-muted mb-4">
            <Plus className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Sin metas de ahorro</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
            Creá tu primera meta de ahorro para empezar a alcanzar tus objetivos financieros
          </p>
          <Button onClick={handleCreateNew}>
            <Plus />
            Crear primera meta
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active goals */}
          {activeGoals.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                Activas ({activeGoals.length})
              </h2>
              <div className="space-y-4">
                {activeGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onContribute={handleContribute}
                    onWithdraw={handleWithdraw}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed goals */}
          {completedGoals.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                Completadas ({completedGoals.length})
              </h2>
              <div className="space-y-4">
                {completedGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onContribute={handleContribute}
                    onWithdraw={handleWithdraw}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sheet for create/edit */}
      <GoalSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        goal={selectedGoal}
        workspaceId={workspaceId}
      />

      {/* Dialog for contribute */}
      <ContributeDialog
        open={contributeOpen}
        onOpenChange={setContributeOpen}
        goal={selectedGoal}
        accounts={accounts}
      />

      {/* Dialog for withdraw */}
      <WithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        goal={selectedGoal}
        accounts={accounts}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar meta?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedGoal && (
                <>
                  Estás por eliminar <strong>{selectedGoal.name}</strong>. Esta acción no se puede
                  deshacer.
                  {selectedGoal.currentBalance > 0 && (
                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
                      <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                        ⚠️ Esta meta tiene {formatCurrency(selectedGoal.currentBalance)} ahorrados.
                        Debés elegir a qué cuenta devolver los fondos.
                      </p>
                      <Label htmlFor="returnAccount" className="text-sm font-medium">
                        Cuenta de destino
                      </Label>
                      <Select value={returnAccountId} onValueChange={setReturnAccountId}>
                        <SelectTrigger id="returnAccount" className="mt-2">
                          <SelectValue placeholder="Seleccioná una cuenta" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={isDeleting} 
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Eliminando..." : "Eliminar meta"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
