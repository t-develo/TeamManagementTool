import { useState, useEffect } from "react";
import type { Project, ProjectCreate, ProjectUpdate, ProjectStatus } from "../../types/project";

interface ProjectFormProps {
  initialData: Project | null;
  onSubmit: (data: ProjectCreate | ProjectUpdate) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function ProjectForm({ initialData, onSubmit, onCancel, isSubmitting }: ProjectFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [budget, setBudget] = useState(initialData?.budget ?? 100);
  const [status, setStatus] = useState<ProjectStatus>(initialData?.status ?? "planning");
  const [startDate, setStartDate] = useState(initialData?.start_date ?? "");
  const [endDate, setEndDate] = useState(initialData?.end_date ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
      setBudget(initialData.budget);
      setStatus(initialData.status);
      setStartDate(initialData.start_date);
      setEndDate(initialData.end_date);
    }
  }, [initialData]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "プロジェクト名は必須です";
    if (budget <= 0) errs.budget = "予算は0より大きい値を入力してください";
    if (!startDate) errs.startDate = "開始日は必須です";
    if (!endDate) errs.endDate = "終了日は必須です";
    if (startDate && endDate && endDate <= startDate) errs.endDate = "終了日は開始日より後にしてください";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ name: name.trim(), description: description.trim(), budget, status, start_date: startDate, end_date: endDate });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {initialData ? "プロジェクト編集" : "新規プロジェクト作成"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">プロジェクト名</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.name ? "border-red-500" : "border-gray-300"}`} />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">予算 (万円)</label>
              <input type="number" step="0.1" value={budget} onChange={(e) => setBudget(Number(e.target.value))}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.budget ? "border-red-500" : "border-gray-300"}`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="planning">計画中</option>
                <option value="active">進行中</option>
                <option value="completed">完了</option>
                <option value="on_hold">保留</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">開始日</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.startDate ? "border-red-500" : "border-gray-300"}`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">終了日</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.endDate ? "border-red-500" : "border-gray-300"}`} />
              {errors.endDate && <p className="mt-1 text-xs text-red-500">{errors.endDate}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">キャンセル</button>
            <button type="submit" disabled={isSubmitting}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {isSubmitting ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
