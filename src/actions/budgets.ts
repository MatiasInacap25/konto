"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import {
  serverBudgetSchema,
  updateBudgetSchema,
  type ServerBudgetData,
  type UpdateBudgetData,
} from "@/lib/validations/budgets";

type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Verify user is authenticated and has access to workspace
 */
async function verifyAccess(workspaceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado", user: null };
  }

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      userId: user.id,
    },
  });

  if (!workspace) {
    return { error: "Workspace no encontrado", user: null };
  }

  return { error: null, user, workspace };
}

/**
 * Create a new budget
 */
export async function createBudget(
  input: ServerBudgetData
): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = serverBudgetSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message || "Datos inválidos" };
    }

    const validInput = parsed.data;
    const { error, user } = await verifyAccess(validInput.workspaceId);
    if (error || !user) {
      return { success: false, error: error || "No autorizado" };
    }

    // Validate dates
    if (validInput.endDate <= validInput.startDate) {
      return { success: false, error: "La fecha de fin debe ser después del inicio" };
    }

    // Validate category limits belong to EXPENSE categories
    if (validInput.categoryLimits && validInput.categoryLimits.length > 0) {
      const categoryIds = validInput.categoryLimits.map((cl) => cl.categoryId);
      const categories = await prisma.category.findMany({
        where: {
          id: { in: categoryIds },
          type: "EXPENSE",
        },
        select: { id: true },
      });

      if (categories.length !== categoryIds.length) {
        return {
          success: false,
          error: "Solo podés asignar límites a categorías de gastos",
        };
      }
    }

    // Create budget with category limits
    const budget = await prisma.budget.create({
      data: {
        name: validInput.name,
        totalAmount: validInput.totalAmount,
        startDate: validInput.startDate,
        endDate: validInput.endDate,
        workspaceId: validInput.workspaceId,
        categoryLimits: validInput.categoryLimits
          ? {
              create: validInput.categoryLimits.map((limit) => ({
                categoryId: limit.categoryId,
                amount: limit.amount,
              })),
            }
          : undefined,
      },
    });

    revalidatePath("/budgets");
    return { success: true, data: { id: budget.id } };
  } catch (error) {
    console.error("Create budget failed:", error);
    return { success: false, error: "Error al crear presupuesto" };
  }
}

/**
 * Update an existing budget
 */
export async function updateBudget(
  input: UpdateBudgetData
): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = updateBudgetSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message || "Datos inválidos" };
    }

    const validInput = parsed.data;
    const { error, user } = await verifyAccess(validInput.workspaceId);
    if (error || !user) {
      return { success: false, error: error || "No autorizado" };
    }

    // Validate budget exists and belongs to workspace
    const existingBudget = await prisma.budget.findFirst({
      where: {
        id: validInput.id,
        workspaceId: validInput.workspaceId,
      },
    });

    if (!existingBudget) {
      return { success: false, error: "Presupuesto no encontrado" };
    }

    // Validate dates
    if (validInput.endDate <= validInput.startDate) {
      return { success: false, error: "La fecha de fin debe ser después del inicio" };
    }

    // Validate category limits belong to EXPENSE categories
    if (validInput.categoryLimits && validInput.categoryLimits.length > 0) {
      const categoryIds = validInput.categoryLimits.map((cl) => cl.categoryId);
      const categories = await prisma.category.findMany({
        where: {
          id: { in: categoryIds },
          type: "EXPENSE",
        },
        select: { id: true },
      });

      if (categories.length !== categoryIds.length) {
        return {
          success: false,
          error: "Solo podés asignar límites a categorías de gastos",
        };
      }
    }

    // Update budget in transaction
    await prisma.$transaction(async (tx) => {
      // Delete existing category limits
      await tx.budgetCategoryLimit.deleteMany({
        where: { budgetId: validInput.id },
      });

      // Update budget
      await tx.budget.update({
        where: { id: validInput.id },
        data: {
          name: validInput.name,
          totalAmount: validInput.totalAmount,
          startDate: validInput.startDate,
          endDate: validInput.endDate,
          categoryLimits: validInput.categoryLimits
            ? {
                create: validInput.categoryLimits.map((limit) => ({
                  categoryId: limit.categoryId,
                  amount: limit.amount,
                })),
              }
            : undefined,
        },
      });
    });

    revalidatePath("/budgets");
    return { success: true, data: { id: validInput.id } };
  } catch (error) {
    console.error("Update budget failed:", error);
    return { success: false, error: "Error al actualizar presupuesto" };
  }
}

/**
 * Delete a budget
 */
export async function deleteBudget(
  budgetId: string,
  workspaceId: string
): Promise<ActionResult> {
  try {
    if (!budgetId || !workspaceId) {
      return { success: false, error: "Datos inválidos" };
    }

    const { error, user } = await verifyAccess(workspaceId);
    if (error || !user) {
      return { success: false, error: error || "No autorizado" };
    }

    // Verify budget exists and belongs to workspace
    const budget = await prisma.budget.findFirst({
      where: {
        id: budgetId,
        workspaceId,
      },
    });

    if (!budget) {
      return { success: false, error: "Presupuesto no encontrado" };
    }

    // Delete budget (cascade will delete category limits)
    await prisma.budget.delete({
      where: { id: budgetId },
    });

    revalidatePath("/budgets");
    return { success: true };
  } catch (error) {
    console.error("Delete budget failed:", error);
    return { success: false, error: "Error al eliminar presupuesto" };
  }
}
