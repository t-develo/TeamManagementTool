import { useDashboard } from "../hooks/useDashboard";
import { BudgetSummary } from "../components/budget/BudgetSummary";
import { BudgetVsActualChart } from "../components/budget/BudgetVsActual";
import { CostBreakdown } from "../components/budget/CostBreakdown";

const MEMBER_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"];

export function BudgetPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <div className="text-gray-500">読み込み中...</div>;
  if (!data) return <div className="text-gray-500">データがありません</div>;

  const remaining = data.total_budget - data.total_actual_cost;

  const chartData = data.project_summaries.map((p) => ({
    project_name: p.project_name,
    budget: p.budget,
    actual_cost: p.actual_cost,
  }));

  const costBreakdownData = data.project_summaries.map((p, i) => ({
    name: p.project_name,
    cost: p.actual_cost,
    color: MEMBER_COLORS[i % MEMBER_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <BudgetSummary
        totalBudget={data.total_budget}
        totalActualCost={data.total_actual_cost}
        remaining={remaining}
        consumptionRate={data.budget_consumption_rate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetVsActualChart data={chartData} />
        <CostBreakdown data={costBreakdownData} title="プロジェクト別コスト内訳" />
      </div>
    </div>
  );
}
