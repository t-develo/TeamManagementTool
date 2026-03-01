import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import type { Project } from "../../types/project";
import type { Member } from "../../types/member";
import { GanttHeader } from "./GanttHeader";
import { MemberGroup } from "./MemberGroup";
import { useTaskMutations } from "../../hooks/useTasks";

export const GANTT_CONFIG = { dayWidth: 32, rowHeight: 40, headerHeight: 72 };

export function diffInDays(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  return Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

interface GanttChartProps {
  project: Project;
  members: Member[];
}

export function GanttChart({ project, members }: GanttChartProps) {
  const { updateMutation } = useTaskMutations(project.id);

  const allDates = project.tasks.flatMap((t) => [t.start_date, t.end_date]);
  if (allDates.length === 0) {
    return <div className="text-gray-500 text-sm p-4">タスクがありません</div>;
  }
  allDates.push(project.start_date, project.end_date);
  const sorted = [...allDates].sort();
  const timelineStart = sorted[0];
  const timelineEnd = sorted[sorted.length - 1];
  const totalDays = diffInDays(timelineEnd, timelineStart) + 1;
  const timelineWidth = totalDays * GANTT_CONFIG.dayWidth;

  const memberMap = new Map(members.map((m) => [m.id, m]));
  const assigneeIds = [...new Set(project.tasks.map((t) => t.assignee_id))];
  const groupedTasks = assigneeIds.map((id) => ({
    member: memberMap.get(id),
    tasks: project.tasks
      .filter((t) => t.assignee_id === id)
      .sort((a, b) => a.sort_order - b.sort_order),
  }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const taskId = active.id as string;
    const dayOffset = Math.round(delta.x / GANTT_CONFIG.dayWidth);
    if (dayOffset === 0) return;

    const task = project.tasks.find((t) => t.task_id === taskId);
    if (!task) return;

    updateMutation.mutate({
      taskId,
      data: {
        start_date: addDays(task.start_date, dayOffset),
        end_date: addDays(task.end_date, dayOffset),
      },
    });
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="border rounded-lg bg-white overflow-x-auto">
        <div style={{ minWidth: `${timelineWidth + 200}px` }}>
          <GanttHeader startDate={timelineStart} endDate={timelineEnd} />
          {groupedTasks.map(({ member, tasks }) => (
            <MemberGroup
              key={member?.id || "unknown"}
              member={member || { id: "unknown", name: "不明", avatar_color: "#999", email: "", department: "", role: "", cost_per_month: 0, is_active: true, created_at: "", updated_at: "" }}
              tasks={tasks}
              timelineStartDate={timelineStart}
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
}
