import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUser } from "@/lib/auth";
import { getWorkspaceWithDashboardData } from "@/lib/queries";
import { RecentTransactions } from "./recent-transactions";
import { UpcomingRecurrings } from "./upcoming-recurrings";
import { TrendChart } from "./trend-chart";
import { InsightsPanel } from "./insights-panel";

type DashboardContentProps = {
  workspaceId?: string;
};

export async function DashboardContent({ workspaceId }: DashboardContentProps) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  // Single optimized query with parallel fetching
  const data = await getWorkspaceWithDashboardData(user.id, workspaceId);

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

  const { workspace, stats, recentTransactions, upcomingRecurrings, monthlyTrend, insights } = data;
  const currency = workspace.currency;
  const hasData = stats.totalAccounts > 0 || stats.totalTransactions > 0;
  const hasChartData = monthlyTrend.length > 0 && monthlyTrend.some(d => d.income > 0 || d.expense > 0);

  // Currency formatter - hoisted outside render for performance
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {workspace.type === "BUSINESS"
            ? `Resumen de ${workspace.name}`
            : "Resumen de tus finanzas personales"}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance Total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              En {stats.totalAccounts}{" "}
              {stats.totalAccounts === 1 ? "cuenta" : "cuentas"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos del Mes
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.monthlyIncome)}
            </div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos del Mes</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.monthlyExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recurrentes</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeRecurrings}</div>
            <p className="text-xs text-muted-foreground">activos</p>
          </CardContent>
        </Card>
      </div>

      {/* Empty state or content */}
      {!hasData ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              ¡Empezá a organizar tus finanzas!
            </h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Todavía no tenés cuentas ni transacciones registradas. Creá tu
              primera cuenta para comenzar a trackear tus ingresos y gastos.
            </p>
            <div className="flex gap-3">
              <a
                href="/accounts"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Crear cuenta
              </a>
              <a
                href="/transactions"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                Agregar transacción
              </a>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Trend Chart */}
          {hasChartData && <TrendChart data={monthlyTrend} currency={currency} />}

          {/* Insights Panel */}
          <InsightsPanel insights={insights} />

          {/* Recent transactions and recurrings */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Transacciones Recientes</CardTitle>
                <CardDescription>
                  Últimos movimientos en tus cuentas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentTransactions
                  transactions={recentTransactions}
                  currency={currency}
                />
              </CardContent>
            </Card>

            {/* Upcoming recurrings */}
            <Card>
              <CardHeader>
                <CardTitle>Próximos Pagos</CardTitle>
                <CardDescription>Recurrentes que vencen pronto</CardDescription>
              </CardHeader>
              <CardContent>
                <UpcomingRecurrings
                  recurrings={upcomingRecurrings}
                  currency={currency}
                  workspaceId={workspace.id}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
