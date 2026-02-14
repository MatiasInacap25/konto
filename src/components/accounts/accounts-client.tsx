"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Plus, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  isSystem: boolean;
  archivedAt: Date | null;
  lastActivityAt: Date | null;
  transactionCount: number;
};

type AccountsClientProps = {
  accounts: AccountData[];
  currency: string;
  workspaceId: string;
  workspaceType: "PERSONAL" | "BUSINESS";
  archivedCount: number;
  showArchived: boolean;
};

export function AccountsClient({
  accounts,
  currency,
  workspaceId,
  workspaceType,
  archivedCount,
  showArchived: initialShowArchived,
}: AccountsClientProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountData | null>(null);
  const [showArchived, setShowArchived] = useState(initialShowArchived);

  const handleCreate = () => {
    setEditingAccount(null);
    setSheetOpen(true);
  };

  const handleEdit = (account: AccountData) => {
    setEditingAccount(account);
    setSheetOpen(true);
  };

  // Toggle archived view via URL
  const handleToggleArchived = (checked: boolean) => {
    setShowArchived(checked);
    const url = new URL(window.location.href);
    if (checked) {
      url.searchParams.set("archived", "true");
    } else {
      url.searchParams.delete("archived");
    }
    window.history.pushState({}, "", url);
    // Force reload to get fresh data from server
    window.location.href = url.toString();
  };

  return (
    <>
      {/* Action bar */}
      <div className="flex items-center justify-between">
        {/* Archived toggle - always visible */}
        <div className="flex items-center gap-2">
          <Switch
            id="show-archived"
            checked={showArchived}
            onCheckedChange={handleToggleArchived}
          />
          <Label htmlFor="show-archived" className="text-sm text-muted-foreground cursor-pointer">
            <Archive className="inline w-3.5 h-3.5 mr-1" />
            Mostrar archivadas
            {archivedCount > 0 && (
              <span className="ml-1.5 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                {archivedCount}
              </span>
            )}
          </Label>
        </div>
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
        showArchived={showArchived}
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
