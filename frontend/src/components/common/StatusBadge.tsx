const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-100", text: "text-blue-700" },
  green: { bg: "bg-green-100", text: "text-green-700" },
  yellow: { bg: "bg-yellow-100", text: "text-yellow-700" },
  red: { bg: "bg-red-100", text: "text-red-700" },
  gray: { bg: "bg-gray-100", text: "text-gray-700" },
};

interface StatusBadgeProps {
  status: string;
  statusMap: Record<string, { label: string; color: string }>;
}

export function StatusBadge({ status, statusMap }: StatusBadgeProps) {
  const config = statusMap[status] || { label: status, color: "gray" };
  const colors = STATUS_COLORS[config.color] || STATUS_COLORS.gray;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      {config.label}
    </span>
  );
}

export const PROJECT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  planning: { label: "計画中", color: "blue" },
  active: { label: "進行中", color: "green" },
  completed: { label: "完了", color: "gray" },
  on_hold: { label: "保留", color: "yellow" },
};

export const TASK_STATUS_MAP: Record<string, { label: string; color: string }> = {
  not_started: { label: "未着手", color: "gray" },
  in_progress: { label: "進行中", color: "blue" },
  completed: { label: "完了", color: "green" },
};

export const MEMBER_STATUS_MAP: Record<string, { label: string; color: string }> = {
  true: { label: "アクティブ", color: "green" },
  false: { label: "無効", color: "red" },
};
