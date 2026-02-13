import { z } from "zod";

/**
 * Schema Zod para validación de transacciones
 * MISMO schema usado en cliente (zodResolver) y servidor (actions)
 * Single source of truth para validación
 */

export const transactionTypes = ["INCOME", "EXPENSE"] as const;
export const transactionScopes = ["PERSONAL", "BUSINESS", "MIXED"] as const;

/**
 * Schema base para crear transacción (client-side)
 * Usa z.date() porque el form maneja Date objects directamente
 */
export const createTransactionSchema = z.object({
  amount: z
    .string()
    .min(1, "El monto es requerido")
    .refine(
      (val) => {
        const num = parseFloat(val.replace(/[^\d.-]/g, ""));
        return !isNaN(num) && num > 0;
      },
      { message: "Ingresá un monto válido mayor a 0" }
    ),
  description: z.string().max(500, "La nota es muy larga").optional(),
  type: z.enum(transactionTypes, {
    message: "Seleccioná el tipo",
  }),
  scope: z.enum(transactionScopes, {
    message: "Seleccioná el alcance",
  }),
  date: z.date({
    message: "Seleccioná la fecha",
  }),
  accountId: z.string().min(1, "Seleccioná una cuenta"),
  categoryId: z.string().optional(),
});

/**
 * Schema para actualizar transacción (todos los campos opcionales excepto id)
 */
export const updateTransactionSchema = createTransactionSchema.partial().extend({
  id: z.string().min(1, "ID es requerido"),
});

// Types inferidos desde el schema
export type CreateTransactionFormData = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionFormData = z.infer<typeof updateTransactionSchema>;

/**
 * Parsea el monto string a number
 * Usado después de validar para enviar al servidor
 */
export function parseAmount(amount: string): number {
  return parseFloat(amount.replace(/[^\d.-]/g, ""));
}

/**
 * Valida datos de creación en el servidor
 * Retorna datos parseados o errores
 */
export function validateCreateTransaction(data: unknown) {
  const result = createTransactionSchema.safeParse(data);
  
  if (!result.success) {
    return {
      success: false as const,
      errors: result.error.flatten().fieldErrors,
    };
  }

  return {
    success: true as const,
    data: {
      ...result.data,
      amount: parseAmount(result.data.amount),
    },
  };
}

/**
 * Valida datos de actualización en el servidor
 * Retorna datos parseados o errores
 */
export function validateUpdateTransaction(data: unknown) {
  const result = updateTransactionSchema.safeParse(data);
  
  if (!result.success) {
    return {
      success: false as const,
      errors: result.error.flatten().fieldErrors,
    };
  }

  return {
    success: true as const,
    data: {
      ...result.data,
      amount: result.data.amount ? parseAmount(result.data.amount) : undefined,
    },
  };
}
