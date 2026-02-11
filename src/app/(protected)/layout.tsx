import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Obtener datos del usuario desde Prisma
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      avatarUrl: true,
      plan: true,
    },
  });

  // Si no existe el usuario en la DB, lo creamos (primera vez después del auth)
  if (!dbUser) {
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatarUrl: user.user_metadata?.avatar_url || null,
      },
    });
  }

  const userData = {
    email: user.email!,
    name: dbUser?.name || user.user_metadata?.full_name || null,
    avatarUrl: dbUser?.avatarUrl || user.user_metadata?.avatar_url || null,
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header user={userData} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
