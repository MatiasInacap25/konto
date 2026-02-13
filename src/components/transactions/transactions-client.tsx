"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionsList } from "./transactions-list";
import { TransactionFilters } from "./transaction-filters";
import type {
  TransactionWithRelations,
  AccountOption,
  CategoryOption,
} from "@/types/transactions";

// Dynamic import - only loads when sheet opens (bundle-dynamic-imports)
const TransactionSheet = dynamic(
  () => import("./transaction-sheet").then((mod) => ({ default: mod.TransactionSheet })),
  { 
    ssr: false,
    loading: () => null, // No loading state, sheet handles its own
  }
);

type TransactionsClientProps = {
  transactions: TransactionWithRelations[];
  accounts: AccountOption[];
  categories: CategoryOption[];
  workspaceId: string;
  workspaceType: "PERSONAL" | "BUSINESS";
  currency: string;
};

export function TransactionsClient({
  transactions,
  accounts,
  categories,
  workspaceId,
  workspaceType,
  currency,
}: TransactionsClientProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<TransactionWithRelations | null>(null);

  // Memoized handlers to prevent unnecessary re-renders
  const handleEdit = useCallback((transaction: TransactionWithRelations) => {
    setEditingTransaction(transaction);
    setSheetOpen(true);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setEditingTransaction(null);
    }
  }, []);

  const handleNewTransaction = useCallback(() => {
    setEditingTransaction(null);
    setSheetOpen(true);
  }, []);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transacciones</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registro de ingresos y gastos
          </p>
        </div>
        <Button onClick={handleNewTransaction} size="sm" className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Nueva transacción
        </Button>
      </header>

      {/* Filters */}
      <TransactionFilters
        accounts={accounts}
        categories={categories}
        workspaceId={workspaceId}
      />

      {/* Divider sutil */}
      <div className="h-px bg-border/50" />

      {/* Transactions list */}
      <TransactionsList
        transactions={transactions}
        currency={currency}
        workspaceId={workspaceId}
        onEdit={handleEdit}
      />

      {/* Sheet for create/edit - dynamically loaded */}
      {sheetOpen && (
        <TransactionSheet
          open={sheetOpen}
          onOpenChange={handleOpenChange}
          transaction={editingTransaction}
          accounts={accounts}
          categories={categories}
          workspaceId={workspaceId}
          workspaceType={workspaceType}
        />
      )}
    </div>
  );
}
