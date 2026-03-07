import type { Budget, BudgetCategoryLimit, Category } from "@prisma/client";

// Budget con sus límites de categoría incluidos
export type BudgetWithLimits = Budget & {
  categoryLimits: (BudgetCategoryLimit & {
    category: Category;
  })[];
};

// Para indicadores de estado visual
export type BudgetStatus = "ok" | "warning" | "danger" | "exceeded";

// Datos de progreso de un presupuesto
export type BudgetProgress = {
  budgetId: string;
  name: string;
  totalAmount: number;
  totalSpent: number;
  percentage: number;
  status: BudgetStatus;
  startDate: Date;
  endDate: Date;
  categoryProgress: CategoryProgress[];
};

// Progreso de una categoría específica
export type CategoryProgress = {
  categoryId: string;
  categoryName: string;
  categoryIcon?: string | null;
  limit: number;
  spent: number;
  percentage: number;
  status: BudgetStatus;
};

// Resultado de queries agrupadas
export type CategorySpending = {
  categoryId: string;
  spent: number;
};

// Para el formulario
export type BudgetFormData = {
  name: string;
  totalAmount: string; // String para el input, se parsea después
  startDate: Date;
  endDate: Date;
  categoryLimits: {
    categoryId: string;
    amount: string;
  }[];
};

// Período predefinido
export type PeriodPreset = "this_month" | "next_month" | "this_quarter" | "custom";
