"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import {
  serverAccountSchema,
  updateAccountSchema,
  type ServerAccountData,
  type UpdateAccountData,
} from "@/lib/validations/account";

type ActionResult = {
  success: boolean;
  error?: string;
  data?: { id: string };
};

/**
 * Create a new account
 */
export async function createAccount(input: ServerAccountData): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "No autenticado" };
    }

    // Validate input
    const validated = serverAccountSchema.safeParse(input);
    if (!validated.success) {
      const firstError = validated.error.issues[0];
      return { success: false, error: firstError?.message || "Datos inválidos" };
    }

    const { name, type, balance, isBusiness, workspaceId } = validated.data;

    // Verify workspace belongs to user
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: user.id },
    });

    if (!workspace) {
      return { success: false, error: "Workspace no encontrado" };
    }

    // Check for duplicate name in workspace
    const existing = await prisma.account.findFirst({
      where: { workspaceId, name: { equals: name, mode: "insensitive" } },
    });

    if (existing) {
      return { success: false, error: "Ya existe una cuenta con ese nombre" };
    }

    // Create account - store type in name for now (we'll add type field later)
    // For MVP, we use the name field. Type is inferred from conventions.
    const account = await prisma.account.create({
      data: {
        name,
        balance,
        isBusiness,
        workspaceId,
      },
    });

    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    revalidatePath("/transactions");

    return { success: true, data: { id: account.id } };
  } catch (error) {
    console.error("Error creating account:", error);
    return { success: false, error: "Error al crear la cuenta" };
  }
}

/**
 * Update an existing account
 */
export async function updateAccount(input: UpdateAccountData): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "No autenticado" };
    }

    // Validate input
    const validated = updateAccountSchema.safeParse(input);
    if (!validated.success) {
      const firstError = validated.error.issues[0];
      return { success: false, error: firstError?.message || "Datos inválidos" };
    }

    const { id, name, balance, isBusiness, workspaceId } = validated.data;

    // Verify account belongs to user's workspace
    const account = await prisma.account.findFirst({
      where: { id },
      include: { workspace: { select: { userId: true } } },
    });

    if (!account || account.workspace.userId !== user.id) {
      return { success: false, error: "Cuenta no encontrada" };
    }

    // Check for duplicate name (excluding current account)
    const existing = await prisma.account.findFirst({
      where: {
        workspaceId,
        name: { equals: name, mode: "insensitive" },
        id: { not: id },
      },
    });

    if (existing) {
      return { success: false, error: "Ya existe una cuenta con ese nombre" };
    }

    await prisma.account.update({
      where: { id },
      data: {
        name,
        balance,
        isBusiness,
      },
    });

    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    revalidatePath("/transactions");

    return { success: true };
  } catch (error) {
    console.error("Error updating account:", error);
    return { success: false, error: "Error al actualizar la cuenta" };
  }
}

/**
 * Delete an account
 * Only allowed if account has no transactions
 */
export async function deleteAccount(
  accountId: string,
  workspaceId: string
): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "No autenticado" };
    }

    // Verify account belongs to user's workspace
    const account = await prisma.account.findFirst({
      where: { id: accountId, workspaceId },
      include: {
        workspace: { select: { userId: true } },
        _count: { select: { transactions: true } },
      },
    });

    if (!account || account.workspace.userId !== user.id) {
      return { success: false, error: "Cuenta no encontrada" };
    }

    // Prevent deletion if account has transactions
    if (account._count.transactions > 0) {
      return {
        success: false,
        error: `No se puede eliminar. La cuenta tiene ${account._count.transactions} transacciones asociadas.`,
      };
    }

    await prisma.account.delete({ where: { id: accountId } });

    revalidatePath("/accounts");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error deleting account:", error);
    return { success: false, error: "Error al eliminar la cuenta" };
  }
}
