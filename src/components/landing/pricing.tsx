import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

const plans = [
  {
    name: "Básico",
    price: "Gratis",
    period: "",
    description: "Para empezar a ordenar tus finanzas",
    features: [
      "Registro de ingresos",
      "Registro de gastos",
      "Historial de transacciones",
    ],
    cta: "Empezar gratis",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/mes",
    description: "Para freelancers que quieren control total",
    features: [
      "Categorías personalizadas",
      "Dashboard con gráficos",
      "Filtros avanzados",
      "Exportar a CSV",
      "Etiquetas ilimitadas",
    ],
    cta: "Elegir Pro",
    href: "/register?plan=pro",
    highlighted: true,
  },
  {
    name: "Business",
    price: "$29",
    period: "/mes",
    description: "Para emprendedores con múltiples negocios",
    features: [
      "Multi-negocio (hasta 10)",
      "Reportes por negocio",
      "Exportar PDF y Excel",
      "Comparativas entre negocios",
      "Soporte prioritario",
    ],
    cta: "Elegir Business",
    href: "/register?plan=business",
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="bg-muted/30 py-20 md:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Planes simples, sin sorpresas
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Elige el plan que se adapte a tu situación. Siempre puedes cambiar después.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col ${
                plan.highlighted
                  ? "border-primary shadow-lg shadow-primary/10"
                  : ""
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Recomendado
                  </span>
                </div>
              )}
              <CardHeader className="pb-4">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="mt-2 flex items-baseline">
                  <span className="text-4xl font-bold tracking-tight">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="ml-1 text-muted-foreground">
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                  asChild
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Cada plan incluye todas las características de los planes anteriores.
        </p>
      </div>
    </section>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
