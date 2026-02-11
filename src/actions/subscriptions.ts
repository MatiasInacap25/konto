"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type RegisterPaymentResult = {
  success: boolean;
  error?: string;
  transactionId?: string;
};

/**
 * Registra el pago de una suscripción vencida.
 * 
 * 1. Crea una transacción con el monto de la suscripción
 * 2. Actualiza la fecha del próximo pago según la frecuencia
 * 3. Actualiza el balance de la cuenta (si existe una cuenta por defecto)
 */
export async function registerSubscriptionPayment(
  subscriptionId: string,
  workspaceId: string
): Promise<RegisterPaymentResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "No autenticado" };
    }

    // Obtener la suscripción
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        workspaceId: workspaceId,
        workspace: {
          userId: user.id,
        },
      },
      include: {
        workspace: {
          include: {
            accounts: {
              take: 1, // Usar la primera cuenta disponible
            },
          },
        },
        category: true,
      },
    });

    if (!subscription) {
      return { success: false, error: "Suscripción no encontrada" };
    }

    if (!subscription.workspace.accounts[0]) {
      return { success: false, error: "No hay cuentas disponibles para registrar el pago" };
    }

    const account = subscription.workspace.accounts[0];

    // Calcular la próxima fecha de pago según la frecuencia
    const nextPayment = calculateNextPayment(
      subscription.nextPayment,
      subscription.frequency
    );

    // Crear la transacción y actualizar la suscripción en una transacción de DB
    const result = await prisma.$transaction(async (tx) => {
      // Crear la transacción
      const transaction = await tx.transaction.create({
        data: {
          amount: subscription.amount,
          date: subscription.nextPayment, // Fecha original del pago
          description: `Pago suscripción: ${subscription.name}`,
          type: subscription.type,
          scope: subscription.scope,
          accountId: account.id,
          categoryId: subscription.categoryId,
          workspaceId: workspaceId,
        },
      });

      // Actualizar el balance de la cuenta
      const balanceChange = subscription.type === "EXPENSE" 
        ? -Number(subscription.amount)
        : Number(subscription.amount);

      await tx.account.update({
        where: { id: account.id },
        data: {
          balance: {
            increment: balanceChange,
          },
        },
      });

      // Actualizar la fecha del próximo pago de la suscripción
      await tx.subscription.update({
        where: { id: subscriptionId },
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
    console.error("Error registering subscription payment:", error);
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
