interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
}

export function KpiCard({ title, value, subtitle, color }: KpiCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderLeftColor: color }}>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}
