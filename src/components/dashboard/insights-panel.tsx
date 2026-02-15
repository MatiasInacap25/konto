import { InsightCard } from "./insight-card";
import type { Insight } from "@/types/insights";

type InsightsPanelProps = {
  insights: Insight[];
};

export function InsightsPanel({ insights }: InsightsPanelProps) {
  // Don't render if no insights
  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {insights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </div>
  );
}
