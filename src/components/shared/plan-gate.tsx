"use client";

import { usePlanAccess } from "@/hooks/use-plan";
import type { Plan } from "@/types/plans";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

type PlanGateProps = {
  /** Plan mínimo requerido para ver el contenido */
  requiredPlan: Plan;
  /** Contenido a mostrar si el usuario tiene acceso */
  children: React.ReactNode;
  /** 
   * Comportamiento cuando el usuario NO tiene acceso:
   * - "hide": No renderiza nada
   * - "blur": Muestra contenido borroso con overlay de upgrade
   * - "lock": Muestra un mensaje de bloqueo
   * - "custom": Renderiza el fallback proporcionado
   */
  behavior?: "hide" | "blur" | "lock" | "custom";
  /** Componente a mostrar si behavior es "custom" */
  fallback?: React.ReactNode;
  /** Clases CSS adicionales para el contenedor */
  className?: string;
};

const PLAN_NAMES: Record<Plan, string> = {
  STARTER: "Starter",
  PRO: "Pro",
  BUSINESS: "Business",
};

/**
 * Componente que bloquea contenido según el plan del usuario.
 * 
 * @example
 * ```tsx
 * // Ocultar completamente si no tiene acceso
 * <PlanGate requiredPlan="PRO" behavior="hide">
 *   <RunwayChart />
 * </PlanGate>
 * 
 * // Mostrar versión borrosa con CTA de upgrade
 * <PlanGate requiredPlan="BUSINESS" behavior="blur">
 *   <WhatsAppBotConfig />
 * </PlanGate>
 * 
 * // Mostrar mensaje de bloqueo
 * <PlanGate requiredPlan="PRO" behavior="lock">
 *   <ReceiptsUploader />
 * </PlanGate>
 * ```
 */
export function PlanGate({
  requiredPlan,
  children,
  behavior = "hide",
  fallback,
  className,
}: PlanGateProps) {
  const { canAccess, isLoading } = usePlanAccess();

  // Mientras carga, no mostramos nada para evitar flash
  if (isLoading) {
    return null;
  }

  const hasAccess = canAccess(requiredPlan);

  // Si tiene acceso, mostrar el contenido normalmente
  if (hasAccess) {
    return <>{children}</>;
  }

  // Comportamientos cuando NO tiene acceso
  switch (behavior) {
    case "hide":
      return null;

    case "blur":
      return (
        <div className={cn("relative", className)}>
          {/* Contenido borroso */}
          <div className="blur-sm pointer-events-none select-none" aria-hidden>
            {children}
          </div>
          {/* Overlay con CTA */}
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
            <UpgradePrompt requiredPlan={requiredPlan} />
          </div>
        </div>
      );

    case "lock":
      return (
        <div className={cn("flex items-center justify-center p-8", className)}>
          <UpgradePrompt requiredPlan={requiredPlan} />
        </div>
      );

    case "custom":
      return <>{fallback}</>;

    default:
      return null;
  }
}

/**
 * Componente interno para mostrar el prompt de upgrade
 */
function UpgradePrompt({ requiredPlan }: { requiredPlan: Plan }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center p-6 rounded-lg bg-card border shadow-sm max-w-sm">
      <div className="p-3 rounded-full bg-muted">
        <Lock className="w-6 h-6 text-muted-foreground" />
      </div>
      <div>
        <h3 className="font-semibold text-lg">
          Función exclusiva de {PLAN_NAMES[requiredPlan]}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Actualizá tu plan para desbloquear esta funcionalidad.
        </p>
      </div>
      <a
        href="/settings/billing"
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
      >
        Ver planes
      </a>
    </div>
  );
}

/**
 * Variante para usar en items de navegación (sidebar, tabs, etc.)
 * Muestra el contenido pero con un indicador de candado.
 */
type PlanGateNavItemProps = {
  requiredPlan: Plan;
  children: React.ReactNode;
  className?: string;
};

export function PlanGateNavItem({
  requiredPlan,
  children,
  className,
}: PlanGateNavItemProps) {
  const { canAccess, isLoading } = usePlanAccess();

  if (isLoading) {
    return <>{children}</>;
  }

  const hasAccess = canAccess(requiredPlan);

  if (hasAccess) {
    return <>{children}</>;
  }

  // No tiene acceso: mostrar con candado
  return (
    <div className={cn("relative flex items-center gap-2 opacity-60", className)}>
      {children}
      <Lock className="w-3 h-3 text-muted-foreground" />
    </div>
  );
}

/**
 * Hook helper para verificar acceso a una feature específica.
 * Útil cuando necesitás lógica condicional sin wrappear en un componente.
 * 
 * @example
 * ```tsx
 * const canAccessRunway = useCanAccessPlan("PRO");
 * 
 * if (canAccessRunway) {
 *   // mostrar botón de runway
 * }
 * ```
 */
export function useCanAccessPlan(requiredPlan: Plan): boolean {
  const { canAccess, isLoading } = usePlanAccess();
  
  // Mientras carga, retornamos false para ser conservadores
  if (isLoading) return false;
  
  return canAccess(requiredPlan);
}
