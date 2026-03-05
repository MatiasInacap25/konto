"use client";

import { X, CheckCircle, Calendar, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFrequency } from "@/lib/validations/recurring";
import type { RecurringWithRelations } from "@/types/recurrings";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type RegisterPaymentModalProps = {
  open?: boolean;
  recurring: RecurringWithRelations | null;
  currency: string;
  onClose: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
};

export function RegisterPaymentModal({
  open,
  recurring,
  currency,
  onClose,
  onConfirm,
  isProcessing,
}: RegisterPaymentModalProps) {
  if (!open || !recurring) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const isOverdue = new Date(recurring.nextPayment) <= new Date();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border rounded-2xl shadow-2xl z-50 overflow-hidden">
        {/* Header */}
        <div className="bg-primary/5 px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                recurring.type === "INCOME" 
                  ? "bg-emerald-100 dark:bg-emerald-950" 
                  : "bg-amber-100 dark:bg-amber-950"
              )}>
                {recurring.type === "INCOME" ? (
                  <Banknote className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Calendar className="w-5 h-5 text-amber-600" />
                )}
              </div>
              <div>
                <h2 className="font-semibold">Registrar pago</h2>
                <p className="text-sm text-muted-foreground">
                  {recurring.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Amount */}
          <div className="text-center py-4">
            <p className={cn(
              "text-3xl font-bold",
              recurring.type === "INCOME" ? "text-emerald-600" : "text-foreground"
            )}>
              {recurring.type === "INCOME" ? "+" : "−"}
              {formatCurrency(Number(recurring.amount))}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {recurring.type === "INCOME" ? "Ingreso" : "Gasto"} • {formatFrequency(recurring.frequency)}
            </p>
          </div>

          {/* Details */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Fecha del pago</span>
              <span className="text-sm font-medium">
                {format(new Date(recurring.nextPayment), "d 'de' MMMM 'de' yyyy", { locale: es })}
              </span>
            </div>
            {recurring.account && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cuenta</span>
                <span className="text-sm font-medium">{recurring.account.name}</span>
              </div>
            )}
            {recurring.category && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Categoría</span>
                <span className="text-sm font-medium">
                  {recurring.category.icon} {recurring.category.name}
                </span>
              </div>
            )}
          </div>

          {/* Warning for overdue */}
          {isOverdue && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                ⚠️ Este pago está vencido. ¿Querés registrarlo igual?
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-xl text-sm font-medium",
              "flex items-center justify-center gap-2",
              recurring.type === "INCOME"
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors"
            )}
          >
            {isProcessing ? (
              "Procesando..."
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Confirmar pago
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
