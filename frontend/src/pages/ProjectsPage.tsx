import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectList, useProjectMutations } from "../hooks/useProjects";
import { ProjectCard } from "../components/projects/ProjectCard";
import { ProjectForm } from "../components/projects/ProjectForm";
import type { Project, ProjectCreate, ProjectUpdate, ProjectStatus } from "../types/project";

export function ProjectsPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "">("");
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useProjectList({
    status: statusFilter || undefined,
  });
  const { createMutation } = useProjectMutations();

  const handleCreate = (formData: ProjectCreate | ProjectUpdate) => {
    createMutation.mutate(formData as ProjectCreate, {
      onSuccess: () => setShowForm(false),
    });
  };

  const handleClick = (project: Project) => {
    navigate(`/projects/${project.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {([
            { value: "", label: "全て" },
            { value: "active", label: "進行中" },
            { value: "planning", label: "計画中" },
            { value: "completed", label: "完了" },
            { value: "on_hold", label: "保留" },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm ${
                statusFilter === opt.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          + 新規プロジェクト
        </button>
      </div>

      {isLoading ? (
        <div className="text-gray-500">読み込み中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.items.map((project) => (
            <ProjectCard key={project.id} project={project} onClick={handleClick} />
          ))}
        </div>
      )}

      {showForm && (
        <ProjectForm
          initialData={null}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          isSubmitting={createMutation.isPending}
        />
      )}
    </div>
  );
}
