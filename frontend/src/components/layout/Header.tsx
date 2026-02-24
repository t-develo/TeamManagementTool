import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { useAuth } from "../../hooks/useAuth";

const pageTitles: Record<string, string> = {
  "/dashboard": "ダッシュボード",
  "/members": "メンバー管理",
  "/projects": "プロジェクト管理",
  "/budget": "予算管理",
};

export function Header() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const { logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const title =
    pageTitles[location.pathname] ||
    (location.pathname.startsWith("/projects/") ? "プロジェクト詳細" : "TeamBoard");

  const initials = user?.name
    ? user.name
        .split(/\s+/)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
    : "?";

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium hover:bg-blue-600"
        >
          {initials}
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={() => {
                setDropdownOpen(false);
                logout();
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              ログアウト
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
