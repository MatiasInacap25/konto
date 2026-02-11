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
    description: "Experimenta la magia de tener todo en un solo lugar",
    features: [
      "1 Workspace Personal + 1 Negocio",
      "2 cuentas por workspace (Banco + Efectivo)",
      "Categorías predeterminadas",
      "Hasta 5 suscripciones activas",
      "1 regla de impuestos por workspace",
    ],
    limitations: ["Sin bot de WhatsApp"],
    cta: "Empezar gratis",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/mes",
    description: "Para el freelancer que necesita personalización total",
    features: [
      "1 Personal + hasta 3 Negocios",
      "Cuentas ilimitadas",
      "Categorías personalizables",
      "Suscripciones ilimitadas",
      "Reglas de impuestos ilimitadas",
      "Proyección de flujo (Runway)",
      "Adjuntar recibos",
    ],
    limitations: ["Sin bot de WhatsApp"],
    cta: "Elegir Pro",
    href: "/register?plan=pro",
    highlighted: true,
  },
  {
    name: "Business",
    price: "$29",
    period: "/mes",
    description: "Delega la administración en nuestra IA",
    features: [
      "Hasta 10 negocios",
      "Bot de WhatsApp con IA",
      "Registro por audio o texto",
      "Escáner de recibos (OCR)",
      "Consultas por chat",
      "Soporte prioritario",
    ],
    limitations: [],
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
            Elige el plan que se adapte a tu situación. Siempre puedes cambiar
            después.
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
                  {plan.limitations.map((limitation) => (
                    <li key={limitation} className="flex items-start gap-2">
                      <XIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {limitation}
                      </span>
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
