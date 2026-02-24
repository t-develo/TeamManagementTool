import { KpiCard } from "../common/KpiCard";

interface BudgetSummaryProps {
  totalBudget: number;
  totalActualCost: number;
  remaining: number;
  consumptionRate: number;
}

export function BudgetSummary({ totalBudget, totalActualCost, remaining, consumptionRate }: BudgetSummaryProps) {
  let rateColor: string;
  if (consumptionRate < 70) rateColor = "#10B981";
  else if (consumptionRate < 90) rateColor = "#F59E0B";
  else rateColor = "#EF4444";

  return (
    <div className="grid grid-cols-4 gap-6">
      <KpiCard title="総予算" value={`${totalBudget.toFixed(1)}万`} color="#3B82F6" />
      <KpiCard title="実績コスト" value={`${totalActualCost.toFixed(1)}万`} color="#F59E0B" />
      <KpiCard title="残予算" value={`${remaining.toFixed(1)}万`} color="#10B981" />
      <KpiCard title="消化率" value={`${consumptionRate.toFixed(1)}%`} color={rateColor} />
    </div>
  );
}
