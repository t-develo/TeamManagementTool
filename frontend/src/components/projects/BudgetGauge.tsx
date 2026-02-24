interface BudgetGaugeProps {
  actual: number;
  budget: number;
}

export function BudgetGauge({ actual, budget }: BudgetGaugeProps) {
  const rate = budget > 0 ? (actual / budget) * 100 : 0;
  let color: string;
  if (rate < 70) color = "#3B82F6";
  else if (rate < 90) color = "#F59E0B";
  else color = "#EF4444";

  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>予算消化率 {Math.round(rate)}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(rate, 100)}%`, backgroundColor: color }} />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{actual.toFixed(1)}万</span>
        <span>{budget.toFixed(1)}万</span>
      </div>
    </div>
  );
}
