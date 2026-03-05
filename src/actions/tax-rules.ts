"use server";

import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  serverTaxRuleSchema,
  updateTaxRuleSchema,
  parsePercentage,
} from "@/lib/validations/tax-rule";

type ActionResult = {
  success: boolean;
  error?: string;
  data?: { id: string };
};

/**
 * Get all tax rules for a workspace
 */
export async function getTaxRules(workspaceId: string) {
  try {
    const user = await getUser();
    if (!user) {
      return [];
    }

    const taxRules = await prisma.taxRule.findMany({
      where: {
        workspaceId,
        workspace: {
          userId: user.id,
        },
      },
      orderBy: [
        { isActive: "desc" },
        { name: "asc" },
      ],
    });

    return taxRules;
  } catch (error) {
    console.error("Error fetching tax rules:", error);
    return [];
  }
}

/**
 * Create a new tax rule
 */
export async function createTaxRule(
  input: {
    name: string;
    percentage: string;
    workspaceId: string;
  }
): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "No autenticado" };
    }

    // Validate input
    const percentage = parsePercentage(input.percentage);

    if (percentage < 0 || percentage > 100) {
      return { success: false, error: "El porcentaje debe estar entre 0 y 100" };
    }

    // Verify workspace belongs to user
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: input.workspaceId,
        userId: user.id,
      },
    });

    if (!workspace) {
      return { success: false, error: "Workspace no encontrado" };
    }

    // Check for duplicate name
    const existing = await prisma.taxRule.findFirst({
      where: {
        name: { equals: input.name, mode: "insensitive" },
        workspaceId: input.workspaceId,
      },
    });

    if (existing) {
      return { success: false, error: "Ya existe una regla con ese nombre" };
    }

    // Create tax rule
    const taxRule = await prisma.taxRule.create({
      data: {
        name: input.name,
        percentage,
        workspaceId: input.workspaceId,
      },
    });

    revalidatePath("/tax-rules");

    return { success: true, data: { id: taxRule.id } };
  } catch (error) {
    console.error("Error creating tax rule:", error);
    return { success: false, error: "Error al crear la regla" };
  }
}

/**
 * Update an existing tax rule
 */
export async function updateTaxRule(
  input: {
    id: string;
    name: string;
    percentage: string;
    workspaceId: string;
  }
): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "No autenticado" };
    }

    // Validate input
    const percentage = parsePercentage(input.percentage);

    if (percentage < 0 || percentage > 100) {
      return { success: false, error: "El porcentaje debe estar entre 0 y 100" };
    }

    // Verify tax rule belongs to user
    const existing = await prisma.taxRule.findFirst({
      where: {
        id: input.id,
        workspace: {
          userId: user.id,
        },
      },
    });

    if (!existing) {
      return { success: false, error: "Regla no encontrada" };
    }

    // Check for duplicate name (excluding current)
    const duplicate = await prisma.taxRule.findFirst({
      where: {
        name: { equals: input.name, mode: "insensitive" },
        workspaceId: input.workspaceId,
        id: { not: input.id },
      },
    });

    if (duplicate) {
      return { success: false, error: "Ya existe una regla con ese nombre" };
    }

    // Update tax rule
    await prisma.taxRule.update({
      where: { id: input.id },
      data: {
        name: input.name,
        percentage,
      },
    });

    revalidatePath("/tax-rules");

    return { success: true };
  } catch (error) {
    console.error("Error updating tax rule:", error);
    return { success: false, error: "Error al actualizar la regla" };
  }
}

/**
 * Delete a tax rule
 */
export async function deleteTaxRule(
  taxRuleId: string,
  workspaceId: string
): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "No autenticado" };
    }

    // Verify tax rule belongs to user
    const existing = await prisma.taxRule.findFirst({
      where: {
        id: taxRuleId,
        workspaceId,
        workspace: {
          userId: user.id,
        },
      },
    });

    if (!existing) {
      return { success: false, error: "Regla no encontrada" };
    }

    await prisma.taxRule.delete({
      where: { id: taxRuleId },
    });

    revalidatePath("/tax-rules");

    return { success: true };
  } catch (error) {
    console.error("Error deleting tax rule:", error);
    return { success: false, error: "Error al eliminar la regla" };
  }
}

/**
 * Toggle tax rule active status
 */
export async function toggleTaxRule(
  taxRuleId: string,
  workspaceId: string
): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "No autenticado" };
    }

    // Verify tax rule belongs to user
    const existing = await prisma.taxRule.findFirst({
      where: {
        id: taxRuleId,
        workspaceId,
        workspace: {
          userId: user.id,
        },
      },
    });

    if (!existing) {
      return { success: false, error: "Regla no encontrada" };
    }

    await prisma.taxRule.update({
      where: { id: taxRuleId },
      data: {
        isActive: !existing.isActive,
      },
    });

    revalidatePath("/tax-rules");

    return { success: true };
  } catch (error) {
    console.error("Error toggling tax rule:", error);
    return { success: false, error: "Error al cambiar el estado" };
  }
}
