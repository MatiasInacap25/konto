"use server";

import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { getWorkspace } from "@/lib/queries";
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
  input: ServerCategoryData,
  workspaceId?: string
): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "No autenticado" };
    }

    const workspace = await getWorkspace(user.id, workspaceId);
    if (!workspace) {
      return { success: false, error: "Workspace no encontrado" };
    }

    // Validate input
    const validated = serverCategorySchema.safeParse(input);
    if (!validated.success) {
      const firstError = validated.error.issues[0];
      return { success: false, error: firstError?.message || "Datos inválidos" };
    }

    const { name, icon, type } = validated.data;

    // Check for duplicate name (case insensitive) in workspace
    const existing = await prisma.category.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        type,
        workspaceId: workspace.id,
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
        workspaceId: workspace.id,
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
  input: UpdateCategoryData,
  workspaceId?: string
): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "No autenticado" };
    }

    const workspace = await getWorkspace(user.id, workspaceId);
    if (!workspace) {
      return { success: false, error: "Workspace no encontrado" };
    }

    // Validate input
    const validated = updateCategorySchema.safeParse(input);
    if (!validated.success) {
      const firstError = validated.error.issues[0];
      return { success: false, error: firstError?.message || "Datos inválidos" };
    }

    const { id, name, icon, type } = validated.data;

    // Verify category belongs to workspace
    const category = await prisma.category.findFirst({
      where: { id, workspaceId: workspace.id },
    });

    if (!category) {
      return { success: false, error: "Categoría no encontrada" };
    }

    // Check for duplicate name (excluding current category)
    const existing = await prisma.category.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        type,
        workspaceId: workspace.id,
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
export async function deleteCategory(
  categoryId: string,
  workspaceId?: string
): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "No autenticado" };
    }

    const workspace = await getWorkspace(user.id, workspaceId);
    if (!workspace) {
      return { success: false, error: "Workspace no encontrado" };
    }

    // Verify category belongs to workspace
    const category = await prisma.category.findFirst({
      where: { id: categoryId, workspaceId: workspace.id },
      include: {
        _count: {
          select: { transactions: true, recurrings: true },
        },
      },
    });

    if (!category) {
      return { success: false, error: "Categoría no encontrada" };
    }

    // Check if category has transactions or recurrings
    if (category._count.transactions > 0 || category._count.recurrings > 0) {
      return {
        success: false,
        error: `No se puede eliminar: tiene ${category._count.transactions} transacciones y ${category._count.recurrings} recurrentes asociadas`,
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
 * Get all categories for the current user's workspace
 */
export async function getUserCategories(workspaceId?: string) {
  try {
    const user = await getUser();
    if (!user) {
      return [];
    }

    const workspace = await getWorkspace(user.id, workspaceId);
    if (!workspace) {
      return [];
    }

    const categories = await prisma.category.findMany({
      where: { workspaceId: workspace.id },
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
