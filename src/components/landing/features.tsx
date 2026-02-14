"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export function Features() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">
            Todo lo que necesitás
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Finanzas claras, sin complicaciones
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Diseñado para freelancers y emprendedores que quieren separar lo personal de lo profesional sin perder tiempo.
          </p>
        </div>

        {/* 3 Pilares Principales */}
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          <PillarCard
            icon={<SplitIcon />}
            title="Claridad Total"
            subtitle="Workspaces inteligentes"
            description="Tu vida personal y tu negocio en espacios separados pero conectados. Sabés exactamente cuánto podés gastar en cada área sin mezclar nada."
            highlight="1 Personal + Varios Negocios"
          />
          <PillarCard
            icon={<BotIcon />}
            title="Automatización Real"
            subtitle="Finance Bot por WhatsApp"
            description="Registrá gastos mandando un audio, una foto del recibo o un mensaje de texto. El bot extrae automáticamente el monto, la fecha y sugiere la categoría."
            highlight="OCR + IA incluida"
            isPro={true}
          />
          <PillarCard
            icon={<CrystalBallIcon />}
            title="Proyección Inteligente"
            subtitle="Mirá el futuro"
            description="Runway te dice cuántos meses sobrevive tu negocio. Los Sobres Virtuales separan automáticamente impuestos, ahorro e inversión antes de que gastes."
            highlight="Profit First integrado"
            isPro={true}
          />
        </div>

        {/* Funcionalidades en Detalle */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold">
              Todo lo que incluye
            </h3>
            <p className="mt-2 text-muted-foreground">
              Herramientas pensadas para tu día a día
            </p>
          </div>

          <Tabs defaultValue="workspaces" className="w-full">
            <TabsList className="mx-auto grid w-full max-w-2xl grid-cols-4">
              <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
              <TabsTrigger value="cuentas">Cuentas</TabsTrigger>
              <TabsTrigger value="categorias">Categorías</TabsTrigger>
              <TabsTrigger value="extras">Extras</TabsTrigger>
            </TabsList>

            <TabsContent value="workspaces" className="mt-8">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <FeatureDetail
                  title="Separación total"
                  description="Cada workspace es un mundo aparte: tus finanzas personales no se mezclan con tu negocio, pero podés ver ambos en un dashboard unificado."
                />
                <FeatureDetail
                  title="Multi-negocio"
                  description="¿Tenés un trabajo freelance y una tienda online? Creá un workspace para cada uno y compará su rendimiento."
                />
                <FeatureDetail
                  title="Moneda por workspace"
                  description="Cada negocio puede tener su moneda. Facturás en USD pero tus gastos son en pesos? No hay problema."
                />
              </div>
            </TabsContent>

            <TabsContent value="cuentas" className="mt-8">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <FeatureDetail
                  title="Todos tus bancos"
                  description="Bancos tradicionales, billeteras digitales (Mercado Pago, PayPal), efectivo, tarjetas de crédito y hasta inversiones. Todo en un lugar."
                />
                <FeatureDetail
                  title="Balance en tiempo real"
                  description="Cada transacción actualiza automáticamente el balance de la cuenta. No tenés que hacer cálculos manuales."
                />
                <FeatureDetail
                  title="Transferencias entre cuentas"
                  description="Mové plata de tu banco a efectivo y la app registra automáticamente la salida y la entrada sin duplicar."
                />
                <FeatureDetail
                  title="Cuentas de negocio"
                  description="Marcá cuáles cuentas son del negocio y cuáles son personales. Ideal para separar gastos deductibles."
                />
                <FeatureDetail
                  title="Archivado inteligente"
                  description="¿Cerraste una cuenta bancaria? Archivala. Las transacciones se quedan en el historial pero no molesta en el día a día."
                />
                <FeatureDetail
                  title="Cuenta 'Eliminadas'"
                  description="Si borrás una cuenta con transacciones, se transfieren automáticamente acá. Tu historial nunca se pierde."
                />
              </div>
            </TabsContent>

            <TabsContent value="categorias" className="mt-8">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <FeatureDetail
                  title="Categorías personalizables"
                  description="Crea categorías exactas para tu rubro. No te limitás a opciones genéricas."
                />
                <FeatureDetail
                  title="Iconos y colores"
                  description="Asigná un icono a cada categoría para identificarla rápido en el dashboard."
                />
                <FeatureDetail
                  title="Predeterminadas del sistema"
                  description="Empezá rápido con categorías comunes listas para usar. Podés editarlas o crear las tuyas."
                />
                <FeatureDetail
                  title="Filtros por tipo"
                  description="Filtrá solo ingresos, solo gastos, o ambos. Encontrá lo que buscás en segundos."
                />
                <FeatureDetail
                  title="Análisis por categoría"
                  description="Vé cuánto gastás en cada categoría este mes vs el mes pasado. Detectá fugas de dinero."
                />
              </div>
            </TabsContent>

            <TabsContent value="extras" className="mt-8">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <FeatureDetail
                  title="Suscripciones / Recurrentes"
                  description="Controlá Netflix, el hosting, el gimnasio. La app te avisa cuándo vencen y podés registrar el pago con un click."
                />
                <FeatureDetail
                  title="Reglas de ingresos"
                  description="Configurá automáticamente qué porcentaje de cada ingreso va a impuestos, ahorro, inversión y sueldo. Útil para calcular IVA, Ganancias, etc."
                />
                <FeatureDetail
                  title="Sobres Virtuales (Profit First)"
                  description="Implementá el método Profit First: antes de gastar, separás lo que corresponde a cada rubro."
                />
                <FeatureDetail
                  title="Runway / Proyección"
                  description="Basado en tus gastos mensuales promedio, calculamos cuántos meses podés operar con tu balance actual."
                />
                <FeatureDetail
                  title="Adjuntar recibos"
                  description="Subí la foto de la boleta a cada transacción. Útil para declaración de impuestos o reclamos."
                />
                <FeatureDetail
                  title="Consultas por chat"
                  description="¿Cuánto gasté en comida este mes? El bot te responde al instante."
                  isPro={true}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}

// Pillar Card Component
function PillarCard({
  icon,
  title,
  subtitle,
  description,
  highlight,
  isPro = false,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  highlight: string;
  isPro?: boolean;
}) {
  return (
    <div className="relative rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
      {isPro && (
        <div className="absolute -top-3 right-4">
          <Badge variant="default" className="text-xs">
            Pro/Business
          </Badge>
        </div>
      )}
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="mt-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {subtitle}
        </p>
        <h3 className="mt-1 text-xl font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
      <div className="mt-4 pt-4 border-t">
        <p className="text-sm font-medium text-primary">{highlight}</p>
      </div>
    </div>
  );
}

// Feature Detail Component
function FeatureDetail({
  title,
  description,
  isPro = false,
}: {
  title: string;
  description: string;
  isPro?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-5 hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{title}</h4>
        {isPro && (
          <Badge variant="secondary" className="text-xs">
            Pro
          </Badge>
        )}
      </div>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

// Icons
function SplitIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M16 3h3v3h-3z" />
      <path d="M8 3h3v3H8z" />
      <path d="M5 8h14v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
      <path d="M12 8v13" />
    </svg>
  );
}

function BotIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  );
}

function CrystalBallIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a7 7 0 1 0 10 10" />
      <path d="M12 12v.01" />
      <path d="M8 20l4-4 4 4" />
    </svg>
  );
}
