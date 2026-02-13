import { z } from "zod";
import type { AccountType } from "@/types/accounts";

/**
 * Account validation schemas
 * Shared between client form and server action
 */

const ACCOUNT_TYPES: AccountType[] = ["BANK", "CASH", "DIGITAL", "CARD", "INVESTMENT"];

// Client-side form schema (amount as string for input)
export const createAccountSchema = z.object({
  name: z
    .string({ message: "El nombre es requerido" })
    .min(1, "El nombre es requerido")
    .max(50, "Máximo 50 caracteres"),
  type: z.enum(ACCOUNT_TYPES as [AccountType, ...AccountType[]], {
    message: "Seleccioná un tipo de cuenta",
  }),
  balance: z
    .string({ message: "El balance es requerido" })
    .min(1, "Ingresá un monto")
    .refine(
      (val) => {
        const num = parseAmount(val);
        return !isNaN(num);
      },
      { message: "Monto inválido" }
    ),
  isBusiness: z.boolean(),
});

// Server-side schema (amount as number)
export const serverAccountSchema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum(ACCOUNT_TYPES as [AccountType, ...AccountType[]]),
  balance: z.number().min(0),
  isBusiness: z.boolean(),
  workspaceId: z.string().min(1),
});

export const updateAccountSchema = serverAccountSchema.extend({
  id: z.string().min(1),
});

export type CreateAccountFormData = z.infer<typeof createAccountSchema>;
export type ServerAccountData = z.infer<typeof serverAccountSchema>;
export type UpdateAccountData = z.infer<typeof updateAccountSchema>;

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
