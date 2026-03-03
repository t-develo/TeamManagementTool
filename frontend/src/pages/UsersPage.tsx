import { useState } from "react";
import { useUserList, useUserMutations } from "../hooks/useUsers";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import type { User, UserCreate, UserRole, UserUpdate } from "../types/auth";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "管理者",
  manager: "マネージャー",
  member: "メンバー",
};

const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  admin: "bg-red-100 text-red-700",
  manager: "bg-yellow-100 text-yellow-700",
  member: "bg-blue-100 text-blue-700",
};

export function UsersPage() {
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  // 作成フォームのstate
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState<UserRole>("member");

  // 編集フォームのstate
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("member");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editPassword, setEditPassword] = useState("");

  const { data, isLoading } = useUserList({ search: search || undefined, per_page: 50 });
  const { createMutation, updateMutation, deleteMutation } = useUserMutations();

  const openCreate = () => {
    setCreateName("");
    setCreateEmail("");
    setCreatePassword("");
    setCreateRole("member");
    setShowCreateForm(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      { name: createName, email: createEmail, password: createPassword, role: createRole } as UserCreate,
      { onSuccess: () => setShowCreateForm(false) }
    );
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditIsActive(user.is_active);
    setEditPassword("");
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    const data: UserUpdate = { name: editName, role: editRole, is_active: editIsActive };
    if (editPassword) data.password = editPassword;
    updateMutation.mutate({ id: editUser.id, data }, { onSuccess: () => setEditUser(null) });
  };

  const handleDelete = () => {
    if (!deleteUser) return;
    deleteMutation.mutate(deleteUser.id, { onSuccess: () => setDeleteUser(null) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-800">ユーザー管理</h1>
          <input
            type="text"
            placeholder="名前・メールで検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm w-64"
          />
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          + ユーザー追加
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
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">メール</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">ロール</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">ステータス</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.items.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-800">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${ROLE_BADGE_COLORS[user.role]}`}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      user.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {user.is_active ? "有効" : "無効"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openEdit(user)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => setDeleteUser(user)}
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

      {/* ユーザー作成モーダル */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreateForm(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">ユーザー追加</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
                <input type="text" value={createName} onChange={(e) => setCreateName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
                <input type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
                <input type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required minLength={8} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ロール</label>
                <select value={createRole} onChange={(e) => setCreateRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="member">メンバー</option>
                  <option value="manager">マネージャー</option>
                  <option value="admin">管理者</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                  キャンセル
                </button>
                <button type="submit" disabled={createMutation.isPending}
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {createMutation.isPending ? "追加中..." : "追加"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ユーザー編集モーダル */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditUser(null)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">ユーザー編集</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ロール</label>
                  <select value={editRole} onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="member">メンバー</option>
                    <option value="manager">マネージャー</option>
                    <option value="admin">管理者</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
                  <select value={editIsActive ? "true" : "false"} onChange={(e) => setEditIsActive(e.target.value === "true")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="true">有効</option>
                    <option value="false">無効</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  新しいパスワード <span className="text-gray-400">(変更時のみ)</span>
                </label>
                <input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="変更しない場合は空欄" minLength={8} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setEditUser(null)}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                  キャンセル
                </button>
                <button type="submit" disabled={updateMutation.isPending}
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {updateMutation.isPending ? "保存中..." : "保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteUser}
        title="ユーザー削除"
        message={`${deleteUser?.name} を無効化しますか？ログインができなくなります。`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteUser(null)}
      />
    </div>
  );
}
