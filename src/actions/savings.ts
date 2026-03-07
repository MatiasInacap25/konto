"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import {
  serverGoalSchema,
  updateGoalSchema,
  serverContributeSchema,
  serverWithdrawSchema,
  deleteGoalSchema,
  type ServerGoalData,
  type UpdateGoalData,
  type ServerContributeData,
  type ServerWithdrawData,
  type DeleteGoalData,
} from "@/lib/validations/savings";

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
 * Create a new savings goal
 */
export async function createSavingsGoal(
  input: ServerGoalData
): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = serverGoalSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message || "Datos inválidos" };
    }

    const validInput = parsed.data;
    const { error, user, workspace } = await verifyAccess(validInput.workspaceId);
    if (error || !user || !workspace) {
      return { success: false, error: error || "No autorizado" };
    }

    // Validate deadline is in the future
    if (validInput.deadline && validInput.deadline <= new Date()) {
      return { success: false, error: "La fecha límite debe ser futura" };
    }

    // Create system account + goal in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create system account for the goal
      const account = await tx.account.create({
        data: {
          name: `💰 Meta: ${validInput.name}`,
          balance: 0,
          isBusiness: false,
          isSystem: true,
          workspaceId: validInput.workspaceId,
        },
      });

      // Create savings goal linked to account
      const goal = await tx.savingsGoal.create({
        data: {
          name: validInput.name,
          emoji: validInput.emoji,
          description: validInput.description,
          targetAmount: validInput.targetAmount,
          deadline: validInput.deadline,
          accountId: account.id,
          workspaceId: validInput.workspaceId,
        },
      });

      return goal;
    });

    revalidatePath("/savings");
    return { success: true, data: { id: result.id } };
  } catch (error) {
    console.error("Create savings goal failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al crear meta",
    };
  }
}

/**
 * Update an existing savings goal
 */
export async function updateSavingsGoal(
  input: UpdateGoalData
): Promise<ActionResult> {
  try {
    const parsed = updateGoalSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message || "Datos inválidos" };
    }

    const validInput = parsed.data;

    // Find goal and verify access
    const goal = await prisma.savingsGoal.findUnique({
      where: { id: validInput.id },
      include: { workspace: true },
    });

    if (!goal) {
      return { success: false, error: "Meta no encontrada" };
    }

    const { error, user } = await verifyAccess(goal.workspaceId);
    if (error || !user) {
      return { success: false, error: error || "No autorizado" };
    }

    // Cannot edit completed or cancelled goals
    if (goal.status === "COMPLETED" || goal.status === "CANCELLED") {
      return { success: false, error: "No se puede editar una meta completada o cancelada" };
    }

    // Validate deadline if provided
    if (validInput.deadline && validInput.deadline <= new Date()) {
      return { success: false, error: "La fecha límite debe ser futura" };
    }

    await prisma.savingsGoal.update({
      where: { id: validInput.id },
      data: {
        name: validInput.name,
        emoji: validInput.emoji,
        description: validInput.description,
        targetAmount: validInput.targetAmount,
        deadline: validInput.deadline,
      },
    });

    revalidatePath("/savings");
    return { success: true };
  } catch (error) {
    console.error("Update savings goal failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar meta",
    };
  }
}

/**
 * Delete a savings goal
 * If balance > 0, must transfer funds to returnAccountId first
 */
export async function deleteSavingsGoal(
  input: DeleteGoalData
): Promise<ActionResult> {
  try {
    const parsed = deleteGoalSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message || "Datos inválidos" };
    }

    const validInput = parsed.data;

    // Find goal and verify access
    const goal = await prisma.savingsGoal.findUnique({
      where: { id: validInput.goalId },
      include: { account: true, workspace: true },
    });

    if (!goal) {
      return { success: false, error: "Meta no encontrada" };
    }

    const { error, user } = await verifyAccess(goal.workspaceId);
    if (error || !user) {
      return { success: false, error: error || "No autorizado" };
    }

    const balance = Number(goal.account.balance);

    // If balance > 0, must provide returnAccountId
    if (balance > 0) {
      if (!validInput.returnAccountId) {
        return { success: false, error: "Debés especificar dónde devolver los fondos" };
      }

      // Verify return account exists and belongs to same workspace
      const returnAccount = await prisma.account.findFirst({
        where: {
          id: validInput.returnAccountId,
          workspaceId: goal.workspaceId,
        },
      });

      if (!returnAccount) {
        return { success: false, error: "Cuenta de retorno no encontrada" };
      }

      if (returnAccount.isSystem) {
        return { success: false, error: "No se puede devolver fondos a otra meta" };
      }

      // Transfer funds + delete goal in transaction
      await prisma.$transaction(async (tx) => {
        // Create transfer transaction
        await tx.transaction.create({
          data: {
            amount: balance,
            date: new Date(),
            description: `Retiro de meta cancelada: ${goal.name}`,
            type: "EXPENSE",
            scope: "PERSONAL",
            accountId: goal.accountId,
            workspaceId: goal.workspaceId,
          },
        });

        // Decrease goal account balance (should reach 0)
        await tx.account.update({
          where: { id: goal.accountId },
          data: { balance: { decrement: balance } },
        });

        // Increase return account balance
        await tx.account.update({
          where: { id: validInput.returnAccountId },
          data: { balance: { increment: balance } },
        });

        // Mark goal as cancelled before deleting
        await tx.savingsGoal.update({
          where: { id: validInput.goalId },
          data: { status: "CANCELLED" },
        });

        // Delete goal (cascade will delete account)
        await tx.savingsGoal.delete({
          where: { id: validInput.goalId },
        });
      });
    } else {
      // Balance is 0, just delete
      await prisma.savingsGoal.delete({
        where: { id: validInput.goalId },
      });
    }

    revalidatePath("/savings");
    return { success: true };
  } catch (error) {
    console.error("Delete savings goal failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al eliminar meta",
    };
  }
}

