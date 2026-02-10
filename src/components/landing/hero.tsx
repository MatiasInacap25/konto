import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background subtle gradient */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
      
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Copy */}
          <div className="flex flex-col items-start">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Deja de tener tus finanzas{" "}
              <span className="text-primary">dispersas</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Gestiona tu negocio y tus gastos personales en un solo lugar. 
              Sin hojas de cálculo. Sin contabilidad compleja.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/register">Empieza gratis</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#features">Ver características</a>
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Sin tarjeta de crédito • Configuración en 2 minutos
            </p>
          </div>

          {/* Ilustración abstracta - Dos círculos que se unen (el "switch") */}
          <div className="flex items-center justify-center lg:justify-end">
            <div className="relative h-80 w-80 md:h-96 md:w-96">
              {/* Círculo 1 - Personal (más claro) */}
              <div className="absolute left-0 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 md:h-56 md:w-56" />
              
              {/* Círculo 2 - Negocio (más intenso) */}
              <div className="absolute right-0 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 md:h-56 md:w-56" />
              
              {/* Intersección - donde se unen */}
              <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25 md:h-40 md:w-40" />
              
              {/* Icono central */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-12 w-12 text-primary-foreground md:h-16 md:w-16"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>

              {/* Labels */}
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground md:left-4 md:text-sm">
                Personal
              </span>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground md:right-4 md:text-sm">
                Negocio
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
