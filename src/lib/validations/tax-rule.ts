import { z } from "zod";

const PERCENTAGE_REGEX = /^\d{1,3}(\.\d{1,2})?$/;

// Client-side form schema
export const createTaxRuleSchema = z.object({
  name: z
    .string({ message: "El nombre es requerido" })
    .min(1, "El nombre es requerido")
    .max(100, "Máximo 100 caracteres"),
  percentage: z
    .string({ message: "El porcentaje es requerido" })
    .min(1, "Ingresá un porcentaje")
    .regex(PERCENTAGE_REGEX, "Porcentaje inválido (ej: 19, 5.5)")
    .refine(
      (val) => {
        const num = parseFloat(val.replace(",", "."));
        return num >= 0 && num <= 100;
      },
      { message: "El porcentaje debe estar entre 0 y 100" }
    ),
});

// Server-side schema
export const serverTaxRuleSchema = z.object({
  name: z.string().min(1).max(100),
  percentage: z.number().min(0).max(100),
  workspaceId: z.string(),
});

export const updateTaxRuleSchema = serverTaxRuleSchema.extend({
  id: z.string(),
});

export type CreateTaxRuleFormData = z.infer<typeof createTaxRuleSchema>;
export type ServerTaxRuleData = z.infer<typeof serverTaxRuleSchema>;
export type UpdateTaxRuleData = z.infer<typeof updateTaxRuleSchema>;

/**
 * Parse percentage string to number
 */
export function parsePercentage(value: string): number {
  if (!value || typeof value !== "string") return 0;
  
  // Replace comma with dot for European format
  let cleaned = value.replace(",", ".");
  const num = parseFloat(cleaned);
  
  return isNaN(num) ? 0 : Math.max(0, Math.min(100, num));
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(2).replace(".", ",")}%`;
}
