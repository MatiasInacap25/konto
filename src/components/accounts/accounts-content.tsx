import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import { getUser } from "@/lib/auth";
import { getWorkspaceAccountsData } from "@/lib/queries";
import { AccountsClient } from "./accounts-client";

type AccountsContentProps = {
  workspaceId?: string;
  showArchived?: boolean;
};

export async function AccountsContent({ workspaceId, showArchived = false }: AccountsContentProps) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const data = await getWorkspaceAccountsData(user.id, workspaceId, showArchived);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="font-medium mb-1">Workspace no encontrado</h3>
        <p className="text-sm text-muted-foreground">
          No se pudo cargar el workspace seleccionado.
        </p>
      </div>
    );
  }

  const { workspace, accounts, totalBalance, archivedCount } = data;

  // Currency formatter
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: workspace.currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      {/* Page header with total */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cuentas</h1>
          <p className="text-muted-foreground mt-1">
            {workspace.type === "BUSINESS"
              ? `Cuentas de ${workspace.name}`
              : "Administrá tus cuentas y balances"}
          </p>
        </div>

        {/* Total balance card — prominent */}
        <div className="flex items-center gap-4 px-5 py-4 bg-card border rounded-xl">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Balance Total
            </p>
            <p className="text-2xl font-bold tabular-nums font-mono tracking-tight">
              {formatCurrency(totalBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* Accounts list — client component for interactivity */}
      <AccountsClient
        accounts={accounts}
        currency={workspace.currency}
        workspaceId={workspace.id}
        workspaceType={workspace.type}
        archivedCount={archivedCount}
        showArchived={showArchived}
      />
    </div>
  );
}
