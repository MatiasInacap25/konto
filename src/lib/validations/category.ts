import { z } from "zod";
import type { TransactionType } from "@prisma/client";

// Common emojis for categories
export const CATEGORY_ICONS = [
  "🍽️", "🚗", "🏠", "💡", "📱", "🎬", "🛍️", "💊",
  "📚", "✈️", "🎮", "🎁", "💇", "🐾", "👶", "🏋️",
  "☕", "🍺", "🚕", "🔧", "👔", "🎵", "🌱", "💼",
  "💰", "💵", "💳", "🏦", "📈", "🎯", "⭐", "📋",
] as const;

export type CategoryIcon = (typeof CATEGORY_ICONS)[number];

// Client-side form schema
export const createCategorySchema = z.object({
  name: z
    .string({ message: "El nombre es requerido" })
    .min(1, "El nombre es requerido")
    .max(50, "Máximo 50 caracteres"),
  icon: z.string().emoji("Seleccioná un ícono").optional().or(z.literal("")),
  type: z.enum(["INCOME", "EXPENSE"], {
    message: "Seleccioná el tipo de categoría",
  }),
});

// Server-side schema
export const serverCategorySchema = z.object({
  name: z.string().min(1).max(50),
  icon: z.string().optional().nullable(),
  type: z.enum(["INCOME", "EXPENSE"]),
});

export const updateCategorySchema = serverCategorySchema.extend({
  id: z.string().min(1),
});

export type CreateCategoryFormData = z.infer<typeof createCategorySchema>;
export type ServerCategoryData = z.infer<typeof serverCategorySchema>;
export type UpdateCategoryData = z.infer<typeof updateCategorySchema>;
