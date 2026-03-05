import { z } from "zod";
import type { Frequency, TransactionType, TransactionScope } from "@prisma/client";

const FREQUENCIES: Frequency[] = [
  "WEEKLY",
  "BIWEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "SEMI_ANNUALLY",
  "YEARLY",
];

const TRANSACTION_TYPES: TransactionType[] = ["INCOME", "EXPENSE"];
const TRANSACTION_SCOPES: TransactionScope[] = ["PERSONAL", "BUSINESS", "MIXED"];

// Client-side form schema
export const createRecurringSchema = z.object({
  name: z
    .string({ message: "El nombre es requerido" })
    .min(1, "El nombre es requerido")
    .max(100, "Máximo 100 caracteres"),
  amount: z
    .string({ message: "El monto es requerido" })
    .min(1, "Ingresá un monto")
    .refine(
      (val) => {
        const num = parseAmount(val);
        return !isNaN(num) && num > 0;
      },
      { message: "Monto inválido" }
    ),
  frequency: z.enum(FREQUENCIES as [Frequency, ...Frequency[]], {
    message: "Seleccioná una frecuencia",
  }),
  nextPayment: z.string({ message: "La fecha es requerida" }),
  type: z.enum(TRANSACTION_TYPES as [TransactionType, ...TransactionType[]], {
    message: "Seleccioná el tipo",
  }),
  scope: z.enum(TRANSACTION_SCOPES as [TransactionScope, ...TransactionScope[]], {
    message: "Seleccioná el alcance",
  }).default("PERSONAL"),
  accountId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
});

// Server-side schema
export const serverRecurringSchema = z.object({
  name: z.string().min(1).max(100),
  amount: z.number().positive(),
  frequency: z.enum(FREQUENCIES),
  nextPayment: z.date(),
  type: z.enum(TRANSACTION_TYPES),
  scope: z.enum(TRANSACTION_SCOPES).default("PERSONAL"),
  accountId: z.string().nullable(),
  categoryId: z.string().nullable(),
  workspaceId: z.string(),
});

export const updateRecurringSchema = serverRecurringSchema.extend({
  id: z.string(),
});

export type CreateRecurringFormData = z.infer<typeof createRecurringSchema>;
export type ServerRecurringData = z.infer<typeof serverRecurringSchema>;
export type UpdateRecurringData = z.infer<typeof updateRecurringSchema>;

/**
 * Parse amount string to number
 * Handles Chilean format (dots as thousands, comma as decimal)
 */
export function parseAmount(value: string): number {
  if (!value || typeof value !== "string") return 0;
  
  // Remove currency symbols and spaces
  let cleaned = value.replace(/[$\s]/g, "");
  
  // Handle Chilean format: 1.234.567,89 -> 1234567.89
  if (cleaned.includes(",")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    // US format or plain number: 1,234,567.89 -> 1234567.89
    cleaned = cleaned.replace(/,/g, "");
  }
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.abs(num);
}

/**
 * Format frequency for display
 */
export function formatFrequency(frequency: Frequency): string {
  const labels: Record<Frequency, string> = {
    WEEKLY: "Semanal",
    BIWEEKLY: "Quincenal",
    MONTHLY: "Mensual",
    QUARTERLY: "Trimestral",
    SEMI_ANNUALLY: "Semestral",
    YEARLY: "Anual",
  };
  return labels[frequency] || frequency;
}
