"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  serverRecurringSchema,
  updateRecurringSchema,
  parseAmount,
} from "@/lib/validations/recurring";

type ActionResult = {
  success: boolean;
  error?: string;
  data?: { id: string };
};

type RegisterPaymentResult = {
  success: boolean;
  error?: string;
  transactionId?: string;
};

/**
 * Registra el pago de un recurrente vencido.
 * 
 * 1. Crea una transacción con el monto del recurrente
 * 2. Actualiza la fecha del próximo pago según la frecuencia
 * 3. Actualiza el balance de la cuenta asociada
 */
export async function registerRecurringPayment(
  recurringId: string,
  workspaceId: string
): Promise<RegisterPaymentResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "No autenticado" };
    }

    // Obtener el recurrente
    const recurring = await prisma.recurring.findFirst({
      where: {
        id: recurringId,
        workspaceId: workspaceId,
        workspace: {
          userId: user.id,
        },
      },
      include: {
        workspace: {
          include: {
            accounts: {
              take: 1, // Fallback a la primera cuenta si no hay accountId
            },
          },
        },
        category: true,
        account: true, // Incluir la cuenta asociada
      },
    });

    if (!recurring) {
      return { success: false, error: "Recurrente no encontrado" };
    }

    // Usar la cuenta asociada o la primera cuenta disponible como fallback
    const account = recurring.account || recurring.workspace.accounts[0];

    if (!account) {
      return { success: false, error: "No hay cuentas disponibles para registrar el pago" };
    }

    // Calcular la próxima fecha de pago según la frecuencia
    const nextPayment = calculateNextPayment(
      recurring.nextPayment,
      recurring.frequency
    );

    // Crear la transacción y actualizar el recurrente en una transacción de DB
    const result = await prisma.$transaction(async (tx) => {
      // Crear la transacción
      const transaction = await tx.transaction.create({
        data: {
          amount: recurring.amount,
          date: recurring.nextPayment, // Fecha original del pago
          description: `Pago recurrente: ${recurring.name}`,
          type: recurring.type,
          scope: recurring.scope,
          accountId: account.id,
          categoryId: recurring.categoryId,
          workspaceId: workspaceId,
        },
      });

      // Actualizar el balance de la cuenta
      const balanceChange = recurring.type === "EXPENSE" 
        ? -Number(recurring.amount)
        : Number(recurring.amount);

      await tx.account.update({
        where: { id: account.id },
        data: {
          balance: {
            increment: balanceChange,
          },
        },
      });

      // Actualizar la fecha del próximo pago del recurrente
      await tx.recurring.update({
        where: { id: recurringId },
        data: {
          nextPayment: nextPayment,
        },
      });

      return transaction;
    });

    // Revalidar el dashboard para mostrar los cambios
    revalidatePath("/dashboard");

    return { success: true, transactionId: result.id };
  } catch (error) {
    console.error("Error registering recurring payment:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Error desconocido" 
    };
  }
}

/**
 * Calcula la próxima fecha de pago según la frecuencia.
 */
function calculateNextPayment(currentDate: Date, frequency: string): Date {
  const date = new Date(currentDate);

  switch (frequency) {
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "BIWEEKLY":
      date.setDate(date.getDate() + 14);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "QUARTERLY":
      date.setMonth(date.getMonth() + 3);
      break;
    case "SEMI_ANNUALLY":
      date.setMonth(date.getMonth() + 6);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      date.setMonth(date.getMonth() + 1); // Default to monthly
  }

  return date;
}

/**
 * Get all recurrings for a workspace
 */
