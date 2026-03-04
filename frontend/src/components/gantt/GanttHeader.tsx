import { GANTT_CONFIG, diffInDays } from "./ganttUtils";

const MONTH_ROW_HEIGHT = 28;
const DAY_ROW_HEIGHT = GANTT_CONFIG.headerHeight - MONTH_ROW_HEIGHT;

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
    const days =
      diffInDays(
        displayEnd.toISOString().split("T")[0],
        displayStart.toISOString().split("T")[0]
      ) + 1;
    months.push({ label: `${year}/${month + 1}`, days });
    current = new Date(year, month + 1, 1);
  }

  const allDays: { dayNum: number; isWeekend: boolean }[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const dow = cursor.getDay();
    allDays.push({ dayNum: cursor.getDate(), isWeekend: dow === 0 || dow === 6 });
    cursor.setDate(cursor.getDate() + 1);
  }

  const today = new Date().toISOString().split("T")[0];
  const todayOffset = diffInDays(today, startDate);
  const totalDays = diffInDays(endDate, startDate) + 1;

  return (
    <div
      className="relative border-b border-gray-200 bg-gray-50"
      style={{ height: GANTT_CONFIG.headerHeight, marginLeft: 200 }}
    >
      {/* 上段: 月ラベル */}
      <div className="flex border-b border-gray-200" style={{ height: MONTH_ROW_HEIGHT }}>
        {months.map((m, i) => (
          <div
            key={i}
            className="flex-shrink-0 border-r border-gray-200 flex items-center justify-center text-xs text-gray-600 font-semibold"
            style={{ width: m.days * GANTT_CONFIG.dayWidth }}
          >
            {m.label}
          </div>
        ))}
      </div>
      {/* 下段: 日番号 */}
      <div className="flex" style={{ height: DAY_ROW_HEIGHT }}>
        {allDays.map((day, i) => (
          <div
            key={i}
            className={`flex-shrink-0 border-r border-gray-100 flex items-center justify-center text-[10px] ${
              day.isWeekend ? "bg-gray-100 text-gray-400" : "text-gray-500"
            }`}
            style={{ width: GANTT_CONFIG.dayWidth }}
          >
            {day.dayNum}
          </div>
        ))}
      </div>
      {/* 今日の赤線 */}
      {todayOffset >= 0 && todayOffset <= totalDays && (
        <div
          className="absolute top-0 bottom-0 border-l-2 border-red-500 z-10"
          style={{ left: todayOffset * GANTT_CONFIG.dayWidth }}
        />
      )}
    </div>
  );
}
