import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared";
import { createClient } from "@/lib/supabase/server";

export async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <div className="flex h-7 px-2 items-center justify-center rounded-md bg-primary">
            <span className="text-sm font-bold text-primary-foreground">Konto</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden items-center gap-6 md:flex">
          <a
            href="#features"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Características
          </a>
          <a
            href="#pricing"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Precios
          </a>
          <a
            href="#faq"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            FAQ
          </a>
          <a
            href="#contact"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Contacto
          </a>
          <a
            href="#suggestions"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Sugerencias
          </a>
        </nav>

        {/* Theme Toggle & Auth Buttons */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {isLoggedIn ? (
            <Button size="sm" asChild>
              <Link href="/dashboard">Ir al Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Iniciar sesión</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Empezar gratis</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
