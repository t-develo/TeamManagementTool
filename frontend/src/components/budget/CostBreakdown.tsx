import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface CostBreakdownItem {
  name: string;
  cost: number;
  color: string;
}

interface CostBreakdownProps {
  data: CostBreakdownItem[];
  title: string;
}

export function CostBreakdown({ data, title }: CostBreakdownProps) {
  const total = data.reduce((sum, d) => sum + d.cost, 0);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={data}
            dataKey="cost"
            nameKey="name"
            innerRadius={60}
            outerRadius={120}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => `${value.toFixed(1)}万`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center text-sm text-gray-500 mt-2">合計: {total.toFixed(1)}万</div>
    </div>
  );
}
