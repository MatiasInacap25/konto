import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

const plans = [
  {
    name: "Starter",
    price: "Gratis",
    period: "",
    description: "Experimentá la magia de tener tu vida personal y tu negocio en un solo lugar",
    features: [
      "1 Personal + 1 Negocio",
      "2 cuentas por workspace",
      "Categorías predeterminadas",
      "Hasta 5 suscripciones activas",
      "1 Regla de ingresos (útil para calcular IVA)",
      "Ingreso manual desde la web",
    ],
    cta: "Empezar gratis",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$15",
    period: "/mes",
    description: "Personalización total y paz mental para tu negocio",
    features: [
      "1 Personal + hasta 3 Negocios",
      "Cuentas ilimitadas",
      "Categorías ilimitadas y personalizables",
      "Suscripciones ilimitadas",
      "Reglas de ingresos ilimitadas (calculá IVA, Ganancias, etc.)",
      "Proyección de flujo de caja (Runway)",
      "Foto de recibo → Crea transacción con IA",
      "Sobres virtuales (Profit First)",
    ],
    cta: "Elegir Pro",
    href: "/register?plan=pro",
    highlighted: true,
  },
  {
    name: "Pro Plus",
    price: "$25",
    period: "/mes",
    description: "Adjuntá archivos y guardalos vinculados a tus transacciones",
    features: [
      "Todo lo de Pro incluido",
      "Foto de recibo → Guarda imagen enlazada",
      "Boletas electrónicas (XML) → Guarda y parsea automáticamente",
      "Hasta 5 negocios",
      "Invita hasta 3 miembros al workspace",
      "Soporte prioritario",
    ],
    cta: "Elegir Pro Plus",
    href: "/register?plan=pro-plus",
    highlighted: false,
  },
  {
    name: "Business",
    price: "$39",
    period: "/mes",
    description: "Integraciones automáticas. Conectá tus bancos y tarjetas",
    features: [
      "Hasta 10 negocios",
      "Conexión con bancos y tarjetas (Fintoc)",
      "Movimientos automáticos en tiempo real",
      "OCR avanzado (extrae comercio, items, RUT)",
      "Invita hasta 10 miembros al workspace",
      "Todo lo de Pro Plus incluido",
      "Soporte prioritario 24/7",
    ],
    cta: "Elegir Business",
    href: "/register?plan=business",
    highlighted: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Para estudios contables y equipos que necesitan más",
    features: [
      "Usuarios ilimitados por organización",
      "Multi-tenancy (múltiples clientes)",
      "API Access para integraciones",
      "SSO (Single Sign-On)",
      "Reportes personalizados",
      "Gerente de cuenta dedicado",
      "SLA garantizado",
    ],
    cta: "Contactanos",
    href: "/contact?plan=enterprise",
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
            Elige el plan que se adapte a tu situación. Siempre puedes cambiar
            después.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
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
          Cada plan incluye todas las características de los planes inferiores.
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

function XIcon({ className }: { className?: string }) {
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
