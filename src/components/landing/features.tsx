"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function Features() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Todo lo que necesitas para tener control
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Diseñado para freelancers y emprendedores que quieren claridad sin complicaciones.
          </p>
        </div>

        <div className="mt-12">
          <Tabs defaultValue="problema" className="w-full">
            <TabsList className="mx-auto grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="problema">El Problema</TabsTrigger>
              <TabsTrigger value="solucion">La Solución</TabsTrigger>
              <TabsTrigger value="como">Cómo Funciona</TabsTrigger>
            </TabsList>

            <TabsContent value="problema" className="mt-8">
              <div className="grid gap-6 md:grid-cols-3">
                <ProblemCard
                  icon={<EyeOffIcon />}
                  title="Ceguera financiera"
                  description="Miras tu cuenta y no sabes cuánto es ganancia real y cuánto es para impuestos o gastos personales."
                />
                <ProblemCard
                  icon={<ChaosIcon />}
                  title="Suscripciones mezcladas"
                  description="¿Ese cargo de $15 fue Netflix o el hosting del sitio web? Imposible saber sin revisar uno por uno."
                />
                <ProblemCard
                  icon={<SpreadsheetIcon />}
                  title="Excel no escala"
                  description="Pasas más tiempo arreglando fórmulas y celdas rotas que facturando a tus clientes."
                />
              </div>
            </TabsContent>

            <TabsContent value="solucion" className="mt-8">
              <div className="grid gap-6 md:grid-cols-3">
                <SolutionCard
                  icon={<SwitchIcon />}
                  title="Categoriza en un clic"
                  description="Cada ingreso o gasto puede tener su categoría. Filtra por tipo y ve exactamente dónde va tu dinero."
                />
                <SolutionCard
                  icon={<ChartIcon />}
                  title="Dashboard visual"
                  description="Gráficos claros que te muestran tus ingresos, gastos y balance. Sin necesidad de interpretar números."
                />
                <SolutionCard
                  icon={<BuildingIcon />}
                  title="Multi-negocio"
                  description="¿Tienes varios negocios? Separa las finanzas de cada uno y compara su rendimiento."
                />
              </div>
            </TabsContent>

            <TabsContent value="como" className="mt-8">
              <div className="grid gap-8 md:grid-cols-3">
                <StepCard
                  step={1}
                  title="Registra"
                  description="Ingresa tus ingresos y gastos en segundos. Solo monto, descripción y listo."
                />
                <StepCard
                  step={2}
                  title="Organiza"
                  description="Asigna categorías y etiquetas para encontrar cualquier transacción al instante."
                />
                <StepCard
                  step={3}
                  title="Visualiza"
                  description="Mira tu salud financiera en el dashboard. Toma decisiones con datos reales."
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}

// Problem Card
function ProblemCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

// Solution Card
function SolutionCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

// Step Card
function StepCard({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
        {step}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

// Icons
function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

function ChaosIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function SpreadsheetIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <line x1="3" x2="21" y1="9" y2="9" />
      <line x1="3" x2="21" y1="15" y2="15" />
      <line x1="9" x2="9" y1="3" y2="21" />
      <line x1="15" x2="15" y1="3" y2="21" />
    </svg>
  );
}

function SwitchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M8 3L4 7l4 4" />
      <path d="M4 7h16" />
      <path d="m16 21 4-4-4-4" />
      <path d="M20 17H4" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  );
}
