import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { RecentTransactions } from "./recent-transactions";
import { UpcomingRecurrings } from "./upcoming-recurrings";

type DashboardContentProps = {
  workspaceId?: string;
};

export async function DashboardContent({ workspaceId }: DashboardContentProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Obtener el workspace activo (por ID o el Personal por defecto)
  let workspace = null;
  let totalAccounts = 0;
  let totalBalance = 0;
  let activeRecurrings = 0;
  let totalTransactions = 0;
  let monthlyIncome = 0;
  let monthlyExpenses = 0;
  let recentTransactions: {
    id: string;
    amount: number;
    date: Date;
    description: string | null;
    type: "INCOME" | "EXPENSE";
    category: { name: string; icon: string | null } | null;
    account: { name: string };
  }[] = [];
  let upcomingRecurrings: {
    id: string;
    name: string;
    amount: number;
    nextPayment: Date;
    type: "INCOME" | "EXPENSE";
    frequency: string;
  }[] = [];

  try {
    if (workspaceId) {
      // Buscar workspace específico (verificando que pertenece al usuario)
      workspace = await prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          userId: user.id,
        },
        include: {
          accounts: true,
          Recurrings: {
            where: { isActive: true },
          },
          _count: {
            select: { transactions: true },
          },
        },
      });
    }

    // Si no hay workspace específico o no se encontró, usar el Personal
    if (!workspace) {
      workspace = await prisma.workspace.findFirst({
        where: {
          userId: user.id,
          type: "PERSONAL",
        },
        include: {
          accounts: true,
          Recurrings: {
            where: { isActive: true },
          },
          _count: {
            select: { transactions: true },
          },
        },
      });
    }

    // Calcular métricas del workspace activo
    if (workspace) {
      totalAccounts = workspace.accounts.length;
      activeRecurrings = workspace.Recurrings.length;
      totalTransactions = workspace._count.transactions;

      for (const acc of workspace.accounts) {
        totalBalance += Number(acc.balance);
      }

      // Calcular ingresos y gastos del mes actual
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
      );

      const monthlyTransactions = await prisma.transaction.groupBy({
        by: ["type"],
        where: {
          workspaceId: workspace.id,
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: {
          amount: true,
        },
      });

      for (const group of monthlyTransactions) {
        if (group.type === "INCOME") {
          monthlyIncome = Number(group._sum.amount) || 0;
        } else if (group.type === "EXPENSE") {
          monthlyExpenses = Number(group._sum.amount) || 0;
        }
      }

      // Obtener últimas 5 transacciones
      const rawTransactions = await prisma.transaction.findMany({
        where: { workspaceId: workspace.id },
        orderBy: { date: "desc" },
        take: 5,
        include: {
          category: {
            select: { name: true, icon: true },
          },
          account: {
            select: { name: true },
          },
        },
      });

      recentTransactions = rawTransactions.map((tx) => ({
        id: tx.id,
        amount: Number(tx.amount),
        date: tx.date,
        description: tx.description,
        type: tx.type,
        category: tx.category,
        account: tx.account,
      }));

      // Obtener próximos recurrentes (ordenados por fecha, incluye vencidos)
      const rawRecurrings = await prisma.recurring.findMany({
        where: {
          workspaceId: workspace.id,
          isActive: true,
        },
        orderBy: { nextPayment: "asc" },
        take: 5,
      });

      upcomingRecurrings = rawRecurrings.map((rec) => ({
        id: rec.id,
        name: rec.name,
        amount: Number(rec.amount),
        nextPayment: rec.nextPayment,
        type: rec.type,
        frequency: rec.frequency,
      }));
    }
  } catch (error) {
    console.error("Could not fetch workspace data:", error);
  }

  const hasData = totalAccounts > 0 || totalTransactions > 0;
  const currency = workspace?.currency || "CLP";

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {workspace?.type === "BUSINESS"
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
              {formatCurrency(totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              En {totalAccounts} {totalAccounts === 1 ? "cuenta" : "cuentas"}
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
              {formatCurrency(monthlyIncome)}
            </div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gastos del Mes
            </CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(monthlyExpenses)}
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
            <div className="text-2xl font-bold">{activeRecurrings}</div>
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
                workspaceId={workspace?.id || ""}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
