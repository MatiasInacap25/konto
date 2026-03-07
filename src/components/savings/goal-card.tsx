"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertCircle, CheckCircle2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { GoalWithProgress } from "@/types/savings";
import { GOAL_STATUS_LABELS } from "@/types/savings";

type GoalCardProps = {
  goal: GoalWithProgress;
  onContribute: (goalId: string) => void;
  onWithdraw: (goalId: string) => void;
  onEdit: (goalId: string) => void;
  onDelete: (goalId: string) => void;
};

export function GoalCard({
  goal,
  onContribute,
  onWithdraw,
  onEdit,
  onDelete,
}: GoalCardProps) {
  const { progress } = goal;
  const isActive = goal.status === "ACTIVE";
  const isCompleted = goal.status === "COMPLETED";

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(amount);
  };

  return (
    <Card className={isCompleted ? "border-green-500/50 bg-green-50/30 dark:bg-green-950/10" : undefined}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {goal.emoji && <span className="text-2xl">{goal.emoji}</span>}
              <CardTitle className="truncate">{goal.name}</CardTitle>
              <Badge variant={isCompleted ? "default" : "secondary"}>
                {GOAL_STATUS_LABELS[goal.status]}
              </Badge>
            </div>
            {goal.description && (
              <CardDescription className="mt-1.5 line-clamp-2">
                {goal.description}
              </CardDescription>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isActive && (
                <>
                  <DropdownMenuItem onClick={() => onEdit(goal.id)}>
                    Editar meta
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={() => onDelete(goal.id)}
                className="text-red-500 focus:text-red-600"
              >
                Eliminar meta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress amount */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-2xl font-semibold">
              {formatCurrency(goal.currentBalance)}
            </p>
            <p className="text-sm text-muted-foreground">
              de {formatCurrency(goal.targetAmount)}
            </p>
          </div>
          <Progress value={progress.percentage} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {progress.percentage.toFixed(1)}% completado
          </p>
        </div>

        {/* Deadline info */}
        {goal.deadline && (
          <div className="flex items-start gap-2 text-sm">
            {progress.isOnTrack ? (
              <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="size-4 text-amber-600 mt-0.5 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium">
                Plazo: {format(goal.deadline, "d 'de' MMMM yyyy", { locale: es })}
              </p>
              {progress.monthsLeft !== undefined && progress.monthlyNeeded !== undefined && (
                <p className="text-muted-foreground mt-0.5">
                  {progress.monthsLeft > 0 ? (
                    <>
                      Necesitás {formatCurrency(progress.monthlyNeeded)}/mes
                      {!progress.isOnTrack && " — vas atrasado"}
                    </>
                  ) : (
                    "Plazo vencido"
                  )}
                </p>
              )}
            </div>
          </div>
        )}

        {!goal.deadline && isActive && (
          <p className="text-sm text-muted-foreground">Sin plazo definido</p>
        )}

        {/* Completed info */}
        {isCompleted && goal.completedAt && (
          <p className="text-sm text-green-700 dark:text-green-400">
            ✅ Completado el {format(goal.completedAt, "d 'de' MMMM yyyy", { locale: es })}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {isActive && (
            <Button onClick={() => onContribute(goal.id)} size="sm">
              Aportar
            </Button>
          )}
          {goal.currentBalance > 0 && (
            <Button
              onClick={() => onWithdraw(goal.id)}
              variant="outline"
              size="sm"
            >
              Retirar
            </Button>
          )}
          {isCompleted && goal.currentBalance > 0 && (
            <Button
              onClick={() => onWithdraw(goal.id)}
              variant="outline"
              size="sm"
            >
              Retirar todo
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
