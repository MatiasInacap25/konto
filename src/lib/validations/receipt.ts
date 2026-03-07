import { z } from "zod";

// ============================================
// AI extraction schema — what GPT-4o-mini returns
// ============================================

export const RECEIPT_CATEGORIES = [
  "Alimentación",
  "Transporte",
  "Entretenimiento",
  "Servicios",
  "Herramientas",
  "Hosting/Cloud",
  "Software",
  "Viajes",
] as const;

/**
 * Schema for the data extracted by the AI from a receipt image.
 * Fields can be null if the AI couldn't extract them.
 */
export const extractedReceiptDataSchema = z.object({
  amount: z.number().positive().nullable(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD")
    .nullable(),
  merchant: z.string().nullable(),
  description: z.string().nullable(),
  suggestedCategory: z.string().nullable(),
});

export type ExtractedReceiptData = z.infer<typeof extractedReceiptDataSchema>;

/**
 * Schema for AI error response (not a valid receipt).
 */
export const extractionErrorSchema = z.object({
  error: z.string(),
});

// ============================================
// Confirm receipt schema — user confirms/edits before creating transaction
// ============================================

export const confirmReceiptSchema = z.object({
  receiptId: z.string().min(1, "Receipt ID requerido"),
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
  date: z.date({ message: "Seleccioná la fecha" }),
  accountId: z.string().min(1, "Seleccioná una cuenta"),
  categoryId: z.string().optional(),
  taxRuleId: z.string().optional(),
  scope: z.enum(["PERSONAL", "BUSINESS", "MIXED"], {
    message: "Seleccioná el alcance",
  }),
});

export type ConfirmReceiptFormData = z.infer<typeof confirmReceiptSchema>;

/**
 * Parse amount string to number (same pattern as transaction validation)
 */
export function parseReceiptAmount(amount: string): number {
  return parseFloat(amount.replace(/[^\d.-]/g, ""));
}

// ============================================
// Upload validation
// ============================================

export const ACCEPTED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function validateReceiptFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (!ACCEPTED_FILE_TYPES.includes(file.type as (typeof ACCEPTED_FILE_TYPES)[number])) {
    return {
      valid: false,
      error: "Formato no soportado. Usá JPEG, PNG o WebP.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "El archivo es demasiado grande. Máximo 5MB.",
    };
  }

  return { valid: true };
}
