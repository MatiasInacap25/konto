/**
 * Types for dashboard insights and trend data
 */

export type InsightType = "alert" | "trend" | "success" | "info";
export type InsightTrend = "up" | "down" | "neutral";

export type Insight = {
  id: string;
  priority: number;
  type: InsightType;
  title: string;
  description: string;
  value?: string;
  trend?: InsightTrend;
  action?: {
    label: string;
    href: string;
  };
};

export type MonthlyTrendData = {
  month: string;
  monthKey: string; // YYYY-MM for sorting
  income: number;
  expense: number;
};

export type DailyTrendData = {
  day: string;
  dayKey: string; // YYYY-MM-DD for sorting
  income: number;
  expense: number;
};

export type TrendData = {
  monthly: MonthlyTrendData[];
  daily: DailyTrendData[];
};

export type DashboardInsightsData = {
  monthlyTrend: MonthlyTrendData[];
  dailyTrend: DailyTrendData[];
  insights: Insight[];
};
