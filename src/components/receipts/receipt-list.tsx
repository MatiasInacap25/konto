"use client";

import { Receipt } from "lucide-react";
import { ReceiptCard } from "./receipt-card";
import type { ReceiptItem } from "@/lib/queries/receipts";

type ReceiptListProps = {
  receipts: ReceiptItem[];
  currency: string;
  onConfirm: (receipt: ReceiptItem) => void;
  onRetry: (receiptId: string) => void;
  onDelete: (receiptId: string) => void;
  retryingIds: Set<string>;
  deletingIds: Set<string>;
};

export function ReceiptList({
  receipts,
  currency,
  onConfirm,
  onRetry,
  onDelete,
  retryingIds,
  deletingIds,
}: ReceiptListProps) {
  if (receipts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Receipt className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Sin recibos todavía</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Subí una foto de un recibo o boleta y la IA va a extraer los datos
          automáticamente.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {receipts.map((receipt) => (
        <ReceiptCard
          key={receipt.id}
          receipt={receipt}
          currency={currency}
          onConfirm={onConfirm}
          onRetry={onRetry}
          onDelete={onDelete}
          isRetrying={retryingIds.has(receipt.id)}
          isDeleting={deletingIds.has(receipt.id)}
        />
      ))}
    </div>
  );
}
