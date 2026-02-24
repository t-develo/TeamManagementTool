import { useDashboard } from "../hooks/useDashboard";
import { KpiCard } from "../components/common/KpiCard";
import { ProgressBar } from "../components/common/ProgressBar";
import { StatusBadge, PROJECT_STATUS_MAP } from "../components/common/StatusBadge";

export function DashboardPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return <div className="text-gray-500">読み込み中...</div>;
  }

  if (!data) {
    return <div className="text-gray-500">データがありません</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-6">
        <KpiCard title="総プロジェクト数" value={data.total_projects} color="#3B82F6" />
        <KpiCard title="進行中" value={data.active_projects} color="#10B981" />
        <KpiCard title="総メンバー数" value={data.total_members} color="#8B5CF6" />
        <KpiCard
          title="予算消化率"
          value={`${data.budget_consumption_rate.toFixed(1)}%`}
          color={data.budget_consumption_rate >= 90 ? "#EF4444" : data.budget_consumption_rate >= 70 ? "#F59E0B" : "#10B981"}
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">プロジェクト進捗</h3>
        <div className="space-y-4">
          {data.project_summaries.map((p) => (
            <div key={p.project_id} className="flex items-center gap-4">
              <div className="w-48 flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 truncate">{p.project_name}</span>
                <StatusBadge status={p.status} statusMap={PROJECT_STATUS_MAP} />
              </div>
              <div className="flex-1">
                <ProgressBar value={p.progress} showLabel />
              </div>
              <div className="w-32 text-right text-sm text-gray-500">
                {p.actual_cost.toFixed(1)}万 / {p.budget.toFixed(1)}万
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
