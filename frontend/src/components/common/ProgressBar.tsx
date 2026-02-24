interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, max = 100, color = "#3B82F6", showLabel = false }: ProgressBarProps) {
  const percent = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && <span className="text-xs text-gray-600 min-w-[3rem] text-right">{Math.round(percent)}%</span>}
    </div>
  );
}
