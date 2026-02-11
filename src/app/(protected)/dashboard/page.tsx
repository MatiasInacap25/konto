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

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Obtener el usuario con sus workspaces desde Prisma
  let dbUser = null;
  let totalAccounts = 0;
  let totalBalance = 0;
  let activeSubscriptions = 0;
  let totalTransactions = 0;

  try {
    dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        workspaces: {
          include: {
            accounts: true,
            subscriptions: {
              where: { isActive: true },
            },
            _count: {
              select: {
                transactions: true,
              },
            },
          },
        },
      },
    });

    // Calcular métricas básicas
    if (dbUser?.workspaces) {
      for (const ws of dbUser.workspaces) {
        totalAccounts += ws.accounts.length;
        activeSubscriptions += ws.subscriptions.length;
        totalTransactions += ws._count.transactions;
        for (const acc of ws.accounts) {
          totalBalance += Number(acc.balance);
        }
      }
    }
  } catch (error) {
    // DB no conectada o usuario no existe aún - mostrar estado vacío
    console.log("Could not fetch user data:", error);
  }

  const hasData = totalAccounts > 0 || totalTransactions > 0;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Resumen de tus finanzas personales y de negocio.
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
              ${totalBalance.toLocaleString("es-CL")}
            </div>
            <p className="text-xs text-muted-foreground">
              En {totalAccounts} {totalAccounts === 1 ? "cuenta" : "cuentas"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              $0
            </div>
            <p className="text-xs text-muted-foreground">
              +0% vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos del Mes</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              $0
            </div>
            <p className="text-xs text-muted-foreground">
              +0% vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suscripciones</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeSubscriptions}
            </div>
            <p className="text-xs text-muted-foreground">
              activas este mes
            </p>
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
              Todavía no tenés cuentas ni transacciones registradas. 
              Creá tu primera cuenta para comenzar a trackear tus ingresos y gastos.
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
          {/* Recent transactions placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Transacciones Recientes</CardTitle>
              <CardDescription>
                Últimos movimientos en tus cuentas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {totalTransactions} transacciones registradas
              </p>
            </CardContent>
          </Card>

          {/* Upcoming subscriptions placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Próximos Pagos</CardTitle>
              <CardDescription>
                Suscripciones que vencen pronto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {activeSubscriptions} suscripciones activas
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