/**
 * Contribute to a savings goal (transfer FROM account TO goal)
 */
export async function contributeToGoal(
  input: ServerContributeData
): Promise<ActionResult> {
  try {
    const parsed = serverContributeSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message || "Datos inválidos" };
    }

    const validInput = parsed.data;

    // Find goal and verify access
    const goal = await prisma.savingsGoal.findUnique({
      where: { id: validInput.goalId },
      include: { account: true, workspace: true },
    });

    if (!goal) {
      return { success: false, error: "Meta no encontrada" };
    }

    const { error, user } = await verifyAccess(goal.workspaceId);
    if (error || !user) {
      return { success: false, error: error || "No autorizado" };
    }

    // Cannot contribute to completed or cancelled goals
    if (goal.status !== "ACTIVE") {
      return { success: false, error: "Solo se puede aportar a metas activas" };
    }

    // Verify from account exists and has sufficient balance
    const fromAccount = await prisma.account.findFirst({
      where: {
        id: validInput.fromAccountId,
        workspaceId: goal.workspaceId,
      },
    });

    if (!fromAccount) {
      return { success: false, error: "Cuenta de origen no encontrada" };
    }

    if (fromAccount.isSystem) {
      return { success: false, error: "No se puede aportar desde otra meta" };
    }

    const fromBalance = Number(fromAccount.balance);
    if (fromBalance < validInput.amount) {
      return { success: false, error: "Saldo insuficiente en la cuenta de origen" };
    }

    // Transfer funds + check for auto-completion
    await prisma.$transaction(async (tx) => {
      // Create transfer transaction (visible as internal transfer)
      await tx.transaction.create({
        data: {
          amount: validInput.amount,
          date: validInput.date,
          description: `Aporte a meta: ${goal.name}`,
          type: "TRANSFER",
          scope: "PERSONAL",
          accountId: validInput.fromAccountId,
          workspaceId: goal.workspaceId,
        },
      });

      // Decrease from account
      await tx.account.update({
        where: { id: validInput.fromAccountId },
        data: { balance: { decrement: validInput.amount } },
      });

      // Increase goal account
      await tx.account.update({
        where: { id: goal.accountId },
        data: { balance: { increment: validInput.amount } },
      });

      // Check if goal is now completed
      const currentBalance = Number(goal.account.balance);
      const newBalance = currentBalance + validInput.amount;
      const targetAmount = Number(goal.targetAmount);

      if (newBalance >= targetAmount && goal.status === "ACTIVE") {
        await tx.savingsGoal.update({
          where: { id: validInput.goalId },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });
      }
    });

    revalidatePath("/savings");
    return { success: true };
  } catch (error) {
    console.error("Contribute to goal failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al aportar",
    };
  }
}

/**
 * Withdraw from a savings goal (transfer FROM goal TO account)
 */
export async function withdrawFromGoal(
  input: ServerWithdrawData
): Promise<ActionResult> {
  try {
    const parsed = serverWithdrawSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message || "Datos inválidos" };
    }

    const validInput = parsed.data;

    // Find goal and verify access
    const goal = await prisma.savingsGoal.findUnique({
      where: { id: validInput.goalId },
      include: { account: true, workspace: true },
    });

    if (!goal) {
      return { success: false, error: "Meta no encontrada" };
    }

    const { error, user } = await verifyAccess(goal.workspaceId);
    if (error || !user) {
      return { success: false, error: error || "No autorizado" };
    }

    const goalBalance = Number(goal.account.balance);
    if (goalBalance < validInput.amount) {
      return { success: false, error: "Saldo insuficiente en la meta" };
    }

    // Verify to account exists
    const toAccount = await prisma.account.findFirst({
      where: {
        id: validInput.toAccountId,
        workspaceId: goal.workspaceId,
      },
    });

    if (!toAccount) {
      return { success: false, error: "Cuenta de destino no encontrada" };
    }

    if (toAccount.isSystem) {
      return { success: false, error: "No se puede retirar a otra meta" };
    }

    // Transfer funds + check if should revert to ACTIVE
    await prisma.$transaction(async (tx) => {
      // Create transfer transaction (visible as internal transfer)
      await tx.transaction.create({
        data: {
          amount: validInput.amount,
          date: validInput.date,
          description: `Retiro de meta: ${goal.name}`,
          type: "TRANSFER",
          scope: "PERSONAL",
          accountId: validInput.toAccountId,
          workspaceId: goal.workspaceId,
        },
      });

      // Decrease goal account
      await tx.account.update({
        where: { id: goal.accountId },
        data: { balance: { decrement: validInput.amount } },
      });

      // Increase to account
      await tx.account.update({
        where: { id: validInput.toAccountId },
        data: { balance: { increment: validInput.amount } },
      });

      // If goal was COMPLETED and now balance < target, revert to ACTIVE
      const newBalance = goalBalance - validInput.amount;
      const targetAmount = Number(goal.targetAmount);

      if (goal.status === "COMPLETED" && newBalance < targetAmount) {
        await tx.savingsGoal.update({
          where: { id: validInput.goalId },
          data: {
            status: "ACTIVE",
            completedAt: null,
          },
        });
      }
    });

    revalidatePath("/savings");
    return { success: true };
  } catch (error) {
    console.error("Withdraw from goal failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al retirar",
    };
  }
}
