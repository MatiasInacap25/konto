"use server";

import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
} from "@/lib/validations/workspace";

type ActionResult = {
  success: boolean;
  error?: string;
  data?: { id: string };
};

/**
 * Create a new workspace with a default "Principal" account
 */
export async function createWorkspace(input: {
  name: string;
  type: string;
  currency: string;
}): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "No autenticado" };
    }

    const validated = createWorkspaceSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0]?.message };
    }

    // Check for duplicate name
    const existing = await prisma.workspace.findFirst({
      where: {
        name: { equals: validated.data.name, mode: "insensitive" },
        userId: user.id,
      },
    });

    if (existing) {
      return { success: false, error: "Ya existe un workspace con ese nombre" };
    }

    // Create workspace + default account in a transaction
    const workspace = await prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({
        data: {
          name: validated.data.name,
          type: validated.data.type as "PERSONAL" | "BUSINESS",
          currency: validated.data.currency,
          userId: user.id,
        },
      });

      // Create default account
      await tx.account.create({
        data: {
          name: "Principal",
          balance: 0,
          isBusiness: validated.data.type === "BUSINESS",
          workspaceId: ws.id,
        },
      });

      // Create owner membership
      await tx.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: ws.id,
          role: "OWNER",
        },
      });

      return ws;
    });

    revalidatePath("/workspaces");
    revalidatePath("/dashboard");

    return { success: true, data: { id: workspace.id } };
  } catch (error) {
    console.error("Error creating workspace:", error);
    return { success: false, error: "Error al crear el workspace" };
  }
}

/**
 * Update workspace name and currency
 */
export async function updateWorkspace(input: {
  id: string;
  name: string;
  currency: string;
}): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "No autenticado" };
    }

    const validated = updateWorkspaceSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0]?.message };
    }

    // Verify workspace belongs to user
    const existing = await prisma.workspace.findFirst({
      where: {
        id: validated.data.id,
        userId: user.id,
      },
    });

    if (!existing) {
      return { success: false, error: "Workspace no encontrado" };
    }

    // Check for duplicate name (excluding current)
    const duplicate = await prisma.workspace.findFirst({
      where: {
        name: { equals: validated.data.name, mode: "insensitive" },
        userId: user.id,
        id: { not: validated.data.id },
      },
    });

    if (duplicate) {
      return { success: false, error: "Ya existe un workspace con ese nombre" };
    }

    await prisma.workspace.update({
      where: { id: validated.data.id },
      data: {
        name: validated.data.name,
        currency: validated.data.currency,
      },
    });

    revalidatePath("/workspaces");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error updating workspace:", error);
    return { success: false, error: "Error al actualizar el workspace" };
  }
}

/**
 * Delete a workspace (BUSINESS only, never PERSONAL)
 */
export async function deleteWorkspace(
  workspaceId: string
): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "No autenticado" };
    }

    // Verify workspace belongs to user
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        userId: user.id,
      },
    });

    if (!workspace) {
      return { success: false, error: "Workspace no encontrado" };
    }

    // Never delete PERSONAL workspace
    if (workspace.type === "PERSONAL") {
      return { success: false, error: "No se puede eliminar el workspace personal" };
    }

    // Cascade delete handles accounts, transactions, recurrings, tax rules
    await prisma.workspace.delete({
      where: { id: workspaceId },
    });

    revalidatePath("/workspaces");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error deleting workspace:", error);
    return { success: false, error: "Error al eliminar el workspace" };
  }
}
