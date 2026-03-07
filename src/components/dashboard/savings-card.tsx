"use client";

import { PiggyBank, Target, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { SavingsSummary } from "@/types/savings";

type SavingsCardProps = {
  summary: SavingsSummary;
  workspaceId: string;
  currency: string;
};

export function SavingsCard({ summary, workspaceId, currency }: SavingsCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Metas de Ahorro</CardTitle>
        <PiggyBank className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Total saved */}
          <div>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalSaved)}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Total ahorrado</p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Target className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">
                {summary.activeGoalsCount} activa{summary.activeGoalsCount !== 1 ? "s" : ""}
              </span>
            </div>
            {summary.completedGoalsCount > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-green-600 dark:text-green-400">
                  ✓ {summary.completedGoalsCount} completada{summary.completedGoalsCount !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {/* Next deadline */}
          {summary.nextDeadline && summary.nextDeadlineGoalName && (
            <div className="pt-2 border-t">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Calendar className="size-3.5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Próxima meta:</p>
                  <p className="mt-0.5">
                    {summary.nextDeadlineGoalName} • {format(summary.nextDeadline, "d 'de' MMMM", { locale: es })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CTA */}
          <Link href={`/savings?workspace=${workspaceId}`} passHref>
            <Button variant="outline" size="sm" className="w-full mt-2">
              Ver metas
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
