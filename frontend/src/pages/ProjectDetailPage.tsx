import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProject } from "../hooks/useProjects";
import { useMemberList } from "../hooks/useMembers";
import { useTaskMutations } from "../hooks/useTasks";
import { GanttChart } from "../components/gantt/GanttChart";
import { StatusBadge, PROJECT_STATUS_MAP, TASK_STATUS_MAP } from "../components/common/StatusBadge";
import { ProgressBar } from "../components/common/ProgressBar";
import { BudgetGauge } from "../components/projects/BudgetGauge";
import type { TaskCreate } from "../types/task";

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(id!);
  const { data: membersData } = useMemberList({ per_page: 100 });
  const { createMutation, deleteMutation } = useTaskMutations(id!);

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskManDays, setTaskManDays] = useState(5);
  const [taskStartDate, setTaskStartDate] = useState("");
  const [taskEndDate, setTaskEndDate] = useState("");

  if (isLoading) return <div className="text-gray-500">読み込み中...</div>;
  if (!project) return <div className="text-gray-500">プロジェクトが見つかりません</div>;

  const members = membersData?.items || [];

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      {
        title: taskTitle,
        assignee_id: taskAssignee,
        man_days: taskManDays,
        start_date: taskStartDate,
        end_date: taskEndDate,
        status: "not_started",
        progress: 0,
      } as TaskCreate,
      {
        onSuccess: () => {
          setShowTaskForm(false);
          setTaskTitle("");
          setTaskAssignee("");
          setTaskManDays(5);
          setTaskStartDate("");
          setTaskEndDate("");
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/projects")} className="text-gray-500 hover:text-gray-700 text-sm">
          &larr; プロジェクト一覧
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{project.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{project.description}</p>
          </div>
          <StatusBadge status={project.status} statusMap={PROJECT_STATUS_MAP} />
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500">期間</p>
            <p className="text-sm font-medium">{project.start_date} ~ {project.end_date}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">進捗</p>
            <ProgressBar value={project.progress} showLabel />
          </div>
          <div>
            <p className="text-xs text-gray-500">予算</p>
            <BudgetGauge actual={project.actual_cost} budget={project.budget} />
          </div>
          <div>
            <p className="text-xs text-gray-500">タスク数</p>
            <p className="text-sm font-medium">{project.tasks.length}件</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">ガントチャート</h3>
        <button
          onClick={() => setShowTaskForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          + タスク追加
        </button>
      </div>

      <GanttChart project={project} members={members} />

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h3 className="text-lg font-semibold text-gray-800 p-6 pb-3">タスク一覧</h3>
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">タスク名</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">担当者</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">工数</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">進捗</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">ステータス</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">期間</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {project.tasks.map((task) => (
              <tr key={task.task_id} className="hover:bg-gray-50">
                <td className="px-6 py-3 text-sm font-medium text-gray-800">{task.title}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{task.assignee_name || "-"}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{task.man_days}人日</td>
                <td className="px-6 py-3 w-32">
                  <ProgressBar value={task.progress} showLabel />
                </td>
                <td className="px-6 py-3">
                  <StatusBadge status={task.status} statusMap={TASK_STATUS_MAP} />
                </td>
                <td className="px-6 py-3 text-xs text-gray-500">{task.start_date} ~ {task.end_date}</td>
                <td className="px-6 py-3 text-right">
                  <button
                    onClick={() => deleteMutation.mutate(task.task_id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showTaskForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowTaskForm(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">タスク追加</h3>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">タスク名</label>
                <input type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">担当者</label>
                <select value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required>
                  <option value="">選択してください</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">工数 (人日)</label>
                <input type="number" step="0.5" value={taskManDays} onChange={(e) => setTaskManDays(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">開始日</label>
                  <input type="date" value={taskStartDate} onChange={(e) => setTaskStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">終了日</label>
                  <input type="date" value={taskEndDate} onChange={(e) => setTaskEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowTaskForm(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">キャンセル</button>
                <button type="submit" disabled={createMutation.isPending}
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {createMutation.isPending ? "追加中..." : "追加"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
