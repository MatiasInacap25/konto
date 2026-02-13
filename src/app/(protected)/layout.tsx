import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use cached auth function (server-cache-react)
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  // Obtener datos del usuario desde Prisma
  let dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      plan: true,
      workspaces: {
        where: { type: "PERSONAL" },
        take: 1,
      },
    },
  });

  // Si no existe el usuario en la DB, lo creamos con su workspace Personal
  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatarUrl: user.user_metadata?.avatar_url || null,
        workspaces: {
          create: {
            name: "Personal",
            type: "PERSONAL",
            currency: "CLP",
          },
        },
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        plan: true,
        workspaces: {
          where: { type: "PERSONAL" },
          take: 1,
        },
      },
    });
  }

  // Si el usuario existe pero no tiene workspace Personal (caso edge), lo creamos
  if (dbUser && dbUser.workspaces.length === 0) {
    await prisma.workspace.create({
      data: {
        userId: dbUser.id,
        name: "Personal",
        type: "PERSONAL",
        currency: "CLP",
      },
    });
  }

  const userData = {
    email: user.email!,
    name: dbUser?.name || user.user_metadata?.full_name || null,
    avatarUrl: dbUser?.avatarUrl || user.user_metadata?.avatar_url || null,
  };

  return (
    <div className="flex h-screen bg-card">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header user={userData} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
