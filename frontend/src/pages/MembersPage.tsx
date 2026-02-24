import { useState } from "react";
import { useMemberList, useMemberMutations } from "../hooks/useMembers";
import { MemberForm } from "../components/members/MemberForm";
import { UtilizationBar } from "../components/members/UtilizationBar";
import { StatusBadge, MEMBER_STATUS_MAP } from "../components/common/StatusBadge";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import type { Member, MemberCreate, MemberUpdate, MemberListParams } from "../types/member";

export function MembersPage() {
  const [params, setParams] = useState<MemberListParams>({ page: 1, per_page: 20 });
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [deleteMember, setDeleteMember] = useState<Member | null>(null);

  const { data, isLoading } = useMemberList({ ...params, search: search || undefined });
  const { createMutation, updateMutation, deleteMutation } = useMemberMutations();

  const handleCreate = (formData: MemberCreate | MemberUpdate) => {
    createMutation.mutate(formData as MemberCreate, {
      onSuccess: () => setShowForm(false),
    });
  };

  const handleUpdate = (formData: MemberCreate | MemberUpdate) => {
    if (!editMember) return;
    updateMutation.mutate(
      { id: editMember.id, data: formData as MemberUpdate },
      { onSuccess: () => setEditMember(null) }
    );
  };

  const handleDelete = () => {
    if (!deleteMember) return;
    deleteMutation.mutate(deleteMember.id, {
      onSuccess: () => setDeleteMember(null),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="名前・メールで検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm w-64"
          />
          <select
            onChange={(e) => setParams((p) => ({ ...p, department: e.target.value || undefined }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">全部署</option>
            <option value="開発部">開発部</option>
            <option value="デザイン部">デザイン部</option>
            <option value="企画部">企画部</option>
          </select>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          + 新規メンバー
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">読み込み中...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">名前</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">部署</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">役割</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">コスト</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase w-40">稼働率</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">ステータス</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.items.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                        style={{ backgroundColor: member.avatar_color }}
                      >
                        {member.name[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">{member.name}</div>
                        <div className="text-xs text-gray-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{member.department}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{member.role}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{member.cost_per_month}万/月</td>
                  <td className="px-6 py-4">
                    <UtilizationBar rate={50} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={String(member.is_active)} statusMap={MEMBER_STATUS_MAP} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setEditMember(member)}
                      className="text-blue-600 hover:text-blue-800 text-sm mr-3"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => setDeleteMember(member)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data && data.total > data.per_page && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.ceil(data.total / data.per_page) }, (_, i) => (
            <button
              key={i}
              onClick={() => setParams((p) => ({ ...p, page: i + 1 }))}
              className={`px-3 py-1 rounded text-sm ${
                params.page === i + 1 ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {showForm && (
        <MemberForm
          initialData={null}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          isSubmitting={createMutation.isPending}
        />
      )}

      {editMember && (
        <MemberForm
          initialData={editMember}
          onSubmit={handleUpdate}
          onCancel={() => setEditMember(null)}
          isSubmitting={updateMutation.isPending}
        />
      )}

      <ConfirmDialog
        open={!!deleteMember}
        title="メンバー削除"
        message={`${deleteMember?.name} を削除しますか？この操作は元に戻せません。`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteMember(null)}
      />
    </div>
  );
}
