import { z } from "zod";

export const SUPPORTED_CURRENCIES = [
  { code: "CLP", name: "Peso Chileno", symbol: "$" },
  { code: "ARS", name: "Peso Argentino", symbol: "$" },
  { code: "USD", name: "Dólar Estadounidense", symbol: "US$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "PEN", name: "Sol Peruano", symbol: "S/" },
  { code: "BRL", name: "Real Brasileño", symbol: "R$" },
  { code: "COP", name: "Peso Colombiano", symbol: "$" },
  { code: "MXN", name: "Peso Mexicano", symbol: "$" },
  { code: "UYU", name: "Peso Uruguayo", symbol: "$U" },
] as const;

export const currencyCodes = SUPPORTED_CURRENCIES.map((c) => c.code);

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(50, "Máximo 50 caracteres"),
  type: z.enum(["PERSONAL", "BUSINESS"]),
  currency: z
    .string()
    .refine((val) => currencyCodes.includes(val as (typeof currencyCodes)[number]), {
      message: "Moneda no soportada",
    }),
});

export const updateWorkspaceSchema = z.object({
  id: z.string().min(1),
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(50, "Máximo 50 caracteres"),
  currency: z
    .string()
    .refine((val) => currencyCodes.includes(val as (typeof currencyCodes)[number]), {
      message: "Moneda no soportada",
    }),
});

export type CreateWorkspaceFormData = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceFormData = z.infer<typeof updateWorkspaceSchema>;
