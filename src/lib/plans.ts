import type { Plan } from "@/types/plans";

export const PLAN_LIMITS = {
  STARTER: {
    // Workspaces
    workspaces: { personal: 1, business: 1 },

    // Límites por workspace
    accountsPerWorkspace: 2,
    taxRulesPerWorkspace: 1,

    // Límites globales
    subscriptions: 5,

    // Features booleanas
    customCategories: false,
    runway: false,
    receipts: false,
    whatsappBot: false,
  },
  PRO: {
    // Workspaces
    workspaces: { personal: 1, business: 3 },

    // Límites por workspace
    accountsPerWorkspace: Infinity,
    taxRulesPerWorkspace: Infinity,

    // Límites globales
    subscriptions: Infinity,

    // Features booleanas
    customCategories: true,
    runway: true,
    receipts: true,
    whatsappBot: false,
  },
  BUSINESS: {
    // Workspaces
    workspaces: { personal: 1, business: 10 },

    // Límites por workspace
    accountsPerWorkspace: Infinity,
    taxRulesPerWorkspace: Infinity,

    // Límites globales
    subscriptions: Infinity,

    // Features booleanas
    customCategories: true,
    runway: true,
    receipts: true,
    whatsappBot: true,
  },
} as const;

export type PlanLimits = (typeof PLAN_LIMITS)[Plan];

/**
 * Jerarquía de planes: BUSINESS > PRO > STARTER
 * Un plan superior tiene acceso a todas las features de los planes inferiores.
 */
const PLAN_HIERARCHY: Record<Plan, number> = {
  STARTER: 0,
  PRO: 1,
  BUSINESS: 2,
};

/**
 * Verifica si un usuario con `userPlan` tiene acceso a una feature que requiere `requiredPlan`
 */
export function hasAccessToPlan(userPlan: Plan, requiredPlan: Plan): boolean {
  return PLAN_HIERARCHY[userPlan] >= PLAN_HIERARCHY[requiredPlan];
}

/**
 * Obtiene los límites del plan actual
 */
export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan];
}

/**
 * Verifica si una feature específica está habilitada para el plan
 */
export function hasFeature(
  plan: Plan,
  feature: "customCategories" | "runway" | "receipts" | "whatsappBot",
): boolean {
  return PLAN_LIMITS[plan][feature];
}

/**
 * Verifica si se ha alcanzado un límite numérico
 */
export function isAtLimit(
  plan: Plan,
  limitKey: "accountsPerWorkspace" | "taxRulesPerWorkspace" | "subscriptions",
  currentCount: number,
): boolean {
  const limit = PLAN_LIMITS[plan][limitKey];
  return limit !== Infinity && currentCount >= limit;
}

/**
 * Obtiene el límite máximo de workspaces de negocio para un plan
 */
export function getMaxBusinessWorkspaces(plan: Plan): number {
  return PLAN_LIMITS[plan].workspaces.business;
}
