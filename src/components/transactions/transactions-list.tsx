"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Receipt, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { deleteTransaction } from "@/actions/transactions";
import { toast } from "sonner";
import type { TransactionWithRelations } from "@/types/transactions";

/**
 * Verifica si una fecha es futura (después de hoy)
 */
function isFutureDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate > today;
}

type TransactionsListProps = {
  transactions: TransactionWithRelations[];
  currency: string;
  workspaceId: string;
  onEdit: (transaction: TransactionWithRelations) => void;
};

export function TransactionsList({
  transactions,
  currency,
  workspaceId,
  onEdit,
}: TransactionsListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateHeader = (date: Date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) {
      return "Hoy";
    }
    if (d.toDateString() === yesterday.toDateString()) {
      return "Ayer";
    }
    if (d.toDateString() === tomorrow.toDateString()) {
      return "Mañana";
    }

    return new Intl.DateTimeFormat("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    }).format(d);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    const result = await deleteTransaction(deleteId, workspaceId);
    setIsDeleting(false);
    setDeleteId(null);

    if (result.success) {
      toast.success("Transacción eliminada");
    } else {
      toast.error(result.error || "Error al eliminar");
    }
  };

  // Empty state
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted/80 flex items-center justify-center mb-5">
          <Receipt className="w-7 h-7 text-muted-foreground/70" />
        </div>
        <h3 className="text-base font-semibold mb-1.5">Sin movimientos</h3>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          No hay transacciones que coincidan con los filtros. Probá ajustando el
          rango de fechas o las categorías.
        </p>
      </div>
    );
  }

  // Agrupar transacciones por fecha
  const groupedByDate = transactions.reduce(
    (groups, tx) => {
      const dateKey = new Date(tx.date).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(tx);
      return groups;
    },
    {} as Record<string, TransactionWithRelations[]>
  );

  const sortedDates = Object.keys(groupedByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <>
      <div className="space-y-8">
        {sortedDates.map((dateKey) => {
          const dayTransactions = groupedByDate[dateKey];
          const dayIncome = dayTransactions
            .filter((tx) => tx.type === "INCOME")
            .reduce((sum, tx) => sum + tx.amount, 0);
          const dayExpense = dayTransactions
            .filter((tx) => tx.type === "EXPENSE")
            .reduce((sum, tx) => sum + tx.amount, 0);
          const dayNet = dayIncome - dayExpense;

          return (
            <section key={dateKey}>
              {/* Date header — como encabezado de capítulo */}
              <header className="flex items-baseline justify-between mb-3 pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-foreground/80 capitalize">
                    {formatDateHeader(new Date(dateKey))}
                  </h3>
                  {isFutureDate(new Date(dateKey)) && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal text-muted-foreground border-dashed">
                      <Clock className="h-2.5 w-2.5 mr-1" />
                      Programadas
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs tabular-nums">
                  {dayIncome > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      +{formatCurrency(dayIncome)}
                    </span>
                  )}
                  {dayExpense > 0 && (
                    <span className="text-muted-foreground font-medium">
                      −{formatCurrency(dayExpense)}
                    </span>
                  )}
                  <span
                    className={cn(
                      "font-semibold pl-3 border-l border-border",
                      dayNet > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : dayNet < 0
                          ? "text-rose-600/80 dark:text-rose-400/80"
                          : "text-muted-foreground"
                    )}
                  >
                    {dayNet >= 0 ? "+" : ""}
                    {formatCurrency(dayNet)}
                  </span>
                </div>
              </header>

              {/* Transaction rows — líneas de registro */}
              <div className="space-y-0.5">
                {dayTransactions.map((tx) => {
                  const isFuture = isFutureDate(new Date(tx.date));
                  
                  return (
                    <div
                      key={tx.id}
                      className={cn(
                        "group relative flex items-center gap-4 py-3 px-4 -mx-4 rounded-lg",
                        "hover:bg-muted/40 transition-colors duration-150",
                        // Borde izquierdo como indicador de tipo — la firma
                        "before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-full",
                        tx.type === "INCOME"
                          ? "before:bg-emerald-500 dark:before:bg-emerald-400"
                          : "before:bg-border",
                        // Opacidad reducida para transacciones futuras
                        isFuture && "opacity-60"
                      )}
                    >
                      {/* Descripción principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {tx.description || tx.category?.name || "Sin descripción"}
                          </p>
                          {isFuture && (
                            <Badge 
                              variant="outline" 
                              className="text-[10px] px-1.5 py-0 h-4 font-normal border-dashed flex-shrink-0"
                            >
                              <Clock className="h-2.5 w-2.5 mr-0.5" />
                              Prog.
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {tx.account.name}
                          {tx.category && (
                            <span className="before:content-['·'] before:mx-1.5 before:text-border">
                              {tx.category.name}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Monto — alineado, monoespaciado */}
                      <span
                        className={cn(
                          "text-sm font-semibold tabular-nums whitespace-nowrap font-mono tracking-tight",
                          tx.type === "INCOME"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-foreground"
                        )}
                      >
                        {tx.type === "INCOME" ? "+" : "−"}
                        {formatCurrency(tx.amount)}
                      </span>

                      {/* Acciones — aparecen en hover */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-8 w-8 flex-shrink-0",
                              "opacity-0 group-hover:opacity-100",
                              "focus:opacity-100",
                              "transition-opacity duration-150"
                            )}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Acciones</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => onEdit(tx)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteId(tx.id)}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Dialog de confirmación */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta transacción?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El balance de la cuenta se
              actualizará automáticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
