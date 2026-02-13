import { getWorkspaceTransactionData } from "@/lib/queries";
import { TransactionsClient } from "./transactions-client";

type TransactionsContentProps = {
  userId: string;
  workspaceId?: string;
  filters: {
    type?: string;
    account?: string;
    category?: string;
    from?: string;
    to?: string;
  };
};

export async function TransactionsContent({
  userId,
  workspaceId: workspaceIdParam,
  filters,
}: TransactionsContentProps) {
  // Single optimized query with parallel fetching
  const data = await getWorkspaceTransactionData(userId, workspaceIdParam, filters);

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

  const { workspace, transactions, accounts, categories } = data;

  return (
    <TransactionsClient
      transactions={transactions}
      accounts={accounts}
      categories={categories}
      workspaceId={workspace.id}
      workspaceType={workspace.type}
      currency={workspace.currency}
    />
  );
}
