import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  console.log("[Auth Callback] Received code:", code ? "yes" : "no");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    console.log("[Auth Callback] Exchange result:", {
      hasUser: !!data?.user,
      error: error?.message,
    });

    if (error) {
      console.error("[Auth Callback] Exchange error:", error);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }

    if (data.user) {
      try {
        // Verificar si existe el usuario
        const existingUser = await prisma.user.findUnique({
          where: { id: data.user.id },
          include: { workspaces: true },
        });

        console.log("[Auth Callback] Existing user:", !!existingUser);

        if (!existingUser) {
          // Crear usuario con workspace Personal
          const newUser = await prisma.user.create({
            data: {
              id: data.user.id,
              email: data.user.email!,
              name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
              avatarUrl: data.user.user_metadata?.avatar_url || null,
              workspaces: {
                create: {
                  name: "Personal",
                  type: "PERSONAL",
                  currency: "CLP",
                },
              },
            },
          });
          console.log("[Auth Callback] Created user with Personal workspace:", newUser.id);
        } else if (existingUser.workspaces.length === 0) {
          // Usuario existe pero no tiene workspaces - crear el Personal
          await prisma.workspace.create({
            data: {
              name: "Personal",
              type: "PERSONAL",
              currency: "CLP",
              userId: existingUser.id,
            },
          });
          console.log("[Auth Callback] Created Personal workspace for existing user");
        }
      } catch (dbError) {
        console.error("[Auth Callback] Database error:", dbError);
        // Continuar de todos modos - el usuario está autenticado en Supabase
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate`);
}
