import { GANTT_CONFIG, diffInDays } from "./GanttChart";

interface GanttHeaderProps {
  startDate: string;
  endDate: string;
}

export function GanttHeader({ startDate, endDate }: GanttHeaderProps) {
  const months: { label: string; days: number }[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  let current = new Date(start);

  while (current <= end) {
    const year = current.getFullYear();
    const month = current.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const displayStart = current > monthStart ? current : monthStart;
    const displayEnd = monthEnd > end ? end : monthEnd;
    const days = diffInDays(
      displayEnd.toISOString().split("T")[0],
      displayStart.toISOString().split("T")[0]
    ) + 1;

    months.push({ label: `${year}/${month + 1}`, days });
    current = new Date(year, month + 1, 1);
  }

  const today = new Date().toISOString().split("T")[0];
  const todayOffset = diffInDays(today, startDate);
  const totalDays = diffInDays(endDate, startDate) + 1;

  return (
    <div
      className="relative border-b border-gray-200 bg-gray-50"
      style={{ height: GANTT_CONFIG.headerHeight, marginLeft: 200 }}
    >
      <div className="flex h-full">
        {months.map((m, i) => (
          <div
            key={i}
            className="border-r border-gray-200 flex items-center justify-center text-xs text-gray-600 font-medium"
            style={{ width: m.days * GANTT_CONFIG.dayWidth }}
          >
            {m.label}
          </div>
        ))}
      </div>
      {todayOffset >= 0 && todayOffset <= totalDays && (
        <div
          className="absolute top-0 bottom-0 border-l-2 border-red-500 z-10"
          style={{ left: todayOffset * GANTT_CONFIG.dayWidth }}
        />
      )}
    </div>
  );
}
