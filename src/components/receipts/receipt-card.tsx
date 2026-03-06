"use client";

import { useState } from "react";
import {
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trash2,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import type { ReceiptItem } from "@/lib/queries/receipts";

type ReceiptCardProps = {
  receipt: ReceiptItem;
  currency: string;
  onConfirm: (receipt: ReceiptItem) => void;
  onRetry: (receiptId: string) => void;
  onDelete: (receiptId: string) => void;
  isRetrying?: boolean;
  isDeleting?: boolean;
};

type ReceiptStatusKey = "PENDING" | "PROCESSING" | "EXTRACTED" | "COMPLETED" | "FAILED";

const STATUS_CONFIG: Record<ReceiptStatusKey, { label: string; icon: typeof Clock; variant: "default" | "secondary" | "destructive" }> = {
  PENDING: {
    label: "Pendiente",
    icon: Clock,
    variant: "secondary" as const,
  },
  PROCESSING: {
    label: "Analizando...",
    icon: Loader2,
    variant: "secondary" as const,
  },
  EXTRACTED: {
    label: "Datos extraídos",
    icon: Eye,
    variant: "default" as const,
  },
  COMPLETED: {
    label: "Completado",
    icon: CheckCircle2,
    variant: "default" as const,
  },
  FAILED: {
    label: "Error",
    icon: XCircle,
    variant: "destructive" as const,
  },
};

// Cache Intl.NumberFormat instances per currency to avoid re-creating on each render
const formattersCache = new Map<string, Intl.NumberFormat>();

function formatCurrency(amount: number, currency: string) {
  let formatter = formattersCache.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    });
    formattersCache.set(currency, formatter);
  }
  return formatter.format(amount);
}

export function ReceiptCard({
  receipt,
  currency,
  onConfirm,
  onRetry,
  onDelete,
  isRetrying,
  isDeleting,
}: ReceiptCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const config = STATUS_CONFIG[receipt.status];
  const StatusIcon = config.icon;

  const extractedData = receipt.extractedData;

  return (
    <>
      <div
        className={cn(
          "group relative bg-card border rounded-xl overflow-hidden transition-all hover:shadow-md",
          receipt.status === "EXTRACTED" && "ring-1 ring-primary/20"
        )}
      >
        {/* Image preview */}
        <div className="relative h-36 bg-muted overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={receipt.fileUrl}
            alt={receipt.fileName}
            className="w-full h-full object-cover"
          />

          {/* Status badge overlay */}
          <div className="absolute top-2 right-2">
            <Badge
              variant={config.variant}
              className={cn(
                "gap-1",
                receipt.status === "COMPLETED" &&
                  "bg-green-500/90 text-white hover:bg-green-500"
              )}
            >
              <StatusIcon
                className={cn(
                  "w-3 h-3",
                  receipt.status === "PROCESSING" && "animate-spin"
                )}
              />
              {config.label}
            </Badge>
          </div>

          {/* Action menu overlay */}
          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {receipt.status === "EXTRACTED" && (
                  <DropdownMenuItem onClick={() => onConfirm(receipt)}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Confirmar
                  </DropdownMenuItem>
                )}
                {receipt.status === "FAILED" && (
                  <DropdownMenuItem
                    onClick={() => onRetry(receipt.id)}
                    disabled={isRetrying}
                  >
                    <RefreshCw
                      className={cn(
                        "mr-2 h-4 w-4",
                        isRetrying && "animate-spin"
                      )}
                    />
                    Reintentar
                  </DropdownMenuItem>
                )}
                {receipt.status !== "COMPLETED" && (
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={isDeleting}
                    className="text-red-500 focus:text-red-500 focus:bg-red-500/10 [&_svg]:!text-red-500"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          {/* File name */}
          <p className="text-xs text-muted-foreground truncate">
            {receipt.fileName}
          </p>

          {/* Extracted data preview */}
          {extractedData && (
            <div className="space-y-1">
              {extractedData.merchant && (
                <p className="text-sm font-medium truncate">
                  {extractedData.merchant}
                </p>
              )}
              <div className="flex items-center justify-between gap-2">
                {extractedData.amount != null && (
                  <p className="text-sm font-semibold">
                    {formatCurrency(extractedData.amount, currency)}
                  </p>
                )}
                {extractedData.date && (
                  <p className="text-xs text-muted-foreground">
                    {extractedData.date}
                  </p>
                )}
              </div>
              {extractedData.suggestedCategory && (
                <Badge variant="outline" className="text-xs">
                  {extractedData.suggestedCategory}
                </Badge>
              )}
            </div>
          )}

          {/* AI Error */}
          {receipt.status === "FAILED" && receipt.aiError && (
            <p className="text-xs text-red-500 line-clamp-2">
              {receipt.aiError}
            </p>
          )}

          {/* Action button for EXTRACTED status */}
          {receipt.status === "EXTRACTED" && (
            <Button
              size="sm"
              className="w-full mt-2"
              onClick={() => onConfirm(receipt)}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Confirmar transacción
            </Button>
          )}

          {/* Retry button for FAILED status */}
          {receipt.status === "FAILED" && (
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-2"
              onClick={() => onRetry(receipt.id)}
              disabled={isRetrying}
            >
              <RefreshCw
                className={cn("w-4 h-4 mr-1", isRetrying && "animate-spin")}
              />
              {isRetrying ? "Reintentando..." : "Reintentar"}
            </Button>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar recibo?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el recibo &quot;{receipt.fileName}&quot; y su imagen.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(receipt.id)}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Trash2 className="w-4 h-4 mr-1" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
