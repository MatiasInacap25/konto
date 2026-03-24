import type { Plan } from "@/types/plans";

/**
 * Nivel de OCR para recibos
 */
export type OCRLevel = "none" | "basic" | "advanced";

export const PLAN_LIMITS = {
  STARTER: {
    // Workspaces
    workspaces: { personal: 1, business: 1 },

    // Límites por workspace
    accountsPerWorkspace: 2,
    taxRulesPerWorkspace: 1,

    // Límites globales
    recurrings: 5,

    // Miembros del workspace (invitados)
    maxMembers: 0, // No puede invitar a nadie

    // Features booleanas
    customCategories: false,
    runway: false,
    receipts: false,
    receiptSave: false,
    receiptOCR: "none" as OCRLevel,
    xmlSupport: false,
    bankConnection: false,
  },
  PRO: {
    // Workspaces
    workspaces: { personal: 1, business: 3 },

    // Límites por workspace
    accountsPerWorkspace: Infinity,
    taxRulesPerWorkspace: Infinity,

    // Límites globales
    recurrings: Infinity,

    // Miembros del workspace
    maxMembers: 0, // No puede invitar (solo él)

    // Features
    customCategories: true,
    runway: true,
    receipts: true,
    receiptSave: false, // Foto crea transacción pero NO guarda imagen
    receiptOCR: "basic" as OCRLevel,
    xmlSupport: false,
    bankConnection: false,
  },
  PRO_PLUS: {
    // Workspaces
    workspaces: { personal: 1, business: 5 },

    // Límites por workspace
    accountsPerWorkspace: Infinity,
    taxRulesPerWorkspace: Infinity,

    // Límites globales
    recurrings: Infinity,

    // Miembros del workspace
    maxMembers: 3, // Puede invitar hasta 3 personas

    // Features
    customCategories: true,
    runway: true,
    receipts: true,
    receiptSave: true, // Guarda imagen enlazada a transacción
    receiptOCR: "basic" as OCRLevel,
    xmlSupport: true, // Boletas electrónicas XML (Chile SII)
    bankConnection: false,
  },
  BUSINESS: {
    // Workspaces
    workspaces: { personal: 1, business: 10 },

    // Límites por workspace
    accountsPerWorkspace: Infinity,
    taxRulesPerWorkspace: Infinity,

    // Límites globales
    recurrings: Infinity,

    // Miembros del workspace
    maxMembers: 10, // Puede invitar hasta 10 personas

    // Features
    customCategories: true,
    runway: true,
    receipts: true,
    receiptSave: true,
    receiptOCR: "advanced" as OCRLevel, // Extrae comercio, items, RUT
    xmlSupport: true,
    bankConnection: true, // Fintoc - bancos y tarjetas
  },
  ENTERPRISE: {
    // Workspaces
    workspaces: { personal: 1, business: Infinity },

    // Límites por workspace
    accountsPerWorkspace: Infinity,
    taxRulesPerWorkspace: Infinity,

    // Límites globales
    recurrings: Infinity,

    // Miembros del workspace
    maxMembers: Infinity,

    // Features
    customCategories: true,
    runway: true,
    receipts: true,
    receiptSave: true,
    receiptOCR: "advanced" as OCRLevel,
    xmlSupport: true,
    bankConnection: true,
  },
} as const;

export type PlanLimits = (typeof PLAN_LIMITS)[Plan];

/**
 * Jerarquía de planes: ENTERPRISE > BUSINESS > PRO_PLUS > PRO > STARTER
 * Un plan superior tiene acceso a todas las features de los planes inferiores.
 */
const PLAN_HIERARCHY: Record<Plan, number> = {
  STARTER: 0,
  PRO: 1,
  PRO_PLUS: 2,
  BUSINESS: 3,
  ENTERPRISE: 4,
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
  feature: "customCategories" | "runway" | "receipts" | "receiptSave" | "xmlSupport" | "bankConnection",
): boolean {
  return PLAN_LIMITS[plan][feature];
}

/**
 * Obtiene el nivel de OCR para el plan
 */
export function getOCRLevel(plan: Plan): OCRLevel {
  return PLAN_LIMITS[plan].receiptOCR;
}

/**
 * Verifica si se ha alcanzado un límite numérico
 */
export function isAtLimit(
  plan: Plan,
  limitKey: "accountsPerWorkspace" | "taxRulesPerWorkspace" | "recurrings",
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
