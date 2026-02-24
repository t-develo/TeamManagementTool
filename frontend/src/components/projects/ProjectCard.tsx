import type { Project } from "../../types/project";
import { ProgressBar } from "../common/ProgressBar";
import { StatusBadge, PROJECT_STATUS_MAP } from "../common/StatusBadge";
import { BudgetGauge } from "./BudgetGauge";

interface ProjectCardProps {
  project: Project;
  onClick: (project: Project) => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const uniqueAssignees = [...new Set(project.tasks.map((t) => t.assignee_id))];

  return (
    <div
      className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick(project)}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800 truncate">{project.name}</h3>
        <StatusBadge status={project.status} statusMap={PROJECT_STATUS_MAP} />
      </div>
      <p className="text-sm text-gray-500 mb-3">
        {project.start_date} ~ {project.end_date}
      </p>
      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>進捗</span>
          <span>{project.progress}%</span>
        </div>
        <ProgressBar value={project.progress} />
      </div>
      <BudgetGauge actual={project.actual_cost} budget={project.budget} />
      <div className="mt-3 flex items-center">
        <div className="flex -space-x-2">
          {uniqueAssignees.slice(0, 5).map((id) => {
            const task = project.tasks.find((t) => t.assignee_id === id);
            return (
              <div
                key={id}
                className="w-7 h-7 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white text-xs"
                title={task?.assignee_name || id}
              >
                {(task?.assignee_name || "?")[0]}
              </div>
            );
          })}
        </div>
        {uniqueAssignees.length > 5 && (
          <span className="ml-2 text-xs text-gray-500">+{uniqueAssignees.length - 5}</span>
        )}
      </div>
    </div>
  );
}
