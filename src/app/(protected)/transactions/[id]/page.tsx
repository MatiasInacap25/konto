import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTransactionById } from "@/lib/queries";
import { ArrowLeft, Receipt, Calendar, Building2, Tag, Percent, Clock, Hash, User, FileText, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ReceiptAttachment } from "@/components/transactions/receipt-attachment";
import Link from "next/link";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ workspace?: string }>;
};

export default async function TransactionDetailPage({
  params,
  searchParams,
}: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">No autorizado</p>
      </div>
    );
  }

  const { id } = await params;
  const search = await searchParams;

  const transaction = await getTransactionById(id, user.id);

  if (!transaction) {
    notFound();
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: transaction.workspace.currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const typeLabels = {
    INCOME: "Ingreso",
    EXPENSE: "Gasto",
    TRANSFER: "Transferencia",
  };

  const typeColors = {
    INCOME: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    EXPENSE: "bg-muted text-muted-foreground",
    TRANSFER: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link
            href={`/transactions${search.workspace ? `?workspace=${search.workspace}` : ""}`}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Detalle de transacción</h1>
          <p className="text-sm text-muted-foreground">
            Información completa de la transacción
          </p>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-card border rounded-xl overflow-hidden">
        {/* Amount header */}
        <div className={cn(
          "p-6 flex items-center justify-between",
          transaction.type === "INCOME" && "bg-emerald-50 dark:bg-emerald-950/20",
          transaction.type === "TRANSFER" && "bg-blue-50 dark:bg-blue-950/20",
          transaction.type === "EXPENSE" && "bg-muted/30"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              transaction.type === "INCOME" && "bg-emerald-100 dark:bg-emerald-900/50",
              transaction.type === "TRANSFER" && "bg-blue-100 dark:bg-blue-900/50",
              transaction.type === "EXPENSE" && "bg-muted"
            )}>
              <Receipt className={cn(
                "h-6 w-6",
                transaction.type === "INCOME" && "text-emerald-600 dark:text-emerald-400",
                transaction.type === "TRANSFER" && "text-blue-600 dark:text-blue-400",
                transaction.type === "EXPENSE" && "text-muted-foreground"
              )} />
            </div>
            <div>
              <Badge className={cn(typeColors[transaction.type])}>
                {typeLabels[transaction.type]}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className={cn(
              "text-3xl font-bold tabular-nums tracking-tight",
              transaction.type === "INCOME" && "text-emerald-600 dark:text-emerald-400",
              transaction.type === "TRANSFER" && "text-blue-600 dark:text-blue-400",
              transaction.type === "EXPENSE" && "text-foreground"
            )}>
              {transaction.type === "INCOME" ? "+" : transaction.type === "EXPENSE" ? "−" : ""}
              {formatCurrency(Number(transaction.amount))}
            </p>
            <p className="text-sm text-muted-foreground">
              {transaction.workspace.name}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-6">
          {/* Description */}
          {transaction.description && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Descripción
              </label>
              <p className="text-sm">{transaction.description}</p>
            </div>
          )}

          {/* Grid of details */}
          <div className="grid grid-cols-2 gap-6">
            {/* Date */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                Fecha
              </label>
              <p className="text-sm">
                {format(new Date(transaction.date), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
              </p>
            </div>

            {/* Account */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5" />
                Cuenta
              </label>
              <p className="text-sm">{transaction.account.name}</p>
            </div>

            {/* Category */}
            {transaction.category && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5" />
                  Categoría
                </label>
                <div className="flex items-center gap-2">
                  {transaction.category.icon && (
                    <span className="text-lg">{transaction.category.icon}</span>
                  )}
                  <p className="text-sm">{transaction.category.name}</p>
                </div>
              </div>
            )}

            {/* Tax info */}
            {transaction.taxRate != null && transaction.taxAmount != null && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Percent className="h-3.5 w-3.5" />
                  Impuesto
                </label>
                <p className="text-sm">
                  {Number(transaction.taxRate)}% ({formatCurrency(Number(transaction.taxAmount))})
                </p>
              </div>
            )}

            {/* Created by */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                Creado por
              </label>
              <p className="text-sm">
                {transaction.workspace.user.name || transaction.workspace.user.email}
              </p>
            </div>
          </div>

          <Separator />

          {/* Receipt / Facturación */}
          <ReceiptAttachment
            transactionId={transaction.id}
            workspaceId={transaction.workspaceId}
            currentReceiptUrl={transaction.receiptUrl}
            currency={transaction.workspace.currency}
          />

          <Separator />

          {/* Metadata */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Hash className="h-3.5 w-3.5" />
              Información adicional
            </label>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Creada: {format(new Date(transaction.createdAt), "dd/MM/yyyy HH:mm")}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Actualizada: {format(new Date(transaction.updatedAt), "dd/MM/yyyy HH:mm")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
