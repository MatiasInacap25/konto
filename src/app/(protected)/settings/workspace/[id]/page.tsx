import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home, Building2, Trash2 } from "lucide-react";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WorkspaceMembers } from "../workspace-members";

async function getWorkspace(workspaceId: string) {
  const user = await getUser();
  if (!user) return null;

  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      userId: user.id,
    },
    include: {
      workspace: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return membership?.workspace || null;
}

export default async function WorkspaceEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (id === "new") {
    return <WorkspaceNewPage />;
  }

  const workspace = await getWorkspace(id);

  if (!workspace) {
    redirect("/settings?tab=workspace");
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" asChild className="pl-0">
        <Link href="/settings?tab=workspace">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a workspaces
        </Link>
      </Button>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {workspace.type === "PERSONAL" ? (
            <Home className="h-6 w-6 text-muted-foreground" />
          ) : (
            <Building2 className="h-6 w-6 text-muted-foreground" />
          )}
          <div>
            <h1 className="text-2xl font-bold">{workspace.name}</h1>
            <p className="text-muted-foreground">
              {workspace.type === "PERSONAL" ? "Workspace Personal" : "Workspace de Negocio"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Información del workspace */}
        <Card>
          <CardHeader>
            <CardTitle>Información</CardTitle>
            <CardDescription>Editá los datos del workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={async () => {
              "use server";
              // TODO: Implement update workspace
            }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={workspace.name}
                  placeholder="Mi Negocio"
                />
              </div>

              {workspace.type === "BUSINESS" && (
                <div className="space-y-2">
                  <Label htmlFor="currency">Moneda</Label>
                  <Input
                    id="currency"
                    name="currency"
                    defaultValue={workspace.currency || "CLP"}
                    placeholder="CLP"
                  />
                </div>
              )}

              <Button type="submit">Guardar cambios</Button>
            </form>
          </CardContent>
        </Card>

        {/* Peligro */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Zona de peligro</CardTitle>
            <CardDescription>
              Acciones irreversibles.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {workspace.type === "BUSINESS" && (
              <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/50">
                <div>
                  <p className="font-medium">Eliminar workspace</p>
                  <p className="text-sm text-muted-foreground">
                    Eliminá este workspace y todos sus datos.
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Miembros */}
      {workspace.type === "BUSINESS" && (
        <Card>
          <CardHeader>
            <CardTitle>Miembros</CardTitle>
            <CardDescription>
              Gestiona los miembros de este workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WorkspaceMembers workspaceId={workspace.id} members={workspace.members} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function WorkspaceNewPage() {
  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="pl-0">
        <Link href="/settings?tab=workspace">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a workspaces
        </Link>
      </Button>

      <h1 className="text-2xl font-bold">Crear nuevo workspace</h1>

      <Card>
        <CardHeader>
          <CardTitle>Información del workspace</CardTitle>
          <CardDescription>
            Creá un nuevo workspace para separar tus finanzas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                placeholder="Mi Negocio"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Moneda</Label>
              <Input
                id="currency"
                placeholder="CLP"
                defaultValue="CLP"
              />
            </div>

            <Button type="submit">Crear workspace</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
