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

    // Prevent updating system accounts
    if (account.isSystem) {
      return { success: false, error: "Las cuentas del sistema no se pueden modificar" };
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
 * Archive an account (soft delete)
 * Accounts with transactions can be archived but not permanently deleted
 */
export async function archiveAccount(
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
      },
    });

    if (!account || account.workspace.userId !== user.id) {
      return { success: false, error: "Cuenta no encontrada" };
    }

    // Prevent archiving system accounts
    if (account.isSystem) {
      return { success: false, error: "Las cuentas del sistema no se pueden archivar" };
    }

    // Soft delete: set archivedAt timestamp
    await prisma.account.update({
      where: { id: accountId },
      data: { archivedAt: new Date() },
    });

    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    revalidatePath("/transactions");

    return { success: true };
  } catch (error) {
    console.error("Error archiving account:", error);
    return { success: false, error: "Error al archivar la cuenta" };
  }
}

/**
 * Restore an archived account
 */
export async function restoreAccount(
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
      },
    });

    if (!account || account.workspace.userId !== user.id) {
      return { success: false, error: "Cuenta no encontrada" };
    }

    // Prevent restoring system accounts (they should never be archived anyway)
    if (account.isSystem) {
      return { success: false, error: "Las cuentas del sistema no se pueden modificar" };
    }

    // Restore: clear archivedAt timestamp
    await prisma.account.update({
      where: { id: accountId },
      data: { archivedAt: null },
    });

    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    revalidatePath("/transactions");

    return { success: true };
  } catch (error) {
    console.error("Error restoring account:", error);
    return { success: false, error: "Error al restaurar la cuenta" };
  }
}

/**
 * Get or create the system "Deleted" account for a workspace
 * This account stores transactions from deleted accounts
 */
async function getOrCreateDeletedAccount(workspaceId: string): Promise<string> {
  // Look for existing deleted account
  const existing = await prisma.account.findFirst({
    where: {
      workspaceId,
      isSystem: true,
      name: "Eliminadas",
    },
  });

  if (existing) {
    return existing.id;
  }

  // Create the system account
  const created = await prisma.account.create({
    data: {
      name: "Eliminadas",
      balance: 0,
      isBusiness: false,
      isSystem: true,
      archivedAt: null,
      workspaceId,
    },
  });

  return created.id;
}

/**
 * Permanently delete an account
 * If the account has transactions, they are transferred to a "Deleted" system account
 * Only archived accounts can be permanently deleted
 */
export async function permanentlyDeleteAccount(
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

    // Prevent deleting system accounts
    if (account.isSystem) {
      return { success: false, error: "Las cuentas del sistema no se pueden eliminar" };
    }

    // Safety check: must be archived
    if (!account.archivedAt) {
      return {
        success: false,
        error: "Primero debés archivar la cuenta antes de eliminarla permanentemente.",
      };
    }

    // If account has transactions, transfer them to "Deleted" account
    if (account._count.transactions > 0) {
      const deletedAccountId = await getOrCreateDeletedAccount(workspaceId);

      // Transfer all transactions to the "Deleted" account
      await prisma.transaction.updateMany({
        where: { accountId },
        data: { accountId: deletedAccountId },
      });
    }

    // Delete the account (transactions are now in "Deleted" account)
    await prisma.account.delete({ where: { id: accountId } });

    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    revalidatePath("/transactions");

    return {
      success: true,
      data: {
        transferredTransactions: account._count.transactions,
      } as any,
    };
  } catch (error) {
    console.error("Error deleting account:", error);
    return { success: false, error: "Error al eliminar la cuenta" };
  }
}
