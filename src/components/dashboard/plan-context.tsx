"use client";

import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Plan } from "@/types/plans";
import { PLAN_LIMITS, hasFeature, isAtLimit, hasAccessToPlan } from "@/lib/plans";

type PlanContextType = {
  plan: Plan;
  isLoading: boolean;
  error: Error | null;
  limits: typeof PLAN_LIMITS[Plan];
  canAccess: (requiredPlan: Plan) => boolean;
  hasFeatureAccess: (feature: PlanFeature) => boolean;
  isAtPlanLimit: (limitKey: PlanLimitKey, currentCount: number) => boolean;
};

type PlanFeature =
  | "customCategories"
  | "runway"
  | "receipts"
  | "receiptSave"
  | "xmlSupport"
  | "bankConnection";

type PlanLimitKey =
  | "accountsPerWorkspace"
  | "taxRulesPerWorkspace"
  | "recurrings";

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function PlanProvider({
  children,
  initialPlan,
}: {
  children: React.ReactNode;
  initialPlan?: Plan;
}) {
  const [plan, setPlan] = useState<Plan>(initialPlan || "STARTER");
  const [isLoading, setIsLoading] = useState(!initialPlan);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Si ya tenemos plan inicial del servidor, no necesitamos fetching adicional
    // El estado inicial ya tiene el valor correcto
    if (initialPlan) {
      return;
    }

    const supabase = createClient();

    async function fetchUserPlan() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;
        if (!user) throw new Error("No authenticated user");

        const { data: userData, error: dbError } = await supabase
          .from("User")
          .select("plan")
          .eq("id", user.id)
          .single();

        if (dbError) throw dbError;

        setPlan((userData?.plan as Plan) || "STARTER");
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching user plan:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setIsLoading(false);
      }
    }

    fetchUserPlan();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchUserPlan();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialPlan]);

  const value = useMemo<PlanContextType>(() => {
    const limits = PLAN_LIMITS[plan];

    return {
      plan,
      isLoading,
      error,
      limits,
      canAccess: (requiredPlan: Plan) => hasAccessToPlan(plan, requiredPlan),
      hasFeatureAccess: (feature: PlanFeature) => hasFeature(plan, feature),
      isAtPlanLimit: (limitKey: PlanLimitKey, currentCount: number) =>
        isAtLimit(plan, limitKey, currentCount),
    };
  }, [plan, isLoading, error]);

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlanAccess(): PlanContextType {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error("usePlanAccess must be used within a PlanProvider");
  }
  return context;
}

/**
 * Hook legacy para compatibilidad - ahora usa el context
 * @deprecated Usar usePlanAccess directamente desde el context
 */
export function usePlan() {
  const { plan, isLoading, error } = usePlanAccess();
  return { plan, isLoading, error };
}
