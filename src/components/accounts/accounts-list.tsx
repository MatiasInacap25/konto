"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  MoreHorizontal,
  Pencil,
  Archive,
  Trash2,
  RotateCcw,
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
  DropdownMenuSeparator,
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
import { archiveAccount, restoreAccount, permanentlyDeleteAccount } from "@/actions/accounts";
import { toast } from "sonner";

type AccountData = {
  id: string;
  name: string;
  balance: number;
  isBusiness: boolean;
  isSystem: boolean;
  archivedAt: Date | null;
  lastActivityAt: Date | null;
  transactionCount: number;
};

type AccountsListProps = {
  accounts: AccountData[];
  currency: string;
  workspaceId: string;
  onEdit: (account: AccountData) => void;
  showArchived: boolean;
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
  showArchived,
}: AccountsListProps) {
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"archive" | "restore" | "delete" | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const accountToAction = accounts.find((a) => a.id === actionId);
  const isArchived = accountToAction?.archivedAt !== null;

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

  const formatArchivedDate = (date: Date | null) => {
    if (!date) return "";
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: es,
    });
  };

  const handleArchive = async () => {
    if (!actionId) return;
    setIsLoading(true);
    const result = await archiveAccount(actionId, workspaceId);
    setIsLoading(false);
    setActionId(null);
    setActionType(null);

    if (result.success) {
      toast.success("Cuenta archivada");
    } else {
      toast.error(result.error || "Error al archivar");
    }
  };

  const handleRestore = async () => {
    if (!actionId) return;
    setIsLoading(true);
    const result = await restoreAccount(actionId, workspaceId);
    setIsLoading(false);
    setActionId(null);
    setActionType(null);

    if (result.success) {
      toast.success("Cuenta restaurada");
    } else {
      toast.error(result.error || "Error al restaurar");
    }
  };

  const handlePermanentDelete = async () => {
    if (!actionId) return;
    setIsLoading(true);
    const result = await permanentlyDeleteAccount(actionId, workspaceId);
    setIsLoading(false);
    setActionId(null);
    setActionType(null);

    if (result.success) {
      toast.success("Cuenta eliminada permanentemente");
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
        <h3 className="text-base font-semibold mb-1.5">
          {showArchived ? "Sin cuentas archivadas" : "Sin cuentas"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          {showArchived
            ? "No hay cuentas archivadas. Las cuentas archivadas mantienen su historial pero no aparecen en el día a día."
            : "Creá tu primera cuenta para empezar a registrar transacciones y trackear tus balances."}
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
          const isAccountArchived = account.archivedAt !== null;
          const isSystemAccount = account.isSystem;

          return (
            <div
              key={account.id}
              className={cn(
                "group relative flex items-center gap-4 py-4 px-5 -mx-1 rounded-xl",
                "bg-card border border-border/60",
                "hover:border-border hover:shadow-sm transition-all duration-150",
                // Signature: borde izquierdo como indicador de salud
                "before:absolute before:left-0 before:top-4 before:bottom-4 before:w-[3px] before:rounded-full",
                isSystemAccount
                  ? "before:bg-slate-400 dark:before:bg-slate-500"
                  : isAccountArchived
                  ? "before:bg-muted-foreground/50 opacity-75"
                  : isHealthy
                  ? "before:bg-emerald-500 dark:before:bg-emerald-400"
                  : "before:bg-amber-500 dark:before:bg-amber-400",
                isAccountArchived && "bg-muted/30"
              )}
            >
              {/* Icon container */}
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                isAccountArchived ? "bg-muted/60" : "bg-muted/60"
              )}>
                <TypeIcon className={cn(
                  "w-5 h-5",
                  isAccountArchived ? "text-muted-foreground/60" : "text-muted-foreground"
                )} />
              </div>

              {/* Account info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={cn(
                    "text-sm font-semibold truncate",
                    isAccountArchived && "text-muted-foreground"
                  )}>
                    {account.name}
                  </h3>
                  {!isSystemAccount && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-4 font-normal"
                    >
                      {TYPE_LABELS[accountType]}
                    </Badge>
                  )}
                  {account.isBusiness && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-4 font-normal border-primary/30 text-primary"
                    >
                      Negocio
                    </Badge>
                  )}
                  {isSystemAccount && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-4 font-normal border-slate-400 text-slate-600 dark:text-slate-400"
                    >
                      Sistema
                    </Badge>
                  )}
                  {isAccountArchived && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-4 font-normal border-muted-foreground/30 text-muted-foreground"
                    >
                      Archivada
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {account.transactionCount}{" "}
                  {account.transactionCount === 1
                    ? "transacción"
                    : "transacciones"}
                  <span className="before:content-['·'] before:mx-1.5 before:text-border">
                    {isAccountArchived
                      ? `Archivada ${formatArchivedDate(account.archivedAt)}`
                      : formatLastActivity(account.lastActivityAt)}
                  </span>
                </p>
              </div>

              {/* Balance — right aligned, prominent */}
              <div className="text-right flex-shrink-0">
                <p
                  className={cn(
                    "text-lg font-bold tabular-nums font-mono tracking-tight",
                    isAccountArchived
                      ? "text-muted-foreground"
                      : isHealthy
                      ? "text-foreground"
                      : "text-amber-600 dark:text-amber-400"
                  )}
                >
                  {formatCurrency(account.balance)}
                </p>
              </div>

              {/* Actions — hide for system accounts */}
              {!isSystemAccount && (
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
                  <DropdownMenuContent align="end" className="w-44">
                    {!isAccountArchived && (
                      <DropdownMenuItem onClick={() => onEdit(account)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                    )}
                    
                    {!isAccountArchived && (
                      <DropdownMenuItem
                        onClick={() => {
                          setActionId(account.id);
                          setActionType("archive");
                        }}
                        className="text-amber-600 focus:text-amber-600 focus:bg-amber-50 dark:focus:bg-amber-950/20"
                      >
                        <Archive className="mr-2 h-4 w-4" />
                        Archivar
                      </DropdownMenuItem>
                    )}

                    {isAccountArchived && (
                      <DropdownMenuItem
                        onClick={() => {
                          setActionId(account.id);
                          setActionType("restore");
                        }}
                        className="text-green-600 focus:text-green-600 focus:bg-green-50 dark:focus:bg-green-950/20"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Restaurar
                      </DropdownMenuItem>
                    )}

                    {isAccountArchived && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setActionId(account.id);
                            setActionType("delete");
                          }}
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar permanentemente
                          {account.transactionCount > 0 && (
                            <span className="ml-auto text-xs text-muted-foreground">
                              ({account.transactionCount})
                            </span>
                          )}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
      </div>

      {/* Action confirmation dialog */}
      <AlertDialog 
        open={!!actionId} 
        onOpenChange={() => {
          setActionId(null);
          setActionType(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "archive" && "¿Archivar esta cuenta?"}
              {actionType === "restore" && "¿Restaurar esta cuenta?"}
              {actionType === "delete" && "¿Eliminar permanentemente?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "archive" && (
                <>
                  <strong>{accountToAction?.name}</strong> se archivará y no aparecerá 
                  en el dashboard ni en las listas principales. Las transacciones 
                  asociadas se mantienen y podés restaurarla cuando quieras.
                </>
              )}
              {actionType === "restore" && (
                <>
                  <strong>{accountToAction?.name}</strong> volverá a estar activa 
                  y visible en el dashboard y listas.
                </>
              )}
              {actionType === "delete" && (
                <>
                  {accountToAction && accountToAction.transactionCount > 0 ? (
                    <>
                      La cuenta <strong>{accountToAction.name}</strong> será eliminada
                      permanentemente. Sus {accountToAction.transactionCount}{" "}
                      transacciones se transferirán a la cuenta{" "}
                      <strong>"Eliminadas"</strong> para mantener el historial.
                    </>
                  ) : (
                    <>
                      Esta acción no se puede deshacer. La cuenta{" "}
                      <strong>{accountToAction?.name}</strong> será eliminada
                      permanentemente de la base de datos.
                    </>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (actionType === "archive") handleArchive();
                if (actionType === "restore") handleRestore();
                if (actionType === "delete") handlePermanentDelete();
              }}
              disabled={isLoading}
              className={cn(
                actionType === "delete" && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                actionType === "archive" && "bg-amber-600 text-white hover:bg-amber-600/90"
              )}
            >
              {isLoading
                ? "Procesando..."
                : actionType === "archive"
                ? "Archivar"
                : actionType === "restore"
                ? "Restaurar"
                : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
