/**
 * Savings goal types for the savings module
 */

import type { $Enums } from "@prisma/client";

type GoalStatus = $Enums.GoalStatus;

export type GoalItem = {
  id: string;
  name: string;
  emoji: string | null;
  description: string | null;
  targetAmount: number;
  currentBalance: number;
  deadline: Date | null;
  status: GoalStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  accountId: string;
};

export type GoalFormData = {
  name: string;
  emoji?: string;
  description?: string;
  targetAmount: string;
  deadline?: Date;
};

export type GoalProgress = {
  percentage: number; // 0-100
  isCompleted: boolean;
  remaining: number;
  monthlyNeeded?: number; // Only if deadline is set
  isOnTrack?: boolean; // Only if deadline is set
  monthsLeft?: number; // Only if deadline is set
};

export type GoalWithProgress = GoalItem & {
  progress: GoalProgress;
};

// For account selection dropdowns (excludes system accounts)
export type AccountOption = {
  id: string;
  name: string;
  balance: number;
};

// Dashboard summary
export type SavingsSummary = {
  totalSaved: number;
  activeGoalsCount: number;
  completedGoalsCount: number;
  nextDeadline: Date | null;
  nextDeadlineGoalName: string | null;
};

// Status labels in Spanish
export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  ACTIVE: "Activo",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

// Status colors for badges
export const GOAL_STATUS_COLORS: Record<GoalStatus, string> = {
  ACTIVE: "blue",
  COMPLETED: "green",
  CANCELLED: "gray",
};
