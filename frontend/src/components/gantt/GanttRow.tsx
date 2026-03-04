import type { Task } from "../../types/task";
import { TaskBar } from "./TaskBar";
import { GANTT_CONFIG, diffInDays } from "./ganttUtils";

interface GanttRowProps {
  task: Task;
  timelineStartDate: string;
  memberColor: string;
}

export function GanttRow({ task, timelineStartDate, memberColor }: GanttRowProps) {
  const left = diffInDays(task.start_date, timelineStartDate) * GANTT_CONFIG.dayWidth;
  const width = (diffInDays(task.end_date, task.start_date) + 1) * GANTT_CONFIG.dayWidth;

  return (
    <div className="flex border-b border-gray-50" style={{ height: GANTT_CONFIG.rowHeight }}>
      <div className="w-[200px] flex-shrink-0 flex items-center px-6 text-xs text-gray-600 truncate border-r border-gray-100">
        <span className="truncate">{task.title}</span>
        <span className="ml-auto text-gray-400 flex-shrink-0">{task.man_days}d</span>
      </div>
      <div className="flex-1 relative">
        <TaskBar task={task} left={left} width={width} color={memberColor} />
      </div>
    </div>
  );
}
