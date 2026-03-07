import { z } from "zod";

/**
 * Savings goal validation schemas
 * Shared between client form and server action
 */

// Client-side form schema (targetAmount as string for input)
export const createGoalSchema = z.object({
  name: z
    .string({ message: "El nombre es requerido" })
    .min(1, "El nombre es requerido")
    .max(100, "Máximo 100 caracteres"),
  emoji: z.string().optional(),
  description: z.string().max(500, "Máximo 500 caracteres").optional(),
  targetAmount: z
    .string({ message: "El monto objetivo es requerido" })
    .min(1, "Ingresá un monto")
    .refine(
      (val) => {
        const num = parseAmount(val);
        return !isNaN(num) && num > 0;
      },
      { message: "El monto debe ser mayor a 0" }
    ),
  deadline: z.date().optional(),
});

// Server-side schema (targetAmount as number)
export const serverGoalSchema = z.object({
  name: z.string().min(1).max(100),
  emoji: z.string().optional(),
  description: z.string().max(500).optional(),
  targetAmount: z.number().positive("El monto debe ser mayor a 0"),
  deadline: z.date().optional(),
  workspaceId: z.string().min(1),
});

export const updateGoalSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  emoji: z.string().optional(),
  description: z.string().max(500).optional(),
  targetAmount: z.number().positive().optional(),
  deadline: z.date().optional(),
});

// Contribute to goal
export const contributeSchema = z.object({
  goalId: z.string().min(1),
  fromAccountId: z.string().min(1, "Seleccioná una cuenta"),
  amount: z
    .string({ message: "El monto es requerido" })
    .min(1, "Ingresá un monto")
    .refine(
      (val) => {
        const num = parseAmount(val);
        return !isNaN(num) && num > 0;
      },
      { message: "El monto debe ser mayor a 0" }
    ),
  date: z.date().optional(),
});

export const serverContributeSchema = z.object({
  goalId: z.string().min(1),
  fromAccountId: z.string().min(1),
  amount: z.number().positive(),
  date: z.date(),
});

// Withdraw from goal
export const withdrawSchema = z.object({
  goalId: z.string().min(1),
  toAccountId: z.string().min(1, "Seleccioná una cuenta"),
  amount: z
    .string({ message: "El monto es requerido" })
    .min(1, "Ingresá un monto")
    .refine(
      (val) => {
        const num = parseAmount(val);
        return !isNaN(num) && num > 0;
      },
      { message: "El monto debe ser mayor a 0" }
    ),
  date: z.date().optional(),
});

export const serverWithdrawSchema = z.object({
  goalId: z.string().min(1),
  toAccountId: z.string().min(1),
  amount: z.number().positive(),
  date: z.date(),
});

// Delete goal
export const deleteGoalSchema = z.object({
  goalId: z.string().min(1),
  returnAccountId: z.string().optional(), // Required if balance > 0
});

// Type exports
export type CreateGoalFormData = z.infer<typeof createGoalSchema>;
export type ServerGoalData = z.infer<typeof serverGoalSchema>;
export type UpdateGoalData = z.infer<typeof updateGoalSchema>;
export type ContributeFormData = z.infer<typeof contributeSchema>;
export type ServerContributeData = z.infer<typeof serverContributeSchema>;
export type WithdrawFormData = z.infer<typeof withdrawSchema>;
export type ServerWithdrawData = z.infer<typeof serverWithdrawSchema>;
export type DeleteGoalData = z.infer<typeof deleteGoalSchema>;

/**
 * Parse amount string to number
 * Handles Chilean format (dots as thousands separator)
 * Examples: 1.500.000 -> 1500000, 1500000 -> 1500000
 */
export function parseAmount(value: string): number {
  if (!value || typeof value !== "string") return 0;
  
  // Remove currency symbols and spaces
  let cleaned = value.replace(/[$\s]/g, "");
  
  // Remove all dots (thousands separator in Chilean format)
  cleaned = cleaned.replace(/\./g, "");
  
  // Replace comma with dot for decimal (if present)
  cleaned = cleaned.replace(",", ".");
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.abs(num);
}
