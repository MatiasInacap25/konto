"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Plan } from "@/types/plans";
import {
  PLAN_LIMITS,
  hasFeature,
  isAtLimit,
  hasAccessToPlan,
} from "@/lib/plans";

export type PlanState = {
  plan: Plan;
  isLoading: boolean;
  error: Error | null;
};

/**
 * Hook para obtener el plan del usuario actual.
 *
 * Uso:
 * ```tsx
 * const { plan, isLoading } = usePlan();
 * ```
 *
 * Nota: Por defecto retorna STARTER mientras carga para evitar
 * mostrar features premium brevemente.
 */
export function usePlan(): PlanState {
  const [state, setState] = useState<PlanState>({
    plan: "STARTER", // Default seguro mientras carga
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const supabase = createClient();

    async function fetchUserPlan() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;
        if (!user) throw new Error("No authenticated user");

        // Obtener el plan desde la tabla User
        // Usamos la API de Supabase directamente para evitar exponer Prisma al cliente
        const { data: userData, error: dbError } = await supabase
          .from("User")
          .select("plan")
          .eq("id", user.id)
          .single();

        if (dbError) throw dbError;

        setState({
          plan: (userData?.plan as Plan) || "STARTER",
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error fetching user plan:", error);
        setState({
          plan: "STARTER", // Fallback seguro
          isLoading: false,
          error: error instanceof Error ? error : new Error("Unknown error"),
        });
      }
    }

    fetchUserPlan();

    // Suscribirse a cambios de auth (por si el usuario hace upgrade en otra pestaña)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchUserPlan();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return state;
}

/**
 * Hook con helpers adicionales para verificar acceso a features.
 *
 * Uso:
 * ```tsx
 * const { canAccess, hasFeatureAccess, isAtPlanLimit } = usePlanAccess();
 *
 * if (canAccess("PRO")) { ... }
 * if (hasFeatureAccess("runway")) { ... }
 * ```
 */
export function usePlanAccess() {
  const { plan, isLoading, error } = usePlan();

  return {
    plan,
    isLoading,
    error,
    limits: PLAN_LIMITS[plan],

    /** Verifica si el usuario puede acceder a features de un plan específico */
    canAccess: (requiredPlan: Plan) => hasAccessToPlan(plan, requiredPlan),

    /** Verifica si una feature específica está habilitada */
    hasFeatureAccess: (
      feature: "customCategories" | "runway" | "receipts" | "whatsappBot",
    ) => hasFeature(plan, feature),

    /** Verifica si se alcanzó un límite numérico */
    isAtPlanLimit: (
      limitKey:
        | "accountsPerWorkspace"
        | "taxRulesPerWorkspace"
        | "subscriptions",
      currentCount: number,
    ) => isAtLimit(plan, limitKey, currentCount),
  };
}
