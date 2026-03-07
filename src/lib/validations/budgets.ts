import { z } from "zod";
import { parseAmount } from "./account";

/**
 * Budget validation schemas
 * Shared between client form and server action
 */

// Category limit sub-schema
const categoryLimitSchema = z.object({
  categoryId: z.string().min(1, "Seleccioná una categoría"),
  amount: z
    .string({ message: "El monto es requerido" })
    .min(1, "Ingresá un monto")
    .refine(
      (val) => {
        const num = parseAmount(val);
        return !isNaN(num) && num > 0;
      },
      { message: "El monto debe ser mayor a cero" }
    ),
});

// Client-side form schema (amounts as strings for inputs)
export const createBudgetSchema = z
  .object({
    name: z
      .string({ message: "El nombre es requerido" })
      .min(1, "El nombre es requerido")
      .max(100, "Máximo 100 caracteres"),
    totalAmount: z
      .string({ message: "El monto total es requerido" })
      .min(1, "Ingresá un monto")
      .refine(
        (val) => {
          const num = parseAmount(val);
          return !isNaN(num) && num > 0;
        },
        { message: "El monto debe ser mayor a cero" }
      ),
    startDate: z.date({ message: "Seleccioná la fecha de inicio" }),
    endDate: z.date({ message: "Seleccioná la fecha de fin" }),
    categoryLimits: z.array(categoryLimitSchema).optional().default([]),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "La fecha de fin debe ser después del inicio",
    path: ["endDate"],
  });

// Server-side schema (amounts as numbers)
export const serverBudgetSchema = z.object({
  name: z.string().min(1).max(100),
  totalAmount: z.number().positive("El monto debe ser mayor a cero"),
  startDate: z.date(),
  endDate: z.date(),
  workspaceId: z.string().min(1),
  categoryLimits: z
    .array(
      z.object({
        categoryId: z.string().min(1),
        amount: z.number().positive(),
      })
    )
    .optional()
    .default([]),
});

export const updateBudgetSchema = serverBudgetSchema.extend({
  id: z.string().min(1),
});

export type CreateBudgetFormData = z.infer<typeof createBudgetSchema>;
export type ServerBudgetData = z.infer<typeof serverBudgetSchema>;
export type UpdateBudgetData = z.infer<typeof updateBudgetSchema>;

/**
 * Validate category limits sum warning
 * Returns warning message if sum exceeds total (non-blocking)
 */
export function validateCategoryLimitsSum(
  totalAmount: number,
  categoryLimits: { amount: number }[]
): string | null {
  if (categoryLimits.length === 0) return null;

  const sum = categoryLimits.reduce((acc, limit) => acc + limit.amount, 0);

  if (sum > totalAmount) {
    return `La suma de límites por categoría ($${sum.toLocaleString("es-CL")}) excede el total ($${totalAmount.toLocaleString("es-CL")})`;
  }

  return null;
}