export async function getRecurrings(workspaceId: string) {
  try {
    const user = await getUser();
    if (!user) {
      return [];
    }

    const recurrings = await prisma.recurring.findMany({
      where: {
        workspaceId,
        workspace: {
          userId: user.id,
        },
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
      orderBy: [
        { isActive: "desc" },
        { nextPayment: "asc" },
      ],
    });

    return recurrings;
  } catch (error) {
    console.error("Error fetching recurrings:", error);
    return [];
  }
}

/**
 * Create a new recurring
 */
export async function createRecurring(
  input: {
    name: string;
    amount: string;
    frequency: string;
    nextPayment: string;
    type: "INCOME" | "EXPENSE";
    scope: "PERSONAL" | "BUSINESS" | "MIXED";
    accountId?: string | null;
    categoryId?: string | null;
    workspaceId: string;
  }
): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "No autenticado" };
    }

    // Validate input
    const amount = parseAmount(input.amount);
    const nextPaymentDate = new Date(input.nextPayment);

    if (isNaN(amount) || amount <= 0) {
      return { success: false, error: "Monto inválido" };
    }

    if (isNaN(nextPaymentDate.getTime())) {
      return { success: false, error: "Fecha inválida" };
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

    // Create recurring
    const recurring = await prisma.recurring.create({
      data: {
        name: input.name,
        amount,
        frequency: input.frequency as any,
        nextPayment: nextPaymentDate,
        type: input.type,
        scope: input.scope,
        accountId: input.accountId || null,
        categoryId: input.categoryId || null,
        workspaceId: input.workspaceId,
      },
    });

    revalidatePath("/recurrings");
    revalidatePath("/dashboard");

    return { success: true, data: { id: recurring.id } };
  } catch (error) {
    console.error("Error creating recurring:", error);
    return { success: false, error: "Error al crear el recurrente" };
  }
}

/**
 * Update an existing recurring
 */
export async function updateRecurring(
  input: {
    id: string;
    name: string;
    amount: string;
    frequency: string;
    nextPayment: string;
    type: "INCOME" | "EXPENSE";
    scope: "PERSONAL" | "BUSINESS" | "MIXED";
    accountId?: string | null;
    categoryId?: string | null;
    workspaceId: string;
  }
): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "No autenticado" };
    }

    // Validate input
    const amount = parseAmount(input.amount);
    const nextPaymentDate = new Date(input.nextPayment);

    if (isNaN(amount) || amount <= 0) {
      return { success: false, error: "Monto inválido" };
    }

    if (isNaN(nextPaymentDate.getTime())) {
      return { success: false, error: "Fecha inválida" };
    }

    // Verify recurring belongs to user's workspace
    const existing = await prisma.recurring.findFirst({
      where: {
        id: input.id,
        workspace: {
          userId: user.id,
        },
      },
    });

    if (!existing) {
      return { success: false, error: "Recurrente no encontrado" };
    }

    // Update recurring
    await prisma.recurring.update({
      where: { id: input.id },
      data: {
        name: input.name,
        amount,
        frequency: input.frequency as any,
        nextPayment: nextPaymentDate,
        type: input.type,
        scope: input.scope,
        accountId: input.accountId || null,
        categoryId: input.categoryId || null,
      },
    });

    revalidatePath("/recurrings");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error updating recurring:", error);
    return { success: false, error: "Error al actualizar el recurrente" };
  }
}

/**
 * Delete a recurring
 */
export async function deleteRecurring(
  recurringId: string,
  workspaceId: string
): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "No autenticado" };
    }

    // Verify recurring belongs to user
    const existing = await prisma.recurring.findFirst({
      where: {
        id: recurringId,
        workspaceId,
        workspace: {
          userId: user.id,
        },
      },
    });

    if (!existing) {
      return { success: false, error: "Recurrente no encontrado" };
    }

    await prisma.recurring.delete({
      where: { id: recurringId },
    });

    revalidatePath("/recurrings");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error deleting recurring:", error);
    return { success: false, error: "Error al eliminar el recurrente" };
  }
}

/**
 * Toggle recurring active status
 */
export async function toggleRecurring(
  recurringId: string,
  workspaceId: string
): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "No autenticado" };
    }

    // Verify recurring belongs to user
    const existing = await prisma.recurring.findFirst({
      where: {
        id: recurringId,
        workspaceId,
        workspace: {
          userId: user.id,
        },
      },
    });

    if (!existing) {
      return { success: false, error: "Recurrente no encontrado" };
    }

    await prisma.recurring.update({
      where: { id: recurringId },
      data: {
        isActive: !existing.isActive,
      },
    });

    revalidatePath("/recurrings");

    return { success: true };
  } catch (error) {
    console.error("Error toggling recurring:", error);
    return { success: false, error: "Error al cambiar el estado" };
  }
}
