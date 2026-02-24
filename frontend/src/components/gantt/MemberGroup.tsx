import { useState } from "react";
import type { Task } from "../../types/task";
import type { Member } from "../../types/member";
import { GanttRow } from "./GanttRow";
import { GANTT_CONFIG } from "./GanttChart";

interface MemberGroupProps {
  member: Member;
  tasks: Task[];
  timelineStartDate: string;
}

export function MemberGroup({ member, tasks, timelineStartDate }: MemberGroupProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="border-b border-gray-100">
      <div
        className="flex items-center px-4 cursor-pointer hover:bg-gray-50"
        style={{ height: GANTT_CONFIG.rowHeight }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs mr-2"
          style={{ backgroundColor: member.avatar_color }}
        >
          {member.name[0]}
        </div>
        <span className="text-sm font-medium text-gray-700">{member.name}</span>
        <span className="ml-2 text-xs text-gray-400">({tasks.length})</span>
        <span className="ml-auto text-xs text-gray-400">{collapsed ? "+" : "-"}</span>
      </div>
      {!collapsed &&
        tasks.map((task) => (
          <GanttRow
            key={task.task_id}
            task={task}
            timelineStartDate={timelineStartDate}
            memberColor={member.avatar_color}
          />
        ))}
    </div>
  );
}
