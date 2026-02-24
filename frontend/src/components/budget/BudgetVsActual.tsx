import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from "recharts";

interface BudgetVsActualProps {
  data: { project_name: string; budget: number; actual_cost: number }[];
}

export function BudgetVsActualChart({ data }: BudgetVsActualProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">予算 vs 実績</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="project_name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value: number) => `${value.toFixed(1)}万`} />
          <Legend />
          <Bar dataKey="budget" name="予算" fill="#3B82F6" />
          <Bar dataKey="actual_cost" name="実績" fill="#F59E0B" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
