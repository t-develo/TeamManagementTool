import { useState, useEffect } from "react";
import type { Member, MemberCreate, MemberUpdate } from "../../types/member";

interface MemberFormProps {
  initialData: Member | null;
  onSubmit: (data: MemberCreate | MemberUpdate) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const PRESET_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16",
];

export function MemberForm({ initialData, onSubmit, onCancel, isSubmitting }: MemberFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [department, setDepartment] = useState(initialData?.department ?? "");
  const [role, setRole] = useState(initialData?.role ?? "");
  const [costPerMonth, setCostPerMonth] = useState(initialData?.cost_per_month ?? 50);
  const [avatarColor, setAvatarColor] = useState(initialData?.avatar_color ?? "#3B82F6");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setEmail(initialData.email);
      setDepartment(initialData.department);
      setRole(initialData.role);
      setCostPerMonth(initialData.cost_per_month);
      setAvatarColor(initialData.avatar_color);
    }
  }, [initialData]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "名前は必須です";
    if (!email.trim()) errs.email = "メールは必須です";
    if (!department.trim()) errs.department = "部署は必須です";
    if (!role.trim()) errs.role = "役割は必須です";
    if (costPerMonth <= 0) errs.costPerMonth = "コストは0より大きい値を入力してください";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      name: name.trim(),
      email: email.trim(),
      department: department.trim(),
      role: role.trim(),
      cost_per_month: costPerMonth,
      avatar_color: avatarColor,
      is_active: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {initialData ? "メンバー編集" : "新規メンバー登録"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.name ? "border-red-500" : "border-gray-300"}`} />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.email ? "border-red-500" : "border-gray-300"}`} />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">部署</label>
              <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.department ? "border-red-500" : "border-gray-300"}`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">役割</label>
              <input type="text" value={role} onChange={(e) => setRole(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.role ? "border-red-500" : "border-gray-300"}`} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">コスト (万円/月)</label>
            <input type="number" step="0.1" value={costPerMonth} onChange={(e) => setCostPerMonth(Number(e.target.value))}
              className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.costPerMonth ? "border-red-500" : "border-gray-300"}`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">アバターカラー</label>
            <div className="flex gap-2">
              {PRESET_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setAvatarColor(c)}
                  className={`w-8 h-8 rounded-full border-2 ${avatarColor === c ? "border-gray-800" : "border-transparent"}`}
                  style={{ backgroundColor: c }} />
              ))}
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
