"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================
// Server-side validation schemas
// Defense in depth - validates even if client bypassed
// ============================================

const transactionTypes = ["INCOME", "EXPENSE"] as const;
const transactionScopes = ["PERSONAL", "BUSINESS", "MIXED"] as const;

const createTransactionServerSchema = z.object({
  amount: z.number().positive("El monto debe ser mayor a 0"),
  description: z.string().max(500).optional(),
  type: z.enum(transactionTypes),
  scope: z.enum(transactionScopes),
  date: z.coerce.date(),
  accountId: z.string().min(1, "Cuenta requerida"),
  categoryId: z.string().optional(),
  workspaceId: z.string().min(1, "Workspace requerido"),
});

const updateTransactionServerSchema = z.object({
  id: z.string().min(1),
  amount: z.number().positive().optional(),
  description: z.string().max(500).optional(),
  type: z.enum(transactionTypes).optional(),
  scope: z.enum(transactionScopes).optional(),
  date: z.coerce.date().optional(),
  accountId: z.string().min(1).optional(),
  categoryId: z.string().nullable().optional(),
});

// ============================================
// Types
// ============================================

type CreateTransactionInput = z.infer<typeof createTransactionServerSchema>;
type UpdateTransactionInput = z.infer<typeof updateTransactionServerSchema>;

type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Verifica que el usuario esté autenticado y tenga acceso al workspace
 */
async function verifyAccess(workspaceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado", user: null };
  }

  // Verificar que el workspace pertenece al usuario
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
 * Crea una nueva transacción y actualiza el balance de la cuenta
 */
export async function createTransaction(
  input: CreateTransactionInput
): Promise<ActionResult<{ id: string }>> {
  try {
    // Server-side validation
    const parsed = createTransactionServerSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message || "Datos inválidos" };
    }
    
    const validInput = parsed.data;
    
    const { error, user } = await verifyAccess(validInput.workspaceId);
    if (error || !user) {
      return { success: false, error: error || "No autorizado" };
    }

    // Verificar que la cuenta pertenece al workspace
    const account = await prisma.account.findFirst({
      where: { id: validInput.accountId, workspaceId: validInput.workspaceId },
    });
    
    if (!account) {
      return { success: false, error: "Cuenta no encontrada" };
    }

    // Calcular el cambio de balance
    const balanceChange = validInput.type === "INCOME" 
      ? validInput.amount 
      : -validInput.amount;

    // Crear transacción y actualizar balance en una transacción de DB
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          amount: validInput.amount,
          description: validInput.description,
          type: validInput.type,
          scope: validInput.scope,
          date: validInput.date,
          accountId: validInput.accountId,
          categoryId: validInput.categoryId,
          workspaceId: validInput.workspaceId,
        },
      });

      await tx.account.update({
        where: { id: validInput.accountId },
        data: {
          balance: {
            increment: balanceChange,
          },
        },
      });

      return transaction;
    });

    revalidatePath("/transactions");
    revalidatePath("/dashboard");

    return { success: true, data: { id: result.id } };
  } catch (error) {
    console.error("Error creating transaction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Actualiza una transacción existente
 */
export async function updateTransaction(
  input: UpdateTransactionInput,
  workspaceId: string
): Promise<ActionResult> {
  try {
    // Server-side validation
    const parsed = updateTransactionServerSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message || "Datos inválidos" };
    }
    
    const validInput = parsed.data;
    
    const { error, user } = await verifyAccess(workspaceId);
    if (error || !user) {
      return { success: false, error: error || "No autorizado" };
    }

    // Obtener la transacción original para calcular diferencia de balance
    const original = await prisma.transaction.findFirst({
      where: {
        id: validInput.id,
        workspaceId: workspaceId,
      },
    });

    if (!original) {
      return { success: false, error: "Transacción no encontrada" };
    }

    // Si se cambia la cuenta, verificar que pertenece al workspace
    if (validInput.accountId && validInput.accountId !== original.accountId) {
      const account = await prisma.account.findFirst({
        where: { id: validInput.accountId, workspaceId },
      });
      if (!account) {
        return { success: false, error: "Cuenta no encontrada" };
      }
    }

    await prisma.$transaction(async (tx) => {
      // Si cambia el monto, tipo o cuenta, hay que ajustar balances
      const oldAmount = Number(original.amount);
      const newAmount = validInput.amount ?? oldAmount;
      const oldType = original.type;
      const newType = validInput.type ?? oldType;
      const oldAccountId = original.accountId;
      const newAccountId = validInput.accountId ?? oldAccountId;

      // Revertir el efecto en la cuenta original
      const oldBalanceEffect = oldType === "INCOME" ? oldAmount : -oldAmount;
      await tx.account.update({
        where: { id: oldAccountId },
        data: {
          balance: {
            decrement: oldBalanceEffect,
          },
        },
      });

      // Aplicar el nuevo efecto en la cuenta (puede ser la misma u otra)
      const newBalanceEffect = newType === "INCOME" ? newAmount : -newAmount;
      await tx.account.update({
        where: { id: newAccountId },
        data: {
          balance: {
            increment: newBalanceEffect,
          },
        },
      });

      // Actualizar la transacción
      await tx.transaction.update({
        where: { id: validInput.id },
        data: {
          amount: validInput.amount,
          description: validInput.description,
          type: validInput.type,
          scope: validInput.scope,
          date: validInput.date,
          accountId: validInput.accountId,
          categoryId: validInput.categoryId,
        },
      });
    });

    revalidatePath("/transactions");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error updating transaction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Elimina una transacción y revierte el balance
 */
export async function deleteTransaction(
  id: string,
  workspaceId: string
): Promise<ActionResult> {
  try {
    const { error, user } = await verifyAccess(workspaceId);
    if (error || !user) {
      return { success: false, error: error || "No autorizado" };
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        workspaceId,
      },
    });

    if (!transaction) {
      return { success: false, error: "Transacción no encontrada" };
    }

    await prisma.$transaction(async (tx) => {
      // Revertir el efecto en el balance
      const balanceEffect = transaction.type === "INCOME" 
        ? Number(transaction.amount) 
        : -Number(transaction.amount);

      await tx.account.update({
        where: { id: transaction.accountId },
        data: {
          balance: {
            decrement: balanceEffect,
          },
        },
      });

      await tx.transaction.delete({
        where: { id },
      });
    });

    revalidatePath("/transactions");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
