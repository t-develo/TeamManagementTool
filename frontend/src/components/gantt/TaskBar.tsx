import { useDraggable } from "@dnd-kit/core";
import type { Task } from "../../types/task";
import { GANTT_CONFIG } from "./GanttChart";

interface TaskBarProps {
  task: Task;
  left: number;
  width: number;
  color: string;
}

export function TaskBar({ task, left, width, color }: TaskBarProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.task_id,
  });

  const style: React.CSSProperties = {
    position: "absolute",
    left: `${left}px`,
    width: `${width}px`,
    height: `${GANTT_CONFIG.rowHeight - 8}px`,
    top: "4px",
    transform: transform ? `translate3d(${transform.x}px, 0, 0)` : undefined,
    zIndex: transform ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={style} className="cursor-grab active:cursor-grabbing">
      <div className="relative w-full h-full rounded-md overflow-hidden" style={{ backgroundColor: `${color}33` }}>
        <div
          className="absolute left-0 top-0 h-full rounded-md"
          style={{ width: `${task.progress}%`, backgroundColor: color }}
        />
        <span
          className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium truncate px-1"
          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
        >
          {task.title}
        </span>
      </div>
    </div>
  );
}
