"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Wallet,
  Building2,
  Banknote,
  Smartphone,
  CreditCard,
  TrendingUp,
} from "lucide-react";
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
import { deleteAccount } from "@/actions/accounts";
import { toast } from "sonner";

type AccountData = {
  id: string;
  name: string;
  balance: number;
  isBusiness: boolean;
  lastActivityAt: Date | null;
  transactionCount: number;
};

type AccountsListProps = {
  accounts: AccountData[];
  currency: string;
  workspaceId: string;
  onEdit: (account: AccountData) => void;
};

/**
 * Infer account type from name (heuristic for existing data)
 * We'll add a proper type field to the schema later
 */
function inferAccountType(
  name: string
): "BANK" | "CASH" | "DIGITAL" | "CARD" | "INVESTMENT" {
  const lower = name.toLowerCase();

  if (
    lower.includes("efectivo") ||
    lower.includes("cash") ||
    lower.includes("billetera")
  ) {
    return "CASH";
  }
  if (
    lower.includes("mercado pago") ||
    lower.includes("paypal") ||
    lower.includes("wise") ||
    lower.includes("revolut") ||
    lower.includes("digital")
  ) {
    return "DIGITAL";
  }
  if (
    lower.includes("tarjeta") ||
    lower.includes("card") ||
    lower.includes("crédito") ||
    lower.includes("débito")
  ) {
    return "CARD";
  }
  if (
    lower.includes("inversión") ||
    lower.includes("investment") ||
    lower.includes("fondo") ||
    lower.includes("acciones")
  ) {
    return "INVESTMENT";
  }

  // Default to bank
  return "BANK";
}

const TYPE_ICONS = {
  BANK: Building2,
  CASH: Banknote,
  DIGITAL: Smartphone,
  CARD: CreditCard,
  INVESTMENT: TrendingUp,
};

const TYPE_LABELS = {
  BANK: "Banco",
  CASH: "Efectivo",
  DIGITAL: "Digital",
  CARD: "Tarjeta",
  INVESTMENT: "Inversión",
};

export function AccountsList({
  accounts,
  currency,
  workspaceId,
  onEdit,
}: AccountsListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const accountToDelete = accounts.find((a) => a.id === deleteId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatLastActivity = (date: Date | null) => {
    if (!date) return "Sin actividad";
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: es,
    });
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    const result = await deleteAccount(deleteId, workspaceId);
    setIsDeleting(false);
    setDeleteId(null);

    if (result.success) {
      toast.success("Cuenta eliminada");
    } else {
      toast.error(result.error || "Error al eliminar");
    }
  };

  // Empty state
  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted/80 flex items-center justify-center mb-5">
          <Wallet className="w-7 h-7 text-muted-foreground/70" />
        </div>
        <h3 className="text-base font-semibold mb-1.5">Sin cuentas</h3>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          Creá tu primera cuenta para empezar a registrar transacciones y
          trackear tus balances.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Accounts list — ledger style */}
      <div className="space-y-2">
        {accounts.map((account) => {
          const accountType = inferAccountType(account.name);
          const TypeIcon = TYPE_ICONS[accountType];
          const isHealthy = account.balance > 0;

          return (
            <div
              key={account.id}
              className={cn(
                "group relative flex items-center gap-4 py-4 px-5 -mx-1 rounded-xl",
                "bg-card border border-border/60",
                "hover:border-border hover:shadow-sm transition-all duration-150",
                // Signature: borde izquierdo como indicador de salud
                "before:absolute before:left-0 before:top-4 before:bottom-4 before:w-[3px] before:rounded-full",
                isHealthy
                  ? "before:bg-emerald-500 dark:before:bg-emerald-400"
                  : "before:bg-amber-500 dark:before:bg-amber-400"
              )}
            >
              {/* Icon container */}
              <div className="w-10 h-10 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
                <TypeIcon className="w-5 h-5 text-muted-foreground" />
              </div>

              {/* Account info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    {account.name}
                  </h3>
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4 font-normal"
                  >
                    {TYPE_LABELS[accountType]}
                  </Badge>
                  {account.isBusiness && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-4 font-normal border-primary/30 text-primary"
                    >
                      Negocio
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {account.transactionCount}{" "}
                  {account.transactionCount === 1
                    ? "transacción"
                    : "transacciones"}
                  <span className="before:content-['·'] before:mx-1.5 before:text-border">
                    {formatLastActivity(account.lastActivityAt)}
                  </span>
                </p>
              </div>

              {/* Balance — right aligned, prominent */}
              <div className="text-right flex-shrink-0">
                <p
                  className={cn(
                    "text-lg font-bold tabular-nums font-mono tracking-tight",
                    isHealthy
                      ? "text-foreground"
                      : "text-amber-600 dark:text-amber-400"
                  )}
                >
                  {formatCurrency(account.balance)}
                </p>
              </div>

              {/* Actions */}
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
                  <DropdownMenuItem onClick={() => onEdit(account)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeleteId(account.id)}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    disabled={account.transactionCount > 0}
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

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta cuenta?</AlertDialogTitle>
            <AlertDialogDescription>
              {accountToDelete && accountToDelete.transactionCount > 0 ? (
                <>
                  No se puede eliminar <strong>{accountToDelete.name}</strong>{" "}
                  porque tiene {accountToDelete.transactionCount} transacciones
                  asociadas.
                </>
              ) : (
                <>
                  Esta acción no se puede deshacer. La cuenta{" "}
                  <strong>{accountToDelete?.name}</strong> será eliminada
                  permanentemente.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={
                isDeleting ||
                (accountToDelete && accountToDelete.transactionCount > 0)
              }
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
