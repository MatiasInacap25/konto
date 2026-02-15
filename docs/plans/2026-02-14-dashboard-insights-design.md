# Dashboard Enhancement: Insights & Trends

**Date:** 2026-02-14  
**Status:** Validated - Ready for Implementation  
**Author:** AI Design Session

---

## Overview

Add visual insights and trends to transform the dashboard from a data display into an actionable financial overview. Focus on answering "What does this mean for me?" rather than just showing numbers.

---

## Goals

1. Provide immediate financial context through trend visualization
2. Surface actionable insights without overwhelming the user
3. Detect patterns and anomalies automatically
4. Maintain clean, scannable layout (YAGNI principle)

---

## Architecture

### Component Structure

```
DashboardContent
├── Stats Cards (existing - 4 cards)
├── TrendChart (NEW - full-width line chart)
├── InsightsPanel (NEW - 2-3 column grid)
│   └── InsightCard[] (6 variants)
└── Grid 2-columns (existing)
    ├── RecentTransactions
    └── UpcomingRecurrings
```

### New Components

#### TrendChart
- **Type:** Server Component
- **Props:** `data: MonthlyData[], currency: string`
- **Library:** Recharts (AreaChart with ResponsiveContainer)
- **Data:** Last 6 months of income vs expenses
- **Visual:** Green area for income, red area for expenses, custom tooltip

#### InsightsPanel
- **Type:** Server Component  
- **Props:** `insights: Insight[], workspaceId: string`
- **Layout:** CSS Grid (3 cols desktop, 2 tablet, 1 mobile)
- **Logic:** Dynamic ordering by priority, auto-hides if no insights apply

#### InsightCard
- **Type:** Server Component
- **Props:**
  ```typescript
  type InsightCardProps = {
    type: "alert" | "trend" | "success" | "info";
    title: string;
    description: string;
    value?: string;
    trend?: "up" | "down" | "neutral";
    action?: { label: string; href: string };
  };
  ```
- **Visual Variants:**
  - `alert`: Amber background, AlertTriangle icon
  - `trend`: Blue background, TrendingUp/Down icon  
  - `success`: Green background, Wallet/PiggyBank icon
  - `info`: Neutral background, Info icon

---

## Data Requirements

### Extended Query: `getWorkspaceWithDashboardData`

```typescript
type DashboardData = {
  // Existing
  workspace: Workspace;
  stats: Stats;
  recentTransactions: Transaction[];
  upcomingRecurrings: Recurring[];
  
  // NEW
  monthlyTrend: {
    month: string;      // "Jan", "Feb", etc.
    income: number;
    expense: number;
  }[];
  insights: Insight[];
};

type Insight = {
  id: string;
  priority: number;     // 1-6, lower = higher priority
  type: "alert" | "trend" | "success" | "info";
  title: string;
  description: string;
  value?: string;
  trend?: "up" | "down" | "neutral";
  action?: { label: string; href: string };
};
```

### Query Strategy

All data fetched in parallel using `Promise.all`:

1. **Stats** (existing): Current totals, counts
2. **Monthly Trend**: Aggregate transactions by month (last 6 months)
3. **Insight Calculations**: Pattern detection logic

### Database Queries Needed

```sql
-- Monthly trend (simplified)
SELECT 
  DATE_TRUNC('month', date) as month,
  SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as income,
  SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as expense
FROM transactions
WHERE workspace_id = $1 AND date >= NOW() - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', date)
ORDER BY month;
```

---

## Insights Specification

### 1. Subscription Alert (Priority: 1)

**Trigger:** Duplicate recurring payments OR price increase detected

**Logic:**
- Compare recurring payments by normalized name (fuzzy matching)
- Flag if similar names with different amounts
- Track month-over-month price changes > 10%

**Display:**
- Type: `alert`
- Title: "Suscripción duplicada detectada"
- Description: "Netflix aparece 2 veces: $4.500 + $5.200"
- Action: { label: "Verificar", href: "/recurrings" }

**Empty State:** Don't show if no duplicates found

---

### 2. Savings Rate (Priority: 2)

**Trigger:** Always show if monthly income > 0

**Logic:**
```typescript
const savingsRate = ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100;
```

**Display:**
- Type: `success`
- Title: "Tasa de ahorro"
- Description: "Estás ahorrando el 23% de tus ingresos"
- Trend: "up" if rate > previous month, "down" if lower

**Edge Cases:**
- Negative savings: "Estás gastando más de lo que ingresa"
- 0% savings: "Sin ahorro este mes"

---

### 3. Month Comparison (Priority: 3)

**Trigger:** Always show (if previous month has data)

**Logic:**
```typescript
const change = ((currentMonthExpense - previousMonthExpense) / previousMonthExpense) * 100;
```

**Display:**
- Type: `trend`
- Title: change > 0 ? "Gastos crecieron" : "Gastos bajaron"
- Description: "Gastaste 12% más que en enero"
- Value: "+$23.000" or "-$15.000"
- Trend: "up" for increase, "down" for decrease

---

### 4. Category Highlight (Priority: 4)

**Trigger:** Any category changed > 20% vs previous month

**Logic:**
- Group expenses by category for current month
- Compare with same categories previous month
- Find max absolute change

**Display:**
- Type: `trend`
- Title: "Categoría destacada"
- Description: "Comida creció 35% este mes"
- Action: { label: "Ver transacciones", href: "/transactions?category=comida" }

**Empty State:** Don't show if all categories within 20% threshold

---

### 5. Recurring Impact (Priority: 5)

