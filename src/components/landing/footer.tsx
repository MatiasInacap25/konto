import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-background py-12">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">K</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">Konto</span>
          </Link>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6">
            <a
              href="#features"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Características
            </a>
            <a
              href="#pricing"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Precios
            </a>
            <a
              href="#faq"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              FAQ
            </a>
            <a
              href="#contact"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Contacto
            </a>
            <Link
              href="/login"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Iniciar sesión
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Konto. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
