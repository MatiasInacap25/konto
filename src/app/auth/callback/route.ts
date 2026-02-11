import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Verificar si existe el usuario, si no, crearlo (para OAuth)
      const existingUser = await prisma.user.findUnique({
        where: { id: data.user.id },
      });

      if (!existingUser) {
        await prisma.user.create({
          data: {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
            avatarUrl: data.user.user_metadata?.avatar_url || null,
          },
        });
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
