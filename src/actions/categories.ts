"use server";

import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import {
  serverCategorySchema,
  updateCategorySchema,
  type ServerCategoryData,
  type UpdateCategoryData,
} from "@/lib/validations/category";
import { revalidatePath } from "next/cache";

type ActionResult = {
  success: boolean;
  error?: string;
  data?: { id: string };
};

/**
 * Create a new category
 */
export async function createCategory(
  input: ServerCategoryData
): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "No autenticado" };
    }

    // Validate input
    const validated = serverCategorySchema.safeParse(input);
    if (!validated.success) {
      const firstError = validated.error.issues[0];
      return { success: false, error: firstError?.message || "Datos inválidos" };
    }

    const { name, icon, type } = validated.data;

    // Check for duplicate name (case insensitive)
    const existing = await prisma.category.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        type,
        userId: user.id,
      },
    });

    if (existing) {
      return { success: false, error: "Ya existe una categoría con ese nombre" };
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        name,
        icon: icon || null,
        type,
        userId: user.id,
      },
    });

    revalidatePath("/categories");
    revalidatePath("/transactions");
    revalidatePath("/reports");

    return { success: true, data: { id: category.id } };
  } catch (error) {
    console.error("Error creating category:", error);
    return { success: false, error: "Error al crear la categoría" };
  }
}

/**
 * Update an existing category
 */
export async function updateCategory(
  input: UpdateCategoryData
): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "No autenticado" };
    }

    // Validate input
    const validated = updateCategorySchema.safeParse(input);
    if (!validated.success) {
      const firstError = validated.error.issues[0];
      return { success: false, error: firstError?.message || "Datos inválidos" };
    }

    const { id, name, icon, type } = validated.data;

    // Verify category belongs to user
    const category = await prisma.category.findFirst({
      where: { id, userId: user.id },
    });

    if (!category) {
      return { success: false, error: "Categoría no encontrada" };
    }

    // Check for duplicate name (excluding current category)
    const existing = await prisma.category.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        type,
        userId: user.id,
        id: { not: id },
      },
    });

    if (existing) {
      return { success: false, error: "Ya existe una categoría con ese nombre" };
    }

    // Update category
    await prisma.category.update({
      where: { id },
      data: {
        name,
        icon: icon || null,
        type,
      },
    });

    revalidatePath("/categories");
    revalidatePath("/transactions");
    revalidatePath("/reports");

    return { success: true };
  } catch (error) {
    console.error("Error updating category:", error);
    return { success: false, error: "Error al actualizar la categoría" };
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(categoryId: string): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "No autenticado" };
    }

    // Verify category belongs to user
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId: user.id },
      include: {
        _count: {
          select: { transactions: true, Recurrings: true },
        },
      },
    });

    if (!category) {
      return { success: false, error: "Categoría no encontrada" };
    }

    // Check if category has transactions or recurrings
    if (category._count.transactions > 0 || category._count.Recurrings > 0) {
      return {
        success: false,
        error: `No se puede eliminar: tiene ${category._count.transactions} transacciones y ${category._count.Recurrings} recurrentes asociadas`,
      };
    }

    // Delete category
    await prisma.category.delete({
      where: { id: categoryId },
    });

    revalidatePath("/categories");
    revalidatePath("/transactions");
    revalidatePath("/reports");

    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    return { success: false, error: "Error al eliminar la categoría" };
  }
}

/**
 * Get all categories for the current user
 */
export async function getUserCategories() {
  try {
    const user = await getUser();
    if (!user) {
      return [];
    }

    const categories = await prisma.category.findMany({
      where: { userId: user.id },
      orderBy: [{ type: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      type: cat.type,
      transactionCount: cat._count.transactions,
    }));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}
