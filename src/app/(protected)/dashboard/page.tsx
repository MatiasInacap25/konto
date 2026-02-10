import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Obtener el perfil del usuario desde Prisma
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
  });

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Bienvenido, {profile?.fullName || user.email}
            </p>
          </div>
          <form action={signOut}>
            <Button variant="outline" type="submit">
              Cerrar sesión
            </Button>
          </form>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Información del usuario</CardTitle>
              <CardDescription>Datos de tu cuenta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm font-medium">Email:</span>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div>
                <span className="text-sm font-medium">Nombre:</span>
                <p className="text-sm text-muted-foreground">
                  {profile?.fullName || "No especificado"}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium">Miembro desde:</span>
                <p className="text-sm text-muted-foreground">
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString("es-AR")
                    : "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Próximamente</CardTitle>
              <CardDescription>Funcionalidades del gestor</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Registro de ingresos/gastos</li>
                <li>• Categorías personalizadas</li>
                <li>• Reportes y gráficos</li>
                <li>• Presupuestos mensuales</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
