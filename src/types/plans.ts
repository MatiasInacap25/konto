// Tipos de planes - Espejo del enum de Prisma
// Cuando se corra prisma generate, estos tipos coincidirán con @prisma/client

export type Plan = "STARTER" | "PRO" | "BUSINESS";

export type WorkspaceType = "PERSONAL" | "BUSINESS";

export type TransactionType = "INCOME" | "EXPENSE";

export type TransactionScope = "PERSONAL" | "BUSINESS" | "MIXED";

export type Frequency =
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "SEMI_ANNUALLY"
  | "YEARLY";
