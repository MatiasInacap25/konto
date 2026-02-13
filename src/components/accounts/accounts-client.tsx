"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountsList } from "./accounts-list";

// Dynamic import for code splitting — sheet only loads when needed
const AccountSheet = dynamic(
  () => import("./account-sheet").then((mod) => ({ default: mod.AccountSheet })),
  { ssr: false }
);

type AccountData = {
  id: string;
  name: string;
  balance: number;
  isBusiness: boolean;
  lastActivityAt: Date | null;
  transactionCount: number;
};

type AccountsClientProps = {
  accounts: AccountData[];
  currency: string;
  workspaceId: string;
  workspaceType: "PERSONAL" | "BUSINESS";
};

export function AccountsClient({
  accounts,
  currency,
  workspaceId,
  workspaceType,
}: AccountsClientProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountData | null>(null);

  const handleCreate = () => {
    setEditingAccount(null);
    setSheetOpen(true);
  };

  const handleEdit = (account: AccountData) => {
    setEditingAccount(account);
    setSheetOpen(true);
  };

  return (
    <>
      {/* Action button */}
      <div className="flex justify-end">
        <Button onClick={handleCreate} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva cuenta
        </Button>
      </div>

      {/* Accounts list */}
      <AccountsList
        accounts={accounts}
        currency={currency}
        workspaceId={workspaceId}
        onEdit={handleEdit}
      />

      {/* Account sheet — lazy loaded */}
      {sheetOpen && (
        <AccountSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          account={editingAccount}
          workspaceId={workspaceId}
          workspaceType={workspaceType}
        />
      )}
    </>
  );
}