**Trigger:** Recurring expenses > 15% of monthly income

**Logic:**
```typescript
const recurringTotal = sum(activeRecurrings.filter(r => r.type === 'EXPENSE'));
const impact = (recurringTotal / monthlyIncome) * 100;
```

**Display:**
- Type: `info`
- Title: "Impacto de suscripciones"
- Description: "Tus suscripciones representan el 18% de tus ingresos"
- Value: "$89.000/mes"

**Empty State:** Don't show if impact < 15%

---

### 6. Top Merchant (Priority: 6)

**Trigger:** Always show (if any expenses this month)

**Logic:**
- Group transactions by merchant/payee
- Find highest total amount
- Calculate % of monthly expenses

**Display:**
- Type: `info`
- Title: "Mayor gasto del mes"
- Description: "Mercado Libre: $127.000"
- Value: "28% de tus gastos"
- Action: { label: "Ver detalle", href: "/transactions?search=mercado%20libre" }

---

## Visual Design

### Layout

```
+------------------------------------------+
|  Dashboard Header                        |
+------------------------------------------+
|  [Stats] [Stats] [Stats] [Stats]         |
+------------------------------------------+
|                                          |
|  [================ TrendChart =========] |
|                                          |
+------------------------------------------+
|  [Insight] [Insight] [Insight]           |
|  [Insight] [Insight] [Insight]           |
+------------------------------------------+
|  [Recent Txns        ] [Recurrings    ]  |
|  [                   ] [               ]  |
+------------------------------------------+
```

### Responsive Breakpoints

- **Desktop (>=1024px):** 4 stats cards, 3 insight columns, TrendChart full width
- **Tablet (768px-1023px):** 2 stats rows, 2 insight columns
- **Mobile (<768px):** 1 column everything, horizontal scroll for stats

### Colors

Using existing Tailwind theme:
- Income/Success: `text-green-600`, `bg-green-100`
- Expense/Alert: `text-red-600`, `bg-red-100`
- Warning/Amber: `text-amber-600`, `bg-amber-100`
- Info/Neutral: `text-blue-600`, `bg-blue-100`

---

## Error Handling

### Strategy: Graceful Degradation

Each insight calculated in isolation. Failure of one doesn't affect others:

```typescript
const insights: Insight[] = [];

try {
  insights.push(calculateSavingsRate(data));
} catch (e) {
  console.error("Savings rate calculation failed:", e);
  // Continue without this insight
}

try {
  insights.push(calculateMonthComparison(data));
} catch (e) {
  console.error("Month comparison failed:", e);
}
// ... etc
```

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| New user (no history) | Hide TrendChart and InsightsPanel, show empty state CTA |
| Partial data (1-2 months) | TrendChart shows available months, Insights adjust |
| Zero income | Savings rate shows "Sin ingresos registrados" |
| All insights fail | Panel collapses, dashboard continues working |
| Network error on query | Existing error boundary catches, shows error message |

### Empty States

**TrendChart (no data):**
```
[                                ]
[    📊                          ]
[    Creá transacciones para     ]
[    ver tu tendencia mensual    ]
[                                ]
```

**InsightsPanel (no insights):**
- Entire panel hidden (`return null`)
- Dashboard layout adjusts automatically

---

## Performance Considerations

### Server-Side

- Single query with parallel sub-queries (no N+1)
- Use database aggregations (SUM, COUNT) instead of JS calculations
- Cache insight calculations for 5 minutes (optional future enhancement)

### Client-Side

- Recharts tree-shakes well (only import needed components)
- Chart renders SVG (no canvas overhead)
- No additional client-side data fetching
- Skeleton already handled by existing DashboardSkeleton

### Bundle Impact

- Recharts: ~100kb gzipped (acceptable for dashboard value)
- New components: ~5kb total
- Consider dynamic import if bundle size becomes issue

---

## Implementation Order

1. **Install dependency:** `npm install recharts`
2. **Extend query:** Update `getWorkspaceWithDashboardData` with monthly data
3. **Create InsightCard:** Base component with variants
4. **Create TrendChart:** Area chart with 6-month data
5. **Create InsightsPanel:** Grid layout with priority ordering
6. **Calculate insights:** Implement 6 insight algorithms
7. **Integrate:** Add to DashboardContent
8. **Test:** Edge cases, responsive, empty states

---

## Testing Checklist

- [ ] TrendChart renders with 6 months of data
- [ ] TrendChart empty state for new users
- [ ] Each insight type renders correct variant
- [ ] Insights ordered by priority
- [ ] Grid responsive (3/2/1 columns)
- [ ] Individual insight failure doesn't break others
- [ ] All 6 insights calculate correctly with test data
- [ ] Currency formatting matches workspace setting
- [ ] Dark mode colors work correctly
- [ ] Mobile layout usable

---

## Future Enhancements (Out of Scope)

- Interactive chart (zoom, time range selector)
- Click on chart to filter transactions
- Custom insight thresholds (user-configurable)
- Export chart as image
- Compare multiple workspaces
- Predictive insights (ML-based spending forecasts)

---

## Decision Log

| Decision | Rationale |
|----------|-----------|
| Recharts over Chart.js/D3 | Best React integration, SSR-friendly, good defaults |
| 6 months trend | Enough context, not overwhelming, matches insight relevance |
| 6 insights max | Maintains scannability, prioritized by value |
| Server components | No hydration delay, simpler data flow |
| Graceful degradation | Dashboard must work even if insights fail |
| Dynamic grid | Hides empty insights automatically |
