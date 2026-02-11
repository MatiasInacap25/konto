"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * Crea el usuario y su workspace Personal por defecto
 */
async function createUserWithPersonalWorkspace(userId: string, email: string, name: string | null) {
  // Crear usuario con su workspace Personal en una transacción
  await prisma.user.create({
    data: {
      id: userId,
      email: email,
      name: name,
      workspaces: {
        create: {
          name: "Personal",
          type: "PERSONAL",
          currency: "CLP",
        },
      },
    },
  });
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Crear el usuario y workspace Personal
  if (data.user) {
    try {
      await createUserWithPersonalWorkspace(
        data.user.id,
        data.user.email!,
        fullName || null
      );
    } catch (e) {
      console.error("Error creating user with workspace:", e);
    }
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = formData.get("redirectTo") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(redirectTo || "/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function signInWithOAuth(provider: "google") {
  const supabase = await createClient();

  // Obtener la URL base de la app (funciona en dev y prod)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      // Redirigir a NUESTRA app, no a Supabase
      redirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }
}
